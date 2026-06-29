import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, fail } from '@planix/shared';
import { verifyPlanixToken } from '../services/auth.service.js';

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/**
 * preHandler that requires a valid Planix-issued JWT. On success it attaches the
 * decoded claims to `request.authUser`. Use on every protected route.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractBearer(request);
  if (!token) {
    await reply.code(401).send(fail(ErrorCode.UNAUTHENTICATED, 'Authentication required'));
    return;
  }
  try {
    request.authUser = await verifyPlanixToken(token);
  } catch {
    await reply.code(401).send(fail(ErrorCode.UNAUTHENTICATED, 'Invalid or expired token'));
  }
}

/**
 * preHandler that requires the authenticated user to be a customer-portal user.
 * Portal sessions are scoped to a single customer via the customerId claim.
 */
export async function requirePortalUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.authUser?.userType !== 'portal') {
    await reply.code(403).send(fail(ErrorCode.UNAUTHORIZED, 'Portal access only'));
  }
}

/**
 * preHandler that requires the authenticated user to be an internal CHR user.
 */
export async function requireInternalUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.authUser?.userType !== 'internal') {
    await reply.code(403).send(fail(ErrorCode.UNAUTHORIZED, 'Internal access only'));
  }
}
