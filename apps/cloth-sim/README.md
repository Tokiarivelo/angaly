# apps/cloth-sim — rendu réaliste par simulation de tissu (Blender headless)

Fiche : [`docs/features/realistic-render-blender.md`](../../docs/features/realistic-render-blender.md).
**Statut : phase 2 (worker + API) le 2026-10-16.** L'API tient la file (module `apps/api/src/realistic-render`) ;
le bouton du visualiseur web reste à faire (phase 3).

Le drapé géométrique de l'aperçu 3D sert de position de départ. Blender coud les panneaux entre eux, les laisse
tomber sur le mannequin, puis exporte le vêtement en `.glb`. La géométrie des pièces vient toujours de
`packages/pattern-engine` : ce service ne dessine aucune pièce.

## Contenu

| Chemin | Rôle |
|---|---|
| `tools/export-job.ts` | version (pièces + mesures) → job JSON : panneaux drapés sur le corps bras écartés, corps dans la pose demandée (bras ouverts pour laisser 2,5 cm au flanc, `simPose`), poids de bras |
| `cloth_sim/job.py` | lecture et validation du job (refusé avant de lancer Blender s'il est mal formé) |
| `cloth_sim/assemble.py` | nettoyage des panneaux (arêtes de moins de 3 mm effondrées, triangles dégénérés et doublons), fusion en un seul tissu |
| `cloth_sim/remesh.py` | arêtes de plus de 2,5 cm coupées, triangles en aiguille retournés |
| `cloth_sim/seams.py` | coutures déduites du drapé (contour ↔ contour), points d'attache des couches, ancrage des morceaux isolés |
| `cloth_sim/layers.py` | couches : parties cachées découpées (rien sous un nœud ou une cordelière), écart de 4 mm, tissu sorti de la peau et remonté au-dessus du sol, mesure des croisements, couches réempilées après la simulation (`restack`) |
| `cloth_sim/zones.py` | ordre des couches par zone, paires bras ↔ jupe jamais liées, bords libres (devants sur le plastron) |
| `cloth_sim/spatial.py` | plus proche voisin dans un rayon, sur grille (numpy seul : pas de scipy dans Blender) |
| `cloth_sim/prepare.py` | enchaîne tout cela : job → ce que Blender simule |
| `cloth_sim/support.py` | soutien d'une manche bouffante : flexion plus raide là où elle s'écarte du bras (triplure) |
| `cloth_sim/checks.py` | mesure du bras nu (manche qui a glissé ou traversé le bras) |
| `cloth_sim/look.py` | tissu de chaque panneau pour le rendu (couleur, motif, répétition, fini) d'après la photo ; broderie / smocks d'une zone de détail |
| `cloth_sim/motifs.py` | motifs des zones de détail (broderie : rinceaux et fleurs ; smocks : nid d'abeille), mêmes pixels que l'aperçu web |
| `cloth_sim/petticoat.py` | jupon sous une jupe longue (collision), des hanches à 12 cm au-dessus de l'ourlet, évidé autour des mains |
| `cloth_sim/measure_guide.py` | tracé de chaque mesure du catalogue sur le mannequin (tours = enveloppe convexe d'une coupe, longueurs sur la peau) |
| `scripts/render_measure_guide.py` | une image par mesure (mannequin en justaucorps, mètre doré) → `apps/web/public/images/measurement-guide` |
| `scripts/render_look.py` | matériaux Cycles (velours, satin, motifs procéduraux, peau, cheveux, yeux) et studio (fond arrondi sol + mur) |
| `cloth_sim/fabric.py` | `FabricBehavior` → paramètres de cloth Blender, masse par sommet rapportée à la surface |
| `scripts/simulate.py` | pilote Blender : simulation, mesures, `.glb` Draco, rendus Cycles avant/après |
| `cloth_sim/worker.py` | worker : prend un job à l'API, export + Blender sous délai, dépose le `.glb` par URL présignée, rend compte (`python -m cloth_sim.worker`) |
| `Dockerfile` (+ `Dockerfile.dockerignore`) | image du worker : Blender 4.5.14 officiel, Node + tsx + three pour l'export, `@angaly/types` compilé |
| `scripts/dump-version.sh` | dump d'une version (pièces, mesures, tissu) depuis le Postgres de dev |

`cloth_sim/` est du Python pur avec numpy. Il tourne dans le Python embarqué de Blender et sous pytest.

## Lancer le prototype

Blender **4.5 LTS** officiel, installé dans `apps/cloth-sim/.blender/` (ignoré par git, ≈ 1,2 Go, somme SHA-256
vérifiée). Pas le paquet Ubuntu : la 3.0.1 de jammy n'a pas de configuration de couleurs et ses rendus Cycles
sortent noirs.

```bash
make install.blender                                       # une fois
make job.cloth VERSION=c39fb679-f65b-41c0-98f8-b2b44197c2b0 # robe v2 → /tmp/angaly-cloth/job.json
make sim.cloth                                             # ≈ 6 min → garment.glb, metrics.json, before/after.png (rendus Cycles)
```

`make guide.cloth` refait les images du guide des mesures depuis le même job (≈ 1 min par image).
Le job porte aussi la tête de l'aperçu web (`head` : visage sculpté, couleurs de peau, chignon, yeux), rendue par Blender.

`CLOTH_OUT=…` change le dossier, `BLENDER=…` un autre binaire, `POSE=NEUTRE|PRESENTATION|MIROIR` la pose du job.

Options de `simulate.py` (via `ARGS`) : `--frames` (80), `--pose-frames` (40 : passage de la pose d'habillage à la
pose demandée), `--support` (flexion du ballon de manche, ×10 ; 1 = sans), `--quality` (pas du solveur, 5),
`--collision-quality` (3), `--body-thickness` (0,004 m), `--body-friction` (5 : frottement tissu/corps), `--no-lift`, `--no-petticoat`, `--above-hem` (0,06 m : arrêt du jupon au-dessus de l’ourlet), `--hem-taper` (0,03 m : bas du jupon rentré), `--petticoat-friction` (5), `--no-floor`, `--trace N` (positions toutes les N images), `--self-collision none|layers|all`
(`none` par défaut : les couches sont découpées, voir `layers.py` ; `layers` coûte ×3, `all` ×2,5), `--raw-layers`
(couches laissées telles quelles), `--no-export`, `--set champ=valeur` (surcharge de `ClothParams`, par exemple
`--set bending=5`). `settled.npy` contient les positions finales (repère three.js) pour diagnostiquer.

## Calibration des tissus (phase 4)

```bash
.venv/bin/python scripts/calibrate_fabrics.py cases.json OUT \
    [--variant nom:champ=valeur,…] [--threads 4] [--frames 80] [--pose PRESENTATION] [--remeasure]
```

`cases.json` : `[{"name": …, "versionId": …, "target": 1.8}, …]` (`target` = `fullness.skirt` lu sur la photo).
Chaque job est exporté une fois, puis simulé par variante sans export ni image ; `OUT/results.jsonl` (reprise après
interruption) et `OUT/summary.md` comparent la silhouette ourlet ÷ taille (`checks.silhouette`, taille prise à la
taille naturelle du corps) avant (drapé) et après simulation. `--remeasure` recalcule les silhouettes depuis
`settled.npy` sans resimuler. Résultats : `docs/features/realistic-render-blender.md` §18.

## Worker (phase 2)

```
API  POST /api/pattern-versions/:id/realistic-render       ← web (JWT, quota/jour, cache par clé de contenu)
     table realistic_renders (QUEUED → RUNNING → DONE | FAILED) = la file d'attente (SKIP LOCKED, pas de Redis)
     POST /api/internal/cloth-sim/jobs/claim                ← worker (Bearer CLOTH_SIM_WORKER_TOKEN)
          …/:id/upload-target → URL présignée (MinIO, bucket patterns)  ;  …/:id/done | …/:id/failed
```

```bash
make worker.cloth CLOTH_SIM_WORKER_TOKEN=<secret de l'API> ONCE=1   # un job contre http://localhost:3003/api
make docker.cloth                                                   # image angaly-cloth-sim
```

Le worker n'a ni accès à la base ni identifiants MinIO : tout passe par l'API. Le job ne contient ni nom ni identifiant
de cliente (mesures et pièces seulement). Variables : `docs/environment-variables.md` §9.

## Tests

```bash
make install.cloth       # une fois : .venv (numpy, pytest, ruff)
make test.cloth          # pytest + couverture ≥ 80 % (Python pur, sans Blender)
```
