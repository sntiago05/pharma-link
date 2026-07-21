import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ROLES } from '../config/roles.js';
import { query } from '../config/db.js';
import {
  findByEmailWithPassword,
  findRoleIdByName,
  insertUser,
} from '../repositories/user.repository.js';
import { ApiError } from '../utils/api-error.js';

/** Cost factor for bcrypt. Kept at 12 to match existing stored hashes. */
const BCRYPT_ROUNDS = 12;

/** Matches the historical normalisation, so existing logins keep resolving. */
const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * Signs a JWT for a user.
 *
 * Only the role travels in the payload; `sub` carries the user id. Nothing
 * sensitive is included, since a JWT payload is signed but not encrypted and any
 * holder can read it.
 */
const createToken = (user) => {
  if (!env.jwt.secret) throw ApiError.internal('JWT_SECRET is not configured.');

  return jwt.sign(
    { role: user.role },
    env.jwt.secret,
    { subject: String(user.id), expiresIn: env.jwt.expiresIn },
  );
};

/**
 * Registers a patient account.
 * @returns {Promise<object>} The created user, without the password.
 */
export const register = async ({ fullName, email, password, document, phone }) => {
  const roleId = await findRoleIdByName(ROLES.PATIENT);
  if (!roleId) throw ApiError.internal('PATIENT role is not configured in the database.');

  const user = await insertUser({
    roleId,
    fullName: fullName.trim(),
    email: normalizeEmail(email),
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
  });
  const patient = await query('SELECT id FROM patients WHERE document = $1 AND user_id IS NULL', [document]);
  if (patient.rowCount) await query('UPDATE patients SET user_id = $1, phone = COALESCE(phone, $2) WHERE id = $3', [user.id, phone ?? null, patient.rows[0].id]);
  return user;
};

/**
 * Verifies credentials and issues a token.
 *
 * Unknown email, inactive account and wrong password all return the same
 * "Invalid credentials." error on purpose: distinguishing them would let an
 * attacker enumerate which emails have accounts.
 *
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {ApiError} 401 on any credential failure.
 */
export const login = async ({ email, password }) => {
  const user = await findByEmailWithPassword(normalizeEmail(email));

  // The bcrypt comparison runs even when the user is missing or inactive, so the
  // response time does not reveal which emails exist.
  const passwordMatches = await bcrypt.compare(
    password,
    user?.password ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
  );

  if (!user || !user.active || !passwordMatches) {
    throw ApiError.unauthorized('Invalid credentials.');
  }

  return {
    token: createToken(user),
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
  };
};
