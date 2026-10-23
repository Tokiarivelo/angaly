/**
 * Construction pieces and advanced garnitures (`parametersExtJson.construction`): lining, interfacing, hem flounces,
 * godets, peplum, jabot, capelet, bows, applied bands, engageantes, balayeuse, bustle, Watteau pleat, pockets, bias,
 * gusset, sash, puff support, apron. The engine derives every piece from the garment's own pieces
 * (`packages/pattern-engine/src/shared/construction.ts`, structural copy of these types). Lengths in mm.
 */

export const CONSTRUCTION_KINDS = [
  'LINING',
  'INTERFACING',
  'HEM_FLOUNCE',
  'GODETS',
  'PEPLUM',
  'JABOT',
  'CAPELET',
  'BOW',
  'HEM_BANDS',
  'ENGAGEANTES',
  'BALAYEUSE',
  'BUSTLE',
  'WATTEAU_PLEAT',
  'SEAM_POCKETS',
  'BIAS_BINDING',
  'UNDERARM_GUSSET',
  'SASH',
  'PUFF_SUPPORT',
  'APRON',
  'EMBROIDERY',
  'SMOCKING',
  'CONTRAST_CUFFS',
] as const;
export type ConstructionKind = (typeof CONSTRUCTION_KINDS)[number];

export const CONSTRUCTION_MATERIALS = ['TISSU', 'DENTELLE', 'TULLE', 'CONTRASTE'] as const;
export type ConstructionMaterial = (typeof CONSTRUCTION_MATERIALS)[number];
export const CONSTRUCTION_PARTS = ['CORSAGE', 'JUPE', 'MANCHES'] as const;
export type ConstructionPart = (typeof CONSTRUCTION_PARTS)[number];

export const CONSTRUCTION_LABELS: Record<ConstructionKind, string> = {
  LINING: 'Doublure',
  INTERFACING: 'Entoilage',
  HEM_FLOUNCE: 'Volant(s) d’ourlet / étagés',
  GODETS: 'Godets',
  PEPLUM: 'Basque rapportée (péplum)',
  JABOT: 'Jabot',
  CAPELET: 'Pèlerine',
  BOW: 'Chou (gros nœud)',
  HEM_BANDS: 'Bandes appliquées',
  ENGAGEANTES: 'Engageantes',
  BALAYEUSE: 'Balayeuse',
  BUSTLE: 'Tournure / paniers',
  WATTEAU_PLEAT: 'Pli Watteau',
  SEAM_POCKETS: 'Poches dans les coutures',
  BIAS_BINDING: 'Finitions au biais',
  UNDERARM_GUSSET: 'Goussets de dessous de bras',
  SASH: 'Écharpe drapée',
  PUFF_SUPPORT: 'Soutien de bouffant',
  APRON: 'Tablier',
  EMBROIDERY: 'Broderie',
  SMOCKING: 'Smocks',
  CONTRAST_CUFFS: 'Poignets contrastés',
};

interface Bounds {
  min: number;
  max: number;
}

export const CONSTRUCTION_BOUNDS = {
  flounceTiers: { min: 1, max: 5 },
  flounceDepthMm: { min: 40, max: 450 },
  godetCount: { min: 2, max: 24 },
  godetHeightMm: { min: 100, max: 800 },
  godetWidthMm: { min: 80, max: 800 },
  peplumDepthMm: { min: 50, max: 350 },
  jabotLengthMm: { min: 80, max: 450 },
  jabotTiers: { min: 1, max: 4 },
  capeletLengthMm: { min: 100, max: 600 },
  bowWidthMm: { min: 80, max: 600 },
  bandRows: { min: 1, max: 6 },
  bandWidthMm: { min: 10, max: 200 },
  bandGapMm: { min: 0, max: 400 },
  engageanteTiers: { min: 1, max: 4 },
  engageanteDepthMm: { min: 40, max: 250 },
  balayeuseDepthMm: { min: 30, max: 200 },
  watteauDepthMm: { min: 30, max: 200 },
  biasWidthMm: { min: 15, max: 60 },
  gussetSizeMm: { min: 70, max: 200 },
  sashWidthMm: { min: 60, max: 700 },
  sashLengthMm: { min: 600, max: 4000 },
  apronLengthMm: { min: 200, max: 1100 },
  apronFullness: { min: 1, max: 2.5 },
  embroideryWidthMm: { min: 10, max: 300 },
  smockRows: { min: 3, max: 30 },
  smockRatio: { min: 2, max: 4 },
  cuffHeightMm: { min: 20, max: 160 },
} as const satisfies Record<string, Bounds>;
export const MAX_CONSTRUCTION_ITEMS = 16;

type Styled = { material?: ConstructionMaterial; color?: string };
export type ConstructionItem =
  | { kind: 'LINING'; parts?: ConstructionPart[] }
  | { kind: 'INTERFACING' }
  | ({ kind: 'HEM_FLOUNCE'; tiers: number; depthMm: number; style: 'FRONCE' | 'CIRCULAIRE' } & Styled)
  | { kind: 'GODETS'; count: number; heightMm: number; widthMm: number }
  | ({ kind: 'PEPLUM'; style: 'CIRCULAIRE' | 'POINTES' | 'FRONCEE'; depthMm: number } & Styled)
  | ({ kind: 'JABOT'; lengthMm: number; tiers: number } & Styled)
  | ({ kind: 'CAPELET'; lengthMm: number } & Styled)
  | ({ kind: 'BOW'; place: 'MANCHES' | 'DOS' | 'TAILLE' | 'ENCOLURE'; widthMm: number } & Styled)
  | ({ kind: 'HEM_BANDS'; rows: number; widthMm: number; gapMm: number } & Styled)
  | ({ kind: 'ENGAGEANTES'; tiers: number; depthMm: number } & Styled)
  | { kind: 'BALAYEUSE'; depthMm: number }
  | { kind: 'BUSTLE'; style: 'COUSSIN' | 'POUF' | 'PANIERS' }
  | { kind: 'WATTEAU_PLEAT'; depthMm: number }
  | { kind: 'SEAM_POCKETS' }
  | { kind: 'BIAS_BINDING'; widthMm: number }
  | { kind: 'UNDERARM_GUSSET'; sizeMm: number }
  | ({ kind: 'SASH'; widthMm: number; lengthMm: number } & Styled)
  | { kind: 'PUFF_SUPPORT' }
  | ({ kind: 'APRON'; lengthMm: number; fullness: number } & Styled)
  | { kind: 'EMBROIDERY'; place: 'ENCOLURE' | 'CORSAGE' | 'MANCHES' | 'OURLET'; widthMm: number; color?: string }
  | { kind: 'SMOCKING'; place: 'CORSAGE' | 'MANCHES' | 'TAILLE'; rows: number; ratio: number }
  | { kind: 'CONTRAST_CUFFS'; heightMm: number; color?: string };

export interface ConstructionSpec {
  items: ConstructionItem[];
}

export interface ConstructionIssue {
  path: string;
  message: string;
}

/** Field rules per kind: a numeric field with its bounds, or an enum field with its values. */
type FieldRule = { num: Bounds } | { oneOf: readonly string[] };
const FIELDS: Record<ConstructionKind, Record<string, FieldRule>> = {
  LINING: {},
  INTERFACING: {},
  HEM_FLOUNCE: { tiers: { num: CONSTRUCTION_BOUNDS.flounceTiers }, depthMm: { num: CONSTRUCTION_BOUNDS.flounceDepthMm }, style: { oneOf: ['FRONCE', 'CIRCULAIRE'] } },
  GODETS: { count: { num: CONSTRUCTION_BOUNDS.godetCount }, heightMm: { num: CONSTRUCTION_BOUNDS.godetHeightMm }, widthMm: { num: CONSTRUCTION_BOUNDS.godetWidthMm } },
  PEPLUM: { style: { oneOf: ['CIRCULAIRE', 'POINTES', 'FRONCEE'] }, depthMm: { num: CONSTRUCTION_BOUNDS.peplumDepthMm } },
  JABOT: { lengthMm: { num: CONSTRUCTION_BOUNDS.jabotLengthMm }, tiers: { num: CONSTRUCTION_BOUNDS.jabotTiers } },
  CAPELET: { lengthMm: { num: CONSTRUCTION_BOUNDS.capeletLengthMm } },
  BOW: { place: { oneOf: ['MANCHES', 'DOS', 'TAILLE', 'ENCOLURE'] }, widthMm: { num: CONSTRUCTION_BOUNDS.bowWidthMm } },
  HEM_BANDS: { rows: { num: CONSTRUCTION_BOUNDS.bandRows }, widthMm: { num: CONSTRUCTION_BOUNDS.bandWidthMm }, gapMm: { num: CONSTRUCTION_BOUNDS.bandGapMm } },
  ENGAGEANTES: { tiers: { num: CONSTRUCTION_BOUNDS.engageanteTiers }, depthMm: { num: CONSTRUCTION_BOUNDS.engageanteDepthMm } },
  BALAYEUSE: { depthMm: { num: CONSTRUCTION_BOUNDS.balayeuseDepthMm } },
  BUSTLE: { style: { oneOf: ['COUSSIN', 'POUF', 'PANIERS'] } },
  WATTEAU_PLEAT: { depthMm: { num: CONSTRUCTION_BOUNDS.watteauDepthMm } },
  SEAM_POCKETS: {},
  BIAS_BINDING: { widthMm: { num: CONSTRUCTION_BOUNDS.biasWidthMm } },
  UNDERARM_GUSSET: { sizeMm: { num: CONSTRUCTION_BOUNDS.gussetSizeMm } },
  SASH: { widthMm: { num: CONSTRUCTION_BOUNDS.sashWidthMm }, lengthMm: { num: CONSTRUCTION_BOUNDS.sashLengthMm } },
  PUFF_SUPPORT: {},
  APRON: { lengthMm: { num: CONSTRUCTION_BOUNDS.apronLengthMm }, fullness: { num: CONSTRUCTION_BOUNDS.apronFullness } },
  EMBROIDERY: { place: { oneOf: ['ENCOLURE', 'CORSAGE', 'MANCHES', 'OURLET'] }, widthMm: { num: CONSTRUCTION_BOUNDS.embroideryWidthMm } },
  SMOCKING: { place: { oneOf: ['CORSAGE', 'MANCHES', 'TAILLE'] }, rows: { num: CONSTRUCTION_BOUNDS.smockRows }, ratio: { num: CONSTRUCTION_BOUNDS.smockRatio } },
  CONTRAST_CUFFS: { heightMm: { num: CONSTRUCTION_BOUNDS.cuffHeightMm } },
};
/** Kinds that take a colour but no material (thread, contrasting cuffs). */
const COLOURED: ReadonlySet<ConstructionKind> = new Set(['EMBROIDERY', 'CONTRAST_CUFFS']);
/** Kinds that take a material and a colour. */
const STYLED: ReadonlySet<ConstructionKind> = new Set(['HEM_FLOUNCE', 'PEPLUM', 'JABOT', 'CAPELET', 'BOW', 'HEM_BANDS', 'ENGAGEANTES', 'SASH', 'APRON']);
/** Kinds that may appear more than once (a bow on the sleeves and one at the back). */
const REPEATABLE: ReadonlySet<ConstructionKind> = new Set(['BOW', 'EMBROIDERY', 'SMOCKING']);

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Validates `construction` ({ items: [...] }). Each item is checked on its own: an invalid one is reported and dropped.
 * Each kind at most once (bows once per place). An explicit empty list means « no construction pieces ».
 */
export function validateConstructionSpec(input: unknown, issues: ConstructionIssue[]): ConstructionSpec | undefined {
  const rawItems = (input as { items?: unknown } | null)?.items;
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !Array.isArray(rawItems)) {
    issues.push({ path: 'construction', message: 'construction doit être { items: [...] }.' });
    return undefined;
  }
  if (rawItems.length > MAX_CONSTRUCTION_ITEMS) {
    issues.push({ path: 'construction.items', message: `Au plus ${MAX_CONSTRUCTION_ITEMS} pièces de construction.` });
  }
  const items: ConstructionItem[] = [];
  const seen = new Set<string>();
  rawItems.slice(0, MAX_CONSTRUCTION_ITEMS).forEach((raw, index) => {
    const path = `construction.items[${index}]`;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      issues.push({ path, message: `${path} doit être un objet.` });
      return;
    }
    const t = raw as Record<string, unknown>;
    const kind = t['kind'];
    if (typeof kind !== 'string' || !(CONSTRUCTION_KINDS as readonly string[]).includes(kind)) {
      issues.push({ path: `${path}.kind`, message: `kind doit valoir ${CONSTRUCTION_KINDS.join(', ')}.` });
      return;
    }
    const k = kind as ConstructionKind;
    const item: Record<string, unknown> = { kind: k };
    let ok = true;
    for (const [field, rule] of Object.entries(FIELDS[k])) {
      const v = t[field];
      if ('num' in rule) {
        if (typeof v !== 'number' || !Number.isFinite(v) || v < rule.num.min || v > rule.num.max) {
          issues.push({ path: `${path}.${field}`, message: `${field} doit être un nombre entre ${rule.num.min} et ${rule.num.max}.` });
          ok = false;
        } else item[field] = v;
      } else if (typeof v !== 'string' || !rule.oneOf.includes(v)) {
        issues.push({ path: `${path}.${field}`, message: `${field} doit valoir ${rule.oneOf.join(', ')}.` });
        ok = false;
      } else item[field] = v;
    }
    if (k === 'LINING' && t['parts'] !== undefined) {
      const parts = t['parts'];
      if (!Array.isArray(parts) || parts.some((p) => typeof p !== 'string' || !(CONSTRUCTION_PARTS as readonly string[]).includes(p))) {
        issues.push({ path: `${path}.parts`, message: `parts doit être une liste de ${CONSTRUCTION_PARTS.join(', ')}.` });
        ok = false;
      } else item['parts'] = [...new Set(parts as string[])];
    }
    if (COLOURED.has(k) && t['color'] !== undefined) {
      if (typeof t['color'] !== 'string' || !HEX.test(t['color'])) {
        issues.push({ path: `${path}.color`, message: 'color doit être une couleur #rrggbb.' });
        ok = false;
      } else item['color'] = t['color'];
    }
    if (STYLED.has(k)) {
      const material = t['material'];
      if (material !== undefined) {
        if (typeof material !== 'string' || !(CONSTRUCTION_MATERIALS as readonly string[]).includes(material)) {
          issues.push({ path: `${path}.material`, message: `material doit valoir ${CONSTRUCTION_MATERIALS.join(', ')}.` });
          ok = false;
        } else item['material'] = material;
      }
      const color = t['color'];
      if (color !== undefined) {
        if (typeof color !== 'string' || !HEX.test(color)) {
          issues.push({ path: `${path}.color`, message: 'color doit être une couleur #rrggbb.' });
          ok = false;
        } else item['color'] = color;
      }
    }
    if (!ok) return;
    const key = REPEATABLE.has(k) ? `${k}:${String(item['place'])}` : k;
    if (seen.has(key)) {
      issues.push({ path, message: `La pièce de construction ${key} ne peut apparaître qu'une fois.` });
      return;
    }
    seen.add(key);
    items.push(item as ConstructionItem);
  });
  return { items };
}
