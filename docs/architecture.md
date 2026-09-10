# Architecture — ANGALY

## Diagramme d'architecture général

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Mobile                          │
│                     (Next.js 15, React 19)                       │
└───────────────────────────┬───────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx (prod) / Caddy (dev)                    │
│               Reverse Proxy + TLS Termination                    │
│     /              → apps/web   (port 3000)                     │
│     /api/*         → apps/api   (port 3003)                     │
│     /docs          → Swagger UI (dev only)                       │
└───────────┬─────────────────────────┬───────────────────────────┘
            │                         │
            ▼                         ▼
┌──────────────────────┐   ┌──────────────────────────────────────┐
│  Next.js 15           │   │  NestJS 11                          │
│  apps/web             │   │  apps/api                           │
│  ────────────────────  │   │  ──────────────────────────────────  │
│  App Router            │◄──│  Clean Architecture                 │
│  NextAuth v5            │   │  JWT RS256                          │
│  React Query v5         │  │  Prisma 6 ORM                       │
│  Zustand (store)        │  REST │  @nestjs/swagger (OpenAPI)          │
└──────────────────────┘   └───────────┬──────────────────────────┘
                                       │
                     ┌─────────────────┼──────────────────────┐
                     ▼                 ▼                      ▼
        ┌──────────────────┐ ┌─────────────────┐  ┌────────────────────┐
        │   PostgreSQL 16    │ │      MinIO       │  │  apps/ai-service    │
        │  (Prisma ORM)      │ │  (médias, S3)     │  │  FastAPI (Python)   │
        └──────────────────┘ └─────────────────┘  └────────────────────┘
                                                       Angaly Pattern Studio
                                                       (suggestions IA seulement —
                                                        jamais la géométrie finale)
```

`packages/pattern-engine` (déterministe, TypeScript pur) tourne **à l'intérieur** de
`apps/api` (module `pattern-engine`) — ce n'est pas un service réseau séparé, contrairement
à `apps/ai-service`.

## Clean Architecture Backend

```
src/<module>/
├── domain/              # Règles métier — ZÉRO dépendance externe
│   ├── entities/        # Classes pures
│   ├── repositories/    # Interfaces (IXxxRepository)
│   └── value-objects/
│
├── application/         # Orchestration — dépend uniquement du Domain
│   ├── use-cases/
│   └── dtos/            # class-validator
│
├── infrastructure/      # Implémentation — Prisma, MinIO, HTTP vers ai-service
│   ├── repositories/    # XxxPrismaRepository
│   ├── mappers/         # Prisma → Domain, Domain → DTO
│   └── services/
│
└── presentation/        # HTTP — Délègue aux use-cases
    ├── controllers/
    ├── guards/
    └── decorators/
```

## Angaly Pattern Studio — pipeline (spec §24-25)

```
Utilisateur
  ↓ choix du vêtement, style, mesures, (optionnel) photo d'inspiration
apps/api « patterns » module
  ↓ appelle « ai-inference » module
apps/api « ai-inference » module  ──HTTP interne──▶  apps/ai-service (FastAPI)
                                                        (suggère PatternParameters,
                                                         jamais de géométrie)
  ↓ paramètres suggérés, à valider par l'utilisateur/couturière
apps/api « pattern-engine » module
  ↓ appelle
packages/pattern-engine (déterministe)
  ↓ IPatternRule.computePieces(parameters, measurements)
PatternPieceGeometry[]  →  persisté comme PatternVersion + PatternPiece[]
  ↓
Vérification professionnelle (statut REVIEW_REQUIRED → VALIDATED)
  ↓
Export (PatternExport → fichier stocké via MinIO)
```

Le point important (spec §105) : la précision du patron ne dépend **jamais** uniquement
d'un modèle IA. `apps/ai-service` propose ; `packages/pattern-engine` construit
déterministiquement ; une couturière valide.

## Architecture Feature-Sliced (Frontend)

```
features/<name>/
├── ui/          # Composants présentationnels
├── hooks/       # Logique métier
├── api/         # react-query, via @/lib/api-client
├── schemas/     # Zod
├── consts/      # QUERY_KEYS, constantes
├── types/       # Types locaux
├── utils/       # Fonctions pures
└── __tests__/   # Tests
```

## Route groups (apps/web/src/app)

```
(public)/         Vitrine, La Une, Créations, Boutique, Sur Mesure, Ateliers, Journal, Contact
(auth)/            Connexion, Inscription, Mot de passe oublié
(client)/          Espace client (dashboard, rendez-vous, commandes, favoris, mesures)
(client)/pattern-studio/   Angaly Pattern Studio (identité visuelle distincte, palette §13)
(admin)/           Back-office — Gestion de contenu, Médiathèque, et futurs modules admin
```

## ADR (Architecture Decision Records)

### ADR-001 : JWT RS256 vs HS256

**Décision** : RS256 (asymétrique) plutôt que HS256.
**Raison** : la clé publique peut être partagée avec de futurs microservices (dont
`apps/ai-service`, s'il devait un jour vérifier des tokens) sans exposer le secret de signature.

### ADR-002 : Monorepo Turborepo + pnpm

**Décision** : Turborepo avec pnpm workspaces (identique au projet de référence SIRH).
**Raison** : simplicité de configuration, cache distribué natif, conventions déjà éprouvées.

### ADR-003 : Clean Architecture dans NestJS

**Décision** : séparer Domain / Application / Infrastructure / Presentation.
**Raison** : testabilité des use-cases sans infrastructure, inversion de dépendance.

### ADR-004 : Angaly Pattern Studio — IA en microservice Python séparé

**Décision** : `apps/ai-service` (FastAPI) plutôt que de l'inférence TypeScript in-process.
**Raison** : l'écosystème d'entraînement/inférence de modèles (PyTorch, torchvision,
scikit-learn) est natif Python ; un service séparé peut être scalé/déployé indépendamment
sans imposer Python aux apps TypeScript. Décision utilisateur confirmée en Phase 0.

### ADR-005 : `packages/pattern-engine` séparé de `apps/ai-service`

**Décision** : le moteur géométrique déterministe est un package TypeScript pur, distinct
du service IA.
**Raison** : spec §105 — la précision du patron ne doit jamais dépendre uniquement d'un LLM
ou d'un modèle de deep learning ; le moteur de règles doit rester déterministe, testable
sans réseau, et fonctionner même si `apps/ai-service` est indisponible (dégradation : les
suggestions IA sont optionnelles, la génération manuelle de paramètres reste possible).

### ADR-006 : MinIO pour tous les médias

**Décision** : MinIO (S3-compatible) plutôt qu'un stockage disque local ou en base.
**Raison** : spec §76 exige un stockage objet compatible S3 ; MinIO est auto-hébergeable et
portable vers un vrai S3 en production sans changer `packages/storage`.

### ADR-007 : Pas de Redis en Phase 0

**Décision** : ne pas démarrer Redis tant qu'aucune fonctionnalité (sessions, cache, file
d'attente) n'en a besoin.
**Raison** : éviter un service infra non utilisé ; `REDIS_URL` reste documenté dans
`.env.example` pour la phase qui l'introduira (probablement Auth ou Notifications).
