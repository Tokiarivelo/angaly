import React from 'react';
import { Box, LayoutGrid, Ruler } from 'lucide-react';
import type { PreviewMode } from '../types/pattern-piece-view.types';

interface PreviewModeTabsProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}

const TABS: Array<{ id: PreviewMode; label: string; Icon: typeof Ruler }> = [
  { id: 'piece', label: 'Pièce (2D)', Icon: Ruler },
  { id: 'overview', label: 'Ensemble', Icon: LayoutGrid },
  { id: '3d', label: '3D sur mannequin', Icon: Box },
];

export const PreviewModeTabs: React.FC<PreviewModeTabsProps> = ({ mode, onChange }) => (
  <div role="tablist" aria-label="Mode de prévisualisation" className="flex gap-1.5 mb-3">
    {TABS.map(({ id, label, Icon }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={mode === id}
        onClick={() => onChange(id)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
          mode === id
            ? 'bg-[#C5B190] text-[#041329] border-[#C5B190]'
            : 'bg-[#0C2650] text-[#D8D3C8] border-[#C5B190]/25 hover:border-[#C5B190]/60'
        }`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {label}
      </button>
    ))}
  </div>
);
