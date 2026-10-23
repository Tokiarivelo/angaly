import { canonicalJson, renderCacheKey } from '../../application/services/render-cache-key';
import { makeSource } from './fixtures';

describe('renderCacheKey', () => {
  it('sorts object keys at every level', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, { f: 1, e: 0 }], c: null } })).toBe(
      '{"a":{"c":null,"d":[2,{"e":0,"f":1}]},"b":1}',
    );
    expect(canonicalJson({ a: undefined, b: 1 })).toBe('{"b":1}');
    expect(canonicalJson(undefined)).toBe('null');
  });

  it('ignores piece ids, version id and piece order', () => {
    const source = makeSource();
    const regenerated = makeSource({
      versionId: 'version-2',
      pieces: [...source.pieces].reverse().map((p) => ({ ...p, id: `${p.id}-new`, versionId: 'version-2' })),
    });
    expect(renderCacheKey(regenerated, 'PRESENTATION', '1')).toBe(renderCacheKey(source, 'PRESENTATION', '1'));
  });

  it('changes with the geometry, the measurements, the fabric, the pose and the simulator revision', () => {
    const source = makeSource();
    const base = renderCacheKey(source, 'PRESENTATION', '1');
    const [first, ...rest] = source.pieces;
    const variants = [
      makeSource({ pieces: [{ ...first, dimensionsJson: { widthMm: 301 } }, ...rest] }),
      makeSource({ measurements: { TOUR_POITRINE: 91, TOUR_TAILLE: 70 } }),
      makeSource({ fabricBehavior: 'STRUCTURE' }),
      makeSource({ fit: { primaryColor: '#000000' } }),
    ];
    for (const variant of variants) {
      expect(renderCacheKey(variant, 'PRESENTATION', '1')).not.toBe(base);
    }
    expect(renderCacheKey(source, 'MIROIR', '1')).not.toBe(base);
    expect(renderCacheKey(source, 'PRESENTATION', '2')).not.toBe(base);
  });
});
