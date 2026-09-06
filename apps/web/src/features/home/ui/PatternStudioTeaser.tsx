import { Star } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 6 — PATTERN PREMIUM TEASER" / real mockup "Angaly Pattern Studio". */
export function PatternStudioTeaser({ content }: { content: HomeContent['patternStudio'] }) {
  return (
    <section className="bg-angaly-navy-dark py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-angaly-gold-light inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase">
            <Star className="h-4 w-4" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h2 className="font-heading mt-4 text-4xl">{content.headline}</h2>
          <p className="mt-6 text-white/70">{content.paragraph}</p>
          <Button asChild variant="premium" size="lg" className="mt-8">
            <Link href={ROUTES.patternStudio}>{content.cta}</Link>
          </Button>
        </div>
        <div
          aria-hidden="true"
          className="aspect-[4/3] bg-gradient-to-br from-angaly-soft-navy to-angaly-navy"
        />
      </div>
    </section>
  );
}
