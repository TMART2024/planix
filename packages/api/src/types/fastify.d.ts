import type { AuthClaims } from '@planix/shared';

declare module 'fastify' {
  interface FastifyRequest {
    /** Populated by the requireAuth preHandler once a valid Planix JWT is verified. */
    authUser?: AuthClaims;
  }
}

export {};
