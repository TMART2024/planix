import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from './env.js';
import type { Database } from '../db/types.js';

const { Pool } = pg;

/**
 * Single shared connection pool + Kysely instance for the API process.
 * All datetime columns are TIMESTAMPTZ; node-postgres parses them to JS Date
 * objects in UTC. The display layer (web) converts to the user's time zone.
 */
const pool = new Pool(
  env.database.connectionString
    ? { connectionString: env.database.connectionString }
    : {
        host: env.database.host,
        port: env.database.port,
        user: env.database.user,
        password: env.database.password,
        database: env.database.database,
      },
);

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export async function pingDatabase(): Promise<boolean> {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}
