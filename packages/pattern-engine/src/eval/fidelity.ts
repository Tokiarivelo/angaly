/**
 * Phase 5b S6 — pattern fidelity metrics: how far is the pattern generated from the PREDICTED
 * profile from the one generated from the LABELLED profile? Pure and deterministic; the engine is
 * the only source of geometry on both sides (ADR-005), so a gap measures the analysis, not the engine.
 */
import { PatternEngine } from '../pattern-engine';
import { AutreRule } from '../rules/autre.rule';
import { ChemiseRule } from '../rules/chemise.rule';
import { CostumeRule } from '../rules/costume.rule';
import { JupeRule } from '../rules/jupe.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { RobeRule } from '../rules/robe.rule';
import { VesteRule } from '../rules/veste.rule';
import type {
  MeasurementSet,
  PatternGenerationResult,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

type Point = { x: number; y: number };

const RASTER_STEP_MM = 5;
const BOUNDARY_STEP_MM = 10;

export function createDefaultEngine(): PatternEngine {
  const engine = new PatternEngine();
  for (const rule of [
    RobeRule,
    JupeRule,
    PantalonRule,
    VesteRule,
    ChemiseRule,
    CostumeRule,
    RobeMarieeRule,
    AutreRule,
  ]) {
    engine.registerRule(rule);
  }
  return engine;
}

/** Open ring translated so its bounding box starts at the origin (pieces are compared shape-to-shape). */
function normalizeRing(outline: Point[]): Point[] {
  const ring =
    outline.length > 1 &&
    outline[0]!.x === outline[outline.length - 1]!.x &&
    outline[0]!.y === outline[outline.length - 1]!.y
      ? outline.slice(0, -1)
      : outline;
  const minX = Math.min(...ring.map((p) => p.x));
  const minY = Math.min(...ring.map((p) => p.y));
  return ring.map((p) => ({ x: p.x - minX, y: p.y - minY }));
}

function inside(ring: Point[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** Intersection-over-union of two pieces, rasterised on a 5 mm grid. 1 = identical shape. */
export function contourIoU(a: Point[], b: Point[]): number {
  const ra = normalizeRing(a);
  const rb = normalizeRing(b);
  const maxX = Math.max(...ra.map((p) => p.x), ...rb.map((p) => p.x));
  const maxY = Math.max(...ra.map((p) => p.y), ...rb.map((p) => p.y));
  let both = 0;
  let either = 0;
  for (let x = RASTER_STEP_MM / 2; x < maxX; x += RASTER_STEP_MM) {
    for (let y = RASTER_STEP_MM / 2; y < maxY; y += RASTER_STEP_MM) {
      const ina = inside(ra, x, y);
      const inb = inside(rb, x, y);
      if (ina && inb) both++;
      if (ina || inb) either++;
    }
  }
  return either === 0 ? 0 : both / either;
}

function densify(ring: Point[]): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / BOUNDARY_STEP_MM));
    for (let s = 0; s < steps; s++) {
      out.push({ x: p.x + ((q.x - p.x) * s) / steps, y: p.y + ((q.y - p.y) * s) / steps });
    }
  }
  return out;
}

function directed(from: Point[], to: Point[]): number {
  let worst = 0;
  for (const p of from) {
    let best = Infinity;
    for (const q of to) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
    worst = Math.max(worst, best);
  }
  return worst;
}

/** Symmetric Hausdorff distance between outlines divided by the reference piece's bbox diagonal
 *  (0 = identical; 0.1 = worst point is off by 10 % of the piece size). */
export function normalizedHausdorff(reference: Point[], candidate: Point[]): number {
  const ra = normalizeRing(reference);
  const rb = normalizeRing(candidate);
  const diagonal = Math.hypot(
    Math.max(...ra.map((p) => p.x)),
    Math.max(...ra.map((p) => p.y)),
  );
  if (diagonal === 0) return 1;
  const da = densify(ra);
  const db = densify(rb);
  return Math.max(directed(da, db), directed(db, da)) / diagonal;
}

export interface PieceFidelity {
  name: string;
  /** false = the piece exists on one side only. */
  matched: boolean;
  iou: number;
  hausdorff: number;
}

export interface PatternComparison {
  pieces: PieceFidelity[];
  meanIoU: number;
  maxHausdorff: number;
  /** Pieces present on one side only. */
  unmatched: number;
}

/** Pieces are paired by name, in order of appearance (e.g. the two "Manche" pieces). */
export function comparePatterns(
  expected: PatternGenerationResult,
  actual: PatternGenerationResult,
): PatternComparison {
  const pool = new Map<string, PatternPieceGeometry[]>();
  for (const piece of actual.pieces) pool.set(piece.name, [...(pool.get(piece.name) ?? []), piece]);

  const pieces: PieceFidelity[] = [];
  for (const piece of expected.pieces) {
    const candidate = pool.get(piece.name)?.shift();
    pieces.push(
      candidate
        ? {
            name: piece.name,
            matched: true,
            iou: contourIoU(piece.outlineMm, candidate.outlineMm),
            hausdorff: normalizedHausdorff(piece.outlineMm, candidate.outlineMm),
          }
        : { name: piece.name, matched: false, iou: 0, hausdorff: 1 },
    );
  }
  for (const rest of pool.values()) {
    for (const piece of rest) {
      pieces.push({ name: piece.name, matched: false, iou: 0, hausdorff: 1 });
    }
  }
  const unmatched = pieces.filter((p) => !p.matched).length;
  return {
    pieces,
    unmatched,
    meanIoU: pieces.length ? pieces.reduce((s, p) => s + p.iou, 0) / pieces.length : 0,
    maxHausdorff: pieces.reduce((m, p) => Math.max(m, p.hausdorff), 0),
  };
}

export interface FidelityCase {
  id: string;
  /** Hand-made label. */
  expected: PatternParameters;
  /** What the analysis produced (after validation/merge). */
  predicted: PatternParameters;
  measurements: MeasurementSet;
}

export interface FidelityResult {
  id: string;
  /** The engine threw for the predicted profile (the labelled one failing is a bad case, reported too). */
  failed: boolean;
  error?: string;
  comparison?: PatternComparison;
  generationMs: number;
}

export function evaluateFidelityCase(c: FidelityCase, engine = createDefaultEngine()): FidelityResult {
  const started = performance.now();
  try {
    const expected = engine.generate(c.expected, c.measurements);
    const actual = engine.generate(c.predicted, c.measurements);
    return {
      id: c.id,
      failed: false,
      comparison: comparePatterns(expected, actual),
      generationMs: performance.now() - started,
    };
  } catch (error) {
    return {
      id: c.id,
      failed: true,
      error: error instanceof Error ? error.message : String(error),
      generationMs: performance.now() - started,
    };
  }
}

export interface FidelitySummary {
  cases: number;
  engineFailureRate: number;
  meanIoU: number | null;
  /** Share of successful cases whose every piece has IoU ≥ 0.9 and Hausdorff ≤ 0.05. */
  faithfulRate: number | null;
  meanGenerationMs: number;
}

export function summarizeFidelity(results: FidelityResult[]): FidelitySummary {
  const ok = results.filter((r) => !r.failed && r.comparison);
  const faithful = ok.filter(
    (r) => r.comparison!.pieces.every((p) => p.matched && p.iou >= 0.9 && p.hausdorff <= 0.05),
  );
  return {
    cases: results.length,
    engineFailureRate: results.length ? (results.length - ok.length) / results.length : 0,
    meanIoU: ok.length ? ok.reduce((s, r) => s + r.comparison!.meanIoU, 0) / ok.length : null,
    faithfulRate: ok.length ? faithful.length / ok.length : null,
    meanGenerationMs: results.length
      ? results.reduce((s, r) => s + r.generationMs, 0) / results.length
      : 0,
  };
}
