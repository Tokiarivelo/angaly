# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# ANGALY — AI Service (FastAPI)
# ml/ (training notebooks/scripts) is intentionally NOT copied into this
# image — only the served app/ package and its trained-model artifact.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM deps AS runner
COPY app/ ./app/
# Trained model artifacts (Phase 5) are copied here once they exist, e.g.:
# COPY ml/models/pattern-suggestion.onnx ./ml/models/

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
