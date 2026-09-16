'use client';

import { useMemo } from 'react';
import { OrderStatus, PatternStatus } from '@angaly/types';

import {
  useAteliersQuery,
  useCustomerProfileQuery,
  useMyAppointmentsQuery,
  useMyNotificationsQuery,
  useMyOrdersQuery,
  useMyPatternProjectsQuery,
} from '../api/dashboard.api';

/** "En cours" = ni brouillon (`PENDING`) ni terminal (`DELIVERED`/`CANCELLED`/`REFUNDED`) — see docs/pages/espace-client-dashboard.md. */
const IN_PROGRESS_ORDER_STATUSES: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.READY];
const UPCOMING_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'];
const IN_PROGRESS_PATTERN_STATUSES: PatternStatus[] = [
  PatternStatus.GENERATING,
  PatternStatus.GENERATED,
  PatternStatus.REVIEW_REQUIRED,
  PatternStatus.CORRECTION_REQUIRED,
];

/**
 * Aggregates several react-query calls (appointments/orders/pattern-projects/
 * notifications) into the dashboard's summary — no dedicated
 * `GET /api/customers/me/dashboard-summary` endpoint exists yet (see
 * docs/pages/espace-client-dashboard.md "Points d'attention": documented as
 * an intention, not committed backend work for this pass).
 */
export function useDashboardSummary() {
  const customerProfile = useCustomerProfileQuery();
  const appointmentsQuery = useMyAppointmentsQuery();
  const ateliersQuery = useAteliersQuery();
  const ordersQuery = useMyOrdersQuery();
  const patternProjectsQuery = useMyPatternProjectsQuery();
  const notificationsQuery = useMyNotificationsQuery();

  const nextAppointment = useMemo(() => {
    const upcoming = (appointmentsQuery.data ?? [])
      .filter((apt) => UPCOMING_APPOINTMENT_STATUSES.includes(apt.status) && new Date(apt.scheduledAt).getTime() >= Date.now())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const appointment = upcoming[0] ?? null;
    if (!appointment) return null;

    const atelier = ateliersQuery.data?.find((candidate) => candidate.id === appointment.atelierId) ?? null;
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt,
      atelierName: atelier?.name ?? 'Atelier ANGALY',
      atelierAddress: atelier?.address ?? '',
    };
  }, [appointmentsQuery.data, ateliersQuery.data]);

  const currentOrder = useMemo(() => {
    const inProgress = (ordersQuery.data ?? [])
      .filter((order) => IN_PROGRESS_ORDER_STATUSES.includes(order.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const order = inProgress[0] ?? null;
    if (!order) return null;

    return {
      id: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
    };
  }, [ordersQuery.data]);

  const premiumProject = useMemo(() => {
    const project = (patternProjectsQuery.data ?? []).find((candidate) => IN_PROGRESS_PATTERN_STATUSES.includes(candidate.status));
    if (!project) return null;

    return { id: project.id, name: project.garmentType, status: project.status };
  }, [patternProjectsQuery.data]);

  const notifications = useMemo(
    () => (notificationsQuery.data ?? []).slice(0, 3).map((n) => ({ id: n.id, title: n.title, message: n.body })),
    [notificationsQuery.data],
  );

  return {
    firstName: customerProfile.data?.firstName ?? '',
    nextAppointment,
    currentOrder,
    premiumProject,
    notifications,
    isLoading:
      customerProfile.isLoading || appointmentsQuery.isLoading || ordersQuery.isLoading || notificationsQuery.isLoading,
  };
}
