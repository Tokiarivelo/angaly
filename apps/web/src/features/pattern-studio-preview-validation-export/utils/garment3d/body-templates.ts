/**
 * Mannequin morphology templates (metres). A template supplies a plausible whole body; every
 * measurement the customer actually gave overrides the matching value, so the figure ends up
 * fitting the real person while unmeasured parts stay proportionate.
 * Procedural on purpose: no downloaded mesh, so every dimension stays driven by numbers.
 */

export type BodyTemplateId =
  | 'FEMME_STANDARD'
  | 'FEMME_SABLIER'
  | 'FEMME_POIRE'
  | 'FEMME_RECTANGLE'
  | 'FEMME_RONDE'
  | 'FEMME_PETITE'
  | 'FEMME_GRANDE'
  | 'HOMME_STANDARD'
  | 'HOMME_ATHLETIQUE'
  | 'HOMME_COSTAUD'
  | 'ENFANT_10_ANS'
  | 'ENFANT_GARCON';

export interface BodyTemplate {
  id: BodyTemplateId;
  label: string;
  /** Total stature. */
  height: number;
  bust: number;
  waist: number;
  hip: number;
  neck: number;
  backLength: number;
  armLength: number;
  /** Seam-to-seam shoulder width. */
  shoulderWidth: number;
  thigh: number;
  knee: number;
  ankle: number;
  upperArm: number;
  wrist: number;
  /** Cross-section depth / width of the torso at bust, waist and hip. */
  depth: { bust: number; waist: number; hip: number };
  headRadius: number;
  skin: string;
  /** Crotch height ÷ stature (anthropometric: ≈ 0.45 for women and children, ≈ 0.47 for men). */
  crotchRatio: number;
  /** Nape (C7) height ÷ stature: ≈ 0.853 for adults, lower for children (a larger head). */
  napeRatio: number;
}

const base = {
  neck: 0.36,
  armLength: 0.58,
  shoulderWidth: 0.35,
  thigh: 0.56,
  knee: 0.38,
  ankle: 0.22,
  upperArm: 0.27,
  wrist: 0.16,
  depth: { bust: 0.78, waist: 0.74, hip: 0.78 },
  headRadius: 0.095,
  skin: '#DDB094',
  crotchRatio: 0.453,
  napeRatio: 0.853,
};

export const BODY_TEMPLATES: BodyTemplate[] = [
  { ...base, id: 'FEMME_STANDARD', label: 'Femme — standard', height: 1.7, bust: 0.88, waist: 0.68, hip: 0.94, backLength: 0.4 },
  { ...base, id: 'FEMME_SABLIER', label: 'Femme — sablier', height: 1.68, bust: 0.97, waist: 0.69, hip: 0.99, backLength: 0.4, thigh: 0.58, upperArm: 0.28, depth: { bust: 0.8, waist: 0.72, hip: 0.8 } },
  { ...base, id: 'FEMME_POIRE', label: 'Femme — poire', height: 1.66, bust: 0.86, waist: 0.73, hip: 1.04, backLength: 0.39, thigh: 0.62, knee: 0.4, upperArm: 0.26, depth: { bust: 0.76, waist: 0.74, hip: 0.82 } },
  { ...base, id: 'FEMME_RECTANGLE', label: 'Femme — rectangle', height: 1.7, bust: 0.88, waist: 0.78, hip: 0.9, backLength: 0.41, thigh: 0.53, depth: { bust: 0.74, waist: 0.74, hip: 0.74 } },
  { ...base, id: 'FEMME_RONDE', label: 'Femme — forte', height: 1.65, bust: 1.08, waist: 0.92, hip: 1.14, neck: 0.39, backLength: 0.41, armLength: 0.57, shoulderWidth: 0.39, thigh: 0.68, knee: 0.44, ankle: 0.24, upperArm: 0.34, wrist: 0.17, depth: { bust: 0.84, waist: 0.82, hip: 0.84 }, headRadius: 0.097 },
  { ...base, id: 'FEMME_PETITE', label: 'Femme — petite', height: 1.58, bust: 0.84, waist: 0.66, hip: 0.9, backLength: 0.37, armLength: 0.54, shoulderWidth: 0.33, thigh: 0.53, knee: 0.36, ankle: 0.2, upperArm: 0.25, wrist: 0.15 },
  { ...base, id: 'FEMME_GRANDE', label: 'Femme — grande', height: 1.78, bust: 0.9, waist: 0.7, hip: 0.96, backLength: 0.42, armLength: 0.62, shoulderWidth: 0.37, thigh: 0.58, knee: 0.39 },
  { ...base, id: 'HOMME_STANDARD', label: 'Homme — standard', height: 1.78, bust: 1.0, waist: 0.86, hip: 0.98, neck: 0.4, backLength: 0.45, armLength: 0.64, shoulderWidth: 0.46, thigh: 0.58, knee: 0.4, ankle: 0.23, upperArm: 0.32, wrist: 0.175, depth: { bust: 0.72, waist: 0.76, hip: 0.74 }, headRadius: 0.1, skin: '#C99B7E', crotchRatio: 0.47 },
  { ...base, id: 'HOMME_ATHLETIQUE', label: 'Homme — athlétique', height: 1.82, bust: 1.08, waist: 0.82, hip: 0.98, neck: 0.42, backLength: 0.46, armLength: 0.66, shoulderWidth: 0.5, thigh: 0.62, knee: 0.41, ankle: 0.23, upperArm: 0.36, wrist: 0.18, depth: { bust: 0.74, waist: 0.74, hip: 0.74 }, headRadius: 0.1, skin: '#C99B7E', crotchRatio: 0.47 },
  { ...base, id: 'HOMME_COSTAUD', label: 'Homme — costaud', height: 1.83, bust: 1.14, waist: 0.86, hip: 1.0, neck: 0.43, backLength: 0.46, armLength: 0.66, shoulderWidth: 0.53, thigh: 0.64, knee: 0.42, ankle: 0.24, upperArm: 0.39, wrist: 0.185, depth: { bust: 0.76, waist: 0.76, hip: 0.76 }, headRadius: 0.1, skin: '#C99B7E', crotchRatio: 0.47 },
  { ...base, id: 'ENFANT_10_ANS', label: 'Enfant — fille (10 ans)', height: 1.4, bust: 0.68, waist: 0.6, hip: 0.72, neck: 0.3, backLength: 0.33, armLength: 0.47, shoulderWidth: 0.3, thigh: 0.4, knee: 0.29, ankle: 0.17, upperArm: 0.2, wrist: 0.13, depth: { bust: 0.78, waist: 0.8, hip: 0.8 }, headRadius: 0.085, napeRatio: 0.825 },
  { ...base, id: 'ENFANT_GARCON', label: 'Enfant — garçon (10 ans)', height: 1.4, bust: 0.68, waist: 0.6, hip: 0.72, neck: 0.3, backLength: 0.33, armLength: 0.47, shoulderWidth: 0.3, thigh: 0.4, knee: 0.29, ankle: 0.17, upperArm: 0.2, wrist: 0.13, depth: { bust: 0.78, waist: 0.8, hip: 0.8 }, headRadius: 0.085, napeRatio: 0.825 },
];

export const DEFAULT_TEMPLATE_ID: BodyTemplateId = 'FEMME_STANDARD';

export const getBodyTemplate = (id: string | null | undefined): BodyTemplate =>
  BODY_TEMPLATES.find((t) => t.id === id) ?? BODY_TEMPLATES[0]!;

/** Template that best matches the measurements given (bust/waist/hip), used as the initial pick. */
export const suggestTemplate = (m: Record<string, number> | null | undefined): BodyTemplateId => {
  const bust = m?.['TOUR_POITRINE'];
  const waist = m?.['TOUR_TAILLE'];
  const hip = m?.['TOUR_BASSIN'];
  if (!bust || !waist || !hip) return DEFAULT_TEMPLATE_ID;
  const candidates = BODY_TEMPLATES.filter((t) => t.id.startsWith('FEMME_') && !['FEMME_PETITE', 'FEMME_GRANDE'].includes(t.id));
  const score = (t: BodyTemplate) =>
    Math.abs(t.bust * 100 - bust) + Math.abs(t.waist * 100 - waist) + Math.abs(t.hip * 100 - hip);
  return candidates.reduce((best, t) => (score(t) < score(best) ? t : best)).id;
};
