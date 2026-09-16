import { Gem } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import type { JournalArticleContent } from '../hooks/useJournalArticleContent';

/** Real screen's closing band — own copy, same navy-blue/diamond-icon pattern as other pages' CTA bands (real content — see hooks/useJournalArticleContent.ts). */
export function AppointmentCtaBand({ content }: { content: JournalArticleContent['closingCta'] }) {
  return (
    <section className="bg-angaly-navy-blue px-8 py-20 text-center text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <Gem className="mb-6 h-9 w-9 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="font-heading mb-8 text-3xl leading-tight md:text-5xl">{content.headline}</h2>
        <p className="mb-10 text-lg font-light text-angaly-ivory/80">{content.body}</p>
        <Link
          href={ROUTES.prendreRendezVous}
          className="inline-block bg-angaly-champagne px-10 py-4 text-sm tracking-[0.2em] text-white uppercase transition-colors hover:bg-angaly-gold-light"
        >
          {content.ctaPrimaryLabel}
        </Link>
      </div>
    </section>
  );
}
