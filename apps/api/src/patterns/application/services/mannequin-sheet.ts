import {
  DRAPE_BLOCK_LABELS,
  MANNEQUIN_SHEET_LIMITS,
  type ConstructionApproach,
  type DrapeBlock,
  type FabricBehavior,
  type GarmentProfile,
  type MannequinSheet,
  type MannequinSheetSection,
  type PatternExtParameters,
} from '@angaly/types';

const BEHAVIOR_ADVICE: Record<FabricBehavior, string> = {
  FLUIDE: 'Tissu fluide : le drapé suit la gravité, privilégier des plis souples et peu de coutures.',
  STRUCTURE: 'Tissu structuré : les plis tiennent d’eux-mêmes, marquer les plis au fer avant de les épingler.',
  RIGIDE: 'Tissu rigide : travailler sur une toile de montage, le tissu fini ne se « façonne » pas.',
  STRETCH: 'Tissu extensible : draper sans tendre le tissu, épingler à plat sur la maille détendue.',
};

const trim = (text: string, max: number): string => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

const describeBlock = (block: DrapeBlock): string => DRAPE_BLOCK_LABELS[block.kind].toLowerCase();

const formatMetres = (mm: number): string => `${(mm / 1000).toFixed(1).replace('.', ',')} m`;

export interface MannequinSheetInput {
  approach: ConstructionApproach;
  profile: GarmentProfile | null | undefined;
  ext: PatternExtParameters | null | undefined;
  /** Indicative flat-pattern length on a 140 cm fabric (engine `metadata.yardage.lengthMm`). */
  flatYardageMm: number | null | undefined;
}

/**
 * Builds the draping sheet from rules and the photo's own notes — deterministic, so every number and
 * step is traceable (no model text reaches the sheet except the ≤ 400-character, already validated
 * `constructionNotes`). Returns null when nothing has to be moulded. Bounded: sections ≤ 700 characters,
 * whole sheet ≤ 3500.
 */
export function buildMannequinSheet(input: MannequinSheetInput): MannequinSheet | null {
  const { approach, profile, ext, flatYardageMm } = input;
  if (approach !== 'FLAT_BASE_PLUS_MANNEQUIN' && approach !== 'MANNEQUIN_ONLY') return null;

  const blocks = ext?.drape?.blocks ?? [];
  const notes = profile?.constructionNotes?.trim() || null;
  const fullDrape = approach === 'MANNEQUIN_ONLY';
  const behavior = profile?.fit?.fabricBehavior;

  const zones = [
    notes ?? (fullDrape ? 'Tout le vêtement est drapé : aucune zone ne se trace à plat.' : 'Partie libre à préciser avec le client.'),
    fullDrape
      ? 'Le patron à plat fourni ne couvre que la doublure / le bloc de base.'
      : blocks.length > 0
        ? `Tracé à plat : base ajustée et ${blocks.map(describeBlock).join(', ')}.`
        : 'Tracé à plat : la base ajustée (buste, taille, hanches).',
  ].join(' ');

  const grain = [
    'Fil droit parallèle au milieu devant pour la base et les pans réguliers.',
    blocks.some((b) => b.kind === 'COWL_NECK') ? 'Le col bénitier se coupe dans le biais (45°).' : null,
    fullDrape || !blocks.length
      ? 'Les plis libres tombent mieux sur le droit-fil pour une chute verticale, en biais pour un drapé qui épouse le corps.'
      : null,
    behavior ? BEHAVIOR_ADVICE[behavior] : null,
  ]
    .filter(Boolean)
    .join(' ');

  const flat = flatYardageMm && flatYardageMm > 0 ? flatYardageMm : null;
  const fabric = flat
    ? fullDrape
      ? `Estimation indicative : environ ${formatMetres(Math.ceil((flat * 1.6) / 100) * 100)} en 140 cm de laize (doublure à plat + drapé libre, +60 %). À confirmer sur le mannequin.`
      : `Estimation indicative : environ ${formatMetres(flat)} pour le patron à plat, plus ${formatMetres(Math.ceil((flat * 0.4) / 100) * 100)} pour la partie drapée (140 cm de laize). À confirmer sur le mannequin.`
    : 'Quantité de tissu à estimer sur le mannequin (140 cm de laize) : prévoir une marge généreuse pour le drapé.';

  const steps = [
    '1. Régler le mannequin aux mesures de la cliente et poser les repères (milieu devant et dos, poitrine, taille, hanches).',
    fullDrape
      ? '2. Épingler le tissu directement sur le mannequin depuis le point d’ancrage (épaule ou taille).'
      : '2. Monter la base ajustée à plat sur le mannequin et la vérifier.',
    notes ? `3. Façonner le drapé décrit : ${trim(notes, 220)}` : '3. Façonner les plis en suivant la photo d’inspiration.',
    '4. Repérer chaque pli (traits de craie ou fil de bâti), puis désépingler avec précaution.',
    '5. Reporter sur papier ou toile, corriger la symétrie et valider sur une toile d’essai avant la coupe.',
  ].join(' ');

  const cautions =
    'Fiche indicative générée à partir de la photo et de règles de construction : elle ne remplace pas le jugement de la couturière. ' +
    'Les plis visibles sur une photo portée peuvent venir de la pose. Valider sur toile d’essai avant de couper le tissu final.';

  const sections: MannequinSheetSection[] = [
    { id: 'ZONES', title: 'Zones à draper', body: zones },
    { id: 'GRAIN', title: 'Sens du fil', body: grain },
    { id: 'FABRIC', title: 'Quantité de tissu estimée', body: fabric },
    { id: 'STEPS', title: 'Étapes d’épinglage', body: steps },
    { id: 'CAUTIONS', title: 'Précautions', body: cautions },
  ].map((s) => ({ ...s, body: trim(s.body, MANNEQUIN_SHEET_LIMITS.sectionChars) })) as MannequinSheetSection[];

  // Hard cap on the whole sheet (never reached with the limits above; kept as a safety net).
  let budget: number = MANNEQUIN_SHEET_LIMITS.totalChars;
  for (const section of sections) {
    section.body = trim(section.body, Math.max(0, Math.min(section.body.length, budget)));
    budget -= section.body.length;
  }

  return {
    approach,
    title: fullDrape ? 'Fiche de moulage — drapé sur mannequin' : 'Fiche de moulage — partie drapée sur mannequin',
    sections,
    indicative: true,
  };
}
