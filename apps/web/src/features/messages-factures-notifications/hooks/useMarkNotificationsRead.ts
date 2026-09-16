import { useMarkAllReadMutation, useMarkNotificationReadMutation } from '../api/notifications.api';

/** Real endpoints — `PATCH /api/notifications/read-all` and `PATCH /api/notifications/:id/read`. */
export const useMarkNotificationsRead = () => {
  const markAllMutation = useMarkAllReadMutation();
  const markOneMutation = useMarkNotificationReadMutation();

  const markAllRead = async () => {
    await markAllMutation.mutateAsync();
  };

  const markOneRead = async (id: string) => {
    await markOneMutation.mutateAsync(id);
  };

  return { markAllRead, markOneRead, isMarkingAll: markAllMutation.isPending };
};
