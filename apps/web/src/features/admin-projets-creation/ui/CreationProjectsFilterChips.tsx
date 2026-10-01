'use client';

import React from 'react';
import {
  ADMIN_CREATION_STAGE_LABELS,
  FILTER_CHIP_STAGES,
  type FilterChipStage,
} from '../consts/stage-config.const';

interface CreationProjectsFilterChipsProps {
  activeFilter: FilterChipStage;
  onFilterChange: (stage: FilterChipStage) => void;
  counts: Record<FilterChipStage, number>;
}

export const CreationProjectsFilterChips: React.FC<CreationProjectsFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filtres par étape"
      className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-[#D9D4CA]"
    >
      {FILTER_CHIP_STAGES.map((stage) => {
        const isActive = activeFilter === stage;
        const label = stage === 'ALL' ? 'Tous' : ADMIN_CREATION_STAGE_LABELS[stage];
        const count = counts[stage] ?? 0;

        return (
          <button
            key={stage}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(stage)}
            className={`px-4 py-2 text-xs font-headline tracking-wider uppercase rounded-sm flex items-center gap-2 transition-colors shrink-0 ${
              isActive
                ? 'bg-[#061938] text-white shadow-sm'
                : 'bg-[#D8D3C8]/60 hover:bg-[#D8D3C8] text-[#061938] opacity-90'
            }`}
          >
            <span>{label}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                isActive
                  ? 'bg-[#18375D] text-[#F6F2E9]'
                  : 'bg-[#D9D4CA] text-[#061938]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
