import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AppointmentType } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useMyAppointments } from '../hooks/useMyAppointments';

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

function mockAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'appointment-1',
    reference: 'ANG-RDV-2026-001',
    customerId: 'customer-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 00 000 00',
    email: 'nirina@example.com',
    type: AppointmentType.ESSAYAGE,
    atelierId: 'atelier-1',
    assignedToId: null,
    scheduledAt: '2099-01-01T10:00:00.000Z',
    durationMinutes: 45,
    status: 'CONFIRMED',
    message: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useMyAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins appointments with their atelier and defaults to the upcoming filter', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/appointments') return Promise.resolve([mockAppointment()]);
      if (path === '/ateliers') return Promise.resolve([ATELIER]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useMyAppointments(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filter).toBe('upcoming');
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0]).toMatchObject({
      reference: 'ANG-RDV-2026-001',
      type: 'Essayage',
      atelierName: 'Atelier ANGALY Analakely',
      atelierAddress: 'Analakely, Antananarivo',
    });
  });

  it('classifies a CANCELLED appointment as cancelled regardless of date', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/appointments') return Promise.resolve([mockAppointment({ status: 'CANCELLED', scheduledAt: '2099-01-01T10:00:00.000Z' })]);
      if (path === '/ateliers') return Promise.resolve([ATELIER]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useMyAppointments(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.appointments).toHaveLength(0);

    act(() => result.current.setFilter('cancelled'));
    await waitFor(() => expect(result.current.appointments).toHaveLength(1));
  });

  it('classifies a past-dated appointment under "past"', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path === '/appointments') return Promise.resolve([mockAppointment({ status: 'COMPLETED', scheduledAt: '2020-01-01T10:00:00.000Z' })]);
      if (path === '/ateliers') return Promise.resolve([ATELIER]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    const { result } = renderHook(() => useMyAppointments(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.appointments).toHaveLength(0);

    act(() => result.current.setFilter('past'));
    await waitFor(() => expect(result.current.appointments).toHaveLength(1));
  });
});
