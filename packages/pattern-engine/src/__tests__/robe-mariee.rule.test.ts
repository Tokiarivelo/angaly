import { describe, it, expect } from 'vitest';
import { RobeMarieeRule, skirtHemVsJupon } from '../rules/robe-mariee.rule';
import { RobeRule } from '../rules/robe.rule';
import { SWEETHEART_POINTS } from '../shared/shapes';
import type { PatternParameters, MeasurementSet } from '../types';

describe('RobeMarieeRule', () => {
  it('should apply to ROBE_MARIEE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    expect(RobeMarieeRule.appliesTo(params)).toBe(true);
  });

  it('should not apply to ROBE garment type', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'DROITE',
      style: null,
      details: {},
    };
    expect(RobeMarieeRule.appliesTo(params)).toBe(false);
  });

  it('should compute a structured bustier + train construction, distinct from RobeRule', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'PRINCESSE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const pieces = RobeMarieeRule.computePieces(params, measurements);

    expect(pieces.length).toBe(7);
    expect(pieces.find((p) => p.name === 'Bustier Devant (Princesse)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Bustier Côté (Découpe Princesse)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Bustier Dos (Lacage)')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Devant')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Côté')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupe Dos avec Traîne')).toBeDefined();
    expect(pieces.find((p) => p.name === 'Jupon / Doublure Jupe')).toBeDefined();

    for (const piece of pieces) {
      const first = piece.outlineMm[0];
      const last = piece.outlineMm[piece.outlineMm.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first?.x).toBe(last?.x);
      expect(first?.y).toBe(last?.y);
    }
  });

  it('should give the back skirt a meaningfully longer hem than the front (train)', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE_MARIEE',
      cutType: 'SIRENE',
      style: null,
      details: {},
    };
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const pieces = RobeMarieeRule.computePieces(params, measurements);
    const jupeDevant = pieces.find((p) => p.name === 'Jupe Devant');
    const jupeDosTraine = pieces.find((p) => p.name === 'Jupe Dos avec Traîne');

    // Hem / train tip = lowest point (the SIRENE cut adds a knee point, so indexes are not stable).
    const lowest = (outline: Array<{ y: number }> | undefined) => Math.max(...(outline ?? [{ y: 0 }]).map((p) => p.y));
    const longueurDevant = lowest(jupeDevant?.outlineMm);
    const longueurDos = lowest(jupeDosTraine?.outlineMm);

    expect(longueurDos).toBeGreaterThan(longueurDevant);
    // Default train length is 90cm = 900mm
    expect(longueurDos - longueurDevant).toBe(900);
  });

  describe('petticoat (jupon)', () => {
    const M: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
    const gen = (extra: Partial<PatternParameters>) =>
      RobeMarieeRule.computePieces({ garmentType: 'ROBE_MARIEE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL' }, ...extra }, M);
    const jupon = (pieces: ReturnType<typeof gen>) => pieces.find((p) => p.name === 'Jupon / Doublure Jupe')!;
    const hemQuarter = (outline: Array<{ x: number; y: number }>) => {
      const maxY = Math.max(...outline.map((p) => p.y));
      return Math.max(...outline.filter((p) => p.y === maxY).map((p) => p.x));
    };

    it('is kept under a skirt block: a ball gown stands on it', () => {
      const pieces = gen({ drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 32, depthMm: 26, type: 'KNIFE' }] } });
      expect(jupon(pieces).quantity).toBe(2);
    });

    it('takes its hem from fullness.skirt (round, on the body waist) and is a dome for a ball gown', () => {
      const outline = jupon(gen({ fullness: { skirt: 3 } })).outlineMm;
      // 4 quarters = fullness × waist × JUPON_ROUND.
      expect(Math.abs(4 * hemQuarter(outline) - 3 * 740 * 1.13)).toBeLessThan(4);
      // Dome: half of the extra width is reached within the first quarter of the length.
      const side = outline.filter((p) => p.x > 0 && p.y > 0).sort((a, b) => a.y - b.y);
      const length = Math.max(...outline.map((p) => p.y));
      const quarter = side.find((p) => p.y >= length / 4)!;
      expect(quarter.x - outline[1]!.x).toBeGreaterThan(0.5 * (hemQuarter(outline) - outline[1]!.x));
    });

    it('lengthens the skirt by what the dome adds, and stays shorter than it', () => {
      const flat = gen({});
      const dome = gen({ fullness: { skirt: 3.5 } });
      const length = (pieces: ReturnType<typeof gen>, name: string) => Math.max(...pieces.find((p) => p.name === name)!.outlineMm.map((p) => p.y));
      expect(length(dome, 'Jupe Devant')).toBeGreaterThan(length(flat, 'Jupe Devant'));
      for (const pieces of [flat, dome]) {
        expect(length(pieces, 'Jupe Devant') - length(pieces, 'Jupon / Doublure Jupe')).toBe(30);
      }
    });
  });

  describe('skirt narrower than its petticoat (warning)', () => {
    const M: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
    const params = (extra: Partial<PatternParameters>): PatternParameters => ({
      garmentType: 'ROBE_MARIEE',
      cutType: 'PRINCESSE',
      style: null,
      details: { longueur: 'SOL' },
      ...extra,
    });
    const pleated = (pleats: number, depthMm: number, type: 'KNIFE' | 'BOX' = 'KNIFE') => ({
      blocks: [{ kind: 'PLEATED_SKIRT' as const, pleats, depthMm, type }],
    });
    const narrowWarning = (p: PatternParameters) =>
      RobeMarieeRule.warnings!(p, M).find((w) => w.startsWith('Jupe plus étroite que son jupon'));

    it('warns for the first reading of the reference (32 × 26 mm pleats on a 3.0 petticoat), with both girths and a fix', () => {
      const p = params({ fullness: { skirt: 3 }, drape: pleated(32, 26) });
      const { skirtHemMm, juponHemMm } = skirtHemVsJupon(p, M);
      expect(juponHemMm).toBeGreaterThan(2400);
      expect(skirtHemMm).toBeLessThan(1700);
      const warning = narrowWarning(p)!;
      expect(warning).toContain(`${Math.round(skirtHemMm / 10)} cm d'ourlet pour ${Math.round(juponHemMm / 10)} cm`);
      expect(warning).toMatch(/plis de \d+ mm/);
      // The suggestion is enough: its pleats cover the petticoat.
      const [, n, d] = /au moins (\d+) plis de (\d+) mm/.exec(warning)!;
      expect(narrowWarning(params({ fullness: { skirt: 3 }, drape: pleated(Number(n), Number(d)) }))).toBeUndefined();
    });

    it('does not warn for the current reading (40 × 80 mm)', () => {
      expect(narrowWarning(params({ fullness: { skirt: 3 }, drape: pleated(40, 80) }))).toBeUndefined();
    });

    it('does not warn for the default panel skirt, with or without fullness', () => {
      for (const cutType of ['PRINCESSE', 'SIRENE', 'DROITE', 'EVASEE']) {
        expect(narrowWarning(params({ cutType }))).toBeUndefined();
        expect(narrowWarning(params({ cutType, fullness: { skirt: 3 } }))).toBeUndefined();
      }
    });

    it('does not warn with neutral fullness when the block is wide enough', () => {
      expect(narrowWarning(params({ fullness: { skirt: 1 }, drape: pleated(40, 50) }))).toBeUndefined();
      expect(narrowWarning(params({ drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.8 }] } }))).toBeUndefined();
      expect(narrowWarning(params({ drape: { blocks: [{ kind: 'CIRCLE_SKIRT', fraction: 1 }] } }))).toBeUndefined();
    });

    it('suggests a gathering fullness or a wider circle when those blocks are too narrow', () => {
      const gathered = narrowWarning(params({ fullness: { skirt: 3.5 }, drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 1.5 }] } }))!;
      expect(gathered).toMatch(/ampleur de fronces d'au moins \d,\d/);
      const circle = narrowWarning(params({ fullness: { skirt: 3.5 }, drape: { blocks: [{ kind: 'CIRCLE_SKIRT', fraction: 0.25 }] } }))!;
      expect(circle).toContain('plus évasée');
    });

    it('shares its petticoat hem with the generated petticoat piece', () => {
      const p = params({ fullness: { skirt: 3 }, drape: pleated(32, 26) });
      const piece = RobeMarieeRule.computePieces(p, M).find((x) => x.name === 'Jupon / Doublure Jupe')!;
      const maxY = Math.max(...piece.outlineMm.map((q) => q.y));
      const hemQuarter = Math.max(...piece.outlineMm.filter((q) => q.y === maxY).map((q) => q.x));
      expect(skirtHemVsJupon(p, M).juponHemMm).toBe(4 * hemQuarter);
    });
  });

  it('slopes the side skirt hem from the front length to the train, so each seam matches its neighbour', () => {
    for (const cutType of ['PRINCESSE', 'SIRENE']) {
      const pieces = RobeMarieeRule.computePieces(
        { garmentType: 'ROBE_MARIEE', cutType, style: null, details: {} },
        { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 41 },
      );
      const outline = (name: string) => pieces.find((p) => p.name === name)!.outlineMm;
      const lowest = (pts: Array<{ y: number }>) => Math.max(...pts.map((p) => p.y));
      const cote = outline('Jupe Côté');
      // Edge sewn to the front skirt (x = 0): as long as the front skirt.
      expect(Math.max(...cote.filter((p) => p.x === 0).map((p) => p.y))).toBe(lowest(outline('Jupe Devant')));
      // Edge sewn to the back skirt: reaches the train's length.
      expect(lowest(cote)).toBe(lowest(outline('Jupe Dos avec Traîne')));
    }
  });

  it('should use a distinctly different (tighter) bodice construction than RobeRule', () => {
    const measurements: MeasurementSet = {
      TOUR_POITRINE: 88,
      TOUR_TAILLE: 68,
      TOUR_BASSIN: 94,
      LONGUEUR_DOS: 41,
    };

    const robePieces = RobeRule.computePieces(
      { garmentType: 'ROBE', cutType: 'DROITE', style: null, details: {} },
      measurements,
    );
    const marieePieces = RobeMarieeRule.computePieces(
      { garmentType: 'ROBE_MARIEE', cutType: 'DROITE', style: null, details: {} },
      measurements,
    );

    // RobeRule produces 4 pieces (no side panel, no train, no jupon).
    expect(robePieces.length).toBe(4);
    // RobeMarieeRule produces a structurally different, larger piece set.
    expect(marieePieces.length).toBe(7);
    expect(marieePieces.some((p) => p.name.includes('Côté'))).toBe(true);
    expect(marieePieces.some((p) => p.name.includes('Traîne'))).toBe(true);
  });

  it('cuts the bustier top as a sweetheart for a COEUR neckline, a straight edge otherwise', () => {
    const measurements: MeasurementSet = { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 41 };
    const front = (decollete?: string) =>
      RobeMarieeRule.computePieces(
        {
          garmentType: 'ROBE_MARIEE',
          cutType: 'PRINCESSE',
          style: null,
          details: decollete ? { decollete } : {},
        },
        measurements,
      ).find((p) => p.name === 'Bustier Devant (Princesse)')!.outlineMm;

    const heart = front('COEUR');
    const v = front('PLONGEANT');
    // Same notch and top corner as the straight edge, the sweetheart's points in between.
    expect(heart.length - v.length).toBe(SWEETHEART_POINTS);
    const notch = heart[0]!;
    const top = heart[SWEETHEART_POINTS + 1]!;
    expect(notch).toEqual({ x: 0, y: 140 });
    expect(top.y).toBe(v[1]!.y);
    // The lobe rounds over the bust above the straight edge.
    const onLine = (x: number) => notch.y + ((top.y - notch.y) * x) / top.x;
    expect(heart.slice(1, 4).every((p) => p.y < onLine(p.x))).toBe(true);
  });
});
