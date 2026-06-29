/**
 * SQL migration runner.
 *
 * Reads numbered .sql files from database/migrations/, each split into a
 * `-- migrate` and a `-- rollback` section. Applied migrations are tracked in a
 * schema_migrations table. Designed to run in CI (Azure DevOps / Coolify) and
 * locally via `npm run migrate`.
 *
 * Usage:
 *   tsx src/migrate.ts up        apply all pending migrations
 *   tsx src/migrate.ts down      roll back the most recently applied migration
 *   tsx src/migrate.ts status    print applied / pending state
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from './config/env.js';

const { Pool } = pg;

const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ??
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../database/migrations');

interface ParsedMigration {
  name: string;
  up: string;
  down: string;
}

function splitSections(name: string, sql: string): ParsedMigration {
  // Section markers are line comments: `-- migrate` and `-- rollback`.
  const migrateMatch = sql.match(/--\s*migrate\b/i);
  const rollbackMatch = sql.match(/--\s*rollback\b/i);
  if (!migrateMatch) {
    throw new Error(`Migration ${name} is missing a "-- migrate" section`);
  }
  const migrateStart = (migrateMatch.index ?? 0) + migrateMatch[0].length;
  if (rollbackMatch && rollbackMatch.index !== undefined) {
    return {
      name,
      up: sql.slice(migrateStart, rollbackMatch.index).trim(),
      down: sql.slice(rollbackMatch.index + rollbackMatch[0].length).trim(),
    };
  }
  return { name, up: sql.slice(migrateStart).trim(), down: '' };
}

async function loadMigrations(): Promise<ParsedMigration[]> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const migrations: ParsedMigration[] = [];
  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    migrations.push(splitSections(file, sql));
  }
  return migrations;
}

function createPool(): pg.Pool {
  return env.database.connectionString
    ? new Pool({ connectionString: env.database.connectionString })
    : new Pool({
        host: env.database.host,
        port: env.database.port,
        user: env.database.user,
        password: env.database.password,
        database: env.database.database,
      });
}

async function ensureTracking(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function appliedSet(pool: pg.Pool): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(result.rows.map((r) => r.name));
}

async function up(pool: pg.Pool): Promise<void> {
  const migrations = await loadMigrations();
  const applied = await appliedSet(pool);
  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const m of pending) {
    console.log(`Applying ${m.name} ...`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(m.up);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [m.name]);
      await client.query('COMMIT');
      console.log(`  ✓ ${m.name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ ${m.name} failed — rolled back transaction`);
      throw err;
    } finally {
      client.release();
    }
  }
  console.log(`Applied ${pending.length} migration(s).`);
}

async function down(pool: pg.Pool): Promise<void> {
  const last = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY name DESC LIMIT 1',
  );
  if (last.rows.length === 0) {
    console.log('Nothing to roll back.');
    return;
  }
  const name = last.rows[0].name;
  const migrations = await loadMigrations();
  const target = migrations.find((m) => m.name === name);
  if (!target) {
    throw new Error(`Applied migration ${name} not found on disk; cannot roll back`);
  }
  if (!target.down) {
    throw new Error(`Migration ${name} has no "-- rollback" section`);
  }

  console.log(`Rolling back ${name} ...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(target.down);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
    await client.query('COMMIT');
    console.log(`  ✓ rolled back ${name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ✗ rollback of ${name} failed`);
    throw err;
  } finally {
    client.release();
  }
}

async function status(pool: pg.Pool): Promise<void> {
  const migrations = await loadMigrations();
  const applied = await appliedSet(pool);
  console.log('Migration status:');
  for (const m of migrations) {
    console.log(`  [${applied.has(m.name) ? 'x' : ' '}] ${m.name}`);
  }
}

async function run(): Promise<void> {
  const command = process.argv[2] ?? 'up';
  const pool = createPool();
  try {
    await ensureTracking(pool);
    switch (command) {
      case 'up':
        await up(pool);
        break;
      case 'down':
        await down(pool);
        break;
      case 'status':
        await status(pool);
        break;
      default:
        console.error(`Unknown command: ${command}. Use up | down | status.`);
        process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
