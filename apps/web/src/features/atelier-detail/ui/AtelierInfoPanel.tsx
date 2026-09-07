import { MapPin, Phone } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

import { buildDirectionsUrl } from '../utils/buildDirectionsUrl';
import { AtelierMiniMap } from './AtelierMiniMap';
import { AtelierOpeningHoursList } from './AtelierOpeningHoursList';
import { AtelierServicesList } from './AtelierServicesList';

/** Real screen's 2-column info section — left: details/hours/services, right: map + actions. */
export function AtelierInfoPanel({ atelier }: { atelier: AtelierDto }) {
  return (
    <section className="border-t border-angaly-border px-8 py-16">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="space-y-12">
          <div>
            <h2 className="font-heading mb-6 text-3xl text-angaly-navy">Informations Pratiques</h2>
            <div className="space-y-4 text-sm text-angaly-navy">
              <p className="flex items-start gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
                <span>
                  {atelier.address}
                  <br />
                  {atelier.city}
                </span>
              </p>
              {atelier.phone && (
                <p className="flex items-center gap-4">
                  <Phone className="h-5 w-5 shrink-0 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
                  <a href={`tel:${atelier.phone}`} className="hover:text-angaly-champagne transition-colors">
                    {atelier.phone}
                  </a>
                </p>
              )}
            </div>
          </div>
          <AtelierOpeningHoursList openingHours={atelier.openingHours} />
          <AtelierServicesList services={atelier.services} />
        </div>
        <div className="flex h-full flex-col">
          <div className="mb-8 flex flex-grow flex-col">
            <AtelierMiniMap />
          </div>
          <div className="space-y-4">
            <a
              href={`${ROUTES.prendreRendezVous}?atelierId=${atelier.id}`}
              className="hover:bg-angaly-navy-blue block w-full bg-angaly-navy py-4 text-center text-sm tracking-widest text-white uppercase transition-colors duration-300"
            >
              Prendre rendez-vous dans cet atelier
            </a>
            <a
              href={buildDirectionsUrl(atelier)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-angaly-navy py-4 text-center text-sm tracking-widest text-angaly-navy uppercase transition-colors duration-300 hover:bg-angaly-navy hover:text-white"
            >
              Voir l&apos;itinéraire
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
