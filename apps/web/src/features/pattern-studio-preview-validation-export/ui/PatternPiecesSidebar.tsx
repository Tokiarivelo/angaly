import React from 'react';
import { Scissors, Layers } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';

interface PatternPiecesSidebarProps {
  pieces: PatternPieceDto[];
  selectedPieceId: string | null;
  onSelectPiece: (pieceId: string) => void;
}

export const PatternPiecesSidebar: React.FC<PatternPiecesSidebarProps> = ({
  pieces,
  selectedPieceId,
  onSelectPiece,
}) => {
  return (
    <aside className="w-full lg:w-64 bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-4 shrink-0">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#C5B190]/15">
        <h2 className="text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#C5B190]" />
          <span>Pièces du patron ({pieces.length})</span>
        </h2>
      </div>

      {/* Responsive list: horizontal chips on mobile, vertical list on desktop */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
        {pieces.map((piece) => {
          const isSelected = selectedPieceId === piece.id;

          return (
            <button
              key={piece.id}
              type="button"
              onClick={() => onSelectPiece(piece.id)}
              className={`text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between gap-3 shrink-0 whitespace-nowrap lg:whitespace-normal ${
                isSelected
                  ? 'bg-[#041329] text-white border-l-4 border-l-[#C5B190] border-t border-r border-b border-t-[#C5B190]/30 border-r-[#C5B190]/30 border-b-[#C5B190]/30 font-semibold'
                  : 'bg-[#041329]/40 text-[#D8D3C8] hover:bg-[#041329]/80 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#C5B190]" />
                <span className="truncate">{piece.name}</span>
              </div>
              <span className="text-[10px] text-[#C5B190]/80 font-mono bg-[#0C2650] px-1.5 py-0.5 rounded">
                ×{piece.quantity}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
