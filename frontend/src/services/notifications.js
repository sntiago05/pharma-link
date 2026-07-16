import { apiGet, apiPatch } from "./api.js";

/** Notifications for the authenticated user (any role). */

export const listNotifications = (params) => apiGet("/notifications", params);

export const getUnreadCount = () => apiGet("/notifications/unread-count");

export const markAsRead = (id) => apiPatch(`/notifications/${id}/read`);

export const markAllAsRead = () => apiPatch("/notifications/read-all");
