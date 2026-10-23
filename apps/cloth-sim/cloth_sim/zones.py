"""What the drape's zones are to each other: which layer lies over which, which never touch for real."""

from __future__ import annotations

LAYER_RANK: dict[str, int] = {
    "plastron": 0,
    "bodice": 1,
    "skirt": 1,
    "torso": 1,
    "legs": 1,
    "sleeve": 1,
    "collar": 1,
    "revers": 2,
    "cuff": 2,
    "belt": 3,
    "cord": 3,
}
"""Lower ranks lie closer to the body. Unknown zones sit with the dress (1)."""

_ARM = ("sleeve", "cuff")
_BELOW_ARM = ("skirt", "belt", "plastron", "revers", "cord")
UNRELATED: frozenset[frozenset[str]] = frozenset(frozenset({a, b}) for a in _ARM for b in _BELOW_ARM)
"""Zone pairs that only meet by accident of the pose (a hand resting on the skirt, an arm by the belt): never
sewn together, never one layer of the other."""


def rank_of(zone: str) -> int:
    return LAYER_RANK.get(zone, 1)


def unrelated(a: str, b: str) -> bool:
    return frozenset({a, b}) in UNRELATED


FREE_EDGES: frozenset[tuple[str, str]] = frozenset((z, "plastron") for z in ("bodice", "skirt", "torso"))
"""(upper, lower) zones where the upper layer's edge hangs free over the lower one: a robe-manteau's fronts open
over the plastron. Elsewhere an upper layer is stitched down (belt, revers, cuffs)."""


def free_edge(upper: str, lower: str) -> bool:
    return (upper, lower) in FREE_EDGES


LOOSE_OVER: frozenset[str] = frozenset({"belt", "cord"})
"""Zones that hang loose over the dress (a bow's loops and tails, a cord): nothing is cut away under them. They swing
during the simulation; a hole cut under them showed, ragged, as soon as they moved (the plastron under a bow)."""


def loose_over(zone: str) -> bool:
    return zone in LOOSE_OVER
