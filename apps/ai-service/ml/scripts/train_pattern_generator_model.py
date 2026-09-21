"""Train a deep-learning pattern-geometry generator prototype, one model per GarmentType.

Data source (real, not fabricated): packages/pattern-engine/scripts/generate-training-data.js
samples (parameters, measurements) pairs and runs them through @angaly/pattern-engine's own
registered IPatternRule implementations — the exact deterministic code that produces
production PatternVersion geometry today. Every training row is therefore a real, exact
pattern-engine output, not a synthetic/hallucinated label.

Model: one sklearn.neural_network.MLPRegressor (a feedforward neural network — 3 hidden
layers here) per GarmentType, predicting the flattened (x, y) vertex coordinates of every
piece's outlineMm from [cutType one-hot + measurements]. Piece topology (piece names, vertex
count and order) is fixed per GarmentType (verified against every sample before training —
see assert_fixed_schema below), which is what makes a fixed-size regression target possible.

IMPORTANT — what this is and is not (see CLAUDE.md rule 18, docs/architecture.md ADR-005):
this model approximates packages/pattern-engine's own deterministic geometry. It is a
prototype proving a DL pattern generator CAN be trained end-to-end on real Angaly data; it is
NOT more accurate than pattern-engine itself (which is exact), and it is NOT wired into
apps/ai-service's served endpoints or any production code path. packages/pattern-engine
remains the only geometry source actually used in production.

Run: `make train.pattern.ai` from the monorepo root (regenerates the samples via Node, then
runs this script), or manually — from apps/ai-service/, with dev dependencies installed and
apps/ai-service/ml/data/raw/pattern_geometry_samples.jsonl already generated (see
packages/pattern-engine/scripts/generate-training-data.js). Writes to ml/models/ (gitignored).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import OneHotEncoder

# One JSON sample row, as written by generate-training-data.js.
Sample = dict[str, Any]

ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "data" / "raw" / "pattern_geometry_samples.jsonl"
MODELS_DIR = ROOT / "models"

MEASUREMENT_KEYS = [
    "TOUR_POITRINE",
    "TOUR_TAILLE",
    "TOUR_BASSIN",
    "LONGUEUR_DOS",
    "LONGUEUR_BRAS",
    "LONGUEUR_JAMBE",
    "LONGUEUR_TRAINE",
]
CUT_TYPES = [
    "DROITE",
    "EVASEE",
    "SIRENE",
    "PRINCESSE",
    "AJUSTEE",
    "OVERSIZE",
    "SLIM",
    "CIGARETTE",
    "LARGE",
    "PALAZZO",
    "FLUIDE",
]


def load_samples() -> dict[str, list[Sample]]:
    by_type: dict[str, list[Sample]] = {}
    with open(RAW_PATH, encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            by_type.setdefault(row["garmentType"], []).append(row)
    return by_type


def assert_fixed_schema(samples: list[Sample], garment_type: str) -> list[tuple[str, int]]:
    schema = [(p["name"], len(p["outlineMm"])) for p in samples[0]["pieces"]]
    for row in samples[1:]:
        row_schema = [(p["name"], len(p["outlineMm"])) for p in row["pieces"]]
        if row_schema != schema:
            raise ValueError(
                f"{garment_type}: inconsistent piece topology between samples — "
                "the DL prototype assumes a fixed piece/vertex schema per GarmentType, "
                "as pattern-engine's rules currently guarantee. If a rule changed its "
                "output shape conditionally, this training script needs a rethink."
            )
    return schema


def features(row: Sample, encoder: OneHotEncoder) -> np.ndarray:
    cut_type_vec = encoder.transform([[row["parameters"]["cutType"]]])[0]
    measurement_vec = np.array(
        [row["measurements"].get(key, 0.0) for key in MEASUREMENT_KEYS], dtype=float
    )
    return np.concatenate([cut_type_vec, measurement_vec])


def target(row: Sample) -> np.ndarray:
    coords: list[float] = []
    for piece in row["pieces"]:
        for point in piece["outlineMm"]:
            coords.append(point["x"])
            coords.append(point["y"])
    return np.array(coords, dtype=float)


def train_one_garment_type(garment_type: str, samples: list[Sample]) -> None:
    schema = assert_fixed_schema(samples, garment_type)

    encoder = OneHotEncoder(categories=[CUT_TYPES], handle_unknown="ignore", sparse_output=False)
    encoder.fit([[c] for c in CUT_TYPES])

    X = np.stack([features(row, encoder) for row in samples])
    y = np.stack([target(row) for row in samples])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = MLPRegressor(
        hidden_layer_sizes=(128, 128, 64),
        activation="relu",
        solver="adam",
        max_iter=2000,
        random_state=42,
        early_stopping=True,
        n_iter_no_change=25,
    )
    model.fit(X_train, y_train)

    predicted = model.predict(X_test)
    mae_mm = float(np.mean(np.abs(predicted - y_test)))
    mae_cm = mae_mm / 10.0
    print(
        f"=== {garment_type} — held-out MAE = {mae_mm:6.2f} mm ({mae_cm:5.2f} cm) "
        f"over {y_test.shape[1]} coordinates, n_test={len(X_test)} ==="
    )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "encoder": encoder,
            "measurement_keys": MEASUREMENT_KEYS,
            "piece_schema": schema,
            "mae_mm": mae_mm,
        },
        MODELS_DIR / f"pattern_generator_{garment_type.lower()}.joblib",
    )


def main() -> None:
    if not RAW_PATH.exists():
        print(
            f"Missing {RAW_PATH} — generate it first with "
            "`node packages/pattern-engine/scripts/generate-training-data.js` "
            "(run `pnpm --filter @angaly/pattern-engine build` first) or `make train.pattern.ai`.",
            file=sys.stderr,
        )
        sys.exit(1)

    by_type = load_samples()
    for garment_type, samples in by_type.items():
        train_one_garment_type(garment_type, samples)

    print(f"\nSaved trained pattern-generator prototypes to {MODELS_DIR}/")


if __name__ == "__main__":
    main()
