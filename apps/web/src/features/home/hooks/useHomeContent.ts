import { useMemo } from 'react';

import { ROUTES } from '@/lib/routes';

import type { PublicPageSectionDto } from '../api/home.api';
import { useHomeSectionsContentQuery, useHomeSectionsMediaQuery } from '../api/home.api';

export interface HomeContent {
  hero: { eyebrow: string; headline: string; subheading: string; imageUrl?: string | undefined; imageAlt?: string | undefined };
  laUne: { headline: string; cta: string };
  maison: { eyebrow: string; headline: string; paragraph: string; imageUrl?: string | undefined; imageAlt?: string | undefined };
  categories: {
    headline: string;
    items: { label: string; href: string; imageUrl?: string | undefined; imageAlt?: string | undefined }[];
  };
  surMesure: { headline: string; subheading: string; steps: { label: string; description: string }[]; cta: string };
  patternStudio: {
    eyebrow: string;
    headline: string;
    paragraph: string;
    cta: string;
    imageUrl?: string | undefined;
    imageAlt?: string | undefined;
  };
  ateliersTeaser: { headline: string };
  journalTeaser: { headline: string };
  newsletter: { headline: string };
}

/**
 * Default editorial copy and high-resolution verified imagery for the ANGALY homepage.
 * Media URLs are automatically updated with live MinIO media when the media API resolves.
 */
const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    eyebrow: 'MAISON DE COUTURE — MADAGASCAR',
    headline: 'ANGALY',
    subheading: "L'élégance, créée pour vous.",
    imageUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1600&q=80&fm=jpg',
    imageAlt: 'Robe de mariée haute couture Angaly',
  },
  laUne: {
    headline: 'La Une',
    cta: 'Voir toutes les collections',
  },
  maison: {
    eyebrow: 'NOTRE SAVOIR-FAIRE',
    headline: 'Une maison de couture pensée pour vous.',
    paragraph:
      "Fondée au cœur de Madagascar, la Maison Angaly perpétue l'artisanat d'exception. Chaque création est le fruit d'une rencontre entre une vision, des matières nobles et le talent de nos artisans. Du croquis initial à la dernière retouche, nous donnons vie à vos rêves d'élégance avec une précision millimétrée et un dévouement absolu.",
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&fm=jpg',
    imageAlt: 'Artisans et couturières dans notre atelier',
  },
  categories: {
    headline: 'Univers',
    items: [
      {
        label: 'Mariage',
        href: ROUTES.creations,
        imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fm=jpg',
        imageAlt: 'Univers Robes de mariée',
      },
      {
        label: 'Costumes',
        href: ROUTES.creations,
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&fm=jpg',
        imageAlt: 'Univers Costumes homme sur mesure',
      },
      {
        label: 'Soirée',
        href: ROUTES.creations,
        imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80&fm=jpg',
        imageAlt: 'Univers Robes de soirée',
      },
      {
        label: 'Sur Mesure',
        href: ROUTES.surMesure,
        imageUrl: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&fm=jpg',
        imageAlt: 'Univers Confection sur mesure',
      },
    ],
  },
  surMesure: {
    headline: "L'Expérience Sur Mesure",
    subheading: '7 étapes vers la perfection',
    steps: [
      { label: 'Rencontre', description: 'Consultation initiale' },
      { label: 'Esquisse', description: 'Croquis & Design' },
      { label: 'Matières', description: 'Choix des tissus' },
      { label: 'Prises', description: 'Mesures précises' },
      { label: 'Toile', description: 'Premier essayage' },
      { label: 'Ajustements', description: 'Retouches finales' },
      { label: 'Livraison', description: 'Votre création' },
    ],
    cta: 'Créer ma tenue sur mesure',
  },
  patternStudio: {
    eyebrow: 'SERVICE EXCLUSIF',
    headline: 'Angaly Pattern Studio',
    paragraph:
      "Découvrez notre atelier virtuel propulsé par l'IA. Visualisez vos idées, testez des coupes audacieuses et collaborez en temps réel avec nos maîtres tailleurs avant même le premier coup de ciseaux.",
    cta: 'Explorer le Studio',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80&fm=jpg',
    imageAlt: 'Atelier de création virtuelle et patronage Angaly Pattern Studio',
  },
  ateliersTeaser: { headline: 'Nos Ateliers' },
  journalTeaser: { headline: 'Le Journal Angaly' },
  newsletter: { headline: 'Restez informée des nouvelles collections' },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

/** `dataJson.eyebrow` is the only `dataJson` field the home page reads today (see seed.ts `hero`). */
function extractEyebrow(dataJson: unknown): string | undefined {
  if (dataJson && typeof dataJson === 'object' && 'eyebrow' in dataJson) {
    const value = (dataJson as { eyebrow?: unknown }).eyebrow;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/**
 * Merges PUBLISHED `PageSection` rows (`page="accueil"`) onto
 * `DEFAULT_HOME_CONTENT`, by `sectionKey` — see docs/pages/home.md. A
 * section absent from the CMS response (never edited yet, or its only row
 * still `DRAFT` — the public endpoint never returns those) falls back
 * entirely to the hardcoded default. Within a present section, an
 * individual null/missing field also falls back to its own default field,
 * so an admin leaving one field blank doesn't blank the whole section.
 */
function applyCmsSections(base: HomeContent, sections: PublicPageSectionDto[] | undefined): HomeContent {
  const byKey = sectionsByKey(sections);
  const hero = byKey.get('hero');
  const maison = byKey.get('maison');
  const patternStudio = byKey.get('pattern-studio');
  const universMariage = byKey.get('univers-mariage');
  const universCostumes = byKey.get('univers-costumes');
  const universSoiree = byKey.get('univers-soiree');
  const universSurMesure = byKey.get('univers-sur-mesure');

  return {
    ...base,
    hero: {
      ...base.hero,
      eyebrow: extractEyebrow(hero?.dataJson) ?? base.hero.eyebrow,
      headline: hero?.titleText ?? base.hero.headline,
      subheading: hero?.subtitleText ?? base.hero.subheading,
    },
    maison: {
      ...base.maison,
      eyebrow: maison?.subtitleText ?? base.maison.eyebrow,
      headline: maison?.titleText ?? base.maison.headline,
      paragraph: maison?.bodyText ?? base.maison.paragraph,
    },
    categories: {
      ...base.categories,
      items: [
        { ...base.categories.items[0]!, label: universMariage?.titleText ?? base.categories.items[0]!.label },
        { ...base.categories.items[1]!, label: universCostumes?.titleText ?? base.categories.items[1]!.label },
        { ...base.categories.items[2]!, label: universSoiree?.titleText ?? base.categories.items[2]!.label },
        { ...base.categories.items[3]!, label: universSurMesure?.titleText ?? base.categories.items[3]!.label },
      ],
    },
    patternStudio: {
      ...base.patternStudio,
      eyebrow: patternStudio?.subtitleText ?? base.patternStudio.eyebrow,
      headline: patternStudio?.titleText ?? base.patternStudio.headline,
      paragraph: patternStudio?.bodyText ?? base.patternStudio.paragraph,
      cta: patternStudio?.ctaPrimaryLabel ?? base.patternStudio.cta,
    },
  };
}

export function useHomeContent(): { data: HomeContent; isLoading: boolean; error: Error | null } {
  const { data: mediaResponse, isLoading: isMediaLoading, error: mediaError } = useHomeSectionsMediaQuery();
  const { data: sections, isLoading: isContentLoading, error: contentError } = useHomeSectionsContentQuery();

  const cmsContent = useMemo(() => applyCmsSections(DEFAULT_HOME_CONTENT, sections), [sections]);

  const data = useMemo<HomeContent>(() => {
    if (!mediaResponse?.data || mediaResponse.data.length === 0) {
      return cmsContent;
    }

    const mediaList = mediaResponse.data;
    const heroMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return (alt.includes('haute couture') || alt.includes('hero')) && !alt.includes('univers');
    });
    const maisonMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return alt.includes('couturières') || (alt.includes('atelier') && !alt.includes('pattern studio'));
    });
    const mariageMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return alt.includes('univers robes de mariée') || (alt.includes('mariage') && alt.includes('univers'));
    });
    const costumesMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return alt.includes('univers costumes') || (alt.includes('costumes') && alt.includes('univers'));
    });
    const soireeMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return alt.includes('soirée') && alt.includes('univers');
    });
    const surMesureMedia = mediaList.find((m) => {
      const alt = m.altText?.toLowerCase() ?? '';
      return (
        alt.includes('confection sur mesure') ||
        (alt.includes('sur mesure') && alt.includes('univers') && !alt.includes('costumes'))
      );
    });
    const patternStudioMedia = mediaList.find((m) => (m.altText?.toLowerCase() ?? '').includes('pattern studio'));

    return {
      ...cmsContent,
      hero: {
        ...cmsContent.hero,
        imageUrl: heroMedia?.url ?? cmsContent.hero.imageUrl!,
        imageAlt: heroMedia?.altText ?? cmsContent.hero.imageAlt!,
      },
      maison: {
        ...cmsContent.maison,
        imageUrl: maisonMedia?.url ?? cmsContent.maison.imageUrl!,
        imageAlt: maisonMedia?.altText ?? cmsContent.maison.imageAlt!,
      },
      categories: {
        ...cmsContent.categories,
        items: [
          {
            ...cmsContent.categories.items[0]!,
            imageUrl: mariageMedia?.url ?? cmsContent.categories.items[0]!.imageUrl!,
            imageAlt: mariageMedia?.altText ?? cmsContent.categories.items[0]!.imageAlt!,
          },
          {
            ...cmsContent.categories.items[1]!,
            imageUrl: costumesMedia?.url ?? cmsContent.categories.items[1]!.imageUrl!,
            imageAlt: costumesMedia?.altText ?? cmsContent.categories.items[1]!.imageAlt!,
          },
          {
            ...cmsContent.categories.items[2]!,
            imageUrl: soireeMedia?.url ?? cmsContent.categories.items[2]!.imageUrl!,
            imageAlt: soireeMedia?.altText ?? cmsContent.categories.items[2]!.imageAlt!,
          },
          {
            ...cmsContent.categories.items[3]!,
            imageUrl: surMesureMedia?.url ?? cmsContent.categories.items[3]!.imageUrl!,
            imageAlt: surMesureMedia?.altText ?? cmsContent.categories.items[3]!.imageAlt!,
          },
        ],
      },
      patternStudio: {
        ...cmsContent.patternStudio,
        imageUrl: patternStudioMedia?.url ?? cmsContent.patternStudio.imageUrl!,
        imageAlt: patternStudioMedia?.altText ?? cmsContent.patternStudio.imageAlt!,
      },
    };
  }, [mediaResponse, cmsContent]);

  return {
    data,
    isLoading: isMediaLoading || isContentLoading,
    error: mediaError ?? contentError,
  };
}
