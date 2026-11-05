# Guide de développement — ANGALY

## Prérequis

| Outil          | Version minimale | Installation                                           |
| -------------- | ---------------- | ------------------------------------------------------ |
| Node.js        | 20.x LTS         | https://nodejs.org                                     |
| pnpm           | 9.x              | `npm install -g pnpm@9`                                |
| Python         | 3.12             | https://python.org (uniquement pour `apps/ai-service`) |
| Docker         | 26.x             | https://docker.com                                     |
| Docker Compose | 2.x              | Inclus avec Docker Desktop                             |
| make           | 4.x              | `sudo apt install make`                                |
| openssl        | —                | Pour la génération des clés JWT                        |

> **Windows** : utiliser **WSL2** (recommandé) ou Git Bash pour les commandes `make`/`pnpm`.

## Installation et démarrage

### 1. Cloner et installer

```bash
git clone <repo-url> angaly
cd angaly
make install
```

> `pnpm install` compile automatiquement `@angaly/types` via le script `postinstall`
> (Turborepo) — `packages/types/dist/` est généré sans commande supplémentaire.

### 2. Configuration des variables d'environnement

```bash
make env.init
```

Crée `.env` (racine), `apps/web/.env.local`, et `apps/api/.env` depuis leurs `.env.example`.
Puis générer les secrets :

```bash
make env.generate-keys    # Clés JWT RS256 → .env + apps/api/.env
make env.generate-secret  # NEXTAUTH_SECRET → apps/web/.env.local
```

Les valeurs MinIO par défaut dans `.env.example` fonctionnent telles quelles en local
(`angaly_minio` / `changeme-minio-root-password`) — les changer uniquement en production.

> 📖 Pour le détail de toutes les variables et la procédure d'obtention de la clé **Google Maps Platform**
> (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`), consulter [`docs/environment-variables.md`](./environment-variables.md).

### 3. Démarrer l'infrastructure Docker

```bash
make infra.start
# PostgreSQL   → localhost:5432
# MinIO        → http://localhost:9001 (console) / :9000 (API S3)
# Adminer      → http://localhost:8080
```

Le service `minio-init` crée automatiquement les 8 buckets (`docker/minio/init-buckets.sh`)
et les rend publiquement lisibles (lecture seule — l'écriture reste protégée par clé).

### 4. Base de données

```bash
make db.migrate   # applique les migrations Prisma
make db.seed      # crée le compte admin + un atelier + des catégories de base
```

Compte créé par le seed : `admin@angaly.mg` / `Admin@Angaly2026!` (à changer avant toute
mise en production réelle).

Commandes sur une base existante (toutes idempotentes, sans écrasement) :

```bash
pnpm --filter @angaly/database db:seed:cms                      # sections CMS par défaut (create-only)
pnpm --filter @angaly/database db:backfill:creation-projects    # un projet de création par devis déjà accepté
```

### 5. Démarrer les apps

```bash
make dev
# Web  → http://localhost:3001  (WEB_PORT du Makefile ; 3000 est pris par un autre projet sur la machine de dev)
# Web seul : make dev.web            (autre port : make dev.web WEB_PORT=3005)
# API  → http://localhost:3003/docs (Swagger)
```

### 6. (Optionnel) AI Service — Angaly Pattern Studio

```bash
make install.ai   # crée apps/ai-service/.venv et installe les dépendances
make dev.ai        # démarre uvicorn sur http://localhost:8001
```

Sans ce service démarré, tout ce qui touche aux suggestions IA de Pattern Studio répond en
mode dégradé (voir `.cursor/rules/008-ai-service-integration.mdc`) — la génération manuelle
de paramètres reste possible via `packages/pattern-engine` seul.

**Modèles locaux désactivés par défaut** (2026-11-05) : l'ai-service ne sert que de passerelle vers les providers
configurés (Gemini, Anthropic, OpenAI…). Le modèle photo local (CLIP ONNX, tous les cœurs CPU) et le modèle statistique
ANSUR II ne sont ni proposés ni chargés tant que `AI_LOCAL_MODELS_ENABLED` n'est pas `true`
(`make dev AI_LOCAL_MODELS=true` ou `make dev.ai AI_LOCAL_MODELS=true` pour les réactiver). Interrupteur :
`apps/ai-service/app/feature_flags.py`.

### Ressources de la machine de dev

Réglages pour une machine de 16 Go (la stack complète plantait sous charge) :

| Où                        | Réglage                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make dev`                | un seul `tsc -b --watch` pour types/storage/pattern-engine (`pnpm dev:packages`, ≈ 80 Mo au lieu de ≈ 800 Mo pour 3 watchers) + `pnpm dev:apps` (web + API) |
| ai-service                | uvicorn ne surveille que `app/` (`--reload-dir app`, pas `.venv` ni `ml/`) ; modèles locaux coupés (≈ 30 Mo)                                                |
| `apps/web/next.config.ts` | `webpackMemoryOptimizations`, pas de précompilation des routes au démarrage, 3 pages gardées 30 s                                                           |
| Vitest (web + config)     | 50 % des cœurs en local (`VITEST_MAX_WORKERS` pour changer) ; inchangé en CI                                                                                |
| Playwright                | 2 workers en local (`PLAYWRIGHT_WORKERS`) et WebGL sur le vrai GPU (`PLAYWRIGHT_SOFTWARE_GL=1` pour revenir à SwiftShader) ; CI inchangée                   |

Mesures au démarrage (2026-11-05) : `next dev` ≈ 1,1 Go, `nest start --watch` ≈ 670 Mo + l'API ≈ 220 Mo. Piste
suivante si besoin : builder SWC de Nest (`@swc/cli`, `@swc/core`, non installés).

### 7. (Optionnel) Rendu réaliste — `apps/cloth-sim`

Simulation de tissu avec Blender headless (`docs/features/realistic-render-blender.md`). L'API tient la file
(module `realistic-render`, phase 2) ; le bouton web n'existe pas encore (phase 3). Il faut **Blender 4.5 LTS** (archive officielle de download.blender.org) : le paquet
Ubuntu jammy (3.0.1) sort des rendus Cycles noirs.

```bash
make install.cloth   # crée apps/cloth-sim/.venv (tests du cœur Python, sans Blender)
make test.cloth      # pytest + couverture
make install.blender # Blender 4.5.14 LTS dans apps/cloth-sim/.blender/ (≈ 1,2 Go, SHA-256 vérifié)
make job.cloth VERSION=<uuid de version>   # → /tmp/angaly-cloth/job.json (Postgres de dev requis)
make sim.cloth       # simulation (≈ 3 min) → /tmp/angaly-cloth/garment.glb, metrics.json, before/after.png
```

Worker branché sur l'API locale (même secret des deux côtés : `CLOTH_SIM_WORKER_TOKEN` dans `apps/api/.env`, API
redémarrée) :

```bash
# un rendu : POST /api/pattern-versions/<versionId>/realistic-render (JWT du propriétaire), puis
make worker.cloth CLOTH_SIM_WORKER_TOKEN=<secret> ONCE=1   # ≈ 3 à 6 min par job, .glb déposé dans MinIO
```

Détails et options : `apps/cloth-sim/README.md`.

## HTTPS local (Caddy, optionnel)

```bash
make caddy.hosts   # ajoute 127.0.0.1 angaly.local à /etc/hosts (une fois)
make caddy.start   # démarre le proxy HTTPS local
```

Accès : `https://angaly.local`. Voir `docker/caddy/Caddyfile` pour le détail des routes.

## Commandes courantes

```bash
pnpm dev                    # web + api
pnpm test                   # tous les tests Node
pnpm lint                   # lint tout
pnpm typecheck              # type-check tout
make test.ai                # pytest apps/ai-service
make db.studio               # Prisma Studio (GUI base de données)
```

Voir `make help` pour la liste complète des cibles.

## Structure du monorepo

Voir `docs/architecture.md` pour le détail complet. En bref :

```
apps/web            Next.js — vitrine, boutique, espace client, back-office
apps/api            NestJS — API REST
apps/ai-service     FastAPI — IA pour Angaly Pattern Studio
packages/database   Prisma + PostgreSQL
packages/types      Types partagés
packages/config     Configs partagées
packages/storage    Client MinIO
packages/pattern-engine  Moteur de patronage géométrique
```

## Avant d'implémenter quoi que ce soit

Lire `CLAUDE.md` (ou `AGENTS.md`) — le processus par phase est obligatoire : consulter
`docs/mockup-reference.md`, `docs/checklist-implementation.md`, la fiche
`docs/pages/<slug>.md` ou `docs/features/<slug>.md`, et la phase concernée dans
`docs/phases/` avant d'écrire du code.
