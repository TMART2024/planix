import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ErrorCode, fail } from '@planix/shared';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

/**
 * Builds the Fastify application. Kept separate from main.ts so tests can spin
 * up the app without binding a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.isProduction ? 'info' : 'debug',
      transport: env.isProduction
        ? undefined
        : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
    },
  });

  await app.register(cors, {
    origin: true, // tightened to the known web origin via Coolify env in production
    credentials: true,
  });

  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((_request, reply) => {
    void reply.code(404).send(fail(ErrorCode.NOT_FOUND, 'Route not found'));
  });

  await registerRoutes(app);

  return app;
}
