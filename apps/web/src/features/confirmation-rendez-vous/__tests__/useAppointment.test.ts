import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useAppointment } from '../hooks/useAppointment';

describe('useAppointment', () => {
  it('loads the appointment and resolves its atelier', async () => {
    const { result } = renderHook(() => useAppointment('ANG-RDV-2026-AbCdEfGh'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.appointment?.reference).toBe('ANG-RDV-2026-AbCdEfGh');
    expect(result.current.atelier?.name).toBe('Atelier Antananarivo Centre');
  });

  it('does not query while the reference is empty', () => {
    const { result } = renderHook(() => useAppointment(''), { wrapper: withQueryClient() });

    expect(result.current.appointment).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
