import { ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/**
 * Desktop-focused top nav — matches the real Stitch "Homepage" screen
 * (`f4fa1f6a3d0241cd9d1c5e003cbc1c38`) exactly: 5 links, centered logo, bag +
 * account icons only. The mobile hamburger drawer / bottom bar is
 * navigation-mobile's own feature (docs/pages/navigation-mobile.md) — this
 * header degrades to a minimal bar on small screens in the meantime, never a
 * broken layout.
 */
const NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.home },
  { label: 'La Une', href: ROUTES.laUne },
  { label: 'Nos Créations', href: ROUTES.creations },
  { label: 'Atelier', href: ROUTES.ateliers },
  { label: 'Héritage', href: ROUTES.aPropos },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-angaly-navy text-white">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === ROUTES.home ? 'page' : undefined}
              className="border-b border-transparent pb-1 text-xs tracking-wide text-white/85 transition-colors hover:text-angaly-champagne aria-[current=page]:border-angaly-champagne aria-[current=page]:text-angaly-champagne"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href={ROUTES.home} className="font-heading col-start-2 text-2xl tracking-wide">
          ANGALY
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-4">
          <button type="button" aria-label="Panier" className="text-white/85 hover:text-white">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Mon compte" className="text-white/85 hover:text-white">
            <User className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
