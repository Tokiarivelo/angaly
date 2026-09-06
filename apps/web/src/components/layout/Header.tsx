import { Heart, Search, User } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

/**
 * Desktop-focused top nav (stitch-prompts/01-home.md "TOP NAVIGATION BAR").
 * The mobile hamburger drawer / bottom bar is navigation-mobile's own feature
 * (docs/pages/navigation-mobile.md) — this header degrades to a minimal bar
 * on small screens in the meantime, never a broken layout.
 */
const NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.home },
  { label: 'La Une', href: ROUTES.laUne },
  { label: 'Nos Créations', href: ROUTES.creations },
  { label: 'Prêt-à-porter', href: ROUTES.pretAPorter },
  { label: 'Sur Mesure', href: ROUTES.surMesure },
  { label: 'Patron Premium', href: ROUTES.patternStudio },
  { label: 'À propos', href: ROUTES.aPropos },
  { label: 'Ateliers', href: ROUTES.ateliers },
  { label: 'Journal', href: ROUTES.journal },
  { label: 'Contact', href: ROUTES.contact },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-angaly-navy text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link href={ROUTES.home} className="font-heading text-2xl tracking-wide">
          ANGALY
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-wide text-white/85 transition-colors hover:text-angaly-champagne"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button type="button" aria-label="Rechercher" className="text-white/85 hover:text-white">
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Favoris" className="text-white/85 hover:text-white">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Mon compte" className="text-white/85 hover:text-white">
            <User className="h-5 w-5" aria-hidden="true" />
          </button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
