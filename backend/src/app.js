import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const users = [
  {
    id: 1,
    fullName: 'Administrador',
    email: 'admin@pharmalink.com',
    passwordHash: bcrypt.hashSync('123456', 12),
    role: 'ADMIN',
    active: true,
  },
  {
    id: 2,
    fullName: 'Usuario de prueba',
    email: 'usuario@pharmalink.com',
    passwordHash: bcrypt.hashSync('123456', 12),
    role: 'USUARIO',
    active: true,
  },
];

function createToken(user) {
  if (!env.jwt.secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Backend is running.' });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = users.find((item) => normalizeEmail(item.email) === normalizedEmail);

    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      },
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const alreadyExists = users.some((item) => normalizeEmail(item.email) === normalizedEmail);

    if (alreadyExists) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const newUser = {
      id: users.length + 1,
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'USUARIO',
      active: true,
    };

    users.push(newUser);

    const token = createToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created.',
      data: {
        token,
        user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role },
      },
      token,
      user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role },
    });
  });

  return app;
}

export function startServer(port = env.port) {
  const app = createApp();
  return app.listen(port, () => {
    logger.info(`PharmaLink API listening on port ${port}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('src/app.js')) {
  startServer();
}
