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
});
