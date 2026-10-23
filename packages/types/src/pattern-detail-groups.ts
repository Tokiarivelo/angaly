import { PATTERN_DETAIL_OPTIONS, type PatternDetailGroup } from './pattern-detail-options';

/**
 * Detail groups each garment's pattern rule reads (`packages/pattern-engine/src/rules/*.rule.ts`): the wizard offers
 * only these, the API asks the AI only for these, a value left in another group is dropped. `dos` is drawn by
 * `RobeRule` (V, dos nu, goutte, transparent). AUTRE (free brief) and unknown garments keep every group.
 */
export const DETAIL_GROUPS_BY_GARMENT: Readonly<Record<string, readonly PatternDetailGroup[]>> = {
  ROBE: ['manches', 'col', 'decollete', 'dos', 'longueur', 'fermeture', 'corsage', 'taille', 'devant', 'jupe', 'basque'],
  ROBE_MARIEE: ['manches', 'col', 'decollete', 'dos', 'longueur', 'corsage', 'taille', 'jupe'],
  JUPE: ['longueur', 'taille', 'ceinture', 'fermeture', 'plis', 'poches', 'fente'],
  PANTALON: ['longueur', 'taille', 'ceinture', 'fermeture', 'plis', 'poches', 'poches_dos', 'bas'],
  VESTE: ['manches', 'col', 'decollete', 'longueur'],
  CHEMISE: ['manches', 'col', 'decollete', 'longueur'],
  // The suit's trousers follow PantalonRule (pleats, pockets, turn-up); the jacket the top's groups.
  COSTUME: ['manches', 'col', 'decollete', 'longueur', 'plis', 'poches', 'poches_dos', 'bas'],
};

export function detailGroupsForGarment(garmentType: string | null | undefined): readonly PatternDetailGroup[] {
  return DETAIL_GROUPS_BY_GARMENT[(garmentType ?? '').toUpperCase()] ?? (Object.keys(PATTERN_DETAIL_OPTIONS) as PatternDetailGroup[]);
}
