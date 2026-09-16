import { useMemo } from 'react';

import type { PublicPageSectionDto } from '../api/a-propos.api';
import { useAProposSectionsContentQuery } from '../api/a-propos.api';

export interface ChronologyItem {
  year: string;
  title: string;
  description: string;
}

export interface SavoirFaireItem {
  title: string;
  description: string;
  imageUrl: string | null;
  icon: 'draw' | 'cut' | null;
}

export interface AtelierGalleryItem {
  imageUrl: string | null;
  icon: string | null;
  label: string | null;
  size: 'large' | 'default';
}

export interface AProposContent {
  hero: { title: string; subtitle: string; imageUrl: string | null };
  histoire: { title: string; paragraphs: string[]; imageUrl: string | null; chronology: ChronologyItem[] };
  fondatrice: { title: string; subtitle: string; paragraph: string; quote: string; imageUrl: string | null };
  savoirFaire: { title: string; subtitle: string; items: SavoirFaireItem[] };
  philosophie: { quote: string };
  atelier: { title: string; subtitle: string; items: AtelierGalleryItem[] };
  vision: { title: string; paragraph: string };
}

/**
 * Default editorial copy for the ANGALY "À propos" page — the fallback for
 * any section not yet present in the CMS (`GET /content/public/a-propos`,
 * PUBLISHED-only, see docs/features/content.md), merged in by
 * `useAProposContent` below. Copy mirrors the real Stitch "Notre Histoire (À
 * propos)" screen (`028e4d74f15f4ad2b2a16424bacb5448`), not
 * stitch-prompts/21-a-propos.md alone — that text prompt implies an 8th
 * "Valeurs" section (Excellence/Authenticité/Exclusivité/Proximité client)
 * the real screen simply doesn't have; omitted rather than invented. Image
 * URLs stay hardcoded here — unlike `home`, this page has no
 * media-by-alt-text query wired up yet, out of scope for this pass (see
 * docs/pages/a-propos.md).
 */
const DEFAULT_A_PROPOS_CONTENT: AProposContent = {
  hero: {
    title: 'Notre histoire',
    subtitle: 'Une maison de couture née à Madagascar, pensée pour durer.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAot6Ae0jR3beKh6XaoU4Z5CCsF7dTJhjc9vU3CWjSmBhpMzxvMXuuPfInfT4sUAo5-zYPok6ZdthlmuzuHx1VGRLFRxWGBWFEKeH0FLGrcgdOe5q32QuaOXvtL3AHlfRk4twGO4aejz9XHMlPttIlSguOwx6VGvTm9Ll8n9Gp8Zd92FLsYssTRP786R5vqdMupzxfECxQ1BGaX0S33hyij-lCr4wGt_lLDWTXObrnaJW9zoX6vWm-xQmR-jNcFQmeTZNRNdfOswOs',
  },
  histoire: {
    title: 'Comment tout a commencé',
    paragraphs: [
      "Fondée au cœur d'Antananarivo, la maison ANGALY est née d'une passion pour l'élégance intemporelle et le savoir-faire méticuleux. Dès nos premiers pas, nous avons cherché à marier l'héritage riche de Madagascar avec les exigences de la haute couture internationale.",
      "Chaque création raconte une histoire, celle de mains expertes, de matières nobles sélectionnées avec rigueur, et d'une vision où le vêtement devient une œuvre d'art portée.",
    ],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDE2e9E-bdCP0RbNDfvhhRxSPU9UQ6m9WN1HsYCbZSYub6ucWhuLWD2zoD5N6M9PIuy9_Raneh6af53_bTM4_a-9f7wqRg1IohzneW_YAayZ5pLWFHnWxldZXMSk0d2BapF-0-PT5cXGePJzENJknt8YaGdJjFrKQ4V_kdHEO4cg4SL22b_NSYmH950bm_xCjrdflV3CzXVx_O5L0yp6nb_YFDllisQSdoX0ynfwFzXRJFUdDATwtb39wUy-4kfPztD1h_iJmEjB1c',
    chronology: [
      { year: '1998', title: 'La première esquisse', description: "L'ouverture de notre premier atelier confidentiel." },
      { year: '2010', title: "L'expansion", description: 'Reconnaissance nationale et premières collections sur-mesure.' },
    ],
  },
  fondatrice: {
    title: 'Qui est Angaly ?',
    subtitle: "L'âme de la maison",
    paragraph:
      "Visionnaire et artisane dans l'âme, Angaly a toujours cru que la véritable beauté réside dans les détails imperceptibles. Formée aux techniques traditionnelles et influencée par l'architecture moderne, elle insuffle à chaque collection une dualité unique : force et délicatesse, rigueur et fluidité.",
    quote: "Un vêtement n'est pas qu'une parure, c'est une architecture intime qui révèle la personne qui le porte.",
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_t5pljMy3LwQA1SNjDkwgqtH-e_Skx84P4VoMDSReKm2Q0gmpsLzRCsnlpvu3XdWw8Ctmj6sV9s4jsPZPbU9cNUuy_6bYHRAnCMS05nzz3R8h9_Ot2gfG6Bnhk3xxDlrjV8aMJBvMl_zILsPbToQahuSrEU1f03xREtX395GBWXUvEmVTcoJfLiPKyyl9G5OY9fHRHS2FPoiY3NE7aNjP1yoDK2gPqgRttpkw9S1uuaIO5pRhlwfqag8TSszSWFGc-F4ZDRftY08',
  },
  savoirFaire: {
    title: 'Notre Savoir-Faire',
    subtitle: 'L’excellence de la haute couture malgache, cultivée dans nos ateliers.',
    items: [
      {
        title: 'Couture main',
        description: 'Chaque point est une promesse de durabilité.',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBjm-f1cfDol4QbcrMhpOB6hy_14AI-xx6mWsRmYHsR9Ask6MdX4JngzGE3urBzJ5rVAv7unZ8TJ4Me9ljuPd-Pg4Zyq6C5av-MJ7bfve8gE5KPl7AeHTYzq3E2zIoz9f94Khn4_ulbODiknQ66r46N8yyMxOxXoEkteF_uoTsnSK6hmmFuhhCIPlwtROPwDQvhXK4Q8oZfanLfllVppL3z768awAGVLSE9R5hHYvBttbHq558JoLeOsdIAdsYqNvxwhR8DVEmQwWc',
        icon: null,
      },
      {
        title: 'Patronage sur mesure',
        description: "L'architecture parfaite pour épouser la silhouette.",
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBL_TANP845e5gFup5POkuvcgUUh6LiKPujdrhEa41kkZwKY-QS1Zkf5T9UwBKxkPcsfV37QYg6jwFm90s4RxXtdxj0wY1_RGES0jMkfhJzptV7eaONCI-FWEu_2KD_kU7PJBlGi458mlKYPIXM2CsSh81cqDMtzzqKPY9gFj8ZF7xFegQm67YOInK6918d-BDg4hhmL7Bht2igNrkAS4Kp709Tgio7EcwHXtSjiLObpfA-uVzAw-7sA7ZQ22wN_iXl09ur6tRiGLY',
        icon: null,
      },
      {
        title: 'Broderie',
        description: 'Des motifs exclusifs, dessinés et brodés à la main.',
        imageUrl: null,
        icon: 'draw',
      },
      {
        title: 'Finitions artisanales',
        description: 'L’invisible perfection qui signe une grande pièce.',
        imageUrl: null,
        icon: 'cut',
      },
    ],
  },
  philosophie: {
    quote:
      "Nous ne créons pas de la mode pour l'instant présent, nous forgeons des héritages de soie et de lin pour les générations futures.",
  },
  atelier: {
    title: "L'Atelier",
    subtitle: 'Dans les coulisses de la création',
    items: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1641293498376-139cfe50ff67?w=1600&q=80',
        icon: null,
        label: null,
        size: 'large',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1771098206650-81d713e2e2b9?w=1000&q=80',
        icon: null,
        label: null,
        size: 'default',
      },
      {
        imageUrl: null,
        icon: 'styler',
        label: 'Matières Nobles',
        size: 'default',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1676893140066-df87af3bc566?w=1000&q=80',
        icon: null,
        label: null,
        size: 'default',
      },
    ],
  },
  vision: {
    title: "Incarnez l'élégance",
    paragraph: 'Découvrez des pièces uniques où chaque détail a été pensé pour sublimer votre allure.',
  },
};

function sectionsByKey(sections: PublicPageSectionDto[] | undefined): Map<string, PublicPageSectionDto> {
  const map = new Map<string, PublicPageSectionDto>();
  for (const section of sections ?? []) {
    map.set(section.sectionKey, section);
  }
  return map;
}

function extractStringField(dataJson: unknown, key: string): string | undefined {
  if (dataJson && typeof dataJson === 'object' && key in dataJson) {
    const value = (dataJson as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function isChronologyItem(value: unknown): value is ChronologyItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item['year'] === 'string' && typeof item['title'] === 'string' && typeof item['description'] === 'string';
}

function isSavoirFaireItem(value: unknown): value is SavoirFaireItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item['title'] === 'string' &&
    typeof item['description'] === 'string' &&
    (item['imageUrl'] === null || typeof item['imageUrl'] === 'string') &&
    (item['icon'] === null || item['icon'] === 'draw' || item['icon'] === 'cut')
  );
}

function isAtelierGalleryItem(value: unknown): value is AtelierGalleryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    (item['imageUrl'] === null || typeof item['imageUrl'] === 'string') &&
    (item['icon'] === null || typeof item['icon'] === 'string') &&
    (item['label'] === null || typeof item['label'] === 'string') &&
    (item['size'] === 'large' || item['size'] === 'default')
  );
}

function extractArrayField<T>(dataJson: unknown, key: string, isItem: (value: unknown) => value is T): T[] | undefined {
  if (!dataJson || typeof dataJson !== 'object' || !(key in dataJson)) return undefined;
  const raw = (dataJson as Record<string, unknown>)[key];
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isItem)) return undefined;
  return raw;
}

/** `bodyText` stores `histoire`'s paragraphs joined by a blank line — see seed.ts `page: 'a-propos', sectionKey: 'histoire'`. */
function splitParagraphs(bodyText: string | null | undefined): string[] | undefined {
  if (!bodyText) return undefined;
  const paragraphs = bodyText.split(/\n\n+/).filter((paragraph) => paragraph.trim().length > 0);
  return paragraphs.length > 0 ? paragraphs : undefined;
}

/**
 * Merges PUBLISHED `PageSection` rows (`page="a-propos"`) onto
 * `DEFAULT_A_PROPOS_CONTENT`, by `sectionKey` — see docs/pages/a-propos.md.
 * A section absent from the CMS response (never edited yet, or its only row
 * still `DRAFT` — the public endpoint never returns those) falls back
 * entirely to the hardcoded default. Within a present section, an
 * individual null/missing/malformed field also falls back to its own
 * default field. Image URLs are never touched — see
 * `DEFAULT_A_PROPOS_CONTENT`'s doc comment.
 */
function applyCmsSections(base: AProposContent, sections: PublicPageSectionDto[] | undefined): AProposContent {
  const byKey = sectionsByKey(sections);
  const hero = byKey.get('hero');
  const histoire = byKey.get('histoire');
  const fondatrice = byKey.get('fondatrice');
  const savoirFaire = byKey.get('savoir-faire');
  const philosophie = byKey.get('philosophie');
  const atelier = byKey.get('atelier');
  const vision = byKey.get('vision');

  return {
    ...base,
    hero: {
      ...base.hero,
      title: hero?.titleText ?? base.hero.title,
      subtitle: hero?.subtitleText ?? base.hero.subtitle,
    },
    histoire: {
      ...base.histoire,
      title: histoire?.titleText ?? base.histoire.title,
      paragraphs: splitParagraphs(histoire?.bodyText) ?? base.histoire.paragraphs,
      chronology: extractArrayField(histoire?.dataJson, 'chronology', isChronologyItem) ?? base.histoire.chronology,
    },
    fondatrice: {
      ...base.fondatrice,
      title: fondatrice?.titleText ?? base.fondatrice.title,
      subtitle: fondatrice?.subtitleText ?? base.fondatrice.subtitle,
      paragraph: fondatrice?.bodyText ?? base.fondatrice.paragraph,
      quote: extractStringField(fondatrice?.dataJson, 'quote') ?? base.fondatrice.quote,
    },
    savoirFaire: {
      ...base.savoirFaire,
      title: savoirFaire?.titleText ?? base.savoirFaire.title,
      subtitle: savoirFaire?.subtitleText ?? base.savoirFaire.subtitle,
      items: extractArrayField(savoirFaire?.dataJson, 'items', isSavoirFaireItem) ?? base.savoirFaire.items,
    },
    philosophie: {
      ...base.philosophie,
      quote: philosophie?.bodyText ?? base.philosophie.quote,
    },
    atelier: {
      ...base.atelier,
      title: atelier?.titleText ?? base.atelier.title,
      subtitle: atelier?.subtitleText ?? base.atelier.subtitle,
      items: extractArrayField(atelier?.dataJson, 'items', isAtelierGalleryItem) ?? base.atelier.items,
    },
    vision: {
      ...base.vision,
      title: vision?.titleText ?? base.vision.title,
      paragraph: vision?.bodyText ?? base.vision.paragraph,
    },
  };
}

export function useAProposContent(): { data: AProposContent; isLoading: boolean; error: Error | null } {
  const { data: sections, isLoading, error } = useAProposSectionsContentQuery();

  const data = useMemo(() => applyCmsSections(DEFAULT_A_PROPOS_CONTENT, sections), [sections]);

  return { data, isLoading, error };
}
