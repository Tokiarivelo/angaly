from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from calibrate_fabrics import parse_variant, summary_rows  # noqa: E402


def test_parse_variant() -> None:
    assert parse_variant("soft:bending=1,mass=0.2") == ("soft", ["--set", "bending=1", "--set", "mass=0.2"])
    assert parse_variant("base") == ("base", [])
    assert parse_variant("bare:--no-petticoat,--support=5,bending=2") == (
        "bare",
        ["--no-petticoat", "--support", "5", "--set", "bending=2"],
    )
    with pytest.raises(ValueError):
        parse_variant("bad:bending")


def test_summary_rows() -> None:
    rows = summary_rows(
        [
            {
                "name": "met-005",
                "variant": "base",
                "target": 3.0,
                "fabric": "STRUCTURE",
                "before": {"silhouette": {"ratio": 3.1}},
                "after": {"silhouette": {"ratio": 2.6}, "hemDropMm": 12.0, "underFloor": 0, "bareArm": 0.01},
                "secondsPerFrame": 1.4,
            },
            {"name": "x", "variant": "soft", "target": None, "after": None, "before": None},
        ]
    )
    assert rows[2] == "| met-005 | STRUCTURE | 3.0 | 3.1 | base | 2.6 | -0.40 | 12.0 | 0 | 1.0% | 1.4 |"
    assert rows[3].startswith("| x | — | None | — | soft | — | — |")
