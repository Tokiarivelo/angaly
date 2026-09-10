/**
 * "Voir l'itinéraire": a plain Google Maps link from `latitude`/`longitude` when available,
 * falling back to an address search — no API key. Same implementation as
 * `atelier-detail`/`nos-ateliers-liste`'s own copy, kept feature-local per feature-sliced
 * isolation rather than a cross-feature import.
 */
export function buildDirectionsUrl(atelier: { latitude: number | null; longitude: number | null; address: string; city: string }): string {
  if (atelier.latitude !== null && atelier.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${atelier.latitude},${atelier.longitude}`;
  }
  const query = encodeURIComponent(`${atelier.address}, ${atelier.city}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
