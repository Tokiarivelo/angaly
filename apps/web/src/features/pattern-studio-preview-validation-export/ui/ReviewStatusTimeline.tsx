import React from 'react';
import { PatternStatus } from '@angaly/types';

interface ReviewStatusTimelineProps {
  status: PatternStatus;
}

const TIMELINE_STEPS = [
  { key: 'DRAFT', label: 'Brouillon' },
  { key: 'GENERATED', label: 'Génération' },
  { key: 'REVIEW_REQUIRED', label: 'À vérifier' },
  { key: 'CORRECTION_REQUIRED', label: 'Correction' },
  { key: 'VALIDATED', label: 'Validé' },
  { key: 'EXPORTED', label: 'Exporté' },
];

export const ReviewStatusTimeline: React.FC<ReviewStatusTimelineProps> = ({ status }) => {
  const getStepIndex = (s: PatternStatus): number => {
    switch (s) {
      case PatternStatus.DRAFT:
        return 0;
      case PatternStatus.GENERATING:
      case PatternStatus.GENERATED:
        return 1;
      case PatternStatus.REVIEW_REQUIRED:
        return 2;
      case PatternStatus.CORRECTION_REQUIRED:
        return 3;
      case PatternStatus.VALIDATED:
        return 4;
      case PatternStatus.EXPORTED:
      case PatternStatus.ARCHIVED:
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full bg-[#0C2650]/60 border border-[#C5B190]/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-[90px]">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    isCurrent
                      ? 'bg-[#C5B190] border-white ring-4 ring-[#C5B190]/30'
                      : isCompleted
                      ? 'bg-[#C5B190] border-[#C5B190]'
                      : 'bg-[#041329] border-[#C5B190]/30'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1.5 font-medium tracking-wide whitespace-nowrap ${
                    isCurrent
                      ? 'text-white font-semibold'
                      : isCompleted
                      ? 'text-[#C5B190]'
                      : 'text-[#D8D3C8]/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-full flex-1 -mt-4 transition-colors ${
                    idx < currentIndex ? 'bg-[#C5B190]' : 'bg-[#0C2650]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
