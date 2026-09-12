'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { PatternStatus } from '@angaly/types';
import { useInProgressProject } from '../hooks/useInProgressProject';

export const ResumeProjectBanner = () => {
  const { data: project, isLoading } = useInProgressProject();

  if (isLoading || !project) {
    return null;
  }

  const destinationUrl =
    project.status === PatternStatus.DRAFT && (!project.versions || project.versions.length === 0)
      ? `/pattern-studio/wizard/${project.id}`
      : `/pattern-studio/projects/${project.id}`;

  return (
    <div className="w-full bg-[#0C2650] border-b border-[#C5B190]/30 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 text-[#D8D3C8]">
          <span className="p-1.5 rounded-full bg-[#C5B190]/20 text-[#C5B190]">
            <Sparkles className="w-4 h-4" />
          </span>
          <span>
            Vous avez un projet en cours :{' '}
            <strong className="text-white font-medium">
              {project.projectRef} ({project.garmentType})
            </strong>
          </span>
        </div>
        <Link
          href={destinationUrl}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-xs uppercase tracking-wider font-semibold transition-colors"
        >
          <span>Reprendre mon projet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
