'use client';

import { Heart, Home, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useMobileSearchOverlay } from '@/features/navigation/hooks/useMobileSearchOverlay';
import { useNavigationContent } from '@/features/navigation/hooks/useNavigationContent';
import { ROUTES } from '@/lib/routes';

/**
 * Real Stitch "Navigation Mobile & FAB" screen's bottom bar. Shown below `lg:` — the same
 * breakpoint `Header.tsx` already uses for its own desktop/mobile split, not the mockup's
 * raw `md:` (kept consistent with the rest of the site rather than the mockup's own choice).
 * Rendez-vous CTA label — real content, see hooks/useNavigationContent.ts.
 */
export function MobileBottomBar() {
  const pathname = usePathname();
  const { open: openSearch } = useMobileSearchOverlay();
  const isHome = pathname === ROUTES.home;
  const { data: content } = useNavigationContent();

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-angaly-border bg-angaly-ivory px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="relative mx-auto flex h-16 w-full max-w-md items-center justify-between">
        <div className="flex w-[40%] justify-evenly">
          <Link
            href={ROUTES.home}
            aria-current={isHome ? 'page' : undefined}
            className={`flex w-full flex-col items-center justify-center ${isHome ? 'text-angaly-navy' : 'text-angaly-warm-gray hover:text-angaly-gold'} transition-colors`}
          >
            <Home className="h-5 w-5" aria-hidden="true" fill={isHome ? 'currentColor' : 'none'} />
            <span className="font-label mt-1 text-[9px] tracking-widest uppercase">Accueil</span>
          </Link>
          <button
            type="button"
            onClick={openSearch}
            className="flex w-full flex-col items-center justify-center text-angaly-warm-gray transition-colors hover:text-angaly-gold"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            <span className="font-label mt-1 text-[9px] tracking-widest uppercase">Recherche</span>
          </button>
        </div>

        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          <Link
            href={ROUTES.prendreRendezVous}
            className="font-label border-angaly-navy-dark hover:bg-angaly-navy-blue block rounded-full border bg-angaly-navy px-6 py-3 text-[10px] tracking-widest whitespace-nowrap text-white uppercase shadow-sm transition-colors active:scale-95"
          >
            {content.cta.label}
          </Link>
        </div>

        <div className="flex w-[40%] justify-evenly">
          <Link
            href={ROUTES.favoris}
            className="flex w-full flex-col items-center justify-center text-angaly-warm-gray transition-colors hover:text-angaly-gold"
          >
            <Heart className="h-5 w-5" aria-hidden="true" />
            <span className="font-label mt-1 text-[9px] tracking-widest uppercase">Favoris</span>
          </Link>
          <Link
            href={ROUTES.compte}
            className="flex w-full flex-col items-center justify-center text-angaly-warm-gray transition-colors hover:text-angaly-gold"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span className="font-label mt-1 text-[9px] tracking-widest uppercase">Compte</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
