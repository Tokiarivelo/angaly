import Link from 'next/link';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ROUTES } from '@/lib/routes';

const INFORMATIONS_COLUMN = [
  { label: 'Mentions Légales', href: '/mentions-legales' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Livraison & Retours', href: '/livraison-retours' },
];

const MAISON_COLUMN = [
  { label: 'Presse', href: '/presse' },
  { label: 'Carrières', href: '/carrieres' },
  { label: 'Contact', href: ROUTES.contact },
];

/** Matches the real Stitch "Homepage" screen footer: 3 columns, no social icons. */
export function Footer() {
  return (
    <footer className="bg-angaly-navy-dark text-white/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-3">
        <div className="flex flex-col gap-4">
          <span className="font-heading text-2xl text-white">ANGALY</span>
          <p className="max-w-xs text-sm text-white/60">
            Maison de couture basée à Madagascar, dédiée à l&apos;élégance intemporelle et au savoir-faire
            artisanal d&apos;exception.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-lg text-white">Informations</h3>
          {INFORMATIONS_COLUMN.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-lg text-white">La Maison</h3>
          {MAISON_COLUMN.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-xs tracking-wide text-white/50 uppercase">
            © {new Date().getFullYear()} Angaly Madagascar. Tous droits réservés.
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
