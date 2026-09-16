'use client';

import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { usePage404Content } from '../hooks/usePage404Content';
import { NotFoundIllustration } from './NotFoundIllustration';
import { QuickLinksRow } from './QuickLinksRow';

/** Orchestrates the real Stitch "Page non trouvée (404)" screen (title/subtitle — real content, see hooks/usePage404Content.ts). */
export function Page404() {
  const { data: content } = usePage404Content();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-angaly-ivory">
      <header className="absolute top-0 z-10 flex w-full items-center justify-center py-8">
        <span className="font-heading text-2xl font-bold tracking-[0.3em] text-angaly-navy uppercase">ANGALY</span>
      </header>

      <main className="z-10 mx-auto flex w-full max-w-4xl flex-grow flex-col items-center justify-center px-6 py-24 text-center">
        <NotFoundIllustration />

        <div className="mx-auto mb-12 max-w-2xl space-y-6">
          <h1 className="font-heading text-4xl leading-tight tracking-wide text-angaly-navy md:text-5xl lg:text-6xl">
            {content.main.title}
          </h1>
          <p className="text-lg font-light text-angaly-slate md:text-xl">{content.main.subtitle}</p>
        </div>

        <div className="mx-auto mb-16 flex w-full max-w-md flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            href={ROUTES.creations}
            className="w-full bg-angaly-navy px-8 py-4 text-center text-sm tracking-wider text-white uppercase transition-colors duration-300 hover:bg-angaly-navy-blue sm:w-auto"
          >
            Retour aux créations
          </Link>
          <Link
            href={ROUTES.home}
            className="w-full border border-angaly-navy bg-transparent px-8 py-4 text-center text-sm tracking-wider text-angaly-navy uppercase transition-colors duration-300 hover:bg-angaly-navy hover:text-white sm:w-auto"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <QuickLinksRow />
      </main>
    </div>
  );
}
