'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppointmentStatus } from '@angaly/types';

import { useMyAppointmentsQuery, useMyNotificationsQuery, useMyOrdersQuery } from '../api/dashboard.api';

export interface RecentActivityItem {
  date: string;
  title: string;
  description: string;
  at: number;
}

function formatActivityDate(iso: string): string {
  return format(new Date(iso), "d MMMM 'à' HH:mm", { locale: fr });
}

/**
 * Cross-module activity feed — no dedicated activity-log table exists, so
 * this derives entries straight from the same appointments/orders/
 * notifications already fetched for the dashboard summary (see
 * docs/pages/espace-client-dashboard.md "Points d'attention").
 */
export function useRecentActivity(limit = 5): { activities: RecentActivityItem[]; isLoading: boolean } {
  const appointmentsQuery = useMyAppointmentsQuery();
  const ordersQuery = useMyOrdersQuery();
  const notificationsQuery = useMyNotificationsQuery();

  const activities = useMemo(() => {
    const items: RecentActivityItem[] = [];

    for (const appointment of appointmentsQuery.data ?? []) {
      items.push({
        date: formatActivityDate(appointment.updatedAt),
        title: appointment.status === AppointmentStatus.CANCELLED ? 'Rendez-vous annulé' : 'Rendez-vous confirmé',
        description: `Référence ${appointment.reference}`,
        at: new Date(appointment.updatedAt).getTime(),
      });
    }

    for (const order of ordersQuery.data ?? []) {
      items.push({
        date: formatActivityDate(order.createdAt),
        title: `Commande #${order.orderNumber} passée`,
        description: `Pour un montant de ${Number(order.total).toLocaleString('fr-FR')} ${order.currency}`,
        at: new Date(order.createdAt).getTime(),
      });
    }

    for (const notification of notificationsQuery.data ?? []) {
      items.push({
        date: formatActivityDate(notification.createdAt),
        title: notification.title,
        description: notification.body,
        at: new Date(notification.createdAt).getTime(),
      });
    }

    return items.sort((a, b) => b.at - a.at).slice(0, limit);
  }, [appointmentsQuery.data, ordersQuery.data, notificationsQuery.data, limit]);

  return {
    activities,
    isLoading: appointmentsQuery.isLoading || ordersQuery.isLoading || notificationsQuery.isLoading,
  };
}
