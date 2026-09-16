import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import type { GalleryContent } from '../hooks/useGalleryContent';

/** Real Stitch "Nos Créations" screen: breadcrumb + centered serif title + intro (real content — see hooks/useGalleryContent.ts). */
export function GalleryHeader({ content }: { content: GalleryContent['header'] }) {
  return (
    <header className="mx-auto flex w-full max-w-4xl flex-col items-center px-8 pt-16 pb-12 text-center md:px-16">
      <nav aria-label="Fil d'Ariane" className="mb-8 flex items-center space-x-2 text-xs tracking-wider text-angaly-slate uppercase">
        <Link href={ROUTES.home} className="hover:text-angaly-navy transition-colors">
          Accueil
        </Link>
        <span className="text-angaly-border">/</span>
        <span className="text-angaly-navy">Nos Créations</span>
      </nav>
      <h1 className="font-heading mb-6 text-5xl tracking-wide text-angaly-navy md:text-6xl">{content.title}</h1>
      <p className="max-w-2xl text-lg leading-relaxed text-angaly-slate">{content.subtitle}</p>
    </header>
  );
}
