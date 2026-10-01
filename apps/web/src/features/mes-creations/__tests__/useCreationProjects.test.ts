import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage } from '@angaly/types';
import { getCreationStepStates, useCreationProjects } from '../hooks/useCreationProjects';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const MOCK_PROJECTS = [
  {
    id: 'p-1',
    reference: 'CRP-2026-abc12345',
    title: 'Robe de mariée',
    description: null,
    stage: CreationProjectStage.CONFECTION,
    quoteId: 'q-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    creationId: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('useCreationProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the customer creation projects', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_PROJECTS);

    const { result } = renderHook(() => useCreationProjects(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_PROJECTS);
    expect(apiClient.get).toHaveBeenCalledWith('/api/creation-projects');
  });

  it('unwraps a { data } envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: MOCK_PROJECTS });

    const { result } = renderHook(() => useCreationProjects(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_PROJECTS);
  });
});

describe('getCreationStepStates', () => {
  it('marks previous steps done, the current one current and the rest upcoming', () => {
    const states = getCreationStepStates(CreationProjectStage.CONFECTION).map((s) => s.state);
    expect(states).toEqual(['done', 'done', 'done', 'current', 'upcoming', 'upcoming']);
  });

  it('marks every step done once TERMINEE is reached', () => {
    const states = getCreationStepStates(CreationProjectStage.TERMINEE).map((s) => s.state);
    expect(states).toEqual(['done', 'done', 'done', 'done', 'done', 'done']);
  });

  it('starts at CONSULTATION with the first step current', () => {
    const states = getCreationStepStates(CreationProjectStage.CONSULTATION).map((s) => s.state);
    expect(states[0]).toBe('current');
    expect(states.slice(1).every((s) => s === 'upcoming')).toBe(true);
  });
});
