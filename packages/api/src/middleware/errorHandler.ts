import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, fail } from '@planix/shared';

/**
 * Single error handler for the API. Errors are never swallowed silently
 * (CLAUDE.md): they are logged and returned in the standard envelope shape.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error({ err: error }, 'request failed');

  // Fastify schema validation errors arrive with a `validation` array.
  if (error.validation) {
    const details: Record<string, string> = {};
    for (const v of error.validation) {
      const field = v.instancePath.replace(/^\//, '') || v.params?.missingProperty || 'body';
      details[String(field)] = v.message ?? 'invalid';
    }
    void reply
      .code(400)
      .send(fail(ErrorCode.VALIDATION_ERROR, 'Request validation failed', details));
    return;
  }

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    void reply
      .code(statusCode)
      .send(fail(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred'));
    return;
  }

  void reply
    .code(statusCode)
    .send(fail(error.code ?? ErrorCode.VALIDATION_ERROR, error.message));
}
