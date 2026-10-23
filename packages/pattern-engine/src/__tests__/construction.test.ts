import { describe, expect, it } from 'vitest';
import { createDefaultEngine } from '../eval/fidelity';
import {
  annulusSector,
  applyConstruction,
  clipAbove,
  hemChain,
  hemSweepMm,
  isSeparateFabric,
  LINING_SKIRT_SHORTER_MM,
  PANEL_MAX_MM,
  skirtGirthAboveHem,
} from '../shared/construction';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { FRILL_GATHER, polylineLength } from '../shared/trims';
import type { ConstructionItem, PatternParameters, PatternPieceGeometry } from '../types';
import { CATALOG_MEASUREMENTS as M } from './fixtures/dress-catalog';

const engine = createDefaultEngine();
const robe = (details: Record<string, string>, items: ConstructionItem[], extra: Partial<PatternParameters> = {}): PatternParameters => ({
  garmentType: 'ROBE',
  cutType: 'EVASEE',
  style: null,
  details: { longueur: 'SOL', ...details },
  ...extra,
  construction: { items },
});
const gen = (p: PatternParameters) => engine.generate(p, M);
const byName = (pieces: PatternPieceGeometry[], re: RegExp) => pieces.filter((p) => re.test(p.name));
const bbox = (o: Array<{ x: number; y: number }>) => ({
  w: Math.max(...o.map((p) => p.x)) - Math.min(...o.map((p) => p.x)),
  h: Math.max(...o.map((p) => p.y)) - Math.min(...o.map((p) => p.y)),
});
const square = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 400 }, { x: 0, y: 400 }, { x: 0, y: 0 }];

describe('geometry helpers', () => {
  it('hemChain is the bottom edge of a rectangle, whichever way it turns', () => {
    expect(polylineLength(hemChain(square))).toBe(200);
    expect(polylineLength(hemChain([...square].reverse()))).toBe(200);
  });

  it('hemChain follows a trained (sloped) hem and leaves the side seams out', () => {
    const trained = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 600, y: 1000 }, { x: 0, y: 1800 }, { x: 0, y: 0 }];
    const chain = hemChain(trained);
    expect(chain).toEqual([{ x: 600, y: 1000 }, { x: 0, y: 1800 }]);
  });

  it('clipAbove cuts a piece at a height', () => {
    expect(bbox(clipAbove(square, 375))).toEqual({ w: 200, h: 375 });
  });

  it('annulusSector has the inner arc it is asked for', () => {
    const s = annulusSector(100, 300, Math.PI / 2);
    expect(hasSelfIntersection(s)).toBe(false);
    // The inner arc is the first 17 points.
    expect(polylineLength(s.slice(0, 17))).toBeCloseTo((100 * Math.PI) / 2, -1);
  });
});

describe('applyConstruction', () => {
  it('leaves the pieces untouched without items', () => {
    const pieces = gen(robe({ manches: 'LONGUES' }, [])).pieces;
    const out = applyConstruction({ garmentType: 'ROBE', cutType: 'EVASEE', style: null, details: {} }, M, pieces);
    expect(out.pieces).toBe(pieces);
  });

  it('reads the hem sweep and the girth up the skirt off the skirt pieces', () => {
    const pieces = gen(robe({}, [], { fullness: { skirt: 2 } })).pieces;
    const sweep = hemSweepMm(pieces);
    // fullness 2 ⇒ the hem is about twice the waist (74 cm), and wider than the hips.
    expect(sweep).toBeGreaterThan(1300);
    expect(sweep).toBeLessThan(1900);
    expect(skirtGirthAboveHem(pieces, 500)!).toBeLessThan(skirtGirthAboveHem(pieces, 50)!);
  });
});

describe('LINING', () => {
  it('copies every bodice, skirt and sleeve piece, the skirt 25 mm shorter', () => {
    const r = gen(robe({ manches: 'LONGUES' }, [{ kind: 'LINING' }]));
    const skirt = r.pieces.find((p) => p.name === 'Jupe Devant')!;
    const lining = r.pieces.find((p) => p.name === 'Doublure — Jupe Devant')!;
    expect(bbox(skirt.outlineMm).h - bbox(lining.outlineMm).h).toBeCloseTo(LINING_SKIRT_SHORTER_MM, 0);
    expect(byName(r.pieces, /^Doublure — /).map((p) => p.name)).toEqual(
      expect.arrayContaining(['Doublure — Corsage Devant', 'Doublure — Corsage Dos', 'Doublure — Manche']),
    );
  });

  it('only the parts asked for, and never a second skirt lining over a petticoat', () => {
    expect(byName(gen(robe({}, [{ kind: 'LINING', parts: ['CORSAGE'] }])).pieces, /^Doublure — Jupe/)).toHaveLength(0);
    const r = engine.generate({ ...robe({ manches: 'SANS_MANCHES' }, [{ kind: 'LINING' }]), garmentType: 'ROBE_MARIEE', cutType: 'PRINCESSE' }, M);
    expect(byName(r.pieces, /^Doublure — Jupe/)).toHaveLength(0);
    expect(r.warnings.some((w) => /jupon-doublure/.test(w))).toBe(true);
  });

  it('is left out of the main fabric’s yardage', () => {
    const plain = gen(robe({ manches: 'LONGUES' }, []));
    const lined = gen(robe({ manches: 'LONGUES' }, [{ kind: 'LINING' }]));
    expect(lined.metadata.yardage).toEqual(plain.metadata.yardage);
    expect(isSeparateFabric('Doublure — Manche')).toBe(true);
    expect(isSeparateFabric('Manche')).toBe(false);
  });
});

describe('INTERFACING', () => {
  it('one interfacing per collar (upper collar only), one per cuff and facing, no seam allowance', () => {
    const r = gen(robe({ manches: 'LONGUES', col: 'OFFICIER', devant: 'MANTEAU_OUVERT' }, [{ kind: 'INTERFACING' }]));
    const collar = r.pieces.find((p) => p.name === 'Col officier')!;
    const interfacing = r.pieces.find((p) => p.name === 'Entoilage — Col officier')!;
    expect(interfacing.quantity).toBe(Math.ceil(collar.quantity / 2));
    expect(interfacing.seamAllowanceMm).toBe(0);
    expect(byName(r.pieces, /^Entoilage — Parementure/).length).toBeGreaterThan(0);
  });
});

describe('HEM_FLOUNCE', () => {
  it('gathered tiers: strips 1.8 × the skirt round them, no wider than a cloth, each tier higher and shorter', () => {
    const r = gen(robe({}, [{ kind: 'HEM_FLOUNCE', tiers: 3, depthMm: 200, style: 'FRONCE' }], { fullness: { skirt: 2 } }));
    const tiers = [1, 2, 3].map((k) => r.pieces.find((p) => p.name.startsWith(`Volant étagé ${k}/3`))!);
    const lengths = tiers.map((p) => bbox(p.outlineMm).w * p.quantity);
    for (const p of tiers) expect(bbox(p.outlineMm).w).toBeLessThanOrEqual(PANEL_MAX_MM);
    expect(lengths[0]).toBeGreaterThan(lengths[2]!);
    const base = r.pieces.filter((p) => !/^Volant/.test(p.name));
    expect(lengths[0]! / skirtGirthAboveHem(base, 200)!).toBeCloseTo(FRILL_GATHER, 1);
    // Placement lines on the skirt pieces, one per tier.
    const skirt = r.pieces.find((p) => p.name === 'Jupe Devant')!;
    expect((skirt.internalLinesMm ?? []).filter((l) => l.kind === 'PLACEMENT')).toHaveLength(3);
  });

  it('circular: sectors whose inner arcs add up to the skirt round them, each fitting a cloth', () => {
    const r = gen(robe({}, [{ kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 300, style: 'CIRCULAIRE' }], { fullness: { skirt: 2 } }));
    const f = r.pieces.find((p) => /^Volant d’ourlet en forme/.test(p.name))!;
    const inner = polylineLength(f.outlineMm.slice(0, 17)) * f.quantity;
    const base = r.pieces.filter((p) => !/^Volant/.test(p.name));
    expect(inner / skirtGirthAboveHem(base, 300)!).toBeCloseTo(1, 1);
    expect(bbox(f.outlineMm).w).toBeLessThanOrEqual(1300);
    expect(r.metadata.notions?.some((n) => /Crin/.test(n.label))).toBe(true);
  });
});

describe('GODETS, PEPLUM, CAPELET', () => {
  it('a godet opens the hem by its width, and its slit is marked on every skirt piece', () => {
    const r = gen(robe({}, [{ kind: 'GODETS', count: 6, heightMm: 400, widthMm: 300 }]));
    const g = r.pieces.find((p) => p.name.startsWith('Godet'))!;
    expect(g.quantity).toBe(6);
    expect(bbox(g.outlineMm).w).toBeCloseTo(300, -1);
    for (const s of byName(r.pieces, /^Jupe/)) expect((s.internalLinesMm ?? []).some((l) => l.kind === 'PLACEMENT')).toBe(true);
  });

  it('a circular peplum’s two halves close round the waist', () => {
    const r = gen(robe({}, [{ kind: 'PEPLUM', style: 'CIRCULAIRE', depthMm: 150 }]));
    const p = r.pieces.find((q) => q.name.startsWith('Basque rapportée en forme'))!;
    expect(polylineLength(p.outlineMm.slice(0, 17)) * p.quantity).toBeCloseTo(M['TOUR_TAILLE']! * 10 + 40, -1);
  });

  it('pointed and gathered peplums; none when the pattern already has a basque', () => {
    expect(gen(robe({}, [{ kind: 'PEPLUM', style: 'POINTES', depthMm: 180 }])).pieces.some((p) => p.name.startsWith('Basque à pointes'))).toBe(true);
    expect(gen(robe({}, [{ kind: 'PEPLUM', style: 'FRONCEE', depthMm: 120 }])).pieces.some((p) => p.name.startsWith('Basque rapportée froncée'))).toBe(true);
    const fake: PatternPieceGeometry = { name: 'Basque Devant', fabricRecommendation: null, quantity: 2, seamAllowanceMm: 10, grainline: { angleDegrees: 90, originX: 0, originY: 0 }, notches: [], outlineMm: square };
    const out = applyConstruction(robe({}, [{ kind: 'PEPLUM', style: 'POINTES', depthMm: 180 }]), M, [fake]);
    expect(out.pieces).toHaveLength(1);
    expect(out.warnings[0]).toMatch(/déjà une basque/);
  });

  it('a capelet’s neck edge is the neck girth plus ease', () => {
    const r = gen(robe({}, [{ kind: 'CAPELET', lengthMm: 250 }]));
    const c = r.pieces.find((p) => p.name.startsWith('Pèlerine (½'))!;
    // Half the capelet (on the fold): the inner arc is half the neck.
    expect(2 * polylineLength(c.outlineMm.slice(0, 17))).toBeCloseTo(M['TOUR_COU']! * 10 + 30, -1);
  });
});

describe('historical and rare pieces', () => {
  it('Watteau pleat runs from the nape to the hem', () => {
    const r = gen(robe({}, [{ kind: 'WATTEAU_PLEAT', depthMm: 90 }]));
    const w = r.pieces.find((p) => p.name.startsWith('Pli Watteau'))!;
    const back = r.pieces.find((p) => p.name === 'Corsage Dos')!;
    const skirt = r.pieces.find((p) => p.name === 'Jupe Dos')!;
    expect(bbox(w.outlineMm).h).toBeCloseTo(bbox(back.outlineMm).h + bbox(skirt.outlineMm).h, -1);
  });

  it('bustle pad, pouf, panniers with their notions', () => {
    const pouf = gen(robe({}, [{ kind: 'BUSTLE', style: 'POUF' }]));
    expect(pouf.pieces.map((p) => p.name)).toEqual(expect.arrayContaining(['Coussin de tournure', 'Drapé de tournure (pouf)', 'Lien de tournure']));
    const paniers = gen(robe({}, [{ kind: 'BUSTLE', style: 'PANIERS' }]));
    expect(paniers.pieces.find((p) => p.name.startsWith('Panier'))!.quantity).toBe(4);
    expect(paniers.metadata.notions?.some((n) => /Cerceaux/.test(n.label))).toBe(true);
  });

  it('engageantes and balayeuse are sized off the sleeve hem and the skirt hem', () => {
    const r = gen(robe({ manches: 'CLOCHE' }, [{ kind: 'ENGAGEANTES', tiers: 2, depthMm: 100 }, { kind: 'BALAYEUSE', depthMm: 80 }]));
    expect(byName(r.pieces, /^Engageante — volant/)).toHaveLength(2);
    const b = r.pieces.find((p) => p.name.startsWith('Balayeuse'))!;
    const base = r.pieces.filter((p) => !/^(Engageante|Balayeuse)/.test(p.name));
    expect((bbox(b.outlineMm).w * b.quantity) / hemSweepMm(base)).toBeCloseTo(1.5, 1);
  });

  it('hem bands follow each skirt piece’s hem', () => {
    const r = gen(robe({ jupe: 'EN_LES' }, [{ kind: 'HEM_BANDS', rows: 2, widthMm: 50, gapMm: 40 }]));
    const skirts = byName(r.pieces, /^Jupe/);
    expect(byName(r.pieces, /^Bande appliquée/)).toHaveLength(2 * skirts.length);
  });

  it('bias, gusset, sash, bow, jabot, puff support, apron, pockets', () => {
    const r = gen(
      robe({ manches: 'SANS_MANCHES' }, [
        { kind: 'BIAS_BINDING', widthMm: 30 },
        { kind: 'UNDERARM_GUSSET', sizeMm: 100 },
        { kind: 'SASH', widthMm: 300, lengthMm: 3000 },
        { kind: 'BOW', place: 'MANCHES', widthMm: 150 },
        { kind: 'JABOT', lengthMm: 200, tiers: 3 },
        { kind: 'APRON', lengthMm: 500, fullness: 1.5 },
        { kind: 'SEAM_POCKETS' },
      ]),
    );
    const names = r.pieces.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Biais d’encolure', 'Biais d’emmanchure', 'Gousset de dessous de bras', 'Tablier', 'Fond de poche dans la couture']));
    expect(r.pieces.find((p) => p.name.startsWith('Écharpe'))!.quantity).toBe(2);
    expect(r.pieces.find((p) => p.name === 'Chou d’épaule — pans')!.quantity).toBe(4);
    expect(byName(r.pieces, /^Jabot plissé/)).toHaveLength(3);
    // Puff support without sleeves: a warning, no piece.
    const bare = gen(robe({ manches: 'SANS_MANCHES' }, [{ kind: 'PUFF_SUPPORT' }]));
    expect(bare.pieces.some((p) => p.name.startsWith('Soutien'))).toBe(false);
    expect(bare.warnings.some((w) => /Soutien de bouffant/.test(w))).toBe(true);
  });

  it('warns instead of adding skirt trims to a garment without a skirt', () => {
    const r = engine.generate(
      { garmentType: 'CHEMISE', cutType: 'DROITE', style: null, details: {}, construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 100, style: 'FRONCE' }, { kind: 'BALAYEUSE', depthMm: 50 }] } },
      { TOUR_COU: 38, TOUR_POITRINE: 100, TOUR_TAILLE: 88, TOUR_BASSIN: 100, LONGUEUR_DOS: 44, LONGUEUR_BRAS: 62, CARRURE_DOS: 42, TOUR_POIGNET: 17 },
    );
    expect(r.pieces.some((p) => /^(Volant|Balayeuse)/.test(p.name))).toBe(false);
    expect(r.warnings.filter((w) => /Volants d’ourlet|Balayeuse/.test(w))).toHaveLength(2);
  });
});

describe('embroidery, smocking, contrasting cuffs', () => {
  it('embroidery: a tracing template, its areas on the pieces (for the 3D) and the thread', () => {
    const r = gen(robe({ manches: 'LONGUES' }, [{ kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 60, color: '#aa2233' }, { kind: 'EMBROIDERY', place: 'OURLET', widthMm: 80 }]));
    expect(r.pieces.some((p) => p.name === 'Gabarit de broderie (encolure)')).toBe(true);
    expect(r.pieces.some((p) => p.name === 'Gabarit de broderie (bas de l’ourlet)')).toBe(true);
    const front = r.pieces.find((p) => p.name === 'Corsage Devant')!;
    expect((front.internalLinesMm ?? []).some((l) => l.detail?.pieces.includes('Gabarit de broderie (encolure)'))).toBe(true);
    expect(r.metadata.notions?.filter((n) => n.label.startsWith('Fil à broder'))).toHaveLength(2);
  });

  it('embroidery and smocking areas tell the 3D to draw a motif (thread colour for embroidery)', () => {
    const r = gen(robe({ manches: 'COURTES' }, [{ kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 60, color: '#aa2233' }, { kind: 'EMBROIDERY', place: 'OURLET', widthMm: 80 }, { kind: 'SMOCKING', place: 'TAILLE', rows: 6, ratio: 3 }]));
    const details = r.pieces.flatMap((p) => (p.internalLinesMm ?? []).map((l) => l.detail).filter((d) => d !== undefined));
    const neck = details.filter((d) => d.pieces.includes('Gabarit de broderie (encolure)'));
    const hem = details.filter((d) => d.pieces.includes('Gabarit de broderie (bas de l’ourlet)'));
    const smocks = details.filter((d) => d.pieces.some((n) => n.startsWith('Panneau à smocks')));
    expect(neck.length).toBeGreaterThan(0);
    expect(hem.length).toBeGreaterThan(0);
    expect(smocks.length).toBe(1);
    neck.forEach((d) => expect(d).toMatchObject({ motif: 'BRODERIE', color: '#aa2233', contrast: true }));
    hem.forEach((d) => {
      expect(d.motif).toBe('BRODERIE');
      expect(d.color).toBeUndefined();
    });
    expect(smocks[0]).toMatchObject({ motif: 'SMOCKS' });
    expect(smocks[0]!.contrast).toBeUndefined();
  });

  it('a hem embroidery is worked above the flounces, never hidden under them', () => {
    const items = (extra: ConstructionItem[]) => robe({ manches: 'COURTES' }, [{ kind: 'EMBROIDERY', place: 'OURLET', widthMm: 90 }, ...extra]);
    const bandBottom = (r: ReturnType<typeof gen>) => {
      const skirt = r.pieces.find((p) => p.name.startsWith('Jupe Devant'))!;
      const hem = Math.max(...skirt.outlineMm.map((p) => p.y));
      const area = skirt.internalLinesMm!.find((l) => l.detail?.motif === 'BRODERIE')!.detail!.area;
      return hem - Math.max(...area.map((p) => p.y));
    };
    expect(bandBottom(gen(items([])))).toBeLessThan(40);
    // Two tiers of 150 mm: the top one is sewn 150 × 1.75 ≈ 263 mm above the hem.
    expect(bandBottom(gen(items([{ kind: 'HEM_FLOUNCE', tiers: 2, depthMm: 150, style: 'FRONCE' }])))).toBeGreaterThanOrEqual(263);
  });

  it('smocking: a panel cut ratio × the finished width, laid on the piece, with shirring elastic', () => {
    const r = gen(robe({ manches: 'COURTES' }, [{ kind: 'SMOCKING', place: 'CORSAGE', rows: 8, ratio: 3 }]));
    const panel = r.pieces.find((p) => p.name === 'Panneau à smocks (plastron)')!;
    const front = r.pieces.find((p) => p.name === 'Corsage Devant')!;
    const area = front.internalLinesMm!.find((l) => l.detail?.pieces.includes(panel.name))!.detail!.area;
    const finished = 2 * Math.max(...area.map((p) => p.x));
    expect((bbox(panel.outlineMm).w * panel.quantity) / finished).toBeCloseTo(3, 1);
    expect(r.metadata.notions?.some((n) => /Fil élastique/.test(n.label))).toBe(true);
  });

  it('contrasting cuffs: a cuff round the sleeve hem, or the existing cuff cut in the contrasting cloth', () => {
    const plain = gen(robe({ manches: 'LONGUES' }, [{ kind: 'CONTRAST_CUFFS', heightMm: 60, color: '#ffffff' }]));
    const cuff = plain.pieces.find((p) => p.name === 'Poignet (contraste)')!;
    expect(cuff.quantity).toBe(2);
    expect(bbox(cuff.outlineMm).h).toBe(120);
    const gigot = gen(robe({ manches: 'BALLON' }, [{ kind: 'CONTRAST_CUFFS', heightMm: 60 }], { lengths: { sleevePct: 100 } }));
    expect(gigot.pieces.some((p) => p.name === 'Poignet (contraste)')).toBe(false);
    expect(gigot.pieces.find((p) => p.name === 'Poignet')!.fabricRecommendation).toMatch(/contrastant/);
    expect(gen(robe({ manches: 'SANS_MANCHES' }, [{ kind: 'CONTRAST_CUFFS', heightMm: 60 }])).warnings.some((w) => /Poignets contrastés/.test(w))).toBe(true);
  });
});

describe('3D placement of applied pieces (detail areas on the host pieces)', () => {
  it('bands, apron, Watteau pleat, sash and jabot each say where they lie', () => {
    const r = gen(
      robe({ manches: 'LONGUES' }, [
        { kind: 'HEM_BANDS', rows: 1, widthMm: 50, gapMm: 40 },
        { kind: 'APRON', lengthMm: 500, fullness: 1.5 },
        { kind: 'WATTEAU_PLEAT', depthMm: 80 },
        { kind: 'SASH', widthMm: 200, lengthMm: 2000 },
        { kind: 'JABOT', lengthMm: 180, tiers: 2 },
      ]),
    );
    const placed = new Set(r.pieces.flatMap((p) => (p.internalLinesMm ?? []).flatMap((l) => l.detail?.pieces ?? [])));
    for (const name of ['Tablier', 'Pli Watteau (panneau, milieu au pli)', 'Écharpe drapée (biais)', 'Jabot plissé — volant 1/2']) expect(placed.has(name), name).toBe(true);
    expect([...placed].some((n) => n.startsWith('Bande appliquée 1/1'))).toBe(true);
    for (const n of placed) expect(r.pieces.some((p) => p.name === n), n).toBe(true);
  });
});

describe('naming contract with the 3D preview', () => {
  const ALL: ConstructionItem[] = [
    { kind: 'HEM_FLOUNCE', tiers: 2, depthMm: 150, style: 'FRONCE' },
    { kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 150, style: 'CIRCULAIRE' },
    { kind: 'GODETS', count: 4, heightMm: 300, widthMm: 250 },
    { kind: 'PEPLUM', style: 'POINTES', depthMm: 150 },
    { kind: 'JABOT', lengthMm: 200, tiers: 2 },
    { kind: 'CAPELET', lengthMm: 200 },
    { kind: 'BOW', place: 'MANCHES', widthMm: 120 },
    { kind: 'BOW', place: 'DOS', widthMm: 250 },
    { kind: 'BOW', place: 'TAILLE', widthMm: 150 },
    { kind: 'BOW', place: 'ENCOLURE', widthMm: 100 },
    { kind: 'HEM_BANDS', rows: 2, widthMm: 40, gapMm: 40 },
    { kind: 'ENGAGEANTES', tiers: 2, depthMm: 80 },
    { kind: 'BALAYEUSE', depthMm: 70 },
    { kind: 'BUSTLE', style: 'POUF' },
    { kind: 'BUSTLE', style: 'PANIERS' },
    { kind: 'WATTEAU_PLEAT', depthMm: 80 },
    { kind: 'SEAM_POCKETS' },
    { kind: 'BIAS_BINDING', widthMm: 30 },
    { kind: 'UNDERARM_GUSSET', sizeMm: 100 },
    { kind: 'SASH', widthMm: 250, lengthMm: 2000 },
    { kind: 'PUFF_SUPPORT' },
    { kind: 'APRON', lengthMm: 500, fullness: 1.5 },
    { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50 },
    { kind: 'SMOCKING', place: 'MANCHES', rows: 6, ratio: 3 },
  ];
  // Words that make the preview drape a piece as a panel, a sleeve, a train, a petticoat or a trim.
  const FORBIDDEN = ['jupe', 'corsage', 'bustier', 'buste', 'empiecement', 'manche', 'devant', 'dos', 'cote', 'traine', 'jupon', 'berthe', 'plastron', 'cordeliere', 'ceinture', 'noeud', 'poignet', 'revers', 'lavalliere', 'chale', 'officier', 'pantalon', 'haut'];
  const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').toLowerCase();

  it('every construction piece is cuttable and its name never triggers a panel or trim in 3D', () => {
    const base = gen(robe({ manches: 'COURTES' }, []));
    const r = gen(robe({ manches: 'COURTES' }, ALL));
    const before = new Set(base.pieces.map((p) => p.name));
    const added = r.pieces.filter((p) => !before.has(p.name));
    expect(added.length).toBeGreaterThan(30);
    for (const p of added) {
      const n = normalize(p.name);
      expect(FORBIDDEN.filter((w) => n.includes(w)), p.name).toEqual([]);
      expect(n.startsWith('col'), p.name).toBe(false);
      expect(hasSelfIntersection(p.outlineMm), p.name).toBe(false);
    }
    expect(r.warnings.filter((w) => /contour|surface quasi nulle/.test(w))).toEqual([]);
  });
});
