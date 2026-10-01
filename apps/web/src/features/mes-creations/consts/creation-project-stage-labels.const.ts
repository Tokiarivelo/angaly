import { CreationProjectStage } from '@angaly/types';

/** Libellés FR des étapes du pipeline « Mes créations » (spec §53). */
export const CREATION_PROJECT_STAGE_LABELS: Record<CreationProjectStage, string> = {
  [CreationProjectStage.CONSULTATION]: 'Consultation',
  [CreationProjectStage.CONCEPTION]: 'Conception',
  [CreationProjectStage.PATRON]: 'Patron',
  [CreationProjectStage.CONFECTION]: 'Confection',
  [CreationProjectStage.ESSAYAGE]: 'Essayage',
  [CreationProjectStage.TERMINEE]: 'Terminée',
};

/** Pastille de statut affichée en tête de carte (maquette Stitch « Mes créations »). */
export const CREATION_PROJECT_STATUS_BADGES: Record<CreationProjectStage, string> = {
  [CreationProjectStage.CONSULTATION]: 'Consultation en cours',
  [CreationProjectStage.CONCEPTION]: 'Conception en cours',
  [CreationProjectStage.PATRON]: 'Validation du patronage',
  [CreationProjectStage.CONFECTION]: "En confection à l'Atelier",
  [CreationProjectStage.ESSAYAGE]: 'Essayage à planifier',
  [CreationProjectStage.TERMINEE]: 'Pièce livrée & terminée',
};
