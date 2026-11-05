# Rendu réaliste par simulation de tissu (Blender headless)

> Statut : **phases 2 (worker + API, §16) et 3 (web, §17) faites le 2026-10-16**, après le prototype (§10 à §15).
> e2e Playwright du parcours en place. Phase 4 (calibration des tissus, 2026-10-20, §18) : bug des milieux non cousus corrigé, paramètres de tissu confirmés ; §19 : petite manche plus cousue par son bord libre (ourlet bfc4 −134 → −47 mm), jupon arrêté à 6 cm de l’ourlet, RIGIDE assoupli, STRETCH vérifié. Code : `apps/cloth-sim/`, `apps/api/src/realistic-render/`,
> `apps/web/src/features/pattern-studio-preview-validation-export/` (`RealisticRender*`).
> Les prix des hébergeurs ont été relevés le 2026-10-15 et changent souvent : les revérifier avant toute décision.

## 1. Pourquoi

La 3D actuelle (`apps/web/.../utils/garment3d/`) est un **drapé géométrique** : chaque pièce est posée sur une
enveloppe du corps par des règles (anneaux, `pushOutside`, évasements). Elle est instantanée et ne dépend d'aucun
serveur, mais elle ne simule ni la gravité, ni le poids du tissu, ni les plis, ni les collisions entre pièces. D'où :

- un tissu qui a l'air **rigide** (aucun pli de gravité, aucun tombé) ;
- des raccords qu'il faut corriger cas par cas (col / dos, bras / manche, triangles d'épaule).

Une **simulation physique de tissu** résout ces trois problèmes d'un coup : les pièces du patron sont cousues
ensemble puis tombent sur le mannequin sous l'effet de la gravité. Blender (libre, GPL) sait le faire **sans
interface** (`blender -b`), en ligne de commande, sur un serveur.

## 2. Principe retenu

On garde **les deux** rendus :

| | Aperçu 3D actuel | Rendu réaliste (Blender) |
|---|---|---|
| Délai | instantané, dans le navigateur | 2 à 6 min (estimation), en tâche de fond |
| Coût serveur | 0 | quelques centimes par rendu (§6) |
| Usage | itérer sur le patron | valider, montrer à la cliente, fiche produit |
| Déclenchement | automatique | bouton « Rendu réaliste » |

Ce choix respecte les règles 18–20 de `CLAUDE.md` :

- **la géométrie des pièces vient toujours de `packages/pattern-engine`**. Blender ne dessine aucune pièce : il
  simule seulement le tombé des pièces que le moteur a produites (contours en mm) ;
- le service Blender est appelé **uniquement par l'API NestJS**, comme `ai-service`. Jamais depuis `apps/web`.

## 3. Le flux

```
[web] bouton « Rendu réaliste »
   │  POST /api/pattern-versions/:id/realistic-render          (react-query)
   ▼
[api] RequestRealisticRenderUseCase
   │  - calcule une clé = hash(pièces + mesures + pose + tissu)
   │  - si un rendu DONE existe déjà pour cette clé → le renvoie (cache)
   │  - sinon insère une ligne RealisticRender {status: QUEUED}
   ▼
[cloth-sim worker]  (conteneur Python + Blender 4.5 LTS, réseau Docker interne)
   │  1. prend le plus ancien job QUEUED (SELECT … FOR UPDATE SKIP LOCKED) → RUNNING
   │  2. lit l'entrée : pièces (mm), coutures, crans, mannequin ajusté, tissu
   │  3. blender -b -P simulate.py -- job.json
   │       a. maille chaque pièce à plat (triangles ≈ 1 cm)
   │       b. la place autour du corps : position de départ = le drapé géométrique actuel
   │       c. coud les bords appariés (« sewing springs » de Blender)
   │       d. corps = objet de collision ; 60 à 150 images de simulation
   │       e. exporte la dernière image en glTF binaire (.glb, compressé Draco)
   │  4. dépose le .glb dans MinIO via @angaly/storage (URL présignée fournie par l'API)
   │  5. status DONE (ou FAILED + raison), durée enregistrée
   ▼
[web] interroge GET …/realistic-render/:renderId toutes les 5 s → charge le .glb (three GLTFLoader)
```

### Points de conception

- **File d'attente sans Redis** : la production n'a pas de Redis (`docker-compose.prod.yml`). Une table Postgres
  `RealisticRender` + `SKIP LOCKED` suffit tant que le volume reste sous quelques milliers de rendus par jour. Passer
  à BullMQ ou à un service de file d'attente seulement si ce n'est plus le cas.
- **Départ = drapé actuel** : partir du drapé géométrique plutôt que de pièces à plat évite l'étape la plus fragile
  (enrouler et coudre les pièces autour du corps). Blender n'a plus qu'à relâcher le tissu, ce qui demande moins
  d'images et moins de temps. Le travail déjà fait sur `garment-model.ts` reste donc utile.
- **Mannequin** : le corps ajusté aux mesures (`fitHumanBody`, `applyPose`) est aujourd'hui en TypeScript dans
  `apps/web`. Deux options :
  1. **(recommandé)** déplacer ces modules purs dans un paquet partagé (`packages/garment3d`) que l'API appelle pour
     produire le corps, envoyé au worker en `.glb` ;
  2. faire envoyer par le web le corps calculé (plus simple, mais l'API doit faire confiance à une géométrie du client).
- **Tissu** : une table de correspondance (type de tissu de `fit.fabric*` → paramètres de cloth Blender : masse,
  raideur en tension, en flexion, amortissement). Départ des préréglages Blender (coton, soie, denim, cuir), puis
  calibration sur photos (§8, phase 4).
- **Pose** : la robe est drapée bras écartés, puis le corps est amené dans la pose demandée pendant la simulation
  (§12). Bras ouverts juste assez pour que la manche ait sa place : le visualiseur doit poser le mannequin avec la
  pose simulée (`simPose` du job), pas la pose demandée. Changer de pose relance un rendu.
- **Matériaux et couleurs** : le `.glb` ne transporte que la géométrie et les UV. Le web y applique les mêmes
  textures de tissu que l'aperçu actuel (`fabricTextures`), donc l'apparence reste cohérente.
- **Garde-fous** : délai maximum de 10 min (le processus Blender est tué au-delà), un seul job par conteneur,
  entrée validée (Pydantic) avant de lancer Blender, quota par utilisateur (par exemple 10 rendus par jour) pour
  maîtriser le coût.

## 4. Le conteneur `cloth-sim`

- Emplacement proposé : `apps/cloth-sim/` (Python). C'est un service à part, et non un module de `ai-service`, parce
  que l'image est lourde et que son profil de charge est différent (CPU 100 % pendant plusieurs minutes).
- Image : `ubuntu:24.04` + archive officielle **Blender 4.5 LTS**, épinglée à une version exacte, plus les
  bibliothèques système (`libxi6 libxrender1 libxkbcommon0 libsm6 libgl1`). Taille ≈ 1 Go.
- **Pas de GPU** : la simulation de tissu de Blender tourne sur CPU. Un GPU ne servirait que pour une image
  photoréaliste calculée par Cycles (option hors périmètre, §9).
- Besoin estimé par job : **4 vCPU, 4 à 8 Go de RAM**. Un vêtement de 20 à 40 k sommets dure de 2 à 6 min (à mesurer).
- Licence : Blender est sous GPL. L'exécuter sur nos serveurs n'impose rien : la GPL ne s'applique qu'à la
  redistribution, et les fichiers `.glb` produits nous appartiennent. Ne pas distribuer l'image Docker
  publiquement sans y joindre la licence et les sources de Blender.

## 5. Où l'héberger en ligne : trois options

### A. Sur le VPS actuel (même `docker-compose.prod.yml`)

Ajouter un service `cloth-sim` avec `deploy.resources.limits.cpus: '2'` et une seule tâche à la fois.

- **Coût en plus : 0 €** si le VPS a de la marge, sinon passer à une offre supérieure (≥ 6 vCPU, 12 Go conseillés).
- Limite : environ 12 à 20 rendus par heure. Pendant une simulation, le site partage le CPU (d'où la limite à 2 vCPU).
- **Idéal pour le lancement** : rien à câbler en plus, tout reste sur le réseau Docker interne, MinIO est local.

### B. Un VPS dédié au worker, allumé en permanence

Le worker interroge la base de l'API (ou un petit endpoint interne protégé) au travers d'un tunnel privé
(WireGuard ou réseau privé de l'hébergeur).

| Offre (exemples, prix HT, à revérifier) | vCPU / RAM | Prix par mois |
|---|---|---|
| Hetzner CPX22 (vCPU partagés), tarif de juin 2026 | 2 / 4 Go | ≈ 19,49 € |
| Hetzner CCX13 (vCPU dédiés), tarif de juin 2026 | 2 / 8 Go | ≈ 43 € |
| Équivalents OVHcloud, Scaleway, Contabo | 4 / 8 Go | ≈ 10 à 40 € selon l'offre |

Hetzner a fortement augmenté ses prix cloud en 2026 (+30 à 37 % en avril, jusqu'à +176 % sur CPX et CCX le 15 juin
pour les nouvelles commandes). Comparer avec les autres hébergeurs avant de choisir.

- Coût fixe, prévisible, et le site principal n'est jamais ralenti.
- Pertinent à partir de quelques centaines de rendus par mois.

### C. Serverless « à la seconde » (Google Cloud Run Jobs, Modal, AWS Batch/Fargate)

L'API lance un job dans le cloud. Le conteneur démarre, simule, dépose le `.glb` puis s'éteint. **On ne paie que les
secondes de calcul.**

Calcul pour un rendu type de **4 vCPU, 8 Gio, 5 min (300 s)** :

| Plateforme | Tarif (relevé le 2026-10-15) | Coût par rendu | Gratuit par mois |
|---|---|---|---|
| Cloud Run Jobs (tier 1) | 0,000018 $/vCPU·s + 0,000002 $/Gio·s | 4×300×0,000018 + 8×300×0,000002 ≈ **0,026 $** | 240 000 vCPU·s et 450 000 Gio·s, soit ≈ **185 rendus** |
| Modal (préemptible) | 0,0000131 $/cœur physique·s (1 cœur = 2 vCPU) + 0,00000222 $/Gio·s | 2×300×0,0000131 + 8×300×0,00000222 ≈ **0,013 $** | crédit de 30 $/mois (offre Starter), soit ≈ 2 000 rendus |
| Modal (non préemptible) | tarif ×3 | ≈ **0,04 $** | idem |
| AWS Fargate | ≈ 0,040 $/vCPU·h + 0,0044 $/Go·h | ≈ **0,016 $** | non |

- Le démarrage à froid d'une image de 1 Go prend 10 à 40 s : c'est acceptable pour une attente de quelques minutes.
- Le `.glb` doit revenir dans MinIO, chez nous. Le job le dépose directement par une URL présignée produite par
  l'API, ce qui évite d'exposer MinIO.
- Hors Europe ou hors du VPS : vérifier le RGPD. Les mesures corporelles sont des données personnelles. Le job ne
  reçoit qu'un mannequin anonyme (maillage + pièces), sans nom ni identifiant de cliente, et on choisit une région UE.

## 6. Coût total selon le volume

Hypothèse : 5 min et 4 vCPU par rendu. Le cache évite de recalculer un rendu identique.

| Rendus par mois | A. VPS actuel | B. VPS dédié | C. Cloud Run Jobs | C. Modal (préemptible) |
|---|---|---|---|---|
| 100 | 0 € | 20 à 45 € | 0 $ (gratuit) | 0 $ (crédit) |
| 1 000 | 0 € (à la limite de capacité) | 20 à 45 € | ≈ 21 $ | ≈ 0 $ (13 $ − 30 $ de crédit) |
| 10 000 | impossible (≈ 14 rendus/h maximum) | 2 à 3 workers, 60 à 130 € | ≈ 255 $ | ≈ 100 $ |

S'y ajoutent :

- **Stockage** : un `.glb` compressé pèse 2 à 8 Mo. 10 000 rendus ≈ 50 Go sur le disque MinIO du VPS. Il faut une
  purge des rendus des anciennes versions de patron.
- **Trafic** : chaque ouverture charge 2 à 8 Mo. C'est négligeable sur un VPS, qui inclut généralement plusieurs To.
- **Développement** : c'est le coût principal (§8), bien plus que l'hébergement.

**Recommandation** : **A** au lancement, puisque c'est gratuit et simple. Passer à **C (Cloud Run Jobs, région UE)**
quand la file d'attente dépasse quelques minutes aux heures de pointe : le code du worker est le même, seul le
déclencheur change. **B** ne devient intéressant qu'avec un volume élevé et régulier.

## 7. Variables d'environnement (prévues)

| Variable | Où | Rôle |
|---|---|---|
| `CLOTH_SIM_MODE` | api | `local` (worker Docker, A et B) ou `cloudrun` / `modal` (C) |
| `CLOTH_SIM_MAX_PER_DAY` | api | quota de rendus par utilisateur |
| `CLOTH_SIM_TIMEOUT_S` | worker | délai maximum d'une simulation (600 par défaut) |
| `CLOTH_SIM_CONCURRENCY` | worker | nombre de jobs simultanés (1 par défaut) |
| `GCP_PROJECT` / `GCP_REGION` / `CLOTH_SIM_JOB_NAME` | api | uniquement en mode `cloudrun` |

Les reporter dans `docs/environment-variables.md` et `docs/deployment.md` au moment de l'implémentation (étape 6 du processus d’`AGENTS.md`).

## 8. Plan d'implémentation (une phase par session)

| Phase | Contenu | Estimation | Tests |
|---|---|---|---|
| 1. Prototype local ✅ (2026-10-15, §10) | Installer Blender. Script `simulate.py` sur la robe v2 (`faf98872…`) : pièces + corps exportés en JSON/glb, simulation, `.glb`. Mesurer la durée et la qualité, comparer à la photo. **Point de décision : continuer ou non.** | 2 à 3 j | pytest sur la conversion pièces → maillage et coutures |
| 2. Worker + API ✅ (2026-10-16, §16) | `apps/cloth-sim` (Dockerfile, boucle de jobs), modèle Prisma `RealisticRender`, use-cases Request/Get, contrôleur, dépôt MinIO | 3 à 4 j | Jest unit + Supertest, pytest worker |
| 3. Web ✅ (2026-10-16, §17) | Bouton, suivi d'état (react-query, polling), chargement du `.glb` dans le visualiseur, retour à l'aperçu | 2 j | Vitest + Testing Library, e2e Playwright du parcours |
| 4. Tissus ✅ (2026-10-20, §18) | Table tissu → paramètres de cloth, calibration sur le banc de robes (`docs/reviews/dress-benchmark.md`) | continu | captures avant/après |
| 5. Cloud (si besoin) | Déclencheur Cloud Run Jobs ou Modal, région UE, présignature | 1 à 2 j | test d'intégration avec un faux client |

Avant la phase 3, vérifier l'écran Stitch du visualiseur pour placer le bouton et l'état « en cours » (règle 9).

## 9. Hors périmètre et alternatives écartées

- **Image photoréaliste (Cycles)** : possible avec le même worker, mais il faut un GPU (environ 0,5 à 1 $/h en
  serverless) ou 10 à 30 min de CPU par image. À envisager plus tard pour les fiches produit.
- **CLO3D / Marvelous Designer** : la référence du métier pour la simulation de vêtements, à partir d'un export DXF
  des pièces. Ces logiciels se paient par licence et par poste (de l'ordre de 40 à 50 $/mois), sans exécution
  automatisée sur serveur hors offres entreprise. Ils conviennent à la couturière pour vérifier un modèle, pas au
  rendu automatique dans l'application.
- **Simulation dans le navigateur (XPBD, WebGPU)** : aucun coût serveur, mais beaucoup de développement, une qualité
  limitée sur mobile et une batterie vidée. À reconsidérer seulement si le coût serveur devenait un problème.

## Sources des prix (consultées le 2026-10-15)

- Cloud Run : https://cloud.google.com/run/pricing
- Modal : https://modal.com/pricing (chiffres recoupés par https://www.beam.cloud/blog/modal-pricing-explained)
- Hausse Hetzner 2026 : https://wz-it.com/en/blog/hetzner-price-increase-june-2026-cpx-ccx-alternatives/ ,
  https://privatedevops.com/news/hetzner-june-2026-cloud-price-increase-what-to-do

## 10. Résultats de la phase 1 (2026-10-15)

Robe-manteau v2 (`faf98872…`, version `c39fb679…`, 19 pièces), pose `PRESENTATION`, tissu `STRUCTURE` (velours).
Machine de dev : 8 cœurs, pas de GPU. Blender **4.5.14 LTS** (archive officielle, somme SHA-256 vérifiée).

### Ce qui a été construit (`apps/cloth-sim/`)

- `tools/export-job.ts` : reprend le code du visualiseur (`fitHumanBody`, `applyPose`, `envelopeFromMesh`,
  `drapeGarment`) et écrit un job JSON (corps posé de 13 380 sommets et 13 panneaux drapés, 1,8 Mo).
- `cloth_sim/` (Python pur, testé) : validation du job, nettoyage des panneaux, coutures, table des tissus.
- `scripts/simulate.py` : un seul objet de tissu, coutures en « sewing springs », corps en objet de collision,
  export `.glb` Draco (un matériau par panneau, nommé par l'id du panneau), rendus Cycles avant/après, `metrics.json`.

### Mesures

| | Valeur |
|---|---|
| Tissu simulé | 17 641 sommets, 33 582 triangles (après nettoyage) |
| Coutures | 1 415 ressorts, dont 1 041 points d'attache de couches (revers, plastron, ceinture) |
| Simulation, 120 images (5 s simulées) | **2 min 53 à 3 min**, soit 1,45 à 1,5 s par image |
| Total (préparation, simulation, 2 rendus Cycles 600×900 et export) | **3 min 15 à 3 min 25** |
| Avec auto-collision | 3,6 s par image (×2,5), résultat **moins bon** |
| Mémoire maximale | 1 Go |
| `.glb` (Draco) | **0,14 Mo** (la fiche en estimait 2 à 8) |
| Écart aux coutures | médiane de 4,2 mm à 1,4 mm, p95 10 mm |
| Sommets sous la peau (marge de 2 mm) | 982 dans le drapé de départ, environ 100 après simulation |

L'estimation de 2 à 6 min par rendu (§3, §6) est confirmée sur CPU.

### Qualité (rendus Cycles avant/après ; pas encore confrontés à la planche d'inspiration)

- **Mieux que le drapé géométrique** : la jupe tombe sous son poids en plis verticaux naturels, l'ourlet descend
  un peu, les coutures se ferment, les manches gigot restent gonflées avec une flexion de 5 et le corsage est plus souple.
- **Moins bien, à corriger avant la phase 2** :
  1. **Les couches superposées se traversent** : le plastron ivoire et les devants bleus. Sans collision entre
     couches, chaque panneau tombe à travers l'autre. L'auto-collision globale coûte ×2,5 et ne règle pas le
     problème, car les couches se touchent déjà au départ. Piste : écarter les couches de 2 à 3 mm dans le
     job, puis limiter l'auto-collision au groupe de sommets des couches (`vertex_group_self_collisions`).
  2. **Bords effilochés** : poignets et bords des devants. Les maillages du drapé sont irréguliers (arêtes de 1 mm à
     9 cm, triangles en aiguille). Piste : remailler chaque pièce à plat en triangles d'environ 1 cm (§3, étape a).
  3. Environ 100 sommets restent sous la peau. Ce sont des zones où le drapé de départ est déjà dans le corps
     (982 sommets au départ).

### Problèmes rencontrés et corrections

- **Blender 3.0.1 (paquet Ubuntu jammy)** : il n'a pas de configuration OpenColorIO (« could not find role data
  role ») et ses rendus Cycles sortent noirs. Utiliser l'archive officielle 4.5 LTS, comme prévu au §4.
- **Explosion du solveur** : des sommets partaient à 2,5 m. La cause : 338 arêtes de longueur nulle dans le
  drapé (points de couture répétés, rangées écrasées). Correction : `clean_panel` soude à 3 mm et retire les
  triangles dégénérés et doublons. Le pilote refuse un maillage que Blender modifierait.
- **Coutures accidentelles** : la main posée sur la jupe en pose `PRESENTATION` cousait le poignet à la jupe.
  Correction : `NEVER_SEWN` (bras ↔ jupe, ceinture, plastron, revers).
- **Tête de manche** : en drapé, elle est à 3–6 cm de l'emmanchure (fronces). La tolérance large (7 cm) ne
  s'applique que de la manche vers le corsage.
- **UV** : les UV du plastron ne sont pas un vrai « à plat » (rapport 3D / UV de 0,36). La forme de repos du
  tissu est donc le drapé, pas le patron à plat. Simuler à partir du patron à plat demanderait des UV exactes
  pour toutes les pièces.

### Recommandation

**Continuer, mais pas encore la phase 2.** Le temps, la mémoire, le poids du `.glb` et le coût sont conformes
ou meilleurs que prévu, et la jupe montre déjà ce que la simulation apporte. Les deux défauts 1 et 2 rendraient
pourtant le rendu moins bon que l'aperçu pour une cliente. Il faut d'abord une **phase 1 bis** d'environ 2 jours
(séparation des couches et remaillage à plat), puis la phase 2 (worker et API) si le rendu du plastron est propre.

## 11. Phase 1 bis (2026-10-15) : couches, maillage, masse

Même robe, même machine. Lancement : `make install.blender && make job.cloth VERSION=c39fb679-… && make sim.cloth`.

### Ce qui a changé

- **Blender** : installé dans `apps/cloth-sim/.blender/` par `make install.blender` (archive officielle 4.5.14,
  SHA-256 vérifié, ignoré par git). Il ne dépend plus d'un dossier temporaire.
- **Soudure** : seules les **arêtes** de moins de 3 mm sont effondrées. La soudure par distance de la phase 1
  collait les deux épaisseurs d'un pli (poignet froncé, plis de manche) en arêtes partagées par 3 à 4 triangles :
  c'était une cause des bords effilochés. Le maillage brut et le maillage nettoyé n'ont plus aucune arête non-manifold.
- **Raffinement** (`remesh.py`) : arêtes de plus de 2,5 cm coupées, triangles en aiguille retournés. À 1,5 cm, le
  tissu passait de 17,6 k à 58,7 k sommets (≈ ×3 en temps) sans gain visible. On garde donc 2,5 cm (≈ 26 k sommets).
- **Couches** (`layers.py`, `zones.py`) : l'auto-collision a été essayée deux fois. Sur tout le vêtement, ×2,5 en
  temps ; sur les seules zones de recouvrement, ×3 en temps. Les couches se croisaient encore (1 245 croisements).
  Solution retenue : **découper la partie cachée** de la couche du dessous (plastron sous les devants, devant sous
  le revers, manche sous le poignet, robe sous la ceinture) et coudre son nouveau bord sous la couche du dessus.
  Ce qui reste en recouvrement est écarté de 4 mm. Le bord des devants sur le plastron est **libre** (pas de point
  d'attache : tiré dans le plastron, il s'y enfonçait en dents de scie).
- **Bras** : les paires bras ↔ jupe, ceinture, plastron et revers ne sont ni cousues, ni des couches l'une de l'autre
  (main posée sur la jupe).
- **Morceaux isolés** : les boucles du nœud, cousues à rien, tombaient à l'infini (sommets à 10–14 m). Elles sont
  ancrées au tissu le plus proche (6 ressorts).
- **Masse** : Blender compte la masse **par sommet**. Elle est désormais rapportée à la surface par sommet, pour que
  raffiner une manche ne double pas son poids.
- **Peau** : le tissu de départ sous la peau (à moins de 3 cm d'elle) est ressorti à 3 mm.
- **Recherche de voisins** sur grille (`spatial.py`) : la préparation passe de 55 s à 15 s.

### Mesures

| | Phase 1 | Phase 1 bis |
|---|---|---|
| Sommets de tissu | 17 641 | 26 131 |
| Simulation, 120 images | 2 min 53 (1,45 s/image) | 4 min 01 (2,0 s/image) |
| Total, avec préparation, 2 rendus et export | 3 min 15 | **5 min 02** |
| Croisements de couches après simulation (tolérance 2 mm) | non mesuré (visibles partout) | **359** |
| Sommets sous la peau (marge 2 mm) | ≈ 100 | 153 |
| Déplacement maximal | 29 cm | 30 cm (aucune explosion) |
| `.glb` Draco | 0,14 Mo | 0,21 Mo |

### Qualité

- **Corrigé** : le plastron est propre sur toute la hauteur, et le bord des devants le longe sans traversée. La
  ceinture et le nœud restent en place. Plus aucun morceau ne tombe.
- **Reste** :
  1. **Les manches gigot se dégonflent** et le bas de manche est encore haché. Physiquement, c'est normal : un
     gigot tient grâce à une triplure ou un tulle de soutien, que la simulation ne modélise pas. Piste : une
     raideur de flexion propre à la tête de manche (groupe de sommets, `bending_stiffness_max` de Blender) ou une
     « pression » locale.
  2. Léger feston au bas du bord de jupe sur le plastron.
  3. La jupe perd un peu de son évasement en A (là encore, pas de jupon simulé).
- Pas encore confronté à la planche d'inspiration.

### Recommandation

Faire encore un passage court sur les manches (point 1) avant la phase 2. Le reste du circuit (couches, coutures,
temps d'environ 5 min, `.glb` de 0,2 Mo) est prêt pour un worker.

## 12. Manches gigot (2026-10-15)

### Diagnostic

Vu de près, le défaut n'était pas seulement un ballon dégonflé : **la manche quittait le bras**. Le bras était nu de
l'épaule au poignet, et la manche pendait à côté. Mesures (`checks.bare_arm` : part de la peau du bras couverte au
départ dont le tissu s'est éloigné de plus de 3 cm) :

- ce n'était ni la découpe des couches, ni la sortie de la peau, ni le raffinement : chacun désactivé, le bras
  sortait encore. Une collision plus épaisse (1 cm) le faisait sortir **plus vite** ;
- le maillage du corps est sain (fermé, orientation cohérente, normales vers l'extérieur) ;
- **cause** : la pose `PRESENTATION` rapproche les bras de 20° vers le corps (`raise: -20`). Le haut du bras est alors
  à **4 mm** du flanc (5e percentile 12 mm). Il n'y a pas la place pour la manche et le côté du corsage : le tissu,
  écrasé entre deux corps de collision, est expulsé à travers le bras.

### Ce qui a changé

- **Habillage puis pose** (`tools/export-job.ts`, `scripts/simulate.py`) : la robe est drapée sur le corps bras
  écartés de 15° (`DRESS_POSE`). Le job contient aussi le corps dans la pose demandée (`targetBody`) ; Blender
  l'anime en clé de forme sur les 40 premières images (`--pose-frames`), et le tissu suit les bras.
- **Dégagement des bras** : la pose demandée est ouverte par pas de 2,5° jusqu'à garder 2,5 cm entre le haut du bras
  et le flanc (5e percentile). Pour la robe v2 : `raise` −7,5° au lieu de −20°. La pose réellement simulée est
  écrite dans le job (`simPose`, `armClearance`) : **le web devra poser le mannequin avec elle** (phase 3).
- **Soutien du ballon** (`support.py`) : la raideur de flexion monte jusqu'à ×10 là où la manche s'écarte du bras
  (0 à 1,5 cm, plein à 4 cm). C'est la triplure du gigot. Seul, il aggravait le glissement (le poids n'était pas
  la cause) ; avec le dégagement, il garde au ballon son volume et sa forme lisse.
- **80 images au lieu de 120** : 40 pour la pose, 40 pour poser le tissu. Au-delà de 60 images, le poignet remonte
  peu à peu sur l'avant-bras.
- Le job exporte les poids de bras du maillage (`body.armWeights`), qui servent à la mesure et au soutien.

### Mesures (robe v2)

| | Phase 1 bis | Maintenant |
|---|---|---|
| Bras nu (couvert au départ, découvert à la fin) | bras nus de l'épaule au poignet | **7,9 %** (le tour du poignet gauche : le poignet de la robe a remonté de 4 cm) |
| Total (préparation, simulation, 2 rendus, export) | 5 min 02 | **2 min 48** |
| Simulation | 120 images, 2,0 s/image | 80 images, 1,44 s/image |
| Croisements de couches | 359 | 268 |
| `.glb` | 0,21 Mo | 0,20 Mo |

### Reste

- Léger feston au bas du bord de jupe sur le plastron ; jupe un peu moins évasée (pas de jupon simulé).
- Dans la pose d'habillage, le drapé géométrique tend la ceinture en barre jusqu'aux mains (l'enveloppe du corps
  englobe les avant-bras à hauteur de taille). La simulation la ramène autour de la taille, mais c'est à corriger
  dans le drapé si une autre robe en souffre.
- Pas encore confronté à la planche d'inspiration.

## 13. Finitions et comparaison à la planche (2026-10-15)

- **Ceinture tendue en barre dans le drapé de départ** : le rayon de la ceinture (`garment-model.ts`) prenait les poignets
  en compte ; mains à hauteur de taille (pose d'habillage), il s'étirait jusqu'à eux. Poignets exclus (test
  `garment3dVictorianBody`, « arms held out »).
- **Feston au bas du bord de jupe** : le bord découpé du plastron était cousu contour contre contour au bord libre du
  devant, qui s'y enfonçait. Entre un bord libre et le plastron : plus de couture contour ↔ contour ; le plastron
  s'attache seulement à l'intérieur du devant, dessous (`seams.py`).
- **Jupon** (`petticoat.py`, `--petticoat`) : un corps de collision rentré de 2,5 cm sous la jupe. Essayé, il
  remontait les poignets (mains le long des hanches, dans le volume de la jupe) et marquait une marche au genou :
  **désactivé par défaut**. L'évasement de la planche venait en fait du patron (jupe à lés en cloche, aisance de
  porter : `docs/features/patterns.md`, 2026-10-15), corrigé à la source.
- **Comparaison à la planche** (version v8 `c68034f8…`) : jupe en A dès la taille, manches gigot jusqu'au coude puis
  avant-bras ajusté, poignets au poignet (bras nu 0 %), col, plastron et ceinture en place ; 3 min 54. **Reste** : en
  simulation, les devants de jupe (bord libre, plus amples en cloche) retombent vers le centre et couvrent une partie
  du plastron, alors que l'ouverture s'élargit vers l'ourlet sur la planche ; garnitures de la planche (panneaux
  jacquard latéraux, broderies) non modélisées.

## 14. Rendu réaliste et jupe en cloche (2026-10-15)

- **Tissu de la photo** : le job porte `look` (couleurs, motif, taille du motif, fini, contraste, accent) et l'indicateur
  `accent` par sommet (ballon des manches). `cloth_sim/look.py` choisit le tissu de chaque panneau (robe, contraste
  pour plastron et cordelière en satin, accent) ; `scripts/render_look.py` en fait des matériaux Cycles : velours
  (sheen), satin, mat ; motifs procéduraux sur les UV du tissu à plat (pois, fleurs, arabesques = filets courbes en
  Voronoï déformé, brocart = rinceaux + fleurettes), or légèrement métallique. Un matériau par panneau (+ `:accent`).
- **Studio** : quatre lumières surfaciques, fond gris uni, AgX, 96 échantillons débruités, 900 × 1350, subdivision
  au rendu seulement (le `.glb` garde le maillage simulé, 0,2 Mo). Rendu ≈ 1 min 30 par image sur CPU.
- **Jupe en cloche** : sans soutien, le velours se refermait en colonne. Soutien de flexion de la jupe là où elle
  s'écarte des jambes (`support.py`, `SKIRT_SHARE`) et **jupon par défaut** (`petticoat.py`, `--no-petticoat`) dès les
  hanches, **évidé autour des mains** (12 cm, poses d'habillage et finale). Essayé : jupon commençant sous les mains
  (marche au genou, puis bourrelet aux hanches avec un retrait du bord).
- **Résultat v8** : jupe en A dès les hanches, manches gigot sur les bras (bras nu 0 %), arabesques dorées sur les
  ballons, plastron ivoire brocart, nœud ; ≈ 5 min 45 en tout. Reste : chignon et visage du mannequin (non modélisés),
  bord bas du plastron un peu irrégulier sous le nœud, ourlet froissé au sol.


## 15. Visage, sol, plastron et guide des mesures (2026-10-16)

- **Tête** : le job porte `head` (export de l'aperçu web : visage sculpté, couleurs de peau — lèvres, sourcils, cils —,
  chignon, yeux). Blender colore la peau par sommet, pose le chignon (ombre et découpe par sommet, mèches procédurales)
  et deux globes oculaires. Corps lissé au rendu seulement (la collision garde le maillage simulé).
- **Sol** : collision au niveau des pieds (`--no-floor` pour l'enlever) ; le tissu parti sous le sol est remonté au
  départ (`lift_above_floor`). Le jupon s'arrête 12 cm au-dessus de l'ourlet (`ABOVE_HEM`) : l'ourlet ne s'accroche plus
  à son bord. Résultat : ourlet posé au sol (`underFloor` 0), plus de froissure sous la robe.
- **Studio** : fond arrondi (sol + mur, sans ligne d'horizon), ombre portée ; rebonds limités (6) et seuil adaptatif.
- **Plastron sous le nœud** : la cause était la découpe des couches cachées *sous les pans du nœud*, qui bougent pendant
  la simulation et découvraient le trou. Rien n'est plus découpé sous une zone libre (`zones.LOOSE_OVER` : ceinture,
  cordelière). Essayé puis abandonné : garder 3 cm de plastron sous les devants (croisements 229 → 304, le bleu perçait
  l'ivoire).
- **Bord du plastron le long des devants de jupe** (même jour, suite) : la simulation tourne sans auto-collision, et
  les bords des devants glissaient sous le plastron (13 croisements préparés → 235 après la simulation, dont 33 sur le
  devant de jupe). Après la simulation, `layers.restack` réempile les couches, puis le modificateur cloth cède la
  place à ce maillage (export et rendu) : sur un bord libre (`zones.free_edge`, devants sur le plastron) la couche
  haute repasse à 4 mm au-dessus partout où elle est plus près, comme avant la simulation ; sur une couche cousue
  (revers, ceinture, poignets) seuls les sommets passés dessous bougent. Métriques : `layerCrossingsSimulated`,
  `restacked` (sommets déplacés), `after.layerCrossings`. Robe v2 : 235 → 12 croisements, 912 sommets, bord du
  plastron net. La médiane des écarts de couture passe de 1,4 à 4,0 mm : ce sont les points d'arrêt entre couches
  (plastron–jupe, revers–devant) remis à l'écart de 4 mm que `prepare` leur donne avant la simulation.
  Essais : ne lever que les sommets croisés (235 → 8) laissait l'ivoire percer en points le long des devants ;
  épingler les points cousus gardait 67 croisements.
- ≈ 12 min par rendu complet (deux images Cycles + simulation).
- **Guide des mesures** : `cloth_sim/measure_guide.py` trace chaque mesure du catalogue sur le mannequin (tours =
  enveloppe convexe d'une coupe du corps, comme un mètre ruban ; longueurs sur la peau ; repères trouvés sur le
  maillage) et `scripts/render_measure_guide.py` en fait une image par clé (justaucorps sombre, mètre doré, fond
  transparent) dans `apps/web/public/images/measurement-guide/` (`make guide.cloth`, ≈ 30 min, 420 Ko en tout).

## 16. Phase 2 : worker et API (2026-10-16)

### Ce qui a été construit

- **Prisma** : modèle `RealisticRender` (table `realistic_renders`, migration `20261016120000_add_realistic_renders`) :
  `versionId` (cascade), `requestedById`, `pose`, `cacheKey`, `status` (`QUEUED` → `RUNNING` → `DONE` | `FAILED`),
  `attempts`, `mediaId` + `glbUrl`, `simPoseJson`, `metricsJson`, `error`, `durationMs`, `cachedFromId`.
- **API** (`apps/api/src/realistic-render/`, Clean Architecture, module à part pour ne pas toucher `patterns`) :
  - `POST /api/pattern-versions/:id/realistic-render` `{ pose? }` (JWT, propriétaire du projet) → `RealisticRenderDto`.
    Ordre : rendu déjà en file pour cette version et cette clé → renvoyé ; rendu `DONE` de même clé → renvoyé (même
    version) ou **copié** sans simulation (`cachedFromId`, `cached: true`, hors quota) ; sinon quota
    (`CLOTH_SIM_MAX_PER_DAY`, 24 h glissantes, `429`) puis nouvelle ligne `QUEUED`.
  - `GET …/realistic-render/:renderId` (suivi, toutes les 5 s côté web) et `GET …/realistic-render?pose=` (dernier
    rendu de la version, `null` sinon, pour réafficher au chargement).
  - **Clé de cache** (`render-cache-key.ts`) : SHA-256 du JSON canonique (clés triées) des pièces (sans id, ordre
    indifférent), des mesures, du type de vêtement, de la pose, du tissu (`fabricBehavior` + `fit` de la photo) et de
    `CLOTH_SIM_REVISION`. Une version régénérée à l'identique réutilise le rendu.
  - **Endpoints du worker** `/api/internal/cloth-sim/jobs/*` (`Authorization: Bearer CLOTH_SIM_WORKER_TOKEN`, comparaison
    à temps constant ; jeton absent = `503`) : `claim` (`UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED)`, plus
    ancien `QUEUED` ou `RUNNING` muet depuis `CLOTH_SIM_TIMEOUT_S` + 2 min, `attempts < CLOTH_SIM_MAX_ATTEMPTS` ; les
    muets sans tentative restante passent `FAILED`), `:id/upload-target` (URL présignée PUT **demandée après** la
    simulation : une URL signée au départ expirerait), `:id/done` (clé d'objet vérifiée : dossier
    `realistic-renders/<id>/` du rendu seulement → ligne `Media` `PATTERN_EXPORT`, bucket `patterns`) et `:id/failed`
    (raison tronquée à 1 000 caractères). Un rendu qui n'est plus `RUNNING` répond `409`. Masqués de Swagger, fermés par
    nginx et Caddy (`/api/internal/` → 404).
  - MinIO passe par le module `media` (`CreatePresignedUploadUseCase`, `ConfirmUploadUseCase`, désormais exportés) :
    `@angaly/storage` garde un seul consommateur (règle 21).
  - Le job envoyé au worker ne contient **ni nom ni identifiant de cliente** (mesures, pièces, tissu) : prêt pour une
    exécution hors du VPS (§5 C).
- **Types partagés** : `packages/types/src/realistic-render.ts` (`RealisticRenderDto`, `ClothSimJobDto`, …).
- **Worker** (`apps/cloth-sim/cloth_sim/worker.py`, Python standard, sans accès à la base ni identifiants MinIO) :
  `claim` → `version.json` (forme de `dump-version.sh`) → `tools/export-job.ts` (depuis `apps/web`) → Blender
  `simulate.py` (sans les rendus Cycles de prévisualisation) → PUT du `.glb` → `done` avec `simPose` (lu dans le job
  exporté) et `metrics.json`. Export et simulation partagent le délai du job ; tout échec (code de sortie, délai,
  binaire absent, `.glb` manquant, stockage refusé, exception) finit en `failed` avec la raison. SIGTERM : le job en
  cours se termine. Un job par processus.
- **Image** `apps/cloth-sim/Dockerfile` (+ `Dockerfile.dockerignore` en liste blanche) : Ubuntu 24.04, Blender 4.5.14
  officiel (SHA-256), Node 22 + tsx + three 0.170 pour l'export, `@angaly/types` compilé, utilisateur non root.
  Service `cloth-sim` de `docker-compose.prod.yml` derrière le profil `cloth-sim` (2 vCPU, 4 Go, arrêt en 11 min).
- `make worker.cloth`, `make docker.cloth` ; variables : `docs/environment-variables.md` §9 ; déploiement :
  `docs/deployment.md` (« Rendu réaliste »).

### Essai de bout en bout (machine de dev, 2026-10-16)

Seconde instance de l'API (port 3013, `CLOTH_SIM_WORKER_TOKEN`), compte client, robe v2 (version `c39fb679…`, pose
`PRESENTATION`), `make worker.cloth`-équivalent avec `CLOTH_SIM_ONCE=1` :

| | Valeur |
|---|---|
| `POST …/realistic-render` | `QUEUED`, clé de cache calculée |
| Worker : export + simulation + dépôt | **6 min 40** (simulation 300 s à 3,8 s/image : machine chargée par une autre session ; 1,4 s/image au §12) |
| `.glb` | 0,20 Mo, servi par MinIO (`model/gltf-binary`), identique au fichier produit |
| `simPose` renvoyé | bras à −7,5° (au lieu de −20° demandés : dégagement des manches, §12) |
| Métriques | 24 291 sommets, 17 croisements de couches après réempilement, bras nu 0,8 % |
| Second `POST` identique | même rendu `DONE` renvoyé, aucune simulation |
| Image Docker (`make docker.cloth`) | construite, 1,7 Go ; Blender 4.5.14 et Node 22 présents ; export du job dans le conteneur identique (13 panneaux, bras à −7,5°) |
| Premier essai (chemin de Blender faux) | `FAILED` avec la raison (« impossible de lancer … »), corrigé (`default_blender`) |

### Tests

API : 61 tests (`__tests__/unit` : use-cases, clé de cache, repository Prisma, lecteur de version, passerelle média ;
`__tests__/integration` : les deux contrôleurs, Supertest), 99 % des lignes du module. Worker : 24 tests pytest
(`tests/test_worker.py`, faux HTTP et faux `subprocess`), cloth-sim 136 tests en tout, couverture 99 %.

## 17. Phase 3 : web (2026-10-16)

- **Maquette** : écran Stitch « Validation de Patron (Studio) » vérifié (MCP Stitch) : pas de visualiseur 3D ni de
  bouton de rendu. Style repris des commandes du panneau 3D. Détail : `docs/pages/pattern-studio-preview-validation-export.md`
  (section du 2026-10-16).
- **Code** (fichiers nouveaux, `Garment3DViewer.tsx` inchangé ; `Garment3DPanel.tsx` reçoit seulement la section) :
  `api/realistic-render.api.ts`, `hooks/useRealisticRender.ts` (dernier rendu, `POST`, suivi toutes les 5 s),
  `utils/realistic-render.ts` (pose du panneau → pose simulée, rôle de tissu par nom de matériau, `simPose` validé),
  `ui/RealisticRenderSection.tsx` (bouton, état, bascule aperçu / rendu réaliste), `ui/RealisticRenderViewer.tsx`
  (Canvas à part : `.glb` Draco, tissus de l'aperçu, mannequin ajusté posé avec `simPose`).
- **Décodeur Draco** servi par le site : `apps/web/public/draco/` (copie de `three/examples/jsm/libs/draco/gltf`,
  three 0.170 ; à recopier si three change de version majeure).
- **Vérifié** : le `.glb` réel de la robe v2 se décode et s'affiche dans Chrome sans interface (Playwright, 45 829
  triangles, 15 matériaux, repère du visualiseur).
- **Vu dans l'app le 2026-10-20** (web 3100 + API 3003 telle quelle ; worker branché sur une seconde instance de l'API,
  port 3013, qui partage la base : la file est dans Postgres, aucun redémarrage de 3003) : robe-manteau v2, version 9
  (`22e88643…`), bouton → « En file d'attente » → worker 5 min 07 → « Rendu réaliste prêt » → « Voir le rendu
  réaliste » : velours bleu, arabesques dorées sur les gigots, plastron ivoire brocart, mannequin posé avec `simPose`.
  3003 n'a toujours pas `CLOTH_SIM_WORKER_TOKEN` : à ajouter dans `apps/api/.env` au prochain redémarrage.
- Limites : mannequin sans visage ni chignon (peau unie) ; une pose « Personnalisée » est simulée en Présentation.
- Tests : 16 (Vitest + Testing Library) ; feature `pattern-studio-preview-validation-export` 356 tests verts.
- **e2e Playwright** `apps/web/e2e/pattern-studio/rendu-realiste.spec.ts` (ajouté le même jour) : connexion du client
  du seed, 3D sur mannequin, « Rendu réaliste » → file → prêt (endpoints du rendu interceptés : `QUEUED`, `RUNNING`,
  `DONE`) → `.glb` réel de la robe v2 (fixture `e2e/pattern-studio/fixtures/robe-v2-simulated.glb`) chargé dans le
  visualiseur → retour à l'aperçu. Vert en 2 min contre le web 3100 et l'API 3003 (sans redémarrage : seuls les
  endpoints du rendu sont simulés). `playwright.config.ts` accepte `PLAYWRIGHT_CHANNEL=chrome`.


## 18. Phase 4 : calibration des tissus (2026-10-17 → 20)

### Outils

- `scripts/calibrate_fabrics.py` : banc de robes (`cases.json` : version + `fullness.skirt` lu sur la photo), un export
  par robe, une simulation par variante de paramètres (`--variant nom:bending=0.2,mass=0.1`), `results.jsonl` repris
  après interruption, `summary.md`. `--remeasure` recalcule les mesures depuis `settled.npy`.
- Mesure `checks.silhouette` : ourlet ÷ taille, comparable à `fullness.skirt`. La taille est prise **à la taille
  naturelle du corps** (tranche du torse la plus étroite, bras exclus, entre 55 et 72 % de la hauteur), tranches de 3 cm ;
  l'ourlet est la tranche la plus large des 12 % du bas ; manches exclues. La première version (tranches de 1 cm, taille
  cherchée en % du vêtement) sous-estimait la taille.
- `simulate.py --body-friction` (5 par défaut) : frottement tissu/corps, noté dans `metrics.json`.
- Banc : 6 robes (3 FLUIDE, 3 STRUCTURE ; évasée, ajustée, princesse). Espace de travail hors dépôt :
  `~/angaly-cloth-calib/` (`cases.json`, `out/` = avant correction, `out2/` = après, `views/` vues de face PNG).

### Bug trouvé : milieux devant et dos jamais cousus

Le drapé construit chaque devant et chaque dos en **deux moitiés miroir** qui partagent les points du milieu sans
triangle entre elles. `seams.find_seams` ne cousait que 5 à 20 des 60 à 106 points de ce bord : le corsage tenait par
les manches et la jupe s'ouvrait en deux pans pendant la simulation (vues de face). Correction :
`seams._sew_halves` coud, sur une pièce à plusieurs composantes, les points de bord de deux composantes distantes de
moins de 3 mm (`HALF_GAP`) → 47 à 56 paires par pièce. Exception : devants qui s'ouvrent sur un plastron
(robe-manteau), laissés ouverts. Tests : `tests/test_seams.py` (moitiés cousues, moitiés écartées de 5 cm, devant sur
plastron).

### Résultats (80 images, pose Présentation, 4 fils)

| Robe | Tissu | Cible photo | Drapé | Simulé avant correction | Simulé après | Ourlet ↓ mm |
|---|---|---|---|---|---|---|
| fluide-evasee-fc69 | FLUIDE | 1,6 | 1,55 | 0,80 | 1,37 | −10 |
| fluide-evasee-0655 | FLUIDE | 1,8 | 1,66 | 1,71 | 1,49 | −2 |
| fluide-princesse-8951 | FLUIDE | 3,0 | 2,73 | 2,24 | 2,76 | +1 |
| structure-ajustee-777c | STRUCTURE | 1,6 | 1,85 | 2,43 | 1,95 | −27 |
| structure-evasee-bfc4 | STRUCTURE | 2,4 | 1,94 | 1,63 | 1,90 | −134 |
| structure-princesse-28b0 | STRUCTURE | 3,0 | 2,51 | 3,16 | 2,39 | +1 |

Après correction, la simulation suit le drapé à ±0,2 près (contre jusqu'à 1,1 avant). **L'écart restant à la photo
vient surtout du drapé lui-même** (patron et aperçu, en amont), pas des paramètres de tissu : un tissu ne peut pas
rendre une jupe plus ample que sa coupe.

### Variantes FLUIDE (rigidité)

| Robe | base (bending 0,05) | bending 0,2 | bending 0,5 + masse 0,1 |
|---|---|---|---|
| fluide-evasee-fc69 | 1,37 (1,5 s/image) | 1,36 (3,7 s) | 1,34 (2,6 s) |
| fluide-evasee-0655 | 1,49 (1,9 s) | 1,50 (2,8 s) | 1,46 (3,0 s) |
| fluide-princesse-8951 | 2,76 (1,8 s) | 2,80 (3,2 s) | 2,87 (4,3 s) ; bras nu 38 % |

La rigidité ne change la silhouette que de ±0,07, et ralentit le calcul de 1,5 à 2,5 fois. **Paramètres `FABRICS`
inchangés** (FLUIDE et STRUCTURE). Pour se rapprocher de la photo, il faut agir sur la coupe et le drapé (ampleur de
jupe du moteur et de `garment3d`), voir le banc `docs/reviews/dress-benchmark.md`.

### Reste ouvert

- ~~**structure-evasee-bfc4**~~ (corrigé, §19) : l'ourlet remonte de 13 cm et le haut du corsage descend d'environ 9 cm. Ni le frottement
  (0,5 à 5), ni le jupon, ni le soutien de manche n'en sont la cause. Avec un passage de pose brusque
  (`--pose-frames 2`), la remontée se réduit à 9 cm. La piste la plus probable : les manches courtes, entraînées par les
  bras qui descendent. Le taux « bras nu » de 62 à 65 % est normal pour des mancherons.
- Écran complet dans l'app non vu (API 3003 partagée avec d'autres sessions, non redémarrée).
- RIGIDE et STRETCH non calibrés (aucune robe du banc).

## 19. Ourlet de bfc4 et jupon (2026-10-20)

### Cause : la petite manche cousue au bas de l'emmanchure

Sur un corps immobile (sans changement de pose), la robe bfc4 descendait aussi de 10 cm : la pose n'y était pour rien.
Au fil de la simulation, les manches glissaient vers l'intérieur à travers le bras, puis vers l'image 45 la couture
d'épaule passait par-dessus l'épaule et roulait de 11 cm vers l'avant, sur la poitrine. La raison : la recherche des
coutures manche → corsage accepte un écart de 7 cm (pour la tête froncée d'une manche bouffante). Sur une manche très
courte, le bord libre et le dessous de bras sont à moins de 7 cm du bas de l'emmanchure. Ils y étaient cousus
(78 paires de 30 à 87 mm) et tiraient la manche à travers le bras.

Correctif (`cloth_sim/seams.py`) : les rangs d'une manche suivent son `v` à plat (tête au plus petit, bout libre au
plus grand, voir `garment-model.ts`). Seul le **rang de tête** (`cap_row`) cherche l'emmanchure à 7 cm. Le reste du
contour garde l'écart normal (1,5 cm), et le **bout libre** (`free_end`) n'est jamais cousu au corsage, dans les deux
sens. Le poignet reste cousu à la manche. Sur bfc4, on passe de 176 à 88 paires manche/corsage, la tête reste cousue
sur tout son tour, et le taux « bras nu » tombe de 62 % à 16 %.

### Jupon : l'ourlet s'accrochait à son bord

Le bas de la jupe, sans soutien sous le jupon, se resserrait, passait sous son bord inférieur, s'y accrochait et se
repliait vers le haut. Correctif (`cloth_sim/petticoat.py`) : le jupon rentre progressivement vers l'intérieur dans ses
12 derniers cm (`HEM_TAPER_INSET`, 3 cm de plus), et il s'arrête à 6 cm de l'ourlet au lieu de 12 (`ABOVE_HEM`).
Variantes essayées sur bfc4 : un retrait de 6 cm limite la remontée à −43 mm mais fait perdre l'évasé (silhouette
1,59) ; un frottement de 1 au lieu de 5 ne change rien ; un arrêt à 3 cm fait de nouveau accrocher l'ourlet (−85 mm).
Options de `simulate.py` pour ces essais : `--hem-taper`, `--above-hem`, `--petticoat-friction`.

### Résultats (6 robes du banc, 80 images, pose Présentation)

| Robe | Cible | Drapé | §18 | Coutures corrigées, jupon à 12 cm | Coutures corrigées, jupon à 6 cm (défaut) | Ourlet ↓ mm (défaut) |
|---|---|---|---|---|---|---|
| fluide-evasee-fc69 | 1,6 | 1,55 | 1,37 | 1,29 | 1,34 | −21 |
| fluide-evasee-0655 | 1,8 | 1,66 | 1,49 | 1,38 | 1,48 | +11 |
| fluide-princesse-8951 | 3,0 | 2,73 | 2,76 | 2,53 | 2,62 | +1 |
| structure-ajustee-777c | 1,6 | 1,85 | 1,95 | 1,84 | 1,83 | 0 |
| structure-evasee-bfc4 | 2,4 | 1,94 | 1,90 | 1,83 | 1,91 | **−47** (au lieu de −134) |
| structure-princesse-28b0 | 3,0 | 2,51 | 2,39 | 2,23 | 2,35 | +2 |

Sur bfc4, il reste une remontée d'environ 5 cm au bas de la jupe et de 2 cm à la taille.

### RIGIDE et STRETCH

La base compte 13 robes RIGIDE ; 5 ont une ampleur lue sur la photo (cible). Aucun vêtement STRETCH n'existe :
deux cas ont été fabriqués à partir de robes du banc (777c ajustée, fc69 évasée) en changeant seulement le tissu.

| Robe | Cible | Drapé | RIGIDE ancien (50/50/40, flexion 20, masse 0,8) | RIGIDE nouveau (30/30/25, flexion 8, masse 0,6) | Bras nu ancien → nouveau |
|---|---|---|---|---|---|
| rigide-93e2 | 3,2 | 2,75 | 2,64 | 2,67 | 7 % → 10 % |
| rigide-34c6 | 1,6 | 2,16 | 2,06 | 1,93 | 24 % → 7 % |
| rigide-f71e | 2,5 | 2,37 | 1,97 | 1,95 | 49 % → 25 % |
| rigide-8ac0 | 3,6 | 3,15 | 2,65 | 3,00 | 5 % → 5 % |
| rigide-c386 | 2,6 | 2,70 | 2,47 | 2,57 | 49 % → 37 % |

**`FABRICS["RIGIDE"]` assoupli** : silhouette plus proche du drapé (et de la photo) sur 3 robes sur 5, manches longues
qui remontent environ deux fois moins, 25 % de temps de calcul en moins (environ 3 s par image au lieu de 4,2). Les
ourlets restent en place (±7 mm).

STRETCH (paramètres inchangés) : 777c donne 1,80 (drapé 1,85), fc69 1,24 (drapé 1,55, comme FLUIDE à 1,34), aucun
bras nu, ourlets stables. Le calibrer pour de bon demande un vrai vêtement en maille avec sa photo.

### Reste ouvert

- f71e et c386 (manches longues, RIGIDE) : 25 à 37 % du bras reste découvert ; la manche remonte quand le bras descend.
- Délai par défaut `CLOTH_SIM_TIMEOUT_S` = 600 s : sur la machine de dev chargée, la robe 8951 (longue, avec traîne)
  l'a dépassé (583 s de Blender, rendu FAILED). Prévoir plus large pour les robes à traîne, ou un worker dédié.

## 20. Broderie et smocks dessinés comme des motifs (2026-10-23)

Le moteur marque les zones de broderie et de smocks (`DetailArea.motif`, `color`) ; l'aperçu les dessinait déjà
(`ui/motifTextures.ts`), le rendu réaliste aussi désormais :

- **Job** : `tools/export-job.ts` ajoute `motif` (`BRODERIE` | `SMOCKS`) et `trimColor` aux panneaux de détail ;
  `cloth_sim/job.py` les lit (valeur inconnue ou couleur mal formée ignorées) et `clean_panel` / `trim_hidden` les
  conservent (`dataclasses.replace`).
- **Cycles** : `cloth_sim/motifs.py` porte en numpy les mêmes motifs que le web (rinceaux, fleurs, points de nœud,
  carreau de 8 cm ; nid d'abeille, losange de 12 mm — écart au pixel près ≤ 1/255 avec la version TypeScript).
  `look.panel_material(zone, look, motif, thread)` : broderie = tissu de la robe + fil (couleur du patron, sinon
  `contrastColor`, sinon or champagne `#c9a45c`) ; smocks = tissu de la robe + relief. `render_look.py` : images
  empaquetées échantillonnées sur les UV en mètres ; broderie mélangée par la couverture du fil, léger relief (Bump
  0,3 / 0,6 mm), fil doré un peu métallique ; smocks = Bump 0,3 / 1,2 mm + ombre des plis (× 0,65–1).
- **Web** (`RealisticRenderViewer`) : les matériaux du `.glb` portent l'id du panneau ; `panelMotifs(model.panels)` +
  `motifForMaterial` (suffixes `:accent` et `.001` de Blender retirés) retrouvent le motif, et le panneau reçoit le
  même matériau que dans l'aperçu (`embroideryMaterialParameters`, normal/ao map des smocks).

