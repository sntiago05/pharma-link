import { query } from '../config/db.js';

export const createPatientProfile = async (req, res, next) => {
  try {
    const { epsId, document, phone } = req.body;
    if (!epsId || !document) return res.status(400).json({ message: 'epsId and document are required.' });
    const result = await query(
      `INSERT INTO patients (user_id, eps_id, document, phone) VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, eps_id, document, phone`, [req.auth.sub, epsId, document, phone || null],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { next(error); }
};

export const getMyPatientProfile = async (req, res, next) => {
  try {
    const result = await query('SELECT id, user_id, eps_id, document, phone FROM patients WHERE user_id = $1', [req.auth.sub]);
    if (!result.rowCount) return res.status(404).json({ message: 'Patient profile not found.' });
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
};
