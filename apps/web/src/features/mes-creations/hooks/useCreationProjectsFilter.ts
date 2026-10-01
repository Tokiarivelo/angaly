import { useMemo, useState } from 'react';
import { CreationProjectStage, type CreationProjectDto } from '@angaly/types';

export type CreationProjectFilter = 'all' | 'in-progress' | 'done';

export const formatCreationDate = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export const useCreationProjectsFilter = (projects: CreationProjectDto[]) => {
  const [filter, setFilter] = useState<CreationProjectFilter>('all');

  const counts = useMemo(() => {
    const done = projects.filter((p) => p.stage === CreationProjectStage.TERMINEE).length;
    return { all: projects.length, done, 'in-progress': projects.length - done };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => (p.stage === CreationProjectStage.TERMINEE) === (filter === 'done'));
  }, [projects, filter]);

  return { filter, setFilter, counts, visibleProjects };
};
