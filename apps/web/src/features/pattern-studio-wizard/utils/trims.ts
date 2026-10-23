import {
  TRIM_PLACES,
  validatePatternExtParameters,
  type Trim,
  type TrimPlace,
  type TrimSpec,
} from '@angaly/types';

/** One switchable garniture in the editor: a berthe, sleeve frills, or a bead row at one place. */
export type TrimSlot = 'BERTHE' | 'SLEEVE_FRILL' | `BEADING:${TrimPlace}`;

export const TRIM_SLOTS: readonly TrimSlot[] = ['BERTHE', 'SLEEVE_FRILL', ...TRIM_PLACES.map((p) => `BEADING:${p}` as TrimSlot)];

/** Garments that can carry garnitures (a berthe needs a bodice, frills a sleeve). */
const TRIM_GARMENTS = new Set(['ROBE', 'ROBE_MARIEE', 'CHEMISE', 'VESTE', 'AUTRE']);
export const trimsAvailableFor = (garment: string | null | undefined): boolean => TRIM_GARMENTS.has((garment ?? '').toUpperCase());

export const slotOf = (t: Trim): TrimSlot => (t.kind === 'BEADING' ? `BEADING:${t.place}` : t.kind);

/** Starting values when a garniture is switched on (inside the validated bounds): lace, ivory. */
export function defaultTrim(slot: TrimSlot): Trim {
  if (slot === 'BERTHE') return { kind: 'BERTHE', depthMm: 100, pointMm: 0, material: 'DENTELLE' };
  if (slot === 'SLEEVE_FRILL') return { kind: 'SLEEVE_FRILL', tiers: 1, depthMm: 50, material: 'DENTELLE' };
  return { kind: 'BEADING', place: slot.slice('BEADING:'.length) as TrimPlace, beadMm: 6, rows: 1 };
}

export const findTrim = (spec: TrimSpec | undefined, slot: TrimSlot): Trim | undefined => spec?.items.find((t) => slotOf(t) === slot);

/** Switches a garniture on (with its defaults) or off. An empty list means « no garnitures » on purpose. */
export function toggleTrim(spec: TrimSpec | undefined, slot: TrimSlot): TrimSpec {
  const items = spec?.items ?? [];
  return items.some((t) => slotOf(t) === slot)
    ? { items: items.filter((t) => slotOf(t) !== slot) }
    : { items: [...items, defaultTrim(slot)] };
}

/**
 * Changes one parameter of an enabled garniture. Re-validated: an invalid value keeps the previous list, so the UI never
 * saves what the API would reject. `color: null` removes the colour (the dress fabric's own is used).
 */
export function updateTrim(spec: TrimSpec | undefined, slot: TrimSlot, patch: Record<string, number | string | null>): TrimSpec {
  const current = spec ?? { items: [] };
  const next = current.items.map((t) => {
    if (slotOf(t) !== slot) return t;
    const merged: Record<string, unknown> = { ...t, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v === null) delete merged[k];
    return merged;
  });
  const { value, issues } = validatePatternExtParameters({ trims: { items: next } });
  return issues.length > 0 || !value.trims ? current : value.trims;
}
