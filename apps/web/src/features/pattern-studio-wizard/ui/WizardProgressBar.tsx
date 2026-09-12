import React from 'react';
import { WIZARD_STEPS } from '../types/wizard-state.types';

interface WizardProgressBarProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  onSelectStep,
}) => {
  return (
    <div className="w-full py-4 border-b border-[#C5B190]/20 bg-[#041329]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Mobile View: Compact step label + thin bar */}
        <div className="sm:hidden flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#C5B190] font-medium tracking-wider uppercase">
              Étape {currentStep} / {WIZARD_STEPS.length}
            </span>
            <span className="text-white font-serif">
              {WIZARD_STEPS[currentStep - 1]?.label}
            </span>
          </div>
          <div className="w-full h-1 bg-[#0C2650] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C5B190] transition-all duration-300"
              style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop View: 7 labeled horizontal segments */}
        <div className="hidden sm:grid grid-cols-7 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.index < currentStep;
            const isCurrent = step.index === currentStep;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => isCompleted && onSelectStep?.(step.index)}
                disabled={!isCompleted}
                className={`flex flex-col items-center gap-1.5 group text-left transition-all ${
                  isCompleted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Segment indicator bar */}
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#C5B190]'
                      : isCurrent
                      ? 'bg-white ring-2 ring-[#C5B190]/50'
                      : 'bg-[#0C2650]'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium tracking-wider truncate w-full text-center ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-[#C5B190]'
                      : 'text-[#D8D3C8]/40'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
