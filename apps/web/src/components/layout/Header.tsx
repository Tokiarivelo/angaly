'use client';

import { Menu, Search, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HEADER_NAV_LINKS } from '@/features/navigation/consts/nav-links.const';
import { useMobileDrawer } from '@/features/navigation/hooks/useMobileDrawer';
import { useMobileSearchOverlay } from '@/features/navigation/hooks/useMobileSearchOverlay';
import { ROUTES } from '@/lib/routes';

export function Header() {
  const pathname = usePathname();
  const { open: openDrawer } = useMobileDrawer();
  const { open: openSearch } = useMobileSearchOverlay();

  return (
    <header className="sticky top-0 z-50 bg-angaly-navy text-white">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
        <div className="flex items-center">
          <nav aria-label="Navigation principale" className="hidden items-center gap-3.5 xl:gap-5 lg:flex">
            {HEADER_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="border-b border-transparent pb-1 text-xs tracking-widest text-angaly-ivory/80 uppercase whitespace-nowrap transition-all hover:text-angaly-champagne hover:opacity-100 aria-[current=page]:border-angaly-champagne aria-[current=page]:text-angaly-champagne aria-[current=page]:opacity-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={openDrawer}
            className="text-angaly-ivory transition-colors hover:text-angaly-champagne lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <Link href={ROUTES.home} className="font-heading col-start-2 text-2xl tracking-wide">
          ANGALY
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-4">
          <button
            type="button"
            aria-label="Panier"
            className="hidden text-angaly-ivory transition-colors hover:text-angaly-champagne lg:block"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link
            href={ROUTES.compte}
            aria-label="Mon compte"
            className="hidden text-angaly-ivory transition-colors hover:text-angaly-champagne lg:block"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label="Rechercher"
            onClick={openSearch}
            className="text-angaly-ivory transition-colors hover:text-angaly-champagne lg:hidden"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
