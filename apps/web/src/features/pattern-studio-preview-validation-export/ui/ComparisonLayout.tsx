import React, { useLayoutEffect, useRef, useState } from 'react';
import type { PhotoRect } from '../utils/garment3d/photo-frame';
import type { ScreenRect } from './Garment3DViewer';

export interface ComparisonOverlay {
  url: string;
  opacity: number;
  /** The garment's box on the photo and on the 3D canvas: the photo is scaled and moved so that they match. */
  photoRect?: PhotoRect | null | undefined;
  target?: ScreenRect | null | undefined;
}

interface ComparisonLayoutProps {
  primary: React.ReactNode;
  /** Shown beside the primary view; null = no comparison. */
  secondary: React.ReactNode | null;
  /** When set, the photo is laid over the primary view instead of beside it. */
  overlay?: ComparisonOverlay | null | undefined;
}

/**
 * Where the photo goes so that its garment box covers the 3D garment's: same height, centred on it (the photo keeps its
 * proportions; a body narrower or wider than the model shows as a difference, not as a stretched photo).
 */
export const alignPhoto = (
  photoRect: PhotoRect,
  target: ScreenRect,
  aspect: number,
): { left: number; top: number; width: number; height: number } => {
  const height = (target.bottom - target.top) / Math.max(1e-6, photoRect.y1 - photoRect.y0);
  const width = height * aspect;
  return {
    left: (target.left + target.right) / 2 - ((photoRect.x0 + photoRect.x1) / 2) * width,
    top: target.top - photoRect.y0 * height,
    width,
    height,
  };
};

/** Primary view + optional comparison pane (side by side on desktop, stacked on small screens). */
export const ComparisonLayout: React.FC<ComparisonLayoutProps> = ({ primary, secondary, overlay }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [canvasBox, setCanvasBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const target = overlay?.target;
  // The canvas's place in this container (unchanged by scrolling): the reported box is relative to the canvas.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = container?.querySelector('canvas');
    if (!container || !canvas || !target) {
      setCanvasBox(null);
      return;
    }
    const a = container.getBoundingClientRect();
    const b = canvas.getBoundingClientRect();
    setCanvasBox({ x: b.left - a.left, y: b.top - a.top, width: b.width, height: b.height });
  }, [target]);

  if (overlay) {
    const placed = overlay.photoRect && target && aspect && canvasBox ? alignPhoto(overlay.photoRect, target, aspect) : null;
    return (
      <div ref={containerRef} className="relative flex min-w-0 flex-1 flex-col" data-testid="comparison-overlay">
        {primary}
        {placed && canvasBox ? (
          // Clipped to the 3D canvas: the photo stays over the garment, not over the controls below it.
          <div
            className="pointer-events-none absolute overflow-hidden"
            style={{ left: canvasBox.x, top: canvasBox.y, width: canvasBox.width, height: canvasBox.height }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- MinIO URLs: arbitrary host. */}
            <img
              src={overlay.url}
              alt=""
              aria-hidden="true"
              draggable={false}
              data-testid="comparison-overlay-image"
              data-aligned="true"
              className="absolute max-w-none"
              style={{ opacity: overlay.opacity, left: placed.left, top: placed.top, width: placed.width, height: placed.height }}
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- MinIO URLs: arbitrary host.
          <img
            src={overlay.url}
            alt=""
            aria-hidden="true"
            draggable={false}
            data-testid="comparison-overlay-image"
            data-aligned="false"
            onLoad={(e) => setAspect(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            style={{ opacity: overlay.opacity }}
          />
        )}
      </div>
    );
  }
  if (!secondary) return <>{primary}</>;
  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2" data-testid="comparison-split">
      <div className="flex min-w-0 flex-col">{primary}</div>
      <div className="flex min-w-0 flex-col">{secondary}</div>
    </div>
  );
};
