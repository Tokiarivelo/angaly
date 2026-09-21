/**
 * Sample (parameters, measurements) -> real pattern-engine geometry pairs, to train an
 * honest deep-learning pattern generator prototype in apps/ai-service/ml/.
 *
 * This is NOT synthetic/fabricated data: every sample is a real, exact output of
 * @angaly/pattern-engine's own deterministic IPatternRule implementations — the same code
 * that generates production PatternVersion geometry today. The model trained on this data
 * therefore learns to approximate pattern-engine, not to invent geometry from nothing.
 *
 * Run (from repo root, after `pnpm --filter @angaly/pattern-engine build`):
 *   node packages/pattern-engine/scripts/generate-training-data.js
 *
 * Writes apps/ai-service/ml/data/raw/pattern_geometry_samples.jsonl (gitignored, like the
 * other ml/data/raw/ training sources — see ml/scripts/train_measurement_model.py).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  PatternEngine,
  JupeRule,
  RobeRule,
  PantalonRule,
  VesteRule,
  ChemiseRule,
  CostumeRule,
  RobeMarieeRule,
  AutreRule,
} = require('../dist/index.js');

const SAMPLES_PER_TYPE = Number(process.env.SAMPLES_PER_TYPE || 1500);
const OUT_PATH = path.resolve(
  __dirname,
  '../../../apps/ai-service/ml/data/raw/pattern_geometry_samples.jsonl',
);

// Real AFNOR/ISO 8559-1 reference rows (packages/types/src/size-charts.ts), used as
// realistic anchor bodies — jittered per sample rather than sampled independently per key,
// so proportions stay anatomically plausible instead of e.g. a huge TOUR_POITRINE paired
// with a tiny TOUR_BASSIN.
const FEMME_CHART = [
  { TOUR_POITRINE: 80, TOUR_TAILLE: 62, TOUR_BASSIN: 86, LONGUEUR_DOS: 40.5 },
  { TOUR_POITRINE: 84, TOUR_TAILLE: 66, TOUR_BASSIN: 90, LONGUEUR_DOS: 41.0 },
  { TOUR_POITRINE: 88, TOUR_TAILLE: 70, TOUR_BASSIN: 94, LONGUEUR_DOS: 41.5 },
  { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42.0 },
  { TOUR_POITRINE: 96, TOUR_TAILLE: 78, TOUR_BASSIN: 102, LONGUEUR_DOS: 42.5 },
  { TOUR_POITRINE: 100, TOUR_TAILLE: 82, TOUR_BASSIN: 106, LONGUEUR_DOS: 43.0 },
  { TOUR_POITRINE: 104, TOUR_TAILLE: 86, TOUR_BASSIN: 110, LONGUEUR_DOS: 43.5 },
  { TOUR_POITRINE: 110, TOUR_TAILLE: 92, TOUR_BASSIN: 116, LONGUEUR_DOS: 44.0 },
  { TOUR_POITRINE: 116, TOUR_TAILLE: 98, TOUR_BASSIN: 122, LONGUEUR_DOS: 44.5 },
  { TOUR_POITRINE: 122, TOUR_TAILLE: 104, TOUR_BASSIN: 128, LONGUEUR_DOS: 45.0 },
];
const HOMME_CHART = [
  { TOUR_POITRINE: 88, TOUR_TAILLE: 76, TOUR_BASSIN: 92, LONGUEUR_DOS: 44 },
  { TOUR_POITRINE: 92, TOUR_TAILLE: 80, TOUR_BASSIN: 96, LONGUEUR_DOS: 44.5 },
  { TOUR_POITRINE: 96, TOUR_TAILLE: 84, TOUR_BASSIN: 100, LONGUEUR_DOS: 45 },
  { TOUR_POITRINE: 100, TOUR_TAILLE: 88, TOUR_BASSIN: 104, LONGUEUR_DOS: 45.5 },
  { TOUR_POITRINE: 104, TOUR_TAILLE: 92, TOUR_BASSIN: 108, LONGUEUR_DOS: 46 },
  { TOUR_POITRINE: 108, TOUR_TAILLE: 96, TOUR_BASSIN: 112, LONGUEUR_DOS: 46.5 },
  { TOUR_POITRINE: 112, TOUR_TAILLE: 100, TOUR_BASSIN: 116, LONGUEUR_DOS: 47 },
  { TOUR_POITRINE: 116, TOUR_TAILLE: 104, TOUR_BASSIN: 120, LONGUEUR_DOS: 47.5 },
];

const CUT_TYPES_GENERIC = ['DROITE', 'EVASEE', 'SIRENE', 'PRINCESSE', 'AJUSTEE', 'OVERSIZE'];
const CUT_TYPES_PANTS = ['DROITE', 'SLIM', 'CIGARETTE', 'LARGE', 'PALAZZO', 'FLUIDE'];

// Seeded PRNG (mulberry32) — deterministic sampling, so re-running this script produces the
// exact same dataset (mirrors ml/scripts/train_measurement_model.py's random_state=42).
const SEED = 42;
let rngState = SEED;
function nextRandom() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rand(min, max) {
  return min + nextRandom() * (max - min);
}

function jitter(value, spreadCm) {
  return Math.round((value + rand(-spreadCm, spreadCm)) * 10) / 10;
}

function sampleMeasurements(garmentType) {
  const chart = nextRandom() < 0.5 ? FEMME_CHART : HOMME_CHART;
  const base = chart[Math.floor(nextRandom() * chart.length)];

  const measurements = {
    TOUR_POITRINE: jitter(base.TOUR_POITRINE, 3),
    TOUR_TAILLE: jitter(base.TOUR_TAILLE, 3),
    TOUR_BASSIN: jitter(base.TOUR_BASSIN, 3),
    LONGUEUR_DOS: jitter(base.LONGUEUR_DOS, 1),
  };

  if (garmentType === 'CHEMISE' || garmentType === 'VESTE' || garmentType === 'COSTUME') {
    measurements.LONGUEUR_BRAS = Math.round(rand(55, 65) * 10) / 10;
  }
  if (garmentType === 'PANTALON' || garmentType === 'COSTUME') {
    measurements.LONGUEUR_JAMBE = Math.round(rand(95, 112) * 10) / 10;
  }
  if (garmentType === 'ROBE_MARIEE') {
    measurements.LONGUEUR_TRAINE = Math.round(rand(60, 280) * 10) / 10;
  }

  return measurements;
}

function sampleParameters(garmentType) {
  const cutTypes = garmentType === 'PANTALON' || garmentType === 'COSTUME'
    ? CUT_TYPES_PANTS
    : CUT_TYPES_GENERIC;
  return {
    garmentType,
    cutType: cutTypes[Math.floor(nextRandom() * cutTypes.length)],
    style: null,
    details: {},
  };
}

function buildEngine() {
  const engine = new PatternEngine();
  engine.registerRule(JupeRule);
  engine.registerRule(RobeRule);
  engine.registerRule(PantalonRule);
  engine.registerRule(VesteRule);
  engine.registerRule(ChemiseRule);
  engine.registerRule(CostumeRule);
  engine.registerRule(RobeMarieeRule);
  engine.registerRule(AutreRule);
  return engine;
}

function main() {
  const engine = buildEngine();
  const garmentTypes = [
    'ROBE',
    'JUPE',
    'PANTALON',
    'VESTE',
    'CHEMISE',
    'COSTUME',
    'ROBE_MARIEE',
    'AUTRE',
  ];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const out = fs.createWriteStream(OUT_PATH, { flags: 'w' });

  let total = 0;
  const perType = {};
  for (const garmentType of garmentTypes) {
    perType[garmentType] = 0;
    for (let i = 0; i < SAMPLES_PER_TYPE; i++) {
      const parameters = sampleParameters(garmentType);
      const measurements = sampleMeasurements(garmentType);
      const result = engine.generate(parameters, measurements);
      out.write(
        JSON.stringify({
          garmentType,
          parameters,
          measurements,
          pieces: result.pieces.map((p) => ({ name: p.name, outlineMm: p.outlineMm })),
        }) + '\n',
      );
      perType[garmentType]++;
      total++;
    }
  }
  out.end();

  console.log(`Wrote ${total} samples to ${OUT_PATH}`);
  console.log(perType);
}

main();
