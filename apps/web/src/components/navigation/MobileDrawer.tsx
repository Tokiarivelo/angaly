'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Facebook, Heart, Instagram, Search, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useMobileDrawer } from '@/features/navigation/hooks/useMobileDrawer';
import { useMobileSearchOverlay } from '@/features/navigation/hooks/useMobileSearchOverlay';
import { DRAWER_NAV_LINKS, DRAWER_SECONDARY_LINKS } from '@/features/navigation/consts/nav-links.const';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ROUTES } from '@/lib/routes';

/**
 * Real Stitch "Menu Mobile" screen: full-screen navy drawer. Built on Radix Dialog for
 * free focus-trap + Escape-to-close (spec §74 accessibility) rather than hand-rolled logic.
 */
export function MobileDrawer() {
  const { isOpen, close } = useMobileDrawer();
  const { open: openSearch } = useMobileSearchOverlay();
  const pathname = usePathname();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60]" />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex flex-col space-y-8 overflow-y-auto bg-angaly-navy p-12 text-angaly-ivory"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Menu de navigation</Dialog.Title>
          <div className="mb-8 flex w-full items-center justify-between">
            <span className="font-heading text-xl font-bold tracking-[0.4em] text-angaly-champagne">ANGALY</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer le menu" className="text-angaly-ivory transition-colors hover:text-angaly-champagne">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <nav aria-label="Navigation principale" className="flex flex-1 flex-col space-y-6 overflow-y-auto">
            {DRAWER_NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-heading flex items-center gap-3 pl-4 text-3xl tracking-tight italic transition-all duration-300 ${
                    isActive
                      ? 'border-l-2 border-angaly-gold text-angaly-champagne'
                      : 'text-angaly-ivory opacity-80 hover:text-angaly-champagne hover:opacity-100'
                  }`}
                >
                  {link.label}
                  {'badge' in link && (
                    <span className="rounded-full border border-angaly-champagne/30 bg-angaly-champagne/10 px-2 py-0.5 font-sans text-[10px] tracking-widest text-angaly-champagne uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-6 h-px w-full bg-angaly-royal-navy" aria-hidden="true" />

          <div className="mb-8 flex flex-col space-y-4">
            <button
              type="button"
              onClick={() => {
                close();
                openSearch();
              }}
              className="flex items-center gap-4 text-left text-sm tracking-wide text-angaly-slate transition-colors hover:text-angaly-ivory"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Rechercher
            </button>
            {DRAWER_SECONDARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex items-center gap-4 text-sm tracking-wide text-angaly-slate transition-colors hover:text-angaly-ivory"
              >
                {link.label === 'Mes favoris' ? (
                  <Heart className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <User className="h-5 w-5" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto flex flex-col space-y-8">
            <Link
              href={ROUTES.prendreRendezVous}
              onClick={close}
              className="w-full bg-angaly-ivory px-6 py-4 text-center text-sm font-medium tracking-widest text-angaly-navy uppercase transition-colors hover:bg-angaly-warm-ivory"
            >
              Prendre rendez-vous
            </Link>
            <div className="flex items-center justify-center gap-6">
              <LanguageSwitcher />
            </div>
            <div className="flex justify-center space-x-6 text-angaly-slate">
              <a href="#" className="transition-colors hover:text-angaly-champagne">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="transition-colors hover:text-angaly-champagne">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
