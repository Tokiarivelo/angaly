import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 6 — PATTERN PREMIUM TEASER". */
export function PatternStudioTeaser({ content }: { content: HomeContent['patternStudio'] }) {
  return (
    <section className="bg-angaly-navy-dark py-20 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-heading text-angaly-champagne text-4xl">{content.headline}</h2>
        <p className="font-heading mt-2 text-xl text-white/90 italic">{content.subheading}</p>
        <p className="mt-6 text-white/70">{content.paragraph}</p>
        <Button asChild variant="premium" size="lg" className="mt-8">
          <Link href={ROUTES.patternStudio}>Découvrir Patron Premium</Link>
        </Button>
      </div>
    </section>
  );
}
