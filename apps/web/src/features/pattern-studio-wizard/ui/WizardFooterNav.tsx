import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface WizardFooterNavProps {
  currentStep: number;
  totalSteps?: number;
  isValid: boolean;
  isSubmitting?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export const WizardFooterNav: React.FC<WizardFooterNavProps> = ({
  currentStep,
  totalSteps = 7,
  isValid,
  isSubmitting = false,
  onPrevious,
  onNext,
  nextLabel,
}) => {
  const isFinalStep = currentStep === totalSteps;

  return (
    <div className="w-full mt-10 pt-6 border-t border-[#C5B190]/20 flex items-center justify-between gap-4">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[#C5B190] text-[#C5B190] hover:bg-[#C5B190]/10 text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!isValid || isSubmitting}
        className={`inline-flex items-center gap-2 px-8 py-3 rounded text-xs uppercase tracking-wider font-semibold transition-all ${
          isFinalStep
            ? 'bg-[#936C3E] text-white hover:bg-[#B59A70] shadow-lg shadow-[#936C3E]/20'
            : 'bg-[#936C3E] text-white hover:bg-[#B59A70]'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Traitement…</span>
          </>
        ) : isFinalStep ? (
          <>
            <Sparkles className="w-4 h-4" />
            <span>{nextLabel ?? 'Générer mon patron'}</span>
          </>
        ) : (
          <>
            <span>{nextLabel ?? 'Continuer'}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};
