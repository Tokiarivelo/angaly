import { Navigation } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

import { buildDirectionsUrl } from '../utils/buildDirectionsUrl';

interface AtelierLocationSnippetProps {
  atelier: AtelierDto | null;
}

/** "Atelier & Contact" row of the recap card — name, address, "Voir l'itinéraire" link. */
export function AtelierLocationSnippet({ atelier }: AtelierLocationSnippetProps) {
  if (!atelier) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-angaly-navy">{atelier.name}</p>
        <p className="text-sm text-angaly-slate">{atelier.address}</p>
      </div>
      <a
        href={buildDirectionsUrl(atelier)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1 text-xs tracking-wide text-angaly-gold uppercase hover:text-angaly-navy"
      >
        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
        Voir l&apos;itinéraire
      </a>
    </div>
  );
}
