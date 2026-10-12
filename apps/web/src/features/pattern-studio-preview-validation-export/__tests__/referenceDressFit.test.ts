import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { bodyLandmarks } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { vertexNormals } from '../utils/garment3d/surface-shading';
import reference from './fixtures/robe-pois-maxi.pieces.json';
import { loadHumanBase } from './helpers/humanBase';
import { rayCaster } from './helpers/rayCast';

/**
 * Replays the fit of apps/ai-service/ml/data/references/robe-pois-maxi.json: the pattern the engine
 * builds for the polka-dot maxi dress (frozen in fixtures/, regenerated from the reference's parameters),
 * draped on the fitted human body, must cover it the way the photo shows — round neck at the base of
 * the neck, shoulders and deltoids under the fabric, short sleeves, hem at the lower calf.
 */
const base = loadHumanBase();
const built = buildGarmentModel(reference.pieces as PatternPieceDto[], 'ROBE', reference.measurements, 'FEMME_STANDARD');
if (!built.ok) throw new Error(built.reason);
const { body, torsoRings, layout } = built.model;
const fit = fitHumanBody(base, body, torsoRings, morphFor(body, 'FEMME_STANDARD'));
const env = envelopeFromMesh(fit.positions, base.indices, base.armWeights, body);
const panels = drapeGarment(layout, body, env);
const l = bodyLandmarks(body);
const panel = (id: string): PanelMeshData => panels.find((p) => p.id === id)!;
const P = fit.positions;
const W = base.armWeights;
const COLUMNS = 28;

const extent = (zone: string, axis: 0 | 1 | 2): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of panels.filter((q) => q.zone === zone)) {
    for (let i = axis; i < p.positions.length; i += 3) {
      lo = Math.min(lo, p.positions[i]!);
      hi = Math.max(hi, p.positions[i]!);
    }
  }
  return [lo, hi];
};

/** Where the left sleeve ends along the left arm's axis (m from the shoulder joint). */
const sleeveEnd = (): number => {
  const arm = env.arm!;
  const sleeve = panels.find((p) => p.zone === 'sleeve' && p.id.endsWith('-1') && !p.id.endsWith('--1'))!;
  let end = -Infinity;
  for (let i = 0; i < sleeve.positions.length; i += 3) {
    end = Math.max(
      end,
      (sleeve.positions[i]! - arm.start.x) * arm.dir.x + (sleeve.positions[i + 1]! - arm.start.y) * arm.dir.y + (sleeve.positions[i + 2]! - arm.start.z) * arm.dir.z,
    );
  }
  return end;
};

describe('reference fit: polka-dot maxi dress (robe-pois-maxi)', () => {
  it('places every piece and fits bust and waist closely', () => {
    expect(built.model.ignored).toEqual([]);
    expect(panels.map((p) => p.zone).sort()).toEqual(['bodice', 'bodice', 'skirt', 'skirt', 'sleeve', 'sleeve']);
    // The midriff band is stacked under the gathered front, not dropped.
    expect(layout.pieceIds['bodice-front']).toHaveLength(2);
    for (const label of ['Poitrine', 'Taille'] as const) {
      const line = built.model.fit.find((f) => f.label === label)!;
      expect(line.easeCm).toBeGreaterThan(1);
      expect(line.easeCm).toBeLessThan(6);
    }
  });

  it('lets no skin through the bodice or the skirt', () => {
    for (const [zone, lo, hi] of [
      ['bodice', l.waistY + 0.01, env.armpitY],
      ['skirt', 0.3, l.waistY - 0.01],
    ] as const) {
      const outer = new Map<string, number>();
      const bin = (y: number, a: number): string => `${Math.round(y / 0.006)}|${Math.round(a / 0.1)}`;
      for (const p of panels.filter((q) => q.zone === zone)) {
        for (let i = 0; i < p.positions.length; i += 3) {
          const x = p.positions[i]!;
          const z = p.positions[i + 2]! - env.axisZ;
          const k = bin(p.positions[i + 1]!, Math.atan2(x, z));
          outer.set(k, Math.max(outer.get(k) ?? 0, Math.hypot(x, z)));
        }
      }
      let checked = 0;
      let through = 0;
      for (let i = 0; i < W.length; i += 1) {
        const y = P[i * 3 + 1]!;
        if (W[i]! >= 0.5 || y < lo || y > hi) continue;
        const x = P[i * 3]!;
        const z = P[i * 3 + 2]! - env.axisZ;
        const r = outer.get(bin(y, Math.atan2(x, z)));
        if (r === undefined) continue;
        checked += 1;
        if (Math.hypot(x, z) > r + 0.002) through += 1;
      }
      expect(checked).toBeGreaterThan(300);
      expect(through).toBe(0);
    }
  });

  it('covers the shoulders and the deltoids: the sleeve cap meets the bodice', () => {
    const cloth = rayCaster(panels);
    const skin = rayCaster([{ positions: P, indices: base.indices }]);
    const normals = vertexNormals(P, base.indices);
    const arm = env.arm!;
    const end = sleeveEnd();
    let checked = 0;
    let bare = 0;
    for (let i = 0; i < W.length; i += 1) {
      const x = P[i * 3]!;
      const y = P[i * 3 + 1]!;
      const z = P[i * 3 + 2]!;
      // Above the armpit (below the neckline) on the torso, or under the sleeve on the arm.
      const along = (Math.abs(x) - arm.start.x) * arm.dir.x + (y - arm.start.y) * arm.dir.y + (z - arm.start.z) * arm.dir.z;
      const covered = W[i]! < 0.5 ? y > env.armpitY && y < l.napeY - 0.07 : along < end - 0.015;
      if (!covered) continue;
      const n: [number, number, number] = [normals[i * 3]!, normals[i * 3 + 1]!, normals[i * 3 + 2]!];
      if (skin([x, y, z], n, 0.15, 0.004)) continue; // facing the body: hidden anyway
      checked += 1;
      if (!cloth([x, y, z], n, 0.06)) bare += 1;
    }
    expect(checked).toBeGreaterThan(200);
    expect(bare / checked).toBeLessThan(0.02);
  });

  it('meets the front and back shoulder seams on the shoulder', () => {
    // The seam: the last column of the rows above the armhole tip (≈ 4.5 cm down the flat pieces).
    const seam = (id: string): Array<[number, number, number]> => {
      const p = panel(id).positions;
      return Array.from({ length: 5 }, (_, i) => {
        const o = (i * (COLUMNS + 1) + COLUMNS) * 3;
        return [p[o]!, p[o + 1]!, p[o + 2]!];
      });
    };
    const back = seam('bodice-back');
    for (const [x, y, z] of seam('bodice-front')) {
      const gap = Math.min(...back.map(([bx, by, bz]) => Math.hypot(bx - x, by - y, bz - z)));
      expect(gap).toBeLessThan(0.012);
    }
  });

  it('cuts a round neckline at the base of the neck', () => {
    const neckR = body.neck / (2 * Math.PI);
    const front = panel('bodice-front').positions;
    let centre = -Infinity;
    let widest = 0;
    for (let i = 0; i <= 12; i += 1) {
      const o = i * (COLUMNS + 1) * 3; // first column: the neckline, then the centre front
      if (front[o]! < 0.002) centre = Math.max(centre, front[o + 1]!);
      else widest = Math.max(widest, front[o]!);
    }
    expect(centre).toBeLessThan(l.napeY - 0.04);
    expect(centre).toBeGreaterThan(l.bustY + 0.08);
    expect(widest).toBeGreaterThan(neckR);
    expect(widest).toBeLessThan(neckR + 0.025);
  });

  it('ends the short sleeve a few centimetres under the armpit and the hem at the lower calf', () => {
    const arm = env.arm!;
    const side = env.torso(env.armpitY)[24]!;
    const armpit = (side - arm.start.x) * arm.dir.x + (env.armpitY - arm.start.y) * arm.dir.y + (env.axisZ - arm.start.z) * arm.dir.z;
    const below = sleeveEnd() - Math.max(0, armpit);
    expect(below).toBeGreaterThan(0.05);
    expect(below).toBeLessThan(0.11);
    const [hem] = extent('skirt', 1);
    expect(hem).toBeGreaterThan(0.13);
    expect(hem).toBeLessThan(0.19);
    // Flared like the photo: the hem is ~2.6 times as wide as the waist, seen from the front.
    const [x0, x1] = extent('skirt', 0);
    expect((x1 - x0) / (2 * Math.max(...torsoRings.filter((r) => Math.abs(r.y - l.waistY) < 0.02).map((r) => r.a)))).toBeGreaterThan(2.2);
  });

  it('gathers the front above the midriff seam and draws that seam', () => {
    const front = panel('bodice-front');
    // Two seam rows: the outline plus one line across the panel (both halves), under the bust.
    const ys: number[] = [];
    for (let k = 1; k < front.border.length; k += 3) ys.push(front.border[k]!);
    const seamYs = ys.filter((y) => y > l.waistY + 0.04 && y < l.bustY - 0.02);
    expect(seamYs.length).toBeGreaterThan(20);
    // Folds: just above the seam the front's depth ripples more than on the smooth upper chest.
    const ripple = (y0: number): number => {
      const zs: number[] = [];
      for (let i = 0; i < front.positions.length / 2; i += 3) if (Math.abs(front.positions[i + 1]! - y0) < 0.004 && Math.abs(front.positions[i]!) < 0.08) zs.push(front.positions[i + 2]!);
      let r = 0;
      for (let i = 1; i < zs.length - 1; i += 1) r += Math.abs(zs[i]! - (zs[i - 1]! + zs[i + 1]!) / 2);
      return r / Math.max(1, zs.length - 2);
    };
    const seamY = Math.min(...seamYs);
    expect(ripple(seamY + 0.025)).toBeGreaterThan(2 * ripple(l.bustY + 0.06));
  });

  it('keeps the neck point on the shoulder line, not standing up the neck', () => {
    for (const id of ['bodice-front', 'bodice-back']) {
      const p = panel(id).positions;
      // From the neck point (first row) to the seam one row down: the shoulder's slope (≈ 0.3), where
      // the ridge climbing the neck made it twice as steep.
      const o = ((COLUMNS + 1) + COLUMNS) * 3;
      const slope = (p[1]! - p[o + 1]!) / Math.max(1e-3, Math.abs(p[o]!) - Math.abs(p[0]!));
      expect(slope).toBeLessThan(0.45);
    }
  });

  it('lays the fabric on every panel with flat-fabric coordinates for a print', () => {
    for (const p of panels) {
      expect(p.uvs.length).toBe((p.positions.length / 3) * 2);
      expect(p.uvs.every((v) => Number.isFinite(v))).toBe(true);
    }
  });
});
