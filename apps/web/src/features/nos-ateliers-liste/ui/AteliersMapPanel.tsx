'use client';

import { MapPin, Minus, Plus } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

/**
 * The real Stitch screen's "interactive map" is a static styled placeholder image with a
 * few hardcoded pin positions and non-functional zoom buttons — not a real map library
 * integration (see docs/pages/nos-ateliers-liste.md "Points d'attention"). Rather than
 * hotlink Stitch's own placeholder asset or fabricate a fake geographic image, this reuses
 * the ANGALY palette to render the same "muted, editorial" aesthetic in pure CSS, with one
 * pin per real atelier at an illustrative (not geo-projected) position.
 */
const PIN_POSITIONS = [
  { top: '38%', left: '52%' },
  { top: '62%', left: '32%' },
  { top: '30%', left: '70%' },
  { top: '72%', left: '58%' },
] as const;

export function AteliersMapPanel({
  ateliers,
  activeSlug,
  onHoverChange,
}: {
  ateliers: AtelierDto[];
  activeSlug: string | null;
  onHoverChange: (slug: string | null) => void;
}) {
  return (
    <div className="relative h-[500px] w-full overflow-hidden border border-angaly-border bg-angaly-warm-ivory lg:h-auto lg:min-h-[700px] lg:w-1/2">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--angaly-ivory)',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(140,132,113,0.35) 79px, rgba(140,132,113,0.35) 80px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(140,132,113,0.35) 79px, rgba(140,132,113,0.35) 80px),' +
            'radial-gradient(circle at 18% 82%, rgba(30,69,116,0.22), transparent 42%)',
        }}
      />
      {ateliers.map((atelier, index) => {
        const position = PIN_POSITIONS[index % PIN_POSITIONS.length]!;
        const isActive = activeSlug === atelier.slug;
        return (
          <div
            key={atelier.id}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => onHoverChange(atelier.slug)}
            onMouseLeave={() => onHoverChange(null)}
          >
            <MapPin
              className="h-9 w-9 drop-shadow-md transition-colors"
              style={{ color: 'var(--angaly-navy)' }}
              fill={isActive ? 'var(--angaly-champagne)' : 'var(--angaly-navy)'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div
              role="tooltip"
              className={`pointer-events-none absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 bg-angaly-navy px-4 py-2 text-xs whitespace-nowrap text-white transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {atelier.name}
            </div>
          </div>
        );
      })}
      {/* Decorative, non-functional (no real map to zoom) — hidden from assistive tech rather than offered as a dead control. */}
      <div aria-hidden="true" className="absolute right-6 bottom-6 flex flex-col gap-2">
        <div className="flex h-10 w-10 items-center justify-center border border-angaly-border bg-white text-angaly-navy shadow-sm">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="flex h-10 w-10 items-center justify-center border border-angaly-border bg-white text-angaly-navy shadow-sm">
          <Minus className="h-4 w-4" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
