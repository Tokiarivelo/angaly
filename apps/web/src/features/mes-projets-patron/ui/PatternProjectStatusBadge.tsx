import React from 'react';
import type { PatternStatus } from '@angaly/types';
import { PATTERN_STATUS_CONFIG } from '../consts/pattern-status-labels.const';

interface PatternProjectStatusBadgeProps {
  status: PatternStatus;
}

export const PatternProjectStatusBadge: React.FC<PatternProjectStatusBadgeProps> = ({
  status,
}) => {
  const meta = PATTERN_STATUS_CONFIG[status] ?? {
    label: status,
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      <span>{meta.label}</span>
    </span>
  );
};
