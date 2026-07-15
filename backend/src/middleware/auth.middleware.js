import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication token required.' });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.auth.role)) return res.status(403).json({ message: 'Insufficient permissions.' });
  return next();
};
