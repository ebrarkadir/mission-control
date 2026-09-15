export interface NotificationItem {
  id: number;
  alertId: number;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadNotificationCount {
  count: number;
}
