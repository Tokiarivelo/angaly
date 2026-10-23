import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { DEFAULT_CANVAS_SIZE, StudioCanvas, type StudioCanvasProps } from '../ui/studio/StudioCanvas';
import { fitViewport } from '../utils/studio-viewport';
import { getBounds } from '../utils/pattern-geometry';
import { pieceOutline } from '../utils/pattern-editing';
import type { StudioTool } from '../ui/studio/studio.types';

const outline = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 300 },
  { x: 0, y: 300 },
];

const piece: PatternPieceDto = {
  id: 'p1',
  versionId: 'v1',
  name: 'Devant',
  dimensionsJson: { widthMm: 200, heightMm: 300, outlineMm: outline },
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: { angleDegrees: 90, originX: 100, originY: 150 },
  seamAllowanceCm: 0,
  notchesJson: [],
};

// The canvas fits the piece on mount; jsdom has no layout so it uses DEFAULT_CANVAS_SIZE.
const vp = fitViewport(getBounds(outline), DEFAULT_CANVAS_SIZE);
const toScreen = (x: number, y: number) => ({
  clientX: (x - vp.cx) / vp.mmPerPx + DEFAULT_CANVAS_SIZE.width / 2,
  clientY: (y - vp.cy) / vp.mmPerPx + DEFAULT_CANVAS_SIZE.height / 2,
});

const setup = (tool: StudioTool, overrides: Partial<StudioCanvasProps> = {}) => {
  const props: StudioCanvasProps = {
    piece,
    tool,
    snapMm: 0,
    showGrid: true,
    showLengths: true,
    selectedPoint: null,
    highlightEdge: null,
    fitRequest: 0,
    onSelectPoint: vi.fn(),
    onCommitPiece: vi.fn(),
    onCreatePiece: vi.fn(),
    ...overrides,
  };
  render(<StudioCanvas {...props} />);
  return { props, svg: screen.getByTestId('studio-svg') };
};

const click = (svg: Element, x: number, y: number, init: Record<string, unknown> = {}) => {
  const at = toScreen(x, y);
  fireEvent.pointerDown(svg, { ...at, pointerId: 1, button: 0, ...init });
  fireEvent.pointerUp(svg, { ...at, pointerId: 1, button: 0, ...init });
};

const lastCommit = (props: StudioCanvasProps): PatternPieceDto => {
  const fn = vi.mocked(props.onCommitPiece).mock.calls.at(-1)![0];
  return fn(piece);
};

describe('StudioCanvas', () => {
  it('renders the piece with its handles, grainline and edge lengths', () => {
    setup('select');
    expect(screen.getByTestId('studio-sew-line')).toBeInTheDocument();
    expect(screen.getByTestId('studio-grainline')).toBeInTheDocument();
    expect(screen.getByTestId('studio-handles').querySelectorAll('circle')).toHaveLength(4);
    expect(screen.getAllByText('20 cm').some((el) => el.tagName.toLowerCase() === 'text')).toBe(true);
    expect(screen.getAllByText('30 cm').some((el) => el.tagName.toLowerCase() === 'text')).toBe(true);
  });

  it('shows an empty board without a piece', () => {
    setup('select', { piece: null });
    expect(screen.queryByTestId('studio-piece')).not.toBeInTheDocument();
  });

  it('drags a vertex and commits ONE undo step on release', () => {
    const { props, svg } = setup('select');
    const from = toScreen(200, 0);
    const to = toScreen(260, -40);
    fireEvent.pointerDown(svg, { ...from, pointerId: 1, button: 0 });
    fireEvent.pointerMove(svg, { ...toScreen(230, -20), pointerId: 1 });
    fireEvent.pointerMove(svg, { ...to, pointerId: 1 });
    expect(props.onCommitPiece).not.toHaveBeenCalled();
    fireEvent.pointerUp(svg, { ...to, pointerId: 1 });

    expect(props.onSelectPoint).toHaveBeenCalledWith(1);
    expect(props.onCommitPiece).toHaveBeenCalledTimes(1);
    const moved = pieceOutline(lastCommit(props));
    expect(moved[1]!.x).toBeCloseTo(260, 0);
    expect(moved[1]!.y).toBeCloseTo(-40, 0);
    expect(moved).toHaveLength(4);
  });

  it('snaps a dragged vertex to the grid', () => {
    const { props, svg } = setup('select', { snapMm: 10 });
    fireEvent.pointerDown(svg, { ...toScreen(200, 300), pointerId: 1, button: 0 });
    fireEvent.pointerMove(svg, { ...toScreen(213, 297), pointerId: 1 });
    fireEvent.pointerUp(svg, { ...toScreen(213, 297), pointerId: 1 });
    const moved = pieceOutline(lastCommit(props));
    expect(moved[2]).toEqual({ x: 210, y: 300 });
  });

  it('moves the whole piece (and its grainline) when dragging the body', () => {
    const { props, svg } = setup('select');
    fireEvent.pointerDown(svg, { ...toScreen(100, 150), pointerId: 1, button: 0 });
    fireEvent.pointerMove(svg, { ...toScreen(150, 190), pointerId: 1 });
    fireEvent.pointerUp(svg, { ...toScreen(150, 190), pointerId: 1 });
    const moved = lastCommit(props);
    expect(pieceOutline(moved)[0]!.x).toBeCloseTo(50, 0);
    expect(pieceOutline(moved)[0]!.y).toBeCloseTo(40, 0);
    expect(moved.grainlineJson?.originX).toBeCloseTo(150, 0);
  });

  it('does not commit when the pointer never moved (a plain click)', () => {
    const { props, svg } = setup('select');
    click(svg, 200, 0);
    expect(props.onCommitPiece).not.toHaveBeenCalled();
    expect(props.onSelectPoint).toHaveBeenCalledWith(1);
  });

  it('adds a point on the clicked edge', () => {
    const { props, svg } = setup('add');
    click(svg, 100, 2);
    const next = pieceOutline(lastCommit(props));
    expect(next).toHaveLength(5);
    expect(next[1]!.x).toBeCloseTo(100, 0);
    expect(props.onSelectPoint).toHaveBeenCalledWith(1);
  });

  it('ignores a click far from every edge in add mode', () => {
    const { props, svg } = setup('add');
    click(svg, 100, 150);
    expect(props.onCommitPiece).not.toHaveBeenCalled();
  });

  it('removes a clicked point but never below three', () => {
    const { props, svg } = setup('remove');
    click(svg, 200, 300);
    expect(pieceOutline(lastCommit(props))).toHaveLength(3);
  });

  it('toggles a notch on the clicked edge', () => {
    const { props, svg } = setup('notch');
    click(svg, 100, 0);
    expect(lastCommit(props).notchesJson).toEqual([{ edgeIndex: 0, positionAlongEdge: 0.5 }]);
  });

  it('draws a new piece from clicks, closed with Enter', () => {
    const { props, svg } = setup('draw');
    click(svg, 400, 0);
    click(svg, 600, 0);
    click(svg, 500, 200);
    expect(screen.getByTestId('studio-drawing')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByTestId('studio-canvas'), { key: 'Enter' });
    expect(props.onCreatePiece).toHaveBeenCalledWith([
      expect.objectContaining({ x: expect.closeTo(400, 0) }),
      expect.objectContaining({ x: expect.closeTo(600, 0) }),
      expect.objectContaining({ x: expect.closeTo(500, 0) }),
    ]);
    expect(screen.queryByTestId('studio-drawing')).not.toBeInTheDocument();
  });

  it('closes the drawing by clicking the first point, and cancels with Escape', () => {
    const { props, svg } = setup('draw');
    click(svg, 400, 0);
    click(svg, 600, 0);
    click(svg, 500, 200);
    click(svg, 400, 0);
    expect(props.onCreatePiece).toHaveBeenCalledTimes(1);

    click(svg, 400, 0);
    click(svg, 500, 0);
    fireEvent.keyDown(screen.getByTestId('studio-canvas'), { key: 'Escape' });
    expect(screen.queryByTestId('studio-drawing')).not.toBeInTheDocument();
    expect(props.onCreatePiece).toHaveBeenCalledTimes(1);
  });

  it('measures the distance between two clicks', () => {
    const { svg } = setup('measure');
    click(svg, 0, 0);
    click(svg, 0, 300);
    expect(screen.getByTestId('studio-ruler')).toHaveTextContent('30 cm');
  });

  it('draws the grainline by dragging', () => {
    const { props, svg } = setup('grain');
    fireEvent.pointerDown(svg, { ...toScreen(100, 150), pointerId: 1, button: 0 });
    fireEvent.pointerMove(svg, { ...toScreen(200, 150), pointerId: 1 });
    fireEvent.pointerUp(svg, { ...toScreen(200, 150), pointerId: 1 });
    expect(lastCommit(props).grainlineJson).toMatchObject({ angleDegrees: 0, originX: 100, originY: 150 });
  });

  it('pans with the hand tool without editing the piece', () => {
    const { props, svg } = setup('pan');
    const before = screen.getByTestId('studio-readout').textContent;
    fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(svg, { clientX: 160, clientY: 130, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 160, clientY: 130, pointerId: 1 });
    expect(props.onCommitPiece).not.toHaveBeenCalled();
    expect(svg.getAttribute('viewBox')).not.toBeNull();
    expect(screen.getByTestId('studio-readout').textContent).toContain('%');
    expect(before).toContain('%');
  });

  it('zooms with the wheel', () => {
    const { svg } = setup('select');
    const before = svg.getAttribute('viewBox');
    fireEvent.wheel(svg, { deltaY: -300, clientX: 400, clientY: 260 });
    expect(svg.getAttribute('viewBox')).not.toBe(before);
  });

  it('highlights an edge and shows the selected point larger', () => {
    setup('select', { highlightEdge: 1, selectedPoint: 2 });
    const radii = [...screen.getByTestId('studio-handles').querySelectorAll('circle')].map((c) => Number(c.getAttribute('r')));
    expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii));
  });
});
