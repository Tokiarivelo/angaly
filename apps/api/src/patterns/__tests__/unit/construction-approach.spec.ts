import { MANNEQUIN_SHEET_LIMITS, MANNEQUIN_SHEET_SECTION_IDS, type GarmentProfile } from '@angaly/types';
import { PatternEngine, RobeMarieeRule } from '@angaly/pattern-engine';
import { decideConstructionApproach } from '../../application/services/construction-approach';
import { buildMannequinSheet } from '../../application/services/mannequin-sheet';
import { InspirationParametersService } from '../../application/services/inspiration-parameters.service';

const profile = (over: Partial<GarmentProfile> = {}): GarmentProfile =>
  ({
    isGarment: true,
    garmentType: 'ROBE',
    occasion: null,
    style: null,
    cutType: null,
    details: {},
    ...over,
  }) as GarmentProfile;
const blocks = { drape: { blocks: [{ kind: 'GATHERED_SKIRT' as const, fullness: 2 }] } };

describe('decideConstructionApproach — truth table', () => {
  it.each([
    ['structured piece, no blocks', profile({ constructionMethod: 'FLAT_PATTERN' }), {}, 'FLAT_FULL'],
    ['no construction info at all', profile(), {}, 'FLAT_FULL'],
    ['regular drape built with blocks', profile({ constructionMethod: 'FLAT_PATTERN' }), blocks, 'FLAT_WITH_BLOCKS'],
    ['unknown method with blocks', profile(), blocks, 'FLAT_WITH_BLOCKS'],
    ['fitted base + free part', profile({ constructionMethod: 'MIXED' }), {}, 'FLAT_BASE_PLUS_MANNEQUIN'],
    ['mixed even when blocks cover the regular part', profile({ constructionMethod: 'MIXED' }), blocks, 'FLAT_BASE_PLUS_MANNEQUIN'],
    ['free drape', profile({ constructionMethod: 'DRAPING' }), {}, 'MANNEQUIN_ONLY'],
    ['free drape wins over any block', profile({ constructionMethod: 'DRAPING' }), blocks, 'MANNEQUIN_ONLY'],
  ])('%s → %s', (_label, p, ext, expected) => {
    expect(decideConstructionApproach(p, ext).approach).toBe(expected);
  });

  it('ignores the profile of a non-garment and handles null inputs', () => {
    expect(decideConstructionApproach(profile({ isGarment: false, constructionMethod: 'DRAPING' }), {}).approach).toBe('FLAT_FULL');
    expect(decideConstructionApproach(null, null).approach).toBe('FLAT_FULL');
    expect(decideConstructionApproach(undefined, { drape: { blocks: [] } }).approach).toBe('FLAT_FULL');
  });

  it('always explains itself', () => {
    for (const method of ['FLAT_PATTERN', 'MIXED', 'DRAPING'] as const) {
      expect(decideConstructionApproach(profile({ constructionMethod: method }), blocks).reason.length).toBeGreaterThan(20);
    }
  });
});

describe('buildMannequinSheet', () => {
  const notes = 'Bustier ajusté à tracer à plat ; jupe en tulle et traîne à draper sur mannequin.';

  it('builds nothing when everything is traced flat', () => {
    for (const approach of ['FLAT_FULL', 'FLAT_WITH_BLOCKS'] as const) {
      expect(buildMannequinSheet({ approach, profile: profile(), ext: blocks, flatYardageMm: 3000 })).toBeNull();
    }
  });

  it('has every mandatory section, in order, with the photo notes and an indicative yardage', () => {
    const sheet = buildMannequinSheet({
      approach: 'FLAT_BASE_PLUS_MANNEQUIN',
      profile: profile({ constructionMethod: 'MIXED', constructionNotes: notes, fit: { fabricBehavior: 'FLUIDE' } }),
      ext: { drape: { blocks: [{ kind: 'TRAIN', lengthMm: 900 }, { kind: 'COWL_NECK', depthMm: 150 }] } },
      flatYardageMm: 3200,
    })!;
    expect(sheet.indicative).toBe(true);
    expect(sheet.approach).toBe('FLAT_BASE_PLUS_MANNEQUIN');
    expect(sheet.sections.map((s) => s.id)).toEqual([...MANNEQUIN_SHEET_SECTION_IDS]);
    const body = (id: string) => sheet.sections.find((s) => s.id === id)!.body;
    expect(body('ZONES')).toContain('traîne à draper');
    expect(body('ZONES')).toContain('traîne, col bénitier');
    expect(body('GRAIN')).toContain('biais (45°)');
    expect(body('GRAIN')).toContain('Tissu fluide');
    expect(body('FABRIC')).toContain('3,2 m');
    expect(body('FABRIC')).toContain('1,3 m'); // +40 % drape allowance, rounded up to 10 cm
    expect(body('FABRIC')).toContain('indicative');
    expect(body('STEPS')).toContain('base ajustée');
    expect(body('CAUTIONS')).toContain('toile d’essai');
  });

  it('a free drape: no flat zone, tissue pinned directly, bigger fabric allowance', () => {
    const sheet = buildMannequinSheet({
      approach: 'MANNEQUIN_ONLY',
      profile: profile({ constructionMethod: 'DRAPING', constructionNotes: 'Cascade sur l’épaule.' }),
      ext: {},
      flatYardageMm: 2000,
    })!;
    expect(sheet.title).toContain('drapé sur mannequin');
    const body = (id: string) => sheet.sections.find((s) => s.id === id)!.body;
    expect(body('ZONES')).toContain('doublure');
    expect(body('STEPS')).toContain('directement sur le mannequin');
    expect(body('FABRIC')).toContain('3,2 m'); // 2.0 × 1.6
  });

  it('copes with missing notes and yardage, and stays within its limits even with long notes', () => {
    const bare = buildMannequinSheet({ approach: 'MANNEQUIN_ONLY', profile: null, ext: null, flatYardageMm: null })!;
    expect(bare.sections).toHaveLength(MANNEQUIN_SHEET_SECTION_IDS.length);
    expect(bare.sections.find((s) => s.id === 'FABRIC')!.body).toContain('marge généreuse');

    const long = buildMannequinSheet({
      approach: 'FLAT_BASE_PLUS_MANNEQUIN',
      profile: profile({ constructionNotes: 'x'.repeat(5000) }),
      ext: { drape: { blocks: [{ kind: 'TRAIN', lengthMm: 500 }] } },
      flatYardageMm: 4000,
    })!;
    for (const section of long.sections) expect(section.body.length).toBeLessThanOrEqual(MANNEQUIN_SHEET_LIMITS.sectionChars);
    expect(long.sections.reduce((n, s) => n + s.body.length, 0)).toBeLessThanOrEqual(MANNEQUIN_SHEET_LIMITS.totalChars);
  });
});

describe('photo → blocks (InspirationParametersService)', () => {
  const service = new InspirationParametersService();
  const analysis = (p: Partial<GarmentProfile>) => ({ features: {}, profile: profile(p) });

  it('takes the blocks the photo suggests and traces them', () => {
    const merged = service.merge(
      { cutType: null, details: {} },
      analysis({ constructionMethod: 'MIXED', drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }] }) as never,
    );
    expect(merged.ext.drape?.blocks).toEqual([{ kind: 'TRAIN', lengthMm: 900 }]);
    expect(merged.extKeysFromPhoto).toContain('drape');
  });

  it('the customer’s drape wins as a whole', () => {
    const merged = service.merge(
      { cutType: null, details: {}, parametersExt: { drape: { blocks: [{ kind: 'COWL_NECK', depthMm: 100 }] } } },
      analysis({ drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }] }) as never,
    );
    expect(merged.ext.drape?.blocks).toEqual([{ kind: 'COWL_NECK', depthMm: 100 }]);
    expect(merged.extKeysFromPhoto).not.toContain('drape');
  });

  it('never applies blocks to a free drape, and re-validates what the photo sent', () => {
    const draped = service.merge(
      { cutType: null, details: {} },
      analysis({ constructionMethod: 'DRAPING', drapeBlocks: [{ kind: 'TRAIN', lengthMm: 900 }] }) as never,
    );
    expect(draped.ext.drape).toBeUndefined();
    const bad = service.merge(
      { cutType: null, details: {} },
      analysis({ drapeBlocks: [{ kind: 'TRAIN', lengthMm: 99999 } as never, { kind: 'COWL_NECK', depthMm: 120 }] }) as never,
    );
    expect(bad.ext.drape?.blocks).toEqual([{ kind: 'COWL_NECK', depthMm: 120 }]);
  });
});

describe('acceptance scenarios', () => {
  const service = new InspirationParametersService();

  it('a train wedding dress → base + TRAIN block + mannequin sheet', () => {
    const photo = {
      features: {},
      profile: profile({
        garmentType: 'ROBE_MARIEE',
        constructionMethod: 'MIXED',
        constructionNotes: 'Bustier à plat ; jupe et traîne à draper.',
        drapeBlocks: [{ kind: 'TRAIN', lengthMm: 1000 }],
      }),
    };
    const merged = service.merge({ cutType: null, details: {} }, photo as never);
    const engine = new PatternEngine();
    engine.registerRule(RobeMarieeRule);
    const result = engine.generate(
      { garmentType: 'ROBE_MARIEE', cutType: merged.cutType, style: null, details: merged.details, ...merged.ext },
      { TOUR_POITRINE: 90, TOUR_TAILLE: 70, TOUR_BASSIN: 96, LONGUEUR_DOS: 41 },
    );
    const decision = decideConstructionApproach(photo.profile, merged.ext);
    const sheet = buildMannequinSheet({
      approach: decision.approach,
      profile: photo.profile,
      ext: merged.ext,
      flatYardageMm: result.metadata.yardage?.lengthMm,
    });
    expect(decision.approach).toBe('FLAT_BASE_PLUS_MANNEQUIN');
    expect(Math.max(...result.pieces.find((p) => p.name === 'Jupe Dos avec Traîne')!.outlineMm.map((p) => p.y))).toBeGreaterThan(1000);
    expect(sheet?.sections.map((s) => s.id)).toEqual([...MANNEQUIN_SHEET_SECTION_IDS]);
    expect(sheet?.sections.find((s) => s.id === 'FABRIC')?.body).toMatch(/m pour le patron à plat/);
  });

  it('a sari → mannequin only, no block, no misleading flat piece beyond the base', () => {
    const photo = {
      features: {},
      profile: profile({
        constructionMethod: 'DRAPING',
        constructionNotes: 'Entièrement drapé : plis en cascade depuis l’épaule.',
        drapeBlocks: [{ kind: 'GATHERED_SKIRT', fullness: 3 }], // the model must not, but the API is the safety net
      }),
    };
    const merged = service.merge({ cutType: null, details: {} }, photo as never);
    expect(merged.ext.drape).toBeUndefined();
    const decision = decideConstructionApproach(photo.profile, merged.ext);
    expect(decision.approach).toBe('MANNEQUIN_ONLY');
    expect(decision.reason).toContain('doublure');
    expect(service.drapingAdvice(photo.profile)?.warning).toContain('mannequin');
    expect(buildMannequinSheet({ approach: decision.approach, profile: photo.profile, ext: merged.ext, flatYardageMm: 1500 })).not.toBeNull();
  });
});
