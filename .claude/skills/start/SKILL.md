---
name: start
description: Begin a work session on ANGALY — load docs/handoff.md and only the plan section it names, then state the plan. Use at the start of every session, after /clear, or when asked "what's next" / "on continue" / « Lis docs/handoff.md et poursuis ».
---

1. Read `docs/handoff.md` (≤ 150 lines) and run `git status --short`. Never open `docs/handoff-archive/` (grep only, and only if a task needs past history).
2. Take the first item of « 3. Prochaines actions ». Read only the plan section it names (`docs/plans/<plan>.md` → §0 + the current lot, by `rg -n "^## "` then offset/limit) — never the whole plan.
3. Load only what that section lists: the page/feature sheet (`docs/pages/<slug>.md` or `docs/features/<slug>.md`) and the matching line of `docs/mockup-reference.md` / `docs/checklist-implementation.md` via `rg -n <slug>`. Never load `docs/specifications/` or whole checklists.
4. If the item is blocked or needs a human (Stitch screen to create, credentials, shared API 3003 in use by another session), say so and take the next item.
5. Reply in ≤ 5 lines: the item (plan + lot), files you expect to touch, whether a Stitch check is needed (any JSX/TSX/CSS → `agy --print`), how you'll verify (exact test command, visual check). Then start.
6. Locate code with `rg -n` / glob; read the feature's `index.ts` before internals; read ranges, not whole large files (`garment-model.ts`, `Garment3DViewer.tsx`, `Garment3DPanel.tsx` are 700–3 600 lines).
7. While working, run only the tests of the touched area (`pnpm --filter @angaly/web exec vitest run <path>`); full suite + coverage once at the end of the lot.
8. Before stopping: tick the lot in the plan's « Suivi », move the old « 2. Dernière session » to the top of `docs/handoff-archive/<AAAA-MM>.md`, rewrite the 5 sections of `docs/handoff.md` (format: `AGENTS.md` § Handoff), then give the resume line.
