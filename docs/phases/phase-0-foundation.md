# Phase 0 — Fondation

**Statut : ✅ Complète.**

## Objectif

Poser un monorepo buildable, documenté, et gouverné par des règles/skills explicites, sans
écrire de logique métier — pour que chaque phase suivante démarre sur une base stable et
puisse être traitée en session isolée (voir `.cursor/rules/006-phase-workflow.mdc`).

## Livré

- **Monorepo** : Turborepo + pnpm, `apps/{web,api,ai-service}`,
  `packages/{database,types,config,storage,pattern-engine}`
- **Base de données** : schéma Prisma complet (spec §96/§97), migration initiale, seed
  minimal (admin + atelier principal + catégories de base)
- **Infra** : `docker-compose.yml` (dev : postgres + minio + adminer),
  `docker-compose.prod.yml` (stack complète), `docker-compose.caddy.yml` (HTTPS local
  optionnel), Nginx (prod) — voir `docs/deployment.md`
- **apps/api** : bootstrap NestJS (health check, Prisma, Swagger, filtres/intercepteurs
  globaux), 21 modules de domaine scaffoldés en squelette (dossiers Clean Architecture vides
  + README pointant vers leur fiche `docs/features/`)
- **apps/web** : bootstrap Next.js (route groups par rôle, palette ANGALY dans
  `globals.css`, providers minimalistes, placeholder de démarrage à `/`)
- **apps/ai-service** : bootstrap FastAPI (health check, endpoint de suggestion en mode
  placeholder, contrat Pydantic synchronisé avec `@angaly/types`)
- **packages/pattern-engine** : contrats (`IPatternRule`, `IPatternEngine`,
  `PatternPieceGeometry`, ...) + orchestrateur `PatternEngine` testé
- **packages/storage** : client MinIO (upload, presign, delete, URL publique)
- **Règles & skills** : 9 fichiers `.cursor/rules/*.mdc`, 3 skills, 8 commandes,
  `CLAUDE.md`/`AGENTS.md`
- **Documentation** : ce dossier `docs/` en entier (architecture, conventions,
  development, deployment, testing, mockup-reference, checklist, phases, 38 fiches pages,
  22 fiches features)

## Ce qui n'est PAS dans cette phase

Aucune logique métier : pas d'authentification réelle, pas de CRUD, pas de génération de
patron, pas de paiement. Chaque page (`docs/pages/`) et module backend
(`docs/features/`) reste marqué ⬜ dans `docs/checklist-implementation.md` jusqu'à ce que sa
phase (1 à 6) soit traitée.

## Vérification de sortie de phase

- `pnpm install`, `pnpm typecheck`, `pnpm lint` passent
- `docker compose up -d` démarre postgres + minio (buckets créés) + adminer
- `pnpm --filter @angaly/database exec prisma migrate dev` applique la migration
- `pnpm dev` démarre web (placeholder visible sur `/`) + api (`/api/health` → 200)
- `make dev.ai` démarre ai-service (`/health` → 200)
- `pnpm test` (web + api + pattern-engine) et `make test.ai` sont verts

## Phase suivante

`docs/phases/phase-1-digital-presence.md`.
