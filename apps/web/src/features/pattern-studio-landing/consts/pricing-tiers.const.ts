export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isRecommended?: boolean;
  ctaText: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'digital-pattern',
    name: 'Patron numérique',
    price: '45 000 Ar',
    description: 'Pour les passionné·e·s et couturiers autonomes souhaitant un patron millimétré prêt à l’impression.',
    features: [
      'Génération paramétrique déterministe',
      'Prévisualisation SVG interactive',
      'Export PDF (planches A4, A3, traceur A0)',
      'Guide de placement & marges de couture incluses',
    ],
    isRecommended: false,
    ctaText: 'Choisir cette offre',
  },
  {
    id: 'verified-pattern',
    name: 'Patron + Vérification Angaly',
    price: '95 000 Ar',
    description: 'La garantie haute couture : votre patron inspecté et ajusté par une couturière d’atelier expérimentée.',
    features: [
      'Toutes les fonctionnalités du Patron numérique',
      'Contrôle expert par une couturière Angaly',
      'Ajustements de proportion morphologique sur-mesure',
      'Conseils personnalisés sur le choix des étoffes',
      'Support direct en atelier en cas de question',
    ],
    isRecommended: true,
    ctaText: 'Choisir cette offre',
  },
  {
    id: 'bespoke-tailoring',
    name: 'Patron + Confection Atelier',
    price: 'Sur devis atelier',
    description: 'De l’esquisse numérique à l’œuvre portée : confection intégrale par nos artisanes à Madagascar.',
    features: [
      'Patron numérique & vérification complète',
      'Approvisionnement en matières d’exception (soie, dentelle, lin)',
      'Confection artisanale dans nos ateliers d’Antananarivo',
      'Séance d’essayage en atelier ou envoi sécurisé',
    ],
    isRecommended: false,
    ctaText: 'Choisir cette offre',
  },
];
