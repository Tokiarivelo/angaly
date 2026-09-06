import { ROUTES } from '@/lib/routes';

export interface HomeContent {
  hero: { eyebrow: string; headline: string; subheading: string };
  laUne: { headline: string; cta: string };
  maison: { eyebrow: string; headline: string; paragraph: string };
  categories: { headline: string; items: { label: string; href: string }[] };
  surMesure: { headline: string; subheading: string; steps: { label: string; description: string }[]; cta: string };
  patternStudio: { eyebrow: string; headline: string; paragraph: string; cta: string };
  ateliersTeaser: { headline: string };
  journalTeaser: { headline: string };
  newsletter: { headline: string };
}

/**
 * TODO(Phase 6): read from `GET /api/content/sections?page=accueil` once the
 * `content` module exists — see docs/pages/home.md "Points d'attention".
 * Copy mirrors the real Stitch "Homepage" screen
 * (`f4fa1f6a3d0241cd9d1c5e003cbc1c38`), not just stitch-prompts/01-home.md —
 * see docs/pages/home.md "Notes d'implémentation".
 */
const HOME_CONTENT: HomeContent = {
  hero: {
    eyebrow: 'MAISON DE COUTURE — MADAGASCAR',
    headline: 'ANGALY',
    subheading: "L'élégance, créée pour vous.",
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
  },
  categories: {
    headline: 'Univers',
    items: [
      { label: 'Mariage', href: ROUTES.creations },
      { label: 'Costumes', href: ROUTES.creations },
      { label: 'Soirée', href: ROUTES.creations },
      { label: 'Prêt-à-porter', href: ROUTES.pretAPorter },
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
  },
  ateliersTeaser: { headline: 'Nos Ateliers' },
  journalTeaser: { headline: 'Le Journal Angaly' },
  newsletter: { headline: 'Restez informée des nouvelles collections' },
};

export function useHomeContent(): { data: HomeContent; isLoading: false; error: null } {
  return { data: HOME_CONTENT, isLoading: false, error: null };
}
