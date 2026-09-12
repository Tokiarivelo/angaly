import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInProgressProject } from '../hooks/useInProgressProject';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');

const MOCK_PROJECT = {
  id: 'proj-123',
  projectRef: 'ANG-PAT-2026-00001',
  customerId: 'cust-1',
  measurementProfileId: null,
  garmentType: 'ROBE',
  occasion: 'Mariage',
  style: 'Classique',
  cutType: 'Sirene',
  detailsJson: null,
  inspirationMediaId: null,
  status: PatternStatus.DRAFT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useInProgressProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the in-progress project', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([MOCK_PROJECT]);

    const { result } = renderHook(() => useInProgressProject(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(MOCK_PROJECT);
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/pattern-projects?mine=true'),
    );
  });

  it('returns null if no project in progress', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useInProgressProject(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});
