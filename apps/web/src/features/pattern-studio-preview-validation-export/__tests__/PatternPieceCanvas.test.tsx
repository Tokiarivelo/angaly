import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';

import { PatternPieceCanvas } from '../ui/PatternPieceCanvas';

const noop = vi.fn();

const buildPiece = (overrides: Partial<PatternPieceDto> = {}): PatternPieceDto => ({
  id: 'p-1',
  versionId: 'v-1',
  name: 'Manche',
  dimensionsJson: {
    outlineMm: [
      { x: 0, y: 150 },
      { x: 160, y: 0 },
      { x: 320, y: 150 },
      { x: 400, y: 0 },
      { x: 390, y: 90 },
    ],
  },
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: null,
  seamAllowanceCm: 1.5,
  notchesJson: [],
  ...overrides,
});

describe('PatternPieceCanvas', () => {
  it('fits the SVG viewBox to a real piece far larger than the legacy fixed canvas, so nothing is clipped', () => {
    const { container } = render(
      <PatternPieceCanvas
        piece={buildPiece()}
        zoomLevel={1}
        viewMode="technical"
        onZoomIn={noop}
        onZoomOut={noop}
        onResetZoom={noop}
        onToggleViewMode={noop}
      />,
    );

    const svg = container.querySelector('svg[data-testid="pattern-piece-svg"]');
    expect(svg).toBeTruthy();
    const parts = (svg?.getAttribute('viewBox') ?? '').split(' ').map(Number);
    const minX = parts[0] ?? 0;
    const minY = parts[1] ?? 0;
    const width = parts[2] ?? 0;
    const height = parts[3] ?? 0;

    // The outline reaches x=400 / y=150, which the old hardcoded
    // "0 0 240 280" viewBox would have clipped.
    expect(width).toBeGreaterThan(240);
    expect(minX).toBeLessThanOrEqual(0);
    expect(minX + width).toBeGreaterThanOrEqual(400);
    expect(minY).toBeLessThanOrEqual(0);
    expect(minY + height).toBeGreaterThanOrEqual(150);
  });

  it('keeps the same viewBox at every zoom level — zoom only scales, it never re-clips the pattern', () => {
    const piece = buildPiece();

    const { container: containerZoomedOut } = render(
      <PatternPieceCanvas
        piece={piece}
        zoomLevel={0.5}
        viewMode="technical"
        onZoomIn={noop}
        onZoomOut={noop}
        onResetZoom={noop}
        onToggleViewMode={noop}
      />,
    );
    const { container: containerZoomedIn } = render(
      <PatternPieceCanvas
        piece={piece}
        zoomLevel={2.5}
        viewMode="technical"
        onZoomIn={noop}
        onZoomOut={noop}
        onResetZoom={noop}
        onToggleViewMode={noop}
      />,
    );

    const viewBoxOut = containerZoomedOut
      .querySelector('svg[data-testid="pattern-piece-svg"]')
      ?.getAttribute('viewBox');
    const viewBoxIn = containerZoomedIn
      .querySelector('svg[data-testid="pattern-piece-svg"]')
      ?.getAttribute('viewBox');

    expect(viewBoxOut).toBe(viewBoxIn);
  });

  it('renders the piece name and current zoom percentage', () => {
    render(
      <PatternPieceCanvas
        piece={buildPiece({ name: '02. Demi-Dos (×2)' })}
        zoomLevel={1.25}
        viewMode="simplified"
        onZoomIn={noop}
        onZoomOut={noop}
        onResetZoom={noop}
        onToggleViewMode={noop}
      />,
    );

    expect(screen.getByText('02. Demi-Dos (×2)')).toBeInTheDocument();
    expect(screen.getByText(/Zoom : 125%/)).toBeInTheDocument();
  });

  it('shows a placeholder message when no piece is selected', () => {
    render(
      <PatternPieceCanvas
        piece={null}
        zoomLevel={1}
        viewMode="technical"
        onZoomIn={noop}
        onZoomOut={noop}
        onResetZoom={noop}
        onToggleViewMode={noop}
      />,
    );

    expect(screen.getByText(/Sélectionnez une pièce technique/)).toBeInTheDocument();
  });
});
