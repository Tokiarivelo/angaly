# Jeu de référence (golden set) — analyse de photo

Objectif : mesurer si l'analyse s'améliore (Phase 5b S6). **Jamais utilisé pour l'entraînement (S7).**

## Contenu
- `manifest.jsonl` — versionné : un objet par ligne `{id, imagePath, source, license, category, expected}`.
  `expected` a la forme d'un `GarmentProfile` (camelCase, y compris `fit` et `drapeBlocks`). Chaque ligne est
  validée avec `normalize_profile` : une étiquette que l'application rejetterait fait échouer le chargement.
  `source` et `license` sont **obligatoires** (aucune photo d'origine inconnue).
- `thresholds.json` — seuils (`min` / `max`) sur les métriques du rapport.
- Les images : **hors dépôt**, bucket MinIO `ml-eval` (cible : 100–200 photos : robes, jupes, vestes, pantalons,
  costumes, mariées, drapés, non-vêtements). Les copier en local : `mc mirror local/ml-eval ./eval-images`.

## Lancer
```bash
make eval.photo IMAGES=./eval-images            # appelle le fournisseur par défaut, écrit ml/data/eval/out/report.{md,json}
make eval.photo PREDICTIONS=preds.jsonl         # hors ligne : JSONL {id, profile|null, raw?, latencyMs?, model?}
make eval.photo PREDICTIONS=preds.jsonl BASELINE=baseline.json FAIL=1   # mode bloquant sur régression
```
Un rapport contient : détection `isGarment` (rappel/précision/faux positifs), exactitude par champ, F1 par classe,
MAE de `fit.*`, F1 des blocs de drapé, taux de valeurs rejetées par la validation (si `raw` est fourni), latence,
détail par catégorie. Voir `docs/features/ai-inference.md`.

## Baseline
Copier un `report.json` validé en `baseline.json` (hors dépôt ou versionné) ; `--baseline` signale toute métrique clé
qui se dégrade de plus de `--tolerance` (0,02 par défaut).
