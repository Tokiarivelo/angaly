export interface CutOption {
  id: string;
  label: string;
  description: string;
}

export const CUTS: CutOption[] = [
  { id: 'DROITE', label: 'Droite', description: 'Tombé vertical épuré' },
  { id: 'EVASEE', label: 'Évasée / Trapèze', description: 'Volume progressif vers le bas' },
  { id: 'SIRENE', label: 'Sirène', description: 'Ajustée jusqu’aux genoux puis évasée' },
  { id: 'PRINCESSE', label: 'Princesse', description: 'Buste ajusté et jupe ample volumineuse' },
  { id: 'AJUSTEE', label: 'Ajustée / Cintrée', description: 'Épouse précisément les courbes du corps' },
  { id: 'OVERSIZE', label: 'Oversize / Fluide', description: 'Aisance généreuse et tombé décontracté chic' },
];
