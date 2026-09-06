# ANGALY AI Service

FastAPI microservice powering the deep-learning half of **Angaly Pattern
Studio**: inspiration-photo feature detection and measurement-based style
suggestions. Called over internal HTTP by the NestJS `ai-inference` /
`pattern-engine` modules — never by the frontend directly, and never produces
final pattern geometry itself (that's `@angaly/pattern-engine`'s job, the
deterministic "rules set" — see `docs/features/pattern-engine.md`).

## Why a separate service (and why Python)

Confirmed architecture decision (see `docs/phases/phase-0-foundation.md`):
model training/serving tooling (PyTorch, torchvision, scikit-learn) is
Python-native. Keeping it as its own service means the TypeScript apps never
need Python installed, and this service can be scaled/deployed independently.

## Structure

```
app/
  main.py       FastAPI app, routes
  schemas.py    Pydantic request/response models — keep in sync with
                PatternAiSuggestionRequest/Response in packages/types/src/index.ts
tests/          pytest suite
ml/
  notebooks/    Training experiments (never imported by app/) — gitignored outputs
  scripts/      One-off training/export scripts producing an ONNX/pickle artifact
                consumed by app/ at inference time
```

## Status (Phase 0 — foundation)

No trained model exists yet — both endpoints return deterministic, clearly-flagged
placeholder responses (`modelVersion: "placeholder-0.0.0"`) so the NestJS side
can be built and tested against a stable contract before Phase 5 (`docs/phases/phase-5-ai-avancee.md`)
lands the real model.

## Local development

```bash
cd apps/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`. Interactive docs (dev only,
FastAPI's built-in Swagger UI): `http://localhost:8000/docs`.

## Tests

```bash
pytest --cov=app --cov-report=term-missing
```
