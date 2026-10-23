"""Construction pieces read off a photo (`construction`), the counterpart of `trims` for the pieces the pattern engine
derives from the garment's own pieces (packages/pattern-engine/src/shared/construction.ts). Kinds, bounds and rules
mirror `packages/types/src/pattern-construction.ts` (CONSTRUCTION_KINDS, CONSTRUCTION_BOUNDS); a test checks they agree.

The vision model only says WHAT is sewn on (and how much): never geometry. Lining, interfacing, pockets, bias, gussets
and puff supports cannot be seen on a photo and are left to the customer.
"""
from __future__ import annotations

import math
import re
from typing import Any

# Kinds a photo can show (the others are construction choices, not visible): keep in sync with pattern-construction.ts.
VISIBLE_KINDS = [
    "HEM_FLOUNCE",
    "GODETS",
    "PEPLUM",
    "JABOT",
    "CAPELET",
    "BOW",
    "HEM_BANDS",
    "ENGAGEANTES",
    "BUSTLE",
    "WATTEAU_PLEAT",
    "SASH",
    "APRON",
    "EMBROIDERY",
    "SMOCKING",
    "CONTRAST_CUFFS",
]
MATERIALS = ["TISSU", "DENTELLE", "TULLE", "CONTRASTE"]
# (min, max) — same bounds as CONSTRUCTION_BOUNDS.
BOUNDS: dict[str, tuple[float, float]] = {
    "flounceTiers": (1, 5),
    "flounceDepthMm": (40, 450),
    "godetCount": (2, 24),
    "godetHeightMm": (100, 800),
    "godetWidthMm": (80, 800),
    "peplumDepthMm": (50, 350),
    "jabotLengthMm": (80, 450),
    "jabotTiers": (1, 4),
    "capeletLengthMm": (100, 600),
    "bowWidthMm": (80, 600),
    "bandRows": (1, 6),
    "bandWidthMm": (10, 200),
    "bandGapMm": (0, 400),
    "engageanteTiers": (1, 4),
    "engageanteDepthMm": (40, 250),
    "watteauDepthMm": (30, 200),
    "sashWidthMm": (60, 700),
    "sashLengthMm": (600, 4000),
    "apronLengthMm": (200, 1100),
    "apronFullness": (1, 2.5),
    "embroideryWidthMm": (10, 300),
    "smockRows": (3, 30),
    "smockRatio": (2, 4),
    "cuffHeightMm": (20, 160),
}
# kind → {field: bounds key | list of allowed values}
FIELDS: dict[str, dict[str, str | list[str]]] = {
    "HEM_FLOUNCE": {"tiers": "flounceTiers", "depthMm": "flounceDepthMm", "style": ["FRONCE", "CIRCULAIRE"]},
    "GODETS": {"count": "godetCount", "heightMm": "godetHeightMm", "widthMm": "godetWidthMm"},
    "PEPLUM": {"style": ["CIRCULAIRE", "POINTES", "FRONCEE"], "depthMm": "peplumDepthMm"},
    "JABOT": {"lengthMm": "jabotLengthMm", "tiers": "jabotTiers"},
    "CAPELET": {"lengthMm": "capeletLengthMm"},
    "BOW": {"place": ["MANCHES", "DOS", "TAILLE", "ENCOLURE"], "widthMm": "bowWidthMm"},
    "HEM_BANDS": {"rows": "bandRows", "widthMm": "bandWidthMm", "gapMm": "bandGapMm"},
    "ENGAGEANTES": {"tiers": "engageanteTiers", "depthMm": "engageanteDepthMm"},
    "BUSTLE": {"style": ["COUSSIN", "POUF", "PANIERS"]},
    "WATTEAU_PLEAT": {"depthMm": "watteauDepthMm"},
    "SASH": {"widthMm": "sashWidthMm", "lengthMm": "sashLengthMm"},
    "APRON": {"lengthMm": "apronLengthMm", "fullness": "apronFullness"},
    "EMBROIDERY": {"place": ["ENCOLURE", "CORSAGE", "MANCHES", "OURLET"], "widthMm": "embroideryWidthMm"},
    "SMOCKING": {"place": ["CORSAGE", "MANCHES", "TAILLE"], "rows": "smockRows", "ratio": "smockRatio"},
    "CONTRAST_CUFFS": {"heightMm": "cuffHeightMm"},
}
STYLED = {"HEM_FLOUNCE", "PEPLUM", "JABOT", "CAPELET", "BOW", "HEM_BANDS", "ENGAGEANTES", "SASH", "APRON"}
COLOURED = STYLED | {"EMBROIDERY", "CONTRAST_CUFFS"}
REPEATABLE = {"BOW", "EMBROIDERY", "SMOCKING"}
MAX_ITEMS = 8
_FOR = {"ROBE", "ROBE_MARIEE", "AUTRE"}
_CERTAIN = {"HIGH", "MEDIUM"}
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")

CONSTRUCTION_GUIDE = """\
Pièces de construction visibles (`construction`, optionnel, robes seulement) — ce que la coupe AJOUTE à la robe :
- HEM_FLOUNCE : volant(s) au bas de la jupe ; tiers (1–5) = étages, depthMm (40–450) = hauteur d'un volant,
  style FRONCE (plissé serré) | CIRCULAIRE (ondule sans fronces, « en forme »).
- GODETS : triangles évasés insérés dans les coutures depuis le genou ; count (2–24), heightMm (100–800), widthMm (80–800) à l'ourlet.
- PEPLUM : basque cousue à la taille ; style CIRCULAIRE | POINTES | FRONCEE ; depthMm (50–350). (Une basque coupée avec
  le corsage relève du détail `basque` quand il existe.)
- JABOT : cascade plissée au milieu devant du col ; lengthMm (80–450), tiers (1–4).
- CAPELET : pèlerine / fichu sur les épaules ; lengthMm (100–600) depuis le cou.
- BOW : gros nœud ; place MANCHES | DOS | TAILLE | ENCOLURE ; widthMm (80–600). Un par emplacement.
- HEM_BANDS : bandes appliquées parallèles à l'ourlet ; rows (1–6), widthMm (10–200), gapMm (0–400) au-dessus de l'ourlet.
- ENGAGEANTES : volants de dentelle qui sortent sous une manche pagode ; tiers (1–4), depthMm (40–250).
- BUSTLE : style POUF (drapé relevé sur une tournure, 1870–1889), COUSSIN (tournure lisse), PANIERS (hanches très larges, XVIIIᵉ).
- WATTEAU_PLEAT : plis creux qui tombent de la nuque jusqu'à l'ourlet dans le dos ; depthMm (30–200).
- SASH : écharpe drapée en biais ; widthMm (60–700), lengthMm (600–4000).
- APRON : tablier devant (dirndl) ; lengthMm (200–1100), fullness (1–2,5).
- EMBROIDERY : broderie ; place ENCOLURE | CORSAGE | MANCHES | OURLET ; widthMm (10–300) ; color = fil.
- SMOCKING : nids d'abeille ; place CORSAGE | MANCHES | TAILLE ; rows (3–30), ratio (2–4).
- CONTRAST_CUFFS : poignets d'une autre couleur ; heightMm (20–160) ; color.
- Chaque pièce : {"kind": ..., <paramètres>, "material": "TISSU" | "DENTELLE" | "TULLE" | "CONTRASTE" (si pertinent),
  "color": "#rrggbb", "certainty": "HIGH" | "MEDIUM"}. 8 au plus. N'invente rien : dans le doute, omets.
  Ne mets ici ni berthe, ni volants de manche, ni perles (ce sont des `trims`).
"""


def _number(key: str, value: Any) -> float | None:
    """Aberrant ⇒ reject (negative, more than twice the maximum), mild overshoot ⇒ clamp."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    low, high = BOUNDS[key]
    if value < 0 or value > high * 2:
        return None
    v = float(min(high, max(low, value)))
    return float(round(v)) if high > 10 else round(v, 1)


def _pick(value: Any, allowed: list[str]) -> str | None:
    if not isinstance(value, str):
        return None
    v = value.strip().upper()
    return v if v in allowed else None


def _item(raw: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    kind = _pick(raw.get("kind"), VISIBLE_KINDS)
    certainty = raw.get("certainty")
    if kind is None or not isinstance(certainty, str) or certainty.strip().upper() not in _CERTAIN:
        return None
    item: dict[str, Any] = {"kind": kind}
    for field, rule in FIELDS[kind].items():
        if isinstance(rule, list):
            v = _pick(raw.get(field), rule)
        else:
            v = _number(rule, raw.get(field))
            if v is not None and float(v).is_integer():
                v = int(v)
        if v is None:
            return None
        item[field] = v
    if kind in STYLED:
        material = _pick(raw.get("material"), MATERIALS)
        if material:
            item["material"] = material
    color = raw.get("color")
    if kind in COLOURED and isinstance(color, str) and _HEX.match(color.strip()):
        item["color"] = color.strip().lower()
    key = f"{kind}:{item.get('place')}" if kind in REPEATABLE else kind
    return key, item


def normalize_construction(raw: Any, garment_type: str) -> list[dict[str, Any]] | None:
    """Keeps only certain, in-range, visible construction pieces on dresses; each kind once (once per place for bows,
    embroidery, smocking); at most MAX_ITEMS. Nothing valid ⇒ None."""
    if not isinstance(raw, list) or garment_type not in _FOR:
        return None
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for entry in raw[: MAX_ITEMS * 2]:
        got = _item(entry) if isinstance(entry, dict) else None
        if got is None or got[0] in seen or len(out) >= MAX_ITEMS:
            continue
        seen.add(got[0])
        out.append(got[1])
    return out or None
