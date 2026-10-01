import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CreationProjectStage, type CreationProjectDto } from '@angaly/types';
import { useAdminCreationProjectsFilter } from '../hooks/useAdminCreationProjectsFilter';

const makeProject = (id: string, stage: CreationProjectStage): CreationProjectDto => ({
  id,
  reference: `CRP-2026-${id}`,
  title: `Projet ${id}`,
  customerName: `Client ${id}`,
  description: null,
  stage,
  quoteId: null,
  quoteNumber: null,
  creationId: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const sampleProjects: CreationProjectDto[] = [
  makeProject('1', CreationProjectStage.CONSULTATION),
  makeProject('2', CreationProjectStage.CONCEPTION),
  makeProject('3', CreationProjectStage.PATRON),
  makeProject('4', CreationProjectStage.CONFECTION),
  makeProject('5', CreationProjectStage.ESSAYAGE),
  makeProject('6', CreationProjectStage.CONSULTATION),
];

describe('useAdminCreationProjectsFilter', () => {
  it('computes accurate counts for all and each individual stage', () => {
    const { result } = renderHook(() => useAdminCreationProjectsFilter(sampleProjects));

    expect(result.current.counts.ALL).toBe(6);
    expect(result.current.counts.CONSULTATION).toBe(2);
    expect(result.current.counts.CONCEPTION).toBe(1);
    expect(result.current.counts.PATRON).toBe(1);
    expect(result.current.counts.CONFECTION).toBe(1);
    expect(result.current.counts.ESSAYAGE).toBe(1);
    expect(result.current.counts.TERMINEE).toBe(0);
  });

  it('filters projects by active stage and resets page to 1', () => {
    const { result } = renderHook(() => useAdminCreationProjectsFilter(sampleProjects, 2));

    expect(result.current.activeFilter).toBe('ALL');
    expect(result.current.filteredProjects).toHaveLength(6);

    act(() => {
      result.current.setActiveFilter(CreationProjectStage.CONSULTATION);
    });

    expect(result.current.activeFilter).toBe('CONSULTATION');
    expect(result.current.filteredProjects).toHaveLength(2);
    expect(result.current.currentPage).toBe(1);
  });

  it('paginates items correctly', () => {
    const { result } = renderHook(() => useAdminCreationProjectsFilter(sampleProjects, 2));

    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedProjects).toHaveLength(2);
    expect(result.current.startIndex).toBe(1);
    expect(result.current.endIndex).toBe(2);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.startIndex).toBe(3);
    expect(result.current.endIndex).toBe(4);
  });
});
