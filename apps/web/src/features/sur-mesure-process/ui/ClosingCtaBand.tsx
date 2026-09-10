import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { SurMesureContent } from '../hooks/useSurMesureContent';

/** Full-width closing band on a translucent warm-ivory tint (real screen), same two CTAs as the hero. */
export function ClosingCtaBand({ content }: { content: SurMesureContent['closing'] }) {
  return (
    <section className="bg-angaly-warm-ivory/50 px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-heading mb-10 text-3xl text-angaly-navy md:text-4xl">{content.title}</h2>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={ROUTES.demandeSurMesure}>Créer ma tenue sur mesure</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
