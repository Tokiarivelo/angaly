import { describe, expect, it } from 'vitest';

import { buildDirectionsUrl } from '../utils/buildDirectionsUrl';

describe('buildDirectionsUrl', () => {
  it('builds a coordinate-based Google Maps link when lat/long are set', () => {
    const url = buildDirectionsUrl({
      latitude: -18.8827,
      longitude: 47.5177,
      address: "12 Rue de l'Artisanat",
      city: 'Antananarivo',
    });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-18.8827,47.5177');
  });

  it('falls back to an address search when lat/long are missing', () => {
    const url = buildDirectionsUrl({
      latitude: null,
      longitude: null,
      address: "12 Rue de l'Artisanat",
      city: 'Antananarivo',
    });
    expect(url).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("12 Rue de l'Artisanat, Antananarivo")}`,
    );
  });
});
