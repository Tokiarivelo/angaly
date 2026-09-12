import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatternVersion } from '../hooks/usePatternVersion';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');

const MOCK_PROJECT = {
  id: 'proj-123',
  projectRef: 'ANG-PAT-2026-00001',
  customerId: 'cust-1',
  garmentType: 'ROBE',
  status: PatternStatus.GENERATED,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  versions: [
    {
      id: 'ver-1',
      versionNumber: 1,
      projectId: 'proj-123',
      pieces: [
        {
          id: 'piece-1',
          name: 'Devant',
          versionId: 'ver-1',
          dimensionsJson: {},
          fabricRecommendation: 'Soie',
          quantity: 1,
          grainlineJson: null,
          seamAllowanceCm: 1.5,
          notchesJson: null,
        },
      ],
    },
  ],
};

describe('usePatternVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the pattern project detail', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECT);

    const { result } = renderHook(() => usePatternVersion('proj-123'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.projectRef).toBe('ANG-PAT-2026-00001');
    expect(result.current.data?.status).toBe(PatternStatus.GENERATED);
    expect(apiClient.get).toHaveBeenCalledWith('/api/pattern-projects/proj-123');
  });
});
