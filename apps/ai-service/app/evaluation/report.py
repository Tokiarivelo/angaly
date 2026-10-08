"""Thresholds, regression check against a baseline and the Markdown/JSON report."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# (slash path into the metrics dict, "higher" | "lower" = which direction is better, label)
HEADLINE: tuple[tuple[str, str, str], ...] = (
    ("garmentDetection/recall", "higher", "isGarment — rappel"),
    ("garmentDetection/precision", "higher", "isGarment — précision"),
    ("garmentDetection/falsePositiveRate", "lower", "isGarment — faux positifs"),
    ("fieldAccuracy/garmentType/accuracy", "higher", "Exactitude garmentType"),
    ("fieldAccuracy/cutType/accuracy", "higher", "Exactitude cutType"),
    ("f1/garmentType/macroF1", "higher", "F1 macro garmentType"),
    ("f1/cutType/macroF1", "higher", "F1 macro cutType"),
    ("drapeBlocks/f1", "higher", "F1 blocs de drapé"),
    ("validationRejection/rate", "lower", "Taux de valeurs rejetées"),
    ("analysisFailureRate", "lower", "Échecs d'analyse"),
)


def lookup(metrics: dict[str, Any], path: str) -> float | None:
    node: Any = metrics
    for part in path.split("/"):
        if not isinstance(node, dict):
            return None
        node = node.get(part)
    return float(node) if isinstance(node, (int, float)) and not isinstance(node, bool) else None


@dataclass(frozen=True)
class Finding:
    path: str
    kind: str  # "threshold" | "regression"
    message: str


def check_thresholds(metrics: dict[str, Any], thresholds: dict[str, Any]) -> list[Finding]:
    """`thresholds` = {"min": {path: x}, "max": {path: x}}. A metric that cannot be computed
    (no labelled sample) is reported, never silently passed."""
    findings: list[Finding] = []
    for bound, comparator in (("min", lambda v, t: v < t), ("max", lambda v, t: v > t)):
        for path, limit in (thresholds.get(bound) or {}).items():
            value = lookup(metrics, path)
            if value is None:
                findings.append(Finding(path, "threshold", f"{path}: non calculable (aucun échantillon)"))
            elif comparator(value, float(limit)):
                findings.append(
                    Finding(path, "threshold", f"{path} = {value:.3f} ({bound} attendu : {float(limit):.3f})")
                )
    return findings


def check_regressions(
    metrics: dict[str, Any], baseline: dict[str, Any], tolerance: float = 0.02
) -> list[Finding]:
    """A headline metric that got worse than the baseline by more than `tolerance` (absolute)."""
    findings: list[Finding] = []
    for path, direction, label in HEADLINE:
        now, before = lookup(metrics, path), lookup(baseline, path)
        if now is None or before is None:
            continue
        worse = before - now if direction == "higher" else now - before
        if worse > tolerance:
            findings.append(
                Finding(path, "regression", f"{label} : {before:.3f} → {now:.3f} (tolérance {tolerance:.2f})")
            )
    return findings


def _pct(value: float | None) -> str:
    return "n/a" if value is None else f"{value * 100:.1f} %"


def render_markdown(
    metrics: dict[str, Any], findings: list[Finding], meta: dict[str, Any]
) -> str:
    lines = [
        "# Rapport d'évaluation — analyse de photo",
        "",
        f"- Modèle / fournisseur : `{meta.get('model', 'inconnu')}`",
        f"- Manifeste : `{meta.get('manifest', '?')}` ({metrics['samples']} échantillons)",
        "",
        "## Indicateurs clés",
        "",
        "| Indicateur | Valeur |",
        "|---|---|",
    ]
    for path, _direction, label in HEADLINE:
        lines.append(f"| {label} | {_pct(lookup(metrics, path))} |")

    lines += ["", "## Exactitude par champ", "", "| Champ | n | Exactitude |", "|---|---|---|"]
    for name, row in metrics["fieldAccuracy"].items():
        lines.append(f"| {name} | {row['n']} | {_pct(row['accuracy'])} |")

    lines += ["", "## Ajustements (aisance, ampleur, longueurs)", "", "| Valeur | n | Couverture | MAE / exactitude |", "|---|---|---|---|"]
    for name, row in metrics["fit"].items():
        if name == "ease":
            lines.append(f"| ease | {row['n']} | — | {_pct(row['accuracy'])} |")
        else:
            mae = "n/a" if row["mae"] is None else f"{row['mae']:.2f}"
            lines.append(f"| {name} | {row['n']} | {_pct(row['coverage'])} | {mae} |")

    lines += ["", "## Par catégorie", "", "| Catégorie | n | garmentType | cutType |", "|---|---|---|---|"]
    for name, row in metrics["byCategory"].items():
        lines.append(
            f"| {name} | {row['samples']} | {_pct(row['garmentTypeAccuracy'])} | {_pct(row['cutTypeAccuracy'])} |"
        )

    latency = metrics["latency"]
    if latency["n"]:
        lines += ["", f"Latence : moyenne {latency['meanMs']:.0f} ms, p95 {latency['p95Ms']:.0f} ms."]

    lines += ["", "## Seuils et régressions", ""]
    lines += [f"- ❌ {f.message}" for f in findings] or ["- ✅ Aucun seuil franchi, aucune régression."]
    return "\n".join(lines) + "\n"
