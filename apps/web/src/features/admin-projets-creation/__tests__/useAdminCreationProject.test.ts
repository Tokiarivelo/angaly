import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage, Role } from '@angaly/types';
import { useAdminCreationProject } from '../hooks/useAdminCreationProject';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const DETAIL = {
  id: 'p-1',
  reference: 'CRP-2026-K3f9a01x',
  title: 'Robe de mariée',
  description: null,
  stage: CreationProjectStage.PATRON,
  quoteId: null,
  quoteNumber: null,
  creationId: null,
  completedAt: null,
  assignedTo: null,
  stageHistory: [],
  createdAt: '2026-01-14T10:00:00.000Z',
  updatedAt: '2026-01-14T10:00:00.000Z',
};
const STAFF = [{ id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE }];

describe('useAdminCreationProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/assignees') ? STAFF : DETAIL),
    );
  });

  it('fetches the project detail and the assignable staff', async () => {
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.project).toEqual(DETAIL));
    await waitFor(() => expect(result.current.assignees).toEqual(STAFF));
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects/p-1');
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects/assignees');
  });

  it('assigns a staff member via PATCH /assignee', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.assign('u-2');
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/assignee', { userId: 'u-2' });
  });

  it('unassigns with a null userId', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.assign(null);
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/assignee', { userId: null });
  });

  it('updates the stage via PATCH /stage', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateStage(CreationProjectStage.CONFECTION);
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/stage', {
      stage: CreationProjectStage.CONFECTION,
    });
  });
});
