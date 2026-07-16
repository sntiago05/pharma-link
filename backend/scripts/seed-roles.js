import { pool, query } from '../src/config/db.js';

const roles = ['ADMIN', 'PATIENT', 'EPS_OPERATOR', 'PHARMACY_OPERATOR'];

try {
  await query(
    'INSERT INTO roles (name) SELECT UNNEST($1::text[]) ON CONFLICT (name) DO NOTHING',
    [roles],
  );
  console.log('Roles seeded successfully.');
} finally {
  await pool.end();
}
