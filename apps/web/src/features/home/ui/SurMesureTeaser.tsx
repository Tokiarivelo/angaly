import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 5 — SUR MESURE PROCESS BAND" / real mockup "L'Expérience Sur Mesure". */
export function SurMesureTeaser({ content }: { content: HomeContent['surMesure'] }) {
  return (
    <section className="bg-angaly-navy-blue py-20 text-white">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="font-heading text-4xl">{content.headline}</h2>
        <p className="mt-3 text-sm tracking-[0.2em] text-white/70 uppercase">{content.subheading}</p>

        <ol className="mt-12 flex flex-wrap items-start justify-center gap-x-2 gap-y-8">
          {content.steps.map((step, index) => (
            <li key={step.label} className="flex items-start">
              <div className="flex w-28 flex-col items-center gap-2 text-center">
                <span className="border-angaly-champagne/60 font-heading text-angaly-champagne flex h-9 w-9 items-center justify-center rounded-full border text-sm">
                  {index + 1}
                </span>
                <span className="font-heading text-base">{step.label}</span>
                <span className="text-xs text-white/60">{step.description}</span>
              </div>
              {index < content.steps.length - 1 && (
                <span aria-hidden="true" className="mt-4 h-px w-6 flex-shrink-0 bg-white/30 sm:w-10" />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-14 flex justify-center">
          <Button asChild variant="secondary" size="lg" className="border-white bg-white text-angaly-navy hover:bg-white/90">
            <Link href={ROUTES.surMesure}>{content.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
