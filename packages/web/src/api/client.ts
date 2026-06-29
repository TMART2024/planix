import type { ApiResponse, ErrorResponse, SuccessResponse } from '@planix/shared';

/**
 * Thin typed fetch wrapper that understands the Planix response envelope
 * (docs/ARCHITECTURE.md). Returns the unwrapped `data` on success and throws an
 * ApiClientError carrying the envelope's error on failure.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiClientError extends Error {
  code: string;
  details?: Record<string, string>;
  status: number;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isError<T>(body: ApiResponse<T>): body is ErrorResponse {
  return (body as ErrorResponse).error !== undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || isError(body)) {
    const err = isError(body)
      ? body.error
      : { code: 'UNKNOWN', message: 'Request failed' };
    throw new ApiClientError(response.status, err.code, err.message, err.details);
  }
  return (body as SuccessResponse<T>).data;
}

const ACCESS_TOKEN_KEY = 'planix-access-token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, payload?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }),
};
