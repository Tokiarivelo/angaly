import type { PatternNotes } from '@angaly/types';

/** French names of the detail groups, for the atelier's notes. */
const GROUP_NAMES: Record<string, string> = {
  manches: 'Manches',
  col: 'Col',
  decollete: 'Encolure',
  dos: 'Dos',
  longueur: 'Longueur',
  fermeture: 'Fermeture',
  corsage: 'Corsage',
  taille: 'Taille',
  devant: 'Devant',
  jupe: 'Jupe',
  ceinture: 'Ceinture',
  plis: 'Plis et pinces',
  poches: 'Poches devant',
  poches_dos: 'Poches dos',
  bas: 'Bas de jambe',
  fente: 'Fente',
};

/**
 * The customer's own requests (what the choices do not cover), as notices on the generated version: the engine never
 * draws them, the atelier adapts the pattern by hand.
 */
export function customerNoteWarnings(notes: PatternNotes | null | undefined): string[] {
  if (!notes) return [];
  const out: string[] = [];
  for (const [group, text] of Object.entries(notes.details ?? {})) {
    if (text?.trim()) out.push(`Demande particulière (${GROUP_NAMES[group] ?? group}) : « ${text.trim()} » — à reporter à la main sur le patron.`);
  }
  if (notes.general?.trim()) out.push(`Précisions pour l'atelier : « ${notes.general.trim()} »`);
  if (notes.measurements?.length) {
    out.push(`Mesures supplémentaires : ${notes.measurements.map((m) => `${m.label} ${m.cm} cm`).join(', ')} — à vérifier par l'atelier.`);
  }
  return out;
}
