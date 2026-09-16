import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import type { CollectionsListeContent } from '../hooks/useCollectionsContent';

/** Real Stitch "Nos Collections (Index Editorial)" screen: breadcrumb + centered serif header (real content — see hooks/useCollectionsContent.ts). */
export function CollectionsHeader({ content }: { content: CollectionsListeContent['header'] }) {
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-[1920px] px-8 py-6 text-xs tracking-widest text-angaly-slate uppercase">
        <div className="flex items-center space-x-2">
          <Link href={ROUTES.home} className="hover:text-angaly-navy transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <span className="text-angaly-navy">Collections</span>
        </div>
      </nav>
      <header className="mx-auto max-w-4xl px-8 py-16 text-center md:py-24">
        <h1 className="font-heading mb-6 text-5xl tracking-wide text-angaly-navy md:text-7xl">{content.title}</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed font-light text-angaly-slate">{content.subtitle}</p>
      </header>
    </>
  );
}
