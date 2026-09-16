import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OrderStatus } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useOrderTracking } from '../hooks/useOrderTracking';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function mockOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ANG-2938',
    customerId: 'cust-1',
    status: OrderStatus.IN_PRODUCTION,
    subtotal: '150000.00',
    shippingCost: '10000.00',
    total: '160000.00',
    currency: 'MGA',
    shippingAddressJson: null,
    items: [{ id: 'item-1', orderId: 'order-1', productVariantId: 'variant-abc123', quantity: 1, unitPrice: '150000.00' }],
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-12T09:00:00.000Z',
    ...overrides,
  };
}

describe('useOrderTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the order by orderNumber from the customer order list', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockOrder(), mockOrder({ orderNumber: 'OTHER' })] as never);

    const { result } = renderHook(() => useOrderTracking('ANG-2938'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/orders');
    expect(result.current.order?.orderNumber).toBe('ANG-2938');
    expect(result.current.order?.subtotal).toBe(150000);
    expect(result.current.order?.items[0]?.quantity).toBe(1);
  });

  it('returns null order when no order matches the orderNumber', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockOrder({ orderNumber: 'OTHER' })] as never);

    const { result } = renderHook(() => useOrderTracking('DOES-NOT-EXIST'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.order).toBeNull();
  });

  it('marks earlier steps completed, the IN_PRODUCTION group current, and later steps upcoming', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockOrder({ status: OrderStatus.IN_PRODUCTION })] as never);

    const { result } = renderHook(() => useOrderTracking('ANG-2938'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const byKey = new Map(result.current.timelineSteps.map((step) => [step.key, step]));
    expect(byKey.get('confirmed')?.state).toBe('completed');
    expect(byKey.get('measurements')?.state).toBe('current');
    expect(byKey.get('pattern')?.state).toBe('current');
    expect(byKey.get('confection')?.state).toBe('current');
    expect(byKey.get('qc')?.state).toBe('upcoming');
    expect(byKey.get('delivered')?.state).toBe('upcoming');
    expect(byKey.get('delivered')?.timestamp).toBeUndefined();
  });

  it('flags a cancelled order and marks every step upcoming', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockOrder({ status: OrderStatus.CANCELLED })] as never);

    const { result } = renderHook(() => useOrderTracking('ANG-2938'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isCancelled).toBe(true);
    expect(result.current.timelineSteps.every((step) => step.state === 'upcoming')).toBe(true);
  });
});
