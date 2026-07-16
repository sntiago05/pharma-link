import { pool } from '../config/db.js';

/**
 * Runs `work` inside a database transaction.
 *
 * Commits on resolve, rolls back on throw, and always releases the client. This
 * replaces the `connect / BEGIN / try / COMMIT / catch ROLLBACK / finally
 * release` block that every write controller repeated, where a missing
 * `client.release()` leaks a pool connection until the pool is exhausted.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} work
 * @returns {Promise<T>}
 */
export const withTransaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    // Swallow rollback failures: the original error is the useful one, and a
    // broken connection would otherwise mask it.
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};
