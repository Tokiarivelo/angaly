import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOpenPatternProject, resolveProjectRoute } from '../hooks/useOpenPatternProject';
import { PatternStatus } from '@angaly/types';
import type { PatternProjectDto } from '@angaly/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useOpenPatternProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes draft project without versions to wizard', () => {
    const draftProject: PatternProjectDto = {
      id: 'proj-draft',
      projectRef: 'ANG-PAT-2026-00001',
      customerId: 'c-1',
      garmentType: 'ROBE',
      occasion: null,
      style: null,
      cutType: null,
      detailsJson: null,
      inspirationMediaId: null,
      measurementProfileId: null,
      status: PatternStatus.DRAFT,
      versions: [],
      createdAt: '',
      updatedAt: '',
    };

    expect(resolveProjectRoute(draftProject)).toBe('/pattern-studio/wizard/proj-draft');
  });

  it('routes generated or reviewed project to studio preview', () => {
    const generatedProject: PatternProjectDto = {
      id: 'proj-gen',
      projectRef: 'ANG-PAT-2026-00002',
      customerId: 'c-1',
      garmentType: 'JUPE',
      occasion: null,
      style: null,
      cutType: null,
      detailsJson: null,
      inspirationMediaId: null,
      measurementProfileId: null,
      status: PatternStatus.GENERATED,
      versions: [{ id: 'v-1' } as any],
      createdAt: '',
      updatedAt: '',
    };

    expect(resolveProjectRoute(generatedProject)).toBe('/pattern-studio/projects/proj-gen');

    const { result } = renderHook(() => useOpenPatternProject());
    act(() => {
      result.current.openProject(generatedProject);
    });

    expect(mockPush).toHaveBeenCalledWith('/pattern-studio/projects/proj-gen');
  });
});
