import { describe, expect, it } from 'vitest';
import { PatternEngine } from '../pattern-engine';
import { JupeRule } from '../rules/jupe.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { resolveBottoms, topGirthMm, withBackVent } from '../shared/bottoms';
import type { PatternParameters, PatternPieceGeometry } from '../types';

const M = { TOUR_TAILLE: 74, TOUR_BASSIN: 98 };
const trousers = (details: Record<string, string> = {}, extra: Partial<PatternParameters> = {}, m: Record<string, number> = M) =>
  PantalonRule.computePieces({ garmentType: 'PANTALON', cutType: 'DROITE', style: null, details, ...extra }, m);
const byName = (pieces: PatternPieceGeometry[], name: string) => pieces.find((p) => p.name === name);
const names = (pieces: PatternPieceGeometry[]) => pieces.map((p) => p.name);
const width = (piece: PatternPieceGeometry, k: number) => piece.outlineMm[k]!.x - piece.outlineMm[9 - k]!.x;

describe('bottoms construction', () => {
  it('defaults to what trousers and skirts had: straight band, zip fly + slanted pockets / invisible zip', () => {
    expect(resolveBottoms('PANTALON', {})).toMatchObject({ band: 'DROITE', closure: 'BRAGUETTE_ZIP', frontPockets: 'ITALIENNES', rise: 'NATURELLE' });
    expect(resolveBottoms('JUPE', {})).toMatchObject({ band: 'DROITE', closure: 'ZIP_INVISIBLE', frontPockets: 'AUCUNE', vent: 'AUCUNE' });
    // A long pencil skirt needs a vent to walk in; a short one does not.
    expect(resolveBottoms('JUPE', {}, { cutType: 'AJUSTEE', lengthMm: 650 }).vent).toBe('DOS');
    expect(resolveBottoms('JUPE', {}, { cutType: 'AJUSTEE', lengthMm: 450 }).vent).toBe('AUCUNE');
    expect(resolveBottoms('JUPE', { fente: 'AUCUNE' }, { cutType: 'AJUSTEE', lengthMm: 650 }).vent).toBe('AUCUNE');
  });

  it('forces an elastic band on a pull-on closure, and a pull-on closure on an elastic band', () => {
    expect(resolveBottoms('PANTALON', { fermeture: 'ELASTIQUE' }).band).toBe('ELASTIQUEE');
    expect(resolveBottoms('PANTALON', { ceinture: 'COULISSE' }).closure).toBe('ELASTIQUE');
    // A skirt closure is not a trouser closure.
    expect(resolveBottoms('PANTALON', { fermeture: 'ZIP_INVISIBLE' }).closure).toBe('BRAGUETTE_ZIP');
  });

  it('draws the top girth of each rise: waist, a little more above it, towards the hips below', () => {
    expect(topGirthMm('NATURELLE', 740, 980, 180)).toBe(740);
    expect(topGirthMm('HAUTE', 740, 980, 180)).toBeGreaterThan(740);
    const low = topGirthMm('BASSE', 740, 980, 180);
    expect(low).toBeGreaterThan(780);
    expect(low).toBeLessThan(980);
  });

  it('cuts the fly, the pockets and the turn-up only when chosen', () => {
    expect(names(trousers({ fermeture: 'ZIP_COTE' }))).not.toContain('Parementure de braguette');
    expect(names(trousers({ poches: 'AUCUNE' }))).not.toContain('Fond de Poche');
    expect(names(trousers({ poches: 'PLAQUEES', poches_dos: 'PASSEPOIL' }))).toEqual(
      expect.arrayContaining(['Poche plaquée', 'Passepoil de poche arrière', 'Fond de poche arrière']),
    );
    expect(names(trousers({ bas: 'REVERS' }))).toContain('Bande de revers de bas');
    expect(names(trousers({ ceinture: 'SANS' }))).toEqual(expect.arrayContaining(['Parementure de taille']));
    expect(names(trousers({ ceinture: 'SANS' }))).not.toContain('Ceinture');
    expect(names(trousers({ ceinture: 'COULISSE' }))).toEqual(expect.arrayContaining(['Ceinture', 'Cordon de serrage']));
    // No extra piece is named like a panel (the 3D preview takes « devant » / « dos » for legs).
    for (const p of trousers({ poches: 'PLAQUEES', poches_dos: 'PLAQUEES', bas: 'REVERS', ceinture: 'COULISSE' }).slice(2)) {
      expect(p.name.toLowerCase()).not.toMatch(/devant|dos\b/);
    }
  });

  it('keeps every outline closed and sound, whatever the options', () => {
    const combos: Record<string, string>[] = [
      {},
      { taille: 'HAUTE', plis: 'DEUX_PLIS', bas: 'REVERS', poches_dos: 'PASSEPOIL' },
      { taille: 'BASSE', ceinture: 'FORMEE', poches: 'COUTURE' },
      { fermeture: 'ELASTIQUE', poches: 'PLAQUEES' },
    ];
    for (const details of combos) {
      for (const p of trousers(details)) {
        expect(p.outlineMm[0]).toEqual(p.outlineMm.at(-1));
        expect(hasSelfIntersection(p.outlineMm)).toBe(false);
      }
    }
  });

  it('raises a high waist above the natural waist and marks the waist line inside', () => {
    const front = byName(trousers({ taille: 'HAUTE' }), 'Devant Pantalon')!;
    expect(Math.min(...front.outlineMm.map((p) => p.y))).toBe(-40);
    expect(front.internalLinesMm?.find((l) => l.kind === 'WAIST')?.points[0]!.y).toBe(0);
    const low = byName(trousers({ taille: 'BASSE' }), 'Devant Pantalon')!;
    expect(Math.min(...low.outlineMm.map((p) => p.y))).toBe(40);
    // The plain trousers have no waist line (top edge = waist).
    expect(byName(trousers(), 'Devant Pantalon')!.internalLinesMm?.some((l) => l.kind === 'WAIST') ?? false).toBe(false);
  });

  it('widens the front at the waist for pleats (half of it kept at the hip) and marks the folds', () => {
    const plain = byName(trousers(), 'Devant Pantalon')!;
    const pleated = byName(trousers({ plis: 'DEUX_PLIS' }), 'Devant Pantalon')!;
    const waistW = (p: PatternPieceGeometry) => p.outlineMm[1]!.x - p.outlineMm[0]!.x;
    expect(waistW(pleated) - waistW(plain)).toBe(70);
    expect(pleated.outlineMm[2]!.x - plain.outlineMm[2]!.x).toBe(35);
    // Pleat folds: short vertical marks from the top edge (the fly and pockets are marked too).
    const folds = (p: PatternPieceGeometry) =>
      (p.internalLinesMm ?? []).filter((l) => l.kind === 'PLACEMENT' && l.points.length === 2 && l.points[0]!.x === l.points[1]!.x);
    expect(folds(pleated)).toHaveLength(2);
    expect(folds(plain)).toHaveLength(0);
  });

  it('follows fullness.leg at the hem (the knee keeps the cut) and lengths.legPct over the length choice', () => {
    const front = (extra: Partial<PatternParameters>) => byName(trousers({}, { cutType: 'SIRENE', ...extra }), 'Devant Pantalon')!;
    expect(width(front({ fullness: { leg: 1.4 } }), 4) / width(front({}), 4)).toBeCloseTo(1.4, 1);
    expect(width(front({ fullness: { leg: 1.4 } }), 3)).toBe(width(front({}), 3));
    expect(Math.max(...front({ lengths: { legPct: 60 } }).outlineMm.map((p) => p.y))).toBe(600);
  });

  it('fits a measured crotch length by scaling the fork extensions', () => {
    const back = (m: Record<string, number>) => byName(trousers({}, {}, { ...M, ...m }), 'Dos Pantalon')!.outlineMm;
    const seam = (o: Array<{ x: number; y: number }>) =>
      [o[0]!, o[8]!, o[7]!].slice(1).reduce((s, p, i) => s + Math.hypot(p.x - [o[0]!, o[8]!][i]!.x, p.y - [o[0]!, o[8]!][i]!.y), 0);
    // A longer crotch: a higher back rise and a longer back fork.
    expect(back({ LONGUEUR_ENFOURCHURE: 72 })[0]!.y).toBeLessThan(back({ LONGUEUR_ENFOURCHURE: 62 })[0]!.y);
    expect(back({ LONGUEUR_ENFOURCHURE: 72 })[0]!.x).toBeGreaterThan(back({ LONGUEUR_ENFOURCHURE: 62 })[0]!.x);
    expect(seam(back({ LONGUEUR_ENFOURCHURE: 72 }))).toBeGreaterThan(seam(back({})));
    // Out of reach: bounded, never absurd.
    expect(back({ LONGUEUR_ENFOURCHURE: 100 })[0]!.y).toBeGreaterThanOrEqual(-80);
  });

  it('marks on the front and back where the fly, the pockets, the welts and the turn-up show', () => {
    const pieces = trousers({ poches: 'PLAQUEES', poches_dos: 'PASSEPOIL', bas: 'REVERS' });
    const front = byName(pieces, 'Devant Pantalon')!;
    const back = byName(pieces, 'Dos Pantalon')!;
    const marks = (p: PatternPieceGeometry) => (p.internalLinesMm ?? []) as Array<{ kind: string; points: Array<{ x: number; y: number }>; single?: boolean }>;
    // The fly: drawn once (one front), from the top edge down towards the crotch.
    const fly = marks(front).filter((l) => l.single);
    expect(fly).toHaveLength(1);
    expect(fly[0]!.points[0]!.y).toBe(Math.min(...front.outlineMm.map((p) => p.y)));
    // A closed patch-pocket outline on the front, two welt lines on the back, a turn-up fold on both.
    expect(marks(front).some((l) => l.points.length === 5 && l.points[0]!.x === l.points[4]!.x && l.points[0]!.y === l.points[4]!.y)).toBe(true);
    const lg = Math.max(...front.outlineMm.map((p) => p.y));
    expect(marks(front).some((l) => l.points.every((p) => p.y === lg - 40))).toBe(true);
    expect(marks(back).filter((l) => l.points.length === 2 && l.points[0]!.y === l.points[1]!.y && l.points[0]!.y < lg / 2)).toHaveLength(2);
    // Without the options, no marks for them (the plain trousers keep their slanted pockets and fly).
    const plain = trousers({ fermeture: 'ELASTIQUE', poches: 'AUCUNE' });
    expect(marks(byName(plain, 'Devant Pantalon')!).filter((l) => l.kind === 'PLACEMENT')).toHaveLength(0);
    // Every mark lies on its piece.
    for (const p of [front, back]) {
      const xs = p.outlineMm.map((q) => q.x);
      for (const l of marks(p)) for (const q of l.points) expect(q.x).toBeGreaterThanOrEqual(Math.min(...xs) - 1);
    }
  });

  it('lists the notions: fly zip, band button, elastic', () => {
    const engine = new PatternEngine();
    engine.registerRule(PantalonRule);
    const labels = (details: Record<string, string>) =>
      (engine.generate({ garmentType: 'PANTALON', cutType: 'DROITE', style: null, details }, M).metadata.notions ?? []).map((n) => n.label);
    expect(labels({}).join(' | ')).toMatch(/braguette \d+ cm/);
    expect(labels({})).toContain('Bouton ou crochet de ceinture');
    expect(labels({ fermeture: 'ELASTIQUE' }).join(' | ')).toMatch(/Élastique/);
  });

  it('adds a back vent with its underlap to a skirt back', () => {
    const back = [{ x: 0, y: 0 }, { x: 230, y: 10 }, { x: 240, y: 200 }, { x: 250, y: 650 }, { x: 0, y: 650 }, { x: 0, y: 0 }];
    const spec = resolveBottoms('JUPE', { fente: 'DOS' });
    const vented = withBackVent(back, spec, 650);
    expect(Math.min(...vented.map((p) => p.x))).toBe(-40);
    expect(hasSelfIntersection(vented)).toBe(false);
    expect(withBackVent(back, resolveBottoms('JUPE', {}), 650)).toBe(back);
  });

  it('builds a skirt with its band, a back vent when long and fitted, pockets and a high waist', () => {
    const skirt = (cut: string, details: Record<string, string>) =>
      JupeRule.computePieces({ garmentType: 'JUPE', cutType: cut, style: null, details }, { ...M, LONGUEUR_DOS: 42 });
    const pencil = skirt('AJUSTEE', { longueur: 'MIDI' });
    expect(Math.min(...byName(pencil, 'Dos')!.outlineMm.map((p) => p.x))).toBe(-40);
    expect(Math.min(...byName(skirt('EVASEE', { longueur: 'MIDI' }), 'Dos')!.outlineMm.map((p) => p.x))).toBe(0);
    expect(names(skirt('EVASEE', { poches: 'COUTURE' }))).toContain('Fond de poche (couture de côté)');
    const high = byName(skirt('DROITE', { taille: 'HAUTE' }), 'Devant')!;
    expect(Math.min(...high.outlineMm.map((p) => p.y))).toBe(-40);
    for (const p of [...pencil, ...skirt('EVASEE', { taille: 'BASSE', ceinture: 'SANS', poches: 'PLAQUEES' })]) {
      expect(hasSelfIntersection(p.outlineMm)).toBe(false);
    }
    const engine = new PatternEngine();
    engine.registerRule(JupeRule);
    const labels = (engine.generate({ garmentType: 'JUPE', cutType: 'DROITE', style: null, details: { fermeture: 'ZIP_COTE' } }, { ...M, LONGUEUR_DOS: 42 }).metadata.notions ?? []).map((n) => n.label);
    expect(labels.join(' | ')).toMatch(/invisible \(côté\) \d+ cm/);
  });

  it('sets a skirt hem from the photo ratio (hem ÷ waist), else flares the cut with the drop below the hips', () => {
    const front = (cut: string, longueur: string, extra: Partial<PatternParameters> = {}) =>
      byName(JupeRule.computePieces({ garmentType: 'JUPE', cutType: cut, style: null, details: { longueur }, ...extra }, { ...M, LONGUEUR_DOS: 42 }), 'Devant')!;
    const hemW = (p: PatternPieceGeometry) => Math.max(...p.outlineMm.filter((q) => q.y === Math.max(...p.outlineMm.map((r) => r.y))).map((q) => q.x));
    const waistW = (p: PatternPieceGeometry) => p.outlineMm[1]!.x;
    const measured = front('EVASEE', 'GENOU', { fullness: { skirt: 1.6 } });
    expect(hemW(measured) / waistW(measured)).toBeCloseTo(1.6, 1);
    // A knee-length A-line opens less than a maxi one of the same cut.
    expect(hemW(front('EVASEE', 'GENOU'))).toBeLessThan(hemW(front('EVASEE', 'MAXI')));
  });

  it('cuts the fly from the top edge to the crotch: shorter on a low rise, longer on a high one', () => {
    const fly = (taille: string) => {
      const p = byName(trousers({ taille }), 'Parementure de braguette')!;
      return Math.max(...p.outlineMm.map((q) => q.y));
    };
    expect(fly('BASSE')).toBeLessThan(fly('NATURELLE'));
    expect(fly('HAUTE')).toBeGreaterThan(fly('NATURELLE'));
    const engine = new PatternEngine();
    engine.registerRule(PantalonRule);
    const zip = (taille: string) =>
      Number((engine.generate({ garmentType: 'PANTALON', cutType: 'DROITE', style: null, details: { taille } }, M).metadata.notions ?? [])
        .find((n) => n.label.includes('braguette'))!.label.match(/(\d+) cm/)![1]);
    expect(zip('BASSE')).toBeLessThanOrEqual(zip('NATURELLE'));
    expect(zip('NATURELLE')).toBeLessThanOrEqual(20);
  });
});
