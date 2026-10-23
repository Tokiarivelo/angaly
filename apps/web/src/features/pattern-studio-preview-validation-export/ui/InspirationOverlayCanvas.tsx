'use client';

import React, { useEffect, useRef } from 'react';
import { FRONT_VISIBLE_SHARE, toPhoto, type Coverage, type GarmentMask, type GarmentProjection, type PhotoRect } from '../utils/garment3d/photo-frame';

interface InspirationOverlayCanvasProps {
  projection: GarmentProjection;
  rect: PhotoRect;
  /** Size of the photo as shown (CSS px), before zoom. */
  width: number;
  height: number;
  /** Zoom of the photo: the canvas is drawn sharper as it is enlarged. */
  zoom: number;
  selectedPieceId: string | null;
  /** All pieces drawn over the photo (the pattern laid on the model), at this opacity; 0 = only the selection. */
  piecesOpacity: number;
  coverage: Coverage | null;
  mask: GarmentMask | null;
}

/** A hue per piece, stable across renders (pieces next to each other differ). */
const hueOf = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 360;
  return (h * 137) % 360;
};

const SELECTED_FILL = 'rgba(255, 196, 92, 0.55)';
const SELECTED_GLOW = 'rgba(255, 196, 92, 0.95)';
const MISSING_FILL = 'rgba(232, 72, 60, 0.5)';

/** The pattern's pieces where they fall on the inspiration photo (see utils/garment3d/photo-frame.ts). */
export const InspirationOverlayCanvas: React.FC<InspirationOverlayCanvasProps> = ({
  projection,
  rect,
  width,
  height,
  zoom,
  selectedPieceId,
  piecesOpacity,
  coverage,
  mask,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ratio = (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1) * Math.min(2, Math.max(1, zoom));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // One path per piece: its triangles filled at once leave no seams between them.
    const pathOf = (tris: Float32Array): Path2D => {
      const path = new Path2D();
      for (let i = 0; i < tris.length; i += 6) {
        for (let k = 0; k < 3; k += 1) {
          const [x, y] = toPhoto(rect, tris[i + 2 * k]!, tris[i + 2 * k + 1]!);
          if (k === 0) path.moveTo(x * width, y * height);
          else path.lineTo(x * width, y * height);
        }
        path.closePath();
      }
      return path;
    };

    if (piecesOpacity > 0) {
      for (const s of projection.pieces.values()) {
        if (s.pieceId === selectedPieceId || s.front.length === 0) continue;
        ctx.fillStyle = `hsla(${hueOf(s.pieceId)}, 70%, 58%, ${0.45 * piecesOpacity})`;
        ctx.fill(pathOf(s.front));
      }
      // Parts of the model no piece covers: where the pattern misses something of the photo.
      if (coverage && mask) {
        ctx.fillStyle = MISSING_FILL;
        const cw = width / mask.width;
        const ch = height / mask.height;
        for (let c = 0; c < coverage.missing.length; c += 1) {
          if (!coverage.missing[c]) continue;
          ctx.fillRect((c % mask.width) * cw, Math.floor(c / mask.width) * ch, cw + 0.5, ch + 0.5);
        }
      }
    }

    const selected = selectedPieceId ? projection.pieces.get(selectedPieceId) : undefined;
    if (selected) {
      // A piece mostly behind the body (a back) is shown through the garment, hatched.
      const behind = selected.frontShare < FRONT_VISIBLE_SHARE;
      if (behind && selected.back.length > 0) {
        const tile = document.createElement('canvas');
        tile.width = 8;
        tile.height = 8;
        const t = tile.getContext('2d');
        if (t) {
          t.strokeStyle = SELECTED_GLOW;
          t.lineWidth = 2;
          t.beginPath();
          t.moveTo(0, 8);
          t.lineTo(8, 0);
          t.stroke();
          const pattern = ctx.createPattern(tile, 'repeat');
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fill(pathOf(selected.back));
          }
        }
      }
      if (selected.front.length > 0) {
        ctx.save();
        ctx.shadowColor = SELECTED_GLOW;
        ctx.shadowBlur = 10;
        ctx.fillStyle = SELECTED_FILL;
        ctx.fill(pathOf(selected.front));
        ctx.restore();
      }
    }
  }, [projection, rect, width, height, zoom, selectedPieceId, piecesOpacity, coverage, mask]);

  return <canvas ref={ref} aria-hidden="true" data-testid="inspiration-overlay" className="pointer-events-none absolute inset-0 h-full w-full" />;
};
