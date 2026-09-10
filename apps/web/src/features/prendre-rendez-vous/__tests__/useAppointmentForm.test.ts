import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppointmentType } from '@angaly/types';

import { withQueryClient } from '@/lib/test-utils';

import { useAppointmentForm } from '../hooks/useAppointmentForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/prendre-rendez-vous',
  useSearchParams: () => new URLSearchParams(),
}));

describe('useAppointmentForm', () => {
  it('starts with no selection made', () => {
    const { result } = renderHook(() => useAppointmentForm(), { wrapper: withQueryClient() });

    expect(result.current.selectedType).toBe('');
    expect(result.current.atelierId).toBe('');
    expect(result.current.date).toBe('');
    expect(result.current.scheduledAt).toBe('');
  });

  it('selecting a type/atelier/date/slot updates the watched form values', () => {
    const { result } = renderHook(() => useAppointmentForm(), { wrapper: withQueryClient() });

    act(() => result.current.selectType(AppointmentType.ESSAYAGE));
    expect(result.current.selectedType).toBe(AppointmentType.ESSAYAGE);

    act(() => result.current.selectAtelier('atelier-1'));
    expect(result.current.atelierId).toBe('atelier-1');

    act(() => result.current.selectDate('2026-09-14'));
    expect(result.current.date).toBe('2026-09-14');

    act(() => result.current.selectSlot('2026-09-14T09:00:00.000Z'));
    expect(result.current.scheduledAt).toBe('2026-09-14T09:00:00.000Z');
  });

  it('selecting a different atelier resets the date and slot', () => {
    const { result } = renderHook(() => useAppointmentForm(), { wrapper: withQueryClient() });

    act(() => result.current.selectAtelier('atelier-1'));
    act(() => result.current.selectDate('2026-09-14'));
    act(() => result.current.selectSlot('2026-09-14T09:00:00.000Z'));

    act(() => result.current.selectAtelier('atelier-2'));

    expect(result.current.date).toBe('');
    expect(result.current.scheduledAt).toBe('');
  });

  it('reports validation errors when submitting with nothing filled in', async () => {
    const { result } = renderHook(() => useAppointmentForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)();
    });

    await waitFor(() => expect(Object.keys(result.current.errors).length).toBeGreaterThan(0));
    expect(result.current.errors.type).toBeDefined();
    expect(result.current.errors.firstName).toBeDefined();
  });
});
