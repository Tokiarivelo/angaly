'use client';

import { useState } from 'react';

export type AteliersMapViewMode = 'google-maps' | 'editorial';

export function useGoogleMapsConfig() {
  const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
  const isConfigured = apiKey.length > 0;
  const [viewMode, setViewMode] = useState<AteliersMapViewMode>(
    isConfigured ? 'google-maps' : 'editorial',
  );

  return {
    apiKey,
    isConfigured,
    viewMode,
    setViewMode,
  };
}
