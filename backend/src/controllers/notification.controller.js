import {
  countUnread,
  findByUser,
  markAllAsRead,
  markAsRead,
} from '../repositories/notification.repository.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** GET /api/notifications — the authenticated user's notifications. */
export const listMyNotifications = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, unreadOnly } = req.query;
  const userId = Number(req.auth.sub);

  const [notifications, unread] = await Promise.all([
    findByUser(userId, { unreadOnly: unreadOnly === 'true', limit, offset }),
    countUnread(userId),
  ]);

  return sendSuccess(res, {
    message: 'Notifications retrieved.',
    data: notifications,
    extra: { meta: { unreadCount: unread, limit, offset, count: notifications.length } },
  });
});

/** GET /api/notifications/unread-count */
export const getUnreadCount = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Unread notification count retrieved.',
    data: { unreadCount: await countUnread(Number(req.auth.sub)) },
  }),
);

/** PATCH /api/notifications/:id/read */
export const readNotification = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id, Number(req.auth.sub));
  if (!notification) throw ApiError.notFound('Notification not found.');

  res.locals.auditRecordId = notification.id;
  return sendSuccess(res, { message: 'Notification marked as read.', data: notification });
});

/** PATCH /api/notifications/read-all */
export const readAllNotifications = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'All notifications marked as read.',
    data: { updated: await markAllAsRead(Number(req.auth.sub)) },
  }),
);
