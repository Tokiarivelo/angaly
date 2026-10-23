import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { collarKindOf } from '../utils/garment3d/collar-model';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

type Outline = Array<{ x: number; y: number }>;
const closed = (pts: Array<[number, number]>): Outline => [...pts, pts[0]!].map(([x, y]) => ({ x, y }));
const piece = (id: string, name: string, outlineMm: Outline, quantity = 1): PatternPieceDto =>
  ({ id, versionId: 'v', name, dimensionsJson: { outlineMm }, fabricRecommendation: null, quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto;

const MEASUREMENTS = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42, TOUR_COU: 36 };
const bodice = [
  piece('cd', 'Corsage Devant', closed([[0, 0], [80, 0], [240, 50], [240, 242], [195, 440], [0, 440]])),
  piece('cdos', 'Corsage Dos', closed([[0, 0], [75, 0], [210, 45], [210, 220], [165, 400], [0, 400]]), 2),
];
const collar = (name: string, w: number, h: number) => piece('col', name, closed([[0, 0], [w, 0], [w - 10, h], [10, h]]), 2);

describe('collarKindOf', () => {
  it.each([
    ['Col officier', 'BAND'],
    ['Col Tailleur', 'BAND'],
    ['Col & Pied de col', 'SHIRT'],
    ['Col chemise & pied de col', 'SHIRT'],
    ['Col châle', 'SHAWL'],
    ['Col lavallière', 'TIE'],
  ])('%s → %s', (name, kind) => expect(collarKindOf(name)).toBe(kind));

  it('leaves other pieces and the bias cowl alone', () => {
    expect(collarKindOf('Manche')).toBeNull();
    expect(collarKindOf('Corsage Devant')).toBeNull();
    expect(collarKindOf('Col bénitier (taillé dans le biais)')).toBeNull();
  });
});

describe('3D collars', () => {
  const build = (name: string, w: number, h: number) => {
    const built = buildGarmentModel([...bodice, collar(name, w, h)], 'ROBE', MEASUREMENTS);
    if (!built.ok) throw new Error('model not built');
    return built.model;
  };
  const box = (positions: Float32Array) => {
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) for (let k = 0; k < 3; k += 1) {
      lo[k] = Math.min(lo[k]!, positions[i + k]!);
      hi[k] = Math.max(hi[k]!, positions[i + k]!);
    }
    return { lo, hi };
  };

  it('no longer lists a collar among the pieces left off the mannequin', () => {
    expect(build('Col officier', 380, 45).ignored).not.toContain('Col officier');
  });

  it('a band collar is one ring round the neck', () => {
    const panels = build('Col officier', 380, 45).panels.filter((p) => p.zone === 'collar');
    expect(panels).toHaveLength(1);
    const { lo, hi } = box(panels[0]!.positions);
    expect(hi[1]! - lo[1]!).toBeGreaterThan(0.03);
    // The band (its upper half) is a ring round the neck; its foot below spreads to the bodice's neckline.
    const p = panels[0]!.positions;
    const mid = (lo[1]! + hi[1]!) / 2;
    const band = Float32Array.from(Array.from({ length: p.length / 3 }, (_, i) => i).filter((i) => p[i * 3 + 1]! >= mid).flatMap((i) => [p[i * 3]!, p[i * 3 + 1]!, p[i * 3 + 2]!]));
    const b = box(band);
    expect(b.hi[0]! - b.lo[0]!).toBeGreaterThan(0.08);
    expect(b.hi[0]! - b.lo[0]!).toBeLessThan(0.16);
  });

  it('a shawl collar gives two lapels that fall down the chest, mirrored', () => {
    const model = build('Col châle', 760, 130);
    const panels = model.panels.filter((p) => p.zone === 'collar');
    expect(panels).toHaveLength(2);
    const [left, right] = panels.map((p) => box(p.positions));
    expect(left!.hi[0]!).toBeGreaterThan(0);
    expect(right!.lo[0]!).toBeLessThan(0);
    // It reaches well below the neck.
    expect(left!.hi[1]! - left!.lo[1]!).toBeGreaterThan(0.15);
  });

  it('a shawl collar folds over at the back of the neck instead of standing up behind the head like a hood', () => {
    const model = build('Col châle', 760, 130);
    const top = Math.max(...model.panels.filter((p) => p.zone === 'collar').map((p) => box(p.positions).hi[1]!));
    const nape = Math.max(...model.panels.filter((p) => p.zone === 'bodice').map((p) => box(p.positions).hi[1]!));
    // At most a stand's height above the neckline (3 cm), not half of the 13 cm piece.
    expect(top - nape).toBeLessThan(0.045);
  });

  it('a shirt collar turns down over its stand and lies on the shoulders, pointed at the front', () => {
    const panels = build('Col chemise & pied de col', 380, 70).panels.filter((p) => p.zone === 'collar');
    expect(panels).toHaveLength(2);
    const { lo, hi } = box(panels[0]!.positions);
    // It spreads out past the neck onto the shoulders and falls below the stand's base.
    expect(hi[0]! - lo[0]!).toBeGreaterThan(0.08);
    expect(hi[1]! - lo[1]!).toBeGreaterThan(0.06);
  });
});
