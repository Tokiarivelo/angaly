import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CREATION_PROJECT_STAGES_ORDER, type CreationProjectStage } from '@angaly/types';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';

interface CreationProjectStepperProps {
  currentStage: CreationProjectStage;
  selectedStage?: CreationProjectStage;
  onSelectStage?: (stage: CreationProjectStage) => void;
  nextStage?: CreationProjectStage | null;
  onGoToNextStage?: () => Promise<unknown>;
  isAdvancing?: boolean;
}

export const CreationProjectStepper: React.FC<CreationProjectStepperProps> = ({
  currentStage,
  selectedStage,
  onSelectStage,
  nextStage,
  onGoToNextStage,
  isAdvancing = false,
}) => {
  const currentIndex = CREATION_PROJECT_STAGES_ORDER.indexOf(currentStage);

  return (
    <div className="space-y-6">
      <ol aria-label="Étapes du projet" className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {CREATION_PROJECT_STAGES_ORDER.map((stage, index) => {
          const isDone = index < currentIndex || (stage === currentStage && index === CREATION_PROJECT_STAGES_ORDER.length - 1);
          const isCurrent = index === currentIndex && !isDone;
          const isSelected = selectedStage === stage;

          const content = (
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <span
                className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-headline transition-all ${
                  isDone
                    ? 'bg-[#46745A] border-[#46745A] text-white'
                    : isCurrent
                      ? 'bg-[#936C3E] border-[#936C3E] text-white ring-2 ring-[#936C3E]/30 ring-offset-2'
                      : 'bg-white border-[#D9D4CA] text-[#8A877F]'
                } ${isSelected ? 'outline outline-2 outline-[#936C3E] outline-offset-2' : ''}`}
              >
                {isDone ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={`text-[11px] uppercase tracking-wider font-headline ${
                  isCurrent
                    ? 'text-[#936C3E] font-semibold'
                    : isSelected
                      ? 'text-[#061938] font-medium'
                      : 'text-[#5C697A]'
                }`}
              >
                {ADMIN_CREATION_STAGE_LABELS[stage]}
              </span>
            </div>
          );

          return (
            <li
              key={stage}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex justify-center"
            >
              {onSelectStage ? (
                <button
                  type="button"
                  onClick={() => onSelectStage(stage)}
                  title={`Voir les détails de l'étape ${ADMIN_CREATION_STAGE_LABELS[stage]}`}
                  className="w-full flex justify-center hover:opacity-90 transition-opacity focus:outline-none"
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>

      {/* Barre d'action rapide : Passage à l'étape suivante */}
      {onGoToNextStage && (
        <div className="pt-4 border-t border-[#D9D4CA]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#5C697A] flex items-center gap-2">
            <span>Étape active :</span>
            <span className="font-semibold text-[#061938] px-2 py-0.5 bg-[#F6F2E9] border border-[#D9D4CA] rounded-sm">
              {ADMIN_CREATION_STAGE_LABELS[currentStage]}
            </span>
          </div>

          {nextStage ? (
            <button
              type="button"
              onClick={() => void onGoToNextStage()}
              disabled={isAdvancing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-headline uppercase tracking-wider font-semibold bg-[#061938] text-white hover:bg-[#0C2650] rounded-sm border border-[#936C3E] transition-colors disabled:opacity-50 shadow-sm"
            >
              {isAdvancing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Passage en cours…</span>
                </>
              ) : (
                <>
                  <span>Passer à l&apos;étape suivante : {ADMIN_CREATION_STAGE_LABELS[nextStage]}</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#46745A] font-semibold bg-[#EBF3EE] border border-[#BDD7C6] rounded-sm">
              <Check size={14} aria-hidden="true" />
              Projet terminé et validé
            </span>
          )}
        </div>
      )}
    </div>
  );
};
