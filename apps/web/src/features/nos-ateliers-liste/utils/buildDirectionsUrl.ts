/**
 * "Itinéraire" (docs/pages/nos-ateliers-liste.md "Points d'attention"): a plain Google Maps
 * link built from `latitude`/`longitude` when available, falling back to an address search —
 * no API key, no backend logic, purely a front-end link.
 */
export function buildDirectionsUrl(atelier: {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
}): string {
  if (atelier.latitude !== null && atelier.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${atelier.latitude},${atelier.longitude}`;
  }
  const query = encodeURIComponent(`${atelier.address}, ${atelier.city}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
