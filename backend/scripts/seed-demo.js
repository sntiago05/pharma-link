import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

/**
 * Applies scripts/seed-demo.sql: demo users and data for manual testing.
 *
 * Kept separate from `db:migrate` on purpose — migrations describe the schema
 * every environment must have, while these are throwaway accounts with a known
 * password that must never reach a real database.
 */

const file = join(dirname(fileURLToPath(import.meta.url)), 'seed-demo.sql');

const run = async () => {
  const sql = await readFile(file, 'utf8');
  const client = await pool.connect();

  try {
    // The file manages its own BEGIN/COMMIT; the last statement is the summary.
    const results = await client.query(sql);
    const summary = [results].flat().find((result) => result?.command === 'SELECT' && result.rows?.length);

    console.log('\nDatos de prueba cargados. Usuarios disponibles:\n');
    console.table(summary?.rows ?? []);
    console.log('Frontend: http://localhost:5173/login\n');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('No se pudo cargar los datos de prueba:', error.message);
  process.exitCode = 1;
});
