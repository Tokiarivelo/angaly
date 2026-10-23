export type StudioTool = 'select' | 'pan' | 'add' | 'remove' | 'draw' | 'measure' | 'notch' | 'grain';

export interface StudioToolDefinition {
  id: StudioTool;
  label: string;
  hint: string;
  shortcut: string;
}

export const STUDIO_TOOLS: readonly StudioToolDefinition[] = [
  { id: 'select', label: 'Sélection', hint: 'Déplacez un point ou la pièce entière. Maj : angles de 45°. Alt : sans aimantation.', shortcut: 'V' },
  { id: 'pan', label: 'Main', hint: 'Faites glisser pour déplacer la vue. Molette : zoom. Espace maintenu : main temporaire.', shortcut: 'H' },
  { id: 'add', label: 'Ajouter un point', hint: 'Cliquez sur un bord pour y ajouter un point de courbe.', shortcut: 'A' },
  { id: 'remove', label: 'Supprimer un point', hint: 'Cliquez sur un point pour le supprimer (3 points minimum).', shortcut: 'X' },
  { id: 'draw', label: 'Dessiner une pièce', hint: 'Cliquez pour poser les points, Entrée ou clic sur le 1er point pour fermer, Échap pour annuler.', shortcut: 'P' },
  { id: 'measure', label: 'Mètre ruban', hint: 'Cliquez deux points pour mesurer une distance.', shortcut: 'M' },
  { id: 'notch', label: 'Cran de montage', hint: 'Cliquez sur un bord pour poser ou retirer un cran.', shortcut: 'N' },
  { id: 'grain', label: 'Droit-fil', hint: 'Faites glisser pour tracer le sens du droit-fil.', shortcut: 'G' },
];

export const TOOL_BY_SHORTCUT: Record<string, StudioTool> = Object.fromEntries(
  STUDIO_TOOLS.map((t) => [t.shortcut.toLowerCase(), t.id]),
);

/** Grid / snapping steps offered in the toolbar (mm). 0 = free. */
export const SNAP_STEPS_MM = [0, 1, 5, 10] as const;
