'use client';

import React from 'react';
import { Box, Check, Eye, Loader2, MoveHorizontal, MoveVertical, Redo2, RotateCcw, Save, Sparkles, Undo2, Wand2 } from 'lucide-react';
import type { Falloff, SculptTool } from '../utils/garment3d/sculpt';
import { SCULPT_RADIUS_BOUNDS } from '../hooks/usePatternSculpt';
import type { DraftMessage } from '../hooks/useSaveDraft';

export const SCULPT_TOOLS: Array<{ id: SculptTool; label: string; shortcut: string; hint: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'grab', label: 'Modeler', shortcut: 'G', hint: 'tirez le tissu près d’une couture ou d’un ourlet : le contour suit.', Icon: Wand2 },
  { id: 'width', label: 'Ampleur', shortcut: 'W', hint: 'tirez sur le côté (ou hors du corps) pour élargir, vers le corps pour resserrer.', Icon: MoveHorizontal },
  { id: 'length', label: 'Longueur', shortcut: 'L', hint: 'tirez vers le bas ou le haut : tout ce qui est au-delà du point suit.', Icon: MoveVertical },
  { id: 'smooth', label: 'Lisser', shortcut: 'S', hint: 'frottez une couture pour en adoucir la ligne.', Icon: Sparkles },
];

export const TOOL_BY_KEY: Record<string, SculptTool> = Object.fromEntries(
  SCULPT_TOOLS.map((t) => [t.shortcut.toLowerCase(), t.id]),
);

const FALLOFFS: Array<[Falloff, string]> = [
  ['smooth', 'Douce'],
  ['linear', 'Linéaire'],
  ['sharp', 'Pointue'],
  ['constant', 'Uniforme'],
];

/** Blender's interaction modes: look (Object), brush the cloth (Sculpt), points one by one (Edit). */
export type ModelingMode = 'view' | 'sculpt' | 'edit';

export const MODES: Array<{ id: ModelingMode; label: string; title: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'view', label: 'Objet', title: 'Regarder le vêtement', Icon: Eye },
  { id: 'sculpt', label: 'Sculpture', title: 'Modeler le tissu au pinceau', Icon: Wand2 },
  { id: 'edit', label: 'Édition', title: 'Modifier les points du patron un à un (Tab)', Icon: Box },
];

interface SculptToolbarProps {
  mode: ModelingMode;
  onModeChange: (mode: ModelingMode) => void;
  /** Options of the edit mode (MeshEditToolbar). */
  editOptions?: React.ReactNode;
  tool: SculptTool;
  onToolChange: (tool: SculptTool) => void;
  radiusMm: number;
  onRadiusChange: (mm: number) => void;
  falloff: Falloff;
  onFalloffChange: (falloff: Falloff) => void;
  propagate: boolean;
  onPropagateChange: (propagate: boolean) => void;
  blocked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  dirty: boolean;
  onDiscard: () => void;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
  message: DraftMessage | null;
}

const button = (on: boolean): string =>
  `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
    on ? 'bg-[#C5B190] text-[#041329] border-[#C5B190] font-semibold' : 'bg-[#0C2650] border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]'
  }`;

/** Modelling the pattern on the 3D garment: tools, brush and the draft's history (presentational). */
export const SculptToolbar: React.FC<SculptToolbarProps> = (props) => {
  const current = SCULPT_TOOLS.find((t) => t.id === props.tool);
  const active = props.mode === 'sculpt';
  return (
    <div data-testid="sculpt-toolbar" className="rounded-lg border border-[#C5B190]/20 bg-[#0C2650]/60 p-3 flex flex-col gap-3 text-xs text-[#D8D3C8]">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Mode" className="flex items-center gap-1 rounded-lg bg-[#041329] p-1">
          {MODES.map(({ id, label, title, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={props.mode === id}
              title={title}
              onClick={() => props.onModeChange(id)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${props.mode === id ? 'bg-[#C5B190] text-[#041329] font-semibold' : 'text-[#D8D3C8] hover:text-white'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        {active && (
          <div role="radiogroup" aria-label="Outil de modelage" className="flex items-center gap-1 rounded-lg bg-[#041329] p-1">
            {SCULPT_TOOLS.map(({ id, label, shortcut, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={props.tool === id}
                title={`${label} (${shortcut})`}
                onClick={() => props.onToolChange(id)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${props.tool === id ? 'bg-[#C5B190] text-[#041329] font-semibold' : 'text-[#D8D3C8] hover:text-white'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Annuler" title="Annuler (Ctrl+Z)" disabled={!props.canUndo} onClick={props.onUndo} className={`${button(false)} disabled:opacity-35`}>
            <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Rétablir" title="Rétablir (Ctrl+Y)" disabled={!props.canRedo} onClick={props.onRedo} className={`${button(false)} disabled:opacity-35`}>
            <Redo2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Abandonner les retouches" title="Abandonner les retouches" disabled={!props.dirty} onClick={props.onDiscard} className={`${button(false)} disabled:opacity-35`}>
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={!props.canSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C5B190] px-3 py-1.5 font-semibold text-[#041329] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {props.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
            Enregistrer une version
          </button>
        </div>
      </div>

      {props.mode === 'edit' && props.editOptions}
      {active && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 grow min-w-[200px]">
            <span className="whitespace-nowrap">Rayon</span>
            <input
              type="range"
              aria-label="Rayon du pinceau"
              min={SCULPT_RADIUS_BOUNDS.min}
              max={SCULPT_RADIUS_BOUNDS.max}
              step={5}
              value={props.radiusMm}
              onChange={(e) => props.onRadiusChange(Number(e.target.value))}
              className="w-full accent-[#C5B190]"
            />
            <span className="font-mono w-16 whitespace-nowrap text-right">{(props.radiusMm / 10).toFixed(1)} cm</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap">Atténuation</span>
            <select
              aria-label="Atténuation du pinceau"
              value={props.falloff}
              onChange={(e) => props.onFalloffChange(e.target.value as Falloff)}
              className="bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5B190]"
            >
              {FALLOFFS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2" title="Le pinceau agit aussi sur les pièces voisines (coutures de côté, ourlets)">
            <input type="checkbox" checked={props.propagate} onChange={(e) => props.onPropagateChange(e.target.checked)} />
            Pièces voisines
          </label>
        </div>
      )}

      {active && (
        <p data-testid="sculpt-hint" className="text-[11px] text-[#D8D3C8]/70">
          <span className="font-semibold text-[#C5B190]">{current?.label} :</span> {current?.hint} Glisser hors du vêtement : tourner ·
          [ ] : rayon · G W L S : outils. Le patron 2D suit chaque geste.
        </p>
      )}
      {props.blocked && (
        <p role="alert" className="text-[11px] text-[#F0B3AD]">
          Le contour se croiserait : la pièce garde sa dernière forme valide.
        </p>
      )}
      {props.dirty && !props.isSaving && (
        <p className="text-[11px] text-[#C5B190]">Retouches non enregistrées — visibles aussi dans le Studio 2D.</p>
      )}
      {props.message && (
        <p
          role={props.message.kind === 'error' ? 'alert' : 'status'}
          className={`flex items-center gap-1.5 text-[11px] ${props.message.kind === 'error' ? 'text-[#F0B3AD]' : 'text-[#9CD0B1]'}`}
        >
          {props.message.kind === 'ok' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {props.message.text}
        </p>
      )}
    </div>
  );
};
