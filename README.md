# ANGALY — Maison de couture numérique

Monorepo pour le site ANGALY : vitrine haut de gamme, boutique prêt-à-porter, parcours sur-mesure, espace client, back-office, et **Angaly Pattern Studio** (génération de patron assistée par IA).

## Structure

```
apps/
  web/            Next.js 15 (App Router) — vitrine + boutique + espace client + back-office
  api/            NestJS 11, Clean Architecture — API REST
  ai-service/     FastAPI (Python) — inférence IA pour Angaly Pattern Studio
packages/
  database/       Prisma 6 + PostgreSQL 16 (schéma, migrations, seed)
  types/          Types partagés front/back
  config/         Configs partagées (ESLint, TypeScript, Vitest)
  storage/        Client MinIO (upload/presign/delete pour tous les médias)
  pattern-engine/ Moteur de patronage géométrique déterministe (règles)
docs/             Documentation, checklist d'implémentation, spécifications
stitch-prompts/   Prompts Google Stitch utilisés pour générer les maquettes
```

Avant toute implémentation, voir **`CLAUDE.md`** / **`AGENTS.md`** (processus obligatoire par phase) et **`docs/mockup-reference.md`** (référence croisée Page ↔ Maquette Stitch ↔ Spécification).

## Démarrage rapide

```bash
pnpm install
cp .env.example .env   # puis remplir les valeurs (voir docs/development.md)
docker compose up -d postgres redis minio
pnpm --filter @angaly/database exec prisma migrate dev
pnpm dev
```

- Web : http://localhost:3000
- API : http://localhost:3001/api (Swagger : `/api/docs` en dev)
- AI Service : http://localhost:8000/health
- MinIO Console : http://localhost:9001

Voir `docs/development.md` pour le détail complet (prérequis, variables d'environnement, commandes).

## Documentation

| Document | Contenu |
| --- | --- |
| `docs/architecture.md` | Diagrammes, ADR |
| `docs/conventions.md` | Naming, commits, structure d'imports |
| `docs/development.md` | Installation, variables d'env, commandes |
| `docs/deployment.md` | Déploiement production, infra |
| `docs/testing.md` | Stratégie de tests (Vitest/Jest/Playwright/pytest) |
| `docs/mockup-reference.md` | Page ↔ Maquette Stitch ↔ Spécification ↔ Statut |
| `docs/checklist-implementation.md` | Checklist globale par phase |
| `docs/phases/` | Détail de chaque phase de développement |
| `docs/pages/` | Une fiche par page/route |
| `docs/features/` | Une fiche par module backend |

## Commandes

```bash
pnpm dev                    # web + api en parallèle
pnpm test                   # tous les tests
pnpm lint                   # lint tout le monorepo
pnpm typecheck              # type-check tout le monorepo
docker compose up -d        # infra (postgres, redis, minio)
```

Commandes Claude Code : voir `.claude/commands/`. Skills projet : voir `.claude/skills/`.
