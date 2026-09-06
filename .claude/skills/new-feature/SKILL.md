---
name: new-feature
description: "Scaffold a new ANGALY feature (frontend feature-slice, backend Clean Architecture module, or both) with its mandatory tests. Use when starting a page from docs/pages/ or a backend module from docs/features/ that has no code yet."
---

# /new-feature

Scaffold a new feature in the ANGALY monorepo, following `.cursor/rules/002-nextjs-features.mdc`
(frontend) and `.cursor/rules/003-nestjs-clean-arch.mdc` (backend).

Argument: `<name> [web|api|both]`. Examples: `pret-a-porter-catalogue web`, `appointments both`.
If no argument given, ask for the feature name and where (web / api / both).

## Before scaffolding

1. Open `docs/mockup-reference.md` and locate the page/feature row — it links to the Stitch
   screen and the spec section to respect.
2. Open the corresponding `docs/pages/<name>.md` (web) or `docs/features/<name>.md` (api) —
   read its full contract (routes/endpoints, component tree, Prisma models, acceptance
   checklist) before writing a single file.
3. Confirm the phase this belongs to (`docs/phases/phase-N-*.md`) is the one currently being
   worked on — do not scaffold a feature from a future phase.

## If "web" or "both" — frontend

Create `apps/web/src/features/<name>/`:

```
<name>/
├── ui/
│   ├── <Name>Page.tsx          # root component (imported by the Next.js page)
│   └── index.ts
├── hooks/
│   ├── use<Name>.ts             # main hook — ALL logic lives here
│   └── index.ts
├── api/
│   ├── <name>.queries.ts        # useQuery hooks (react-query, via @/lib/api-client)
│   ├── <name>.mutations.ts      # useMutation hooks
│   └── index.ts
├── schemas/
│   └── index.ts                 # Zod schemas
├── consts/
│   └── index.ts                 # QUERY_KEYS + constants
├── types/
│   └── index.ts                 # types local to this feature
├── utils/
│   └── index.ts                 # pure functions
├── __tests__/
│   ├── <Name>Page.test.tsx
│   └── use<Name>.test.ts
└── index.ts                     # public barrel export
```

- `<Name>Page.tsx` is `'use client'` only if it needs interactivity; imports the hook + `ui/`
  components and nothing else.
- `use<Name>.ts` returns `{ data, isLoading, error }` (or the shape documented in
  `docs/pages/<name>.md`) — never a tuple.
- `consts/index.ts`: `export const QUERY_KEYS = { all: ['<name>'] as const };`
- Add the route under the correct group in `apps/web/src/app/(public|auth|client|admin)/` —
  the page file imports ONLY the feature's root component (see `002-nextjs-features.mdc`).
- Add an MSW handler in `src/lib/msw/handlers/<name>.handlers.ts`, registered in
  `src/lib/msw/server.ts` (create these two files on the very first feature that needs them).

### Test content (mandatory, not left empty)

`__tests__/<Name>Page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { <Name>Page } from '../ui/<Name>Page';

vi.mock('../hooks/use<Name>', () => ({
  use<Name>: () => ({ data: undefined, isLoading: false, error: null }),
}));

describe('<Name>Page', () => {
  it('renders without crashing', () => {
    render(<<Name>Page />);
    expect(document.body).toBeTruthy();
  });
});
```

`__tests__/use<Name>.test.ts`: at minimum, assert the initial loading state; add a success and
an error case once the real query/mutation exists.

## If "api" or "both" — backend

Create `apps/api/src/<name>/` with the full Clean Architecture layout (mirrors the empty
skeleton already present — remove its `README.md` once real code lands):

```
<name>/
├── domain/{entities,repositories,value-objects}/
├── application/{use-cases,dtos}/
├── infrastructure/{repositories,mappers,services}/
├── presentation/{controllers,guards,decorators}/
├── __tests__/{unit,integration}/
└── <name>.module.ts
```

- Domain has zero imports from `@nestjs/*`, `@prisma/client`, or `@angaly/storage`.
- Use-cases inject only Domain interfaces (`{ provide: <NAME>_REPOSITORY, useClass:
  <Name>PrismaRepository }`).
- Controllers delegate to use-cases, full Swagger decorators (`@ApiOperation`,
  `@ApiResponse`, `@ApiProperty` on every DTO field).
- Register the module in `apps/api/src/app.module.ts`.

### Test content (mandatory)
One `__tests__/unit/<use-case>.spec.ts` per use-case (mock the repository interface) and one
`__tests__/integration/<name>.controller.spec.ts` (Supertest, mocked `PrismaService`) —
mirror the shape used in `apps/api/src/shared/health/__tests__/health.controller.spec.ts`.

## After creation

1. Run `pnpm typecheck` and `pnpm --filter @angaly/<web|api> test` — fix until green.
2. Update `docs/pages/<name>.md` / `docs/features/<name>.md` status field.
3. Update `docs/checklist-implementation.md` for this item.
4. Print a summary of files created.
