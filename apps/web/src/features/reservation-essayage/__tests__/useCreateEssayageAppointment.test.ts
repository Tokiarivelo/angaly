import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AppointmentStatus, AppointmentType } from '@angaly/types';
import type { AppointmentDto, ProductDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCreateEssayageAppointment } from '../hooks/useCreateEssayageAppointment';
import type { EssayageReservationValues } from '../schemas/essayage-reservation.schema';

const API_BASE_URL = 'http://localhost:3003/api';
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/essayage/reserver',
  useSearchParams: () => new URLSearchParams(),
}));

const VALUES: EssayageReservationValues = {
  size: '36',
  atelierId: 'atelier-1',
  date: '2026-09-14',
  scheduledAt: '2026-09-14T09:00:00.000Z',
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
};

const APPOINTMENT: AppointmentDto = {
  id: 'appointment-1',
  reference: 'ANG-RDV-2026-EssaieGh',
  customerId: null,
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  type: AppointmentType.ESSAYAGE,
  atelierId: 'atelier-1',
  assignedToId: null,
  scheduledAt: '2026-09-14T09:00:00.000Z',
  durationMinutes: 45,
  status: AppointmentStatus.PENDING,
  message: 'Robe Solène — Taille 36 — Réf. RS-24-FW',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const PRODUCT: ProductDto = {
  id: 'product-1',
  sku: 'RS-24-FW',
  slug: 'robe-solene',
  name: 'Robe Solène',
  description: '',
  price: { amount: '1450000', currency: 'MGA' },
  status: 'AVAILABLE' as ProductDto['status'],
  category: { id: 'cat-robes', slug: 'robes', name: 'Robes' },
  media: [],
  variants: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useCreateEssayageAppointment', () => {
  it('creates the ESSAYAGE appointment then redirects to its confirmation page', async () => {
    // Several features' default MSW handlers all mock `POST /appointments` — pin this
    // test's expected reference explicitly instead of relying on handler registration order.
    server.use(http.post(`${API_BASE_URL}/appointments`, () => HttpResponse.json({ success: true, data: APPOINTMENT })));

    const { result } = renderHook(() => useCreateEssayageAppointment(), { wrapper: withQueryClient() });

    act(() => result.current.submit(VALUES, PRODUCT));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/rendez-vous/ANG-RDV-2026-EssaieGh/confirmation'));
  });

  it('still works without a resolved product (message falls back to just the size)', async () => {
    const { result } = renderHook(() => useCreateEssayageAppointment(), { wrapper: withQueryClient() });

    act(() => result.current.submit(VALUES, null));

    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
