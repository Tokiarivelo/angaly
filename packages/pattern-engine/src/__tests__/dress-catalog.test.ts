import { describe, expect, it } from 'vitest';
import { createDefaultEngine } from '../eval/fidelity';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { CATALOG_MEASUREMENTS, DRESS_CATALOG } from './fixtures/dress-catalog';

const engine = createDefaultEngine();

describe('dress catalogue — every case generates a complete, cuttable pattern', () => {
  it('has distinct ids and at least 30 dresses', () => {
    expect(new Set(DRESS_CATALOG.map((c) => c.id)).size).toBe(DRESS_CATALOG.length);
    expect(DRESS_CATALOG.length).toBeGreaterThanOrEqual(30);
  });

  for (const c of DRESS_CATALOG) {
    describe(`${c.id} — ${c.title}`, () => {
      const result = engine.generate(c.parameters, CATALOG_MEASUREMENTS);
      const names = result.pieces.map((p) => p.name);

      it('has every expected piece', () => {
        const missing = c.expect.filter((pattern) => !names.some((n) => new RegExp(pattern, 'i').test(n)));
        expect(missing, `pièces : ${names.join(' | ')}`).toEqual([]);
      });

      it('has none of the excluded pieces', () => {
        const present = (c.absent ?? []).filter((pattern) => names.some((n) => new RegExp(pattern, 'i').test(n)));
        expect(present, `pièces : ${names.join(' | ')}`).toEqual([]);
      });

      it('every piece is closed, finite, not self-crossing, with a positive quantity', () => {
        for (const p of result.pieces) {
          const first = p.outlineMm[0]!;
          const last = p.outlineMm[p.outlineMm.length - 1]!;
          expect(p.outlineMm.length, p.name).toBeGreaterThanOrEqual(4);
          expect(first, p.name).toEqual(last);
          expect(p.outlineMm.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y)), p.name).toBe(true);
          expect(hasSelfIntersection(p.outlineMm), p.name).toBe(false);
          expect(p.quantity, p.name).toBeGreaterThanOrEqual(1);
        }
      });

      it('raises no geometry warning', () => {
        const geometry = result.warnings.filter((w) => /contour|surface quasi nulle|coordonnées/.test(w));
        expect(geometry).toEqual([]);
      });
    });
  }
});
