import { cmsList, cmsText, dataString, readOneOf, readString } from '@/lib/cms/cms-values';
import { useCmsPage } from '@/lib/cms/use-cms-page';

import { HOW_IT_WORKS_STEPS } from '../consts/how-it-works-steps.const';
import type { HowItWorksStep } from '../consts/how-it-works-steps.const';
import { PRICING_TIERS } from '../consts/pricing-tiers.const';
import type { PricingTier } from '../consts/pricing-tiers.const';

const STEP_CATEGORIES = ['conception', 'generation', 'validation'] as const;
const TRUST_ICONS = ['Sparkles', 'ShieldCheck', 'Download'] as const;

/** `features` is edited as one feature per line. */
function splitLines(value: unknown): string[] {
  return typeof value === 'string' ? value.split('\n').map((line) => line.trim()).filter((line) => line !== '') : [];
}

/** Built-in default copy for the landing; the `pattern-studio` CMS sections override it field by field / list by list. */
const DEFAULT_CONTENT = () => {
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

export const usePatternStudioLandingContent = () => {
  const cms = useCmsPage('pattern-studio');
  const base = DEFAULT_CONTENT();
  const hero = cms.section('hero');
  const howItWorks = cms.section('fonctionnement');
  const trust = cms.section('confiance');
  const sample = cms.section('apercu');
  const pricing = cms.section('offres');
  const closing = cms.section('closing');

  return {
    hero: {
      badge: dataString(hero?.dataJson, 'badge') ?? base.hero.badge,
      title: cmsText(hero?.titleText, base.hero.title),
      subheading: cmsText(hero?.subtitleText, base.hero.subheading),
      description: cmsText(hero?.bodyText, base.hero.description),
      ctaPrimary: cmsText(hero?.ctaPrimaryLabel, base.hero.ctaPrimary),
      ctaSecondary: cmsText(hero?.ctaSecondaryLabel, base.hero.ctaSecondary),
    },
    howItWorks: {
      title: cmsText(howItWorks?.titleText, base.howItWorks.title),
      subheading: cmsText(howItWorks?.subtitleText, base.howItWorks.subheading),
      steps:
        cmsList<HowItWorksStep>(howItWorks?.dataJson, 'steps', (item) => {
          const label = readString(item['label']);
          const description = readString(item['description']);
          return label && description ? { number: 0, label, description, category: readOneOf(item['category'], STEP_CATEGORIES) ?? 'conception' } : undefined;
        })?.map((step, index) => ({ ...step, number: index + 1 })) ?? base.howItWorks.steps,
    },
    trustBlock: {
      manifesto: cmsText(trust?.bodyText, base.trustBlock.manifesto),
      points:
        cmsList(trust?.dataJson, 'points', (item) => {
          const title = readString(item['title']);
          const description = readString(item['description']);
          return title && description ? { title, description, icon: readOneOf(item['icon'], TRUST_ICONS) ?? 'Sparkles' } : undefined;
        }) ?? base.trustBlock.points,
    },
    samplePreview: {
      title: cmsText(sample?.titleText, base.samplePreview.title),
      subtitle: cmsText(sample?.subtitleText, base.samplePreview.subtitle),
    },
    pricing: {
      title: cmsText(pricing?.titleText, base.pricing.title),
      subtitle: cmsText(pricing?.subtitleText, base.pricing.subtitle),
      tiers:
        cmsList<PricingTier>(pricing?.dataJson, 'tiers', (item) => {
          const name = readString(item['name']);
          const price = readString(item['price']);
          const description = readString(item['description']);
          if (!name || !price || !description) return undefined;
          return {
            id: readString(item['id']) ?? name,
            name,
            price,
            description,
            features: splitLines(item['features']),
            isRecommended: item['recommended'] === 'oui',
            ctaText: readString(item['ctaText']) ?? 'Choisir cette offre',
          };
        }) ?? base.pricing.tiers,
    },
    closingCta: {
      title: cmsText(closing?.titleText, base.closingCta.title),
      subtitle: cmsText(closing?.subtitleText, base.closingCta.subtitle),
      buttonText: cmsText(closing?.ctaPrimaryLabel, base.closingCta.buttonText),
    },
  };
};
