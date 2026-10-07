import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { PatternLayoutOverview } from '../ui/PatternLayoutOverview';
import { PreviewModeTabs } from '../ui/PreviewModeTabs';

const piece = (id: string, name: string, w: number, h: number, quantity = 1): PatternPieceDto => ({
  id,
  versionId: 'v',
  name,
  dimensionsJson: {
    outlineMm: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
      { x: 0, y: 0 },
    ],
  },
  fabricRecommendation: null,
  quantity,
  grainlineJson: null,
  seamAllowanceCm: 1,
  notchesJson: [],
});

describe('PatternLayoutOverview', () => {
  const pieces = [piece('a', 'Devant', 300, 600), piece('b', 'Dos', 280, 600, 2)];

  it('lists every piece with its quantity and size at a shared scale', () => {
    render(<PatternLayoutOverview pieces={pieces} selectedPieceId={null} onSelectPiece={vi.fn()} />);

    expect(screen.getAllByTestId('overview-piece')).toHaveLength(2);
    expect(screen.getByText('Devant')).toBeInTheDocument();
    expect(screen.getByText('Dos')).toBeInTheDocument();
    expect(screen.getByText(/×1 · 32 cm × 62 cm/)).toBeInTheDocument();
    expect(screen.getByText(/×2 · 30 cm × 62 cm/)).toBeInTheDocument();
    expect(screen.getByText(/2 pièces/)).toBeInTheDocument();
  });

  it('sums the cut surface using each piece quantity', () => {
    render(<PatternLayoutOverview pieces={pieces} selectedPieceId={null} onSelectPiece={vi.fn()} />);
    // 300×600 + 2×(280×600) = 516 000 mm² = 0,52 m²
    expect(screen.getByText(/0,52 m²/)).toBeInTheDocument();
  });

  it('selects a piece on click and marks the selection', () => {
    const onSelect = vi.fn();
    render(<PatternLayoutOverview pieces={pieces} selectedPieceId="b" onSelectPiece={onSelect} />);

    const [first, second] = screen.getAllByTestId('overview-piece');
    expect(second!.getAttribute('data-selected')).toBe('true');
    fireEvent.click(first!);
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('shows a message when no piece has a drawable outline', () => {
    render(
      <PatternLayoutOverview
        pieces={[{ ...piece('x', 'Vide', 1, 1), dimensionsJson: {} }]}
        selectedPieceId={null}
        onSelectPiece={vi.fn()}
      />,
    );
    expect(screen.getByText(/Aucune pièce avec un tracé/)).toBeInTheDocument();
  });
});

describe('PreviewModeTabs', () => {
  it('exposes the three previews as tabs and reports the choice', () => {
    const onChange = vi.fn();
    render(<PreviewModeTabs mode="piece" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: /Pièce/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /3D sur mannequin/ }));
    expect(onChange).toHaveBeenCalledWith('3d');
    fireEvent.click(screen.getByRole('tab', { name: /Ensemble/ }));
    expect(onChange).toHaveBeenCalledWith('overview');
  });
});
