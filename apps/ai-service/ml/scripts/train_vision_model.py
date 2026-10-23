"""Trains the local photo-analysis model (`app/local_vision.py`): CLIP image embeddings → one classifier per field
(garment type, cut, presentation, occasion, style, length, sleeves, collar, neckline, ease) and a regressor for the
skirt fullness, from Angaly's own photo readings. Never trained on the golden set (`ml/data/eval`), which only
measures it.

Labels (versioned, `ml/data/vision/` + benchmark readings): read by Claude Opus 5.5 at the user's request, NOT validated
by a seamstress — the model is a fallback for when no vision provider answers, never a source of truth.

    .venv/bin/python ml/scripts/train_vision_model.py            # embeds (cached), trains, evaluates, saves the model
    .venv/bin/python ml/scripts/train_vision_model.py --no-save  # evaluation only
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from app import local_vision  # noqa: E402

HOME = Path.home()
DATA = ROOT / "ml" / "data"
CACHE = ROOT / "ml" / "models" / "vision_embeddings.npz"
PHOTO_DIRS = [
    HOME / "angaly-garment-bench-photos",
    HOME / "angaly-dress-images",
    HOME / "angaly-dress-met",
    HOME / "angaly-vision-extra",
    HOME / "angaly-vision-extra2",
    HOME / "angaly-vision-extra3",
    HOME / "angaly-vision-met",
    HOME / "angaly-sleeves",
]
GOLDEN_DIR = HOME / "angaly-eval-set"
# Non-garment photos with people in them (a coat in an engraving, a man in a chair): left out of the negatives.
NOT_NEGATIVE = {"non-vetement-010.jpg", "non-vetement-014.jpg"}

CLASS_FIELDS = ["garmentType", "cutType", "presentation", "occasion", "style", "fit.ease",
                "details.longueur", "details.manches", "details.col", "details.decollete"]
# Cosine similarity (CLIP) above which a training photo is taken for a copy of a golden one.
NEAR_DUPLICATE_SIM = 0.95
# A field is filled only above the probability where cross-validated answers are right this often.
TARGET_PRECISION = 0.8
# A class needs this many examples to be learnt; rarer ones are left out of that field.
MIN_PER_CLASS = 3


def load_readings() -> dict[str, dict]:
    """name → {garmentType, cutType, presentation, occasion, style, details, fit}."""
    rows: dict[str, dict] = {}
    for part, var in (("labels_part1.py", "L"), ("labels_part2.py", "L2"), ("labels_part3.py", "L3"), ("labels_part4.py", "L4")):
        scope: dict = {}
        exec((DATA / "vision" / part).read_text(), scope)  # noqa: S102 — our own data file
        table = scope.get(var) or {}
        for name, (garment, cut, pres, occ, style, details, ease, skirt) in table.items():
            fit: dict = {}
            if ease:
                fit["ease"] = ease
            if skirt is not None:
                fit["fullness"] = {"skirt": skirt}
            rows[name] = {"garmentType": garment, "cutType": cut, "presentation": pres, "occasion": occ, "style": style,
                          "details": details, "fit": fit}
    # Benchmark readings (dresses, then the other garments): same reader, richer fit.
    for file, default_garment in (("dress_benchmark_opus_analysis.json", "ROBE"), ("garment_benchmark_opus_analysis.json", None)):
        for name, r in json.loads((DATA / file).read_text()).items():
            if name.startswith("_"):
                continue
            row = rows.setdefault(name, {})
            row.update({k: v for k, v in {
                "garmentType": r.get("garmentType", default_garment), "cutType": r.get("cutType"),
                "presentation": r.get("presentation"), "occasion": r.get("occasion"), "style": r.get("style"),
                "details": r.get("details", {}), "fit": r.get("fit", {})}.items() if v})
    sleeves = HOME / "angaly-sleeves" / "analysis.json"
    if sleeves.exists():
        for r in json.loads(sleeves.read_text()).values():
            name = Path(r["image"]).name
            rows.setdefault(name, {"garmentType": r.get("garmentType"), "details": {"manches": r["manches"]} if r.get("manches") else {}, "fit": {}})
    for p in (HOME / "angaly-vision-extra" / "non-vetement").glob("*.jpg"):
        if p.name not in NOT_NEGATIVE:
            rows[p.name] = {"garmentType": "NON_VETEMENT", "details": {}, "fit": {}}
    return rows


def find_photos(names: set[str]) -> dict[str, Path]:
    found: dict[str, Path] = {}
    for d in PHOTO_DIRS:
        for p in d.rglob("*"):
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"} and p.name in names and p.name not in found:
                found[p.name] = p
    return found


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def golden() -> list[dict]:
    rows = [json.loads(line) for line in (DATA / "eval" / "manifest.jsonl").read_text().splitlines() if line.strip()]
    out = []
    for r in rows:
        path = GOLDEN_DIR / Path(r["imagePath"]).name
        if path.exists():
            out.append({**r, "path": path})
    return out


def embed_all(paths: list[Path]) -> np.ndarray:
    cache: dict[str, np.ndarray] = {}
    if CACHE.exists():
        data = np.load(CACHE)
        cache = {k: data[k] for k in data.files}
    out = []
    for i, p in enumerate(paths):
        key = sha(p)
        if key not in cache:
            cache[key] = local_vision.embed(p.read_bytes())
        out.append(cache[key])
        if (i + 1) % 50 == 0:
            print(f"  embedded {i + 1}/{len(paths)}", flush=True)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(CACHE, **cache)
    return np.stack(out)


def field_value(row: dict, field: str) -> str | None:
    if field.startswith("details."):
        return (row.get("details") or {}).get(field.split(".", 1)[1])
    if field == "fit.ease":
        return (row.get("fit") or {}).get("ease")
    if field == "garmentType" and not row.get("isGarment", True):
        return "NON_VETEMENT"
    return row.get(field)


def train_field(x: np.ndarray, y: list[str | None]) -> tuple[object, float, float, int] | None:
    """Logistic regression on the labelled rows; 5-fold accuracy, and the probability above which the cross-validated
    predictions are right at least TARGET_PRECISION of the time (the field is left empty below it)."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import StratifiedKFold, cross_val_predict

    counts = Counter(v for v in y if v)
    keep = [i for i, v in enumerate(y) if v and counts[v] >= MIN_PER_CLASS]
    classes = {y[i] for i in keep}
    if len(classes) < 2:
        return None
    xs, ys = x[keep], np.array([y[i] for i in keep])
    clf = LogisticRegression(C=4.0, max_iter=4000, class_weight="balanced")
    folds = min(5, min(Counter(ys).values()))
    proba = cross_val_predict(clf, xs, ys, cv=StratifiedKFold(folds, shuffle=True, random_state=0), method="predict_proba")
    labels = np.array(sorted(classes))
    pred = labels[np.argmax(proba, axis=1)]
    conf = np.max(proba, axis=1)
    acc = float(np.mean(pred == ys))
    threshold = 0.95
    for t in np.arange(0.2, 0.95, 0.025):
        kept = conf >= t
        if kept.sum() >= max(5, 0.25 * len(ys)) and np.mean(pred[kept] == ys[kept]) >= TARGET_PRECISION:
            threshold = float(t)
            break
    clf.fit(xs, ys)
    return clf, acc, threshold, len(ys)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--no-save", action="store_true")
    args = ap.parse_args()
    if not local_vision.encoder_available():
        sys.exit(f"encodeur absent : {local_vision.ENCODER}")

    readings = load_readings()
    photos = find_photos(set(readings))
    gold = golden()
    gold_hashes = {sha(g["path"]) for g in gold}
    gold_names = {Path(g["imagePath"]).name for g in gold}
    seen: set[str] = set()
    train = []
    for n, p in sorted(photos.items()):
        h = sha(p)
        if n in gold_names or h in gold_hashes or h in seen:
            continue
        seen.add(h)
        train.append((n, p))
    x = embed_all([p for _, p in train])
    # A golden photo resized or re-encoded is still the same photo: drop anything that looks like one.
    xg_all = embed_all([g["path"] for g in gold])
    sim = (x / np.linalg.norm(x, axis=1, keepdims=True)) @ (xg_all / np.linalg.norm(xg_all, axis=1, keepdims=True)).T
    near = sim.max(axis=1) >= NEAR_DUPLICATE_SIM
    train = [t for t, drop in zip(train, near) if not drop]
    x = x[~near]
    print(f"lectures {len(readings)}, photos trouvées {len(photos)}, entraînement {len(train)} "
          f"(golden ou doublon exclus : {len(photos) - len(train)}, dont {int(near.sum())} quasi identiques à une photo du golden)")
    rows = [readings[n] for n, _ in train]

    model: dict = {"version": date.today().isoformat(), "fields": {}, "regressors": {}, "min_proba": {}, "metrics": {}}
    for field in CLASS_FIELDS:
        trained = train_field(x, [field_value(r, field) for r in rows])
        if trained is None:
            continue
        clf, acc, threshold, n = trained
        model["fields"][field] = clf
        model["min_proba"][field] = threshold
        model["metrics"][field] = {"cvAccuracy": round(acc, 3), "n": n, "threshold": round(threshold, 3)}
        print(f"  {field:20s} n={n:4d}  acc(CV)={acc:.2f}  seuil={threshold:.2f}  classes={list(clf.classes_)}")

    # Skirt fullness (hem ÷ waist) for dresses and skirts.
    from sklearn.linear_model import Ridge
    from sklearn.model_selection import cross_val_predict

    idx = [i for i, r in enumerate(rows) if ((r.get("fit") or {}).get("fullness") or {}).get("skirt")]
    if len(idx) >= 20:
        ys = np.array([rows[i]["fit"]["fullness"]["skirt"] for i in idx], dtype=float)
        reg = Ridge(alpha=1.0)
        pred = cross_val_predict(reg, x[idx], ys, cv=5)
        mae = float(np.mean(np.abs(pred - ys)))
        base = float(np.mean(np.abs(ys - ys.mean())))
        print(f"  fullness.skirt       n={len(idx):4d}  MAE(CV)={mae:.2f} (moyenne seule : {base:.2f})")
        if mae < base:
            reg.fit(x[idx], ys)
            model["regressors"]["fullness.skirt"] = reg
        model["metrics"]["fullness.skirt"] = {"cvMae": round(mae, 3), "baselineMae": round(base, 3), "n": len(idx)}

    # Golden set: measured, never trained on.
    print(f"\njeu de référence (golden) : {len(gold)} photos")
    xg = embed_all([g["path"] for g in gold])
    report: dict[str, dict] = {}
    for field in ["garmentType", "presentation", "details.manches", "details.longueur", "cutType", "occasion"]:
        clf = model["fields"].get(field)
        if clf is None:
            continue
        hit = total = answered = 0
        for g, v in zip(gold, xg):
            exp = g["expected"]
            truth = ("NON_VETEMENT" if not exp.get("isGarment") else exp.get("garmentType")) if field == "garmentType" else field_value(exp, field)
            if truth is None:
                continue
            total += 1
            proba = clf.predict_proba(v[None, :])[0]
            k = int(np.argmax(proba))
            if proba[k] < model["min_proba"][field]:
                continue
            answered += 1
            hit += int(str(clf.classes_[k]) == truth)
        if total:
            report[field] = {"n": total, "answered": answered, "accuracyWhenAnswered": round(hit / answered, 3) if answered else None,
                             "accuracyOverall": round(hit / total, 3)}
            print(f"  {field:20s} n={total:3d} répondu={answered:3d}  justes quand répond={hit}/{answered}  global={hit / total:.2f}")
    model["metrics"]["golden"] = report
    model["trainedOn"] = len(train)

    if not args.no_save:
        import joblib

        joblib.dump(model, local_vision.PROFILE_MODEL)
        (DATA / "vision" / "metrics.json").write_text(json.dumps(model["metrics"], ensure_ascii=False, indent=1) + "\n")
        print(f"\nmodèle enregistré : {local_vision.PROFILE_MODEL}")


if __name__ == "__main__":
    main()
