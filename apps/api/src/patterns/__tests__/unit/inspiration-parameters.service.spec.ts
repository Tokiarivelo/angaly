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
    expect(service.missingGroups({ manches: 'LONGUES' })).toEqual([
      'col', 'decollete', 'dos', 'longueur', 'fermeture',
    ]);
    const { details, acceptedKeys } = service.acceptSuggestedDetails(
      { manches: 'LONGUES' },
      { manches: 'COURTES', col: 'ROND', dos: 'NOPE' },
    );
    expect(details).toEqual({ manches: 'LONGUES', col: 'ROND' });
    expect(acceptedKeys).toEqual(['col']);
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
