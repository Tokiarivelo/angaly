'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { LIGHTING_PRESETS, QUALITY_TIERS, type LightingPresetName, type QualityTierName } from '../utils/studio3d/studio-config';
import { QUALITY_CHOICES, type StudioQualityChoice, type StudioSettings } from '../utils/studio3d/studio-settings';

interface StudioControlsProps {
  settings: StudioSettings;
  /** The tier actually rendered (shown next to « Auto »). */
  tier: QualityTierName;
  onLightingChange: (lighting: LightingPresetName) => void;
  onShadowsChange: (on: boolean) => void;
  onAoChange: (on: boolean) => void;
  onQualityChange: (quality: StudioQualityChoice) => void;
}

const QUALITY_LABELS: Record<StudioQualityChoice, string> = { auto: 'Auto', high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const LIGHTINGS = Object.values(LIGHTING_PRESETS);

// Overlay controls of the Stitch « Validation de Patron (Studio) » screen.
const BOX = 'bg-[#041329]/80 backdrop-blur-md border border-[#18375D] rounded-sm shadow-lg';
const LABEL = 'font-sans text-[10px] uppercase tracking-widest text-[#8A877F]';
const SEGMENT_ON = 'bg-[#18375D] text-[#F6F2E9]';
const SEGMENT_OFF = 'text-[#8A877F] hover:text-[#D8D3C8]';

const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className={LABEL}>
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex rounded-sm border border-[#18375D] p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-2 py-1 font-sans text-xs font-medium rounded-sm transition-colors ${
              option.value === value ? SEGMENT_ON : SEGMENT_OFF
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const Switch: React.FC<{ label: string; checked: boolean; onChange: (on: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center justify-between gap-3 py-0.5 text-left"
  >
    <span className={LABEL}>{label}</span>
    <span
      aria-hidden="true"
      className={`relative h-4 w-7 rounded-sm border transition-colors ${
        checked ? 'border-[#C5B190] bg-[#18375D]' : 'border-[#18375D] bg-transparent'
      }`}
    >
      <span
        className={`absolute top-0.5 h-2.5 w-2.5 rounded-sm transition-all ${
          checked ? 'left-3.5 bg-[#C5B190]' : 'left-0.5 bg-[#8A877F]'
        }`}
      />
    </span>
  </button>
);

/**
 * « Réglages du rendu » : light setup, shadows, ambient occlusion and quality of the 3D viewers, in an overlay at the
 * top right of the canvas. Escape closes it and gives the focus back to its button.
 */
export const StudioControls: React.FC<StudioControlsProps> = ({
  settings,
  tier,
  onLightingChange,
  onShadowsChange,
  onAoChange,
  onQualityChange,
}) => {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  // A click elsewhere closes the panel (without stealing the focus from where the user clicked).
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  return (
    <div
      ref={root}
      className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2"
      // The stage's own shortcuts (views, tools) must not fire while using these controls.
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape' && open) close(true);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label="Réglages du rendu"
        title="Réglages du rendu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={`${BOX} w-10 h-10 flex items-center justify-center transition-colors ${
          open ? 'text-[#C5B190] border-[#C5B190]' : 'text-[#D8D3C8] hover:text-[#C5B190] hover:border-[#C5B190]'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div id={panelId} role="group" aria-label="Réglages du rendu" className={`${BOX} w-64 p-3 flex flex-col gap-3`}>
          <Segmented
            label="Éclairage"
            options={LIGHTINGS.map((preset) => ({ value: preset.name, label: preset.label }))}
            value={settings.lighting}
            onChange={onLightingChange}
          />
          <div className="flex flex-col gap-2">
            <Switch label="Ombres" checked={settings.shadows} onChange={onShadowsChange} />
            <Switch label="Occlusion" checked={settings.ao} onChange={onAoChange} />
            {settings.ao && !QUALITY_TIERS[tier].ao && (
              <p className="font-sans text-[10px] text-[#8A877F]" data-testid="studio-ao-note">
                L’occlusion n’est calculée qu’en qualité haute.
              </p>
            )}
          </div>
          <Segmented
            label="Qualité"
            options={QUALITY_CHOICES.map((choice) => ({ value: choice, label: QUALITY_LABELS[choice] }))}
            value={settings.quality}
            onChange={onQualityChange}
          />
          {settings.quality === 'auto' && (
            <p className="font-sans text-[10px] text-[#8A877F]" data-testid="studio-auto-tier">
              Niveau actuel : <span className="font-mono text-[#D8D3C8]">{QUALITY_LABELS[tier].toLowerCase()}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
