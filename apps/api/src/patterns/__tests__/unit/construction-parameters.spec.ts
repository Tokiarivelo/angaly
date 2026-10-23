import {
  CONSTRUCTION_KINDS,
  CONSTRUCTION_LABELS,
  listPatternExtKeys,
  mergePatternExtParameters,
  validatePatternExtParameters,
  type ConstructionItem,
  type InspirationAnalysisSnapshot,
} from '@angaly/types';
import { InspirationParametersService } from '../../application/services/inspiration-parameters.service';
import { RobeRule, applyConstruction } from '@angaly/pattern-engine';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };

describe('construction pieces in parametersExtJson', () => {
  it('validates each item on its own and drops the invalid ones', () => {
    const { value, issues } = validatePatternExtParameters({
      construction: {
        items: [
          { kind: 'LINING', parts: ['CORSAGE', 'JUPE'] },
          { kind: 'HEM_FLOUNCE', tiers: 3, depthMm: 200, style: 'FRONCE', material: 'DENTELLE', color: '#eedd99' },
          { kind: 'GODETS', count: 1, heightMm: 300, widthMm: 200 },
          { kind: 'BOW', place: 'DOS', widthMm: 250 },
          { kind: 'BOW', place: 'MANCHES', widthMm: 120 },
          { kind: 'BOW', place: 'DOS', widthMm: 200 },
          { kind: 'NOPE' },
        ],
      },
    });
    expect(value.construction?.items.map((i) => i.kind)).toEqual(['LINING', 'HEM_FLOUNCE', 'BOW', 'BOW']);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(['construction.items[2].count', 'construction.items[5]', 'construction.items[6].kind']),
    );
  });

  it('rejects a malformed spec, keeps an explicit empty list', () => {
    expect(validatePatternExtParameters({ construction: [] }).issues[0]?.path).toBe('construction');
    expect(validatePatternExtParameters({ construction: { items: [] } }).value.construction).toEqual({ items: [] });
  });

  it('merges as one list: the first source that has one wins, and is listed', () => {
    const client = { construction: { items: [{ kind: 'SEAM_POCKETS' as const }] } };
    const photo = { construction: { items: [{ kind: 'LINING' as const }] } };
    const { value, origin } = mergePatternExtParameters(client, photo);
    expect(value.construction?.items).toEqual([{ kind: 'SEAM_POCKETS' }]);
    expect(origin.construction).toBe(0);
    expect(listPatternExtKeys(value)).toContain('construction');
  });

  it('labels every kind, and the engine accepts the validated items', () => {
    for (const k of CONSTRUCTION_KINDS) expect(CONSTRUCTION_LABELS[k]).toBeTruthy();
    const { value } = validatePatternExtParameters({ construction: { items: [{ kind: 'BALAYEUSE', depthMm: 80 }, { kind: 'LINING' }] } });
    const parameters = { garmentType: 'ROBE' as const, cutType: 'EVASEE', style: null, details: { longueur: 'SOL' }, construction: value.construction! };
    const out = applyConstruction(parameters, M, RobeRule.computePieces(parameters, M));
    expect(out.pieces.some((p) => p.name.startsWith('Balayeuse'))).toBe(true);
    expect(out.pieces.some((p) => p.name === 'Doublure — Jupe Devant')).toBe(true);
  });
});

describe('construction pieces read on the photo', () => {
  const service = new InspirationParametersService();
  const analysis = (construction: ConstructionItem[]): InspirationAnalysisSnapshot => ({
    features: {},
    profile: { isGarment: true, garmentType: 'ROBE', occasion: null, style: null, cutType: 'EVASEE', details: {}, construction },
  });
  const flounce: ConstructionItem = { kind: 'HEM_FLOUNCE', tiers: 2, depthMm: 150, style: 'FRONCE' };

  it('fills `construction` from the photo when the customer chose none, and says it came from the photo', () => {
    const merged = service.merge({ cutType: null, details: {} }, analysis([flounce]));
    expect(merged.ext.construction?.items).toEqual([flounce]);
    expect(merged.extKeysFromPhoto).toContain('construction');
  });

  it('the customer’s list (even empty) wins over the photo', () => {
    const none = service.merge({ cutType: null, details: {}, parametersExt: { construction: { items: [] } } }, analysis([flounce]));
    expect(none.ext.construction).toEqual({ items: [] });
    expect(none.extKeysFromPhoto).not.toContain('construction');
  });
});
