'use client';

import { useMemo, useState } from 'react';
import {
  type CreationProjectDto,
  CreationProjectStage,
} from '@angaly/types';
import type { FilterChipStage } from '../consts/stage-config.const';

export function useAdminCreationProjectsFilter(
  projects: CreationProjectDto[],
  initialPageSize = 10,
) {
  const [activeFilter, setActiveFilter] = useState<FilterChipStage>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const counts = useMemo(() => {
    const map: Record<FilterChipStage, number> = {
      ALL: projects.length,
      [CreationProjectStage.CONSULTATION]: 0,
      [CreationProjectStage.CONCEPTION]: 0,
      [CreationProjectStage.PATRON]: 0,
      [CreationProjectStage.CONFECTION]: 0,
      [CreationProjectStage.ESSAYAGE]: 0,
      [CreationProjectStage.TERMINEE]: 0,
    };

    for (const project of projects) {
      if (project.stage && map[project.stage] !== undefined) {
        map[project.stage] += 1;
      }
    }

    return map;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'ALL') {
      return projects;
    }
    return projects.filter((project) => project.stage === activeFilter);
  }, [projects, activeFilter]);

  const totalProjects = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalProjects / initialPageSize));

  // Reset to page 1 if filter changes or current page exceeds total
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (safePage - 1) * initialPageSize;
    return filteredProjects.slice(start, start + initialPageSize);
  }, [filteredProjects, safePage, initialPageSize]);

  const handleFilterChange = (stage: FilterChipStage) => {
    setActiveFilter(stage);
    setCurrentPage(1);
  };

  const startIndex = totalProjects === 0 ? 0 : (safePage - 1) * initialPageSize + 1;
  const endIndex = Math.min(safePage * initialPageSize, totalProjects);

  return {
    activeFilter,
    setActiveFilter: handleFilterChange,
    counts,
    filteredProjects,
    paginatedProjects,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    totalProjects,
    startIndex,
    endIndex,
  };
}
