---
name: new-page-from-stitch
description: "Turn one docs/pages/<slug>.md spec (plus its Stitch mockup) into a real ANGALY Next.js route and feature-sliced frontend scaffold. Use when starting a specific page from the mockup-reference/checklist."
---

# /new-page-from-stitch

Argument: `<page-slug>` — must match a file in `docs/pages/` (e.g. `home`,
`pattern-studio-landing`, `admin-mediatheque`). If no argument, list the pages whose status
in `docs/checklist-implementation.md` is ⬜ for the current phase and ask which one.

## Steps

1. Read `docs/pages/<page-slug>.md` in full — route(s), Stitch reference, spec section,
   planned component tree, API endpoints consumed, Prisma models touched, acceptance
   checklist.
2. Read the matching prompt file under `stitch-prompts/` (named in the page doc) as a content
   memo only — it names the sections/copy/labels the mockup is supposed to have, but it is
   **not** a substitute for the rendered screen and can omit or misdescribe real structural
   details (nav link count, footer columns, number of grid tiles, stepper labels, etc.).
3. **Mandatory, every time — not just when something seems unclear:** check the real Stitch
   screen before writing any JSX/TSX, CSS, classes, or styles for this page, using the
   **`agy` (Antigravity)** CLI first — it has a direct MCP connection to the ANGALY Stitch
   project (`agy --print "<consigne>"` non-interactive, or an interactive `agy` session from
   the repo root; see `.cursor/rules/006-phase-workflow.mdc`). If `agy` can't run
   non-interactively in the current environment (headless MCP permission error), fall back to
   the direct Stitch MCP tools (`mcp__stitch__get_screen` for the screenshot/HTML download
   URLs, then inspect the image) rather than skipping the check. Never guess at a visual
   detail the mockup already decided — this applies to revisions of already-shipped pages
   too, not only first-time scaffolds.
4. Confirm every backend endpoint the page doc lists under "API endpoints consumed" already
   exists (check `docs/features/*.md` status) — if not, stop and flag it: a page cannot be
   wired to an endpoint that doesn't exist yet; scaffold the UI against mocked/MSW data in
   that case and note the gap in the page doc.
5. Invoke the `new-feature` skill for the `web` side with the feature name from the page doc.
6. Build the `ui/` components to match the Stitch screen's sections one-for-one (same
   headings, same order, same CTAs) — see `.cursor/rules/002-nextjs-features.mdc` for the
   hooks/UI split.
7. Wire the route: add `page.tsx` under the correct `apps/web/src/app/(group)/` segment
   (from the page doc's "Route(s)" field), importing only the feature's root component.
8. Add the Playwright e2e spec for this page's critical path under
   `apps/web/e2e/<feature>/` if the page doc marks one as required.

## After implementation

1. Update `docs/pages/<page-slug>.md`: status, any documented deviation from the mockup.
2. Update `docs/checklist-implementation.md` and `docs/mockup-reference.md` for this row.
3. Run `pnpm --filter @angaly/web test` and, if applicable, `pnpm --filter @angaly/web
   test:e2e` — both green before considering the page done.
