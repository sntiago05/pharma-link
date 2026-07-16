import { query } from '../config/db.js';

/**
 * Inserts a notification.
 * @param {object} notification
 * @param {import('pg').PoolClient} [client] Joins the caller's transaction.
 */
export const insertNotification = async (notification, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `INSERT INTO notifications (user_id, type, title, message, order_id, reservation_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      notification.orderId ?? null,
      notification.reservationId ?? null,
    ],
  );
  return result.rows[0];
};

/** Inserts many notifications in one round trip. */
export const insertNotifications = async (notifications, client) => {
  if (!notifications.length) return [];
  const runner = client ? client.query.bind(client) : query;

  const values = [];
  const placeholders = notifications.map((notification, index) => {
    const base = index * 6;
    values.push(
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      notification.orderId ?? null,
      notification.reservationId ?? null,
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  const result = await runner(
    `INSERT INTO notifications (user_id, type, title, message, order_id, reservation_id)
     VALUES ${placeholders.join(', ')} RETURNING *`,
    values,
  );
  return result.rows;
};

/**
 * A user's notifications, newest first.
 * @param {number} userId
 * @param {object} [options]
 * @param {boolean} [options.unreadOnly=false]
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 */
export const findByUser = async (userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) => {
  const result = await query(
    `SELECT id, user_id, type, title, message, order_id, reservation_id, read_at, created_at
     FROM notifications
     WHERE user_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
};

/** Unread count for the badge. */
export const countUnread = async (userId) => {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId],
  );
  return result.rows[0].count;
};

/**
 * Marks one notification as read.
 *
 * Scoped by `user_id` so a caller cannot mark somebody else's notification;
 * an id belonging to another user simply returns undefined (404).
 */
export const markAsRead = async (id, userId) => {
  const result = await query(
    `UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  return result.rows[0];
};

/** Marks every unread notification of a user as read. Returns the count. */
export const markAllAsRead = async (userId) => {
  const result = await query(
    `UPDATE notifications SET read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return result.rowCount;
};
