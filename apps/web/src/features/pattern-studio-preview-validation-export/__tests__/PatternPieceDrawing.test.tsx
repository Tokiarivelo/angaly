import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { PatternPieceCanvas } from '../ui/PatternPieceCanvas';

const noop = vi.fn();
const outline = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 240, y: 400 },
  { x: 0, y: 400 },
  { x: 0, y: 0 },
];

const buildPiece = (overrides: Partial<PatternPieceDto> = {}): PatternPieceDto => ({
  id: 'p1',
  versionId: 'v1',
  name: 'Corsage Devant',
  dimensionsJson: { outlineMm: outline },
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: { angleDegrees: 90, originX: 100, originY: 200 },
  seamAllowanceCm: 1,
  notchesJson: [{ positionAlongEdge: 0.5, edgeIndex: 1 }],
  ...overrides,
});

const renderCanvas = (piece: PatternPieceDto, viewMode: 'technical' | 'simplified' = 'technical') =>
  render(
    <PatternPieceCanvas
      piece={piece}
      zoomLevel={1}
      viewMode={viewMode}
      onZoomIn={noop}
      onZoomOut={noop}
      onResetZoom={noop}
      onToggleViewMode={noop}
    />,
  );

describe('PatternPieceCanvas — technical drawing', () => {
  it('draws a cutting line offset outside the sewing line when there is a seam allowance', () => {
    renderCanvas(buildPiece());

    const cut = screen.getByTestId('pattern-cut-line').getAttribute('points') ?? '';
    const sew = screen.getByTestId('pattern-sew-line').getAttribute('points') ?? '';
    expect(cut).not.toBe(sew);
    // The sewing line stays on the real outline (closing duplicate removed).
    expect(sew).toBe('0,0 200,0 240,400 0,400');
    const xs = cut.split(' ').map((p) => Number(p.split(',')[0]));
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(240);
  });

  it('omits the cutting line without a seam allowance', () => {
    renderCanvas(buildPiece({ seamAllowanceCm: 0 }));
    expect(screen.queryByTestId('pattern-cut-line')).not.toBeInTheDocument();
  });

  it('marks a single piece with a vertical edge on its left as cut on the fold', () => {
    renderCanvas(buildPiece({ quantity: 1 }));
    expect(screen.getByTestId('pattern-fold')).toBeInTheDocument();
    expect(screen.getByTestId('pattern-cut-instruction')).toHaveTextContent('Couper 1 fois, AU PLI');
  });

  it('tells how many times to cut a mirrored piece, with no fold mark', () => {
    renderCanvas(buildPiece({ quantity: 2 }));
    expect(screen.queryByTestId('pattern-fold')).not.toBeInTheDocument();
    expect(screen.getByTestId('pattern-cut-instruction')).toHaveTextContent('Couper 2 fois');
  });

  it('draws one notch tick per notch at its real position on the edge', () => {
    renderCanvas(buildPiece());
    const ticks = screen.getAllByTestId('pattern-notch');
    expect(ticks).toHaveLength(1);
    // edge 1 goes (200,0)→(240,400): halfway = (220,200)
    expect(Number(ticks[0]!.getAttribute('x1'))).toBeCloseTo(220);
    expect(Number(ticks[0]!.getAttribute('y1'))).toBeCloseTo(200);
  });

  it('centres the grainline on its origin', () => {
    renderCanvas(buildPiece());
    const line = screen.getByTestId('pattern-grainline').querySelector('line')!;
    const y1 = Number(line.getAttribute('y1'));
    const y2 = Number(line.getAttribute('y2'));
    expect((y1 + y2) / 2).toBeCloseTo(200);
    expect(line.getAttribute('x1')).toBe(line.getAttribute('x2'));
  });

  it('shows dimensions, edge lengths and a scale bar in technical mode only', () => {
    const { unmount } = renderCanvas(buildPiece(), 'technical');
    const dims = screen.getByTestId('pattern-dimensions');
    expect(dims).toHaveTextContent('Largeur 24 cm');
    expect(dims).toHaveTextContent('Hauteur 40 cm');
    expect(screen.getByTestId('pattern-edge-lengths')).toHaveTextContent('40 cm');
    expect(screen.getByTestId('pattern-scale-bar')).toHaveTextContent('Échelle 1:1');
    unmount();

    renderCanvas(buildPiece(), 'simplified');
    expect(screen.queryByTestId('pattern-dimensions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pattern-edge-lengths')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pattern-scale-bar')).not.toBeInTheDocument();
  });
});
