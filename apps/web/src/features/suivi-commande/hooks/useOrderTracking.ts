import { OrderStatus } from '@angaly/types';
import { TRACKING_STEPS } from '../consts/order-tracking-steps.const';

export interface TrackingTimelineStep {
  key: string;
  label: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming';
  timestamp?: string; // Only for completed or current
}

export interface OrderDetails {
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  atelierName?: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
  // Mock history for timestamps
  history: Record<string, string>; 
}

export const useOrderTracking = (orderNumber: string) => {
  // Mock data
  const mockOrder: OrderDetails = {
    orderNumber,
    status: OrderStatus.IN_PRODUCTION,
    subtotal: 150000,
    shippingCost: 10000,
    total: 160000,
    atelierName: 'Atelier ANGALY Analakely',
    items: [
      {
        id: '1',
        productName: 'Robe de cocktail fluide',
        quantity: 1,
        price: 150000,
      }
    ],
    history: {
      'confirmed': '2026-09-20T10:00:00Z',
      'measurements': '2026-09-21T14:30:00Z',
      'pattern': '2026-09-22T09:15:00Z',
      'confection': '2026-09-23T11:00:00Z',
    }
  };

  const currentStatusIndex = TRACKING_STEPS.findIndex(s => s.mappedStatuses.includes(mockOrder.status));
  // In a real scenario with shared statuses like IN_PRODUCTION, we'd rely on timestamps in history
  // to know exactly which sub-step we are at. Here we use history keys presence.

  const timelineSteps: TrackingTimelineStep[] = TRACKING_STEPS.map((step, index) => {
    const hasTimestamp = !!mockOrder.history[step.key];
    const nextStepHasTimestamp = TRACKING_STEPS[index + 1] && !!mockOrder.history[TRACKING_STEPS[index + 1].key];
    
    let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
    
    if (hasTimestamp && nextStepHasTimestamp) {
      state = 'completed';
    } else if (hasTimestamp && !nextStepHasTimestamp) {
      // The latest step with a timestamp is the 'current' one
      state = 'current';
    }

    return {
      key: step.key,
      label: step.label,
      description: step.description,
      state,
      timestamp: hasTimestamp ? mockOrder.history[step.key] : undefined,
    };
  });

  return {
    order: mockOrder,
    timelineSteps,
  };
};
