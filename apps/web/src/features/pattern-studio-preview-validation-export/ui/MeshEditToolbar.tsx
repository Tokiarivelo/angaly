'use client';

import React, { useEffect, useState } from 'react';
import { CircleDot, Grid2x2Plus, Move, RotateCw, Scaling, ScanEye, SquareDashedMousePointer, Trash2 } from 'lucide-react';
import type { Falloff } from '../utils/garment3d/sculpt';
import type { ModalState, TransformKind } from '../hooks/useMeshEdit';
import { PROPORTIONAL_RADIUS_BOUNDS } from '../hooks/useMeshEdit';

const TRANSFORMS: Array<{ id: TransformKind; label: string; key: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'grab', label: 'Déplacer', key: 'G', Icon: Move },
  { id: 'scale', label: 'Échelle', key: 'S', Icon: Scaling },
  { id: 'rotate', label: 'Rotation', key: 'R', Icon: RotateCw },
];

const MODAL_LABEL: Record<TransformKind, string> = { grab: 'Déplacer', scale: 'Échelle', rotate: 'Rotation' };
const MODAL_UNIT: Record<TransformKind, string> = { grab: 'cm', scale: '×', rotate: '°' };

const FALLOFFS: Array<[Falloff, string]> = [
  ['smooth', 'Douce'],
  ['linear', 'Linéaire'],
  ['sharp', 'Pointue'],
  ['constant', 'Uniforme'],
];

interface MeshEditToolbarProps {
  selectedCount: number;
  /** Pieces the selection spans (names). */
  selectedPieces: string[];
  /** Median of the selection on the pattern (mm) — null when it spans several pieces or is empty. */
  median: { x: number; y: number } | null;
  onMedianChange: (target: { x?: number; y?: number }) => void;
  modal: ModalState | null;
  onTransform: (kind: TransformKind) => void;
  onSelectAll: () => void;
  onSelectLinked: () => void;
  onDelete: () => void;
  onSubdivide: () => void;
  proportional: { enabled: boolean; radiusMm: number; falloff: Falloff };
  onToggleProportional: () => void;
  onProportionalRadius: (mm: number) => void;
  onProportionalFalloff: (falloff: Falloff) => void;
  xray: boolean;
  onXrayChange: (xray: boolean) => void;
}

const tool = (on = false): string =>
  `inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-35 ${
    on ? 'bg-[#C5B190] text-[#041329] border-[#C5B190] font-semibold' : 'bg-[#0C2650] border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]'
  }`;

/** A number field committed on Enter or blur (the « Transformation » panel, Blender's N panel). */
const MedianField: React.FC<{ label: string; value: number; onCommit: (v: number) => void }> = ({ label, value, onCommit }) => {
  const [text, setText] = useState(value.toFixed(1));
  useEffect(() => setText(value.toFixed(1)), [value]);
  const commit = (): void => {
    const v = Number(text.replace(',', '.'));
    if (Number.isFinite(v) && Math.abs(v - value) > 1e-6) onCommit(v);
    else setText(value.toFixed(1));
  };
  return (
    <label className="flex items-center gap-1.5">
      <span className="font-semibold text-[#C5B190]">{label}</span>
      <input
        aria-label={`Médiane ${label} (mm)`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
        }}
        className="w-20 rounded-md border border-[#C5B190]/25 bg-[#041329] px-2 py-1 font-mono text-white outline-none focus:border-[#C5B190]"
      />
      <span>mm</span>
    </label>
  );
};

/** Edit mode tools: transforms, selection, proportional editing, X-ray and the selection's coordinates. */
export const MeshEditToolbar: React.FC<MeshEditToolbarProps> = (props) => {
  const none = props.selectedCount === 0;
  return (
    <div data-testid="mesh-edit-toolbar" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TRANSFORMS.map(({ id, label, key, Icon }) => (
          <button
            key={id}
            type="button"
            title={`${label} (${key}) puis X / Y / Z pour un axe, un nombre pour une valeur exacte`}
            disabled={none || props.modal !== null}
            onClick={() => props.onTransform(id)}
            className={tool(props.modal?.kind === id)}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
        <button type="button" title="Supprimer les points (X)" disabled={none} onClick={props.onDelete} className={tool()}>
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Supprimer
        </button>
        <button type="button" title="Un point au milieu de chaque arête dont les deux bouts sont sélectionnés" disabled={props.selectedCount < 2} onClick={props.onSubdivide} className={tool()}>
          <Grid2x2Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Subdiviser
        </button>
        <span className="mx-1 h-5 w-px bg-[#C5B190]/25" aria-hidden="true" />
        <button type="button" title="Tout sélectionner / désélectionner (A)" onClick={props.onSelectAll} className={tool()}>
          <SquareDashedMousePointer className="w-3.5 h-3.5" aria-hidden="true" />
          Tout
        </button>
        <button type="button" title="Toute la pièce des points sélectionnés (Ctrl+L)" disabled={none} onClick={props.onSelectLinked} className={tool()}>
          Pièce entière
        </button>
        <button type="button" aria-pressed={props.proportional.enabled} title="Édition proportionnelle (O) — molette pendant la transformation : rayon" onClick={props.onToggleProportional} className={tool(props.proportional.enabled)}>
          <CircleDot className="w-3.5 h-3.5" aria-hidden="true" />
          Proportionnelle
        </button>
        <button type="button" aria-pressed={props.xray} title="Rayons X (Alt+Z) : voir et sélectionner aussi les points cachés" onClick={() => props.onXrayChange(!props.xray)} className={tool(props.xray)}>
          <ScanEye className="w-3.5 h-3.5" aria-hidden="true" />
          Rayons X
        </button>
      </div>

      {props.proportional.enabled && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 grow min-w-[200px]">
            <span className="whitespace-nowrap">Rayon proportionnel</span>
            <input
              type="range"
              aria-label="Rayon proportionnel"
              min={PROPORTIONAL_RADIUS_BOUNDS.min}
              max={PROPORTIONAL_RADIUS_BOUNDS.max}
              step={5}
              value={props.proportional.radiusMm}
              onChange={(e) => props.onProportionalRadius(Number(e.target.value))}
              className="w-full accent-[#C5B190]"
            />
            <span className="font-mono w-16 whitespace-nowrap text-right">{(props.proportional.radiusMm / 10).toFixed(1)} cm</span>
          </label>
          <select
            aria-label="Atténuation proportionnelle"
            value={props.proportional.falloff}
            onChange={(e) => props.onProportionalFalloff(e.target.value as Falloff)}
            className="bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5B190]"
          >
            {FALLOFFS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div data-testid="mesh-edit-selection" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-[#041329] px-3 py-2">
        <span>
          <strong className="text-white">{props.selectedCount}</strong> point{props.selectedCount > 1 ? 's' : ''} sélectionné
          {props.selectedCount > 1 ? 's' : ''}
          {props.selectedPieces.length > 0 && <span className="text-[#D8D3C8]/70"> · {props.selectedPieces.join(', ')}</span>}
        </span>
        {props.median && props.modal === null && (
          <>
            <MedianField label="X" value={props.median.x} onCommit={(x) => props.onMedianChange({ x })} />
            <MedianField label="Y" value={props.median.y} onCommit={(y) => props.onMedianChange({ y })} />
          </>
        )}
      </div>

      {props.modal ? (
        <p role="status" data-testid="mesh-edit-modal" className="text-[11px] text-[#FFA436]">
          <strong>{MODAL_LABEL[props.modal.kind]}</strong>
          {props.modal.axis && ` · axe ${props.modal.axis.toUpperCase()}`}
          {props.modal.typed && ` · ${props.modal.typed} ${MODAL_UNIT[props.modal.kind]}`}
          {' '}— bouger la souris · X / Y / Z : axe · chiffres : valeur · clic ou Entrée : valider · Échap ou clic droit : annuler
        </p>
      ) : (
        <p data-testid="mesh-edit-hint" className="text-[11px] text-[#D8D3C8]/70">
          Clic : sélectionner · Maj : ajouter · glisser : rectangle · Ctrl+clic sur une couture : ajouter un point · Alt+glisser ou
          molette-clic : tourner · G S R : transformer · A : tout · X : supprimer · O : proportionnelle · Tab : quitter l’édition.
          Le patron 2D suit chaque modification.
        </p>
      )}
    </div>
  );
};
