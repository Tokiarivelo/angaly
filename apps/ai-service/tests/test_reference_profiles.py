"""Hand-studied reference photos (ml/data/references): every label must survive normalize_profile unchanged."""

import json
from pathlib import Path

import pytest

from app.garment_knowledge import normalize_profile

REFERENCES = sorted((Path(__file__).resolve().parent.parent / "ml" / "data" / "references").glob("*.json"))


def test_references_exist() -> None:
    assert REFERENCES, "ml/data/references holds at least one reference"


@pytest.mark.parametrize("path", REFERENCES, ids=lambda p: p.stem)
def test_reference_profile_is_a_valid_label(path: Path) -> None:
    reference = json.loads(path.read_text(encoding="utf-8"))
    assert reference["id"] == path.stem
    # The image never lives in the repository: only its hash, source and licence.
    assert len(reference["image"]["sha256"]) == 64
    assert reference["image"]["source"] and reference["image"]["license"]
    profile = reference["profile"]
    assert normalize_profile(profile) == profile


@pytest.mark.parametrize("path", REFERENCES, ids=lambda p: p.stem)
def test_reference_engine_parameters_follow_the_label(path: Path) -> None:
    reference = json.loads(path.read_text(encoding="utf-8"))
    profile = reference["profile"]
    parameters = reference["engine"]["parameters"]
    assert parameters["garmentType"] == profile["garmentType"]
    assert parameters["cutType"] == profile["cutType"]
    assert parameters["details"] == profile["details"]
    fit = profile.get("fit") or {}
    for key in ("ease", "fullness", "lengths"):  # the fabric's look is informative only
        if key in fit:
            assert parameters[key] == fit[key]
