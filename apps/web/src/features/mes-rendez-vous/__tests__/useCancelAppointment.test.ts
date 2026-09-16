import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';

import { useCancelAppointment } from '../hooks/useCancelAppointment';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useCancelAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to the cancel endpoint for the given reference', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: 'appointment-1', status: 'CANCELLED' } as never);

    const { result } = renderHook(() => useCancelAppointment(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.cancel('ANG-RDV-2026-001');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/appointments/ANG-RDV-2026-001/cancel');
  });

  it('surfaces the error message on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Déjà annulé'));

    const { result } = renderHook(() => useCancelAppointment(), { wrapper: withQueryClient() });

    await act(async () => {
      await expect(result.current.cancel('ANG-RDV-2026-001')).rejects.toThrow('Déjà annulé');
    });

    await waitFor(() => expect(result.current.error).toBe('Déjà annulé'));
  });
});
