import { Gem } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch screen's closing section: gold diamond icon, heading, paragraph, two CTAs. */
export function VisionClosingSection({ content }: { content: AProposContent['vision'] }) {
  return (
    <section className="bg-white px-6 py-32 text-center">
      <div className="mx-auto max-w-2xl">
        <Gem className="text-angaly-champagne mx-auto mb-6 h-12 w-12" strokeWidth={1} aria-hidden="true" />
        <h2 className="font-heading mb-6 text-4xl text-angaly-navy">{content.title}</h2>
        <p className="mb-12 font-light text-angaly-slate">{content.paragraph}</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={ROUTES.creations}>Découvrir nos créations</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
