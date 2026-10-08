"""The detail options exist in @angaly/types (source of truth), the web and here: they must not drift."""

import re
from pathlib import Path

from app.garment_knowledge import DETAIL_OPTIONS

SOURCE = Path(__file__).resolve().parents[3] / "packages" / "types" / "src" / "pattern-detail-options.ts"


def _shared_options() -> dict[str, list[str]]:
    body = SOURCE.read_text(encoding="utf-8").split("PATTERN_DETAIL_OPTIONS = {", 1)[1].split("} as const", 1)[0]
    return {
        group: re.findall(r"'([A-Z_]+)'", ids)
        for group, ids in re.findall(r"(\w+):\s*\[([^\]]*)\]", body)
    }


def test_ai_service_detail_options_match_the_shared_source() -> None:
    shared = _shared_options()
    assert shared, "could not parse packages/types/src/pattern-detail-options.ts"
    assert {group: list(options) for group, options in DETAIL_OPTIONS.items()} == shared
