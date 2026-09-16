import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useConversations } from '../hooks/useConversations';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function mockConversation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'conv-1',
    customerId: 'customer-1',
    atelierId: 'atelier-1',
    atelierName: 'Atelier Antananarivo',
    relatedEntityType: null,
    relatedEntityId: null,
    lastMessagePreview: 'Votre commande avance bien.',
    lastMessageAt: '2026-09-20T10:00:00.000Z',
    unreadCount: 2,
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

function mockOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'ANG-2938',
    customerId: 'customer-1',
    status: 'PAID',
    subtotal: '150000.00',
    shippingCost: '0.00',
    total: '150000.00',
    currency: 'MGA',
    shippingAddressJson: null,
    items: [],
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and maps the current conversations', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/messages/conversations') return Promise.resolve([mockConversation()]);
      if (path === '/orders') return Promise.resolve([]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useConversations(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/messages/conversations');
    expect(result.current.threads).toEqual([
      {
        id: 'conv-1',
        atelierName: 'Atelier Antananarivo',
        orderReference: undefined,
        lastMessage: 'Votre commande avance bien.',
        timestamp: '2026-09-20T10:00:00.000Z',
        unreadCount: 2,
      },
    ]);
  });

  it('resolves orderReference by joining the own-orders list when relatedEntityType is Order', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/messages/conversations') {
        return Promise.resolve([mockConversation({ relatedEntityType: 'Order', relatedEntityId: 'order-1' })]);
      }
      if (path === '/orders') return Promise.resolve([mockOrder()]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useConversations(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.threads[0]?.orderReference).toBe('ANG-2938');
  });

  it('manages the active thread selection locally', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useConversations(), { wrapper: withQueryClient() });

    expect(result.current.activeThreadId).toBeNull();

    act(() => {
      result.current.setActiveThreadId('conv-1');
    });

    expect(result.current.activeThreadId).toBe('conv-1');
  });
});
