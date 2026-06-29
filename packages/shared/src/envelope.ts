/**
 * The single API response envelope used by every Planix endpoint.
 * See docs/ARCHITECTURE.md "Response Envelope".
 */

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface SuccessResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ApiError {
  /** Machine-readable code, e.g. 'TASK_NOT_FOUND', 'VALIDATION_ERROR'. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Field-level validation errors, keyed by field name. */
  details?: Record<string, string>;
}

export interface ErrorResponse {
  error: ApiError;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function ok<T>(data: T, meta?: ResponseMeta): SuccessResponse<T> {
  return meta ? { data, meta } : { data };
}

export function fail(
  code: string,
  message: string,
  details?: Record<string, string>,
): ErrorResponse {
  return { error: details ? { code, message, details } : { code, message } };
}

/** Canonical machine-readable error codes shared across the API surface. */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
