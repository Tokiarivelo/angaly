import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useCancelAppointment } from '../hooks/useCancelAppointment';

describe('useCancelAppointment', () => {
  it('starts without asking for confirmation', () => {
    const { result } = renderHook(() => useCancelAppointment('ANG-RDV-2026-AbCdEfGh'), { wrapper: withQueryClient() });

    expect(result.current.isConfirming).toBe(false);
  });

  it('requires a confirm step before cancelling', async () => {
    const { result } = renderHook(() => useCancelAppointment('ANG-RDV-2026-AbCdEfGh'), { wrapper: withQueryClient() });

    act(() => result.current.requestCancel());
    expect(result.current.isConfirming).toBe(true);

    act(() => result.current.confirmCancel());
    await waitFor(() => expect(result.current.isConfirming).toBe(false));
  });

  it('dismissing the confirm step cancels nothing', () => {
    const { result } = renderHook(() => useCancelAppointment('ANG-RDV-2026-AbCdEfGh'), { wrapper: withQueryClient() });

    act(() => result.current.requestCancel());
    act(() => result.current.dismissCancel());

    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isCancelling).toBe(false);
  });
});
