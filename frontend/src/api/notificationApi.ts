import { apiClient } from './apiClient';
import type { NotificationItem, UnreadNotificationCount } from '../types/notification';

export const notificationApi = {
  getAll(): Promise<NotificationItem[]> {
    return apiClient<NotificationItem[]>('/api/notifications');
  },

  getUnreadCount(): Promise<UnreadNotificationCount> {
    return apiClient<UnreadNotificationCount>('/api/notifications/unread-count');
  },

  markAsRead(id: number): Promise<NotificationItem> {
    return apiClient<NotificationItem>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};
