import { describe, it, expect } from 'vitest';
import { PatternEngine } from '../pattern-engine';
import { JupeRule } from '../rules/jupe.rule';
import { RobeRule } from '../rules/robe.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import {
  CIRCLE_ARC_SEGMENTS,
  buildSkirtBlock,
  computeCircleSkirt,
  computeCowlNeck,
  computeGatheredSkirt,
  computePleatedSkirt,
  applyWrapFront,
  resolveDrape,
} from '../blocks';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { estimateYardage } from '../shared/yardage';
import type { DrapeBlock, GarmentType, PatternParameters, PatternPieceGeometry } from '../types';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const engine = () => {
  const e = new PatternEngine();
  [JupeRule, RobeRule, RobeMarieeRule].forEach((r) => e.registerRule(r));
  return e;
};
const gen = (garmentType: GarmentType, blocks: DrapeBlock[], extra: Partial<PatternParameters> = {}) =>
  engine().generate({ garmentType, cutType: 'DROITE', style: null, details: {}, drape: { blocks }, ...extra }, M);

const bbox = (p: PatternPieceGeometry) => {
  const xs = p.outlineMm.map((q) => q.x);
  const ys = p.outlineMm.map((q) => q.y);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
const area = (p: PatternPieceGeometry) => {
  let sum = 0;
  for (let i = 0; i < p.outlineMm.length - 1; i++) {
    const a = p.outlineMm[i]!;
    const b = p.outlineMm[i + 1]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum / 2);
};
const closed = (p: PatternPieceGeometry) =>
  p.outlineMm[0]!.x === p.outlineMm.at(-1)!.x && p.outlineMm[0]!.y === p.outlineMm.at(-1)!.y;

describe('gathered skirt', () => {
  it('cuts waist × fullness in total, split on two panels, with quarter gather marks', () => {
    const [panel] = computeGatheredSkirt({ waistMm: 760, lengthMm: 600, fullness: 2 });
    expect(panel!.quantity).toBe(2);
    expect(bbox(panel!)).toEqual({ w: 760, h: 600 }); // (760 × 2) / 2 per panel
    expect(panel!.notches.map((n) => n.positionAlongEdge)).toEqual([0.25, 0.5, 0.75]);
    expect(closed(panel!)).toBe(true);
  });

  it('width grows with fullness', () => {
    const w = (f: number) => bbox(computeGatheredSkirt({ waistMm: 760, lengthMm: 600, fullness: f })[0]!).w;
    expect(w(1.5)).toBeLessThan(w(2));
    expect(w(2)).toBeLessThan(w(3));
  });
});

describe('pleated skirt', () => {
  it('adds the pleat depths to the waist (box pleats take twice as much)', () => {
    const knife = computePleatedSkirt({ waistMm: 760, lengthMm: 600, pleats: 20, depthMm: 30, type: 'KNIFE' })[0]!;
    const box = computePleatedSkirt({ waistMm: 760, lengthMm: 600, pleats: 20, depthMm: 30, type: 'BOX' })[0]!;
    expect(bbox(knife).w).toBe((760 + 20 * 30) / 2);
    expect(bbox(box).w).toBe((760 + 20 * 60) / 2);
    expect(knife.notches).toHaveLength(10);
    expect(knife.name).toMatch(/plats/);
    expect(box.name).toMatch(/creux/);
  });

  it('more pleats or deeper pleats make a wider panel', () => {
    const w = (pleats: number, depthMm: number) =>
      bbox(computePleatedSkirt({ waistMm: 760, lengthMm: 600, pleats, depthMm, type: 'KNIFE' })[0]!).w;
    expect(w(10, 30)).toBeLessThan(w(20, 30));
    expect(w(20, 30)).toBeLessThan(w(20, 50));
  });

  it('keeps at least one pleat mark per panel', () => {
    expect(computePleatedSkirt({ waistMm: 700, lengthMm: 500, pleats: 1, depthMm: 20, type: 'KNIFE' })[0]!.notches).toHaveLength(1);
  });
});

describe('circle skirt', () => {
  it.each([
    [1, 2, 1000],
    [0.5, 1, 1000],
    [0.25, 1, 1000],
  ] as Array<[0.25 | 0.5 | 1, number, number]>)('fraction %s: quantity %s, inner arc = waist, valid polygon', (fraction, quantity, length) => {
    const waist = 760;
    const [piece] = computeCircleSkirt({ waistMm: waist, lengthMm: length, fraction });
    expect(piece!.quantity).toBe(quantity);
    expect(closed(piece!)).toBe(true);
    // 65 samples per arc + closing point, well above the 64-point minimum
    expect(piece!.outlineMm.length).toBe(2 * (CIRCLE_ARC_SEGMENTS + 1) + 1);
    expect(hasSelfIntersection(piece!.outlineMm)).toBe(false);

    // Annular sector area = angle/2 × (R² − r²); the waist arc closes around the body.
    const rIn = waist / (2 * Math.PI * fraction);
    const rOut = rIn + length;
    const angle = fraction === 1 ? Math.PI : 2 * Math.PI * fraction;
    const expected = (angle / 2) * (rOut * rOut - rIn * rIn);
    expect(area(piece!)).toBeGreaterThan(expected * 0.99);
    expect(area(piece!)).toBeLessThan(expected * 1.01);
    expect(Math.min(...piece!.outlineMm.map((p) => p.x))).toBe(0);
    expect(Math.min(...piece!.outlineMm.map((p) => p.y))).toBe(0);
  });

  it('is symmetric about its axis', () => {
    const [piece] = computeCircleSkirt({ waistMm: 760, lengthMm: 600, fraction: 0.5 });
    const { w } = bbox(piece!);
    const inner = piece!.outlineMm.slice(0, CIRCLE_ARC_SEGMENTS + 1);
    for (let i = 0; i < inner.length; i++) {
      const mirror = inner[inner.length - 1 - i]!;
      expect(Math.abs(inner[i]!.x + mirror.x - w)).toBeLessThanOrEqual(2);
      expect(Math.abs(inner[i]!.y - mirror.y)).toBeLessThanOrEqual(2);
    }
  });

  it('a smaller fraction needs a smaller waist radius (longer inner arc spread over less angle)', () => {
    const innerRadius = (f: 0.25 | 0.5 | 1) => 760 / (2 * Math.PI * f);
    expect(innerRadius(0.25)).toBeGreaterThan(innerRadius(0.5));
    expect(innerRadius(0.5)).toBeGreaterThan(innerRadius(1));
  });
});

describe('wrap front', () => {
  const front: PatternPieceGeometry = {
    name: 'Devant',
    fabricRecommendation: null,
    quantity: 1,
    seamAllowanceMm: 10,
    grainline: { angleDegrees: 90, originX: 100, originY: 300 },
    notches: [],
    outlineMm: [
      { x: 0, y: 40 },
      { x: 100, y: 0 },
      { x: 200, y: 300 },
      { x: 0, y: 600 },
      { x: 0, y: 40 },
    ],
  };

  it('splits the front into an over-wrap extended by the overlap and a smaller under-wrap', () => {
    const [over, under] = applyWrapFront(front, 100, 'LEFT');
    expect(over!.name).toContain('dessus croisé (gauche sur droite)');
    expect(under!.name).toContain('dessous croisé');
    expect(Math.min(...over!.outlineMm.map((p) => p.x))).toBe(-100);
    expect(Math.min(...under!.outlineMm.map((p) => p.x))).toBe(-35);
    expect(over!.notches.length).toBeGreaterThan(0); // closure marks
    expect(closed(over!)).toBe(true);
    expect(hasSelfIntersection(over!.outlineMm)).toBe(false);
    expect(area(over!)).toBeGreaterThan(area(front));
    expect(applyWrapFront(front, 100, 'RIGHT')[0]!.name).toContain('droite sur gauche');
  });

  it('does not mutate the original piece', () => {
    const before = JSON.stringify(front);
    applyWrapFront(front, 120, 'RIGHT');
    expect(JSON.stringify(front)).toBe(before);
  });
});

describe('cowl neck', () => {
  it('is a bias-cut trapezoid whose bottom grows with the depth', () => {
    const shallow = computeCowlNeck(90, 100);
    const deep = computeCowlNeck(90, 250);
    expect(shallow.grainline.angleDegrees).toBe(45);
    expect(closed(shallow)).toBe(true);
    expect(hasSelfIntersection(shallow.outlineMm)).toBe(false);
    expect(bbox(deep).w).toBeGreaterThan(bbox(shallow).w);
    expect(bbox(deep).h).toBeGreaterThan(bbox(shallow).h);
  });
});

describe('resolveDrape / buildSkirtBlock', () => {
  it('keeps the first block of each family', () => {
    const r = resolveDrape({
      drape: {
        blocks: [
          { kind: 'WRAP_FRONT', overlapMm: 100, side: 'LEFT' },
          { kind: 'GATHERED_SKIRT', fullness: 2 },
          { kind: 'CIRCLE_SKIRT', fraction: 0.5 },
          { kind: 'COWL_NECK', depthMm: 150 },
        ],
      },
    });
    expect(r.skirt).toEqual({ kind: 'GATHERED_SKIRT', fullness: 2 });
    expect(r.wrap?.side).toBe('LEFT');
    expect(r.cowl?.depthMm).toBe(150);
    expect(resolveDrape({})).toEqual({});
  });

  it('dispatches each skirt kind', () => {
    expect(buildSkirtBlock({ kind: 'GATHERED_SKIRT', fullness: 2 }, 760, 600)[0]!.name).toMatch(/froncée/);
    expect(buildSkirtBlock({ kind: 'PLEATED_SKIRT', pleats: 12, depthMm: 30, type: 'KNIFE' }, 760, 600)[0]!.name).toMatch(/plissée/);
    expect(buildSkirtBlock({ kind: 'CIRCLE_SKIRT', fraction: 1 }, 760, 600)[0]!.name).toMatch(/cercle/);
  });
});

describe('blocks in the rules', () => {
  it('JUPE: a skirt block replaces Devant/Dos and honours length and waist', () => {
    const base = gen('JUPE', []);
    expect(base.pieces.map((p) => p.name)).toEqual(['Devant', 'Dos']);
    const gathered = gen('JUPE', [{ kind: 'GATHERED_SKIRT', fullness: 2 }], { lengths: { skirtPct: 100 } });
    expect(gathered.pieces).toHaveLength(1);
    expect(gathered.pieces[0]!.name).toMatch(/froncée/);
    // waist 74 cm + 4 cm ease = 78 cm; ×2 / 2 per panel
    expect(bbox(gathered.pieces[0]!).w).toBe(780);
  });

  it('JUPE: the waist block follows the ease', () => {
    const w = (ease: 'AJUSTE' | 'AMPLE') => bbox(gen('JUPE', [{ kind: 'GATHERED_SKIRT', fullness: 2 }], { ease }).pieces[0]!).w;
    expect(w('AJUSTE')).toBeLessThan(w('AMPLE'));
  });

  it('JUPE: wrap crosses the front; combined with a skirt block it is ignored and warned', () => {
    const wrapped = gen('JUPE', [{ kind: 'WRAP_FRONT', overlapMm: 100, side: 'RIGHT' }]);
    expect(wrapped.pieces.map((p) => p.name)).toEqual([
      'Devant — dessus croisé (droite sur gauche)',
      'Devant — dessous croisé',
      'Dos',
    ]);
    const both = gen('JUPE', [
      { kind: 'GATHERED_SKIRT', fullness: 2 },
      { kind: 'WRAP_FRONT', overlapMm: 100, side: 'RIGHT' },
    ]);
    expect(both.pieces).toHaveLength(1);
    expect(both.warnings.some((w) => w.includes('portefeuille ignorée'))).toBe(true);
  });

  it('ROBE: skirt block, wrap bodice and cowl neck combine', () => {
    const result = gen('ROBE', [
      { kind: 'PLEATED_SKIRT', pleats: 24, depthMm: 25, type: 'KNIFE' },
      { kind: 'WRAP_FRONT', overlapMm: 90, side: 'LEFT' },
      { kind: 'COWL_NECK', depthMm: 150 },
    ]);
    const names = result.pieces.map((p) => p.name);
    expect(names).not.toContain('Jupe Devant');
    expect(names).toContain('Corsage Dos');
    expect(names.some((n) => n.startsWith('Corsage Devant — dessus croisé'))).toBe(true);
    expect(names.some((n) => n.startsWith('Jupe plissée'))).toBe(true);
    expect(names).toContain('Col bénitier (taillé dans le biais)');
    expect(result.warnings.filter((w) => !w.includes('laize'))).toEqual([]);
  });

  it('ROBE_MARIEE: wrap and cowl apply, a skirt block warns that the train is not included', () => {
    const wrapped = gen('ROBE_MARIEE', [{ kind: 'WRAP_FRONT', overlapMm: 80, side: 'LEFT' }, { kind: 'COWL_NECK', depthMm: 120 }]);
    expect(wrapped.pieces.some((p) => p.name.startsWith('Bustier Devant (Princesse) — dessus'))).toBe(true);
    expect(wrapped.pieces.some((p) => p.name.startsWith('Col bénitier'))).toBe(true);
    expect(wrapped.pieces.some((p) => p.name === 'Jupe Dos avec Traîne')).toBe(true);

    const skirt = gen('ROBE_MARIEE', [{ kind: 'CIRCLE_SKIRT', fraction: 1 }]);
    expect(skirt.pieces.some((p) => p.name === 'Jupe Dos avec Traîne')).toBe(false);
    expect(skirt.warnings.some((w) => w.includes('traîne'))).toBe(true);
  });

  it('no drape = the historical pieces, bit for bit', () => {
    for (const g of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      const a = engine().generate({ garmentType: g, cutType: 'DROITE', style: null, details: {} }, M).pieces;
      const b = gen(g, []).pieces;
      expect(b).toEqual(a);
    }
  });

  it('every block combination yields closed, finite, non-crossing pieces', () => {
    const skirts: DrapeBlock[] = [
      { kind: 'GATHERED_SKIRT', fullness: 1.5 },
      { kind: 'GATHERED_SKIRT', fullness: 4 },
      { kind: 'PLEATED_SKIRT', pleats: 4, depthMm: 10, type: 'KNIFE' },
      { kind: 'PLEATED_SKIRT', pleats: 60, depthMm: 80, type: 'BOX' },
      { kind: 'CIRCLE_SKIRT', fraction: 0.25 },
      { kind: 'CIRCLE_SKIRT', fraction: 0.5 },
      { kind: 'CIRCLE_SKIRT', fraction: 1 },
    ];
    for (const garment of ['JUPE', 'ROBE', 'ROBE_MARIEE'] as GarmentType[]) {
      for (const skirt of skirts) {
        const result = gen(garment, [skirt, { kind: 'WRAP_FRONT', overlapMm: 250, side: 'LEFT' }, { kind: 'COWL_NECK', depthMm: 300 }]);
        for (const p of result.pieces) {
          expect(closed(p), `${garment}/${skirt.kind}/${p.name}`).toBe(true);
          expect(p.outlineMm.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y))).toBe(true);
          expect(hasSelfIntersection(p.outlineMm), `${garment}/${skirt.kind}/${p.name}`).toBe(false);
        }
        const bad = result.warnings.filter((w) => !w.includes('laize') && !w.includes('traîne') && !w.includes('portefeuille ignorée'));
        expect(bad, `${garment}/${skirt.kind}`).toEqual([]);
      }
    }
  });
});

describe('yardage and fabric width', () => {
  it('exposes an indicative yardage that grows with the skirt fullness', () => {
    const len = (f: number) => gen('JUPE', [{ kind: 'GATHERED_SKIRT', fullness: f }]).metadata.yardage!.lengthMm;
    expect(len(1.5)).toBeLessThan(len(3));
    expect(gen('JUPE', []).metadata.yardage).toMatchObject({ fabricWidthMm: 1400 });
    expect(len(2) % 50).toBe(0);
  });

  it('warns when a circle skirt needs a fabric wider than 140 cm, and stays silent when it fits turned', () => {
    // Long half-circle: radius up to ~145 cm → no orientation fits a 140 cm fabric.
    const long = engine().generate(
      { garmentType: 'JUPE', cutType: 'DROITE', style: null, details: {}, drape: { blocks: [{ kind: 'CIRCLE_SKIRT', fraction: 0.5 }] } },
      { ...M, LONGUEUR_JUPE: 120 },
    );
    expect(long.warnings.some((w) => w.includes('de large requis') && w.includes('laize'))).toBe(true);
    // Default length: 159 cm wide but only 80 cm deep → fits when turned, no warning.
    expect(gen('JUPE', [{ kind: 'CIRCLE_SKIRT', fraction: 0.5 }]).warnings.filter((w) => w.includes('laize'))).toEqual([]);
    expect(gen('JUPE', [{ kind: 'GATHERED_SKIRT', fullness: 2 }]).warnings.filter((w) => w.includes('laize'))).toEqual([]);
  });

  it('estimateYardage reports oversize pieces only when neither orientation fits', () => {
    const piece = (w: number, h: number): PatternPieceGeometry => ({
      name: `P${w}x${h}`,
      fabricRecommendation: null,
      quantity: 1,
      seamAllowanceMm: 10,
      grainline: { angleDegrees: 90, originX: 0, originY: 0 },
      notches: [],
      outlineMm: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }, { x: 0, y: 0 }],
    });
    expect(estimateYardage([piece(1600, 300)]).oversize).toEqual([]); // fits rotated
    expect(estimateYardage([piece(1600, 1500)]).oversize).toHaveLength(1);
  });
});
