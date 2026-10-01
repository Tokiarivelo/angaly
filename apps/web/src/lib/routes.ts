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
  demandeSurMesure: '/sur-mesure/demande',
  patternStudio: '/pattern-studio',
  prendreRendezVous: '/prendre-rendez-vous',
  reservationEssayage: '/essayage/reserver',
  favoris: '/mes-favoris',
  mesCreations: '/mes-creations',
  /** Back-office (staff only — the (admin) layout redirects other roles to /). */
  backOffice: '/dashboard',
  adminCreationProjects: '/projets-creation',
  connexion: '/connexion',
  inscription: '/inscription',
  motDePasseOublie: '/mot-de-passe-oublie',
  /** Client space — unauthenticated visitors are redirected to /connexion (with redirectTo) by the (client) layout. */
  compte: '/espace-client',
} as const;
