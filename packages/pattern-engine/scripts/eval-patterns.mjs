#!/usr/bin/env node
// Phase 5b S6 — `make eval.patterns CASES=cases.json`
// cases.json = [{ id, expected: PatternParameters, predicted: PatternParameters, measurements }]
// Needs the package built (the make target does it). Prints a JSON report; exit 1 if any engine failure.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { evaluateFidelityCase, summarizeFidelity, createDefaultEngine } = require('../dist/index.js');

const file = process.argv[2];
if (!file) {
  console.error('usage: eval-patterns.mjs cases.json');
  process.exit(2);
}
const cases = JSON.parse(readFileSync(file, 'utf8'));
const engine = createDefaultEngine();
const results = cases.map((c) => evaluateFidelityCase(c, engine));
const summary = summarizeFidelity(results);
console.log(JSON.stringify({ summary, results }, null, 2));
process.exit(summary.engineFailureRate > 0 ? 1 : 0);
