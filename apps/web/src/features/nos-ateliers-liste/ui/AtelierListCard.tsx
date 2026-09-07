import { Clock, MapPin, Navigation } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { AtelierDto } from '@angaly/types';

import { buildDirectionsUrl } from '../utils/buildDirectionsUrl';
import { summarizeOpeningHours } from '../utils/summarizeOpeningHours';

export function AtelierListCard({
  atelier,
  isFlagship,
  isActive,
  onHoverChange,
}: {
  atelier: AtelierDto;
  isFlagship: boolean;
  isActive: boolean;
  onHoverChange: (slug: string | null) => void;
}) {
  const photo = [...atelier.media].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const hoursLines = summarizeOpeningHours(atelier.openingHours);

  return (
    <article
      onMouseEnter={() => onHoverChange(atelier.slug)}
      onMouseLeave={() => onHoverChange(null)}
      className={`flex flex-col gap-6 border bg-white p-6 transition-shadow duration-300 sm:flex-row ${
        isActive ? 'border-angaly-navy shadow-soft' : 'border-angaly-border hover:shadow-soft'
      }`}
    >
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-angaly-warm-ivory sm:h-auto sm:w-48">
        {photo && <Image src={photo.url} alt={photo.altText} fill sizes="192px" className="object-cover" />}
      </div>
      <div className="flex flex-grow flex-col justify-between py-1">
        <div>
          <h3 className="font-heading mb-2 text-2xl text-angaly-navy">
            {atelier.name}
            {isFlagship ? ' (Flagship)' : ''}
          </h3>
          <div className="mb-1 flex items-start gap-2 text-sm text-angaly-slate">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <p>
              {atelier.address}
              <br />
              {atelier.city}
            </p>
          </div>
          <div className="mb-4 flex items-start gap-2 text-sm text-angaly-slate">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <div>
              {hoursLines.length > 0 ? (
                hoursLines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p>Horaires non communiqués</p>
              )}
            </div>
          </div>
          {atelier.services.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {atelier.services.map((service) => (
                <span
                  key={service}
                  className="border border-angaly-border/50 bg-angaly-ivory px-2 py-1 text-[10px] tracking-wider text-angaly-warm-gray uppercase"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <Link
            href={`/ateliers/${atelier.slug}`}
            className="text-sm font-medium text-angaly-navy underline decoration-angaly-border underline-offset-4 transition-colors hover:text-angaly-champagne hover:decoration-angaly-champagne"
          >
            Voir la fiche complète
          </Link>
          <a
            href={buildDirectionsUrl(atelier)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-angaly-navy px-4 py-2 text-sm text-angaly-navy transition-colors duration-300 hover:bg-angaly-navy hover:text-white"
          >
            <Navigation className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Itinéraire
          </a>
        </div>
      </div>
    </article>
  );
}
