import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useInvoices } from '../hooks/useInvoices';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function mockOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ANG-2938',
    customerId: 'customer-1',
    status: OrderStatus.PAID,
    subtotal: '150000.00',
    shippingCost: '0.00',
    total: '150000.00',
    currency: 'MGA',
    shippingAddressJson: null,
    items: [],
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

function mockPayment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    method: PaymentMethod.MOBILE_MONEY,
    status: PaymentStatus.PAID,
    amount: '150000.00',
    transactionRef: 'TRX-12345',
    paidAt: '2026-09-20T10:05:00.000Z',
    createdAt: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('useInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins payments with their order to expose a human orderReference', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/payments') return Promise.resolve([mockPayment()]);
      if (path === '/orders') return Promise.resolve([mockOrder()]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useInvoices(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invoices).toEqual([
      {
        id: 'payment-1',
        transactionRef: 'TRX-12345',
        orderReference: 'ANG-2938',
        amount: 150000,
        status: 'PAID',
        date: '2026-09-20T10:00:00.000Z',
      },
    ]);
  });

  it('maps FAILED and AUTHORIZED statuses to PENDING (no dedicated visual state)', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/payments') {
        return Promise.resolve([
          mockPayment({ id: 'p-failed', status: PaymentStatus.FAILED }),
          mockPayment({ id: 'p-auth', status: PaymentStatus.AUTHORIZED }),
        ]);
      }
      if (path === '/orders') return Promise.resolve([mockOrder()]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useInvoices(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invoices.every((invoice) => invoice.status === 'PENDING')).toBe(true);
  });
});
