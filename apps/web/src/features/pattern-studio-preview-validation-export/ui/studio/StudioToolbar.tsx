import React from 'react';
import {
  Eraser,
  Hand,
  Magnet,
  MousePointer2,
  PenTool,
  Plus,
  Redo2,
  Ruler,
  Scan,
  Scissors,
  Spline,
  Undo2,
  Grid3x3,
  Tag,
} from 'lucide-react';
import { SNAP_STEPS_MM, STUDIO_TOOLS, type StudioTool } from './studio.types';

const ICONS: Record<StudioTool, typeof Hand> = {
  select: MousePointer2,
  pan: Hand,
  add: Plus,
  remove: Eraser,
  draw: PenTool,
  measure: Ruler,
  notch: Scissors,
  grain: Spline,
};

interface StudioToolbarProps {
  tool: StudioTool;
  onToolChange: (tool: StudioTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapMm: number;
  onSnapChange: (mm: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showLengths: boolean;
  onToggleLengths: () => void;
  onFit: () => void;
  zoomPercent: number;
}

const iconButton = (active: boolean, disabled = false): string =>
  `inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[#D8D3C8] transition-colors ${
    active
      ? 'border-[#C5B190] bg-[#C5B190] text-[#041329]'
      : 'border-[#C5B190]/25 bg-[#0C2650] hover:border-[#C5B190]/70 hover:text-white'
  } ${disabled ? 'opacity-35 pointer-events-none' : ''}`;

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  tool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapMm,
  onSnapChange,
  showGrid,
  onToggleGrid,
  showLengths,
  onToggleLengths,
  onFit,
  zoomPercent,
}) => (
  <div
    role="toolbar"
    aria-label="Outils de dessin"
    className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#C5B190]/20 bg-[#0C2650]/70 p-2"
  >
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Outil actif">
      {STUDIO_TOOLS.map(({ id, label, hint, shortcut }) => {
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={tool === id}
            aria-label={label}
            title={`${label} (${shortcut}) — ${hint}`}
            onClick={() => onToolChange(id)}
            className={iconButton(tool === id)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>

    <span className="mx-1 hidden h-6 w-px bg-[#C5B190]/25 sm:block" aria-hidden="true" />

    <button type="button" aria-label="Annuler" title="Annuler (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} className={iconButton(false, !canUndo)}>
      <Undo2 className="h-4 w-4" aria-hidden="true" />
    </button>
    <button type="button" aria-label="Rétablir" title="Rétablir (Ctrl+Maj+Z)" onClick={onRedo} disabled={!canRedo} className={iconButton(false, !canRedo)}>
      <Redo2 className="h-4 w-4" aria-hidden="true" />
    </button>

    <span className="mx-1 hidden h-6 w-px bg-[#C5B190]/25 sm:block" aria-hidden="true" />

    <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C5B190]/25 bg-[#0C2650] px-2 text-xs text-[#D8D3C8]" title="Aimantation sur la grille et sur les points">
      <Magnet className="h-4 w-4 text-[#C5B190]" aria-hidden="true" />
      <span className="sr-only">Aimantation</span>
      <select
        aria-label="Aimantation"
        value={snapMm}
        onChange={(e) => onSnapChange(Number(e.target.value))}
        className="bg-transparent text-xs text-white outline-none"
      >
        {SNAP_STEPS_MM.map((s) => (
          <option key={s} value={s} className="bg-[#0C2650]">
            {s === 0 ? 'Libre' : s === 10 ? '1 cm' : `${s} mm`}
          </option>
        ))}
      </select>
    </label>
    <button type="button" aria-label="Grille" aria-pressed={showGrid} title="Afficher la grille" onClick={onToggleGrid} className={iconButton(showGrid)}>
      <Grid3x3 className="h-4 w-4" aria-hidden="true" />
    </button>
    <button type="button" aria-label="Longueurs des bords" aria-pressed={showLengths} title="Afficher les longueurs des bords" onClick={onToggleLengths} className={iconButton(showLengths)}>
      <Tag className="h-4 w-4" aria-hidden="true" />
    </button>
    <button type="button" aria-label="Ajuster à l’écran" title="Ajuster à l’écran (F)" onClick={onFit} className={iconButton(false)}>
      <Scan className="h-4 w-4" aria-hidden="true" />
    </button>
    <span className="ml-1 font-mono text-[11px] text-[#C5B190]" aria-live="off">
      {zoomPercent} %
    </span>
  </div>
);
