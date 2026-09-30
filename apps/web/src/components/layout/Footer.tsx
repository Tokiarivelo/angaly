'use client';

import Link from 'next/link';

import { cmsList, cmsText, readString } from '@/lib/cms/cms-values';
import { useCmsPage } from '@/lib/cms/use-cms-page';
import { ROUTES } from '@/lib/routes';

import { LanguageSwitcher } from './LanguageSwitcher';

interface FooterLink {
  label: string;
  href: string;
}

const DEFAULT_BRAND = {
  title: 'ANGALY',
  description:
    "Maison de couture basée à Madagascar, dédiée à l'élégance intemporelle et au savoir-faire artisanal d'exception.",
};
const DEFAULT_COPYRIGHT = '© {year} Angaly Madagascar. Tous droits réservés.';

const INFORMATIONS_COLUMN: FooterLink[] = [
  { label: 'Mentions Légales', href: '/mentions-legales' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Livraison & Retours', href: '/livraison-retours' },
];

const MAISON_COLUMN: FooterLink[] = [
  { label: 'Presse', href: '/presse' },
  { label: 'Carrières', href: '/carrieres' },
  { label: 'Contact', href: ROUTES.contact },
];

function parseLink(item: Record<string, unknown>): FooterLink | undefined {
  const label = readString(item['label']);
  const href = readString(item['href']);
  return label && href ? { label, href } : undefined;
}

/** Matches the real Stitch "Homepage" screen footer exactly: bg-primary (#061938), 4-col grid (brand spans 2), no social icons. */
export function Footer() {
  const cms = useCmsPage('footer');
  const brand = cms.section('brand');
  const informations = cms.section('informations');
  const maison = cms.section('maison');
  const legal = cms.section('legal');

  const informationsLinks = cmsList(informations?.dataJson, 'links', parseLink) ?? INFORMATIONS_COLUMN;
  const maisonLinks = cmsList(maison?.dataJson, 'links', parseLink) ?? MAISON_COLUMN;
  const copyright = cmsText(legal?.titleText, DEFAULT_COPYRIGHT).replace('{year}', String(new Date().getFullYear()));

  return (
    <footer className="border-angaly-royal-navy bg-angaly-navy border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-8 py-20 lg:px-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <h2 className="font-heading text-angaly-ivory mb-4 text-3xl tracking-tighter">{cmsText(brand?.titleText, DEFAULT_BRAND.title)}</h2>
          <p className="text-angaly-warm-gray max-w-sm text-sm leading-relaxed tracking-wide">
            {cmsText(brand?.bodyText, DEFAULT_BRAND.description)}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-heading text-angaly-ivory mb-2 text-lg">{cmsText(informations?.titleText, 'Informations')}</h3>
          {informationsLinks.map((link) => (
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
          <h3 className="font-heading text-angaly-ivory mb-2 text-lg">{cmsText(maison?.titleText, 'La Maison')}</h3>
          {maisonLinks.map((link) => (
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
          {copyright}
        </p>
        <div className="mt-4 flex justify-center md:mt-0">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
