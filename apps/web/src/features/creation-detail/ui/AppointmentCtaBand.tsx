import { Gem } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/** Real Stitch screen's closing appointment band: bg-navy, gold diamond icon, heading, CTA. */
export function AppointmentCtaBand() {
  return (
    <section className="bg-angaly-navy px-6 py-20 text-center text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <Gem className="text-angaly-champagne mb-6 h-9 w-9" aria-hidden="true" />
        <h2 className="font-heading mb-6 text-3xl md:text-4xl">Envie d&apos;essayer cette création&nbsp;?</h2>
        <p className="mb-10 text-sm leading-relaxed text-white/80">
          Prenez rendez-vous dans notre atelier pour un essayage privé ou pour discuter d&apos;une création sur
          mesure inspirée de ce modèle.
        </p>
        <Link
          href={ROUTES.prendreRendezVous}
          className="hover:bg-angaly-warm-ivory rounded-sm bg-white px-8 py-4 text-sm tracking-wider text-angaly-navy uppercase transition-colors"
        >
          Prendre rendez-vous
        </Link>
      </div>
    </section>
  );
}
