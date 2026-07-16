import { Router } from 'express';
import { query } from 'express-validator';
import {
  getUnreadCount,
  listMyNotifications,
  readAllNotifications,
  readNotification,
} from '../controllers/notification.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam, paginationQuery } from '../validators/common.validators.js';

const router = Router();

// Every route is implicitly scoped to req.auth.sub, so no role check is needed:
// any authenticated user may read their own notifications and nobody else's.

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the caller's notifications
 *     description: >
 *       Newest first. Notifications are generated when a reservation is created,
 *       cancelled, rescheduled, delivered or marked no-show, and when an order
 *       expires. `meta.unreadCount` carries the badge count.
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *         description: Return only unread notifications.
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Notifications.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Notification' }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         unreadCount: { type: integer, example: 2 }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         count: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/',
  validate([
    ...paginationQuery(),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean.'),
  ]),
  listMyNotifications,
);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Unread notification count
 *     responses:
 *       200:
 *         description: Unread count.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         unreadCount: { type: integer, example: 2 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/unread-count', getUnreadCount);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark every notification as read
 *     responses:
 *       200:
 *         description: Notifications updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         updated: { type: integer, example: 3 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch('/read-all', readAllNotifications);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark one notification as read
 *     description: >
 *       Scoped to the caller: an id belonging to another user returns 404.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Notification' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/:id/read', validate([idParam('id')]), readNotification);

export default router;
