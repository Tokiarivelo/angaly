import { Facebook, Instagram } from 'lucide-react';
import Link from 'next/link';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ROUTES } from '@/lib/routes';

const ANGALY_COLUMN = [
  { label: 'Nos créations', href: ROUTES.creations },
  { label: 'Collections', href: ROUTES.collections },
  { label: 'Sur mesure', href: ROUTES.surMesure },
  { label: 'Patron Premium', href: ROUTES.patternStudio },
  { label: 'Prendre rendez-vous', href: ROUTES.prendreRendezVous },
  { label: 'Ateliers', href: ROUTES.ateliers },
  { label: 'Journal', href: ROUTES.journal },
  { label: 'Contact', href: ROUTES.contact },
];

export function Footer() {
  return (
    <footer className="bg-angaly-navy-dark text-white/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <span className="font-heading text-2xl text-white">ANGALY</span>
          <p className="max-w-xs text-sm text-white/60">Chez Angaly, votre vêtement est créé pour vous.</p>
          <div className="flex gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-angaly-champagne">
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-angaly-champagne">
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-angaly-champagne uppercase">Angaly</h3>
          {ANGALY_COLUMN.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-angaly-champagne uppercase">
            Informations
          </h3>
          <Link href="/mentions-legales" className="text-sm text-white/70 hover:text-white">
            Mentions légales
          </Link>
          <Link href="/cgv" className="text-sm text-white/70 hover:text-white">
            CGV
          </Link>
          <Link href="/confidentialite" className="text-sm text-white/70 hover:text-white">
            Confidentialité
          </Link>
          <Link href="/cookies" className="text-sm text-white/70 hover:text-white">
            Cookies
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-angaly-champagne uppercase">Contact</h3>
          <Link href={ROUTES.contact} className="text-sm text-white/70 hover:text-white">
            Nous contacter
          </Link>
          <Link href={ROUTES.ateliers} className="text-sm text-white/70 hover:text-white">
            Nos ateliers
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} ANGALY — Maison de couture. Tous droits réservés.
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
