'use client';

import { Map as MapIcon, MapPin, Minus, Navigation, Plus } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

import { useGoogleMapsConfig } from '../hooks/useGoogleMapsConfig';
import { GoogleMapAteliersView } from './GoogleMapAteliersView';

/**
 * Editorial map pin positions illustrative of Madagascar geography:
 * Antananarivo Centre, Ivandry, Antsirabe, Toamasina
 */
const PIN_POSITIONS = [
  { top: '38%', left: '52%' }, // Antananarivo Centre
  { top: '34%', left: '56%' }, // Antananarivo Ivandry
  { top: '56%', left: '46%' }, // Antsirabe
  { top: '32%', left: '72%' }, // Toamasina
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
  const { apiKey, isConfigured, viewMode, setViewMode } = useGoogleMapsConfig();
  const isGoogleMapsActive = isConfigured && viewMode === 'google-maps';

  return (
    <div className="relative h-[500px] w-full overflow-hidden border border-angaly-border bg-angaly-warm-ivory lg:h-auto lg:min-h-[700px] lg:w-1/2">
      {/* Mode Switcher / Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {isConfigured ? (
          <div className="flex overflow-hidden rounded-xs border border-angaly-border bg-white/95 shadow-xs backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setViewMode('google-maps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'google-maps'
                  ? 'bg-angaly-navy text-white'
                  : 'text-angaly-navy hover:bg-angaly-ivory'
              }`}
            >
              <Navigation className="h-3 w-3" />
              Google Maps
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editorial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'editorial'
                  ? 'bg-angaly-navy text-white'
                  : 'text-angaly-navy hover:bg-angaly-ivory'
              }`}
            >
              <MapIcon className="h-3 w-3" />
              Plan Éditorial
            </button>
          </div>
        ) : (
          <div
            title="Google Maps interactif disponible avec NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
            className="flex items-center gap-1.5 border border-angaly-border/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-angaly-warm-gray shadow-xs backdrop-blur-xs"
          >
            <MapIcon className="h-3 w-3 text-angaly-gold" />
            Plan Maison
          </div>
        )}
      </div>

      {isGoogleMapsActive ? (
        <GoogleMapAteliersView
          apiKey={apiKey}
          ateliers={ateliers}
          activeSlug={activeSlug}
          onHoverChange={onHoverChange}
        />
      ) : (
        <>
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
            <div className="flex h-10 w-10 items-center justify-center border border-angaly-border bg-white text-angaly-navy shadow-xs">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex h-10 w-10 items-center justify-center border border-angaly-border bg-white text-angaly-navy shadow-xs">
              <Minus className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

