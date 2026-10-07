import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';

// three.js/WebGL cannot run in jsdom: the viewer is replaced by a probe that exposes its props.
vi.mock('next/dynamic', () => ({
  default: () =>
    function ViewerProbe(props: { assembly: number; showMannequin: boolean; transparent: boolean }) {
      return (
        <div
          data-testid="viewer-probe"
          data-assembly={props.assembly}
          data-mannequin={String(props.showMannequin)}
          data-transparent={String(props.transparent)}
        />
      );
    },
}));

import { Garment3DPanel } from '../ui/Garment3DPanel';

const closed = (pts: Array<[number, number]>) => [...pts, pts[0]!].map(([x, y]) => ({ x, y }));
const piece = (id: string, name: string, pts: Array<[number, number]>, quantity: number): PatternPieceDto => ({
  id,
  versionId: 'v',
  name,
  dimensionsJson: { outlineMm: closed(pts) },
  fabricRecommendation: null,
  quantity,
  grainlineJson: null,
  seamAllowanceCm: 1,
  notchesJson: [],
});

const pieces = [
  piece('jd', 'Jupe Devant', [[0, 0], [195, 10], [250, 200], [250, 650], [0, 650]], 1),
  piece('jdos', 'Jupe Dos', [[0, 0], [165, 10], [225, 200], [225, 650], [0, 650]], 2),
];
const measurements = { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 };

const setWebGl = (available: boolean) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() =>
    available ? ({} as WebGL2RenderingContext) : null) as never);
};

describe('Garment3DPanel', () => {
  beforeEach(() => setWebGl(true));
  afterEach(() => vi.restoreAllMocks());

  it('renders the viewer assembled by default, with the fit report from the real pieces', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);

    const probe = await screen.findByTestId('viewer-probe');
    expect(probe.getAttribute('data-assembly')).toBe('1');
    expect(probe.getAttribute('data-mannequin')).toBe('true');
    expect(screen.getByTestId('garment-fit-report')).toHaveTextContent('Bassin');
  });

  it('lets the user explode the pieces with the slider and the Éclater button', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');

    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
    expect(screen.getByTestId('viewer-probe').getAttribute('data-assembly')).toBe('0.4');

    fireEvent.click(screen.getByRole('button', { name: /Éclater/ }));
    expect(screen.getByTestId('viewer-probe').getAttribute('data-assembly')).toBe('0');
  });

  it('toggles mannequin and transparency', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');

    fireEvent.click(screen.getByLabelText('Mannequin'));
    fireEvent.click(screen.getByLabelText('Transparence'));

    const probe = screen.getByTestId('viewer-probe');
    expect(probe.getAttribute('data-mannequin')).toBe('false');
    expect(probe.getAttribute('data-transparent')).toBe('true');
  });

  it('explains when the garment cannot be shown on the mannequin', () => {
    render(
      <Garment3DPanel
        pieces={[piece('x', 'Ceinture', [[0, 0], [700, 0], [700, 70], [0, 70]], 1)]}
        garmentType="ROBE"
        measurements={measurements}
        selectedPieceId={null}
      />,
    );
    expect(screen.getByTestId('garment-3d-unsupported')).toBeInTheDocument();
  });

  it('falls back gracefully when WebGL is unavailable', async () => {
    setWebGl(false);
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);

    await waitFor(() => expect(screen.getByText(/WebGL indisponible/)).toBeInTheDocument());
    expect(screen.queryByTestId('viewer-probe')).not.toBeInTheDocument();
  });
});
