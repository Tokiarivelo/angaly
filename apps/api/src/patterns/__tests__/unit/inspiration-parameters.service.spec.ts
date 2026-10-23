import { PatternEngine, RobeRule } from '@angaly/pattern-engine';
import type { InspirationAnalysisSnapshot } from '@angaly/types';
import { InspirationParametersService } from '../../application/services/inspiration-parameters.service';

describe('InspirationParametersService', () => {
  const service = new InspirationParametersService();
  const analysis = (profile: Partial<NonNullable<InspirationAnalysisSnapshot['profile']>>) =>
    ({
      features: {},
      profile: {
        isGarment: true,
        garmentType: 'ROBE',
        occasion: null,
        style: null,
        cutType: 'PRINCESSE',
        details: {},
        ...profile,
      },
    }) as InspirationAnalysisSnapshot;

  it('never overrides a customer choice and ignores values the engine does not know', () => {
    const merged = service.merge(
      { cutType: null, details: { manches: 'LONGUES' } },
      analysis({ details: { manches: 'COURTES', col: 'EN_V', longueur: 'GALACTIQUE', inconnu: 'X' } }),
    );
    expect(merged.details).toEqual({ manches: 'LONGUES', col: 'EN_V' });
    expect(merged.fromPhotoKeys).toEqual(['col']);
    expect(merged.cutType).toBe('PRINCESSE');
  });

  it('keeps a shaped collar and drops the depth class the photo gave with it', () => {
    const merged = service.merge(
      { cutType: null, details: {} },
      analysis({ details: { col: 'EN_V', decollete: 'MOYEN', manches: 'COURTES' } }),
    );
    expect(merged.details).toEqual({ col: 'EN_V', manches: 'COURTES' });
    expect(merged.fromPhotoKeys).toEqual(['col', 'manches']);
    const round = service.merge({ cutType: null, details: {} }, analysis({ details: { col: 'ROND', decollete: 'SAGE' } }));
    expect(round.details).toEqual({ col: 'ROND', decollete: 'SAGE' });
  });

  it('keeps an off-the-shoulder neckline over a boat line read with it (the edge is the whole neckline)', () => {
    const merged = service.merge({ cutType: null, details: {} }, analysis({ details: { col: 'BATEAU', decollete: 'HORS_EPAULES' } }));
    expect(merged.details).toEqual({ decollete: 'HORS_EPAULES' });
    expect(merged.fromPhotoKeys).toEqual(['decollete']);
  });

  it('takes the garnitures read on the photo (berthe, frills, bead rows) unless the project has its own list', () => {
    const berthe = { kind: 'BERTHE', depthMm: 110, pointMm: 140, material: 'DENTELLE' } as const;
    const merged = service.merge({ cutType: null, details: {} }, analysis({ trims: [berthe] }));
    expect(merged.ext.trims).toEqual({ items: [berthe] });
    expect(merged.extKeysFromPhoto).toEqual(['trims']);
    const none = service.merge({ cutType: null, details: {}, parametersExt: { trims: { items: [] } } }, analysis({ trims: [berthe] }));
    expect(none.ext.trims).toEqual({ items: [] });
  });

  it('keeps the project cut, defaults to DROITE and ignores non-garment photos', () => {
    expect(service.merge({ cutType: 'SIRENE', details: {} }, analysis({})).cutType).toBe('SIRENE');
    const notGarment = analysis({ isGarment: false, details: { col: 'EN_V' } });
    expect(service.merge({ cutType: null, details: {} }, notGarment)).toEqual({
      cutType: 'DROITE',
      details: {},
      fromPhotoKeys: [],
      ext: {},
      extKeysFromPhoto: [],
    });
    expect(service.merge({ cutType: null, details: {} }, null).cutType).toBe('DROITE');
  });

  it('lists missing groups and accepts only valid non-overriding AI values', () => {
    expect(service.missingGroups({ manches: 'LONGUES' }, 'ROBE')).toEqual([
      'col', 'decollete', 'dos', 'longueur', 'fermeture', 'corsage', 'taille', 'devant', 'jupe', 'basque',
    ]);
    // Each garment its own groups: trousers are asked their rise, band, fly, pleats and pockets, never a collar.
    expect(service.missingGroups({ longueur: 'MAXI' }, 'PANTALON')).toEqual(['taille', 'ceinture', 'fermeture', 'plis', 'poches', 'poches_dos', 'bas']);
    expect(service.acceptSuggestedDetails({}, { col: 'ROND', poches: 'ITALIENNES' }, 'PANTALON').acceptedKeys).toEqual(['poches']);
    expect(service.acceptSuggestedDetails({}, { col: 'ROND', poches: 'ITALIENNES' }, 'ROBE').acceptedKeys).toEqual(['col']);
    const { details, acceptedKeys } = service.acceptSuggestedDetails(
      { manches: 'LONGUES' },
      { manches: 'COURTES', col: 'ROND', dos: 'NOPE' },
    );
    expect(details).toEqual({ manches: 'LONGUES', col: 'ROND' });
    expect(acceptedKeys).toEqual(['col']);
  });

  it('never takes a collar piece from the AI: a collar is read on the photo or chosen by the customer', () => {
    for (const col of ['OFFICIER', 'CHEMISIER', 'LAVALLIERE', 'CHALE']) {
      const { details, acceptedKeys } = service.acceptSuggestedDetails(
        { decollete: 'CARRE' },
        { col, dos: 'FERME' },
      );
      expect(details).toEqual({ decollete: 'CARRE', dos: 'FERME' });
      expect(acceptedKeys).toEqual(['dos']);
    }
    // Under a collar, no neckline depth either: the collar sits on its own neckline.
    expect(service.acceptSuggestedDetails({ col: 'OFFICIER' }, { decollete: 'MOYEN' }).acceptedKeys).toEqual([]);
    expect(service.acceptSuggestedDetails({ col: 'BATEAU' }, { decollete: 'MOYEN' }).acceptedKeys).toEqual([]);
    expect(service.acceptSuggestedDetails({ col: 'ROND' }, { decollete: 'MOYEN' }).acceptedKeys).toEqual(['decollete']);
    // A neckline (or no collar) may still be suggested.
    expect(service.acceptSuggestedDetails({}, { col: 'SANS_COL' }).details).toEqual({ col: 'SANS_COL' });
  });

  it('only advises on draped or mixed construction', () => {
    expect(service.drapingAdvice(null)).toBeNull();
    expect(service.drapingAdvice(analysis({ constructionMethod: 'FLAT_PATTERN' }).profile)).toBeNull();
    const draped = service.drapingAdvice(
      analysis({ constructionMethod: 'DRAPING', constructionNotes: 'Cascade.' }).profile,
    );
    expect(draped?.method).toBe('DRAPING');
    expect(draped?.warning).toContain('mannequin');
    expect(draped?.warning).toContain('Cascade.');
  });
  describe('extended fit (ease / fullness / lengths)', () => {
    const project = { cutType: null, details: {} };
    const photo = (fit: unknown, garmentType = 'ROBE') =>
      ({
        features: {},
        profile: { isGarment: true, garmentType, occasion: null, style: null, cutType: null, details: {}, fit },
      }) as any;

    it('takes the photo suggestions when the customer chose nothing, and traces them', () => {
      const merged = service.merge(
        project,
        photo({ ease: 'AMPLE', fullness: { skirt: 2 }, lengths: { skirtPct: 90 }, fabricBehavior: 'FLUIDE' }),
      );
      expect(merged.ext).toEqual({ ease: 'AMPLE', fullness: { skirt: 2 }, lengths: { skirtPct: 90 } });
      expect(merged.extKeysFromPhoto.sort()).toEqual(['ease', 'fullness.skirt', 'lengths.skirtPct']);
    });

    it('lets the customer win per key; the photo only fills the rest', () => {
      const merged = service.merge(
        { ...project, parametersExt: { ease: 'AJUSTE', fullness: { skirt: 1.5 } } },
        photo({ ease: 'AMPLE', fullness: { skirt: 3, sleeve: 1.5 } }),
      );
      expect(merged.ext).toEqual({ ease: 'AJUSTE', fullness: { skirt: 1.5, sleeve: 1.5 } });
      expect(merged.extKeysFromPhoto).toEqual(['fullness.sleeve']);
    });

    it('an explicit CONFORT from the customer beats an AMPLE suggestion', () => {
      const merged = service.merge({ ...project, parametersExt: { ease: 'CONFORT' } }, photo({ ease: 'AMPLE' }));
      expect(merged.ext.ease).toBe('CONFORT');
      expect(merged.extKeysFromPhoto).toEqual([]);
    });

    it('rejects out-of-range or mistyped photo values instead of clamping them', () => {
      const merged = service.merge(
        project,
        photo({ ease: 'GIGANTESQUE', fullness: { skirt: 9, sleeve: '2' }, lengths: { skirtPct: 90 } }),
      );
      expect(merged.ext).toEqual({ lengths: { skirtPct: 90 } });
    });

    it('ignores the fit of a non-garment photo and a missing fit', () => {
      const none = { features: {}, profile: { isGarment: false, fit: { ease: 'AMPLE' } } } as any;
      expect(service.merge(project, none).ext).toEqual({});
      expect(service.merge(project, null).ext).toEqual({});
      expect(service.merge(project, photo(undefined)).ext).toEqual({});
    });

    it('a roomy-dress photo yields a wider pattern than a close-fitting one (engine behaviour)', () => {
      const engine = new PatternEngine();
      [RobeRule].forEach((rule) => engine.registerRule(rule));
      const measurements = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
      const widthFor = (fit: unknown) => {
        const { ext, cutType, details } = service.merge(project, photo(fit));
        const result = engine.generate(
          { garmentType: 'ROBE', cutType, style: null, details, ...ext },
          measurements,
        );
        return result.pieces.reduce(
          (sum, p) => sum + Math.max(...p.outlineMm.map((pt) => pt.x)) - Math.min(...p.outlineMm.map((pt) => pt.x)),
          0,
        );
      };
      expect(widthFor({ ease: 'AMPLE' })).toBeGreaterThan(widthFor({ ease: 'AJUSTE' }));
      expect(widthFor({ ease: 'AMPLE' })).toBeGreaterThan(widthFor(undefined));
      expect(widthFor({ fullness: { skirt: 3 } })).toBeGreaterThan(widthFor({ fullness: { skirt: 1 } }));
    });
  });
});
