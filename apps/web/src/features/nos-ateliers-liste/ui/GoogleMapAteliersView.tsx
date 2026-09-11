/// <reference types="@types/google.maps" />

'use client';

import { useEffect, useMemo } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import type { AtelierDto } from '@angaly/types';

import { buildDirectionsUrl } from '../utils/buildDirectionsUrl';

interface GoogleMapAteliersViewProps {
  apiKey: string;
  ateliers: AtelierDto[];
  activeSlug: string | null;
  onHoverChange: (slug: string | null) => void;
}

function MapCameraController({
  ateliers,
  activeSlug,
}: {
  ateliers: AtelierDto[];
  activeSlug: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (activeSlug) {
      const activeAtelier = ateliers.find((a) => a.slug === activeSlug);
      if (activeAtelier?.latitude != null && activeAtelier.longitude != null) {
        map.panTo({ lat: activeAtelier.latitude, lng: activeAtelier.longitude });
        map.setZoom(14);
        return;
      }
    }

    const geoAteliers = ateliers.filter(
      (a): a is AtelierDto & { latitude: number; longitude: number } =>
        a.latitude != null && a.longitude != null,
    );

    if (geoAteliers.length > 0 && typeof google !== 'undefined' && google.maps?.LatLngBounds) {
      const bounds = new google.maps.LatLngBounds();
      geoAteliers.forEach((a) => {
        bounds.extend({ lat: a.latitude, lng: a.longitude });
      });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [map, activeSlug, ateliers]);

  return null;
}

export function GoogleMapAteliersView({
  apiKey,
  ateliers,
  activeSlug,
  onHoverChange,
}: GoogleMapAteliersViewProps) {
  const geoAteliers = useMemo(
    () =>
      ateliers.filter(
        (a): a is AtelierDto & { latitude: number; longitude: number } =>
          a.latitude != null && a.longitude != null,
      ),
    [ateliers],
  );

  const activeAtelier = useMemo(
    () => geoAteliers.find((a) => a.slug === activeSlug) ?? null,
    [geoAteliers, activeSlug],
  );

  return (
    <div className="relative h-full w-full min-h-[500px]">
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <Map
          id="ateliers-google-map"
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
          style={{ width: '100%', height: '100%', minHeight: '500px' }}
          defaultCenter={{ lat: -18.8827, lng: 47.5177 }}
          defaultZoom={7}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          <MapCameraController ateliers={geoAteliers} activeSlug={activeSlug} />

          {geoAteliers.map((atelier) => {
            const isActive = activeSlug === atelier.slug;
            return (
              <AdvancedMarker
                key={atelier.id}
                position={{ lat: atelier.latitude, lng: atelier.longitude }}
                onClick={() => onHoverChange(isActive ? null : atelier.slug)}
                onMouseEnter={() => onHoverChange(atelier.slug)}
                title={atelier.name}
              >
                <Pin
                  background={isActive ? '#c5a880' : '#1e3a5f'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={isActive ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {activeAtelier && (
            <InfoWindow
              position={{ lat: activeAtelier.latitude, lng: activeAtelier.longitude }}
              onCloseClick={() => onHoverChange(null)}
              headerContent={
                <span className="font-heading text-sm font-semibold text-angaly-navy">
                  {activeAtelier.name}
                </span>
              }
            >
              <div className="flex max-w-xs flex-col gap-2 p-1 text-xs text-angaly-slate">
                <p>
                  {activeAtelier.address}, {activeAtelier.city}
                </p>
                {activeAtelier.phone && (
                  <p className="font-medium text-angaly-navy">Tél : {activeAtelier.phone}</p>
                )}
                {activeAtelier.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeAtelier.services.slice(0, 3).map((service) => (
                      <span
                        key={service}
                        className="rounded border border-angaly-border/60 bg-angaly-ivory px-1.5 py-0.5 text-[10px] text-angaly-warm-gray"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href={buildDirectionsUrl(activeAtelier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-angaly-navy px-3 py-1.5 text-xs text-white transition-colors hover:bg-angaly-champagne"
                  >
                    Itinéraire Google Maps
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
