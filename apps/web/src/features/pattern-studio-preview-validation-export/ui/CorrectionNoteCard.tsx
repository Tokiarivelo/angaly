import React from 'react';
import Link from 'next/link';
import { AlertCircle, Edit3, User } from 'lucide-react';

interface CorrectionNoteCardProps {
  projectId: string;
  note?: string | null | undefined;
}

export const CorrectionNoteCard: React.FC<CorrectionNoteCardProps> = ({
  projectId,
  note,
}) => {
  return (
    <div className="w-full bg-[#A64A43]/15 border border-[#A64A43]/40 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-[#A64A43]/20 text-[#ff9991] mt-0.5 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-white font-medium text-sm">
              Une correction a été demandée par votre couturière Angaly
            </h3>
            <div className="mt-2 p-3.5 rounded-lg bg-[#041329]/80 border border-[#A64A43]/20 text-xs text-[#D8D3C8] leading-relaxed">
              <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[#C5B190]">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold">Atelier Angaly — Note de révision :</span>
              </div>
              <p>
                {note ??
                  'Veuillez vérifier le tour de hanches et la longueur souhaitée pour garantir un tombé optimal sur ce tissu fluide.'}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/pattern-studio/wizard/${projectId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-xs uppercase tracking-wider font-semibold transition-colors shrink-0 self-end sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Modifier mon projet</span>
        </Link>
      </div>
    </div>
  );
};
