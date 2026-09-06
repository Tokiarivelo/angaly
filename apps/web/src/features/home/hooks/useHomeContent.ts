export interface HomeContent {
  hero: { eyebrow: string; headline: string; subheading: string };
  laUne: { eyebrow: string; headline: string };
  maison: { headline: string; paragraphs: string[] };
  categories: { label: string }[];
  surMesure: { steps: string[]; cta: string };
  patternStudio: { headline: string; subheading: string; paragraph: string };
  ateliersTeaser: { headline: string };
  journalTeaser: { headline: string };
  newsletter: { headline: string };
}

/**
 * TODO(Phase 6): read from `GET /api/content/sections?page=accueil` once the
 * `content` module exists — see docs/pages/home.md "Points d'attention".
 * Hardcoded copy below mirrors stitch-prompts/01-home.md verbatim.
 */
const HOME_CONTENT: HomeContent = {
  hero: {
    eyebrow: 'MAISON DE COUTURE — MADAGASCAR',
    headline: 'ANGALY',
    subheading: "L'élégance, créée pour vous.",
  },
  laUne: {
    eyebrow: 'LA UNE',
    headline: "Les créations qui incarnent l'univers Angaly.",
  },
  maison: {
    headline: 'Une maison de couture pensée pour vous',
    paragraphs: [
      "Depuis ses débuts, Angaly conçoit des pièces uniques où savoir-faire artisanal et exigence contemporaine se rencontrent.",
      "Chaque création naît d'une écoute attentive et d'un dialogue avec celles et ceux qui la porteront.",
    ],
  },
  categories: [
    { label: 'Robes de mariée' },
    { label: 'Costumes' },
    { label: 'Robes de soirée' },
    { label: 'Créations sur mesure' },
    { label: 'Prêt-à-porter' },
  ],
  surMesure: {
    steps: ['Votre idée', 'Consultation', 'Mesures', 'Patron', 'Confection', 'Essayage', 'Livraison'],
    cta: 'Créer ma tenue sur mesure',
  },
  patternStudio: {
    headline: 'Angaly Pattern Studio',
    subheading: 'Votre patron, créé selon vos mesures.',
    paragraph:
      "Un atelier de patronage professionnel assisté par IA — jamais un générateur automatique de robe, toujours validé par une couturière.",
  },
  ateliersTeaser: { headline: 'Nos Ateliers' },
  journalTeaser: { headline: 'Le Journal Angaly' },
  newsletter: { headline: 'Restez informée des nouvelles collections' },
};

export function useHomeContent(): { data: HomeContent; isLoading: false; error: null } {
  return { data: HOME_CONTENT, isLoading: false, error: null };
}
