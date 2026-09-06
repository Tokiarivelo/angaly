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

/** Matches the real Stitch "Homepage" screen footer exactly: bg-primary (#061938), 4-col grid (brand spans 2), no social icons. */
export function Footer() {
  return (
    <footer className="border-angaly-royal-navy bg-angaly-navy border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-8 py-20 lg:px-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <h2 className="font-heading text-angaly-ivory mb-4 text-3xl tracking-tighter">ANGALY</h2>
          <p className="text-angaly-warm-gray max-w-sm text-sm leading-relaxed tracking-wide">
            Maison de couture basée à Madagascar, dédiée à l&apos;élégance intemporelle et au savoir-faire
            artisanal d&apos;exception.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-heading text-angaly-ivory mb-2 text-lg">Informations</h3>
          {INFORMATIONS_COLUMN.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-angaly-warm-gray hover:text-angaly-ivory text-sm tracking-wide transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-heading text-angaly-ivory mb-2 text-lg">La Maison</h3>
          {MAISON_COLUMN.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-angaly-warm-gray hover:text-angaly-ivory text-sm tracking-wide transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-angaly-royal-navy/50 mx-auto max-w-7xl border-t px-8 pt-8 pb-12 text-center lg:px-16 md:flex md:items-center md:justify-between md:text-left">
        <p className="text-angaly-warm-gray text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} Angaly Madagascar. Tous droits réservés.
        </p>
        <div className="mt-4 flex justify-center md:mt-0">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
