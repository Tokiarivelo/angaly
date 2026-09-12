export interface AppNotification {
  id: string;
  type: string; // From NotificationType enum
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Commande expédiée',
    body: 'Votre commande #ANG-2938 est en route pour la livraison.',
    isRead: false,
    createdAt: '2026-09-24T15:00:00Z',
  },
  {
    id: 'n2',
    type: 'MESSAGE_RECEIVED',
    title: 'Nouveau message',
    body: 'L\'atelier a répondu à votre demande.',
    isRead: true,
    createdAt: '2026-09-24T14:30:00Z',
  }
];

export const useNotifications = () => {
  return { notifications: MOCK_NOTIFICATIONS };
};
