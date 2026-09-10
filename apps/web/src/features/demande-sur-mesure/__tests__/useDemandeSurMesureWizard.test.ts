import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useDemandeSurMesureWizard } from '../hooks/useDemandeSurMesureWizard';

const MOCK_SESSION = {
  user: { id: 'user-1', role: 'CLIENT', email: 'nirina@example.com' },
  accessToken: 'mock-access-token',
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: MOCK_SESSION, status: 'authenticated' }),
  getSession: () => Promise.resolve(MOCK_SESSION),
}));

describe('useDemandeSurMesureWizard', () => {
  it('starts on step 1 with no garment type selected', () => {
    const { result } = renderHook(() => useDemandeSurMesureWizard(), { wrapper: withQueryClient() });

    expect(result.current.step).toBe(1);
    expect(result.current.values.garmentType).toBe('');
  });

  it('blocks the transition to step 2 until a garment type is selected', async () => {
    const { result } = renderHook(() => useDemandeSurMesureWizard(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.goNext();
    });
    expect(result.current.step).toBe(1);
    expect(result.current.errors.garmentType).toBeDefined();

    act(() => result.current.selectGarmentType('Robe de mariée'));
    await act(async () => {
      await result.current.goNext();
    });
    expect(result.current.step).toBe(2);
  });

  it('goBack moves to the previous step, never below 1', () => {
    const { result } = renderHook(() => useDemandeSurMesureWizard(), { wrapper: withQueryClient() });

    act(() => result.current.goBack());
    expect(result.current.step).toBe(1);
  });

  it('populates contact from the customer profile and session once loaded', async () => {
    const { result } = renderHook(() => useDemandeSurMesureWizard(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.customerProfile.isSuccess).toBe(true));

    expect(result.current.contact).toEqual({
      firstName: 'Nirina',
      lastName: 'Rakoto',
      phone: '+261 34 12 345 67',
      email: 'nirina@example.com',
    });
  });

  it('submits the wizard and reports the created quote', async () => {
    const { result } = renderHook(() => useDemandeSurMesureWizard(), { wrapper: withQueryClient() });

    act(() => result.current.selectGarmentType('Robe de mariée'));

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() => expect(result.current.isSubmitted).toBe(true));
    expect(result.current.submittedQuote?.quoteNumber).toBe('ANG-DEV-2026-A1B2C3D4');
  });
});
