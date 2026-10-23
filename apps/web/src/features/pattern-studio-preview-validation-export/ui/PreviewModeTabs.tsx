import React from 'react';
import { Box, ImageIcon, Layers2, LayoutGrid, PenTool, Ruler } from 'lucide-react';
import type { CompareMode, PreviewMode } from '../types/pattern-piece-view.types';

interface PreviewModeTabsProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
  /** Inspiration photo of the project; null hides the model thumbnail and disables its comparison. */
  inspirationUrl?: string | null | undefined;
  compare?: CompareMode | undefined;
  onCompareChange?: ((compare: CompareMode) => void) | undefined;
  /** Photo laid over the 3D view instead of beside it. */
  overlay?: boolean | undefined;
  onOverlayChange?: ((overlay: boolean) => void) | undefined;
  overlayOpacity?: number | undefined;
  onOverlayOpacityChange?: ((opacity: number) => void) | undefined;
}

const TABS: Array<{ id: PreviewMode; label: string; Icon: typeof Ruler }> = [
  { id: 'piece', label: 'Pièce (2D)', Icon: Ruler },
  { id: 'overview', label: 'Ensemble', Icon: LayoutGrid },
  { id: '3d', label: '3D sur mannequin', Icon: Box },
  { id: 'studio', label: 'Atelier de retouche', Icon: PenTool },
];

const COMPARE_OPTIONS: Array<{ id: CompareMode; label: string }> = [
  { id: 'none', label: 'Aucun' },
  { id: 'inspiration', label: 'Modèle' },
  { id: '3d', label: '3D' },
];

export const PreviewModeTabs: React.FC<PreviewModeTabsProps> = ({
  mode,
  onChange,
  inspirationUrl = null,
  compare = 'none',
  onCompareChange,
  overlay = false,
  onOverlayChange,
  overlayOpacity = 0.5,
  onOverlayOpacityChange,
}) => {
  const canOverlay = mode === '3d' && compare === 'inspiration' && Boolean(inspirationUrl);

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div role="tablist" aria-label="Mode de prévisualisation" className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
              mode === id
                ? 'border-[#C5B190] bg-[#C5B190] text-[#041329]'
                : 'border-[#C5B190]/25 bg-[#0C2650] text-[#D8D3C8] hover:border-[#C5B190]/60'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {onCompareChange && (
        <div className="flex flex-wrap items-center gap-2" data-testid="compare-controls">
          {inspirationUrl ? (
            <button
              type="button"
              onClick={() => onCompareChange(compare === 'inspiration' ? 'none' : 'inspiration')}
              aria-label="Afficher le modèle d’inspiration"
              title="Modèle d’inspiration"
              className={`h-9 w-9 overflow-hidden rounded-lg border ${compare === 'inspiration' ? 'border-[#C5B190] ring-2 ring-[#C5B190]/40' : 'border-[#C5B190]/30'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- MinIO URLs: arbitrary host. */}
              <img src={inspirationUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-[#C5B190]/25 text-[#C5B190]/50"
              title="Aucune photo d’inspiration pour ce projet"
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <div role="radiogroup" aria-label="Comparer avec" className="inline-flex items-center rounded-lg border border-[#C5B190]/25 bg-[#0C2650] p-0.5 text-xs">
            <span className="px-2 text-[#D8D3C8]/70">
              <Layers2 className="inline h-3.5 w-3.5" aria-hidden="true" /> Comparer
            </span>
            {COMPARE_OPTIONS.map(({ id, label }) => {
              const disabled = (id === 'inspiration' && !inspirationUrl) || (id === '3d' && mode === '3d');
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={compare === id}
                  disabled={disabled}
                  onClick={() => onCompareChange(id)}
                  className={`rounded-md px-2.5 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                    compare === id ? 'bg-[#C5B190] font-semibold text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {canOverlay && onOverlayChange && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#C5B190]/25 bg-[#0C2650] px-2.5 py-1.5 text-xs text-[#D8D3C8]">
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={overlay} onChange={(e) => onOverlayChange(e.target.checked)} className="accent-[#C5B190]" />
                Superposer
              </label>
              {overlay && onOverlayOpacityChange && (
                <input
                  type="range"
                  aria-label="Opacité du modèle"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={overlayOpacity}
                  onChange={(e) => onOverlayOpacityChange(Number(e.target.value))}
                  className="w-24 accent-[#C5B190]"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
