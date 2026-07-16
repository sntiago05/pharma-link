import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const requiredVariables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

if (missingVariables.length > 0) {
  throw new Error(`Missing database environment variables: ${missingVariables.join(', ')}`);
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const query = (text, params) => pool.query(text, params);
