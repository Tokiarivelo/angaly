export interface HowItWorksStep {
  number: number;
  label: string;
  description: string;
  category: 'conception' | 'generation' | 'validation';
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    label: 'Nouveau projet',
    description: 'Initialisation de votre atelier numérique personnalisé',
    category: 'conception',
  },
  {
    number: 2,
    label: 'Type de vêtement',
    description: 'Sélection de la pièce (robe, jupe, costume, chemise…)',
    category: 'conception',
  },
  {
    number: 3,
    label: 'Style & silhouette',
    description: 'Définition de l’esprit couture (classique, moderne, glamour…)',
    category: 'conception',
  },
  {
    number: 4,
    label: 'Personnalisation',
    description: 'Choix de la coupe, du col, des manches et des finitions',
    category: 'conception',
  },
  {
    number: 5,
    label: 'Photo d’inspiration',
    description: 'Analyse indicative des lignes par notre assistant numérique',
    category: 'conception',
  },
  {
    number: 6,
    label: 'Mesures exactes',
    description: 'Association de votre profil de mesures morphologiques',
    category: 'conception',
  },
  {
    number: 7,
    label: 'Génération géométrique',
    description: 'Calcul déterministe précis des pièces par le moteur Angaly',
    category: 'generation',
  },
  {
    number: 8,
    label: 'Prévisualisation technique',
    description: 'Inspection des pièces (droit-fil, crans, marges de couture)',
    category: 'generation',
  },
  {
    number: 9,
    label: 'Vérification Angaly',
    description: 'Examen attentif et validation par une couturière experte',
    category: 'validation',
  },
  {
    number: 10,
    label: 'Validation finale',
    description: 'Approbation professionnelle pour coupe en tissu noble',
    category: 'validation',
  },
  {
    number: 11,
    label: 'Export professionnel',
    description: 'Téléchargement aux formats PDF A4/A3/A0, SVG et DXF',
    category: 'validation',
  },
];
