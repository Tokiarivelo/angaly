import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';

// three.js/WebGL cannot run in jsdom: the viewer is replaced by a probe that exposes its props.
const viewerBehaviour = { shouldThrow: false };

vi.mock('next/dynamic', () => ({
  default: () =>
    function ViewerProbe(props: {
      assembly: number;
      showMannequin: boolean;
      transparent: boolean;
      viewRequest: { view: string; nonce: number } | null;
      onContextLost?: () => void;
    }) {
      if (viewerBehaviour.shouldThrow) throw new Error('Error creating WebGL context.');
      return (
        <div
          data-testid="viewer-probe"
          data-assembly={props.assembly}
          data-mannequin={String(props.showMannequin)}
          data-transparent={String(props.transparent)}
          data-view={props.viewRequest?.view ?? ''}
          data-nonce={props.viewRequest?.nonce ?? 0}
        >
          <button type="button" onClick={() => props.onContextLost?.()}>
            lose-context
          </button>
        </div>
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

describe('Garment3DPanel', () => {
  beforeEach(() => {
    viewerBehaviour.shouldThrow = false;
    // three.js logs the error it throws; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
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

  it('explains when no piece can be placed on the mannequin (no outline at all)', () => {
    render(
      <Garment3DPanel
        pieces={[piece('x', 'Ceinture', [[0, 0], [0, 0]], 1)]}
        garmentType="ROBE"
        measurements={measurements}
        selectedPieceId={null}
      />,
    );
    expect(screen.getByTestId('garment-3d-unsupported')).toBeInTheDocument();
  });

  it('shows any garment: pieces without front/back are wrapped around the body, with a note', () => {
    render(
      <Garment3DPanel
        pieces={[piece('l', 'Lamba', [[0, 0], [1800, 0], [1800, 1100], [0, 1100]], 1)]}
        garmentType="AUTRE"
        measurements={measurements}
        selectedPieceId={null}
      />,
    );
    expect(screen.queryByTestId('garment-3d-unsupported')).not.toBeInTheDocument();
    expect(screen.getByText(/enroulée autour du corps/)).toBeInTheDocument();
  });

  it('offers several morphologies, starting from the one closest to the measurements', async () => {
    const user = userEvent.setup();
    render(
      <Garment3DPanel
        pieces={pieces}
        garmentType="JUPE"
        measurements={{ TOUR_POITRINE: 97, TOUR_TAILLE: 69, TOUR_BASSIN: 99 }}
        selectedPieceId={null}
      />,
    );
    const select = screen.getByLabelText('Morphologie du mannequin') as HTMLSelectElement;
    expect(select.value).toBe('FEMME_SABLIER');
    expect(select.options.length).toBeGreaterThanOrEqual(8);

    await user.selectOptions(select, 'HOMME_ATHLETIQUE');
    expect(select.value).toBe('HOMME_ATHLETIQUE');
  });

  it('does not probe WebGL with a throw-away canvas context (probes leak contexts)', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');
    expect(getContext).not.toHaveBeenCalled();
  });

  it('shows an actionable fallback when the 3D context cannot be created, and retries on demand', async () => {
    viewerBehaviour.shouldThrow = true;
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);

    const fallback = await screen.findByTestId('webgl-fallback');
    expect(fallback).toHaveTextContent('accélération matérielle');
    expect(fallback).toHaveTextContent('Error creating WebGL context.');
    expect(screen.queryByTestId('viewer-probe')).not.toBeInTheDocument();

    viewerBehaviour.shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByTestId('viewer-probe')).toBeInTheDocument();
  });

  it('recovers from a lost GPU context', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    fireEvent.click(await screen.findByRole('button', { name: 'lose-context' }));

    expect(screen.getByTestId('webgl-fallback')).toHaveTextContent('contexte graphique 3D a été perdu');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByTestId('viewer-probe')).toBeInTheDocument();
  });

  it('snaps to preset views from the buttons, re-applying the same view on every click', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');

    fireEvent.click(screen.getByRole('button', { name: 'Dessus' }));
    let probe = screen.getByTestId('viewer-probe');
    expect(probe.getAttribute('data-view')).toBe('top');
    const first = Number(probe.getAttribute('data-nonce'));

    fireEvent.click(screen.getByRole('button', { name: 'Dessus' }));
    probe = screen.getByTestId('viewer-probe');
    expect(Number(probe.getAttribute('data-nonce'))).toBe(first + 1);
  });

  it('supports Blender numpad shortcuts on the 3D stage', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');
    const stage = screen.getByTestId('garment-3d-stage');
    const view = () => screen.getByTestId('viewer-probe').getAttribute('data-view');

    fireEvent.keyDown(stage, { key: '3' });
    expect(view()).toBe('side');
    fireEvent.keyDown(stage, { key: '7' });
    expect(view()).toBe('top');
    fireEvent.keyDown(stage, { key: '1', ctrlKey: true });
    expect(view()).toBe('back');
    fireEvent.keyDown(stage, { key: '1' });
    expect(view()).toBe('front');
    fireEvent.keyDown(stage, { key: 'Home' });
    expect(view()).toBe('reset');
  });
});
