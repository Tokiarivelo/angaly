import { describe, expect, it } from 'vitest';
import { detailAreasOf, drapePatch, isLining, mirrorPatch, PATCH_INSIDE_LIFT, PATCH_LAYER_LIFT, PATCH_LIFT, piecesNamed } from '../utils/garment3d/detail-patch';

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
  { x: 0, y: 50 },
  { x: 0, y: 0 },
];
/** A flat cloth facing +z: 1 mm = 1 mm. */
const flat = (x: number, y: number, lift: number): [number, number, number] => [x / 1000, -y / 1000, lift];

describe('detail patches', () => {
  it('reads the detail areas the engine put on a piece, skipping malformed ones', () => {
    const specs = detailAreasOf({
      internalLinesMm: [
        { kind: 'PLACEMENT', points: [], single: true, detail: { pieces: ['Parementure de braguette'], area: square, inside: true } },
        { kind: 'PLACEMENT', points: [], detail: { pieces: [], area: square } },
        { kind: 'PLACEMENT', points: [], detail: { pieces: ['Poche'], area: [{ x: 0, y: 0 }] } },
        { kind: 'WAIST', points: [] },
      ],
    });
    expect(specs).toEqual([{ pieces: ['Parementure de braguette'], area: square, inside: true, single: true, contrast: false, layer: 0 }]);
    expect(detailAreasOf(null)).toEqual([]);
  });

  it('covers the area with a grid on the cloth, lifted off it outside and under it inside, outlined by its seam', () => {
    const out = drapePatch(square, flat, false)!;
    const zs = out.positions.filter((_, k) => k % 3 === 2);
    expect(Math.min(...zs)).toBeCloseTo(PATCH_LIFT, 6);
    const xs = out.positions.filter((_, k) => k % 3 === 0);
    expect(Math.min(...xs)).toBeCloseTo(0, 6);
    expect(Math.max(...xs)).toBeCloseTo(0.1, 6);
    expect(Math.max(...out.indices)).toBeLessThan(out.positions.length / 3);
    // The outline runs all round: about 300 mm of seam.
    let seam = 0;
    for (let k = 0; k + 5 < out.border.length; k += 6) seam += Math.hypot(out.border[k + 3]! - out.border[k]!, out.border[k + 4]! - out.border[k + 1]!);
    expect(seam).toBeGreaterThan(0.29);
    const under = drapePatch(square, flat, true)!;
    expect(Math.max(...under.positions.filter((_, k) => k % 3 === 2))).toBeCloseTo(PATCH_INSIDE_LIFT, 6);
  });

  it('gives nothing for an area off the cloth or with no height', () => {
    expect(drapePatch(square, () => null, false)).toBeNull();
    expect(drapePatch([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 0, y: 0 }], flat, false)).toBeNull();
  });

  it('mirrors a patch onto the other half with its faces still turned out', () => {
    const p = drapePatch(square, flat, false)!;
    const m = mirrorPatch(p);
    expect(m.positions[3]).toBeCloseTo(-p.positions[3]!, 9);
    expect(m.indices.slice(0, 3)).toEqual([p.indices[0], p.indices[2], p.indices[1]]);
  });

  it('finds the pattern pieces a detail names, suffixed or not; pocket bags are lining', () => {
    const pieces = [
      { id: 'a', name: 'Parementure de braguette' },
      { id: 'b', name: 'Poche plaquée arrière (2)' },
      { id: 'c', name: 'Poche plaquée' },
    ];
    expect(piecesNamed(pieces, ['Poche plaquee arriere']).map((p) => p.id)).toEqual(['b']);
    expect(piecesNamed(pieces, ['Poche plaquée']).map((p) => p.id)).toEqual(['c']);
    expect(isLining(['Fond de poche arrière'])).toBe(true);
    expect(isLining(['Poche plaquée'])).toBe(false);
  });

  it('reads a contrasting detail and its layer, and lays a higher layer further out', () => {
    const square = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 40 }, { x: 0, y: 0 }];
    const [spec] = detailAreasOf({ internalLinesMm: [{ kind: 'PLACEMENT', points: square, detail: { pieces: ['Pan croisé'], area: square, contrast: true, layer: 1 } }] });
    expect(spec).toMatchObject({ contrast: true, layer: 1, inside: false });
    expect(detailAreasOf({ internalLinesMm: [{ kind: 'PLACEMENT', points: square, detail: { pieces: ['X'], area: square } }] })[0]).toMatchObject({ contrast: false, layer: 0 });
  });

  it('reads the motif and its thread colour, and ignores an unknown motif or a malformed colour', () => {
    const read = (detail: Record<string, unknown>) => detailAreasOf({ internalLinesMm: [{ kind: 'PLACEMENT', points: square, detail: { pieces: ['X'], area: square, ...detail } }] })[0]!;
    expect(read({ motif: 'BRODERIE', color: '#AA2233' })).toMatchObject({ motif: 'BRODERIE', color: '#aa2233' });
    expect(read({ motif: 'SMOCKS' })).toMatchObject({ motif: 'SMOCKS' });
    expect(read({ motif: 'SMOCKS' }).color).toBeUndefined();
    const odd = read({ motif: 'PAILLETTES', color: 'red' });
    expect(odd.motif).toBeUndefined();
    expect(odd.color).toBeUndefined();
    expect('motif' in read({})).toBe(false);
    const flat = (x: number, y: number, lift: number): [number, number, number] => [x / 1000, y / 1000, lift];
    expect(drapePatch(square, flat, false, 1)!.positions[2]).toBeCloseTo(PATCH_LIFT + PATCH_LAYER_LIFT, 6);
  });
});
