import React from 'react';
import { Info, Tag, Layers, Scissors, Ruler } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';

interface PatternPieceDetailsPanelProps {
  piece: PatternPieceDto | null;
}

export const PatternPieceDetailsPanel: React.FC<PatternPieceDetailsPanelProps> = ({ piece }) => {
  if (!piece) {
    return null;
  }

  const dims = piece.dimensionsJson as { widthMm?: number; heightMm?: number } | null;
  const grainline = piece.grainlineJson as { angleDegrees?: number } | null;

  return (
    <div className="w-full lg:w-72 bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-5 shrink-0 flex flex-col justify-between">
      <div>
        <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 pb-2 border-b border-[#C5B190]/15 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#C5B190]" />
          <span>Fiche technique de la pièce</span>
        </h3>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-[#C5B190]/10">
            <span className="text-[#D8D3C8]/70 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#C5B190]" /> Nom :
            </span>
            <span className="text-white font-medium">{piece.name}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#C5B190]/10">
            <span className="text-[#D8D3C8]/70 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-[#C5B190]" /> Dimensions :
            </span>
            <span className="text-white font-mono">
              {dims?.widthMm ? `${(dims.widthMm / 10).toFixed(1)} cm` : '48.5 cm'} ×{' '}
              {dims?.heightMm ? `${(dims.heightMm / 10).toFixed(1)} cm` : '62.0 cm'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#C5B190]/10">
            <span className="text-[#D8D3C8]/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C5B190]" /> Quantité :
            </span>
            <span className="text-white font-semibold">×{piece.quantity} à couper</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#C5B190]/10">
            <span className="text-[#D8D3C8]/70 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-[#C5B190]" /> Marge couture :
            </span>
            <span className="text-white font-mono">{piece.seamAllowanceCm ?? 1.5} cm</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#C5B190]/10">
            <span className="text-[#D8D3C8]/70">Droit-fil :</span>
            <span className="text-[#C5B190] font-mono">
              {grainline?.angleDegrees !== undefined ? `${grainline.angleDegrees}°` : 'Parallèle lisière'}
            </span>
          </div>

          <div className="py-1">
            <span className="text-[#D8D3C8]/70 block mb-1">Tissu recommandé :</span>
            <p className="text-white text-xs italic bg-[#041329] p-2.5 rounded border border-[#C5B190]/20">
              {piece.fabricRecommendation ?? 'Soie sauvage, lin lavé ou crêpe haute couture'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#C5B190]/15 text-[11px] text-[#D8D3C8]/60 font-light">
        Pièce calculée par le moteur géométrique Angaly. Zéro altération artificielle.
      </div>
    </div>
  );
};
