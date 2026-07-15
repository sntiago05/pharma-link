import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const normalizeEmail = (email) => email.trim().toLowerCase();

const validateCredentials = ({ email, password }) => {
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return 'A valid email is required.';
  }

  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must contain at least 8 characters.';
  }

  return null;
};

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured.');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: JWT_EXPIRES_IN },
  );
};

export const registerController = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const validationError = validateCredentials({ email, password });

    if (typeof fullName !== 'string' || fullName.trim().length < 3) {
      return res.status(400).json({ message: 'Full name must contain at least 3 characters.' });
    }

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const roleResult = await query('SELECT id FROM roles WHERE name = $1', ['PATIENT']);
    if (roleResult.rowCount === 0) {
      const error = new Error('PATIENT role is not configured in the database.');
      error.statusCode = 500;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (role_id, full_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, active`,
      [roleResult.rows[0].id, fullName.trim(), normalizeEmail(email), passwordHash],
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const validationError = validateCredentials({ email, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await query(
      `SELECT users.id, users.full_name, users.email, users.password, users.active, roles.name AS role
       FROM users
       INNER JOIN roles ON roles.id = users.role_id
       WHERE users.email = $1`,
      [normalizeEmail(email)],
    );
    const user = result.rows[0];

    if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};
