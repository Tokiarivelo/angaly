/**
 * Editorial catalogue of every CMS-managed section of the public site — what each `(page, sectionKey)`
 * exposes to the editor (which text fields, which image, which structured `dataJson` keys).
 *
 * Mirrors what the public hooks actually read (`apps/web/src/features/<page>/hooks/use*Content.ts`) and
 * what `packages/database/prisma/seed.ts` creates. A section absent from the database still appears in the
 * admin list (status "Non créée") so it can be created from here; a section present in the database but
 * absent from this catalogue falls back to the generic editor (all text fields + raw JSON).
 */

export type TextFieldName = 'titleText' | 'subtitleText' | 'bodyText' | 'ctaPrimaryLabel' | 'ctaSecondaryLabel';

export interface TextFieldDefinition {
  label: string;
  /** Shown under the input — where/how the value is used on the public page. */
  hint?: string;
  multiline?: boolean;
}

export type ItemFieldType = 'text' | 'textarea' | 'image' | 'select';

export interface ItemFieldDefinition {
  key: string;
  label: string;
  type: ItemFieldType;
  options?: readonly string[];
  /** Blank input is stored as `null` instead of `''` (the public hooks type-guard `null | string`). */
  nullable?: boolean;
}

export type DataFieldDefinition =
  | { kind: 'text'; key: string; label: string; hint?: string }
  | { kind: 'list'; key: string; label: string; itemLabel: string; itemFields: readonly ItemFieldDefinition[] };

export interface SectionDefinition {
  sectionKey: string;
  label: string;
  text: Partial<Record<TextFieldName, TextFieldDefinition>>;
  /** Label of the section's image slot (`mediaId`); absent = the section has no image. */
  image?: string;
  data?: readonly DataFieldDefinition[];
}

export interface PageDefinition {
  page: string;
  label: string;
  /** Stable public URL, when the page has one (detail pages are per-slug, so none). */
  route?: string;
  sections: readonly SectionDefinition[];
}

const HEADER: SectionDefinition['text'] = {
  titleText: { label: 'Titre de la page' },
  subtitleText: { label: 'Sous-titre' },
};

export const SECTION_CATALOG: readonly PageDefinition[] = [
  {
    page: 'accueil',
    label: 'Accueil', route: '/',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Bandeau principal',
        text: {
          titleText: { label: 'Titre' },
          subtitleText: { label: 'Sous-titre' },
          ctaPrimaryLabel: { label: 'Bouton principal' },
          ctaSecondaryLabel: { label: 'Bouton secondaire' },
        },
        image: 'Image du bandeau',
        data: [{ kind: 'text', key: 'eyebrow', label: 'Sur-titre (eyebrow)' }],
      },
      {
        sectionKey: 'maison',
        label: 'La Maison',
        text: {
          titleText: { label: 'Titre' },
          subtitleText: { label: 'Sur-titre', hint: 'Petite ligne au-dessus du titre.' },
          bodyText: { label: 'Paragraphe', multiline: true },
          ctaPrimaryLabel: { label: 'Bouton' },
        },
        image: 'Image de la section',
      },
      {
        sectionKey: 'univers',
        label: 'Univers (tuiles)',
        text: { titleText: { label: 'Titre de la section' } },
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Tuiles',
            itemLabel: 'Tuile',
            itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'imageUrl', label: 'Image', type: 'image', nullable: true },
              { key: 'imageAlt', label: 'Texte alternatif de l’image', type: 'text', nullable: true },
              { key: 'href', label: 'Lien (ex. /creations)', type: 'text', nullable: true },
            ],
          },
        ],
      },
      {
        sectionKey: 'sur-mesure',
        label: 'Expérience sur mesure',
        text: {
          titleText: { label: 'Titre' },
          subtitleText: { label: 'Sous-titre' },
          ctaPrimaryLabel: { label: 'Bouton' },
        },
        data: [
          {
            kind: 'list',
            key: 'steps',
            label: 'Étapes',
            itemLabel: 'Étape',
            itemFields: [
              { key: 'label', label: 'Nom', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ],
          },
        ],
      },
      {
        sectionKey: 'la-une',
        label: 'La Une (titre)',
        text: { titleText: { label: 'Titre' }, ctaPrimaryLabel: { label: 'Bouton' } },
      },
      { sectionKey: 'ateliers', label: 'Ateliers (titre)', text: { titleText: { label: 'Titre' } } },
      { sectionKey: 'journal', label: 'Journal (titre)', text: { titleText: { label: 'Titre' } } },
      { sectionKey: 'newsletter', label: 'Newsletter (titre)', text: { titleText: { label: 'Titre' } } },
      {
        sectionKey: 'pattern-studio',
        label: 'Pattern Studio',
        text: {
          titleText: { label: 'Titre' },
          subtitleText: { label: 'Sur-titre' },
          bodyText: { label: 'Paragraphe', multiline: true },
          ctaPrimaryLabel: { label: 'Bouton' },
        },
        image: 'Image de la section',
      },
    ],
  },
  {
    page: 'a-propos',
    label: 'À propos', route: '/a-propos',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Bandeau principal',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        image: 'Image du bandeau',
      },
      {
        sectionKey: 'histoire',
        label: 'Notre histoire',
        text: {
          titleText: { label: 'Titre' },
          bodyText: { label: 'Paragraphes', multiline: true, hint: 'Séparez les paragraphes par une ligne vide.' },
        },
        image: 'Image de la section',
        data: [
          {
            kind: 'list',
            key: 'chronology',
            label: 'Chronologie',
            itemLabel: 'Étape',
            itemFields: [
              { key: 'year', label: 'Année', type: 'text' },
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
          },
        ],
      },
      {
        sectionKey: 'fondatrice',
        label: 'La fondatrice',
        text: {
          titleText: { label: 'Nom' },
          subtitleText: { label: 'Fonction' },
          bodyText: { label: 'Présentation', multiline: true },
        },
        image: 'Portrait',
        data: [{ kind: 'text', key: 'quote', label: 'Citation' }],
      },
      {
        sectionKey: 'savoir-faire',
        label: 'Savoir-faire',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Savoir-faire',
            itemLabel: 'Élément',
            itemFields: [
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'imageUrl', label: 'Image', type: 'image', nullable: true },
              { key: 'icon', label: 'Icône (si pas d’image)', type: 'select', options: ['draw', 'cut'], nullable: true },
            ],
          },
        ],
      },
      { sectionKey: 'philosophie', label: 'Philosophie', text: { bodyText: { label: 'Citation', multiline: true } } },
      {
        sectionKey: 'atelier',
        label: 'L’atelier',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Galerie',
            itemLabel: 'Vignette',
            itemFields: [
              { key: 'imageUrl', label: 'Image', type: 'image', nullable: true },
              { key: 'icon', label: 'Icône (si pas d’image)', type: 'text', nullable: true },
              { key: 'label', label: 'Légende', type: 'text', nullable: true },
              { key: 'size', label: 'Taille', type: 'select', options: ['large', 'default'] },
            ],
          },
        ],
      },
      {
        sectionKey: 'vision',
        label: 'Vision',
        text: {
          titleText: { label: 'Titre' },
          bodyText: { label: 'Paragraphe', multiline: true },
          ctaPrimaryLabel: { label: 'Bouton principal' },
          ctaSecondaryLabel: { label: 'Bouton secondaire' },
        },
      },
    ],
  },
  {
    page: 'la-une',
    label: 'La Une', route: '/la-une',
    sections: [{ sectionKey: 'header', label: 'En-tête', text: HEADER, data: [{ kind: 'text', key: 'eyebrow', label: 'Sur-titre (eyebrow)' }] }],
  },
  { page: 'nos-creations-galerie', label: 'Nos créations', route: '/creations', sections: [{ sectionKey: 'header', label: 'En-tête', text: HEADER }] },
  {
    page: 'creation-detail',
    label: 'Fiche création',
    sections: [
      {
        sectionKey: 'savoir-faire',
        label: 'Bloc savoir-faire',
        text: { titleText: { label: 'Titre' }, bodyText: { label: 'Texte', multiline: true } },
      },
    ],
  },
  { page: 'collections-liste', label: 'Collections', route: '/collections', sections: [{ sectionKey: 'header', label: 'En-tête', text: HEADER }] },
  {
    page: 'collection-detail',
    label: 'Fiche collection',
    sections: [
      {
        sectionKey: 'closing-cta',
        label: 'Appel à l’action final',
        text: {
          titleText: { label: 'Titre' },
          ctaPrimaryLabel: { label: 'Bouton principal' },
          ctaSecondaryLabel: { label: 'Bouton secondaire' },
        },
      },
    ],
  },
  { page: 'nos-ateliers-liste', label: 'Nos ateliers', route: '/ateliers', sections: [{ sectionKey: 'header', label: 'En-tête', text: HEADER }] },
  {
    page: 'atelier-detail',
    label: 'Fiche atelier',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Bandeau',
        text: { subtitleText: { label: 'Sous-titre' } },
        data: [{ kind: 'text', key: 'precisionTileLabel', label: 'Libellé de la tuile « précision »' }],
      },
    ],
  },
  { page: 'journal-liste', label: 'Journal', route: '/journal', sections: [{ sectionKey: 'header', label: 'En-tête', text: HEADER }] },
  {
    page: 'journal-article',
    label: 'Article du journal',
    sections: [
      {
        sectionKey: 'closing-cta',
        label: 'Appel à l’action final',
        text: {
          titleText: { label: 'Titre' },
          bodyText: { label: 'Texte', multiline: true },
          ctaPrimaryLabel: { label: 'Bouton' },
        },
      },
    ],
  },
  {
    page: 'contact',
    label: 'Contact',
    route: '/contact',
    sections: [
      { sectionKey: 'header', label: 'En-tête', text: HEADER },
      {
        sectionKey: 'coordonnees',
        label: 'Coordonnées',
        text: { titleText: { label: 'Titre du bloc' } },
        data: [
          { kind: 'text', key: 'phoneLabel', label: 'Téléphone (affiché)' },
          { kind: 'text', key: 'phoneHref', label: 'Téléphone (lien, ex. tel:+261…)' },
          { kind: 'text', key: 'whatsappHref', label: 'WhatsApp (lien, ex. https://wa.me/261…)' },
          { kind: 'text', key: 'emailLabel', label: 'Email (affiché)' },
          { kind: 'text', key: 'emailHref', label: 'Email (lien, ex. mailto:…)' },
        ],
      },
      {
        sectionKey: 'reseaux',
        label: 'Réseaux sociaux',
        text: { titleText: { label: 'Titre du bloc' } },
        data: [
          {
            kind: 'list',
            key: 'links',
            label: 'Réseaux',
            itemLabel: 'Réseau',
            itemFields: [
              { key: 'label', label: 'Nom (Facebook, Instagram…)', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
            ],
          },
        ],
      },
      {
        sectionKey: 'horaires',
        label: 'Horaires',
        text: { titleText: { label: 'Titre du bloc' } },
        data: [
          {
            kind: 'list',
            key: 'rows',
            label: 'Lignes d’horaires',
            itemLabel: 'Ligne',
            itemFields: [
              { key: 'label', label: 'Jours', type: 'text' },
              { key: 'value', label: 'Horaires', type: 'text' },
              { key: 'closed', label: 'Fermé ?', type: 'select', options: ['non', 'oui'] },
            ],
          },
        ],
      },
    ],
  },
  { page: 'page-404', label: 'Page 404', sections: [{ sectionKey: 'main', label: 'Message', text: HEADER }] },
  {
    page: 'navigation-mobile',
    label: 'Navigation mobile',
    sections: [{ sectionKey: 'cta', label: 'Bouton de la barre', text: { ctaPrimaryLabel: { label: 'Libellé du bouton' } } }],
  },
  {
    page: 'footer',
    label: 'Pied de page',
    sections: [
      {
        sectionKey: 'brand',
        label: 'Marque',
        text: { titleText: { label: 'Nom' }, bodyText: { label: 'Description', multiline: true } },
      },
      {
        sectionKey: 'informations',
        label: 'Colonne « Informations »',
        text: { titleText: { label: 'Titre de la colonne' } },
        data: [{ kind: 'list', key: 'links', label: 'Liens', itemLabel: 'Lien', itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
            ] }],
      },
      {
        sectionKey: 'maison',
        label: 'Colonne « La Maison »',
        text: { titleText: { label: 'Titre de la colonne' } },
        data: [{ kind: 'list', key: 'links', label: 'Liens', itemLabel: 'Lien', itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
            ] }],
      },
      {
        sectionKey: 'legal',
        label: 'Mention de copyright',
        text: { titleText: { label: 'Texte', hint: 'Utilisez {year} pour l’année en cours.' } },
      },
    ],
  },
  {
    page: 'navigation',
    label: 'Menus de navigation',
    sections: [
      {
        sectionKey: 'header',
        label: 'Menu du haut (ordinateur)',
        text: {},
        data: [{ kind: 'list', key: 'links', label: 'Liens', itemLabel: 'Lien', itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
            ] }],
      },
      {
        sectionKey: 'drawer',
        label: 'Menu mobile',
        text: {},
        data: [
          {
            kind: 'list',
            key: 'links',
            label: 'Liens',
            itemLabel: 'Lien',
            itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
              { key: 'badge', label: 'Pastille (optionnel)', type: 'text', nullable: true },
            ],
          },
        ],
      },
      {
        sectionKey: 'drawer-secondary',
        label: 'Menu mobile — liens secondaires',
        text: {},
        data: [{ kind: 'list', key: 'links', label: 'Liens', itemLabel: 'Lien', itemFields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Lien', type: 'text' },
            ] }],
      },
    ],
  },
  {
    page: 'sur-mesure',
    label: 'Sur mesure',
    route: '/sur-mesure',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Bandeau principal',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        image: 'Image du bandeau',
      },
      {
        sectionKey: 'etapes',
        label: 'Parcours (étapes)',
        text: { titleText: { label: 'Titre' } },
        data: [
          {
            kind: 'list',
            key: 'steps',
            label: 'Étapes',
            itemLabel: 'Étape',
            itemFields: [{ key: 'title', label: 'Nom de l’étape', type: 'text' }],
          },
        ],
      },
      {
        sectionKey: 'pourquoi',
        label: 'Pourquoi nous choisir',
        text: {},
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Atouts',
            itemLabel: 'Atout',
            itemFields: [
              { key: 'icon', label: 'Icône', type: 'select', options: ['scissors', 'gem', 'heart'] },
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
          },
        ],
      },
      {
        sectionKey: 'realisations',
        label: 'Réalisations',
        text: { titleText: { label: 'Titre' } },
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Pièces',
            itemLabel: 'Pièce',
            itemFields: [
              { key: 'title', label: 'Nom de la pièce', type: 'text' },
              { key: 'label', label: 'Mention', type: 'text', nullable: true },
              { key: 'imageUrl', label: 'Image', type: 'image' },
            ],
          },
        ],
      },
      {
        sectionKey: 'temoignage',
        label: 'Témoignage',
        text: { bodyText: { label: 'Citation', multiline: true } },
        image: 'Portrait',
        data: [
          { kind: 'text', key: 'name', label: 'Nom' },
          { kind: 'text', key: 'role', label: 'Fonction / lieu' },
        ],
      },
      {
        sectionKey: 'faq',
        label: 'Questions fréquentes',
        text: { titleText: { label: 'Titre' } },
        data: [
          {
            kind: 'list',
            key: 'items',
            label: 'Questions',
            itemLabel: 'Question',
            itemFields: [
              { key: 'question', label: 'Question', type: 'text' },
              { key: 'answer', label: 'Réponse', type: 'textarea' },
            ],
          },
        ],
      },
      { sectionKey: 'closing', label: 'Appel à l’action final', text: { titleText: { label: 'Titre' } } },
    ],
  },
  {
    page: 'pattern-studio',
    label: 'Pattern Studio (présentation)',
    route: '/pattern-studio',
    sections: [
      {
        sectionKey: 'hero',
        label: 'Bandeau principal',
        text: {
          titleText: { label: 'Titre' },
          subtitleText: { label: 'Sous-titre' },
          bodyText: { label: 'Description', multiline: true },
          ctaPrimaryLabel: { label: 'Bouton principal' },
          ctaSecondaryLabel: { label: 'Bouton secondaire' },
        },
        data: [{ kind: 'text', key: 'badge', label: 'Pastille (ex. PREMIUM)' }],
      },
      {
        sectionKey: 'fonctionnement',
        label: 'Comment ça fonctionne',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        data: [
          {
            kind: 'list',
            key: 'steps',
            label: 'Étapes',
            itemLabel: 'Étape',
            itemFields: [
              { key: 'label', label: 'Nom', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'category', label: 'Phase', type: 'select', options: ['conception', 'generation', 'validation'] },
            ],
          },
        ],
      },
      {
        sectionKey: 'confiance',
        label: 'Confiance (manifeste)',
        text: { bodyText: { label: 'Manifeste', multiline: true } },
        data: [
          {
            kind: 'list',
            key: 'points',
            label: 'Points clés',
            itemLabel: 'Point',
            itemFields: [
              { key: 'icon', label: 'Icône', type: 'select', options: ['Sparkles', 'ShieldCheck', 'Download'] },
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
          },
        ],
      },
      {
        sectionKey: 'apercu',
        label: 'Aperçu technique',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
      },
      {
        sectionKey: 'offres',
        label: 'Offres',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' } },
        data: [
          {
            kind: 'list',
            key: 'tiers',
            label: 'Offres',
            itemLabel: 'Offre',
            itemFields: [
              { key: 'name', label: 'Nom', type: 'text' },
              { key: 'price', label: 'Prix', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'features', label: 'Avantages (un par ligne)', type: 'textarea' },
              { key: 'recommended', label: 'Mise en avant ?', type: 'select', options: ['non', 'oui'] },
              { key: 'ctaText', label: 'Texte du bouton', type: 'text' },
            ],
          },
        ],
      },
      {
        sectionKey: 'closing',
        label: 'Appel à l’action final',
        text: { titleText: { label: 'Titre' }, subtitleText: { label: 'Sous-titre' }, ctaPrimaryLabel: { label: 'Bouton' } },
      },
    ],
  },
];

export function findPageDefinition(page: string): PageDefinition | undefined {
  return SECTION_CATALOG.find((definition) => definition.page === page);
}

export function findSectionDefinition(page: string, sectionKey: string): SectionDefinition | undefined {
  return findPageDefinition(page)?.sections.find((section) => section.sectionKey === sectionKey);
}

/** Generic fallback for a `(page, sectionKey)` row that exists in the database but not in the catalogue. */
export const GENERIC_TEXT_FIELDS: SectionDefinition['text'] = {
  titleText: { label: 'Titre' },
  subtitleText: { label: 'Sous-titre' },
  bodyText: { label: 'Texte', multiline: true },
  ctaPrimaryLabel: { label: 'Bouton principal' },
  ctaSecondaryLabel: { label: 'Bouton secondaire' },
};
