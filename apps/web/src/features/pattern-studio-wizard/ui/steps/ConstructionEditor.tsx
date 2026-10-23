'use client';

import React from 'react';
import { CONSTRUCTION_LABELS, CONSTRUCTION_MATERIALS, isHexColor, type ConstructionItem, type ConstructionKind, type ConstructionSpec } from '@angaly/types';
import {
  CONSTRUCTION_FIELDS,
  CONSTRUCTION_GROUPS,
  CONSTRUCTION_HINTS,
  WITH_COLOR,
  WITH_MATERIAL,
  constructionAvailableFor,
  findConstruction,
  toggleConstruction,
  updateConstruction,
} from '../../utils/construction';

interface ConstructionEditorProps {
  garmentType: string;
  /** The customer's own choice (what gets saved); `undefined` = not chosen yet. */
  value: ConstructionSpec | undefined;
  /** What the photo suggests: shown and applied until the customer chooses otherwise. */
  suggested?: ConstructionSpec | undefined;
  onChange: (spec: ConstructionSpec | null) => void;
}

const MATERIAL_LABELS: Record<(typeof CONSTRUCTION_MATERIALS)[number], string> = {
  TISSU: 'Même tissu',
  DENTELLE: 'Dentelle',
  TULLE: 'Tulle',
  CONTRASTE: 'Tissu contrastant',
};

const fieldOf = (item: ConstructionItem, name: string): unknown => (item as unknown as Record<string, unknown>)[name];

/**
 * Switch construction pieces on/off and tune them: lining and interfacing, flounces, godets, peplum, bustle, jabot,
 * capelet, bows, applied bands, embroidery, smocking… The photo's reading is the starting point. Same look as the
 * garnitures editor (`TrimsEditor`, from the Stitch screen « Pattern Studio — Étape 7 »).
 */
export const ConstructionEditor: React.FC<ConstructionEditorProps> = ({ garmentType, value, suggested, onChange }) => {
  if (!constructionAvailableFor(garmentType)) return null;
  const fromSuggestion = value === undefined && (suggested?.items.length ?? 0) > 0;
  const effective = value ?? suggested;
  const edit = (kind: ConstructionKind, patch: Record<string, number | string | null>) => onChange(updateConstruction(effective, kind, patch));

  const controls = (kind: ConstructionKind, item: ConstructionItem): React.ReactNode => {
    const id = (name: string) => `construction-${kind}-${name}`;
    return (
      <>
        {CONSTRUCTION_FIELDS[kind].map((f) =>
          f.kind === 'range' ? (
            <div key={f.name}>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={id(f.name)} className="text-white text-xs">
                  {f.label}
                </label>
                <span className="text-xs text-[#C5B190] font-mono">
                  {String(fieldOf(item, f.name))}
                  {f.unit}
                </span>
              </div>
              <input
                id={id(f.name)}
                type="range"
                min={f.bounds.min}
                max={f.bounds.max}
                step={f.bounds.step}
                value={Number(fieldOf(item, f.name))}
                onChange={(e) => edit(kind, { [f.name]: parseFloat(e.target.value) })}
                className="w-full accent-[#C5B190]"
              />
            </div>
          ) : (
            <div key={f.name}>
              <label htmlFor={id(f.name)} className="block text-white text-xs mb-1">
                {f.label}
              </label>
              <select
                id={id(f.name)}
                value={String(fieldOf(item, f.name))}
                onChange={(e) => edit(kind, { [f.name]: e.target.value })}
                className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ),
        )}
        {WITH_MATERIAL.has(kind) && (
          <div>
            <label htmlFor={id('material')} className="block text-white text-xs mb-1">
              Matière
            </label>
            <select
              id={id('material')}
              value={(item as { material?: string }).material ?? 'TISSU'}
              onChange={(e) => edit(kind, { material: e.target.value })}
              className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm"
            >
              {CONSTRUCTION_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {MATERIAL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
        )}
        {WITH_COLOR.has(kind) && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={id('color')} className="text-white text-xs">
              Couleur
            </label>
            <span className="flex items-center gap-2">
              <input
                id={id('color')}
                type="color"
                value={isHexColor(fieldOf(item, 'color')) ? String(fieldOf(item, 'color')) : '#f2e6c9'}
                onChange={(e) => edit(kind, { color: e.target.value })}
                className="h-7 w-10 rounded border border-[#C5B190]/30 bg-transparent"
              />
              {fieldOf(item, 'color') !== undefined && (
                <button type="button" onClick={() => edit(kind, { color: null })} className="text-[11px] text-[#D8D3C8] underline">
                  Par défaut
                </button>
              )}
            </span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="mt-8 space-y-6" data-testid="construction-editor">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-medium text-sm">Pièces de construction</h3>
          <p className="text-[11px] text-[#D8D3C8]/70 mt-1">
            Ce que l’atelier ajoute au patron : chaque choix ajoute ses pièces, à vos mesures, et sa mercerie à la liste.
          </p>
        </div>
        {fromSuggestion && (
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#C5B190] border border-[#C5B190]/40 rounded px-1.5 py-0.5">
            Suggéré par l’IA — modifiable
          </span>
        )}
      </div>
      {CONSTRUCTION_GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h4 className="text-[#C5B190] text-xs uppercase tracking-widest">{group.title}</h4>
            <p className="text-[11px] text-[#D8D3C8]/70">{group.hint}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.kinds.map((kind) => {
              const item = findConstruction(effective, kind);
              return (
                <div
                  key={kind}
                  className={`rounded-xl border p-4 space-y-3 ${item ? 'border-[#C5B190] bg-[#041329]' : 'border-[#C5B190]/20 bg-[#0C2650]/40'}`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(item)}
                      onChange={() => onChange(toggleConstruction(effective, kind))}
                      aria-label={CONSTRUCTION_LABELS[kind]}
                      className="mt-1 accent-[#C5B190]"
                    />
                    <span>
                      <span className="block text-white text-sm font-medium">{CONSTRUCTION_LABELS[kind]}</span>
                      <span className="block text-[11px] text-[#D8D3C8]/70">{CONSTRUCTION_HINTS[kind]}</span>
                    </span>
                  </label>
                  {item && <div className="space-y-3">{controls(kind, item)}</div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {value !== undefined && (
        <button type="button" onClick={() => onChange(null)} className="text-[11px] text-[#D8D3C8] underline hover:text-white">
          Réinitialiser
        </button>
      )}
    </div>
  );
};
