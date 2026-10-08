"""Pure, dependency-free metrics comparing predicted garment profiles to hand-made labels.

A *prediction* is the profile the analysis returned (already normalised, i.e. what the wizard would
receive) or `None` when the analysis failed/fell back. Everything here is deterministic."""
from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from app.garment_knowledge import normalize_profile

Profile = Mapping[str, Any]

SCALAR_FIELDS = ("garmentType", "cutType", "occasion", "style", "constructionMethod", "presentation")
F1_FIELDS = ("garmentType", "cutType")
FIT_NUMBERS = ("fullness.skirt", "fullness.sleeve", "lengths.skirtPct", "lengths.sleevePct", "lengths.bodicePct")


@dataclass(frozen=True)
class Sample:
    id: str
    expected: Profile
    predicted: Profile | None  # None = analysis failed / fallback
    category: str | None = None
    latency_ms: float | None = None
    raw: Profile | None = None  # un-normalised model output, when available


def _ratio(num: float, den: float) -> float | None:
    return None if den == 0 else num / den


def _get_path(profile: Profile | None, path: str) -> Any:
    node: Any = profile
    for part in path.split("."):
        if not isinstance(node, Mapping):
            return None
        node = node.get(part)
    return node


def garment_detection(samples: Sequence[Sample]) -> dict[str, Any]:
    """`isGarment` confusion matrix. A failed analysis counts as "not a garment"."""
    tp = fp = fn = tn = 0
    for s in samples:
        truth = bool(s.expected.get("isGarment"))
        guess = bool(s.predicted and s.predicted.get("isGarment"))
        if truth and guess:
            tp += 1
        elif guess:
            fp += 1
        elif truth:
            fn += 1
        else:
            tn += 1
    return {
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": _ratio(tp, tp + fp),
        "recall": _ratio(tp, tp + fn),
        "falsePositiveRate": _ratio(fp, fp + tn),
        "falseNegativeRate": _ratio(fn, fn + tp),
    }


def _garment_pairs(samples: Sequence[Sample]) -> list[Sample]:
    """Samples where the label is a garment — field accuracy is only meaningful there."""
    return [s for s in samples if s.expected.get("isGarment")]


def field_accuracy(samples: Sequence[Sample]) -> dict[str, dict[str, Any]]:
    """Exact-match accuracy per field over labelled garments. Labels left empty are skipped;
    a missing prediction counts as wrong (it forces the customer to fill the field by hand)."""
    out: dict[str, dict[str, Any]] = {}
    pairs = _garment_pairs(samples)
    paths = list(SCALAR_FIELDS) + sorted(
        {f"details.{k}" for s in pairs for k in (s.expected.get("details") or {})}
    )
    for path in paths:
        total = correct = 0
        for s in pairs:
            truth = _get_path(s.expected, path)
            if truth is None:
                continue
            total += 1
            correct += int(_get_path(s.predicted, path) == truth)
        if total:
            out[path] = {"n": total, "accuracy": correct / total}
    return out


def per_class_f1(samples: Sequence[Sample], field: str) -> dict[str, Any]:
    pairs = [s for s in _garment_pairs(samples) if s.expected.get(field) is not None]
    truths = [s.expected[field] for s in pairs]
    guesses = [_get_path(s.predicted, field) for s in pairs]
    classes = sorted({*truths, *(g for g in guesses if g is not None)})
    per_class: dict[str, dict[str, float | int]] = {}
    for cls in classes:
        tp = sum(1 for t, g in zip(truths, guesses, strict=True) if t == cls and g == cls)
        fp = sum(1 for t, g in zip(truths, guesses, strict=True) if t != cls and g == cls)
        fn = sum(1 for t, g in zip(truths, guesses, strict=True) if t == cls and g != cls)
        precision, recall = _ratio(tp, tp + fp) or 0.0, _ratio(tp, tp + fn) or 0.0
        f1 = 0.0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)
        per_class[cls] = {"support": tp + fn, "precision": precision, "recall": recall, "f1": f1}
    supported = [v["f1"] for v in per_class.values() if v["support"] > 0]
    return {"macroF1": sum(supported) / len(supported) if supported else None, "classes": per_class}


def fit_errors(samples: Sequence[Sample]) -> dict[str, Any]:
    """MAE per numeric fit value (only where label AND prediction both carry it) + how often the
    photo gave a value when the label has one (`coverage`). Ease is categorical → accuracy."""
    pairs = _garment_pairs(samples)
    out: dict[str, Any] = {}
    for path in FIT_NUMBERS:
        gaps: list[float] = []
        labelled = 0
        for s in pairs:
            truth = _get_path(s.expected, f"fit.{path}")
            if not isinstance(truth, (int, float)):
                continue
            labelled += 1
            guess = _get_path(s.predicted, f"fit.{path}")
            if isinstance(guess, (int, float)):
                gaps.append(abs(float(guess) - float(truth)))
        if labelled:
            out[path] = {
                "n": labelled,
                "coverage": len(gaps) / labelled,
                "mae": sum(gaps) / len(gaps) if gaps else None,
            }
    ease_total = ease_ok = 0
    for s in pairs:
        truth = _get_path(s.expected, "fit.ease")
        if truth is None:
            continue
        ease_total += 1
        ease_ok += int(_get_path(s.predicted, "fit.ease") == truth)
    if ease_total:
        out["ease"] = {"n": ease_total, "accuracy": ease_ok / ease_total}
    return out


def drape_blocks_f1(samples: Sequence[Sample]) -> dict[str, Any]:
    """Set-level F1 on the proposed block *kinds* (parameters are covered by the fit/engine metrics).
    An absent list is read as 'no block'."""
    tp = fp = fn = 0
    for s in _garment_pairs(samples):
        truth = {b["kind"] for b in (s.expected.get("drapeBlocks") or [])}
        guess = {b["kind"] for b in ((s.predicted or {}).get("drapeBlocks") or [])}
        tp, fp, fn = tp + len(truth & guess), fp + len(guess - truth), fn + len(truth - guess)
    precision, recall = _ratio(tp, tp + fp), _ratio(tp, tp + fn)
    f1 = None if not precision or not recall else 2 * precision * recall / (precision + recall)
    return {"tp": tp, "fp": fp, "fn": fn, "precision": precision, "recall": recall, "f1": f1}


def _leaf_values(profile: Profile) -> set[str]:
    """Flattened `path=value` set of everything the model asserted (used for the rejection rate)."""
    leaves: set[str] = set()

    def walk(node: Any, path: str) -> None:
        if isinstance(node, Mapping):
            for key, value in node.items():
                if key in {"certainty", "constructionNotes", "isGarment"}:
                    continue
                walk(value, f"{path}.{key}" if path else str(key))
        elif isinstance(node, list):
            for index, value in enumerate(node):
                walk(value, f"{path}[{index}]")
        elif node is not None and node != "":
            leaves.add(f"{path}={node}")

    walk(profile, "")
    return leaves


def validation_rejection_rate(samples: Sequence[Sample]) -> dict[str, Any]:
    """Share of asserted values (raw model output) that `normalize_profile` refuses or rewrites.
    A high rate means the prompt/model drifts from the closed vocabulary."""
    asserted = rejected = 0
    for s in samples:
        if s.raw is None:
            continue
        before = _leaf_values(s.raw)
        after = _leaf_values(normalize_profile(dict(s.raw)))
        asserted += len(before)
        rejected += len(before - after)
    return {"asserted": asserted, "rejected": rejected, "rate": _ratio(rejected, asserted)}


def latency(samples: Sequence[Sample]) -> dict[str, Any]:
    values = sorted(s.latency_ms for s in samples if s.latency_ms is not None)
    if not values:
        return {"n": 0, "meanMs": None, "p95Ms": None}
    p95 = values[min(len(values) - 1, math.ceil(0.95 * len(values)) - 1)]
    return {"n": len(values), "meanMs": sum(values) / len(values), "p95Ms": p95}


def compute_metrics(samples: Sequence[Sample]) -> dict[str, Any]:
    """The full report body. `byCategory` re-runs the headline numbers per tag (bridal, drape…)."""
    by_category: dict[str, list[Sample]] = defaultdict(list)
    for s in samples:
        by_category[s.category or "untagged"].append(s)
    return {
        "samples": len(samples),
        "analysisFailureRate": _ratio(sum(1 for s in samples if s.predicted is None), len(samples)),
        "garmentDetection": garment_detection(samples),
        "fieldAccuracy": field_accuracy(samples),
        "f1": {f: per_class_f1(samples, f) for f in F1_FIELDS},
        "fit": fit_errors(samples),
        "drapeBlocks": drape_blocks_f1(samples),
        "validationRejection": validation_rejection_rate(samples),
        "latency": latency(samples),
        "byCategory": {
            name: {
                "samples": len(group),
                "garmentTypeAccuracy": field_accuracy(group).get("garmentType", {}).get("accuracy"),
                "cutTypeAccuracy": field_accuracy(group).get("cutType", {}).get("accuracy"),
            }
            for name, group in sorted(by_category.items())
        },
    }
