# Pattern rules

One `IPatternRule` implementation per `GarmentType` (`packages/pattern-engine/src/types.ts`).
Use the `pattern-engine-rule` skill (`.claude/skills/pattern-engine-rule/SKILL.md`) to
scaffold a new rule with its test.

Each rule is pure, synchronous, and has zero dependency on `@angaly/database`, NestJS, or
the AI service, and zero dependency on any other rule in this folder (self-contained, see
`.cursor/rules/007-pattern-engine.mdc`).

## Coverage (session 2026-09-21 — all 8 `GarmentType` now covered)

| `GarmentType`  | Rule file                | Notes                                                       |
| -------------- | ------------------------- | ------------------------------------------------------------ |
| `ROBE`          | `robe.rule.ts`             | Corsage + jupe                                               |
| `JUPE`          | `jupe.rule.ts`             | Devant + dos                                                 |
| `PANTALON`      | `pantalon.rule.ts`         | Devant + dos + ceinture + fond de poche                     |
| `VESTE`         | `veste.rule.ts`            | Devant + dos + manche + col — no longer accepts `COSTUME`    |
| `CHEMISE`       | `chemise.rule.ts`          | Devant + dos + manche + col + poignet — no longer accepts `AUTRE` |
| `COSTUME`       | `costume.rule.ts`          | Veste (4 pièces) + pantalon (3 pièces) — always a complete ensemble, no half-garment fallback |
| `ROBE_MARIEE`   | `robe-mariee.rule.ts`      | Bustier structuré 3 panneaux + traîne + jupon — distinct ease/construction from `robe.rule.ts` |
| `AUTRE`         | `autre.rule.ts`            | Deliberately generic rectangular base block only — see its header comment and `docs/features/patterns.md` "Points d'attention" for why no dedicated construction is attempted, and how the "generic base, needs couturière adaptation" warning is surfaced |

Before this session, `COSTUME`/`ROBE_MARIEE`/`AUTRE` had no dedicated rule and silently fell
back to whichever sibling rule's permissive `appliesTo()` happened to accept them (see
`packages/pattern-engine/src/pattern-engine.ts`'s fallback loop) — `VesteRule` for `COSTUME`
(jacket only, trousers missing), `RobeRule` for `ROBE_MARIEE` (no bridal-specific
construction), `ChemiseRule` for `AUTRE` (shirt geometry presented for an arbitrary custom
piece). Each sibling's `appliesTo()` has been narrowed back to its own `GarmentType` now that
dedicated rules exist.
