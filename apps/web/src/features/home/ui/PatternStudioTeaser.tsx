import { Star } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 6 — PATTERN PREMIUM TEASER" / real mockup "Angaly Pattern Studio". */
export function PatternStudioTeaser({ content }: { content: HomeContent['patternStudio'] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-16">
      <div className="border-angaly-gold/20 relative flex flex-col items-center gap-12 overflow-hidden rounded-sm border bg-angaly-navy-dark p-10 text-white md:flex-row md:p-16">
        <div
          aria-hidden="true"
          className="bg-angaly-gold/10 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl"
        />
        <div className="relative z-10 flex-1">
          <p className="text-angaly-champagne inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
            <Star className="text-angaly-gold h-4 w-4" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h2 className="font-heading mt-4 text-4xl md:text-5xl">{content.headline}</h2>
          <p className="mt-6 max-w-lg text-lg text-white/80">{content.paragraph}</p>
          <Button asChild variant="premium" size="lg" className="mt-8">
            <Link href={ROUTES.patternStudio}>{content.cta}</Link>
          </Button>
        </div>
        <div className="relative z-10 w-full flex-1">
          <div
            aria-hidden="true"
            className="aspect-[4/3] rounded-sm bg-gradient-to-br from-angaly-soft-navy to-angaly-navy-blue"
          />
        </div>
      </div>
    </section>
  );
}
