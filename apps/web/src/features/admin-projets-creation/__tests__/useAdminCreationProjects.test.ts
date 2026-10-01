import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage } from '@angaly/types';
import { useAdminCreationProjects } from '../hooks/useAdminCreationProjects';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const MOCK_PROJECTS = [
  {
    id: 'p-1',
    reference: 'CRP-2026-K3f9a01x',
    title: 'Robe de mariée dentelle ivoire',
    customerName: 'Éléonore de Saint-Germain',
    description: null,
    stage: CreationProjectStage.CONSULTATION,
    quoteId: 'q-1',
    quoteNumber: 'ANG-DEV-2026-014',
    creationId: null,
    completedAt: null,
    createdAt: '2026-01-14T10:00:00.000Z',
    updatedAt: '2026-01-14T10:00:00.000Z',
  },
];

describe('useAdminCreationProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all creation projects from admin endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECTS);

    const { result } = renderHook(() => useAdminCreationProjects(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.projects).toEqual(MOCK_PROJECTS);
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects');
  });

  it('supports passing a stage query filter', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECTS);

    const { result } = renderHook(
      () => useAdminCreationProjects(CreationProjectStage.CONSULTATION),
      { wrapper: withQueryClient() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects?stage=CONSULTATION');
  });

  it('calls updateStage to advance stage and invalidates queries', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(MOCK_PROJECTS);
    const updated = { ...MOCK_PROJECTS[0], stage: CreationProjectStage.CONCEPTION };
    vi.mocked(apiClient.patch).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useAdminCreationProjects(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateStage({
        id: 'p-1',
        stage: CreationProjectStage.CONCEPTION,
      });
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/stage', {
      stage: CreationProjectStage.CONCEPTION,
    });
  });
});
