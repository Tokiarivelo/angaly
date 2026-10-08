"""Versioned golden-set manifest (`ml/data/eval/manifest.jsonl`).

One JSON object per line. Images live OUTSIDE the repository (MinIO bucket `ml-eval`); the manifest
only references them by `imagePath` (relative to the images directory) and carries the hand-made
labels. The labels use the same shape as `GarmentProfile` (camelCase)."""
from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.garment_knowledge import normalize_profile

MANIFEST_SCHEMA_VERSION = 1


class ManifestEntry(BaseModel):
    id: str = Field(min_length=1)
    image_path: str = Field(alias="imagePath", min_length=1)
    # Provenance / licence is mandatory: an unlabeled origin must never enter the golden set.
    source: str = Field(min_length=1)
    license: str = Field(min_length=1)
    category: str | None = None  # free tag used to slice the report (bridal, drape, non-garment…)
    expected: dict[str, Any]

    model_config = {"populate_by_name": True}


class ManifestError(ValueError):
    pass


def parse_manifest(lines: Iterable[str]) -> list[ManifestEntry]:
    """Parses and validates every line. Labels are normalised with the production
    `normalize_profile`, so a label that the app itself would reject is reported as an error
    instead of silently skewing the metrics."""
    entries: list[ManifestEntry] = []
    seen: set[str] = set()
    for number, line in enumerate(lines, start=1):
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        try:
            entry = ManifestEntry.model_validate(json.loads(text))
        except (json.JSONDecodeError, ValidationError) as exc:
            raise ManifestError(f"line {number}: {exc}") from exc
        if entry.id in seen:
            raise ManifestError(f"line {number}: duplicate id {entry.id!r}")
        seen.add(entry.id)
        normalized = normalize_profile(entry.expected)
        if bool(entry.expected.get("isGarment")) != bool(normalized.get("isGarment")):
            raise ManifestError(f"line {number}: label for {entry.id!r} is rejected by the taxonomy")
        entry.expected = normalized
        entries.append(entry)
    return entries


def load_manifest(path: Path) -> list[ManifestEntry]:
    return parse_manifest(path.read_text(encoding="utf-8").splitlines())
