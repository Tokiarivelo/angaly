'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { PatternProjectDto } from '@angaly/types';
import { PatternStatus } from '@angaly/types';

export const resolveProjectRoute = (project: PatternProjectDto): string => {
  const isDraft =
    project.status === PatternStatus.DRAFT ||
    project.status === ('DRAFT' as PatternStatus);

  if (isDraft) {
    return `/pattern-studio/wizard/${project.id}`;
  }

  return `/pattern-studio/projects/${project.id}`;
};

export const useOpenPatternProject = () => {
  const router = useRouter();

  const openProject = useCallback(
    (project: PatternProjectDto) => {
      const destination = resolveProjectRoute(project);
      router.push(destination);
    },
    [router],
  );

  return {
    openProject,
    resolveProjectRoute,
  };
};
