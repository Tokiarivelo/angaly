import Link from 'next/link';
import type { AtelierDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

/** Real screen's "Nos Ateliers" mini-list — compact addresses + "Voir tous nos ateliers" link. */
export function ContactAteliersMiniList({ ateliers }: { ateliers: AtelierDto[] }) {
  return (
    <div>
      <h2 className="font-heading mb-6 border-b border-angaly-border pb-4 text-2xl tracking-widest text-angaly-royal-navy uppercase">
        Nos Ateliers
      </h2>
      <div className="space-y-6">
        {ateliers.map((atelier) => (
          <div key={atelier.id}>
            <p className="mb-1 text-sm font-semibold tracking-wider text-angaly-navy uppercase">{atelier.name}</p>
            <p className="text-sm text-angaly-slate">
              {atelier.address}
              <br />
              {atelier.city}
            </p>
          </div>
        ))}
      </div>
      <Link
        href={ROUTES.ateliers}
        className="mt-6 inline-block border-b border-angaly-soft-navy pb-1 text-sm tracking-widest text-angaly-soft-navy uppercase transition-colors hover:border-angaly-gold hover:text-angaly-gold"
      >
        Voir tous nos ateliers
      </Link>
    </div>
  );
}
