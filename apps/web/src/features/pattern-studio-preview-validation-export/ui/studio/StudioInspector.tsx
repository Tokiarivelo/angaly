import React, { useMemo } from 'react';
import { Copy, FlipHorizontal2, RotateCw, Sparkles, Trash2, Wand2, Minimize2, Maximize2 } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';
import { formatCm, getEdges } from '../../utils/pattern-geometry';
import {
  hasSelfIntersection,
  mirrorPolygon,
  movePoint,
  perimeterMm,
  pieceAreaCm2,
  pieceNotches,
  pieceOutline,
  resizePolygon,
  rotatePolygon,
  scalePolygon,
  setEdgeLength,
  simplifyPolygon,
  smoothPolygon,
  transformPiece,
  withOutline,
} from '../../utils/pattern-editing';
import { NumberField } from './NumberField';

interface StudioInspectorProps {
  piece: PatternPieceDto;
  selectedPoint: number | null;
  onSelectEdge: (index: number | null) => void;
  onCommit: (fn: (piece: PatternPieceDto) => PatternPieceDto) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-t border-[#C5B190]/15 pt-3">
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#C5B190]">{title}</h3>
    {children}
  </section>
);

const actionButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-[#C5B190]/25 bg-[#041329] px-2 py-1.5 text-[11px] text-[#D8D3C8] transition-colors hover:border-[#C5B190] hover:text-white';

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  piece,
  selectedPoint,
  onSelectEdge,
  onCommit,
  onDuplicate,
  onDelete,
  canDelete,
}) => {
  const polygon = useMemo(() => pieceOutline(piece), [piece]);
  const edges = useMemo(() => getEdges(polygon), [polygon]);
  const dims = piece.dimensionsJson as { widthMm?: number; heightMm?: number };
  const crossing = useMemo(() => hasSelfIntersection(polygon), [polygon]);
  const point = selectedPoint !== null ? polygon[selectedPoint] : undefined;

  const transform = (build: (poly: ReturnType<typeof pieceOutline>) => ReturnType<typeof pieceOutline>, rotate?: number) =>
    onCommit((p) => transformPiece(p, build(pieceOutline(p)), { rotateDegrees: rotate }));

  return (
    <div className="flex flex-col gap-3" data-testid="studio-inspector">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="studio-piece-name" className="text-[11px] text-[#D8D3C8]/80">
            Nom de la pièce
          </label>
          <input
            id="studio-piece-name"
            key={piece.id}
            defaultValue={piece.name}
            onBlur={(e) => {
              const name = e.target.value.trim();
              if (name && name !== piece.name) onCommit((p) => ({ ...p, name }));
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="rounded-md border border-[#C5B190]/25 bg-[#041329] px-2 py-1.5 text-sm text-white outline-none focus:border-[#C5B190]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Quantité à couper"
            value={piece.quantity}
            min={1}
            max={20}
            step={1}
            decimals={0}
            onCommit={(quantity) => onCommit((p) => ({ ...p, quantity: Math.round(quantity) }))}
          />
          <NumberField
            label="Marge de couture"
            value={piece.seamAllowanceCm ?? 0}
            min={0}
            max={10}
            step={0.5}
            suffix="cm"
            onCommit={(seamAllowanceCm) => onCommit((p) => ({ ...p, seamAllowanceCm }))}
          />
        </div>
      </div>

      <Section title="Dimensions">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Largeur"
            value={(dims.widthMm ?? 0) / 10}
            min={1}
            max={400}
            suffix="cm"
            onCommit={(w) => transform((poly) => resizePolygon(poly, w * 10, undefined))}
          />
          <NumberField
            label="Hauteur"
            value={(dims.heightMm ?? 0) / 10}
            min={1}
            max={400}
            suffix="cm"
            onCommit={(h) => transform((poly) => resizePolygon(poly, undefined, h * 10))}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-[#D8D3C8]/70">
          Surface {Math.round(pieceAreaCm2(polygon))} cm² · périmètre {formatCm(perimeterMm(polygon))} · {polygon.length} points · {pieceNotches(piece).length} crans
        </p>
        {crossing && (
          <p role="alert" className="mt-2 rounded-md border border-[#A64A43]/50 bg-[#A64A43]/15 px-2 py-1.5 text-[11px] text-[#F0B3AD]">
            Le contour se croise : la pièce ne pourra pas être coupée. Déplacez les points concernés.
          </p>
        )}
      </Section>

      {point && selectedPoint !== null && (
        <Section title={`Point ${selectedPoint + 1}`}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="X"
              value={point.x / 10}
              suffix="cm"
              onCommit={(x) => onCommit((p) => withOutline(p, movePoint(pieceOutline(p), selectedPoint, { x: x * 10, y: point.y })))}
            />
            <NumberField
              label="Y"
              value={point.y / 10}
              suffix="cm"
              onCommit={(y) => onCommit((p) => withOutline(p, movePoint(pieceOutline(p), selectedPoint, { x: point.x, y: y * 10 })))}
            />
          </div>
        </Section>
      )}

      <Section title="Transformer">
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className={actionButton} onClick={() => onCommit((p) => {
            const m = mirrorPolygon(pieceOutline(p), pieceNotches(p));
            return transformPiece(p, m.polygon, { notches: m.notches });
          })}>
            <FlipHorizontal2 className="h-3.5 w-3.5" aria-hidden="true" /> Miroir
          </button>
          <button type="button" className={actionButton} onClick={() => transform((poly) => rotatePolygon(poly, 90), 90)}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Pivoter 90°
          </button>
          <button type="button" className={actionButton} onClick={() => transform((poly) => scalePolygon(poly, 1.05))}>
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /> Agrandir 5 %
          </button>
          <button type="button" className={actionButton} onClick={() => transform((poly) => scalePolygon(poly, 0.95))}>
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> Réduire 5 %
          </button>
          <button
            type="button"
            className={actionButton}
            title="Arrondit les angles pour obtenir une courbe"
            onClick={() => onCommit((p) => withOutline(p, smoothPolygon(pieceOutline(p)), []))}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Lisser
          </button>
          <button
            type="button"
            className={actionButton}
            title="Supprime les points inutiles (tolérance 1 mm)"
            onClick={() => onCommit((p) => withOutline(p, simplifyPolygon(pieceOutline(p), 1), []))}
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" /> Simplifier
          </button>
          <button type="button" className={actionButton} onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Dupliquer
          </button>
          <button
            type="button"
            className={`${actionButton} hover:!border-[#A64A43] hover:!text-[#F0B3AD] disabled:opacity-40`}
            onClick={onDelete}
            disabled={!canDelete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Supprimer
          </button>
        </div>
      </Section>

      <Section title="Longueur des bords">
        <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1" onMouseLeave={() => onSelectEdge(null)}>
          {edges.map((edge) => (
            <li
              key={edge.index}
              onMouseEnter={() => onSelectEdge(edge.index)}
              onFocus={() => onSelectEdge(edge.index)}
              className="grid grid-cols-[2.2rem_1fr] items-center gap-2"
            >
              <span className="font-mono text-[11px] text-[#C5B190]/80">
                {edge.index + 1}→{((edge.index + 1) % edges.length) + 1}
              </span>
              <NumberField
                compact
                label={`Bord ${edge.index + 1}`}
                value={edge.lengthMm / 10}
                min={0.1}
                max={400}
                suffix="cm"
                onCommit={(cm) => onCommit((p) => withOutline(p, setEdgeLength(pieceOutline(p), edge.index, cm * 10)))}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-[#D8D3C8]/60">
          Modifier une longueur déplace le point d’arrivée du bord le long de celui-ci.
        </p>
      </Section>
    </div>
  );
};
