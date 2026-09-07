import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/** Real Stitch screen's closing CTA band: bg-navy-blue, headline + two buttons. */
export function ClosingCtaBand() {
  return (
    <section className="border-angaly-royal-navy flex flex-col items-center justify-center border-y bg-angaly-navy-blue px-8 py-32 text-center">
      <h2 className="font-heading mx-auto mb-10 max-w-3xl text-3xl tracking-wide text-angaly-ivory md:text-5xl">
        Vous souhaitez porter une pièce de cette collection&nbsp;?
      </h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Link
          href={ROUTES.prendreRendezVous}
          className="hover:bg-angaly-navy-dark w-full border border-angaly-navy bg-angaly-navy px-8 py-4 text-center text-xs tracking-[0.2em] text-white uppercase transition-colors sm:w-auto"
        >
          Prendre rendez-vous
        </Link>
        <Link
          href={ROUTES.collections}
          className="hover:bg-angaly-ivory hover:text-angaly-navy w-full border border-angaly-ivory/50 bg-transparent px-8 py-4 text-center text-xs tracking-[0.2em] text-angaly-ivory uppercase transition-colors sm:w-auto"
        >
          Voir toutes les collections
        </Link>
      </div>
    </section>
  );
}
