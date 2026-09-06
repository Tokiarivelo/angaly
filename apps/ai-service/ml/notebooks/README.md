# Training notebooks

Empty by design (Phase 0). Phase 5 (`docs/phases/phase-5-ai-avancee.md`) adds
exploratory notebooks here for:

- inspiration-photo feature extraction (silhouette/sleeve/neckline classification),
- measurement → style-parameter suggestion.

Notebooks are never imported by `app/` — they produce a trained artifact
(ONNX or similar) that `ml/scripts/` exports and `app/inference.py` loads.
Notebook outputs/checkpoints are gitignored; commit the notebook source only.
