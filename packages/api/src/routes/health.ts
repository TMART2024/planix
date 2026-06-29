import type { FastifyInstance } from 'fastify';
import { ok } from '@planix/shared';
import { pingDatabase } from '../config/database.js';

/**
 * GET /api/v1/health — liveness + dependency status.
 * Returns 200 when the process is up; the body reports per-dependency status so
 * a degraded database is visible without failing the liveness probe itself.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    let database: 'ok' | 'down' = 'down';
    try {
      database = (await pingDatabase()) ? 'ok' : 'down';
    } catch {
      database = 'down';
    }

    return ok({
      status: 'ok',
      service: 'planix-api',
      version: '0.0.0',
      // Stamped at request time in UTC, consistent with the TIMESTAMPTZ rule.
      time: new Date().toISOString(),
      dependencies: { database },
    });
  });
}
