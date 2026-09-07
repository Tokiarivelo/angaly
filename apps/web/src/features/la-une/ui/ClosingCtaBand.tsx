import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/** Real Stitch "La Une" screen's closing CTA band: bg-navy-blue, headline + two buttons. */
export function ClosingCtaBand() {
  return (
    <section className="flex w-full flex-col items-center bg-angaly-navy-blue px-8 py-24 text-center">
      <h2 className="font-heading mb-10 max-w-2xl text-3xl leading-tight text-angaly-ivory md:text-5xl">
        Envie de porter une création Angaly&nbsp;?
      </h2>
      <div className="flex flex-col gap-6 sm:flex-row">
        <Link
          href={ROUTES.prendreRendezVous}
          className="hover:bg-angaly-champagne inline-flex min-w-[200px] items-center justify-center bg-white px-8 py-4 text-sm tracking-widest text-angaly-navy uppercase transition-colors duration-300 hover:text-white"
        >
          Prendre rendez-vous
        </Link>
        <Link
          href={ROUTES.pretAPorter}
          className="hover:bg-angaly-ivory inline-flex min-w-[200px] items-center justify-center border border-angaly-ivory bg-transparent px-8 py-4 text-sm tracking-widest text-angaly-ivory uppercase transition-colors duration-300 hover:text-angaly-navy"
        >
          Découvrir l&apos;E-boutique
        </Link>
      </div>
    </section>
  );
}
