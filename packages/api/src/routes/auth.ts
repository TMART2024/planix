import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthClaims } from '@planix/shared';
import { ErrorCode, fail, ok } from '@planix/shared';
import { db } from '../config/database.js';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAzureAdToken,
  verifyPassword,
  verifyPlanixToken,
} from '../services/auth.service.js';

interface PortalLoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

const portalLoginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 1 },
    },
  },
} as const;

const refreshSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: { refreshToken: { type: 'string', minLength: 1 } },
  },
} as const;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/auth/login  (internal users)
   * Expects a valid Azure AD access token as Bearer. Validates it, upserts the
   * user record, then returns a Planix-issued access + refresh token pair.
   */
  app.post('/auth/login', async (request, reply) => {
    const header = request.headers.authorization;
    const azureToken = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!azureToken) {
      return reply
        .code(401)
        .send(fail(ErrorCode.UNAUTHENTICATED, 'Azure AD bearer token required'));
    }

    let identity;
    try {
      identity = await verifyAzureAdToken(azureToken);
    } catch (err) {
      request.log.warn({ err }, 'azure ad token validation failed');
      return reply
        .code(401)
        .send(fail(ErrorCode.UNAUTHENTICATED, 'Azure AD token validation failed'));
    }

    // Match the user by Azure AD object id within CHR Solutions. In Phase 0 we
    // bind to the single seeded organization; multi-org onboarding comes later.
    const org = await db
      .selectFrom('organization')
      .select(['id'])
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'asc')
      .limit(1)
      .executeTakeFirst();

    if (!org) {
      return reply.code(500).send(fail(ErrorCode.INTERNAL_ERROR, 'No organization configured'));
    }

    let user = await db
      .selectFrom('app_user')
      .selectAll()
      .where('azure_ad_oid', '=', identity.oid)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!user) {
      user = await db
        .insertInto('app_user')
        .values({
          organization_id: org.id,
          user_type: 'internal',
          email: identity.email,
          display_name: identity.name,
          azure_ad_oid: identity.oid,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      await db
        .updateTable('app_user')
        .set({ display_name: identity.name, last_login_at: new Date() })
        .where('id', '=', user.id)
        .execute();
    }

    const claims: AuthClaims = {
      sub: user.id,
      org: user.organization_id,
      userType: 'internal',
      email: user.email,
    };
    const [accessToken, refreshToken] = await Promise.all([
      issueAccessToken(claims),
      issueRefreshToken(claims),
    ]);

    return reply.send(
      ok({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, displayName: user.display_name, userType: 'internal' },
      }),
    );
  });

  /**
   * POST /api/v1/auth/portal/login  (customer portal users)
   * Email/password. Returns a JWT scoped to the customer's data.
   */
  app.post(
    '/auth/portal/login',
    { schema: portalLoginSchema },
    async (request: FastifyRequest<{ Body: PortalLoginBody }>, reply) => {
      const { email, password } = request.body;

      const user = await db
        .selectFrom('app_user')
        .selectAll()
        .where('user_type', '=', 'portal')
        .where('email', '=', email.toLowerCase())
        .where('deleted_at', 'is', null)
        .where('is_active', '=', true)
        .executeTakeFirst();

      // Constant-ish response regardless of which check fails, to avoid leaking
      // whether an account exists.
      if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
        return reply.code(401).send(fail(ErrorCode.UNAUTHENTICATED, 'Invalid email or password'));
      }

      await db
        .updateTable('app_user')
        .set({ last_login_at: new Date() })
        .where('id', '=', user.id)
        .execute();

      const claims: AuthClaims = {
        sub: user.id,
        org: user.organization_id,
        userType: 'portal',
        email: user.email,
        // Portal sessions are scoped to one customer. The customer linkage table
        // arrives with the customer model in a later phase; for now the user id
        // is the scope anchor.
        customerId: user.id,
      };
      const [accessToken, refreshToken] = await Promise.all([
        issueAccessToken(claims),
        issueRefreshToken(claims),
      ]);

      return reply.send(
        ok({
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, displayName: user.display_name, userType: 'portal' },
        }),
      );
    },
  );

  /**
   * POST /api/v1/auth/refresh — exchange a valid refresh token for a new pair.
   */
  app.post(
    '/auth/refresh',
    { schema: refreshSchema },
    async (request: FastifyRequest<{ Body: RefreshBody }>, reply) => {
      let claims: AuthClaims;
      try {
        claims = await verifyPlanixToken(request.body.refreshToken);
      } catch {
        return reply.code(401).send(fail(ErrorCode.UNAUTHENTICATED, 'Invalid refresh token'));
      }
      const [accessToken, refreshToken] = await Promise.all([
        issueAccessToken(claims),
        issueRefreshToken(claims),
      ]);
      return reply.send(ok({ accessToken, refreshToken }));
    },
  );
}
