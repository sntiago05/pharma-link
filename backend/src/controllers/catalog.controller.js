import { query } from '../config/db.js';
import { createHash } from 'node:crypto';

const handlers = {
  eps: {
    list: 'SELECT id, name, nit, active, created_at FROM eps ORDER BY name',
    create: `INSERT INTO eps (name, nit, api_key_hash) VALUES ($1, $2, $3)
             RETURNING id, name, nit, active, created_at`,
    fields: ['name', 'nit', 'apiKey'],
  },
  pharmacies: {
    list: 'SELECT id, name, nit, address, city, inventory_api_url, active FROM pharmacies ORDER BY name',
    create: `INSERT INTO pharmacies (name, nit, address, city, inventory_api_url, api_key)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, nit, address, city, inventory_api_url, active`,
    fields: ['name', 'nit', 'address', 'city', 'inventoryApiUrl', 'apiKey'],
  },
  medicines: {
    list: 'SELECT id, code, name, presentation, description FROM medicines ORDER BY name',
    create: `INSERT INTO medicines (code, name, presentation, description)
             VALUES ($1, $2, $3, $4) RETURNING id, code, name, presentation, description`,
    fields: ['code', 'name', 'presentation', 'description'],
  },
};

export const listCatalog = (type) => async (_req, res, next) => {
  try { res.json({ data: (await query(handlers[type].list)).rows }); } catch (error) { next(error); }
};

export const createCatalog = (type) => async (req, res, next) => {
  try {
    const values = handlers[type].fields.map((field) => req.body[field]);
    if (values.some((value) => value === undefined || value === null || value === '')) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (type === 'eps') values[2] = createHash('sha256').update(values[2]).digest('hex');
    const result = await query(handlers[type].create, values);
    return res.status(201).json({ data: result.rows[0] });
  } catch (error) { return next(error); }
};

export const linkEpsPharmacy = async (req, res, next) => {
  try {
    const { epsId, pharmacyId } = req.body;
    const result = await query(
      `INSERT INTO eps_pharmacies (eps_id, pharmacy_id) VALUES ($1, $2)
       ON CONFLICT (eps_id, pharmacy_id) DO UPDATE SET active = TRUE
       RETURNING id, eps_id, pharmacy_id, active`, [epsId, pharmacyId],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { next(error); }
};

export const setWorkingHours = async (req, res, next) => {
  try {
    const { pharmacyId, openingTime, closingTime, slotDuration, capacityPerSlot } = req.body;
    if (![pharmacyId, openingTime, closingTime, slotDuration, capacityPerSlot].every(Boolean)) {
      return res.status(400).json({ message: 'All working-hours fields are required.' });
    }
    const result = await query(
      `INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pharmacy_id) DO UPDATE SET opening_time = EXCLUDED.opening_time,
         closing_time = EXCLUDED.closing_time, slot_duration = EXCLUDED.slot_duration,
         capacity_per_slot = EXCLUDED.capacity_per_slot RETURNING *`,
      [pharmacyId, openingTime, closingTime, slotDuration, capacityPerSlot],
    );
    return res.json({ data: result.rows[0] });
  } catch (error) { return next(error); }
};

const editable = {
  eps: { table: 'eps', columns: { name: 'name', nit: 'nit', apiKeyHash: 'api_key_hash', active: 'active' } },
  pharmacies: { table: 'pharmacies', columns: { name: 'name', nit: 'nit', address: 'address', city: 'city', inventoryApiUrl: 'inventory_api_url', apiKey: 'api_key', active: 'active' } },
  medicines: { table: 'medicines', columns: { code: 'code', name: 'name', presentation: 'presentation', description: 'description' } },
};

export const getCatalogItem = (type) => async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM ${editable[type].table} WHERE id = $1`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    return res.json({ data: result.rows[0] });
  } catch (error) { return next(error); }
};

export const updateCatalog = (type) => async (req, res, next) => {
  try {
    const fields = Object.entries(editable[type].columns).filter(([key]) => req.body[key] !== undefined);
    if (!fields.length) return res.status(400).json({ message: 'No editable fields supplied.' });
    const assignments = fields.map(([key, column], index) => `${column} = $${index + 1}`).join(', ');
    const result = await query(`UPDATE ${editable[type].table} SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`, [...fields.map(([key]) => req.body[key]), req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    return res.json({ data: result.rows[0] });
  } catch (error) { return next(error); }
};

export const deleteCatalog = (type) => async (req, res, next) => {
  try {
    const result = await query(`DELETE FROM ${editable[type].table} WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Record not found.' });
    return res.status(204).end();
  } catch (error) { return next(error); }
};
