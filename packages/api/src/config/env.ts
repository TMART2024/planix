import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Load .env by walking up from the current working directory until one is found.
 * In this monorepo, commands run from a package dir (e.g. packages/api) while the
 * .env lives at the repo root, so a plain `dotenv/config` (cwd-only) misses it.
 * In production there is no .env file — Coolify injects real env vars directly,
 * and this loader simply finds nothing, which is fine.
 */
function loadEnvFromNearest(): void {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      loadDotenv({ path: candidate });
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  loadDotenv(); // no-op if absent; prod relies on injected env vars
}
loadEnvFromNearest();

/**
 * Centralized, validated environment access. The app fails fast at boot if a
 * required variable is missing rather than throwing deep in a request handler.
 * Real values are supplied by Coolify's secret store in production.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: ${raw}`);
  }
  return parsed;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: optional('NODE_ENV', 'development') === 'production',
  apiPort: intEnv('API_PORT', 3000),

  database: {
    // pg accepts a connection string or discrete PG* vars; we prefer the URL.
    connectionString: process.env.DATABASE_URL ?? undefined,
    host: optional('PGHOST', 'localhost'),
    port: intEnv('PGPORT', 5432),
    user: optional('PGUSER', 'planix'),
    password: optional('PGPASSWORD', 'planix'),
    database: optional('PGDATABASE', 'planix'),
  },

  azureAd: {
    tenantId: optional('AZURE_AD_TENANT_ID', ''),
    clientId: optional('AZURE_AD_CLIENT_ID', ''),
    apiAudience: optional('AZURE_AD_API_AUDIENCE', 'api://planix'),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
    accessTtlSeconds: intEnv('JWT_ACCESS_TTL', 900),
    refreshTtlSeconds: intEnv('JWT_REFRESH_TTL', 2592000),
  },

  bcryptRounds: intEnv('BCRYPT_ROUNDS', 12),

  storage: {
    endpoint: optional('GARAGE_ENDPOINT', 'http://localhost:3900'),
    accessKey: optional('GARAGE_ACCESS_KEY', ''),
    secretKey: optional('GARAGE_SECRET_KEY', ''),
    region: optional('GARAGE_REGION', 'garage'),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: intEnv('SMTP_PORT', 587),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
  },

  anthropic: {
    apiKey: optional('ANTHROPIC_API_KEY', ''),
    model: optional('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
  },
} as const;

export { required };
