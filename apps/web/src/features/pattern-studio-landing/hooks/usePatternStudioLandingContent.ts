import { HOW_IT_WORKS_STEPS } from '../consts/how-it-works-steps.const';
import { PRICING_TIERS } from '../consts/pricing-tiers.const';

export const usePatternStudioLandingContent = () => {
  return {
    hero: {
      badge: 'PREMIUM',
      title: 'Angaly Pattern Studio',
      subheading: 'Votre patron, créé selon vos mesures.',
      description:
        'Un moteur de patronage paramétrique assisté par intelligence artificielle, pensé comme un véritable atelier numérique — pas une simple IA qui dessine à votre place.',
      ctaPrimary: 'Nouveau projet',
      ctaSecondary: 'Découvrir le fonctionnement',
    },
    howItWorks: {
      title: 'Comment ça fonctionne',
      subheading: 'Du premier croquis numérique à l’export d’atelier millimétré',
      steps: HOW_IT_WORKS_STEPS,
    },
    trustBlock: {
      manifesto:
        '« L’intelligence artificielle comme assistante du patronage professionnel — jamais comme un remplacement de la couturière. »',
      points: [
        {
          title: 'Précision paramétrique',
          description: 'Moteur géométrique déterministe garantissant des lignes d’assemblage parfaites et sans distorsion.',
          icon: 'Sparkles',
        },
        {
          title: 'Vérification humaine',
          description: 'Contrôle attentif de la silhouette et des aisances par une couturière d’expérience Angaly avant validation.',
          icon: 'ShieldCheck',
        },
        {
          title: 'Export professionnel',
          description: 'Fichiers multi-formats prêts pour l’atelier : PDF (A4/A3/A0 avec marges), SVG vectoriel et DXF standard.',
          icon: 'Download',
        },
      ],
    },
    samplePreview: {
      title: 'Précision artisanale & numérique',
      subtitle: 'Chaque pièce technique intègre droit-fil, marges de couture et crans de montage.',
    },
    pricing: {
      title: 'Nos offres d’atelier',
      subtitle: 'Choisissez le niveau d’accompagnement adapté à votre projet couture.',
      tiers: PRICING_TIERS,
    },
    closingCta: {
      title: 'Prêt·e à créer votre patron ?',
      subtitle: 'Donnez vie à votre vêtement couture sur-mesure dès aujourd’hui.',
      buttonText: 'Nouveau projet',
    },
  };
};
