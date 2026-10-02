import React from 'react';
import { Check } from 'lucide-react';
import { CREATION_PROJECT_STAGES_ORDER, type CreationProjectStage } from '@angaly/types';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';

interface CreationProjectStepperProps {
  currentStage: CreationProjectStage;
}

export const CreationProjectStepper: React.FC<CreationProjectStepperProps> = ({ currentStage }) => {
  const currentIndex = CREATION_PROJECT_STAGES_ORDER.indexOf(currentStage);

  return (
    <ol aria-label="Étapes du projet" className="grid grid-cols-3 sm:grid-cols-6 gap-4">
      {CREATION_PROJECT_STAGES_ORDER.map((stage, index) => {
        const isDone = index < currentIndex || (stage === currentStage && index === CREATION_PROJECT_STAGES_ORDER.length - 1);
        const isCurrent = index === currentIndex && !isDone;
        return (
          <li
            key={stage}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-headline ${
                isDone
                  ? 'bg-[#46745A] border-[#46745A] text-white'
                  : isCurrent
                    ? 'bg-[#936C3E] border-[#936C3E] text-white'
                    : 'bg-white border-[#D9D4CA] text-[#8A877F]'
              }`}
            >
              {isDone ? <Check size={14} aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={`text-[11px] uppercase tracking-wider font-headline ${
                isCurrent ? 'text-[#936C3E] font-semibold' : 'text-[#5C697A]'
              }`}
            >
              {ADMIN_CREATION_STAGE_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
