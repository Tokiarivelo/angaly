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

## Constitution actuelle (2026-10-08) — jeu de départ, à enrichir
`manifest.jsonl` contient 27 entrées (17 vêtements, 10 non-vêtements) issues de **Wikimedia Commons**
(licences domaine public / CC0 / CC-BY / CC-BY-SA seulement ; auteur, page source et licence dans `source`/`license`).
```bash
cd apps/ai-service
.venv/bin/python ml/scripts/fetch_eval_photos.py --out ~/angaly-eval-images --per-category 12
# étiqueter dans labels.json (regarder chaque image), puis :
.venv/bin/python -m ml.scripts.build_eval_manifest ~/angaly-eval-images   # copie les images dans ~/angaly-eval-set
make eval.photo IMAGES=~/angaly-eval-set
```
**Limites à connaître** : (1) les étiquettes ont été posées par un assistant IA en regardant les images, pas par une
couturière — à faire valider avant de relever les seuils ; (2) Commons contient peu de photos de couture « propres »
(beaucoup de détails, d'expositions, de gravures) : il manque des mariées exploitables, des costumes, des drapés
nets et toute valeur `fit`/`drapeBlocks` ; (3) aucune clé de fournisseur n'était configurée, la seule exécution
faite est un prédicteur constant (« toujours ROBE ») qui sert de **plancher** : garmentType 23,5 %, faux positifs 100 %.
Toute baseline réelle doit battre ce plancher.
