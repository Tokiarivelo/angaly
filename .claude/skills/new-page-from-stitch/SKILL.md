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
2. Read the matching prompt file under `stitch-prompts/` (named in the page doc) to recall
   the exact sections/copy/labels the mockup specifies — the implementation's content and
   layout must match it, not improvise new copy.
3. If the Stitch screen itself needs re-checking, read it via the Artifact/Stitch tools using
   the project URL in `docs/mockup-reference.md` — do not guess at visual details already
   decided in the mockup.
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
