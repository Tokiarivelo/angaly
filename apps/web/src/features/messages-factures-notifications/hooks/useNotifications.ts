import { useNotificationsQuery } from '../api/notifications.api';

export interface AppNotification {
  id: string;
  type: string; // From NotificationType enum
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

/** Real endpoint — `GET /api/notifications` (see docs/features/notifications.md). */
export const useNotifications = () => {
  const query = useNotificationsQuery();

  const notifications: AppNotification[] = (query.data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  return { notifications, isLoading: query.isLoading, isError: query.isError };
};
