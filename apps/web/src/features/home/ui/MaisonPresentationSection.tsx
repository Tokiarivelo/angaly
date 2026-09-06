import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 3 — MAISON PRESENTATION" / real mockup "Notre Savoir-Faire". */
export function MaisonPresentationSection({ content }: { content: HomeContent['maison'] }) {
  return (
    <section className="bg-angaly-warm-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <div
            aria-hidden="true"
            className="aspect-[3/4] bg-gradient-to-br from-angaly-champagne to-angaly-gold-light"
          />
          <div aria-hidden="true" className="border-angaly-ivory/30 pointer-events-none absolute inset-4 border" />
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] text-angaly-navy uppercase">{content.eyebrow}</p>
          <h2 className="font-heading mt-4 text-4xl text-angaly-navy">{content.headline}</h2>
          <p className="mt-4 text-angaly-slate">{content.paragraph}</p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href={ROUTES.aPropos}>Découvrir Angaly</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
