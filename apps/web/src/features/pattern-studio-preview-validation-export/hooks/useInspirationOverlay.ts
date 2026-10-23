'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { PatternPieceDto, Trim } from '@angaly/types';
import { buildGarmentModelCached } from '../utils/garment3d/model-cache';
import { suggestTemplate } from '../utils/garment3d/body-templates';
import {
  coverageOf,
  garmentMask,
  maskRect,
  MASK_SIZE,
  projectGarment,
  type Coverage,
  type GarmentMask,
  type GarmentProjection,
  type PhotoRect,
} from '../utils/garment3d/photo-frame';

export interface InspirationOverlayInput {
  projectId: string;
  url: string | null;
  pieces: PatternPieceDto[];
  garmentType: string;
  measurements: Record<string, number> | null | undefined;
  fabricColor?: string | null | undefined;
  fabricBehavior?: string | null | undefined;
  trims?: Trim[] | null | undefined;
  /** Off while the photo is not shown: nothing is draped or read. */
  enabled: boolean;
}

export interface InspirationOverlay {
  projection: GarmentProjection | null;
  /** The garment's box on the photo: set by hand, else found on the photo, else a default margin. */
  rect: PhotoRect;
  /** True when the box was set by hand (kept for this project and photo in this browser). */
  calibrated: boolean;
  /** Box found on the photo (null: the photo could not be read). */
  autoRect: PhotoRect | null;
  setRect: (rect: PhotoRect) => void;
  resetRect: () => void;
  coverage: Coverage | null;
  mask: GarmentMask | null;
}

/** Box used when the photo cannot be read (the garment usually fills the picture with a small margin). */
export const DEFAULT_PHOTO_RECT: PhotoRect = { x0: 0.08, y0: 0.06, x1: 0.92, y1: 0.97 };

const storageKey = (projectId: string, url: string) => `angaly.photoFrame.${projectId}.${url}`;

const readStored = (projectId: string, url: string | null): PhotoRect | null => {
  if (!url) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId, url));
    if (!raw) return null;
    const r = JSON.parse(raw) as Partial<PhotoRect>;
    return [r.x0, r.y0, r.x1, r.y1].every((n) => typeof n === 'number' && Number.isFinite(n)) ? (r as PhotoRect) : null;
  } catch {
    return null;
  }
};

/** Reads a small copy of the photo (MinIO answers with CORS headers; a tainted canvas throws and is skipped). */
const readPhoto = (url: string): Promise<{ rgba: Uint8ClampedArray; width: number; height: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = MASK_SIZE / Math.max(img.naturalWidth, img.naturalHeight, 1);
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ rgba: ctx.getImageData(0, 0, width, height).data, width, height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

/**
 * The pattern laid over the inspiration photo: the draped garment seen from the front (shared with the 3D view through
 * the model cache), the garment's box on the photo, and the parts of the photo no piece covers.
 */
export const useInspirationOverlay = ({
  projectId,
  url,
  pieces,
  garmentType,
  measurements,
  fabricColor,
  fabricBehavior,
  trims,
  enabled,
}: InspirationOverlayInput): InspirationOverlay => {
  // The drape lags behind the drawing while it is being edited (it is the costly part).
  const deferredPieces = useDeferredValue(pieces);
  const projection = useMemo(() => {
    if (!enabled) return null;
    // Same inputs as the 3D view's first drape: the cache hands back its model.
    const built = buildGarmentModelCached(deferredPieces, garmentType, measurements, suggestTemplate(measurements), fabricBehavior, trims);
    return built.ok ? projectGarment(built.model.panels) : null;
  }, [enabled, deferredPieces, garmentType, measurements, fabricBehavior, trims]);

  const [mask, setMask] = useState<GarmentMask | null>(null);
  useEffect(() => {
    setMask(null);
    if (!enabled || !url) return;
    let alive = true;
    void readPhoto(url).then((photo) => {
      if (alive && photo) setMask(garmentMask(photo.rgba, photo.width, photo.height, fabricColor));
    });
    return () => {
      alive = false;
    };
  }, [enabled, url, fabricColor]);
  const autoRect = useMemo(() => (mask ? maskRect(mask) : null), [mask]);

  const [stored, setStored] = useState<PhotoRect | null>(null);
  useEffect(() => setStored(readStored(projectId, url)), [projectId, url]);
  const setRect = useCallback(
    (rect: PhotoRect) => {
      setStored(rect);
      if (!url) return;
      try {
        window.localStorage.setItem(storageKey(projectId, url), JSON.stringify(rect));
      } catch {
        // Private window / blocked storage: the box holds for this visit only.
      }
    },
    [projectId, url],
  );
  const resetRect = useCallback(() => {
    setStored(null);
    if (!url) return;
    try {
      window.localStorage.removeItem(storageKey(projectId, url));
    } catch {
      // Nothing stored.
    }
  }, [projectId, url]);

  const rect = stored ?? autoRect ?? DEFAULT_PHOTO_RECT;
  const deferredRect = useDeferredValue(rect);
  const coverage = useMemo(
    () => (projection && mask ? coverageOf(projection, deferredRect, mask) : null),
    [projection, mask, deferredRect],
  );

  return { projection, rect, calibrated: stored !== null, autoRect, setRect, resetRect, coverage, mask };
};
