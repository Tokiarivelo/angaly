"""Train a statistical measurement-imputation model for Pattern Studio.

Data source (real, public, per-subject anthropometric survey — not synthetic):
ANSUR II (2012 Anthropometric Survey of U.S. Army Personnel, released publicly
2017), 4082 male + 1986 female subjects, 93 measurements each. Downloaded from
the public GitHub mirror https://github.com/senihberkay/US-Army-ANSUR-II
(original: https://www.openlab.psu.edu/ansur2/) into ml/data/raw/ — see
docs/features/ai-inference.md for the full provenance note.

Model: one `sklearn.impute.IterativeImputer` (MICE-style chained regression)
per gender, fit on the 6 canonical measurement keys + stature (height) and
weight. At inference time (app/local_model.py), a row with known measurements
and NaN for missing ones is fed through `transform()`, which predicts the
missing values from whichever are known — this is a genuine statistical model
learned from real body-measurement data, not a nearest-neighbour lookup.

Run: `python ml/scripts/train_measurement_model.py` from apps/ai-service/,
with the dev dependencies (scikit-learn, pandas, joblib) installed.
Writes to ml/models/ (gitignored — see ml/scripts/README.md).
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.experimental import (
    enable_iterative_imputer,  # noqa: F401 — required to unlock IterativeImputer
)
from sklearn.impute import IterativeImputer
from sklearn.linear_model import BayesianRidge
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
MODELS_DIR = ROOT / "models"

# ANSUR II column -> canonical Angaly measurement key (mm -> cm via /10).
# See docs/features/measurements.md for the canonical key vocabulary.
COLUMN_MAP = {
    "chestcircumference": "TOUR_POITRINE",
    "waistcircumference": "TOUR_TAILLE",
    "buttockcircumference": "TOUR_BASSIN",  # closest ANSUR II proxy for hip/seat girth
    "waistbacklength": "LONGUEUR_DOS",
    "biacromialbreadth": "CARRURE_DOS",
    "neckcircumference": "TOUR_COU",
}
CANONICAL_KEYS = list(COLUMN_MAP.values())
AUX_COLUMNS = ["stature", "weightkg"]  # extra context features, kept as-is (mm / decikg)


def load_gender_frame(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, encoding="latin1")
    columns = list(COLUMN_MAP) + AUX_COLUMNS
    frame = df[columns].rename(columns=COLUMN_MAP).astype(float)
    # ANSUR II circumferences/lengths are in mm, height in mm, weight in 0.1 kg.
    for key in CANONICAL_KEYS + ["stature"]:
        frame[key] = frame[key] / 10.0  # -> cm
    frame["weightkg"] = frame["weightkg"] / 10.0  # -> kg
    return frame


def train_and_evaluate(
    frame: pd.DataFrame, label: str
) -> tuple[IterativeImputer, dict[str, float]]:
    train_df, test_df = train_test_split(frame, test_size=0.2, random_state=42)

    imputer = IterativeImputer(
        estimator=BayesianRidge(),
        max_iter=25,
        random_state=42,
        sample_posterior=False,
    )
    imputer.fit(train_df.values)

    # Evaluate: for each canonical key, mask it out on the held-out set and
    # measure how well the model recovers it from the other known columns —
    # this is the exact task the model performs in production. Persisted
    # alongside the model so app/local_model.py can derive an honest,
    # per-key confidence score instead of a made-up constant.
    columns = list(frame.columns)
    mae_by_key: dict[str, float] = {}
    print(f"\n=== {label} — held-out MAE per measurement key (n={len(test_df)}) ===")
    for key in CANONICAL_KEYS:
        idx = columns.index(key)
        masked = test_df.values.copy()
        truth = masked[:, idx].copy()
        masked[:, idx] = np.nan
        predicted = imputer.transform(masked)[:, idx]
        mae = float(np.mean(np.abs(predicted - truth)))
        mae_by_key[key] = mae
        print(f"  {key:15s} MAE = {mae:5.2f} cm")

    return imputer, mae_by_key


def main() -> None:
    if not (RAW_DIR / "ansur2_male.csv").exists():
        print(
            f"Missing {RAW_DIR / 'ansur2_male.csv'} — download the ANSUR II CSVs first "
            "(see module docstring for source URLs).",
            file=sys.stderr,
        )
        sys.exit(1)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    male = load_gender_frame(RAW_DIR / "ansur2_male.csv")
    female = load_gender_frame(RAW_DIR / "ansur2_female.csv")

    homme_imputer, homme_mae = train_and_evaluate(male, "HOMME")
    femme_imputer, femme_mae = train_and_evaluate(female, "FEMME")

    joblib.dump(
        {"imputer": homme_imputer, "columns": list(male.columns), "mae_by_key": homme_mae},
        MODELS_DIR / "measurement_imputer_homme.joblib",
    )
    joblib.dump(
        {"imputer": femme_imputer, "columns": list(female.columns), "mae_by_key": femme_mae},
        MODELS_DIR / "measurement_imputer_femme.joblib",
    )
    print(f"\nSaved trained imputers to {MODELS_DIR}/")


if __name__ == "__main__":
    main()
