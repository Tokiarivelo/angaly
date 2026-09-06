# Training / export scripts

Empty by design (Phase 0). Phase 5 adds one-off scripts here that:

1. train or fine-tune a model from a notebook in `ml/notebooks/`,
2. export it to a servable artifact (ONNX preferred for portability),
3. write it to `ml/models/` (gitignored — fetched by CI/CD or mounted at deploy
   time, not committed — see `docs/deployment.md` once that section exists).

`app/inference.py` is the only place in `app/` allowed to load a model artifact.
