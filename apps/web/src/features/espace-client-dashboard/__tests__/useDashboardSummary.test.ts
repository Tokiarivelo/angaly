import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OrderStatus, PatternStatus } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useDashboardSummary } from '../hooks/useDashboardSummary';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const ATELIER = {
  id: 'atelier-1',
  slug: 'atelier-analakely',
  name: 'Atelier ANGALY Analakely',
  address: 'Analakely, Antananarivo',
  city: 'Antananarivo',
  phone: null,
  openingHours: {},
  services: {},
  latitude: null,
  longitude: null,
  media: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockRoutes(overrides: Partial<Record<string, unknown>> = {}) {
  const defaults: Record<string, unknown> = {
    '/customers/me': { id: 'customer-1', userId: 'user-1', firstName: 'Nirina', lastName: 'Rakoto', phone: null, createdAt: '', updatedAt: '' },
    '/appointments': [],
    '/ateliers': [ATELIER],
    '/orders': [],
    '/pattern-projects?mine=true': [],
    '/notifications': [],
  };
  const routes = { ...defaults, ...overrides };
  vi.mocked(apiClient.get).mockImplementation((path: string) => {
    if (path in routes) return Promise.resolve(routes[path]);
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the customer first name and empty widgets when nothing is in progress', async () => {
    mockRoutes();

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.firstName).toBe('Nirina');
    expect(result.current.nextAppointment).toBeNull();
    expect(result.current.currentOrder).toBeNull();
    expect(result.current.premiumProject).toBeNull();
    expect(result.current.notifications).toEqual([]);
  });

  it('picks the soonest upcoming appointment and resolves its atelier', async () => {
    mockRoutes({
      '/appointments': [
        { id: 'apt-2', reference: 'RDV-2', status: 'CONFIRMED', atelierId: 'atelier-1', scheduledAt: '2099-02-01T10:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'apt-1', reference: 'RDV-1', status: 'CONFIRMED', atelierId: 'atelier-1', scheduledAt: '2099-01-01T10:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.nextAppointment).toMatchObject({
      id: 'apt-1',
      atelierName: 'Atelier ANGALY Analakely',
    });
  });

  it('picks the most recent in-progress order', async () => {
    mockRoutes({
      '/orders': [
        { id: 'o1', orderNumber: 'ANG-1', status: OrderStatus.PENDING, createdAt: '2026-01-01T00:00:00.000Z', total: '1', currency: 'MGA' },
        { id: 'o2', orderNumber: 'ANG-2', status: OrderStatus.IN_PRODUCTION, createdAt: '2026-02-01T00:00:00.000Z', total: '2', currency: 'MGA' },
      ],
    });

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentOrder).toMatchObject({ id: 'ANG-2', status: OrderStatus.IN_PRODUCTION });
  });

  it('surfaces an in-progress pattern project', async () => {
    mockRoutes({
      '/pattern-projects?mine=true': [{ id: 'proj-1', garmentType: 'ROBE', status: PatternStatus.GENERATING }],
    });

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.premiumProject).toMatchObject({ id: 'proj-1', name: 'ROBE', status: PatternStatus.GENERATING });
  });

  it('caps notifications preview to the first 3', async () => {
    mockRoutes({
      '/notifications': Array.from({ length: 5 }, (_, i) => ({
        id: `n${i}`,
        title: `Notif ${i}`,
        body: 'body',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
    });

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toHaveLength(3);
  });
});
