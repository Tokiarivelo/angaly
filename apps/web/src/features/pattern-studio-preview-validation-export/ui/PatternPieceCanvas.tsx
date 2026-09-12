import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sliders } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';
import type { CanvasViewMode } from '../types/pattern-piece-view.types';

interface PatternPieceCanvasProps {
  piece: PatternPieceDto | null;
  zoomLevel: number;
  viewMode: CanvasViewMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleViewMode: () => void;
}

export const PatternPieceCanvas: React.FC<PatternPieceCanvasProps> = ({
  piece,
  zoomLevel,
  viewMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleViewMode,
}) => {
  if (!piece) {
    return (
      <div className="flex-1 min-h-[400px] bg-[#0C2650] border border-[#C5B190]/20 rounded-xl flex items-center justify-center p-8 text-center text-[#D8D3C8]">
        Sélectionnez une pièce technique dans le panneau pour l’afficher.
      </div>
    );
  }

  // Parse geometry outlines or fallback to sample polygon in mm
  const dims = piece.dimensionsJson as {
    widthMm?: number;
    heightMm?: number;
    outlineMm?: Array<{ x: number; y: number }>;
  } | null;

  const points = dims?.outlineMm && dims.outlineMm.length >= 3
    ? dims.outlineMm.map((p) => `${p.x},${p.y}`).join(' ')
    : '50,40 150,40 180,240 20,240';

  const grainline = piece.grainlineJson as {
    angleDegrees?: number;
    originX?: number;
    originY?: number;
  } | null;

  return (
    <div className="flex-1 min-h-[440px] bg-[#041329] border border-[#C5B190]/30 rounded-xl p-6 relative flex flex-col justify-between overflow-hidden shadow-inner">
      {/* Canvas Top Controls & Metadata */}
      <div className="flex items-center justify-between z-10 text-xs text-[#D8D3C8]">
        <div className="flex items-center gap-2">
          <span className="text-white font-serif text-lg tracking-wide">{piece.name}</span>
          <span className="text-[#C5B190]/60">•</span>
          <span className="font-mono text-xs text-[#C5B190]">
            Zoom : {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        {/* View Mode Toggle */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:text-white hover:border-[#C5B190] transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="capitalize">
            {viewMode === 'technical' ? 'Vue technique' : 'Vue simplifiée'}
          </span>
        </button>
      </div>

      {/* Main SVG Render Area */}
      <div className="flex-1 flex items-center justify-center my-4 overflow-hidden relative">
        <svg
          viewBox="0 0 240 280"
          className="w-full max-h-[360px] transition-transform duration-200 select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle grid lines in technical mode */}
          {viewMode === 'technical' && (
            <defs>
              <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#C5B190" strokeWidth="0.2" opacity="0.15" />
              </pattern>
            </defs>
          )}
          {viewMode === 'technical' && (
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />
          )}

          {/* Outer piece outline */}
          <polygon
            points={points}
            className="stroke-[#C5B190] fill-[#0C2650]/50 stroke-[1.75]"
          />

          {/* Seam allowance dotted line (only in technical mode) */}
          {viewMode === 'technical' && (
            <polygon
              points={points}
              transform="scale(0.92) translate(10, 10)"
              className="stroke-white/40 stroke-1 stroke-dasharray-[4,4] fill-none"
            />
          )}

          {/* Grainline Arrow */}
          <line
            x1={grainline?.originX ?? 100}
            y1={grainline?.originY ?? 80}
            x2={grainline?.originX ?? 100}
            y2={(grainline?.originY ?? 80) + 120}
            className="stroke-[#C5B190] stroke-1"
          />
          <polygon
            points="97,85 100,75 103,85"
            className="fill-[#C5B190]"
          />
          <polygon
            points="97,195 100,205 103,195"
            className="fill-[#C5B190]"
          />

          {/* Grainline Label */}
          {viewMode === 'technical' && (
            <text
              x="106"
              y="145"
              fill="#C5B190"
              fontSize="8"
              fontFamily="sans-serif"
              letterSpacing="0.5"
            >
              DROIT-FIL
            </text>
          )}

          {/* Notch indicator */}
          <line x1="30" y1="130" x2="22" y2="130" className="stroke-[#936C3E] stroke-2" />
        </svg>
      </div>

      {/* Canvas Bottom Zoom Controls Bar */}
      <div className="flex items-center justify-between border-t border-[#C5B190]/20 pt-3 z-10">
        <span className="text-[11px] text-[#D8D3C8]/60 italic font-light">
          {viewMode === 'technical'
            ? 'Marges de couture 1.5 cm et droit-fil affichés'
            : 'Contour principal affiché'}
        </span>

        <div className="flex items-center gap-1.5 bg-[#0C2650] p-1 rounded-lg border border-[#C5B190]/20">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 text-[#D8D3C8] hover:text-[#C5B190] transition-colors rounded"
            title="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1.5 text-[#D8D3C8] hover:text-[#C5B190] transition-colors rounded"
            title="Réinitialiser"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 text-[#D8D3C8] hover:text-[#C5B190] transition-colors rounded"
            title="Zoom avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
