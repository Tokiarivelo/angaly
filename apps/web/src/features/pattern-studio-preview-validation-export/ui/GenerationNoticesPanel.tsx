import React from 'react';
import { AlertTriangle, Shirt, Ruler } from 'lucide-react';
import type { GenerationNotices } from '@/features/pattern-studio-wizard/utils/generation-notices';

interface GenerationNoticesPanelProps {
  notices: GenerationNotices;
}

/** What the customer must know about this pattern: warnings, how it is built, mannequin sheet, fabric. */
export const GenerationNoticesPanel: React.FC<GenerationNoticesPanelProps> = ({ notices }) => {
  const { warnings, approach, mannequinSheet, yardageMm } = notices;
  const isMannequin = approach?.id === 'FLAT_BASE_PLUS_MANNEQUIN' || approach?.id === 'MANNEQUIN_ONLY';
  if (warnings.length === 0 && !approach && !mannequinSheet && yardageMm === null) return null;

  return (
    <section aria-label="À savoir sur ce patron" className="w-full mb-6 space-y-4" data-testid="generation-notices">
      {approach && (
        <div className="bg-[#C5B190]/10 border border-[#C5B190]/40 rounded-xl p-4 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-[#C5B190]/20 text-[#C5B190] mt-0.5 shrink-0">
            <Shirt className="w-4 h-4" />
          </span>
          <div className="text-xs text-[#D8D3C8] leading-relaxed">
            <p className="text-white font-medium text-sm mb-1">Construction : {approach.label}</p>
            {approach.reason && <p>{approach.reason}</p>}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div role="alert" className="border border-amber-300/40 bg-amber-300/10 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-200" />
          <ul className="text-xs text-amber-50/90 space-y-1.5 list-disc pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {yardageMm !== null && (
        <p className="text-xs text-[#D8D3C8] flex items-center gap-2">
          <Ruler className="w-4 h-4 text-[#C5B190]" />
          <span>
            Métrage indicatif du patron à plat : environ {(yardageMm / 1000).toFixed(1).replace('.', ',')} m en 140 cm de
            laize (à confirmer par la couturière).
          </span>
        </p>
      )}

      {mannequinSheet && isMannequin && (
        <details className="bg-[#0C2650] border border-[#C5B190]/30 rounded-xl p-5" open>
          <summary className="cursor-pointer text-white font-serif text-lg">{mannequinSheet.title}</summary>
          <div className="mt-4 space-y-4">
            {mannequinSheet.sections.map((section) => (
              <div key={section.id}>
                <h3 className="text-[11px] uppercase tracking-wider text-[#C5B190] mb-1">{section.title}</h3>
                <p className="text-sm text-[#D8D3C8] leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
};
