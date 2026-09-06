# Features — feature-sliced architecture

Empty by design. Every page/feature in `docs/pages/*.md` gets exactly one folder
here once its phase starts (see `docs/checklist-implementation.md` and
`.cursor/rules/002-nextjs-features.mdc`). Use the `new-page-from-stitch` skill
(`.claude/skills/new-page-from-stitch/SKILL.md`) to scaffold one from its doc.

## Non-negotiable structure

```
features/<name>/
  ui/       → presentational components only: props in, JSX out. No useState,
              no useEffect, no react-query, no router calls.
  hooks/    → ALL logic: useState, effects, react-query consumption, router,
              Zustand. A component only ever calls `useSomething()` from here.
  api/      → react-query `useQuery`/`useMutation` wrappers around
              `@/lib/api-client`. Nothing else may call `fetch`.
  schemas/  → Zod validation schemas for forms.
  consts/   → QUERY_KEYS and other constants.
  types/    → types local to this feature only (shared types live in @angaly/types).
  utils/    → pure functions.
  __tests__/→ tests for the hook(s) and the root page component (mandatory).
  index.ts  → the feature's only public export surface.
```

Next.js page files (`app/**/page.tsx`) import ONE component from a feature's
`index.ts` and render it — nothing else. See `apps/web/src/app/(public)/page.tsx`
for the current (foundation placeholder) example.
