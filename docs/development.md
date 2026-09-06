# Guide de développement — ANGALY

## Prérequis

| Outil          | Version minimale | Installation                                              |
| -------------- | ----------------- | ------------------------------------------------------------ |
| Node.js         | 20.x LTS           | https://nodejs.org                                          |
| pnpm            | 9.x                 | `npm install -g pnpm@9`                                      |
| Python          | 3.12               | https://python.org (uniquement pour `apps/ai-service`)      |
| Docker          | 26.x               | https://docker.com                                          |
| Docker Compose | 2.x                 | Inclus avec Docker Desktop                                    |
| make            | 4.x                 | `sudo apt install make`                                       |
| openssl         | —                   | Pour la génération des clés JWT                               |

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

### 5. Démarrer les apps

```bash
make dev
# Web  → http://localhost:3000
# API  → http://localhost:3001/docs (Swagger)
```

### 6. (Optionnel) AI Service — Angaly Pattern Studio

```bash
make install.ai   # crée apps/ai-service/.venv et installe les dépendances
make dev.ai        # démarre uvicorn sur http://localhost:8000
```

Sans ce service démarré, tout ce qui touche aux suggestions IA de Pattern Studio répond en
mode dégradé (voir `.cursor/rules/008-ai-service-integration.mdc`) — la génération manuelle
de paramètres reste possible via `packages/pattern-engine` seul.

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
