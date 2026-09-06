/**
 * Canonical route paths — one source of truth for cross-page links (nav,
 * footer, CTAs). Matches each page's "Route(s)" field in docs/pages/*.md.
 * Some targets don't exist yet (later phases/pages) — link to them anyway
 * rather than leaving a dead/missing CTA (see docs/pages/home.md "Points
 * d'attention").
 */
export const ROUTES = {
  home: '/',
  laUne: '/la-une',
  creations: '/creations',
  collections: '/collections',
  aPropos: '/a-propos',
  ateliers: '/ateliers',
  journal: '/journal',
  contact: '/contact',
  pretAPorter: '/pret-a-porter',
  surMesure: '/sur-mesure',
  patternStudio: '/pattern-studio',
  prendreRendezVous: '/prendre-rendez-vous',
} as const;
