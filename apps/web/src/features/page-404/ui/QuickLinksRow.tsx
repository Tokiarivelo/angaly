import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/**
 * Real screen's "Vous cherchiez peut-être :" row: Nos Créations / Le Journal / Prendre
 * rendez-vous — not the Sur Mesure/Contact links this page's original plan assumed before
 * checking the real screen (see docs/pages/page-404.md "Points d'attention").
 */
export function QuickLinksRow() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center border-t border-angaly-border pt-12">
      <p className="font-heading mb-6 text-xl text-angaly-slate italic">Vous cherchiez peut-être :</p>
      <nav className="flex flex-wrap justify-center gap-8">
        <Link
          href={ROUTES.creations}
          className="group text-sm tracking-widest text-angaly-navy uppercase transition-colors hover:text-angaly-gold"
        >
          <span className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-angaly-gold after:transition-all after:duration-300 after:content-[''] group-hover:after:w-full">
            Nos Créations
          </span>
        </Link>
        <Link
          href={ROUTES.journal}
          className="group text-sm tracking-widest text-angaly-navy uppercase transition-colors hover:text-angaly-gold"
        >
          <span className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-angaly-gold after:transition-all after:duration-300 after:content-[''] group-hover:after:w-full">
            Le Journal
          </span>
        </Link>
        <Link
          href={ROUTES.prendreRendezVous}
          className="group text-sm tracking-widest text-angaly-navy uppercase transition-colors hover:text-angaly-gold"
        >
          <span className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-angaly-gold after:transition-all after:duration-300 after:content-[''] group-hover:after:w-full">
            Prendre rendez-vous
          </span>
        </Link>
      </nav>
    </div>
  );
}
