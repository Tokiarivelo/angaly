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
      panMode?: boolean;
      viewRequest: { view: string; nonce: number } | null;
      onContextLost?: () => void;
      pose?: { leftArm: { bend: number; forward: number } };
      sculpt?: { radiusMm: number; propagate: boolean; onStart: (a: unknown[]) => boolean; onMove: (d: number[]) => void; onEnd: () => void } | null;
      edit?: {
        selection: ReadonlyMap<string, string | null>;
        modal: { kind: string } | null;
        onInstances: (i: unknown[]) => void;
        onSelect: (key: string | null, panelId: string | null, extend: boolean) => void;
        onTransform: (input: { world?: number[]; toCamera: number[] }) => void;
        onConfirm: () => void;
      } | null;
      studio?: { lighting: string; shadows: boolean; ao: boolean; tier: string };
    }) {
      if (viewerBehaviour.shouldThrow) throw new Error('Error creating WebGL context.');
      return (
        <div
          data-testid="viewer-probe"
          data-assembly={props.assembly}
          data-mannequin={String(props.showMannequin)}
          data-transparent={String(props.transparent)}
          data-pan={String(props.panMode)}
          data-view={props.viewRequest?.view ?? ''}
          data-nonce={props.viewRequest?.nonce ?? 0}
          data-elbow={props.pose?.leftArm.bend ?? ''}
          data-arm-forward={props.pose?.leftArm.forward ?? ''}
          data-sculpt={props.sculpt ? `${props.sculpt.radiusMm}|${String(props.sculpt.propagate)}` : ''}
          data-edit={props.edit ? [...props.edit.selection.keys()].join(',') : 'off'}
          data-modal={props.edit?.modal?.kind ?? ''}
          data-studio={props.studio ? `${props.studio.lighting}|${String(props.studio.shadows)}|${String(props.studio.ao)}|${props.studio.tier}` : ''}
        >
          {props.edit && (
            <>
              <button
                type="button"
                onClick={() =>
                  props.edit!.onInstances(
                    [0, 1, 2, 3, 4].map((index) => ({
                      key: `jd#${index}`,
                      pieceId: 'jd',
                      index,
                      panelId: 'skirt-front',
                      position: [0.1, 0.5, 0.1],
                      normal: [0, 0, 1],
                      anchor: { pieceId: 'jd', flat: { x: 0, y: 0 }, inverse: [1000, 0, 0, 0, -1000, 0], normal: [0, 0, 1], weight: 1 },
                    })),
                  )
                }
              >
                place-points
              </button>
              <button type="button" onClick={() => props.edit!.onSelect('jd#3', 'skirt-front', false)}>
                pick-hem
              </button>
              <button type="button" onClick={() => props.edit!.onTransform({ world: [0, -0.05, 0], toCamera: [0, 0, 1] })}>
                move-mouse
              </button>
              <button type="button" onClick={() => props.edit!.onConfirm()}>
                click-confirm
              </button>
            </>
          )}
          {props.sculpt && (
            <button
              type="button"
              onClick={() => {
                const s = props.sculpt!;
                s.onStart([{ pieceId: 'jd', flat: { x: 250, y: 600 }, inverse: [1000, 0, 0, 0, -1000, 0], normal: [0, 0, 1], weight: 1 }]);
                s.onMove([0, -0.04, 0]);
                s.onEnd();
              }}
            >
              drag-hem
            </button>
          )}
          <button type="button" onClick={() => props.onContextLost?.()}>
            lose-context
          </button>
        </div>
      );
    },
}));

import { Garment3DPanel } from '../ui/Garment3DPanel';
import { usePatternDraft } from '../hooks/usePatternDraft';
import { pieceOutline } from '../utils/pattern-editing';
import { withQueryClient } from '@/lib/test-utils';

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

  it('hands the studio settings chosen in « Réglages du rendu » to the viewer', async () => {
    window.localStorage.removeItem('angaly.studio3d.settings');
    const user = userEvent.setup();
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    const probe = await screen.findByTestId('viewer-probe');
    expect(probe.getAttribute('data-studio')).toMatch(/^studio\|true\|true\|/);

    await user.click(screen.getByRole('button', { name: 'Réglages du rendu' }));
    await user.click(screen.getByRole('button', { name: 'Contraste' }));
    await user.click(screen.getByRole('switch', { name: 'Ombres' }));
    await user.click(screen.getByRole('button', { name: 'Basse' }));
    expect(screen.getByTestId('viewer-probe').getAttribute('data-studio')).toBe('contrast|false|true|low');
    window.localStorage.removeItem('angaly.studio3d.settings');
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

  it('toggles full screen with the button and leaves it with Escape', async () => {
    const user = userEvent.setup();
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    const panel = await screen.findByTestId('garment-3d-panel');
    expect(panel).toHaveAttribute('data-fullscreen', 'false');
    await user.click(screen.getByRole('button', { name: 'Plein écran' }));
    expect(panel).toHaveAttribute('data-fullscreen', 'true');
    expect(screen.getByRole('button', { name: 'Main' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(panel).toHaveAttribute('data-fullscreen', 'false');
  });

  it('has a hand tool that switches the left button from orbiting to moving the scene', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    const hand = await screen.findByRole('button', { name: 'Main' });
    expect(hand).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('viewer-probe').dataset['pan']).toBe('false');
    await userEvent.click(hand);
    expect(hand).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('viewer-probe').dataset['pan']).toBe('true');
  });

  it('poses the mannequin from a preset or joint by joint, to compare with the photo', async () => {
    const user = userEvent.setup();
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    const probe = await screen.findByTestId('viewer-probe');
    expect(probe).toHaveAttribute('data-elbow', '0');
    await user.selectOptions(screen.getByLabelText('Pose du mannequin'), 'MIROIR');
    expect(probe).toHaveAttribute('data-elbow', '120');

    await user.click(screen.getByRole('button', { name: 'Articulations' }));
    const elbow = screen.getByLabelText('Bras gauche — Coude');
    fireEvent.change(elbow, { target: { value: '90' } });
    expect(probe).toHaveAttribute('data-elbow', '90');
    expect(screen.getByLabelText('Pose du mannequin')).toHaveValue('CUSTOM');
    // Legs have no rotation slider; every limb has its own group.
    expect(screen.getAllByRole('group').filter((g) => g.tagName === 'FIELDSET')).toHaveLength(4);
    expect(screen.queryByLabelText('Jambe gauche — Rotation')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remettre debout' }));
    expect(probe).toHaveAttribute('data-elbow', '0');
    expect(probe).toHaveAttribute('data-arm-forward', '0');
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
    fireEvent.keyDown(stage, { key: '5' });
    expect(view()).toBe('threeQuarter');
    fireEvent.keyDown(stage, { key: '2' });
    expect(view()).toBe('hem');
    fireEvent.keyDown(stage, { key: 'Home' });
    expect(view()).toBe('reset');
  });

  it('offers the 3/4 and hem close-up views', async () => {
    render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
    await screen.findByTestId('viewer-probe');
    const views = screen.getByRole('group', { name: 'Vues' });
    expect(Array.from(views.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Face', '3/4', 'Dos', 'Côté', 'Dessus', 'Ourlet', 'Recentrer']);
    fireEvent.click(screen.getByRole('button', { name: '3/4' }));
    expect(screen.getByTestId('viewer-probe').getAttribute('data-view')).toBe('threeQuarter');
    fireEvent.click(screen.getByRole('button', { name: 'Ourlet' }));
    expect(screen.getByTestId('viewer-probe').getAttribute('data-view')).toBe('hem');
  });

  describe('modelling the pattern on the garment', () => {
    const seen: { pieces: PatternPieceDto[] } = { pieces: [] };
    const Editable: React.FC = () => {
      const draft = usePatternDraft(pieces);
      seen.pieces = draft.pieces;
      return (
        <Garment3DPanel
          pieces={draft.pieces}
          garmentType="JUPE"
          measurements={measurements}
          selectedPieceId={null}
          editing={{ draft, projectId: 'proj', versionId: 'v' }}
        />
      );
    };
    const Wrapper = withQueryClient();

    it('is view-only without a draft', async () => {
      render(<Garment3DPanel pieces={pieces} garmentType="JUPE" measurements={measurements} selectedPieceId={null} />);
      await screen.findByTestId('viewer-probe');
      expect(screen.queryByTestId('sculpt-toolbar')).toBeNull();
    });

    it('hands the brush to the viewer and writes the drag into the shared draft (2D follows)', async () => {
      render(
        <Wrapper>
          <Editable />
        </Wrapper>,
      );
      const probe = await screen.findByTestId('viewer-probe');
      expect(probe.dataset['sculpt']).toBe('');
      fireEvent.click(screen.getByRole('radio', { name: /Sculpture/ }));
      expect(screen.getByTestId('viewer-probe').dataset['sculpt']).toBe('80|true');
      fireEvent.click(screen.getByRole('radio', { name: /Longueur/ }));
      fireEvent.click(screen.getByRole('button', { name: 'drag-hem' }));
      const hem = Math.max(...pieceOutline(seen.pieces.find((p) => p.id === 'jd')!).map((p) => p.y));
      expect(hem).toBeCloseTo(690);
      expect(screen.getByText(/Retouches non enregistrées/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(Math.max(...pieceOutline(seen.pieces.find((p) => p.id === 'jd')!).map((p) => p.y))).toBeCloseTo(650);
    });

    it('switches tools and brush size from the keyboard on the 3D stage', async () => {
      render(
        <Wrapper>
          <Editable />
        </Wrapper>,
      );
      await screen.findByTestId('viewer-probe');
      fireEvent.click(screen.getByRole('radio', { name: /Sculpture/ }));
      const stage = screen.getByTestId('garment-3d-stage');
      fireEvent.keyDown(stage, { key: 'w' });
      expect(screen.getByRole('radio', { name: /Ampleur/ })).toHaveAttribute('aria-checked', 'true');
      fireEvent.keyDown(stage, { key: ']' });
      expect(screen.getByTestId('viewer-probe').dataset['sculpt']).toBe('96|true');
      fireEvent.click(screen.getByRole('checkbox', { name: /Pièces voisines/ }));
      expect(screen.getByTestId('viewer-probe').dataset['sculpt']).toBe('96|false');
    });

    it('edit mode: picks a pattern point on the garment, grabs it (G) along an axis, the 2D outline following', async () => {
      render(
        <Wrapper>
          <Editable />
        </Wrapper>,
      );
      await screen.findByTestId('viewer-probe');
      expect(screen.getByTestId('viewer-probe').dataset['edit']).toBe('off');
      const stage = screen.getByTestId('garment-3d-stage');
      fireEvent.keyDown(stage, { key: 'Tab' });
      expect(screen.getByRole('radio', { name: /Édition/ })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('mesh-edit-toolbar')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'place-points' }));
      fireEvent.click(screen.getByRole('button', { name: 'pick-hem' }));
      expect(screen.getByTestId('viewer-probe').dataset['edit']).toBe('jd#3');
      expect(screen.getByTestId('mesh-edit-selection')).toHaveTextContent('1 point sélectionné');
      const before = pieceOutline(seen.pieces.find((p) => p.id === 'jd')!)[3]!;
      fireEvent.keyDown(stage, { key: 'g' });
      expect(screen.getByTestId('viewer-probe').dataset['modal']).toBe('grab');
      fireEvent.keyDown(stage, { key: 'y' });
      expect(screen.getByTestId('mesh-edit-modal')).toHaveTextContent('axe Y');
      fireEvent.click(screen.getByRole('button', { name: 'move-mouse' }));
      fireEvent.click(screen.getByRole('button', { name: 'click-confirm' }));
      const after = pieceOutline(seen.pieces.find((p) => p.id === 'jd')!)[3]!;
      expect(after.y - before.y).toBeCloseTo(50);
      expect(after.x).toBe(before.x);
      // Typed coordinates of the selection (Transformation panel).
      fireEvent.change(screen.getByLabelText('Médiane X (mm)'), { target: { value: '260' } });
      fireEvent.blur(screen.getByLabelText('Médiane X (mm)'));
      expect(pieceOutline(seen.pieces.find((p) => p.id === 'jd')!)[3]!.x).toBe(260);
      // X deletes the point; Tab leaves the edit mode.
      fireEvent.keyDown(stage, { key: 'x' });
      expect(pieceOutline(seen.pieces.find((p) => p.id === 'jd')!)).toHaveLength(4);
      fireEvent.keyDown(stage, { key: 'Tab' });
      expect(screen.getByTestId('viewer-probe').dataset['edit']).toBe('off');
    });
  });
});
