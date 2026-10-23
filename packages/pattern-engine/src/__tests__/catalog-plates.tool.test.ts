import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { createDefaultEngine } from '../eval/fidelity';
import type { PatternGenerationResult, PatternPieceGeometry } from '../types';
import { CATALOG_MEASUREMENTS, DRESS_CATALOG, type DressCase } from './fixtures/dress-catalog';

/**
 * Tool, not a test: draws one reference plate (SVG) per dress of the catalogue — every generated piece to scale, its
 * name, quantity, size, grainline and internal lines, plus the notions — and a JSON summary. Skipped unless
 * `PLATES_DIR` is set:
 *
 *   PLATES_DIR=/tmp/plates npx vitest run src/__tests__/catalog-plates.tool.test.ts
 */
const DIR = process.env['PLATES_DIR'];

const W = 1800;
const MARGIN = 24;
const HEADER = 120;
const GAP = 34;

type Kind = 'main' | 'lining' | 'interfacing' | 'trim' | 'construction' | 'inside';
const FILL: Record<Kind, string> = {
  main: '#e9dcc4',
  lining: '#d9dde3',
  interfacing: '#f4f1e8',
  trim: '#f1d9a8',
  construction: '#cfe3e8',
  inside: '#e6e0d6',
};
const LEGEND: Record<Kind, string> = {
  main: 'Tissu principal',
  lining: 'Doublure',
  interfacing: 'Entoilage',
  trim: 'Garnitures (berthe, volants de manche…)',
  construction: 'Pièces de construction (volants, godets, basque, tournure…)',
  inside: 'Parementures, coulisses, poches',
};

const kindOf = (p: PatternPieceGeometry, baseNames: Set<string>, trimNames: Set<string>): Kind => {
  if (/^doublure —/i.test(p.name)) return 'lining';
  if (/^entoilage —/i.test(p.name)) return 'interfacing';
  if (/parementure|coulisse|fond de poche|sous-patte|ceinture intérieure/i.test(p.name)) return 'inside';
  if (baseNames.has(p.name)) return 'main';
  if (trimNames.has(p.name)) return 'trim';
  return 'construction';
};

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function plate(c: DressCase, result: PatternGenerationResult, baseNames: Set<string>, trimNames: Set<string>): string {
  const pieces = result.pieces;
  const boxes = pieces.map((p) => {
    const xs = p.outlineMm.map((q) => q.x);
    const ys = p.outlineMm.map((q) => q.y);
    return { p, minX: Math.min(...xs), minY: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  });
  // Shelf packing at a common scale chosen so the plate stays about 1800 × 1300.
  const area = boxes.reduce((s, b) => s + (b.w + 120) * (b.h + 160), 0);
  let scale = Math.min(0.5, Math.sqrt(((W - 2 * MARGIN) * 1150) / area));
  const pack = (k: number) => {
    let x = MARGIN;
    let y = HEADER;
    let row = 0;
    const at: Array<{ x: number; y: number }> = [];
    for (const b of boxes) {
      const bw = Math.max(b.w * k, 110, (b.p.name.length + 4) * 5.6);
      if (x + bw > W - MARGIN && x > MARGIN) {
        x = MARGIN;
        y += row + GAP;
        row = 0;
      }
      at.push({ x, y });
      x += bw + GAP;
      row = Math.max(row, b.h * k + 30);
    }
    return { at, height: y + row + GAP };
  };
  let packed = pack(scale);
  while (packed.height > 1500 && scale > 0.05) {
    scale *= 0.92;
    packed = pack(scale);
  }
  const notions = result.metadata.notions ?? [];
  const H = packed.height + 40 + 20 * Math.ceil(notions.length / 2) + 40;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Math.round(H)}" viewBox="0 0 ${W} ${Math.round(H)}" font-family="Georgia, serif">`);
  out.push(`<rect width="100%" height="100%" fill="#faf7f1"/>`);
  out.push(`<text x="${MARGIN}" y="44" font-size="30" fill="#2b2118">${esc(c.title)}</text>`);
  out.push(`<text x="${MARGIN}" y="72" font-size="16" fill="#6b5a48">${esc(c.era)} — ${pieces.length} pièces, échelle 1:${Math.round(1 / scale)} (mm) — moteur Angaly, mensurations de référence</text>`);
  out.push(`<text x="${MARGIN}" y="96" font-size="14" fill="#6b5a48">${esc(c.notes)}</text>`);
  let lx = W - 520;
  (Object.keys(FILL) as Kind[]).forEach((k, i) => {
    const ly = 20 + i * 16;
    out.push(`<rect x="${lx}" y="${ly}" width="14" height="11" fill="${FILL[k]}" stroke="#5a4632" stroke-width="0.6"/>`);
    out.push(`<text x="${lx + 20}" y="${ly + 10}" font-size="12" fill="#5a4632">${esc(LEGEND[k])}</text>`);
  });
  lx += 0;
  boxes.forEach((b, i) => {
    const { x, y } = packed.at[i]!;
    const tx = (q: { x: number; y: number }) => `${(x + (q.x - b.minX) * scale).toFixed(1)},${(y + (q.y - b.minY) * scale).toFixed(1)}`;
    const kind = kindOf(b.p, baseNames, trimNames);
    const dash = kind === 'interfacing' ? ' stroke-dasharray="5 3"' : '';
    out.push(`<polygon points="${b.p.outlineMm.map(tx).join(' ')}" fill="${FILL[kind]}" stroke="#4a3826" stroke-width="1.1"${dash}/>`);
    for (const l of b.p.internalLinesMm ?? []) {
      const color = l.kind === 'BONE' ? '#2c5d8a' : l.kind === 'WAIST' ? '#7a7a7a' : '#b03a2e';
      if (l.buttons) {
        for (const q of l.points) {
          const [cx, cy] = tx(q).split(',');
          out.push(`<circle cx="${cx}" cy="${cy}" r="${Math.max(1.5, (l.buttons.diameterMm / 2) * scale)}" fill="#8a6a2a"/>`);
        }
      } else {
        out.push(`<polyline points="${l.points.map(tx).join(' ')}" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="6 3"/>`);
      }
    }
    // Grainline: an arrow through the grain origin, 40 % of the piece's height.
    const g = b.p.grainline;
    const len = Math.max(20, Math.min(b.h, b.w) * 0.4);
    const a = (g.angleDegrees * Math.PI) / 180;
    const ox = g.originX;
    const oy = g.originY;
    const p1 = tx({ x: ox - (Math.cos(a) * len) / 2, y: oy - (Math.sin(a) * len) / 2 });
    const p2 = tx({ x: ox + (Math.cos(a) * len) / 2, y: oy + (Math.sin(a) * len) / 2 });
    out.push(`<line x1="${p1.split(',')[0]}" y1="${p1.split(',')[1]}" x2="${p2.split(',')[0]}" y2="${p2.split(',')[1]}" stroke="#4a3826" stroke-width="0.9" marker-end="url(#arrow)"/>`);
    const label = `${b.p.name} ×${b.p.quantity}`;
    const size = `${Math.round(b.w / 10)} × ${Math.round(b.h / 10)} cm`;
    const ly = y + b.h * scale + 14;
    out.push(`<text x="${x}" y="${ly.toFixed(1)}" font-size="11" fill="#2b2118">${esc(label)}</text>`);
    out.push(`<text x="${x}" y="${(ly + 13).toFixed(1)}" font-size="10" fill="#7a6650">${size}</text>`);
  });
  out.splice(2, 0, '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#4a3826"/></marker></defs>');
  let ny = packed.height + 30;
  out.push(`<text x="${MARGIN}" y="${ny}" font-size="15" fill="#2b2118">Mercerie</text>`);
  notions.forEach((n, i) => {
    const col = i % 2;
    if (col === 0) ny += 20;
    const text = `${n.label}${n.quantity !== undefined ? ` — ${n.quantity}` : ''}${n.lengthMm !== undefined ? ` — ${(n.lengthMm / 1000).toFixed(2)} m` : ''}`;
    out.push(`<text x="${MARGIN + col * 880}" y="${ny}" font-size="12" fill="#5a4632">${esc(text)}</text>`);
  });
  if (result.metadata.yardage) {
    out.push(`<text x="${W - 520}" y="${packed.height + 30}" font-size="12" fill="#5a4632">Métrage indicatif : ${(result.metadata.yardage.lengthMm / 1000).toFixed(2)} m en ${result.metadata.yardage.fabricWidthMm / 10} cm</text>`);
  }
  out.push('</svg>');
  return out.join('\n');
}

it.skipIf(!DIR)('draws the catalogue plates', () => {
  const dir = DIR!;
  mkdirSync(dir, { recursive: true });
  const engine = createDefaultEngine();
  const summary: unknown[] = [];
  for (const c of DRESS_CATALOG) {
    const result = engine.generate(c.parameters, CATALOG_MEASUREMENTS);
    const bare = engine.generate({ ...c.parameters, construction: { items: [] }, trims: { items: [] } }, CATALOG_MEASUREMENTS);
    const noConstruction = engine.generate({ ...c.parameters, construction: { items: [] } }, CATALOG_MEASUREMENTS);
    const baseNames = new Set(bare.pieces.map((p) => p.name));
    const trimNames = new Set(noConstruction.pieces.map((p) => p.name).filter((n) => !baseNames.has(n)));
    writeFileSync(join(dir, `${c.id}.svg`), plate(c, result, baseNames, trimNames));
    summary.push({
      id: c.id,
      title: c.title,
      era: c.era,
      notes: c.notes,
      pieces: result.pieces.map((p) => ({ name: p.name, quantity: p.quantity, kind: kindOf(p, baseNames, trimNames) })),
      notions: result.metadata.notions ?? [],
      warnings: result.warnings,
      yardage: result.metadata.yardage,
    });
  }
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 1));
});
