import { renderHook, waitFor } from '@testing-library/react';
import { useAcceptQuote } from '../hooks/useAcceptQuote';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { QuoteStatus } from '@angaly/types';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/api-client');

describe('useAcceptQuote', () => {
  it('should accept a quote', async () => {
    const mockAcceptedQuote = { status: QuoteStatus.ACCEPTED };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockAcceptedQuote as any);

    const { result } = renderHook(() => useAcceptQuote(), { wrapper: withQueryClient() });

    result.current.mutate('ANG-DEV-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAcceptedQuote);
    expect(apiClient.post).toHaveBeenCalledWith('/api/quotes/ANG-DEV-123/accept');
  });
});
