# Pattern rules

Empty by design — Phase 4 (`docs/phases/phase-4-premium-pattern-studio.md`) adds one
`IPatternRule` implementation per `GarmentType` here (e.g. `jupe-droite.rule.ts`,
`robe-mariee-princesse.rule.ts`). Use the `pattern-engine-rule` skill
(`.claude/skills/pattern-engine-rule/SKILL.md`) to scaffold a new rule with its test.

Each rule is pure, synchronous, and has zero dependency on `@angaly/database`, NestJS, or
the AI service — see `.cursor/rules/007-pattern-engine.mdc`.
