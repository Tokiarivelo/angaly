import { OrderStatus } from '@angaly/types';
import { TRACKING_STEPS } from '../consts/order-tracking-steps.const';
import { useOrderByNumberQuery } from '../api/orders.api';

export interface TrackingTimelineStep {
  key: string;
  label: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming';
  timestamp?: string | undefined; // Only for completed or current
}

export interface OrderDetails {
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  /**
   * `Order` has no `assignedToId` field (unlike `Appointment`) — never resolvable
   * from `GET /api/orders` alone (see docs/pages/suivi-commande.md "Points
   * d'attention"). Always undefined until a real source is decided.
   */
  atelierName?: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
}

/**
 * `OrderStatus` (8 broad values) doesn't map 1-for-1 onto the mockup's 8 detailed
 * steps (see docs/pages/suivi-commande.md "Écart schéma ↔ maquette"). Several UI
 * steps share the same technical status (e.g. `IN_PRODUCTION` covers "Mesures
 * prises"/"Patron créé"/"Confection") — this rank only distinguishes *groups* of
 * steps, not the individual step reached within a group.
 */
const STATUS_RANK: Record<OrderStatus, number> = {
  [OrderStatus.PENDING]: 0,
  [OrderStatus.CONFIRMED]: 1,
  [OrderStatus.PAID]: 1,
  [OrderStatus.IN_PRODUCTION]: 2,
  [OrderStatus.READY]: 3,
  [OrderStatus.DELIVERED]: 4,
  [OrderStatus.CANCELLED]: -1,
  [OrderStatus.REFUNDED]: -1,
};

function stepRank(mappedStatuses: OrderStatus[]): number {
  return Math.min(...mappedStatuses.map((status) => STATUS_RANK[status]));
}

export const useOrderTracking = (orderNumber: string) => {
  const query = useOrderByNumberQuery(orderNumber);
  const rawOrder = query.data ?? null;

  const isCancelled = rawOrder?.status === OrderStatus.CANCELLED || rawOrder?.status === OrderStatus.REFUNDED;
  const currentRank = rawOrder ? STATUS_RANK[rawOrder.status] : -1;

  const order: OrderDetails | null = rawOrder
    ? {
        orderNumber: rawOrder.orderNumber,
        status: rawOrder.status,
        subtotal: Number(rawOrder.subtotal),
        shippingCost: Number(rawOrder.shippingCost),
        total: Number(rawOrder.total),
        items: rawOrder.items.map((item) => ({
          id: item.id,
          // No product/variant name is available from `OrderItemDto` (only
          // `productVariantId`) — no `GET /api/products/variants/:id` endpoint
          // exists yet to hydrate it (see docs/pages/suivi-commande.md).
          productName: `Article ${item.productVariantId.slice(-6).toUpperCase()}`,
          quantity: item.quantity,
          price: Number(item.unitPrice),
        })),
      }
    : null;

  const timelineSteps: TrackingTimelineStep[] = TRACKING_STEPS.map((step) => {
    const rank = stepRank(step.mappedStatuses);

    let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (rawOrder && !isCancelled) {
      if (rank < currentRank) {
        state = 'completed';
      } else if (rank === currentRank) {
        state = 'current';
      }
    }

    return {
      key: step.key,
      label: step.label,
      description: step.description,
      state,
      timestamp:
        state === 'completed'
          ? rawOrder?.createdAt
          : state === 'current'
            ? rawOrder?.updatedAt
            : undefined,
    };
  });

  return {
    order,
    timelineSteps,
    isLoading: query.isLoading,
    isError: query.isError,
    isCancelled,
  };
};
