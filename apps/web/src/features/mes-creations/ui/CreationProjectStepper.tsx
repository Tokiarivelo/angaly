import { Check } from 'lucide-react';
import type { CreationProjectStage } from '@angaly/types';
import { CREATION_PROJECT_STAGE_LABELS } from '../consts/creation-project-stage-labels.const';
import { getCreationStepStates, type CreationStepState } from '../hooks/useCreationProjects';

const STEP_CAPTIONS: Record<CreationStepState, string> = {
  done: 'Validée',
  current: 'En cours',
  upcoming: 'En attente',
};

export function CreationProjectStepper({ stage }: { stage: CreationProjectStage }) {
  const steps = getCreationStepStates(stage);
  return (
    <ol className="relative flex items-start justify-between" aria-label="Avancement du projet">
      <div aria-hidden className="absolute left-6 right-6 top-4 h-px bg-angaly-border" />
      {steps.map(({ stage: step, state }, index) => (
        <li key={step} className="relative z-10 flex flex-col items-center" aria-current={state === 'current' ? 'step' : undefined}>
          <span
            className={
              state === 'done'
                ? 'flex h-8 w-8 items-center justify-center rounded-full bg-angaly-navy text-white ring-4 ring-white'
                : state === 'current'
                  ? 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-angaly-gold bg-white ring-4 ring-white'
                  : 'flex h-8 w-8 items-center justify-center rounded-full border border-angaly-border bg-white text-xs text-angaly-warm-gray ring-4 ring-white'
            }
          >
            {state === 'done' ? (
              <Check className="h-4 w-4" />
            ) : state === 'current' ? (
              <span className="h-2.5 w-2.5 rounded-full bg-angaly-gold" />
            ) : (
              index + 1
            )}
          </span>
          <span className={state === 'upcoming' ? 'mt-2 text-xs text-angaly-warm-gray' : 'mt-2 text-xs font-semibold text-angaly-navy'}>
            {CREATION_PROJECT_STAGE_LABELS[step]}
          </span>
          <span
            className={
              state === 'done' ? 'text-[10px] font-medium text-angaly-success' : state === 'current' ? 'text-[10px] font-medium italic text-angaly-gold' : 'text-[10px] text-angaly-warm-gray'
            }
          >
            {STEP_CAPTIONS[state]}
          </span>
        </li>
      ))}
    </ol>
  );
}
