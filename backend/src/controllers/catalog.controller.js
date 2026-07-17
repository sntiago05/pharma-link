import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { withTransaction } from '../utils/transaction.js';
import { insertNotification } from '../repositories/notification.repository.js';

/**
 * Generic CRUD for the three catalogs (EPS, pharmacies, medicines).
 *
 * One parameterised handler set serves all three: the per-type SQL and field
 * lists live in the tables below. Table and column names are interpolated into
 * the SQL, which is safe only because they come from these frozen literals and
 * never from the request — the `type` argument is chosen by the route file.
 */

const handlers = {
  eps: {
    list: 'SELECT id, name, nit, active, created_at FROM eps ORDER BY name',
    create: `INSERT INTO eps (name, nit, api_key_hash) VALUES ($1, $2, $3)
             RETURNING id, name, nit, active, created_at`,
    fields: ['name', 'nit', 'apiKey'],
  },
  pharmacies: {
    list: `SELECT pharmacies.id, pharmacies.name, pharmacies.nit, pharmacies.address, pharmacies.city,
                  pharmacies.inventory_api_url, pharmacies.active, pharmacies.parent_pharmacy_id,
                  parent.name AS parent_pharmacy_name,
                  COUNT(branches.id)::int AS branch_count
           FROM pharmacies
           LEFT JOIN pharmacies parent ON parent.id = pharmacies.parent_pharmacy_id
           LEFT JOIN pharmacies branches ON branches.parent_pharmacy_id = pharmacies.id
           GROUP BY pharmacies.id, parent.name
           ORDER BY pharmacies.name`,
    create: `INSERT INTO pharmacies (name, nit, address, city, inventory_api_url, api_key, parent_pharmacy_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, nit, address, city, inventory_api_url, active, parent_pharmacy_id`,
    fields: ['name', 'nit', 'address', 'city', 'inventoryApiUrl', 'apiKey', 'parentPharmacyId'],
  },
  medicines: {
    list: 'SELECT id, code, name, presentation, description FROM medicines ORDER BY name',
    create: `INSERT INTO medicines (code, name, presentation, description)
             VALUES ($1, $2, $3, $4) RETURNING id, code, name, presentation, description`,
    fields: ['code', 'name', 'presentation', 'description'],
  },
};

const editable = {
  eps: {
    table: 'eps',
    columns: { name: 'name', nit: 'nit', apiKeyHash: 'api_key_hash', active: 'active' },
    // api_key_hash is a credential: it must never be returned by the API.
    select: 'id, name, nit, active, created_at',
  },
  pharmacies: {
    table: 'pharmacies',
    columns: {
      name: 'name', nit: 'nit', address: 'address', city: 'city',
      inventoryApiUrl: 'inventory_api_url', apiKey: 'api_key',
      parentPharmacyId: 'parent_pharmacy_id', active: 'active',
    },
    select: 'id, name, nit, address, city, inventory_api_url, parent_pharmacy_id, active',
  },
  medicines: {
    table: 'medicines',
    columns: { code: 'code', name: 'name', presentation: 'presentation', description: 'description' },
    select: 'id, code, name, presentation, description',
  },
};

const LABELS = { eps: 'EPS', pharmacies: 'Pharmacy', medicines: 'Medicine' };

const verifyAdminPassword = async ({ userId, password }) => {
  if (!password) {
    throw ApiError.badRequest('Admin password is required to delete this record.');
  }

  const admin = await query('SELECT password FROM users WHERE id = $1 AND active = TRUE', [userId]);
  const matches = await bcrypt.compare(password, admin.rows[0]?.password || '');
  if (!matches) throw ApiError.unauthorized('Invalid admin password.');
};

export const listCatalog = (type) =>
  asyncHandler(async (_req, res) =>
    sendSuccess(res, {
      message: `${LABELS[type]} list retrieved.`,
      data: (await query(handlers[type].list)).rows,
    }),
  );

export const createCatalog = (type) =>
  asyncHandler(async (req, res) => {
    const values = handlers[type].fields.map((field) => req.body[field] ?? null);

    // The API key is only ever stored as a SHA-256 digest, so the plaintext the
    // admin supplies is hashed here and never persisted.
    if (type === 'eps') values[2] = createHash('sha256').update(values[2]).digest('hex');

    const item = await withTransaction(async (client) => {
      const result = await client.query(handlers[type].create, values);

      if (type === 'pharmacies') {
        for (const epsId of req.body.epsIds || []) {
          await client.query(
            `INSERT INTO eps_pharmacies (eps_id, pharmacy_id) VALUES ($1, $2)
             ON CONFLICT (eps_id, pharmacy_id) DO UPDATE SET active = TRUE`,
            [epsId, result.rows[0].id],
          );
        }
        if (req.body.parentPharmacyId && req.body.openingTime && req.body.closingTime) {
          await client.query(
            `INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
             VALUES ($1, $2, $3, $4, $5)`,
            [result.rows[0].id, req.body.openingTime, req.body.closingTime, req.body.slotDuration, req.body.capacityPerSlot],
          );
        }
      }

      return result.rows[0];
    });

    res.locals.auditRecordId = item.id;
    return sendSuccess(res, {
      status: 201,
      message: `${LABELS[type]} created.`,
      data: item,
    });
  });

export const linkEpsPharmacy = asyncHandler(async (req, res) => {
  const { epsId, pharmacyId } = req.body;

  const result = await query(
    `INSERT INTO eps_pharmacies (eps_id, pharmacy_id) VALUES ($1, $2)
     ON CONFLICT (eps_id, pharmacy_id) DO UPDATE SET active = TRUE
     RETURNING id, eps_id, pharmacy_id, active`,
    [epsId, pharmacyId],
  );

  res.locals.auditRecordId = result.rows[0].id;
  return sendSuccess(res, {
    status: 201,
    message: 'EPS and pharmacy linked.',
    data: result.rows[0],
  });
});

export const setWorkingHours = asyncHandler(async (req, res) => {
  const { pharmacyId, openingTime, closingTime, slotDuration, capacityPerSlot } = req.body;

  const result = await query(
    `INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (pharmacy_id) DO UPDATE SET
       opening_time = EXCLUDED.opening_time,
       closing_time = EXCLUDED.closing_time,
       slot_duration = EXCLUDED.slot_duration,
       capacity_per_slot = EXCLUDED.capacity_per_slot
     RETURNING *`,
    [pharmacyId, openingTime, closingTime, slotDuration, capacityPerSlot],
  );

  res.locals.auditRecordId = pharmacyId;
  return sendSuccess(res, { message: 'Working hours saved.', data: result.rows[0] });
});

export const getCatalogItem = (type) =>
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT ${editable[type].select} FROM ${editable[type].table} WHERE id = $1`,
      [req.params.id],
    );
    if (!result.rowCount) throw ApiError.notFound(`${LABELS[type]} not found.`);

    return sendSuccess(res, { message: `${LABELS[type]} retrieved.`, data: result.rows[0] });
  });

export const updateCatalog = (type) =>
  asyncHandler(async (req, res) => {
    const fields = Object.entries(editable[type].columns)
      .filter(([key]) => req.body[key] !== undefined);
    if (!fields.length) throw ApiError.badRequest('No editable fields supplied.');

    const assignments = fields.map(([, column], index) => `${column} = $${index + 1}`).join(', ');
    const result = await query(
      `UPDATE ${editable[type].table} SET ${assignments}
       WHERE id = $${fields.length + 1}
       RETURNING ${editable[type].select}`,
      [...fields.map(([key]) => req.body[key]), req.params.id],
    );
    if (!result.rowCount) throw ApiError.notFound(`${LABELS[type]} not found.`);

    res.locals.auditRecordId = req.params.id;
    return sendSuccess(res, { message: `${LABELS[type]} updated.`, data: result.rows[0] });
  });

export const deleteCatalog = (type) =>
  asyncHandler(async (req, res) => {
    if (['eps', 'pharmacies', 'medicines'].includes(type)) {
      await verifyAdminPassword({ userId: req.auth.sub, password: req.body?.adminPassword });
    }

    const result = await query(
      `DELETE FROM ${editable[type].table} WHERE id = $1 RETURNING id`,
      [req.params.id],
    );
    if (!result.rowCount) throw ApiError.notFound(`${LABELS[type]} not found.`);

    res.locals.auditRecordId = req.params.id;
    // 204 with no body, as before: a response envelope here would break clients
    // that (correctly) do not parse a body for this status.
    return res.status(204).end();
  });

/** ADMIN-only user directory. Accounts are created through registration, not this catalog. */
export const listUsers = asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT users.id, users.full_name, users.email, patients.document, patients.phone, users.active, roles.name AS role
     FROM users
     INNER JOIN roles ON roles.id = users.role_id
     LEFT JOIN patients ON patients.user_id = users.id
     ORDER BY users.full_name`,
  );
  return sendSuccess(res, { message: 'User list retrieved.', data: result.rows });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role, pharmacyId, epsId } = req.body;
  if (!['ADMIN', 'PHARMACY_OPERATOR', 'EPS_OPERATOR'].includes(role)) throw ApiError.badRequest('Invalid role.');
  if (role === 'PHARMACY_OPERATOR' && !pharmacyId) throw ApiError.badRequest('A pharmacy or branch is required.');
  if (role === 'EPS_OPERATOR' && !epsId) throw ApiError.badRequest('An EPS is required.');
  const user = await withTransaction(async (client) => {
    const roleRow = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (!roleRow.rowCount) throw ApiError.badRequest('Role not configured.');
    await client.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleRow.rows[0].id, req.params.id]);
    await client.query('DELETE FROM user_pharmacies WHERE user_id = $1', [req.params.id]);
    await client.query('DELETE FROM user_eps WHERE user_id = $1', [req.params.id]);
    if (role === 'PHARMACY_OPERATOR') await client.query('INSERT INTO user_pharmacies (user_id, pharmacy_id) VALUES ($1, $2)', [req.params.id, pharmacyId]);
    if (role === 'EPS_OPERATOR') await client.query('INSERT INTO user_eps (user_id, eps_id) VALUES ($1, $2)', [req.params.id, epsId]);
    return (await client.query(`SELECT users.id, users.full_name, users.email, users.active, roles.name AS role FROM users INNER JOIN roles ON roles.id = users.role_id WHERE users.id = $1`, [req.params.id])).rows[0];
  });
  return sendSuccess(res, { data: user, message: 'User role updated.' });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === Number(req.auth.sub) && req.body.active === false) throw ApiError.badRequest('You cannot disable your own account.');
  const result = await query('UPDATE users SET active = $1 WHERE id = $2 RETURNING id, active', [Boolean(req.body.active), req.params.id]);
  if (!result.rowCount) throw ApiError.notFound('User not found.');
  return sendSuccess(res, { data: result.rows[0], message: 'User status updated.' });
});

export const listBranches = asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name, nit, address, city, active FROM pharmacies WHERE parent_pharmacy_id = $1 ORDER BY name', [req.params.id]);
  return sendSuccess(res, { data: result.rows, message: 'Branches retrieved.' });
});

export const listEpsPharmacies = asyncHandler(async (req, res) => {
  const result = await query(`SELECT pharmacies.id, pharmacies.name, pharmacies.parent_pharmacy_id
    FROM eps_pharmacies INNER JOIN pharmacies ON pharmacies.id = eps_pharmacies.pharmacy_id
    WHERE eps_pharmacies.eps_id = $1 AND eps_pharmacies.active = TRUE AND pharmacies.active = TRUE ORDER BY pharmacies.name`, [req.params.id]);
  return sendSuccess(res, { data: result.rows, message: 'EPS pharmacies retrieved.' });
});

export const createBranch = asyncHandler(async (req, res) => {
  const { name, nit, address, city, openingTime, closingTime, slotDuration, capacityPerSlot } = req.body;
  if (![name, nit, address, city, openingTime, closingTime, slotDuration, capacityPerSlot].every(Boolean)) throw ApiError.badRequest('All branch fields are required.');
  const branch = await withTransaction(async (client) => {
    const created = await client.query(`INSERT INTO pharmacies (name, nit, address, city, inventory_api_url, parent_pharmacy_id) VALUES ($1, $2, $3, $4, 'internal://inventory', $5) RETURNING id, name, nit, address, city, active`, [name.trim(), nit.trim(), address.trim(), city.trim(), req.params.id]);
    await client.query('INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot) VALUES ($1, $2, $3, $4, $5)', [created.rows[0].id, openingTime, closingTime, slotDuration, capacityPerSlot]);
    return created.rows[0];
  });
  return sendSuccess(res, { status: 201, data: branch, message: 'Branch created.' });
});

export const requestBranchChange = asyncHandler(async (req, res) => {
  const branch = await query('SELECT id FROM pharmacies WHERE id = $1 AND parent_pharmacy_id = $2', [req.params.branchId, req.params.id]);
  if (!branch.rowCount) throw ApiError.notFound('Branch not found.');
  const action = String(req.body?.action || '').trim().toUpperCase();
  if (!['ACTIVATE', 'DEACTIVATE', 'DELETE'].includes(action)) throw ApiError.badRequest('Invalid branch action.');
  const pending = await query(
    `SELECT id FROM pharmacy_change_requests
     WHERE pharmacy_id = $1 AND action = $2 AND status = 'PENDING'`,
    [req.params.branchId, action],
  );
  if (pending.rowCount) {
    throw ApiError.conflict('There is already a pending request for this branch and action.');
  }
  const result = await query('INSERT INTO pharmacy_change_requests (pharmacy_id, requested_by, action) VALUES ($1, $2, $3) RETURNING id, status', [req.params.branchId, req.auth.sub, action]);
  return sendSuccess(res, { status: 201, data: result.rows[0], message: 'Change request created.' });
});

export const listBranchChangeRequests = asyncHandler(async (_req, res) => {
  const result = await query(`SELECT requests.*, branch.name AS branch_name, parent.name AS pharmacy_name, users.full_name AS requester_name
    FROM pharmacy_change_requests requests INNER JOIN pharmacies branch ON branch.id = requests.pharmacy_id
    INNER JOIN pharmacies parent ON parent.id = branch.parent_pharmacy_id INNER JOIN users ON users.id = requests.requested_by
    ORDER BY requests.created_at DESC`);
  return sendSuccess(res, { data: result.rows, message: 'Branch change requests retrieved.' });
});

export const listMyBranchChangeRequests = asyncHandler(async (req, res) => {
  const result = await query(`SELECT requests.id, requests.action, requests.status, requests.created_at, requests.reviewed_at,
    branch.name AS branch_name FROM pharmacy_change_requests requests
    INNER JOIN pharmacies branch ON branch.id = requests.pharmacy_id
    WHERE requests.requested_by = $1 ORDER BY requests.created_at DESC`, [req.auth.sub]);
  return sendSuccess(res, { data: result.rows, message: 'My branch change requests retrieved.' });
});

export const reviewBranchChangeRequest = asyncHandler(async (req, res) => {
  const decision = String(req.body?.decision || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw ApiError.badRequest('Invalid request decision.');
  const request = await withTransaction(async (client) => {
    const found = await client.query(`SELECT requests.*, branch.name AS branch_name FROM pharmacy_change_requests requests INNER JOIN pharmacies branch ON branch.id = requests.pharmacy_id WHERE requests.id = $1 FOR UPDATE`, [req.params.id]);
    const item = found.rows[0]; if (!item) throw ApiError.notFound('Request not found.');
    if (item.status !== 'PENDING') throw ApiError.conflict('Request has already been reviewed.');
    if (decision === 'APPROVED' && item.action === 'DELETE') {
      const reservations = await client.query('SELECT 1 FROM reservations WHERE pharmacy_id = $1 LIMIT 1', [item.pharmacy_id]);
      if (reservations.rowCount) throw ApiError.conflict('A branch with reservation history cannot be deleted. Deactivate it instead.');
      await client.query('DELETE FROM inventory_movements WHERE pharmacy_id = $1', [item.pharmacy_id]);
      await client.query('DELETE FROM pharmacy_inventory WHERE pharmacy_id = $1', [item.pharmacy_id]);
      await client.query('DELETE FROM working_hours WHERE pharmacy_id = $1', [item.pharmacy_id]);
      await client.query('DELETE FROM eps_pharmacies WHERE pharmacy_id = $1', [item.pharmacy_id]);
      // Keep the reviewed request as an audit trail, so the branch itself is
      // anonymised by disabling it once dependencies are cleared.
      await client.query('UPDATE pharmacies SET active = FALSE WHERE id = $1', [item.pharmacy_id]);
    }
    if (decision === 'APPROVED' && item.action !== 'DELETE') await client.query('UPDATE pharmacies SET active = $1 WHERE id = $2', [item.action === 'ACTIVATE', item.pharmacy_id]);
    await client.query('UPDATE pharmacy_change_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3', [decision, req.auth.sub, item.id]);
    await insertNotification({ userId: item.requested_by, type: 'BRANCH_REQUEST_REVIEWED', title: 'Petición de sede revisada', message: `Petición sobre ${item.branch_name} para ${item.action} fue ${decision}.` }, client);
    return item;
  });
  return sendSuccess(res, { data: request, message: 'Request reviewed.' });
});

/** Deletes an unlinked user after re-authenticating the administrator. */
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (userId === Number(req.auth.sub)) {
    throw ApiError.badRequest('You cannot delete your own administrator account.');
  }

  await verifyAdminPassword({ userId: req.auth.sub, password: req.body?.adminPassword });

  const patient = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  if (patient.rowCount) {
    throw ApiError.conflict('This user has a patient profile and clinical history, so the account cannot be deleted.');
  }

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
  if (!result.rowCount) throw ApiError.notFound('User not found.');

  res.locals.auditRecordId = userId;
  return res.status(204).end();
});
