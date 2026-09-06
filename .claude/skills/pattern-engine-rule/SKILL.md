---
name: pattern-engine-rule
description: "Scaffold a new deterministic garment construction rule (IPatternRule) in packages/pattern-engine, with its test. Use when implementing pattern generation for a new GarmentType in Phase 4 (Angaly Pattern Studio)."
---

# /pattern-engine-rule

Argument: `<GarmentType>` — one of the values in `GarmentType`
(`packages/pattern-engine/src/types.ts`): `ROBE`, `JUPE`, `PANTALON`, `VESTE`, `COSTUME`,
`CHEMISE`, `ROBE_MARIEE`, `AUTRE`. If no argument, ask which one, and confirm it isn't
already implemented under `packages/pattern-engine/src/rules/`.

## Before scaffolding

1. Read `packages/pattern-engine/src/types.ts` in full — `IPatternRule`,
   `PatternPieceGeometry`, `GrainlineSpec`, `NotchSpec` are the exact contract to implement.
2. Read `.cursor/rules/007-pattern-engine.mdc` — one rule per garment type, zero external
   dependencies, always validate required measurements before computing geometry.
3. Read the relevant section of `docs/specifications/ANGALY_Specifications_Completes.md`
   (§20-26) for the construction logic expected for this garment type, and
   `docs/features/pattern-engine.md` for how this rule fits the wider module.

## Scaffold

Create `packages/pattern-engine/src/rules/<garment-type-kebab>.rule.ts`:

```typescript
import type {
  IPatternRule,
  MeasurementSet,
  PatternParameters,
  PatternPieceGeometry,
} from '../types';

const REQUIRED_MEASUREMENTS = ['TOUR_TAILLE' /* , ... */];

export const <GarmentType>Rule: IPatternRule = {
  garmentType: '<GARMENT_TYPE>',
  requiredMeasurementKeys: REQUIRED_MEASUREMENTS,
  appliesTo(parameters: PatternParameters): boolean {
    return parameters.garmentType === '<GARMENT_TYPE>';
  },
  computePieces(
    parameters: PatternParameters,
    measurements: MeasurementSet,
  ): PatternPieceGeometry[] {
    // TODO: real construction geometry — see spec §24 "Génération du patron"
    // for the pipeline this feeds (aisance, lignes de couture, marges, droit-fil, crans).
    throw new Error('Not implemented');
  },
};
```

Register it where the NestJS `pattern-engine` module builds its `PatternEngine` instance
(`engine.registerRule(<GarmentType>Rule)`) — never inside `pattern-engine.ts` itself.

Create `packages/pattern-engine/src/__tests__/<garment-type-kebab>.rule.test.ts` — test
`appliesTo` for a matching and a non-matching `garmentType`, and `computePieces` with a
realistic, fixed measurement set asserting concrete piece names/count (no mocks needed, the
rule is pure — see `.cursor/rules/004-testing.mdc`).

## After creation

1. `pnpm --filter @angaly/pattern-engine test` green.
2. Update `docs/features/pattern-engine.md` (garment types covered) and
   `docs/checklist-implementation.md`.
