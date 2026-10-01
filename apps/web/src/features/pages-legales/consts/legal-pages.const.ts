export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPageContent {
  slug: LegalPageSlug;
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_PAGE_SLUGS = [
  'mentions-legales',
  'confidentialite',
  'livraison-retours',
  'conditions-generales',
  'presse',
  'carrieres',
] as const;

export type LegalPageSlug = (typeof LEGAL_PAGE_SLUGS)[number];

export const LEGAL_CONTACT_EMAIL = 'contact@angaly.mg';
export const LEGAL_LAST_UPDATE = '1er octobre 2026';

/**
 * Static copy of the footer / checkout pages. No Stitch screen exists for these pages (see
 * docs/pages/pages-legales.md). Company registration data (NIF, STAT, hosting provider) is
 * intentionally absent: the owner must supply it before publication.
 */
export const LEGAL_PAGES: Record<LegalPageSlug, LegalPageContent> = {
  'mentions-legales': {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    description: "Informations légales relatives à l'éditeur du site ANGALY.",
    intro: "Le présent site est édité par la maison de couture Angaly Madagascar.",
    sections: [
      {
        heading: 'Éditeur du site',
        paragraphs: [
          'Angaly Madagascar — maison de couture basée à Madagascar.',
          `Contact : ${LEGAL_CONTACT_EMAIL}`,
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          "L'ensemble des contenus du site (textes, photographies, créations, patrons, logotypes) est protégé par le droit d'auteur et reste la propriété d'Angaly Madagascar ou de ses partenaires.",
          'Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.',
        ],
      },
      {
        heading: 'Responsabilité',
        paragraphs: [
          "Angaly s'efforce de fournir des informations exactes et à jour, sans garantir leur exhaustivité. Les couleurs des pièces peuvent varier légèrement selon les écrans.",
        ],
      },
    ],
  },
  confidentialite: {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    description: 'Comment ANGALY collecte, utilise et protège vos données personnelles.',
    intro: 'Vos données personnelles sont traitées avec soin et uniquement pour les besoins de votre relation avec la maison.',
    sections: [
      {
        heading: 'Données collectées',
        paragraphs: [
          'Identité et coordonnées, mensurations, historique de commandes, de devis et de rendez-vous, ainsi que les messages échangés avec la maison.',
        ],
      },
      {
        heading: 'Finalités',
        paragraphs: [
          'Création sur mesure, traitement des commandes, prise de rendez-vous, suivi de vos projets et relation client. Vos données ne sont jamais vendues.',
        ],
      },
      {
        heading: 'Vos droits',
        paragraphs: [
          `Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à ${LEGAL_CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  'livraison-retours': {
    slug: 'livraison-retours',
    title: 'Livraison & Retours',
    description: 'Modalités de livraison, d’échange et de retour des pièces ANGALY.',
    intro: 'Chaque pièce est préparée et emballée à la main avant de quitter l’atelier.',
    sections: [
      {
        heading: 'Livraison',
        paragraphs: [
          'Les pièces de prêt-à-porter sont expédiées après confirmation de la commande. Le délai et les frais de livraison sont indiqués lors du paiement.',
          'Les créations sur mesure sont livrées une fois la confection et les essayages terminés.',
        ],
      },
      {
        heading: 'Retours et échanges',
        paragraphs: [
          'Les pièces de prêt-à-porter non portées peuvent être retournées ou échangées dans leur état d’origine. Contactez-nous pour organiser le retour.',
          'Les créations sur mesure, réalisées à vos mesures, ne sont ni reprises ni échangées ; des retouches sont proposées lors de l’essayage.',
        ],
      },
    ],
  },
  'conditions-generales': {
    slug: 'conditions-generales',
    title: 'Conditions générales',
    description: 'Conditions générales de vente et de réservation ANGALY.',
    intro: 'Ces conditions encadrent les commandes, devis et réservations passés sur le site.',
    sections: [
      {
        heading: 'Commandes et devis',
        paragraphs: [
          'Une commande est ferme après confirmation du paiement. Un devis sur mesure engage la maison à compter de son acceptation par la cliente.',
        ],
      },
      {
        heading: 'Rendez-vous et essayages',
        paragraphs: [
          'Un rendez-vous peut être déplacé ou annulé depuis votre espace client. Merci de prévenir la maison dès que possible en cas d’empêchement.',
        ],
      },
      {
        heading: 'Paiement',
        paragraphs: ['Les modalités et moyens de paiement acceptés sont précisés lors de la commande ou sur le devis.'],
      },
    ],
  },
  presse: {
    slug: 'presse',
    title: 'Presse',
    description: 'Espace presse de la maison ANGALY.',
    intro: 'Journalistes, rédactions et créateurs de contenu : la maison répond à vos demandes.',
    sections: [
      {
        heading: 'Contact presse',
        paragraphs: [
          `Pour une demande d’interview, de visuels ou de pièces à prêter, écrivez-nous à ${LEGAL_CONTACT_EMAIL} en précisant votre média et votre échéance.`,
        ],
      },
    ],
  },
  carrieres: {
    slug: 'carrieres',
    title: 'Carrières',
    description: 'Rejoindre la maison ANGALY.',
    intro: 'La maison réunit couturières, patronnières et artisans passionnés par le savoir-faire malgache.',
    sections: [
      {
        heading: 'Candidature spontanée',
        paragraphs: [
          `Envoyez votre présentation et votre portfolio à ${LEGAL_CONTACT_EMAIL}. Aucune offre n’est ouverte pour le moment ; nous conservons les candidatures pour nos prochains recrutements.`,
        ],
      },
    ],
  },
};
