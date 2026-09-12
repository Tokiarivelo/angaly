import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatternProjects } from '../hooks/usePatternProjects';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternStatus } from '@angaly/types';

vi.mock('@/lib/api-client');

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    projectRef: 'ANG-PAT-2026-00001',
    customerId: 'cust-1',
    garmentType: 'ROBE',
    status: PatternStatus.GENERATED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('usePatternProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the user pattern projects', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECTS);

    const { result } = renderHook(() => usePatternProjects(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(MOCK_PROJECTS);
    expect(apiClient.get).toHaveBeenCalledWith('/api/pattern-projects?mine=true');
  });
});
