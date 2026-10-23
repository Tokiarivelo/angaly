# Boucle de vérification photo ↔ patron ↔ 3D

## Environnement (dev local)

| Service | Port | Lancement |
|---|---|---|
| Web Angaly | **3100** (le 3000 est un autre projet) | `cd apps/web && pnpm exec next dev --port 3100` |
| API NestJS | 3003 | `cd apps/api && API_CORS_ORIGINS=http://localhost:3000,http://localhost:3100 node --enable-source-maps dist/main` |
| ai-service | 8001 | `cd apps/ai-service && .venv/bin/uvicorn app.main:app --port 8001` |
| MinIO / Postgres | 9000 / 5432 | `docker compose up -d` |

- L'API lit `packages/pattern-engine/dist` et `packages/types/dist` : après une modification du moteur ou des types,
  `pnpm --filter @angaly/pattern-engine build` (et/ou `@angaly/types`) **puis redémarrer l'API**. Sans `API_CORS_ORIGINS`, le web
  reçoit des erreurs CORS et la page n'affiche rien.
- Le web (Next dev) recharge seul les changements de `apps/web`.
- Arrêter l'API : `pkill -f "enable-source-maps dist/mai[n]"` (les crochets évitent de tuer le shell qui lance la commande).
- Comptes du seed : `client@angaly.mg` / `Client@Angaly2026!`, `admin@angaly.mg` / `Admin@Angaly2026!`. Les projets sont
  **réservés à leur propriétaire** : un autre compte reçoit 403 (et la page affiche « Projet de patron introuvable »).
- Fournisseur de vision : un seul (`ai_provider_configs`). « credit balance is too low » dans le log de l'ai-service = plus de
  crédits ; ne pas contourner, le signaler (et lire la photo soi-même si l'utilisateur le demande, §1 du skill).

## Scripts (`apps/ai-service/ml/scripts/`, images toujours **hors dépôt**)

| Étape | Commande |
|---|---|
| Photos libres de droits | `fetch_met_dresses.py --out ~/angaly-dress-met --since 1880`, `fetch_eval_photos.py`, `fetch_sleeve_data.py` |
| Photo → analyse → projet → patron | `.venv/bin/python dress_benchmark.py --images <dossier> --out <dir>` (écrit `results.json`) |
| Appliquer une lecture écrite à la main | `apply_profile_analysis.py --results <dir>/results.json --analysis ml/data/…json [--only photo.jpg]` |
| Capture 3D face + côté | `node ml/scripts/dress_3d_capture.mjs <results.json> <out>` (`WAIT_MS`, `EMAIL`, `PASSWORD`) |
| Planche photo \| 3D | `python3 ml/scripts/dress_compare_sheet.py --results … --captures <out> --photos <dossiers…> --out <dir>` |
| Superposition alignée | `python3 ml/scripts/dress_overlay_aligned.py photo.jpg front.png out.png --photo-collar … --body-hem …` |
| Ourlet ÷ taille (photo) | `python3 ml/scripts/silhouette_ratio.py photo.jpg` |
| Ourlet ÷ taille (3D, exact) | `cd apps/web && MEASURE_DIR=<dossier de {pieces, fabricBehavior}.json> npx vitest run src/features/pattern-studio-preview-validation-export/__tests__/measure3d.tool.test.ts` → `<dossier>/../measure3d.json` |
| Fiche de revue | `python3 ml/scripts/dress_benchmark_report.py --results … --notes ml/data/dress_benchmark_notes.json --out ../../docs/reviews/dress-benchmark.md` |

Python système (`python3`) a Pillow + numpy ; le venv de l'ai-service a httpx (scripts qui appellent l'API).
Une capture prend ~25 s par robe : lancer les séries longues en arrière-plan et attendre la fin du log, pas de `sleep` en chaîne.

## Recaler l'ampleur (exemple de la session du 2026-10-14)

```
cible = min(3,6, ratio_photo × 0,85)        # 0,85 : taille corsetée → mannequin moderne
fullness_neuf = clamp(fullness × cible / ratio_3D, 1, 4), arrondi à 0,1
```
Exclure les mesures faussées (traîne, trois-quarts, fond sombre) et les corriger à l'œil. Une ou deux itérations suffisent.

## Débogage numérique de la 3D (plus fiable qu'une capture)

Un test Vitest jetable dans `apps/web/src/` qui charge les pièces d'un projet (`GET /api/pattern-projects/:id` →
`currentVersion.pieces`), appelle `buildGarmentModel(pieces, 'ROBE', mesures)` et imprime, par rang, les étendues x/y/z d'un
panneau (manche : 49 rangs × 32 sommets). Il a permis de trouver la « lame » (anneau aplati), les « ailes » (manche de 5 cm) et
le jour à la taille (rangs biseautés). **Le supprimer** une fois le problème compris ; garder un vrai test de non-régression.

## Grille de jugement

- ✅ silhouette, longueur, taille, col, famille et volume de manche, ouverture/devant, couleur conformes ; seules manquent des
  garnitures non modélisées.
- ⚠️ au moins un élément structurel faux : le noter avec sa cause (lecture, moteur, 3D) et l'étage à corriger.
- Toujours regarder **face et côté** ; un volume peut être juste de face et plat de profil (ou l'inverse).
