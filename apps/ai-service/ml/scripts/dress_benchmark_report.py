"""Markdown review sheet of a dress benchmark: every generated project, its photo (source, licence), what the
vision model read, the pieces produced, and the reviewer's notes. Reads the `results.json` of
`dress_benchmark.py`, the `candidates.jsonl` of the photo fetchers and an optional notes file.

    python ml/scripts/dress_benchmark_report.py --results ~/angaly-dress-bench2/results.json \
        --candidates ~/angaly-dress-images/candidates.jsonl ~/angaly-dress-met/candidates.jsonl \
        --notes ml/data/dress_benchmark_notes.json --out ../../docs/reviews/dress-benchmark.md
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

WEB = "http://localhost:3100"


def load_candidates(paths: list[str]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for item in paths:
        file = Path(item).expanduser()
        if not file.exists():
            continue
        for line in file.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                out[Path(row["imagePath"]).name] = row
    return out


def source_of(name: str, candidates: dict[str, dict]) -> str:
    key = name.replace("robe-portee-", "robe-portee-")
    row = candidates.get(key)
    if name.startswith("ref-"):
        return "Photo fournie par vous (« La robe tendance 2026 »), droits inconnus — hors dépôt"
    if not row:
        return "—"
    title = row.get("title") or row.get("category", "")
    page = row.get("page", "")
    return f"{title} · [{row.get('license', '?')}]({page}) · {row.get('author', '')}".strip(" ·")


def reading(profile: dict) -> str:
    details = ", ".join(f"{k}={v}" for k, v in (profile.get("details") or {}).items())
    fit = profile.get("fit") or {}
    extra = []
    if (fit.get("fullness") or {}).get("skirt"):
        extra.append(f"ourlet/taille ≈ {fit['fullness']['skirt']}")
    if fit.get("fabricPrint") and fit["fabricPrint"] != "UNI":
        extra.append(f"motif {fit['fabricPrint']}")
    if fit.get("fabricBehavior"):
        extra.append(fit["fabricBehavior"])
    blocks = ", ".join(b.get("kind", "") for b in (profile.get("drapeBlocks") or []))
    parts = [f"coupe **{profile.get('cutType')}**", details]
    if blocks:
        parts.append(f"blocs : {blocks}")
    if extra:
        parts.append(" · ".join(extra))
    return " ; ".join(p for p in parts if p)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--results", nargs="+", required=True, help="results.json files, in order")
    ap.add_argument("--labels", nargs="*", default=[], help="a section title per results file")
    ap.add_argument("--candidates", nargs="*", default=[])
    ap.add_argument("--notes", default=None, help="JSON {image-name: {verdict, notes}}")
    ap.add_argument("--extra", default=None, help="markdown appended as is (other projects)")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    candidates = load_candidates(args.candidates)
    notes = json.loads(Path(args.notes).read_text()) if args.notes and Path(args.notes).exists() else {}
    lines = [
        "# Revue — robes générées à partir de photos",
        "",
        "Chaque ligne = un projet Pattern Studio créé par le banc d'essai (photo → analyse IA → patron → 3D).",
        f"Ouvrir : `{WEB}/pattern-studio/projects/<id>` (web Angaly sur le port 3100).",
        "",
        "**Compte à utiliser** : les projets appartiennent au client de démonstration — "
        "`client@angaly.mg` / `Client@Angaly2026!` (un autre compte voit un patron d'exemple, pas le projet).",
        "",
        "Les images restent hors dépôt (droits) ; la source et la licence de chacune sont indiquées. "
        "Les étiquettes IA ne sont pas validées par une couturière : elles n'entrent pas dans l'entraînement.",
        "",
    ]
    total = 0
    for index, path in enumerate(args.results):
        results = json.loads(Path(path).expanduser().read_text())
        title = args.labels[index] if index < len(args.labels) else f"Série {index + 1}"
        lines += [f"## {title}", "", "| Photo | Projet | v | Lecture de l'IA | Pièces | Verdict |", "|---|---|---|---|---|---|"]
        for name, row in results.items():
            if "projectId" not in row:
                lines.append(f"| `{name}` | — | — | {row.get('skipped') or row.get('error', '')} | — | — |")
                continue
            total += 1
            pid = row["projectId"]
            note = notes.get(name, {})
            pieces = ", ".join(f"{p['name']} ×{p['quantity']}" for p in row.get("pieces", []))
            lines.append(
                f"| `{name}`<br><sub>{source_of(name, candidates)}</sub> | [`{pid}`]({WEB}/pattern-studio/projects/{pid}) "
                f"| {row.get('version', '')} | {reading(row['profile'])} | {pieces} | "
                f"{note.get('verdict', '')} {note.get('notes', '')} |"
            )
        lines.append("")
    if args.extra and Path(args.extra).exists():
        lines += [Path(args.extra).read_text(), ""]
    lines.insert(8, f"**{total} projets** dans cette fiche.")
    lines.insert(9, "")
    out = Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n")
    print(f"{total} projects → {out}")


if __name__ == "__main__":
    main()
