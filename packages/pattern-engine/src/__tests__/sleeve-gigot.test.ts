import { describe, it, expect } from 'vitest';
import { SLEEVE_CAP_SEGMENTS, sleevePiece } from '../shared/shapes';
import { resolveSleeve } from '../shared/cut-profile';
import { fitSleeve } from '../shared/fit';
import { hasSelfIntersection } from '../shared/geometry-checks';

const widthAt = (outline: Array<{ x: number; y: number }>, y: number): number => {
  const xs: number[] = [];
  for (let i = 0; i < outline.length - 1; i += 1) {
    const a = outline[i]!;
    const b = outline[i + 1]!;
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
  }
  return Math.max(...xs) - Math.min(...xs);
};

describe('sleevePiece — gigot (puffed) cut', () => {
  const puffed = { lengthMm: 480, cuffRatio: 0.7, topRatio: 1.9 };
  const plain = { lengthMm: 480, cuffRatio: 0.7, topRatio: 1 };

  it('keeps the volume on the upper arm and fits the forearm', () => {
    const outline = sleevePiece('Manche', 920, puffed).outlineMm;
    const top = widthAt(outline, 160);
    const elbow = widthAt(outline, 150 + 480 * 0.45);
    const cuff = widthAt(outline, 150 + 480);
    expect(top).toBeGreaterThan(elbow * 1.3);
    expect(elbow).toBeGreaterThan(cuff);
    expect(hasSelfIntersection(outline)).toBe(false);
  });

  it('a very full gigot (1890s) still closes on the arm at the elbow, its puff rounding in above it', () => {
    const full = { lengthMm: 555, cuffRatio: 0.7, topRatio: 1.35 * 2.5 };
    const outline = sleevePiece('Manche', 920, full).outlineMm;
    const top = widthAt(outline, 160);
    const elbow = widthAt(outline, 150 + 555 * 0.45);
    // Fitted: about the standard sleeve's width (920 / 3.2 × 1.15), not 60 % of a metre-wide puff.
    expect(elbow).toBeLessThan((920 / 3.2) * 1.15 + 5);
    expect(top).toBeGreaterThan(elbow * 2.5);
    // Rounded, not a straight cone from the belly to the elbow: halfway down it keeps more than the straight line.
    const belly = widthAt(outline, 150 + 555 * 0.28);
    expect(widthAt(outline, 150 + 555 * 0.37)).toBeGreaterThan((belly + elbow) / 2 + 20);
    expect(hasSelfIntersection(outline)).toBe(false);
  });

  it('a plain sleeve keeps its straight taper', () => {
    expect(sleevePiece('Manche', 920, plain).outlineMm).toHaveLength(SLEEVE_CAP_SEGMENTS * 2 + 1 + 3);
  });

  it('a short puff has no elbow (nothing to fit below it)', () => {
    expect(sleevePiece('Manche', 920, { ...puffed, lengthMm: 200 }).outlineMm).toHaveLength(
      SLEEVE_CAP_SEGMENTS * 2 + 1 + 3,
    );
  });
});

describe('sleeveOutline — cap curve', () => {
  const outline = sleevePiece('Manche', 920, { lengthMm: 200, cuffRatio: 0.9, topRatio: 1 }).outlineMm;
  const cap = outline.slice(0, SLEEVE_CAP_SEGMENTS * 2 + 1);

  it('rounds the head over the shoulder (no straight roof)', () => {
    const apex = cap.reduce((best, p) => (p.y < best.y ? p : best), cap[0]!);
    expect(apex.y).toBe(0);
    // The curve bulges above the chord between the underarm and the crown.
    const mid = cap[Math.floor(SLEEVE_CAP_SEGMENTS / 2)]!;
    const chordY = cap[0]!.y * (1 - mid.x / apex.x);
    expect(mid.y).toBeLessThan(chordY);
  });

  it('puts the crown a little towards the back and never self-crosses', () => {
    const apex = cap.reduce((best, p) => (p.y < best.y ? p : best), cap[0]!);
    expect(apex.x).toBeLessThan(cap[cap.length - 1]!.x / 2);
    expect(hasSelfIntersection(outline)).toBe(false);
  });
});

describe('sleeve families', () => {
  const spec = (manches: string) => resolveSleeve(manches, 590)!;
  const outline = (manches: string) => sleevePiece('Manche', 920, spec(manches)).outlineMm;
  const width = (o: Array<{ x: number; y: number }>, y: number) => widthAt(o, y);
  const kinds = ['EVEQUE', 'CLOCHE', 'LANTERNE', 'RAGLAN', 'KIMONO', 'CAP'];

  it.each(kinds)('%s resolves to a sleeve and a closed, non self-crossing outline', (manches) => {
    const o = outline(manches);
    expect(o.length).toBeGreaterThan(4);
    expect(o[0]).toEqual(o[o.length - 1]);
    expect(hasSelfIntersection(o)).toBe(false);
    expect(Math.min(...o.map((p) => p.y))).toBe(0);
  });

  it('bishop is full to just above the wrist, then drawn into a narrow cuff', () => {
    const o = outline('EVEQUE');
    const wrist = Math.max(...o.map((p) => p.y));
    expect(width(o, wrist * 0.8)).toBeGreaterThan(width(o, wrist - 1) * 1.6);
  });

  it('bell is fitted at the elbow and flares wider than the top at the hem', () => {
    const o = outline('CLOCHE');
    const top = width(o, 160);
    const wrist = Math.max(...o.map((p) => p.y));
    expect(width(o, wrist - 1)).toBeGreaterThan(top * 1.5);
    expect(width(o, 150 + 500 * 0.4)).toBeLessThan(top);
  });

  it('lantern billows between a gathered head and a gathered cuff', () => {
    const o = outline('LANTERNE');
    const wrist = Math.max(...o.map((p) => p.y));
    const belly = width(o, 150 + 430 * 0.45);
    expect(belly).toBeGreaterThan(width(o, 160) * 1.3);
    expect(belly).toBeGreaterThan(width(o, wrist - 1) * 1.5);
  });

  it('raglan has no round cap: its top edge is short and the seams run diagonally', () => {
    const o = outline('RAGLAN');
    expect(width(o, 1)).toBeLessThan(width(o, 100));
    expect(width(o, 100)).toBeLessThan(width(o, 215));
  });

  it('kimono continues the shoulder: a low slope, wider than a plain sleeve', () => {
    const o = outline('KIMONO');
    const plain = outline('LONGUES');
    expect(Math.max(...o.map((p) => p.x))).toBeGreaterThan(Math.max(...plain.map((p) => p.x)));
    expect(o[SLEEVE_CAP_SEGMENTS * 2]!.y).toBeLessThanOrEqual(60);
  });

  it('cap only covers the shoulder', () => {
    const o = outline('CAP');
    expect(Math.max(...o.map((p) => p.y)) - 150).toBeLessThanOrEqual(80);
  });

  it('fullness opens a bell at the cuff and a bishop at the head', () => {
    const bell = fitSleeve(spec('CLOCHE'), { fullness: { sleeve: 1.5 } })!;
    const bishop = fitSleeve(spec('EVEQUE'), { fullness: { sleeve: 1.5 } })!;
    expect(bell.cuffRatio).toBeCloseTo(2.1 * 1.5);
    expect(bell.topRatio).toBe(1);
    expect(bishop.topRatio).toBeCloseTo(1.15 * 1.5);
  });
});
