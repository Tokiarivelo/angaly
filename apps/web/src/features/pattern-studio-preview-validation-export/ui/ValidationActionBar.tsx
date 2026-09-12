import React from 'react';
import Link from 'next/link';
import { Settings, ShieldCheck, Loader2 } from 'lucide-react';
import { PatternStatus } from '@angaly/types';

interface ValidationActionBarProps {
  projectId: string;
  status: PatternStatus;
  isSubmittingReview: boolean;
  onRequestReview: () => void;
}

export const ValidationActionBar: React.FC<ValidationActionBarProps> = ({
  projectId,
  status,
  isSubmittingReview,
  onRequestReview,
}) => {
  const canRequestReview =
    status === PatternStatus.GENERATED ||
    status === PatternStatus.DRAFT ||
    status === PatternStatus.CORRECTION_REQUIRED;

  return (
    <div className="w-full bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <Link
        href={`/pattern-studio/wizard/${projectId}`}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded border border-[#C5B190] text-[#C5B190] hover:bg-[#C5B190]/10 text-xs uppercase tracking-wider font-semibold transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span>Modifier les paramètres</span>
      </Link>

      {canRequestReview && (
        <button
          type="button"
          onClick={onRequestReview}
          disabled={isSubmittingReview}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-xs uppercase tracking-wider font-semibold transition-all shadow-lg hover:shadow-[#936C3E]/20 disabled:opacity-50"
        >
          {isSubmittingReview ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transmission à l’atelier…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Faire vérifier mon patron par Angaly</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
