"""What each panel is made of in the render: colour, print, finish (the photo's fabric, `GarmentFit` look fields).

The same choices as the web preview (`ui/fabricTextures.ts`): the dress in `fabricColor` / `fabricPrint`, the
plastron (and a cord) in the contrast fabric, a sleeve's puff in the accent print; the print's repeat from the motif's
size read on the photo, else the print's usual one. Pure Python: `scripts/simulate.py` turns a spec into nodes.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, replace
from typing import Any

from .motifs import EMBROIDERY_COLOR

_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")

DRESS_DEFAULT = "#1c2340"
CONTRAST_DEFAULT = "#eadcb8"
MOTIF_DEFAULT = "#c9a45a"
PRINT_TILE_M = 0.05
"""Usual repeat of a print (m), as PRINT_TILE_M in the web preview."""
TILE_M = {"BROCART": 0.09, "ARABESQUE": 0.14}
MOTIF_SHARE = {"POIS": 0.3, "FLEURI": 0.36}
MOTIF_SHARE_DEFAULT = 0.3
MOTIF_SIZE_BOUNDS_CM = (0.5, 60.0)
PRINTS = {"UNI", "POIS", "RAYURES", "CARREAUX", "FLEURI", "BROCART", "ARABESQUE", "AUTRE"}
FINISHES = {"MAT", "VELOURS", "SATIN"}
CONTRAST_ZONES = {"plastron", "cord"}


@dataclass(frozen=True)
class MaterialSpec:
    key: str
    """Name of the material: shared by the panels made of the same fabric."""
    color: str
    print: str
    motif: str
    tile_m: float
    finish: str
    detail: str = ""
    """A motif drawn over the fabric (a detail area): "BRODERIE" (thread over the cloth) or "SMOCKS" (honeycomb
    relief); "" for plain cloth."""
    thread: str = ""
    """The embroidery's thread colour (#rrggbb)."""


def _hex(value: Any, fallback: str) -> str:
    return value.lower() if isinstance(value, str) and _HEX.match(value) else fallback


def _print(value: Any) -> str:
    return value if isinstance(value, str) and value in PRINTS else "UNI"


def _finish(value: Any) -> str:
    return value if isinstance(value, str) and value in FINISHES else "MAT"


def print_tile_m(print_name: str, motif_size_cm: Any = None) -> float:
    """Repeat (m) of a print: from the motif's size when given (bounded), else the print's usual one."""
    if isinstance(motif_size_cm, (int, float)) and not isinstance(motif_size_cm, bool) and motif_size_cm > 0:
        size = min(MOTIF_SIZE_BOUNDS_CM[1], max(MOTIF_SIZE_BOUNDS_CM[0], float(motif_size_cm))) / 100
        return size / MOTIF_SHARE.get(print_name, MOTIF_SHARE_DEFAULT)
    return TILE_M.get(print_name, PRINT_TILE_M)


def panel_material(
    zone: str, look: dict[str, Any], motif: str | None = None, thread: str | None = None
) -> MaterialSpec:
    """The fabric of a panel's zone, with the motif of a detail area drawn over it (embroidery in its thread colour,
    else the contrast colour, else champagne gold — as the web preview; smocking's honeycomb on the dress fabric)."""
    base = _zone_material(zone, look)
    if motif == "BRODERIE":
        colour = _hex(thread, _hex(look.get("contrastColor"), EMBROIDERY_COLOR))
        return replace(base, key=f"{base.key}:broderie:{colour}", detail="BRODERIE", thread=colour)
    if motif == "SMOCKS":
        return replace(base, key=f"{base.key}:smocks", detail="SMOCKS")
    return base


def _zone_material(zone: str, look: dict[str, Any]) -> MaterialSpec:
    if zone in CONTRAST_ZONES and _HEX.match(str(look.get("contrastColor", ""))):
        pr = _print(look.get("contrastPrint"))
        return MaterialSpec(
            key="contrast",
            color=_hex(look.get("contrastColor"), CONTRAST_DEFAULT),
            print=pr,
            motif=_hex(look.get("contrastMotifColor"), MOTIF_DEFAULT),
            tile_m=print_tile_m(pr),
            # A plastron under a velvet coat-dress is a silk (brocade, satin): it catches the light.
            finish="SATIN",
        )
    pr = _print(look.get("fabricPrint"))
    return MaterialSpec(
        key="dress",
        color=_hex(look.get("fabricColor"), DRESS_DEFAULT),
        print=pr,
        motif=_hex(look.get("motifColor"), MOTIF_DEFAULT),
        tile_m=print_tile_m(pr, look.get("motifSizeCm")),
        finish=_finish(look.get("fabricFinish")),
    )


def accent_material(look: dict[str, Any]) -> MaterialSpec | None:
    """The accent fabric (a sleeve's puff): the dress's colour with the accent print. None without one."""
    pr = _print(look.get("accentPrint"))
    if pr == "UNI":
        return None
    return MaterialSpec(
        key="accent",
        color=_hex(look.get("fabricColor"), DRESS_DEFAULT),
        print=pr,
        motif=_hex(look.get("motifColor"), MOTIF_DEFAULT),
        tile_m=print_tile_m(pr, look.get("motifSizeCm")),
        finish=_finish(look.get("fabricFinish")),
    )


def srgb_to_linear(hex_color: str) -> tuple[float, float, float]:
    """`#rrggbb` (sRGB) → linear RGB, as Blender's colour inputs take it."""
    out = []
    for k in (1, 3, 5):
        c = int(hex_color[k : k + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (out[0], out[1], out[2])
