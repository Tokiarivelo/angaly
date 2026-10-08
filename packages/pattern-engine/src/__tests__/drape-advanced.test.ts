import { describe, it, expect } from 'vitest';
import { PatternEngine } from '../pattern-engine';
import { JupeRule } from '../rules/jupe.rule';
import { RobeRule } from '../rules/robe.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import {
  TRAIN_ARC_SEGMENTS,
  applyAsymmetricHem,
  applyDrapedBodice,
  computeOverskirt,
  computeTrain,
  resolveDrape,
} from '../blocks';
import { hasSelfIntersection } from '../shared/geometry-checks';
import type { DrapeBlock, GarmentType, PatternParameters, PatternPieceGeometry } from '../types';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const engine = () => {
  const e = new PatternEngine();
  [JupeRule, RobeRule, RobeMarieeRule].forEach((r) => e.registerRule(r));
  return e;
};
const gen = (garmentType: GarmentType, blocks: DrapeBlock[], extra: Partial<PatternParameters> = {}, m = M) =>
  engine().generate({ garmentType, cutType: 'DROITE', style: null, details: {}, drape: { blocks }, ...extra }, m);

const box = (p: PatternPieceGeometry) => {
  const xs = p.outlineMm.map((q) => q.x);
  const ys = p.outlineMm.map((q) => q.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};
const closed = (p: PatternPieceGeometry) =>
  p.outlineMm[0]!.x === p.outlineMm.at(-1)!.x && p.outlineMm[0]!.y === p.outlineMm.at(-1)!.y;
const find = (pieces: PatternPieceGeometry[], start: string) => pieces.find((p) => p.name.startsWith(start));

describe('train', () => {
  it('is a symmetric half-ellipse hanging from its attachment edge', () => {
    const t = computeTrain(800, 600);
    expect(closed(t)).toBe(true);
    expect(hasSelfIntersection(t.outlineMm)).toBe(false);
    expect(t.outlineMm.length).toBe(TRAIN_ARC_SEGMENTS + 2);
    const b = box(t);
    expect(b.maxX - b.minX).toBe(800);
    expect(b.maxY).toBe(600); // the lowest point reaches the requested length
    // symmetric about the vertical axis at x = 400
    const arc = t.outlineMm.slice(2, -1);
    for (let i = 0; i < arc.length; i++) {
      const mirror = arc[arc.length - 1 - i]!;
      expect(Math.abs(arc[i]!.x + mirror.x - 800)).toBeLessThanOrEqual(2);
      expect(Math.abs(arc[i]!.y - mirror.y)).toBeLessThanOrEqual(2);
    }
  });

  it('a longer train is deeper, a wider attachment is wider', () => {
    expect(box(computeTrain(800, 900)).maxY).toBeGreaterThan(box(computeTrain(800, 400)).maxY);
    expect(box(computeTrain(1000, 500)).maxX).toBeGreaterThan(box(computeTrain(700, 500)).maxX);
  });

  it('ROBE_MARIEE: a TRAIN block sets the built-in train length (no extra piece)', () => {
    const short = gen('ROBE_MARIEE', [{ kind: 'TRAIN', lengthMm: 300 }]);
    const long = gen('ROBE_MARIEE', [{ kind: 'TRAIN', lengthMm: 1100 }]);
    const back = (r: typeof short) => box(find(r.pieces, 'Jupe Dos avec Traîne')!).maxY;
    expect(back(long)).toBeGreaterThan(back(short));
    expect(find(long.pieces, 'Traîne (demi-ellipse)')).toBeUndefined();
  });

  it('ROBE_MARIEE with a skirt block: the TRAIN block comes back as its own piece and the warning shortens', () => {
    const r = gen('ROBE_MARIEE', [{ kind: 'GATHERED_SKIRT', fullness: 2 }, { kind: 'TRAIN', lengthMm: 800 }]);
    expect(find(r.pieces, 'Traîne (demi-ellipse)')).toBeDefined();
    expect(r.warnings.some((w) => w.includes('jupon'))).toBe(true);
    expect(r.warnings.some((w) => w.includes('traîne et le jupon'))).toBe(false);
  });

  it('ROBE and JUPE get a separate train piece', () => {
    for (const g of ['ROBE', 'JUPE'] as GarmentType[]) {
      const r = gen(g, [{ kind: 'TRAIN', lengthMm: 500 }]);
      const t = find(r.pieces, 'Traîne')!;
      expect(t).toBeDefined();
      expect(box(t).maxY).toBe(500);
    }
  });
});

describe('overskirt', () => {
  it('is a closed asymmetric panel whose longer corner follows the side', () => {
    const left = computeOverskirt(780, 700, 80, 'LEFT');
    const right = computeOverskirt(780, 700, 80, 'RIGHT');
    expect(closed(left)).toBe(true);
    expect(hasSelfIntersection(left.outlineMm)).toBe(false);
    expect(box(left).maxY).toBe(560); // 80 % of 700
    const hem = (p: PatternPieceGeometry) => ({ right: p.outlineMm[2]!.y, left: p.outlineMm[3]!.y });
    expect(hem(left).left).toBeGreaterThan(hem(left).right);
    expect(hem(right).right).toBeGreaterThan(hem(right).left);
    expect(left.name).toContain('gauche');
    expect(right.name).toContain('droite');
  });

  it('grows with the waist and the length percentage', () => {
    expect(box(computeOverskirt(900, 700, 80, 'LEFT')).maxX).toBeGreaterThan(box(computeOverskirt(700, 700, 80, 'LEFT')).maxX);
    expect(box(computeOverskirt(780, 700, 100, 'LEFT')).maxY).toBeGreaterThan(box(computeOverskirt(780, 700, 60, 'LEFT')).maxY);
  });

  it('is added to JUPE, ROBE and ROBE_MARIEE', () => {
    for (const g of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      expect(find(gen(g, [{ kind: 'OVERSKIRT', lengthPct: 80, side: 'LEFT' }]).pieces, 'Surjupe asymétrique')).toBeDefined();
    }
  });
});

describe('draped bodice', () => {
  const front: PatternPieceGeometry = {
    name: 'Corsage',
    fabricRecommendation: null,
    quantity: 1,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: 100, originY: 200 },
    notches: [],
    outlineMm: [
      { x: 0, y: 0 },
      { x: 200, y: 50 },
      { x: 200, y: 400 },
      { x: 0, y: 400 },
      { x: 0, y: 0 },
    ],
  };

  it('widens the side seam by the pleats and marks every pleat', () => {
    const d = applyDrapedBodice(front, 6, 'LEFT');
    expect(box(d).maxX).toBe(200 + 6 * 18);
    expect(d.notches).toHaveLength(6);
    expect(d.notches.every((n) => n.edgeIndex === 1)).toBe(true);
    expect(d.name).toContain('plis à gauche');
    expect(closed(d)).toBe(true);
    expect(hasSelfIntersection(d.outlineMm)).toBe(false);
    expect(box(front).maxX).toBe(200); // original untouched
  });

  it('more pleats make a wider bodice (ROBE and ROBE_MARIEE)', () => {
    const w = (g: GarmentType, pleats: number, name: string) =>
      box(find(gen(g, [{ kind: 'DRAPED_BODICE', pleats, side: 'RIGHT' }]).pieces, name)!).maxX;
    expect(w('ROBE', 8, 'Corsage Devant')).toBeGreaterThan(w('ROBE', 3, 'Corsage Devant'));
    expect(w('ROBE_MARIEE', 8, 'Bustier Devant')).toBeGreaterThan(w('ROBE_MARIEE', 3, 'Bustier Devant'));
  });

  it('combines with a wrap front (both pieces get the pleats)', () => {
    const r = gen('ROBE', [{ kind: 'WRAP_FRONT', overlapMm: 90, side: 'LEFT' }, { kind: 'DRAPED_BODICE', pleats: 5, side: 'LEFT' }]);
    const fronts = r.pieces.filter((p) => p.name.startsWith('Corsage Devant'));
    expect(fronts).toHaveLength(2);
    expect(fronts.every((p) => p.name.includes('drapé'))).toBe(true);
  });
});

describe('asymmetric hem', () => {
  const panel: PatternPieceGeometry = {
    name: 'Jupe',
    fabricRecommendation: null,
    quantity: 1,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: 200, originY: 300 },
    notches: [],
    outlineMm: [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 600 },
      { x: 0, y: 600 },
      { x: 0, y: 0 },
    ],
  };

  it('lengthens the side by the drop, growing from the centre edge', () => {
    const a = applyAsymmetricHem(panel, 200);
    expect(a.outlineMm[2]).toEqual({ x: 400, y: 800 });
    expect(a.outlineMm[3]).toEqual({ x: 0, y: 600 });
    expect(a.outlineMm[1]).toEqual({ x: 400, y: 0 }); // waist untouched
    expect(hasSelfIntersection(a.outlineMm)).toBe(false);
    expect(a.name).toContain('ourlet asymétrique');
  });

  it('applies to skirt panels of each rule and ignores circle skirts with a warning', () => {
    const len = (g: GarmentType, extra: DrapeBlock[] = []) =>
      box(find(gen(g, [{ kind: 'ASYMMETRIC_HEM', dropMm: 250, side: 'LEFT' }, ...extra]).pieces, g === 'JUPE' ? 'Devant' : 'Jupe')!).maxY;
    const base = (g: GarmentType) => box(find(gen(g, []).pieces, g === 'JUPE' ? 'Devant' : 'Jupe')!).maxY;
    for (const g of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      expect(len(g)).toBeGreaterThan(base(g));
    }
    const circle = gen('ROBE', [{ kind: 'CIRCLE_SKIRT', fraction: 0.5 }, { kind: 'ASYMMETRIC_HEM', dropMm: 250, side: 'LEFT' }]);
    expect(circle.warnings.some((w) => w.includes('Ourlet asymétrique ignoré'))).toBe(true);
    expect(find(circle.pieces, 'Jupe demi-cercle')!.name).not.toContain('asymétrique');
  });
});

describe('lot 2 in combination', () => {
  it('resolveDrape keeps one block per new family', () => {
    const r = resolveDrape({
      drape: {
        blocks: [
          { kind: 'TRAIN', lengthMm: 500 },
          { kind: 'OVERSKIRT', lengthPct: 80, side: 'LEFT' },
          { kind: 'DRAPED_BODICE', pleats: 4, side: 'RIGHT' },
          { kind: 'ASYMMETRIC_HEM', dropMm: 200, side: 'LEFT' },
        ],
      },
    });
    expect(Object.keys(r).sort()).toEqual(['bodice', 'hem', 'overskirt', 'train']);
  });

  it('every garment × lot-2 combination stays closed, finite and non-crossing', () => {
    const blocks: DrapeBlock[] = [
      { kind: 'DRAPED_BODICE', pleats: 12, side: 'LEFT' },
      { kind: 'ASYMMETRIC_HEM', dropMm: 500, side: 'RIGHT' },
      { kind: 'OVERSKIRT', lengthPct: 100, side: 'LEFT' },
      { kind: 'TRAIN', lengthMm: 1200 },
    ];
    for (const garment of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      for (const skirt of [undefined, { kind: 'GATHERED_SKIRT', fullness: 3 } as DrapeBlock, { kind: 'PLEATED_SKIRT', pleats: 30, depthMm: 40, type: 'BOX' } as DrapeBlock]) {
        const r = gen(garment, [...(skirt ? [skirt] : []), ...blocks.slice(0, garment === 'JUPE' ? 4 : 4)].slice(0, 5));
        for (const p of r.pieces) {
          expect(closed(p), `${garment}/${p.name}`).toBe(true);
          expect(p.outlineMm.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y))).toBe(true);
          expect(hasSelfIntersection(p.outlineMm), `${garment}/${skirt?.kind}/${p.name}`).toBe(false);
        }
      }
    }
  });

  it('no drape keeps the historical pieces (regression)', () => {
    for (const g of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      expect(gen(g, []).pieces).toEqual(engine().generate({ garmentType: g, cutType: 'DROITE', style: null, details: {} }, M).pieces);
    }
  });
});

describe('balloon and butterfly sleeves are tuned by fullness.sleeve, not by a block', () => {
  it('fullness.sleeve widens a BALLON and a PAPILLON sleeve', () => {
    for (const manches of ['BALLON', 'PAPILLON']) {
      const w = (sleeve: number) => {
        const r = engine().generate(
          { garmentType: 'ROBE', cutType: 'DROITE', style: null, details: { manches }, fullness: { sleeve } },
          { ...M, LONGUEUR_BRAS: 60 },
        );
        const b = box(find(r.pieces, 'Manche')!);
        return b.maxX - b.minX;
      };
      expect(w(2)).toBeGreaterThan(w(1));
    }
  });
});
