# Training / export scripts

Empty by design (Phase 0). Phase 5 adds one-off scripts here that:

1. train or fine-tune a model from a notebook in `ml/notebooks/`,
2. export it to a servable artifact (ONNX preferred for portability),
3. write it to `ml/models/` (gitignored — fetched by CI/CD or mounted at deploy
   time, not committed — see `docs/deployment.md` once that section exists).

`app/inference.py` is the only place in `app/` allowed to load a model artifact.

`ml/data/standard_measurements.json` (and its CSV siblings), produced by
`generate_standard_measurements.py`, is now actively used — mirrored as
`app/size_charts.py` (served to the frontend via `packages/types/src/size-charts.ts`
and the `GET /measurements/size-charts` NestJS endpoint) and used to ground
`suggest_pattern_parameters`/`estimate_missing_measurements` prompts in
`app/inference.py`. Keep the three copies in sync if the chart values change.
