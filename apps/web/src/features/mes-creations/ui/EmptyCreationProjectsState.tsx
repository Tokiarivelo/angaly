import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export function EmptyCreationProjectsState() {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-sm border border-angaly-border bg-white p-12 text-center">
      <h2 className="mb-3 font-serif text-2xl text-angaly-navy">Vous n&apos;avez pas encore de création en cours.</h2>
      <p className="mb-8 text-sm font-light leading-relaxed text-angaly-slate">
        Une création apparaît ici dès l&apos;acceptation de votre devis sur-mesure.
      </p>
      <Link
        href={ROUTES.demandeSurMesure}
        className="inline-block rounded bg-angaly-navy px-8 py-3.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-angaly-navy-blue"
      >
        Demander un sur-mesure
      </Link>
    </div>
  );
}
