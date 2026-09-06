# Stratégie de Tests — ANGALY

## Philosophie

Pyramide de tests : beaucoup de tests unitaires (use-cases, hooks, règles de patron, utils),
des tests d'intégration (controllers HTTP, endpoints FastAPI), peu de tests E2E (parcours
critiques uniquement : réservation d'essayage, prise de rendez-vous, checkout, création
d'un projet Pattern Studio).

**Coverage minimum : 80%** sur toutes les métriques, pour chaque package testable
(web, api, pattern-engine, ai-service).

> **Exception `apps/api` — branches à 75%, pas 80%.** Les décorateurs NestJS
> (`@Inject()`, `@Body()`, `@Query()`, propriétés de paramètres de constructeur, avec
> `emitDecoratorMetadata`) compilent vers du code que les instrumenteurs de couverture
> (Istanbul via `ts-jest`, providers `v8` et `babel` testés tous les deux) interprètent comme
> des branches conditionnelles synthétiques — toujours à moitié non couvertes, quel que soit
> le test écrit. Vérifié sur le module `media` (Phase 1) : `statements`/`functions`/`lines`
> à 100%, seules ces branches fantômes empêchent d'atteindre 80% sur `branches`. Voir
> `apps/api/jest.config.ts` (commentaire) et `docs/features/media.md` pour le détail. À
> remonter vers 80% au fur et à mesure que d'autres modules diluent la part de ces branches
> synthétiques dans le total.

## Frontend (Vitest + Testing Library)

```bash
pnpm --filter @angaly/web test
pnpm --filter @angaly/web test:watch
pnpm --filter @angaly/web test:coverage
pnpm --filter @angaly/web test:ui
```

| Cible                                    | Outil              | Obligatoire ?            |
| ------------------------------------------ | ------------------ | -------------------------- |
| Hooks (`useLogin`, `usePatternWizard`, ...) | `renderHook` + `act` | ✅ Oui                     |
| Composants interactifs (formulaires, modals) | `render` + `userEvent` | ✅ Oui                  |
| Utils (`formatPriceAriary`, `truncate`, ...) | assertions simples | ✅ Oui                     |
| Composants visuels purs (sans logique)        | —                   | ⚪ Optionnel                |
| Pages Next.js (`app/**/page.tsx`)             | —                   | ❌ Non (pas de logique)     |

### MSW (Mock Service Worker)

Ajouté dès la première feature qui appelle une vraie API (Phase 1) :
`src/lib/msw/handlers/<feature>.handlers.ts`, enregistré dans `src/lib/msw/server.ts`,
importé par `vitest.setup.ts`.

```typescript
export const appointmentsHandlers = [
  http.post('http://localhost:3001/api/appointments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { reference: 'RDV-2026-00001' } });
  }),
];
```

## Backend (Jest + Supertest)

```bash
pnpm --filter @angaly/api test
pnpm --filter @angaly/api test:watch
pnpm --filter @angaly/api test:coverage
```

### Tests unitaires — Use Cases

Mocker toutes les dépendances (`jest.fn()`), tester le cas nominal ET les cas d'erreur, via
`Test.createTestingModule()` :

```typescript
describe('CreateAppointmentUseCase', () => {
  const mockRepo = { save: jest.fn(), findConflicting: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateAppointmentUseCase,
        { provide: APPOINTMENT_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();
    // ...
  });
});
```

### Tests d'intégration — Controllers

`createNestApplication()` + Supertest, `PrismaService` mocké — voir
`apps/api/src/shared/health/__tests__/health.controller.spec.ts` pour le pattern minimal.

## `packages/pattern-engine` (Vitest, environnement Node)

```bash
pnpm --filter @angaly/pattern-engine test
pnpm --filter @angaly/pattern-engine test:coverage
```

Chaque `IPatternRule` est pure — pas de mock nécessaire, tester `computePieces()` avec des
mesures fixes et asserter sur des valeurs concrètes (nombre de pièces, noms, dimensions).
L'orchestrateur `PatternEngine` est testé avec des règles stub, indépendamment de toute
implémentation réelle — voir `src/__tests__/pattern-engine.test.ts`.

## `apps/ai-service` (pytest)

```bash
make test.ai
# ou directement :
cd apps/ai-service && .venv/bin/pytest --cov=app --cov-report=term-missing
```

`TestClient(app)` de FastAPI — pas de mock réseau nécessaire tant que le modèle est un
placeholder. Une fois un vrai modèle chargé (Phase 5), mocker le chargement du modèle dans
les tests plutôt que de charger le vrai artefact (temps de test).

## E2E (Playwright)

```bash
pnpm --filter @angaly/web test:e2e          # requiert apps/api + PostgreSQL démarrés
pnpm --filter @angaly/web test:e2e:ui       # mode interactif
```

Parcours critiques attendus (un par phase, voir `docs/phases/`) :

- `e2e/foundation/boot.spec.ts` — l'app démarre (Phase 0, déjà présent)
- Connexion/inscription (Phase 1)
- Prise de rendez-vous (Phase 2)
- Checkout prêt-à-porter (Phase 2/3)
- Création d'un projet Angaly Pattern Studio de bout en bout (Phase 4)

## Avant de considérer une page/un module terminé

1. Tests écrits pour tout hook/composant interactif/use-case/controller/règle/endpoint
   nouvellement ajouté (voir `.cursor/rules/004-testing.mdc`).
2. `pnpm test` (ou `make test.ai`) vert.
3. Coverage ≥ 80% sur le package concerné.
4. `docs/pages/<slug>.md` ou `docs/features/<slug>.md` mis à jour (statut, tests couverts).
