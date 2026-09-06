import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 3 — MAISON PRESENTATION". */
export function MaisonPresentationSection({ content }: { content: HomeContent['maison'] }) {
  return (
    <section className="bg-angaly-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div aria-hidden="true" className="aspect-[3/4] bg-gradient-to-br from-angaly-warm-ivory to-angaly-champagne" />
        <div>
          <h2 className="font-heading text-4xl text-angaly-navy">{content.headline}</h2>
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-angaly-slate">
              {paragraph}
            </p>
          ))}
          <Button asChild variant="secondary" className="mt-6">
            <Link href={ROUTES.aPropos}>Découvrir Angaly</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
