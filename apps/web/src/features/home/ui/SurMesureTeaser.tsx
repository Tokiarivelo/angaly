import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 5 — SUR MESURE PROCESS BAND". */
export function SurMesureTeaser({ content }: { content: HomeContent['surMesure'] }) {
  return (
    <section className="bg-angaly-navy-blue py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {content.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="font-heading text-angaly-champagne text-sm">{index + 1}</span>
                <span className="text-sm tracking-wide">{step}</span>
              </span>
              {index < content.steps.length - 1 && (
                <span aria-hidden="true" className="h-px w-8 bg-white/30" />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="secondary" size="lg" className="border-white bg-white text-angaly-navy hover:bg-white/90">
            <Link href={ROUTES.surMesure}>{content.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
