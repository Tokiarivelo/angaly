import React from 'react';
import type { PatternPieceDto } from '@angaly/types';
import type { CanvasViewMode } from '../types/pattern-piece-view.types';
import {
  findFoldEdge,
  formatCm,
  getBounds,
  getEdges,
  getNotchMarks,
  niceScaleLengthMm,
  offsetPolygon,
  openPolygon,
  type Point,
} from '../utils/pattern-geometry';

interface PatternPieceDrawingProps {
  piece: PatternPieceDto;
  outline: Point[];
  mode: CanvasViewMode;
  /** One drawing unit (mm) used to scale strokes and text with the piece size. */
  unit: number;
  /** Hide labels/dimensions (used by the overview sheet). */
  compact?: boolean | undefined;
}

const GOLD = '#C5B190';
const BRONZE = '#936C3E';

const toPoints = (pts: Point[]): string => pts.map((p) => `${p.x},${p.y}`).join(' ');

/**
 * Renders ONE pattern piece as a technical drawing in millimetre coordinates:
 * cutting line, sewing line, fold edge, edge lengths, dimension lines, grainline, notches, cutting
 * instruction and scale bar. A <g> so it can be reused on the overview sheet.
 */
export const PatternPieceDrawing: React.FC<PatternPieceDrawingProps> = ({
  piece,
  outline,
  mode,
  unit,
  compact = false,
}) => {
  const polygon = openPolygon(outline);
  const bounds = getBounds(polygon);
  const technical = mode === 'technical' && !compact;
  const allowanceMm = (piece.seamAllowanceCm ?? 0) * 10;
  const cutLine = offsetPolygon(polygon, allowanceMm);
  const edges = getEdges(polygon);
  const fold = findFoldEdge(polygon, piece.quantity);
  const notchMarks = getNotchMarks(polygon, piece.notchesJson);

  const fontSize = unit * 5;
  const stroke = unit * 0.6;

  const grain = piece.grainlineJson;
  const grainX = grain?.originX ?? bounds.minX + bounds.width / 2;
  const grainY = grain?.originY ?? bounds.minY + bounds.height / 2;
  const angle = ((grain?.angleDegrees ?? 90) * Math.PI) / 180;
  const grainHalf = Math.max(bounds.height, 40) * 0.3;
  // Snap float noise (cos 90° ≈ 6e-17) so a vertical grainline stays exactly vertical.
  const snap = (v: number): number => Math.round(v * 1e9) / 1e9;
  const dir = { x: snap(Math.cos(angle)), y: snap(Math.sin(angle)) };
  const g1 = { x: grainX - dir.x * grainHalf, y: grainY - dir.y * grainHalf };
  const g2 = { x: grainX + dir.x * grainHalf, y: grainY + dir.y * grainHalf };
  const arrow = unit * 3;
  const head = (tip: Point, sign: 1 | -1): string => {
    const back = { x: tip.x - dir.x * arrow * sign, y: tip.y - dir.y * arrow * sign };
    const perp = { x: -dir.y * arrow * 0.45, y: dir.x * arrow * 0.45 };
    return toPoints([tip, { x: back.x + perp.x, y: back.y + perp.y }, { x: back.x - perp.x, y: back.y - perp.y }]);
  };

  const dimOffset = Math.max(allowanceMm, 0) + unit * 9;
  const widthY = bounds.maxY + dimOffset;
  const heightX = bounds.maxX + dimOffset;

  const scaleLength = niceScaleLengthMm(bounds.width * 0.5);
  const scaleX = bounds.minX;
  const scaleY = bounds.maxY + dimOffset + unit * 14;

  const quantityLabel = fold
    ? 'Couper 1 fois, AU PLI'
    : piece.quantity > 1
      ? `Couper ${piece.quantity} fois (symétriques)`
      : 'Couper 1 fois';

  const hasAllowance = allowanceMm > 0;
  const center = { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height * 0.62 };

  return (
    <g data-testid="pattern-piece-drawing">
      {hasAllowance && (
        <polygon
          points={toPoints(cutLine)}
          fill={mode === 'technical' ? '#0C2650' : 'none'}
          fillOpacity={0.55}
          stroke={GOLD}
          strokeWidth={stroke * 1.4}
          strokeLinejoin="round"
          data-testid="pattern-cut-line"
        />
      )}
      <polygon
        points={toPoints(polygon)}
        fill={hasAllowance ? 'none' : '#0C2650'}
        fillOpacity={0.5}
        stroke={hasAllowance ? '#FFFFFF' : GOLD}
        strokeOpacity={hasAllowance ? 0.75 : 1}
        strokeWidth={hasAllowance ? stroke * 0.8 : stroke * 1.4}
        strokeDasharray={hasAllowance ? `${unit * 3} ${unit * 2}` : undefined}
        strokeLinejoin="round"
        data-testid="pattern-sew-line"
      />

      {fold && (
        <g data-testid="pattern-fold">
          <line
            x1={fold.from.x}
            y1={fold.from.y}
            x2={fold.to.x}
            y2={fold.to.y}
            stroke={BRONZE}
            strokeWidth={stroke * 3}
            strokeLinecap="round"
          />
          {!compact && (
            <text
              x={fold.midpoint.x - unit * 4}
              y={fold.midpoint.y}
              fill={BRONZE}
              fontSize={fontSize}
              fontWeight={700}
              textAnchor="middle"
              transform={`rotate(-90 ${fold.midpoint.x - unit * 4} ${fold.midpoint.y})`}
            >
              AU PLI
            </text>
          )}
        </g>
      )}

      {notchMarks.map((mark, i) => (
        <line
          key={`notch-${i}`}
          data-testid="pattern-notch"
          x1={mark.at.x}
          y1={mark.at.y}
          x2={mark.at.x + mark.direction.x * Math.max(allowanceMm * 0.8, unit * 4)}
          y2={mark.at.y + mark.direction.y * Math.max(allowanceMm * 0.8, unit * 4)}
          stroke={BRONZE}
          strokeWidth={stroke * 2}
          strokeLinecap="round"
        />
      ))}

      {!compact && (
        <g data-testid="pattern-grainline">
          <line x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y} stroke={GOLD} strokeWidth={stroke} />
          <polygon points={head(g1, -1)} fill={GOLD} />
          <polygon points={head(g2, 1)} fill={GOLD} />
          {technical && (
            <text
              x={grainX + unit * 4}
              y={grainY}
              fill={GOLD}
              fontSize={fontSize * 0.85}
              letterSpacing={unit * 0.4}
            >
              DROIT-FIL
            </text>
          )}
        </g>
      )}

      {!compact && (
        <text
          x={center.x}
          y={center.y}
          textAnchor="middle"
          fill="#FFFFFF"
          fillOpacity={0.85}
          fontSize={fontSize * 0.95}
          data-testid="pattern-cut-instruction"
        >
          {quantityLabel}
        </text>
      )}

      {technical && (
        <g data-testid="pattern-edge-lengths">
          {edges
            .filter((e) => e.lengthMm >= Math.max(bounds.width, bounds.height) * 0.08)
            .map((e) => (
              <text
                key={`len-${e.index}`}
                // Inside the piece: outside is reserved for the cutting line, notches and dimension lines.
                x={e.midpoint.x - e.normal.x * unit * 6}
                y={e.midpoint.y - e.normal.y * unit * 6 + fontSize * 0.3}
                fill="#D8D3C8"
                fontSize={fontSize * 0.8}
                textAnchor="middle"
              >
                {formatCm(e.lengthMm)}
              </text>
            ))}
          {polygon.map((p, i) => (
            <circle key={`v-${i}`} cx={p.x} cy={p.y} r={unit * 0.9} fill={GOLD} />
          ))}
        </g>
      )}

      {technical && (
        <g data-testid="pattern-dimensions" stroke={GOLD} strokeWidth={stroke * 0.7} fill={GOLD}>
          <line x1={bounds.minX} y1={widthY} x2={bounds.maxX} y2={widthY} />
          <line x1={bounds.minX} y1={widthY - unit * 2} x2={bounds.minX} y2={widthY + unit * 2} />
          <line x1={bounds.maxX} y1={widthY - unit * 2} x2={bounds.maxX} y2={widthY + unit * 2} />
          <text
            x={bounds.minX + bounds.width / 2}
            y={widthY - unit * 2.5}
            textAnchor="middle"
            fontSize={fontSize}
            stroke="none"
          >
            Largeur {formatCm(bounds.width)}
          </text>

          <line x1={heightX} y1={bounds.minY} x2={heightX} y2={bounds.maxY} />
          <line x1={heightX - unit * 2} y1={bounds.minY} x2={heightX + unit * 2} y2={bounds.minY} />
          <line x1={heightX - unit * 2} y1={bounds.maxY} x2={heightX + unit * 2} y2={bounds.maxY} />
          <text
            x={heightX + unit * 3}
            y={bounds.minY + bounds.height / 2}
            fontSize={fontSize}
            stroke="none"
            transform={`rotate(90 ${heightX + unit * 3} ${bounds.minY + bounds.height / 2})`}
            textAnchor="middle"
          >
            Hauteur {formatCm(bounds.height)}
          </text>
        </g>
      )}

      {technical && (
        <g data-testid="pattern-scale-bar" stroke={GOLD} strokeWidth={stroke}>
          <line x1={scaleX} y1={scaleY} x2={scaleX + scaleLength} y2={scaleY} />
          <line x1={scaleX} y1={scaleY - unit * 1.5} x2={scaleX} y2={scaleY + unit * 1.5} />
          <line
            x1={scaleX + scaleLength}
            y1={scaleY - unit * 1.5}
            x2={scaleX + scaleLength}
            y2={scaleY + unit * 1.5}
          />
          <text x={scaleX + scaleLength / 2} y={scaleY - unit * 2.5} fill={GOLD} stroke="none" fontSize={fontSize * 0.85} textAnchor="middle">
            Échelle 1:1 — {formatCm(scaleLength)}
          </text>
        </g>
      )}
    </g>
  );
};
