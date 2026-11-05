---
name: pattern-generation
description: "Angaly Pattern Studio — lire une photo d'inspiration, la traduire en paramètres, générer le patron (packages/pattern-engine), le vérifier en 3D contre la photo et itérer jusqu'à la conformité ; ajouter une option de détail (manche, col, devant, fermeture…) de bout en bout. À utiliser pour TOUTE tâche qui touche à la génération ou à la création de patron, à l'analyse d'inspiration, au rendu 3D d'un vêtement, ou quand un patron « ne ressemble pas » à son modèle."
---

# /pattern-generation — de la photo au patron conforme

Ce skill condense ce qui a été appris en réglant 38 robes réelles (banc d'essai, `docs/reviews/dress-benchmark.md`).
Il s'applique à tout agent (Claude Code, Cursor, Antigravity). Les règles absolues de `CLAUDE.md` restent prioritaires :
**`packages/pattern-engine` est la seule source de géométrie** (déterministe, sans dépendance), l'ai-service n'est appelé
que par le module NestJS `ai-inference`, types partagés dans `@angaly/types`, tests dans le même changement.

Argument facultatif : un id de projet (`/pattern-studio/projects/<id>`), une photo, ou une option à ajouter.

## 0. Avant de toucher au code (5 min, obligatoire)

1. Lire `docs/handoff.md` et la ligne concernée de `docs/checklist-implementation.md`.
2. Situer la tâche dans le pipeline — **un défaut se corrige à l'étage où il naît**, jamais en compensant plus loin :

```
photo ─► vision (ai-service, garment_knowledge.py) ─► GarmentProfile {cutType, details, fit, drapeBlocks}
      ─► API InspirationParametersService.merge (+ parametersExtJson du projet, prioritaire)
      ─► pattern-engine RobeRule… (pièces, mm) ─► 3D web garment-model.ts / collar-model.ts ─► comparaison photo
```

| Symptôme | Étage fautif probable | Où regarder |
|---|---|---|
| Mauvaise famille (gigot au lieu de petite manche bouffante, col oublié) | lecture | `DETAIL_OPTIONS` + règles de décision de `garment_knowledge.py` |
| Bonne lecture, pièce absente ou fausse | moteur | `rules/<type>.rule.ts`, `shared/shapes.ts`, `shared/fit.ts`, `shared/cut-profile.ts` |
| Pièce juste, rendu faux (lame, aile, jour, pli absent) | 3D | `utils/garment3d/garment-model.ts` (`drapeSleeve`, `drapeHalfPanel`), `collar-model.ts` |
| Pièce « ignorée » en 3D | classification 3D | `classifyPiece`, `collarKindOf`, `layout.trims` |
| Ampleur/longueur fausse malgré la bonne famille | calibration | `fullness`, `lengths` — mesurer, ne pas deviner (§3) |

## 1. Lire la photo (analyse)

Suivre `references/photo-reading-guide.md` (règles de décision, pièges, calibration de l'ampleur, couleurs).
Points qui ont causé le plus d'erreurs :
- **Petites manches bouffantes = `COURTES` + `fullness.sleeve` 1,5–2,5 + `lengths.sleevePct` ≈ 20–25.** `BALLON` = gigot **long**.
- `lengths.sleevePct` est un **% du bras entier** (100 = poignet, 59 cm par défaut), pas de la manche choisie.
- `fullness.skirt` = largeur d'ourlet ÷ largeur de taille vues de face : **la mesurer** (`silhouette_ratio.py`), × 0,85 si la taille
  de la photo est corsetée (robes anciennes), plafond 3,6 ; une traîne ou une vue de trois-quarts fausse la mesure.
- Col visible ⇒ toujours un `col` (sinon le patron n'a pas de pièce col). Revers en V = `CHALE`.
- Robe-manteau ouverte sur un panneau d'une autre couleur = `devant: MANTEAU_OUVERT` (+ `fermeture: CORDELIERE` si un lien
  la retient) + `fit.contrastColor`.
- `fabricColor` / `motifColor` / `contrastColor` en `#rrggbb` : la 3D en dépend autant que la géométrie pour « ressembler ».

Si le fournisseur de vision de l'app est indisponible (crédits, clé), l'agent peut lire lui-même la photo et écrire le profil
dans le même format (exemple : `apps/ai-service/ml/data/dress_benchmark_opus_analysis.json`) puis l'appliquer avec
`ml/scripts/apply_profile_analysis.py`. Toujours le dire à l'utilisateur ; ces étiquettes ne sont **pas** validées par une
couturière et n'entrent pas dans l'entraînement.

## 2. Générer

- Le projet porte : `cutType`, `detailsJson`, `parametersExtJson` (`ease`, `fullness`, `lengths`, `drape.blocks` — une liste
  **vide explicite** supprime les blocs), `inspirationAnalysisJson.profile` (dont `fit.fabric*` pour la 3D).
  `parametersExtJson` l'emporte sur la photo à la fusion.
- Générer : `POST /api/pattern-projects/:id/generate {measurements}` (chaque génération = nouvelle version, l'historique reste).
- Bornes : `packages/types/src/pattern-fit.ts` (`FULLNESS_BOUNDS`, `LENGTH_BOUNDS`, blocs de drapé). Vocabulaire et effet de
  chaque option sur le moteur : `references/vocabulary.md`.

## 3. Vérifier contre la photo — boucle obligatoire

Une génération n'est « conforme » que si la 3D a été **comparée à la photo**. Procédure complète, commandes, ports, comptes et
pièges d'environnement : `references/verification-loop.md`. En bref :

1. capturer la 3D face + côté (`ml/scripts/dress_3d_capture.mjs`, connecté en **propriétaire** du projet) ;
2. planche photo | 3D (`dress_compare_sheet.py`) ou superposition alignée (`dress_overlay_aligned.py`) ;
3. mesurer ourlet ÷ taille sur la photo (`silhouette_ratio.py`) et sur la géométrie drapée
   (`MEASURE_DIR=… npx vitest run …/measure3d.tool.test.ts`) ; recaler `fullness.skirt` ;
4. lister les écarts **structurels** (famille de manche, col, ouverture, longueurs, volume, silhouette) séparément des
   garnitures non modélisées (volants, jabots, ceintures, broderies) ;
5. corriger à l'étage fautif (§0), régénérer, recapturer — **jusqu'à ce qu'il ne reste que des garnitures**, ou qu'une limite
   du moteur soit identifiée et notée.

## 4. Ajouter ou modifier une option (manche, col, devant, fermeture…)

Une option touche jusqu'à 10 endroits ; en oublier un casse un test de synchronisation ou laisse l'option muette.
Suivre `references/adding-an-option.md` (liste de contrôle fichier par fichier, tests à écrire, pièges 3D).

## 5. Clore

- Tests : `pnpm --filter @angaly/pattern-engine test`, `cd apps/web && npx vitest run src/features/pattern-studio-preview-validation-export src/features/pattern-studio-wizard`,
  `cd apps/api && npx jest src/patterns src/ai-inference`, `cd apps/ai-service && .venv/bin/python -m pytest -q`, `pnpm typecheck`.
- Docs : `docs/features/pattern-engine.md` (vocabulaire, géométrie), `docs/features/patterns.md` (flux), la fiche de revue si un
  banc a été rejoué (`dress_benchmark_report.py`), puis **`docs/handoff.md`** (étape 8 du processus d’`AGENTS.md`).
- Rapport à l'utilisateur : ce qui correspond, ce qui reste différent (avec la cause), liens `http://localhost:3100/pattern-studio/projects/<id>`
  et le compte propriétaire.

## Ne jamais

- Faire produire de la géométrie à l'IA, ou contourner le moteur pour « coller » à une photo.
- Ajuster une constante 3D pour masquer une pièce fausse (ou l'inverse).
- Baisser `PUFF_CROWN_SHARE` sous 0,6 (le test `referenceDressFit` détecte alors une épaule nue).
- Comparer à l'œil sans capture, ou déclarer conforme sans avoir regardé la face **et** le côté.
- Laisser `parametersExtJson`, `detailsJson` et `inspirationAnalysisJson.profile` se contredire.
