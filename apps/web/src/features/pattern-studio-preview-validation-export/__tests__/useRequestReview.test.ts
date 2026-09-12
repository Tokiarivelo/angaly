import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRequestReview } from '../hooks/useRequestReview';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');

describe('useRequestReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends request review mutation and updates status', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'proj-123',
      status: PatternStatus.REVIEW_REQUIRED,
    });

    const { result } = renderHook(() => useRequestReview('proj-123'), {
      wrapper: withQueryClient(),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/pattern-projects/proj-123/request-review',
    );
  });
});
