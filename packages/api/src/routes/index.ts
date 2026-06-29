import type { FastifyInstance } from 'fastify';
import { ok } from '@planix/shared';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Registers every v1 route under the /api/v1 prefix.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(authRoutes);

      // Example protected route proving the auth chain end-to-end. Returns the
      // current session's claims. Feature routes attach here in later phases.
      v1.get('/me', { preHandler: requireAuth }, async (request) => {
        return ok({ user: request.authUser });
      });
    },
    { prefix: '/api/v1' },
  );
}
