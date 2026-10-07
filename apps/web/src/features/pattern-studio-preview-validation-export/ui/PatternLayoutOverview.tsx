import React from 'react';
import type { PatternPieceDto } from '@angaly/types';
import { PatternPieceDrawing } from './PatternPieceDrawing';
import {
  formatCm,
  getBounds,
  layoutBoxes,
  offsetPolygon,
  openPolygon,
  polygonAreaCm2,
  type Point,
} from '../utils/pattern-geometry';

interface PatternLayoutOverviewProps {
  pieces: PatternPieceDto[];
  selectedPieceId: string | null;
  onSelectPiece: (id: string) => void;
}

interface Prepared {
  piece: PatternPieceDto;
  outline: Point[];
  width: number;
  height: number;
  minX: number;
  minY: number;
}

const outlineOf = (piece: PatternPieceDto): Point[] | null => {
  const outline = (piece.dimensionsJson as { outlineMm?: Point[] } | null)?.outlineMm;
  return outline && outline.length >= 3 ? outline : null;
};

/**
 * All pieces on one sheet at the SAME scale, so the couturière sees relative sizes, cutting counts and the
 * total fabric footprint at a glance.
 */
export const PatternLayoutOverview: React.FC<PatternLayoutOverviewProps> = ({
  pieces,
  selectedPieceId,
  onSelectPiece,
}) => {
  const prepared: Prepared[] = pieces.flatMap((piece) => {
    const outline = outlineOf(piece);
    if (!outline) return [];
    const polygon = openPolygon(outline);
    const bounds = getBounds(offsetPolygon(polygon, (piece.seamAllowanceCm ?? 0) * 10));
    return [{ piece, outline, width: bounds.width, height: bounds.height, minX: bounds.minX, minY: bounds.minY }];
  });

  if (prepared.length === 0) {
    return (
      <div className="flex-1 min-h-[400px] bg-[#0C2650] border border-[#C5B190]/20 rounded-xl flex items-center justify-center p-8 text-center text-[#D8D3C8]">
        Aucune pièce avec un tracé à afficher.
      </div>
    );
  }

  const gap = 90;
  const totalArea = prepared.reduce((sum, p) => sum + polygonAreaCm2(openPolygon(p.outline)) * p.piece.quantity, 0);
  const widest = Math.max(...prepared.map((p) => p.width));
  const maxRowWidth = Math.max(widest, Math.sqrt(prepared.reduce((s, p) => s + p.width * p.height, 0)) * 1.8);
  const { placed, width, height } = layoutBoxes(
    prepared.map((p) => ({ item: p, width: p.width, height: p.height + 95 })),
    maxRowWidth,
    gap,
  );
  const unit = Math.max(width, height) / 190;
  const margin = gap * 0.6;

  return (
    <div className="flex-1 min-h-[440px] bg-[#041329] border border-[#C5B190]/30 rounded-xl p-4 sm:p-6 flex flex-col gap-3">
      <div className="flex items-baseline justify-between text-xs text-[#D8D3C8]">
        <span className="text-white font-serif text-lg">Vue d’ensemble des pièces</span>
        <span>
          {prepared.length} pièces · surface à découper ≈ {(totalArea / 10000).toFixed(2).replace('.', ',')} m² (hors
          marges)
        </span>
      </div>
      <svg
        data-testid="pattern-overview-svg"
        viewBox={`${-margin} ${-margin} ${width + margin * 2} ${height + margin * 2}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-h-[520px]"
        role="group"
        aria-label="Toutes les pièces du patron à la même échelle"
      >
        {placed.map(({ item, x, y }) => {
          const selected = item.piece.id === selectedPieceId;
          return (
            <g
              key={item.piece.id}
              transform={`translate(${x - item.minX} ${y - item.minY})`}
              onClick={() => onSelectPiece(item.piece.id)}
              style={{ cursor: 'pointer' }}
              opacity={selectedPieceId && !selected ? 0.55 : 1}
              data-testid="overview-piece"
              data-selected={selected}
            >
              <PatternPieceDrawing piece={item.piece} outline={item.outline} mode="simplified" unit={unit} compact />
              <text
                x={item.minX + item.width / 2}
                y={item.minY + item.height + unit * 8}
                textAnchor="middle"
                fill={selected ? '#FFFFFF' : '#D8D3C8'}
                fontSize={unit * 4.6}
                fontWeight={selected ? 700 : 500}
              >
                {item.piece.name.length > 22 ? `${item.piece.name.slice(0, 21)}…` : item.piece.name}
              </text>
              <text
                x={item.minX + item.width / 2}
                y={item.minY + item.height + unit * 14}
                textAnchor="middle"
                fill="#C5B190"
                fontSize={unit * 3.8}
              >
                ×{item.piece.quantity} · {formatCm(item.width)} × {formatCm(item.height)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[11px] text-[#D8D3C8]/60">
        Toutes les pièces sont à la même échelle. Cliquez sur une pièce pour ouvrir son tracé détaillé.
      </p>
    </div>
  );
};
