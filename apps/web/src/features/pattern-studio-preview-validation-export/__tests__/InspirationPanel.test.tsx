import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspirationPanel } from '../ui/InspirationPanel';
import type { InspirationOverlay } from '../hooks/useInspirationOverlay';
import type { GarmentProjection, PhotoRect } from '../utils/garment3d/photo-frame';
import { alignPhoto } from '../ui/ComparisonLayout';

// Two pieces: a front bodice over the top half of the frame, a back seen only from behind.
const square = (v0: number, v1: number) => Float32Array.from([0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1]);
const projection: GarmentProjection = {
  frame: { minX: -0.4, maxX: 0.4, top: 1.4, bottom: 0 },
  pieces: new Map([
    ['front', { pieceId: 'front', front: square(0, 0.5), back: new Float32Array(), frontShare: 1, area: 0.5 }],
    ['skirt', { pieceId: 'skirt', front: square(0.5, 1), back: new Float32Array(), frontShare: 1, area: 0.5 }],
    ['back', { pieceId: 'back', front: new Float32Array(), back: square(0, 0.5), frontShare: 0, area: 0 }],
  ]),
};
const names = { front: 'Bustier Devant', skirt: 'Jupe Devant (lé froncé)', back: 'Bustier Dos', inside: 'Ceinture intérieure' };

const overlayData = (over: Partial<InspirationOverlay> = {}): InspirationOverlay => ({
  projection,
  rect: { x0: 0, y0: 0, x1: 1, y1: 1 },
  calibrated: false,
  autoRect: { x0: 0, y0: 0, x1: 1, y1: 1 },
  setRect: vi.fn(),
  resetRect: vi.fn(),
  coverage: { covered: 0.92, missing: new Uint8Array(4) },
  mask: { width: 2, height: 2, cells: new Uint8Array(4) },
  ...over,
});

const setup = (selectedPieceId: string | null, data = overlayData()) => {
  const onSelectPiece = vi.fn();
  render(<InspirationPanel url="https://cdn/x.jpg" overlay={{ data, selectedPieceId, pieceNames: names, onSelectPiece }} />);
  const img = screen.getByAltText('Modèle d’inspiration du client');
  Object.defineProperty(img, 'naturalWidth', { value: 400 });
  Object.defineProperty(img, 'naturalHeight', { value: 800 });
  fireEvent.load(img);
  return { onSelectPiece, data };
};

describe('InspirationPanel — the pattern laid over the model', () => {
  beforeEach(() => {
    // jsdom lays nothing out: the stage is a 200 × 400 box at the page's corner.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 400, right: 200, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
  });
  afterEach(() => vi.restoreAllMocks());

  it('lights up the selected piece and says where it is seen', () => {
    setup('front');
    expect(screen.getByTestId('inspiration-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('inspiration-caption')).toHaveTextContent('Bustier Devant — visible de face');
    expect(screen.getByTestId('inspiration-caption')).toHaveTextContent('Modèle couvert par le patron : 92 %');
  });

  it('says when the piece is at the back, or sewn inside', () => {
    setup('back');
    expect(screen.getByTestId('inspiration-caption')).toHaveTextContent('au dos');
  });

  it('says when the piece is not draped (inside the garment)', () => {
    setup('inside');
    expect(screen.getByTestId('inspiration-caption')).toHaveTextContent('pièce intérieure ou non drapée');
  });

  it('picks the piece under a click on the photo', () => {
    const { onSelectPiece } = setup(null);
    const frame = screen.getByTestId('inspiration-stage').parentElement!;
    fireEvent.pointerDown(frame, { clientX: 100, clientY: 300 });
    fireEvent.pointerUp(frame, { clientX: 100, clientY: 300 });
    expect(onSelectPiece).toHaveBeenCalledWith('skirt');
    fireEvent.pointerDown(frame, { clientX: 100, clientY: 50 });
    fireEvent.pointerUp(frame, { clientX: 101, clientY: 51 });
    expect(onSelectPiece).toHaveBeenLastCalledWith('front');
  });

  it('moves and stretches the garment box by hand (« Caler »), and resets it to the one read on the photo', async () => {
    const { data } = setup('front', overlayData({ calibrated: true }));
    await userEvent.click(screen.getByRole('button', { name: 'Caler le patron sur le modèle' }));
    const box = screen.getByTestId('inspiration-calibration');
    const frame = screen.getByTestId('inspiration-stage').parentElement!;
    act(() => {
      fireEvent.pointerDown(box, { clientX: 100, clientY: 200 });
    });
    fireEvent.pointerMove(frame, { clientX: 120, clientY: 200 });
    // Moved by 20 px of a 200 px wide photo: a tenth — the box already fills it, so it stays inside.
    const moved = (data.setRect as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as PhotoRect;
    expect(moved.x1).toBeLessThanOrEqual(1);
    fireEvent.pointerUp(frame, { clientX: 120, clientY: 200 });
    await userEvent.click(screen.getByRole('button', { name: 'Recaler automatiquement' }));
    expect(data.resetRect).toHaveBeenCalled();
  });

  it('hides the other pieces on demand (the selection stays lit)', async () => {
    setup('front');
    await userEvent.click(screen.getByRole('button', { name: 'Superposer le patron sur le modèle' }));
    expect(screen.queryByRole('slider', { name: 'Opacité du patron' })).not.toBeInTheDocument();
    expect(screen.getByTestId('inspiration-overlay')).toBeInTheDocument();
  });
});

describe('alignPhoto — the photo laid over the 3D garment', () => {
  it('matches the garment boxes in height and centres them', () => {
    const placed = alignPhoto({ x0: 0.2, y0: 0.1, x1: 0.8, y1: 0.9 }, { left: 100, right: 300, top: 50, bottom: 450 }, 0.8);
    expect(placed.height).toBeCloseTo(500);
    expect(placed.top + 0.1 * placed.height).toBeCloseTo(50);
    expect(placed.top + 0.9 * placed.height).toBeCloseTo(450);
    expect(placed.left + 0.5 * placed.width).toBeCloseTo(200);
  });
});
