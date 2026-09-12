import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGeneratePattern } from '../hooks/useGeneratePattern';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/api-client');

describe('useGeneratePattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates pattern and redirects to preview project screen', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'version-1',
      versionNumber: 1,
      projectId: 'proj-1',
    });

    const { result } = renderHook(() => useGeneratePattern('proj-1'), {
      wrapper: withQueryClient(),
    });

    act(() => {
      result.current.mutate({ measurements: { TOUR_POITRINE: 88 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/pattern-projects/proj-1/generate',
      { measurements: { TOUR_POITRINE: 88 } },
    );
    expect(mockPush).toHaveBeenCalledWith('/pattern-studio/projects/proj-1');
  });
});
