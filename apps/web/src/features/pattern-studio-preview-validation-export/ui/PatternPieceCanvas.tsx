import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sliders } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';
import type { CanvasViewMode } from '../types/pattern-piece-view.types';
import { computePatternViewBox, toViewBoxAttribute } from '../utils/computePatternViewBox';
import { getBounds, openPolygon } from '../utils/pattern-geometry';
import { PatternPieceDrawing } from './PatternPieceDrawing';

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

  const outline =
    dims?.outlineMm && dims.outlineMm.length >= 3
      ? dims.outlineMm
      : [
          { x: 50, y: 40 },
          { x: 150, y: 40 },
          { x: 180, y: 240 },
          { x: 20, y: 240 },
        ];

  // Fit the SVG viewBox to the piece's real bounds — real generated pieces span mm coordinates far
  // beyond any fixed canvas size. The reserve leaves room for the cutting line, dimension lines and
  // the scale bar so nothing is clipped; zoom is applied by CSS only and never re-clips.
  const bounds = getBounds(openPolygon(outline));
  const longest = Math.max(bounds.width, bounds.height, 1);
  const unit = longest / 150;
  const allowanceMm = (piece.seamAllowanceCm ?? 0) * 10;
  const reserve = allowanceMm + unit * 26;
  const viewBox = computePatternViewBox(
    [
      ...outline,
      { x: bounds.minX - allowanceMm - unit * 6, y: bounds.minY - allowanceMm - unit * 6 },
      { x: bounds.maxX + reserve, y: bounds.maxY + reserve },
    ],
    0.04,
  );

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
      <div className="flex-1 flex items-center justify-center my-4 overflow-hidden relative min-h-[460px]">
        <svg
          data-testid="pattern-piece-svg"
          viewBox={toViewBoxAttribute(viewBox)}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-[460px] transition-transform duration-200 select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {viewMode === 'technical' && (
            <>
              <defs>
                <pattern id="canvas-grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#C5B190" strokeWidth={unit * 0.15} opacity="0.12" />
                </pattern>
                <pattern id="canvas-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#C5B190" strokeWidth={unit * 0.3} opacity="0.22" />
                </pattern>
              </defs>
              <rect
                x={viewBox.minX}
                y={viewBox.minY}
                width={viewBox.width}
                height={viewBox.height}
                fill="url(#canvas-grid-minor)"
              />
              <rect
                x={viewBox.minX}
                y={viewBox.minY}
                width={viewBox.width}
                height={viewBox.height}
                fill="url(#canvas-grid-major)"
              />
            </>
          )}

          <PatternPieceDrawing piece={piece} outline={outline} mode={viewMode} unit={unit} />
        </svg>
      </div>

      {/* Canvas Bottom Zoom Controls Bar */}
      <div className="flex items-center justify-between border-t border-[#C5B190]/20 pt-3 z-10">
        <span className="text-[11px] text-[#D8D3C8]/60 italic font-light">
          {viewMode === 'technical'
            ? `Trait plein : ligne de coupe${allowanceMm > 0 ? ` (marge ${allowanceMm / 10} cm)` : ''} · pointillé : ligne de couture · grille 1 cm / 10 cm`
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
