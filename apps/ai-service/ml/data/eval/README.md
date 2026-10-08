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
`manifest.jsonl` : **116 entrées** (102 vêtements, 14 non-vêtements) — 26 robes, 14 robes de mariée (3 avec traîne →
`MIXED` + bloc `TRAIN`), 16 vestes, 11 chemises, 9 pantalons, 7 costumes, 5 jupes, 14 « autre » (capes, ensembles).
Sources (toutes à licence libre, auteur + page + licence dans `source`/`license`) :
- **The Met Open Access** (CC0, département Costume Institute) — 89 photos de musée propres : mannequin ou à plat,
  fond neutre, catégorie confirmée par le catalogue du musée. `fetch_met_photos.py`.
- **Wikimedia Commons** (domaine public / CC0 / CC-BY / CC-BY-SA, jamais NC) — 27 photos plus bruitées (portées,
  croquis, étalages, non-vêtements). `fetch_eval_photos.py`.
```bash
cd apps/ai-service
.venv/bin/python -m ml.scripts.fetch_met_photos --out ~/angaly-eval-met --per-tag 14
.venv/bin/python ml/scripts/fetch_eval_photos.py --out ~/angaly-eval-images --per-category 12
# étiqueter dans labels.json (regarder chaque image), puis :
.venv/bin/python -m ml.scripts.build_eval_manifest ~/angaly-eval-images ~/angaly-eval-met   # → ~/angaly-eval-set
make eval.photo IMAGES=~/angaly-eval-set
```
**Limites à connaître**
1. Les étiquettes ont été posées par un assistant IA en regardant les images (le type de vêtement des photos du Met
   est confirmé par le catalogue) — pas par une couturière : à faire valider avant de relever les seuils.
2. **Biais fort** : 89 photos sont des vêtements européens/américains du XVIIIᵉ–début XXᵉ siècle, sur mannequin de
   musée (68 % `MANNEQUIN`). Peu de photos portées, aucune tenue contemporaine ni malgache. Ce jeu mesure surtout la
   reconnaissance de la forme ; il **ne remplace pas** les photos de l'atelier (§11), qui doivent le compléter.
3. Étiquettes `fit`/`drapeBlocks` : seulement les 3 traînes visibles ; aucune ampleur/longueur en % (non mesurable
   à l'œil sans référence) → les MAE `fit.*` restent « n/a » tant que l'atelier n'a pas étiqueté.
4. Aucune clé de fournisseur n'était configurée : seul le prédicteur constant (« toujours ROBE ») a été exécuté ;
   il sert de **plancher** (voir le rapport). Toute baseline réelle doit le battre.
