import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import type { AuthClaims } from '@planix/shared';
import { env } from '../config/env.js';

const planixSecret = new TextEncoder().encode(env.jwt.secret);
const PLANIX_ISSUER = 'planix';

/**
 * Azure AD JWKS for validating internal-user access tokens. Built lazily so the
 * API can boot without Azure config in local/dev environments; the first
 * internal login will fail loudly if AZURE_AD_TENANT_ID is unset.
 */
let azureJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getAzureJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!env.azureAd.tenantId) {
    throw new Error('AZURE_AD_TENANT_ID is not configured');
  }
  if (!azureJwks) {
    azureJwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${env.azureAd.tenantId}/discovery/v2.0/keys`),
    );
  }
  return azureJwks;
}

export interface AzureAdIdentity {
  oid: string;
  email: string;
  name: string;
}

/**
 * Validate an Azure AD access token (signature, issuer, audience, expiry) and
 * extract the identity fields Planix needs to create/update the user record.
 */
export async function verifyAzureAdToken(token: string): Promise<AzureAdIdentity> {
  const expectedIssuer = `https://login.microsoftonline.com/${env.azureAd.tenantId}/v2.0`;
  const { payload } = await jwtVerify(token, getAzureJwks(), {
    issuer: expectedIssuer,
    audience: env.azureAd.apiAudience,
  });

  const oid = typeof payload.oid === 'string' ? payload.oid : undefined;
  const email =
    (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
    (typeof payload.email === 'string' && payload.email) ||
    undefined;
  const name = typeof payload.name === 'string' ? payload.name : email;

  if (!oid || !email || !name) {
    throw new Error('Azure AD token missing required claims (oid/email/name)');
  }
  return { oid, email, name };
}

/** Issue a short-lived Planix access JWT for an authenticated session. */
export async function issueAccessToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ ...claims } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(PLANIX_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.accessTtlSeconds}s`)
    .sign(planixSecret);
}

/** Issue a long-lived refresh token (same payload, longer expiry). */
export async function issueRefreshToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ ...claims, kind: 'refresh' } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(PLANIX_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.refreshTtlSeconds}s`)
    .sign(planixSecret);
}

/** Verify a Planix-issued JWT and return the embedded claims. */
export async function verifyPlanixToken(token: string): Promise<AuthClaims> {
  const { payload } = await jwtVerify(token, planixSecret, { issuer: PLANIX_ISSUER });
  return {
    sub: String(payload.sub),
    org: String(payload.org),
    userType: payload.userType as AuthClaims['userType'],
    email: String(payload.email),
    customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
