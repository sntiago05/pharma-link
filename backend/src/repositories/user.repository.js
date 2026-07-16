import { query } from '../config/db.js';

/** Role id by name, or undefined. */
export const findRoleIdByName = async (name) => {
  const result = await query('SELECT id FROM roles WHERE name = $1', [name]);
  return result.rows[0]?.id;
};

/** Creates a user and returns it without the password hash. */
export const insertUser = async ({ roleId, fullName, email, passwordHash }) => {
  const result = await query(
    `INSERT INTO users (role_id, full_name, email, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, active`,
    [roleId, fullName, email, passwordHash],
  );
  return result.rows[0];
};

/** Finds a user by email, including the password hash for verification. */
export const findByEmailWithPassword = async (email) => {
  const result = await query(
    `SELECT users.id, users.full_name, users.email, users.password, users.active,
            roles.name AS role
     FROM users
     INNER JOIN roles ON roles.id = users.role_id
     WHERE users.email = $1`,
    [email],
  );
  return result.rows[0];
};
