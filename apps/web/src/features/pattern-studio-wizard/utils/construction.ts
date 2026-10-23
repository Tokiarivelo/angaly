import {
  CONSTRUCTION_BOUNDS,
  CONSTRUCTION_KINDS,
  validatePatternExtParameters,
  type ConstructionItem,
  type ConstructionKind,
  type ConstructionSpec,
} from '@angaly/types';

/** Garments that can carry construction pieces in the wizard (flounces, peplum, lining… need a dress). */
const CONSTRUCTION_GARMENTS = new Set(['ROBE', 'ROBE_MARIEE', 'AUTRE']);
export const constructionAvailableFor = (garment: string | null | undefined): boolean => CONSTRUCTION_GARMENTS.has((garment ?? '').toUpperCase());

/** How the editor groups the kinds: what the atelier adds inside, what adds volume, what is sewn on top. */
export const CONSTRUCTION_GROUPS: ReadonlyArray<{ title: string; hint: string; kinds: readonly ConstructionKind[] }> = [
  {
    title: 'Finitions intérieures',
    hint: 'Ce qui ne se voit pas mais tient la robe : doublure, entoilage, poches, biais.',
    kinds: ['LINING', 'INTERFACING', 'SEAM_POCKETS', 'BIAS_BINDING', 'UNDERARM_GUSSET', 'PUFF_SUPPORT'],
  },
  {
    title: 'Volants et volume',
    hint: 'Ce qui donne son mouvement à la jupe et sa silhouette à la robe.',
    kinds: ['HEM_FLOUNCE', 'GODETS', 'PEPLUM', 'BUSTLE', 'WATTEAU_PLEAT', 'BALAYEUSE'],
  },
  {
    title: 'Garnitures rapportées',
    hint: 'Ce qui se coud par-dessus : jabot, pèlerine, nœuds, bandes, broderie, smocks.',
    kinds: ['JABOT', 'CAPELET', 'BOW', 'HEM_BANDS', 'ENGAGEANTES', 'SASH', 'APRON', 'EMBROIDERY', 'SMOCKING', 'CONTRAST_CUFFS'],
  },
];

export const CONSTRUCTION_HINTS: Record<ConstructionKind, string> = {
  LINING: 'Chaque pièce du corsage, de la jupe et des manches doublée',
  INTERFACING: 'Cols, poignets, parementures et revers entoilés',
  HEM_FLOUNCE: 'Un ou plusieurs volants autour du bas de la jupe',
  GODETS: 'Triangles évasés insérés dans les coutures depuis le genou',
  PEPLUM: 'Basque cousue à la taille (en forme, à pointes ou froncée)',
  JABOT: 'Cascade plissée au milieu devant du col',
  CAPELET: 'Petite cape sur les épaules',
  BOW: 'Gros nœud (chou) à l’épaule, au dos, à la taille ou au col',
  HEM_BANDS: 'Bandes parallèles cousues au-dessus de l’ourlet',
  ENGAGEANTES: 'Volants de dentelle qui dépassent sous la manche',
  BALAYEUSE: 'Volant de propreté cousu à l’intérieur de l’ourlet',
  BUSTLE: 'Tournure, pouf drapé ou paniers sous la jupe',
  WATTEAU_PLEAT: 'Plis creux qui tombent de la nuque à l’ourlet',
  SEAM_POCKETS: 'Deux poches cachées dans les coutures de côté',
  BIAS_BINDING: 'Encolure (et emmanchures sans manche) finies au biais',
  UNDERARM_GUSSET: 'Losange sous le bras, pour une manche kimono',
  SASH: 'Écharpe drapée en biais',
  PUFF_SUPPORT: 'Tulle raide qui soutient une manche bouffante',
  APRON: 'Tablier froncé devant, avec ses liens',
  EMBROIDERY: 'Zone brodée (encolure, plastron, manches ou ourlet)',
  SMOCKING: 'Nids d’abeille élastiques (plastron, manches ou taille)',
  CONTRAST_CUFFS: 'Poignets dans un tissu d’une autre couleur',
};

export type FieldSpec =
  | { name: string; label: string; kind: 'range'; bounds: { min: number; max: number; step: number }; unit: string }
  | { name: string; label: string; kind: 'select'; options: ReadonlyArray<{ value: string; label: string }> };

const range = (name: string, label: string, key: keyof typeof CONSTRUCTION_BOUNDS, unit = ' mm'): FieldSpec => {
  const b = CONSTRUCTION_BOUNDS[key];
  const step = b.max <= 5 ? 0.1 : b.max <= 40 ? 1 : 5;
  return { name, label, kind: 'range', bounds: { min: b.min, max: b.max, step }, unit };
};
const select = (name: string, label: string, options: Array<[string, string]>): FieldSpec => ({
  name,
  label,
  kind: 'select',
  options: options.map(([value, l]) => ({ value, label: l })),
});

/** The controls of each kind (fields of the validated item). */
export const CONSTRUCTION_FIELDS: Record<ConstructionKind, FieldSpec[]> = {
  LINING: [],
  INTERFACING: [],
  HEM_FLOUNCE: [
    range('tiers', 'Nombre d’étages', 'flounceTiers', ''),
    range('depthMm', 'Hauteur d’un volant', 'flounceDepthMm'),
    select('style', 'Coupe', [['FRONCE', 'Froncé'], ['CIRCULAIRE', 'En forme (sans fronces)']]),
  ],
  GODETS: [range('count', 'Nombre de godets', 'godetCount', ''), range('heightMm', 'Hauteur', 'godetHeightMm'), range('widthMm', 'Largeur à l’ourlet', 'godetWidthMm')],
  PEPLUM: [select('style', 'Forme', [['CIRCULAIRE', 'En forme'], ['POINTES', 'À pointes'], ['FRONCEE', 'Froncée']]), range('depthMm', 'Hauteur', 'peplumDepthMm')],
  JABOT: [range('lengthMm', 'Longueur', 'jabotLengthMm'), range('tiers', 'Étages', 'jabotTiers', '')],
  CAPELET: [range('lengthMm', 'Longueur depuis le cou', 'capeletLengthMm')],
  BOW: [select('place', 'Emplacement', [['MANCHES', 'Épaules'], ['DOS', 'Dos'], ['TAILLE', 'Taille'], ['ENCOLURE', 'Encolure']]), range('widthMm', 'Largeur', 'bowWidthMm')],
  HEM_BANDS: [range('rows', 'Nombre de bandes', 'bandRows', ''), range('widthMm', 'Largeur d’une bande', 'bandWidthMm'), range('gapMm', 'Écart', 'bandGapMm')],
  ENGAGEANTES: [range('tiers', 'Étages', 'engageanteTiers', ''), range('depthMm', 'Hauteur', 'engageanteDepthMm')],
  BALAYEUSE: [],
  BUSTLE: [select('style', 'Forme', [['POUF', 'Pouf drapé'], ['COUSSIN', 'Tournure'], ['PANIERS', 'Paniers']])],
  WATTEAU_PLEAT: [range('depthMm', 'Profondeur des plis', 'watteauDepthMm')],
  SEAM_POCKETS: [],
  BIAS_BINDING: [],
  UNDERARM_GUSSET: [range('sizeMm', 'Taille du gousset', 'gussetSizeMm')],
  SASH: [range('widthMm', 'Largeur', 'sashWidthMm'), range('lengthMm', 'Longueur', 'sashLengthMm')],
  PUFF_SUPPORT: [],
  APRON: [range('lengthMm', 'Longueur', 'apronLengthMm'), range('fullness', 'Ampleur', 'apronFullness', ' ×')],
  EMBROIDERY: [
    select('place', 'Emplacement', [['ENCOLURE', 'Encolure'], ['CORSAGE', 'Plastron'], ['MANCHES', 'Bas des manches'], ['OURLET', 'Bas de la jupe']]),
    range('widthMm', 'Largeur brodée', 'embroideryWidthMm'),
  ],
  SMOCKING: [
    select('place', 'Emplacement', [['CORSAGE', 'Plastron'], ['MANCHES', 'Bas des manches'], ['TAILLE', 'Taille']]),
    range('rows', 'Rangs', 'smockRows', ''),
    range('ratio', 'Ampleur avant smocks', 'smockRatio', ' ×'),
  ],
  CONTRAST_CUFFS: [range('heightMm', 'Hauteur du poignet', 'cuffHeightMm')],
};

/** Kinds that take a material (the others are cut in the dress fabric or a construction cloth). */
export const WITH_MATERIAL: ReadonlySet<ConstructionKind> = new Set(['HEM_FLOUNCE', 'PEPLUM', 'JABOT', 'CAPELET', 'BOW', 'HEM_BANDS', 'ENGAGEANTES', 'SASH', 'APRON']);
/** Kinds that take a colour. */
export const WITH_COLOR: ReadonlySet<ConstructionKind> = new Set([...WITH_MATERIAL, 'EMBROIDERY', 'CONTRAST_CUFFS']);

/** Starting values when a piece is switched on (inside the validated bounds). */
export const DEFAULT_CONSTRUCTION: Record<ConstructionKind, ConstructionItem> = {
  LINING: { kind: 'LINING' },
  INTERFACING: { kind: 'INTERFACING' },
  HEM_FLOUNCE: { kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 150, style: 'FRONCE' },
  GODETS: { kind: 'GODETS', count: 6, heightMm: 350, widthMm: 280 },
  PEPLUM: { kind: 'PEPLUM', style: 'CIRCULAIRE', depthMm: 150 },
  JABOT: { kind: 'JABOT', lengthMm: 180, tiers: 2, material: 'DENTELLE' },
  CAPELET: { kind: 'CAPELET', lengthMm: 250 },
  BOW: { kind: 'BOW', place: 'DOS', widthMm: 250 },
  HEM_BANDS: { kind: 'HEM_BANDS', rows: 2, widthMm: 40, gapMm: 60, material: 'CONTRASTE' },
  ENGAGEANTES: { kind: 'ENGAGEANTES', tiers: 2, depthMm: 90, material: 'DENTELLE' },
  BALAYEUSE: { kind: 'BALAYEUSE', depthMm: 80 },
  BUSTLE: { kind: 'BUSTLE', style: 'POUF' },
  WATTEAU_PLEAT: { kind: 'WATTEAU_PLEAT', depthMm: 80 },
  SEAM_POCKETS: { kind: 'SEAM_POCKETS' },
  BIAS_BINDING: { kind: 'BIAS_BINDING', widthMm: 30 },
  UNDERARM_GUSSET: { kind: 'UNDERARM_GUSSET', sizeMm: 100 },
  SASH: { kind: 'SASH', widthMm: 250, lengthMm: 2000 },
  PUFF_SUPPORT: { kind: 'PUFF_SUPPORT' },
  APRON: { kind: 'APRON', lengthMm: 550, fullness: 1.5, material: 'CONTRASTE' },
  EMBROIDERY: { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50 },
  SMOCKING: { kind: 'SMOCKING', place: 'CORSAGE', rows: 8, ratio: 3 },
  CONTRAST_CUFFS: { kind: 'CONTRAST_CUFFS', heightMm: 60 },
};

export const ALL_CONSTRUCTION_KINDS: readonly ConstructionKind[] = CONSTRUCTION_KINDS;

/** The first item of a kind (the editor shows one per kind). */
export const findConstruction = (spec: ConstructionSpec | undefined, kind: ConstructionKind): ConstructionItem | undefined =>
  spec?.items.find((c) => c.kind === kind);

/** Switches a piece on (with its defaults) or off (every item of that kind). An empty list means « none » on purpose. */
export function toggleConstruction(spec: ConstructionSpec | undefined, kind: ConstructionKind): ConstructionSpec {
  const items = spec?.items ?? [];
  return items.some((c) => c.kind === kind) ? { items: items.filter((c) => c.kind !== kind) } : { items: [...items, DEFAULT_CONSTRUCTION[kind]] };
}

/**
 * Changes one field of the first item of a kind. Re-validated: an invalid value keeps the previous list, so the UI never
 * saves what the API would reject. `null` removes an optional field (material, colour).
 */
export function updateConstruction(spec: ConstructionSpec | undefined, kind: ConstructionKind, patch: Record<string, number | string | null>): ConstructionSpec {
  const current = spec ?? { items: [] };
  let done = false;
  const next = current.items.map((c) => {
    if (done || c.kind !== kind) return c;
    done = true;
    const merged: Record<string, unknown> = { ...c, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v === null) delete merged[k];
    return merged;
  });
  const { value, issues } = validatePatternExtParameters({ construction: { items: next } });
  return issues.length > 0 || !value.construction ? current : value.construction;
}
