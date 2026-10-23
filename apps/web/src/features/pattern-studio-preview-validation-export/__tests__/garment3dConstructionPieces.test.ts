import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { applyConstruction } from '../../../../../../packages/pattern-engine/src/shared/construction';
import type { ConstructionItem, PatternParameters } from '../../../../../../packages/pattern-engine/src/types';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import { bodyLandmarks } from '../utils/garment3d/body-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const dto = (pieces: ReturnType<typeof RobeRule.computePieces>): PatternPieceDto[] =>
  pieces.map(
    (p, i) =>
      ({
        id: `p${i}`,
        versionId: 'v',
        name: p.name,
        dimensionsJson: { outlineMm: p.outlineMm, ...(p.internalLinesMm ? { internalLinesMm: p.internalLinesMm } : {}) },
        fabricRecommendation: p.fabricRecommendation,
        quantity: p.quantity,
        grainlineJson: null,
        seamAllowanceCm: 1,
        notchesJson: [],
      }) as unknown as PatternPieceDto,
  );
const build = (items: ConstructionItem[]) => {
  const parameters: PatternParameters = { garmentType: 'ROBE', cutType: 'EVASEE', style: null, details: { longueur: 'SOL', manches: 'LONGUES', col: 'OFFICIER' } };
  const base = RobeRule.computePieces(parameters, M);
  const withConstruction = applyConstruction({ ...parameters, construction: { items } }, M, base).pieces;
  const a = buildGarmentModel(dto(base), 'ROBE', M);
  const b = buildGarmentModel(dto(withConstruction), 'ROBE', M);
  if (!a.ok || !b.ok) throw new Error('model');
  return { base: a.model, built: b.model, names: withConstruction.map((p) => p.name) };
};

describe('3D preview with construction pieces (lining, interfacing, hidden supports)', () => {
  it('never drapes a lining or an interfacing as the panel it copies: the garment is the same', () => {
    const { base, built, names } = build([{ kind: 'LINING' }, { kind: 'INTERFACING' }, { kind: 'BALAYEUSE', depthMm: 80 }, { kind: 'BIAS_BINDING', widthMm: 30 }]);
    expect(names).toContain('Doublure — Corsage Devant');
    expect(names).toContain('Entoilage — Col officier');
    expect(built.panels.map((p) => p.id).sort()).toEqual(base.panels.map((p) => p.id).sort());
    expect(built.ignored).toEqual(base.ignored);
  });

  it('drapes the flounces round the skirt, above its hem, standing off it', () => {
    const { built, names } = build([{ kind: 'HEM_FLOUNCE', tiers: 2, depthMm: 150, style: 'FRONCE' }]);
    const tiers = built.panels.filter((p) => p.id.startsWith('construction-flounce-'));
    expect(tiers).toHaveLength(2);
    expect(built.ignored.filter((n) => names.includes(n) && n.startsWith('Volant'))).toEqual([]);
    const skirt = built.panels.filter((p) => p.zone === 'skirt');
    let hem = Infinity;
    for (const p of skirt) for (let o = 1; o < p.positions.length; o += 3) hem = Math.min(hem, p.positions[o]!);
    const ys = (p: (typeof tiers)[number]) => Array.from(p.positions).filter((_, i) => i % 3 === 1);
    // Lowest tier reaches the hem, the upper one is sewn higher.
    expect(Math.min(...ys(tiers[0]!))).toBeGreaterThan(hem - 0.03);
    expect(Math.max(...ys(tiers[1]!))).toBeGreaterThan(Math.max(...ys(tiers[0]!)));
  });

  it('draws godets, a peplum, a capelet, bows, a pouf and engageantes; nothing visible is left out', () => {
    const { built, names } = build([
      { kind: 'GODETS', count: 6, heightMm: 350, widthMm: 280 },
      { kind: 'PEPLUM', style: 'CIRCULAIRE', depthMm: 150 },
      { kind: 'CAPELET', lengthMm: 250, material: 'TULLE' },
      { kind: 'BOW', place: 'DOS', widthMm: 250 },
      { kind: 'BOW', place: 'MANCHES', widthMm: 120 },
      { kind: 'BUSTLE', style: 'POUF' },
      { kind: 'ENGAGEANTES', tiers: 2, depthMm: 90 },
    ]);
    const ids = built.panels.map((p) => p.id);
    expect(ids.filter((id) => id.startsWith('construction-godet-'))).toHaveLength(6);
    expect(ids.some((id) => id.startsWith('construction-peplum-'))).toBe(true);
    const capelet = built.panels.find((p) => p.id.startsWith('construction-capelet-'))!;
    expect(capelet.zone).toBe('lace');
    expect(capelet.material).toBe('TULLE');
    expect(ids.filter((id) => id.startsWith('construction-bow-'))).toHaveLength(3);
    expect(ids.some((id) => id.startsWith('construction-pouf-'))).toBe(true);
    expect(ids.filter((id) => id.startsWith('construction-engageante-'))).toHaveLength(4);
    const visible = names.filter((n) => /^(Godet|Basque rapportée|Pèlerine \(|Chou|Drapé de tournure|Engageante — volant)/.test(n));
    expect(built.ignored.filter((n) => visible.includes(n))).toEqual([]);
    for (const p of built.panels) expect(Array.from(p.positions).every(Number.isFinite), p.id).toBe(true);
  });

  it('lays applied pieces on the cloth where the engine placed them (bands, embroidery) and drapes the apron and the jabot', () => {
    const { built } = build([
      { kind: 'HEM_BANDS', rows: 2, widthMm: 50, gapMm: 40 },
      { kind: 'APRON', lengthMm: 500, fullness: 1.5 },
      { kind: 'JABOT', lengthMm: 180, tiers: 1 },
      { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50 },
    ]);
    const labels = built.panels.filter((p) => p.zone === 'detail').map((p) => p.label);
    expect(labels.some((l) => l.startsWith('Bande appliquée 1/2'))).toBe(true);
    // The apron and the jabot are draped by the construction model (an apron over any skirt, a lace jabot).
    const ids = built.panels.map((p) => p.id);
    expect(ids.some((id) => id.startsWith('construction-apron-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('construction-jabot-'))).toBe(true);
    expect(built.panels.find((p) => p.id.startsWith('construction-jabot-'))!.zone).toBe('lace');
    expect(labels.some((l) => l.startsWith('Gabarit de broderie'))).toBe(true);
  });

  it('draws embroidery as a motif in its thread colour and smocking as a honeycomb on the dress fabric', () => {
    const { built } = build([
      { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50, color: '#AA2233' },
      { kind: 'EMBROIDERY', place: 'OURLET', widthMm: 80 },
      { kind: 'SMOCKING', place: 'TAILLE', rows: 6, ratio: 3 },
    ]);
    const details = built.panels.filter((p) => p.zone === 'detail');
    const neck = details.filter((p) => p.label.startsWith('Gabarit de broderie (encolure)'));
    const hem = details.filter((p) => p.label.startsWith('Gabarit de broderie (bas'));
    const smocks = details.filter((p) => p.label.startsWith('Panneau à smocks'));
    expect(neck.length).toBeGreaterThan(0);
    expect(hem.length).toBeGreaterThan(0);
    expect(smocks.length).toBeGreaterThan(0);
    neck.forEach((p) => expect(p).toMatchObject({ motif: 'BRODERIE', trimColor: '#aa2233' }));
    // No thread colour on the pattern: the viewer picks its default.
    hem.forEach((p) => {
      expect(p.motif).toBe('BRODERIE');
      expect(p.trimColor).toBeUndefined();
    });
    smocks.forEach((p) => {
      expect(p.motif).toBe('SMOCKS');
      expect(p.contrast).toBeUndefined();
      expect(p.trimColor).toBeUndefined();
    });
    // Other applied pieces stay plain cloth.
    const { built: plain } = build([{ kind: 'HEM_BANDS', rows: 1, widthMm: 50, gapMm: 40 }]);
    expect(plain.panels.filter((p) => p.zone === 'detail').every((p) => p.motif === undefined)).toBe(true);
  });
});

describe('side hoops and a bustle pad hold the skirt out', () => {
  type Model = ReturnType<typeof build>['base'];
  /** Skirt points within 2 cm of a height (m below the waist): their x and z extents. */
  const extent = (model: Model, below: number) => {
    const y0 = bodyLandmarks(model.body).waistY - below;
    const e = { xMax: -Infinity, zMin: Infinity, zMax: -Infinity };
    for (const p of model.panels.filter((q) => q.zone === 'skirt' && !q.id.includes('petticoat'))) {
      for (let o = 0; o < p.positions.length; o += 3) {
        if (Math.abs(p.positions[o + 1]! - y0) > 0.02) continue;
        e.xMax = Math.max(e.xMax, Math.abs(p.positions[o]!));
        e.zMin = Math.min(e.zMin, p.positions[o + 2]!);
        e.zMax = Math.max(e.zMax, p.positions[o + 2]!);
      }
    }
    return e;
  };

  it('hoops widen the skirt at the hips by at least 15 cm and leave its depth alone', () => {
    const { base, built } = build([{ kind: 'BUSTLE', style: 'PANIERS' }]);
    expect(built.layout.understructure?.map((u) => u.kind)).toEqual(['PANIERS']);
    // Still listed with the pattern as an inside piece, never draped.
    expect(built.inside).toContain('Panier (poche de hanche)');
    const a = extent(base, 0.2);
    const b = extent(built, 0.2);
    expect(b.xMax - a.xMax).toBeGreaterThanOrEqual(0.15);
    expect(Math.abs(b.zMin - a.zMin)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(b.zMax - a.zMax)).toBeLessThanOrEqual(0.02);
    for (const p of built.panels) expect(Array.from(p.positions).every(Number.isFinite), p.id).toBe(true);
  });

  it('a bustle pad pushes the back of the skirt out by at least 8 cm under the waist', () => {
    const { base, built } = build([{ kind: 'BUSTLE', style: 'COUSSIN' }]);
    expect(built.layout.understructure?.map((u) => u.kind)).toEqual(['COUSSIN']);
    const a = extent(base, 0.06);
    const b = extent(built, 0.06);
    expect(a.zMin - b.zMin).toBeGreaterThanOrEqual(0.08);
    // The front does not move.
    expect(Math.abs(b.zMax - a.zMax)).toBeLessThanOrEqual(0.02);
  });
});

describe('3D construction pieces stay on the body', () => {
  it('a capelet falls along the shoulders: never further than its own length from the body axis', () => {
    const { built } = build([{ kind: 'CAPELET', lengthMm: 280 }]);
    const capelet = built.panels.find((p) => p.id.startsWith('construction-capelet-'))!;
    const sleeves = built.panels.filter((p) => p.role === 'sleeve');
    let arms = 0;
    for (const p of sleeves) for (let o = 0; o < p.positions.length; o += 3) arms = Math.max(arms, Math.abs(p.positions[o]!));
    let reach = 0;
    for (let o = 0; o < capelet.positions.length; o += 3) reach = Math.max(reach, Math.abs(capelet.positions[o]!));
    // Over the arms, not a disc standing out past them.
    expect(reach).toBeLessThan(arms + 0.08);
    let ys: number[] = [];
    for (let o = 1; o < capelet.positions.length; o += 3) ys.push(capelet.positions[o]!);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.2);
    ys = [];
  });
});

describe('engageantes under a pagoda sleeve', () => {
  it('come out from inside the sleeve and hang along the arm, never spreading out sideways', () => {
    const parameters: PatternParameters = { garmentType: 'ROBE', cutType: 'EVASEE', style: null, details: { longueur: 'SOL', manches: 'CLOCHE' }, fullness: { sleeve: 2 } };
    const base = RobeRule.computePieces(parameters, M);
    const pieces = applyConstruction({ ...parameters, construction: { items: [{ kind: 'ENGAGEANTES', tiers: 1, depthMm: 120, material: 'TISSU' }] } }, M, base).pieces;
    const built = buildGarmentModel(dto(pieces), 'ROBE', M);
    if (!built.ok) throw new Error('model');
    const reach = (pred: (id: string) => boolean) => {
      let r = 0;
      for (const p of built.model.panels.filter((q) => pred(q.id))) for (let o = 0; o < p.positions.length; o += 3) r = Math.max(r, Math.abs(p.positions[o]!));
      return r;
    };
    // They hang on along the arm (tilted out, sin 36° ≈ 0.6) by their depth, no further: no disc spreading out sideways.
    expect(reach((id) => id.startsWith('construction-engageante-'))).toBeLessThanOrEqual(reach((id) => id.startsWith('sleeve-')) + 0.12 * 0.6 + 0.01);
  });
});
