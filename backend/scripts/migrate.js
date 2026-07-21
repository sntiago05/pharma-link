import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

/**
 * Applies additive SQL migrations from `db/` to an existing database.
 *
 * `01_ddl.sql` is skipped: it is the from-scratch schema that the Docker
 * entrypoint runs once on an empty volume, and it is not idempotent. Everything
 * numbered 02 and above is an additive, idempotent migration and is applied here
 * in filename order, each inside its own transaction and recorded in
 * `schema_migrations` so a second run is a no-op.
 */

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db');
const BASELINE = '01_ddl.sql';

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(200) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows.map((row) => row.filename),
    );

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql') && file !== BASELINE)
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- ${file} (already applied)`);
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`+ ${file} applied`);
        count += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
      }
    }

    console.log(count ? `\n${count} migration(s) applied.` : '\nDatabase is up to date.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
