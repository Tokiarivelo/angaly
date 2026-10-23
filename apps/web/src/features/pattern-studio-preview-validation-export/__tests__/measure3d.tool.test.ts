import { it } from 'vitest';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import { bodyLandmarks } from '../utils/garment3d/body-model';

// Measuring tool, not a test: skipped unless MEASURE_DIR points at a folder of `{ pieces, fabricBehavior }` JSON files.
// Writes, next to it, the front-view silhouette of each draped dress: hem width ÷ waist width (what
// apps/ai-service/ml/scripts/silhouette_ratio.py reads on the photos).
const dir = process.env.MEASURE_DIR;
it.skipIf(!dir)('measure', () => {
  if (!dir) return;
  const out: Record<string, { waist: number; hem: number; ratio: number }> = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const { pieces, fabricBehavior } = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
    const built = buildGarmentModel(pieces, 'ROBE', { TOUR_COU: 36, CARRURE_DOS: 37, TOUR_BASSIN: 98, TOUR_TAILLE: 74, LONGUEUR_DOS: 42, TOUR_POITRINE: 92 }, undefined, fabricBehavior);
    if (!built.ok) continue;
    const l = bodyLandmarks(built.model.body);
    const widthAt = (y0: number, y1: number): number => {
      let w = 0;
      for (const p of built.model.panels) {
        if (p.zone === 'sleeve' || p.zone === 'cord') continue;
        for (let i = 0; i < p.positions.length; i += 3) {
          const y = p.positions[i + 1]!;
          if (y >= y0 && y <= y1) w = Math.max(w, 2 * Math.abs(p.positions[i]!));
        }
      }
      return w;
    };
    // Narrowest garment width around the waist, widest in the bottom 12 % of the skirt.
    let waist = Infinity;
    for (let y = l.waistY - 0.05; y <= l.waistY + 0.06; y += 0.01) {
      const w = widthAt(y - 0.012, y + 0.012);
      if (w > 0.05) waist = Math.min(waist, w);
    }
    let bottom = Infinity;
    for (const p of built.model.panels) for (let i = 1; i < p.positions.length; i += 3) bottom = Math.min(bottom, p.positions[i]!);
    const span = l.waistY - bottom;
    const hem = widthAt(bottom + span * 0.02, bottom + span * 0.14);
    out[file.replace(/\.json$/, '')] = { waist: +waist.toFixed(3), hem: +hem.toFixed(3), ratio: +(hem / waist).toFixed(2) };
  }
  writeFileSync(`${dir}/../measure3d.json`, JSON.stringify(out, null, 1));
});
