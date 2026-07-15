import { query } from '../config/db.js';

export const requirePharmacyAccess = (getPharmacyId) => async (req, res, next) => {
  try {
    if (req.auth.role === 'ADMIN') return next();
    const pharmacyId = await getPharmacyId(req);
    const result = await query('SELECT 1 FROM user_pharmacies WHERE user_id = $1 AND pharmacy_id = $2', [req.auth.sub, pharmacyId]);
    if (!result.rowCount) return res.status(403).json({ message: 'You are not assigned to this pharmacy.' });
    return next();
  } catch (error) { return next(error); }
};
