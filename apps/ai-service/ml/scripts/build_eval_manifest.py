"""Builds ml/data/eval/manifest.jsonl from hand labels (ml/data/eval/labels.json) and the provenance
recorded by fetch_eval_photos.py (`candidates.jsonl` in each download folder).

    python -m ml.scripts.build_eval_manifest ~/angaly-eval-images ~/angaly-eval-images-b

Images are mirrored into one folder (--images-out, default ~/angaly-eval-set) so `make eval.photo
IMAGES=…` finds them by `imagePath`. Nothing image-related is written into the repository."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from app.evaluation.manifest import parse_manifest

DATA = Path(__file__).resolve().parents[1] / "data" / "eval"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folders", nargs="+")
    parser.add_argument("--images-out", default="~/angaly-eval-set")
    args = parser.parse_args()
    labels = {k: v for k, v in json.loads((DATA / "labels.json").read_text("utf-8")).items() if not k.startswith("_")}
    images_out = Path(args.images_out).expanduser()
    images_out.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    for folder in map(Path, args.folders):
        folder = folder.expanduser()
        for row in map(json.loads, (folder / "candidates.jsonl").read_text("utf-8").splitlines()):
            if row["id"] not in labels:
                continue
            target = images_out / Path(row["imagePath"]).name
            shutil.copyfile(folder / row["imagePath"], target)
            lines.append(json.dumps({
                "id": row["id"],
                "imagePath": target.name,
                "source": f"Wikimedia Commons — {row['title']} ({row['page']}) — {row['author']}",
                "license": row["license"],
                "category": row["tag"],
                "expected": labels[row["id"]],
            }, ensure_ascii=False))
    parse_manifest(lines)  # fail loudly on a duplicate id or a label the taxonomy rejects
    missing = set(labels) - {json.loads(l)["id"] for l in lines}
    if missing:
        print("labels without a downloaded image:", ", ".join(sorted(missing)))
    (DATA / "manifest.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(lines)} entries → {DATA / 'manifest.jsonl'}")


if __name__ == "__main__":
    main()
