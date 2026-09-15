import { ROUTES } from '@/lib/routes';

/** Desktop header primary navigation links. */
export const HEADER_NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.home },
  { label: 'La Une', href: ROUTES.laUne },
  { label: 'Nos Créations', href: ROUTES.creations },
  { label: 'Prêt-à-porter', href: ROUTES.pretAPorter },
  { label: 'Atelier', href: ROUTES.ateliers },
  { label: 'Héritage', href: ROUTES.aPropos },
  { label: 'Journal', href: ROUTES.journal },
  { label: 'Pattern Studio', href: ROUTES.patternStudio },
] as const;

/** Real Stitch "Menu Mobile" screen's drawer links, in order. */
export const DRAWER_NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.home },
  { label: 'La Une', href: ROUTES.laUne },
  { label: 'Nos Créations', href: ROUTES.creations },
  { label: 'Prêt-à-porter', href: ROUTES.pretAPorter },
  { label: 'Sur Mesure', href: ROUTES.surMesure },
  { label: 'Patron Premium', href: ROUTES.patternStudio, badge: 'Premium' },
  { label: 'À propos', href: ROUTES.aPropos },
  { label: 'Ateliers', href: ROUTES.ateliers },
  { label: 'Journal', href: ROUTES.journal },
  { label: 'Contact', href: ROUTES.contact },
] as const;

/** Real screen's secondary drawer links (below the divider) — icons chosen per-item in the component. */
export const DRAWER_SECONDARY_LINKS = [
  { label: 'Mes favoris', href: ROUTES.favoris },
  { label: 'Mon compte', href: ROUTES.compte },
] as const;
