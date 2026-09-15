"""Standard size reference tables (AFNOR / ISO 8559-1).

Mirrors packages/types/src/size-charts.ts — keep both in sync. Used to ground
the LLM prompts (suggest_pattern_parameters / estimate_missing_measurements)
with plausible body proportions, and as a deterministic fallback when Gemini
is unreachable.
"""

from __future__ import annotations

FEMME_CHART = [
    {
        "label": "XXS",
        "frSize": "34",
        "TOUR_POITRINE": 80,
        "TOUR_TAILLE": 62,
        "TOUR_BASSIN": 86,
        "LONGUEUR_DOS": 40.5,
        "CARRURE_DOS": 34,
        "TOUR_COU": 33,
    },
    {
        "label": "XS",
        "frSize": "36",
        "TOUR_POITRINE": 84,
        "TOUR_TAILLE": 66,
        "TOUR_BASSIN": 90,
        "LONGUEUR_DOS": 41.0,
        "CARRURE_DOS": 35,
        "TOUR_COU": 34,
    },
    {
        "label": "S",
        "frSize": "38",
        "TOUR_POITRINE": 88,
        "TOUR_TAILLE": 70,
        "TOUR_BASSIN": 94,
        "LONGUEUR_DOS": 41.5,
        "CARRURE_DOS": 36,
        "TOUR_COU": 35,
    },
    {
        "label": "M",
        "frSize": "40",
        "TOUR_POITRINE": 92,
        "TOUR_TAILLE": 74,
        "TOUR_BASSIN": 98,
        "LONGUEUR_DOS": 42.0,
        "CARRURE_DOS": 37,
        "TOUR_COU": 36,
    },
    {
        "label": "L",
        "frSize": "42",
        "TOUR_POITRINE": 96,
        "TOUR_TAILLE": 78,
        "TOUR_BASSIN": 102,
        "LONGUEUR_DOS": 42.5,
        "CARRURE_DOS": 38,
        "TOUR_COU": 37,
    },
    {
        "label": "XL",
        "frSize": "44",
        "TOUR_POITRINE": 100,
        "TOUR_TAILLE": 82,
        "TOUR_BASSIN": 106,
        "LONGUEUR_DOS": 43.0,
        "CARRURE_DOS": 39,
        "TOUR_COU": 38,
    },
    {
        "label": "XXL",
        "frSize": "46",
        "TOUR_POITRINE": 104,
        "TOUR_TAILLE": 86,
        "TOUR_BASSIN": 110,
        "LONGUEUR_DOS": 43.5,
        "CARRURE_DOS": 40,
        "TOUR_COU": 39,
    },
    {
        "label": "3XL",
        "frSize": "48",
        "TOUR_POITRINE": 110,
        "TOUR_TAILLE": 92,
        "TOUR_BASSIN": 116,
        "LONGUEUR_DOS": 44.0,
        "CARRURE_DOS": 41.5,
        "TOUR_COU": 40.5,
    },
    {
        "label": "4XL",
        "frSize": "50",
        "TOUR_POITRINE": 116,
        "TOUR_TAILLE": 98,
        "TOUR_BASSIN": 122,
        "LONGUEUR_DOS": 44.5,
        "CARRURE_DOS": 43,
        "TOUR_COU": 42,
    },
    {
        "label": "5XL",
        "frSize": "52",
        "TOUR_POITRINE": 122,
        "TOUR_TAILLE": 104,
        "TOUR_BASSIN": 128,
        "LONGUEUR_DOS": 45.0,
        "CARRURE_DOS": 44.5,
        "TOUR_COU": 43.5,
    },
]

HOMME_CHART = [
    {
        "label": "XS",
        "frSize": "44",
        "TOUR_POITRINE": 88,
        "TOUR_TAILLE": 76,
        "TOUR_BASSIN": 92,
        "LONGUEUR_DOS": 44,
        "CARRURE_DOS": 41,
        "TOUR_COU": 37,
    },
    {
        "label": "S",
        "frSize": "46",
        "TOUR_POITRINE": 92,
        "TOUR_TAILLE": 80,
        "TOUR_BASSIN": 96,
        "LONGUEUR_DOS": 44.5,
        "CARRURE_DOS": 42,
        "TOUR_COU": 38,
    },
    {
        "label": "M",
        "frSize": "48",
        "TOUR_POITRINE": 96,
        "TOUR_TAILLE": 84,
        "TOUR_BASSIN": 100,
        "LONGUEUR_DOS": 45,
        "CARRURE_DOS": 43,
        "TOUR_COU": 39,
    },
    {
        "label": "L",
        "frSize": "50",
        "TOUR_POITRINE": 100,
        "TOUR_TAILLE": 88,
        "TOUR_BASSIN": 104,
        "LONGUEUR_DOS": 45.5,
        "CARRURE_DOS": 44,
        "TOUR_COU": 40,
    },
    {
        "label": "XL",
        "frSize": "52",
        "TOUR_POITRINE": 104,
        "TOUR_TAILLE": 92,
        "TOUR_BASSIN": 108,
        "LONGUEUR_DOS": 46,
        "CARRURE_DOS": 45,
        "TOUR_COU": 41,
    },
    {
        "label": "XXL",
        "frSize": "54",
        "TOUR_POITRINE": 108,
        "TOUR_TAILLE": 96,
        "TOUR_BASSIN": 112,
        "LONGUEUR_DOS": 46.5,
        "CARRURE_DOS": 46,
        "TOUR_COU": 42,
    },
    {
        "label": "3XL",
        "frSize": "56",
        "TOUR_POITRINE": 112,
        "TOUR_TAILLE": 100,
        "TOUR_BASSIN": 116,
        "LONGUEUR_DOS": 47,
        "CARRURE_DOS": 47,
        "TOUR_COU": 43,
    },
    {
        "label": "4XL",
        "frSize": "58",
        "TOUR_POITRINE": 116,
        "TOUR_TAILLE": 104,
        "TOUR_BASSIN": 120,
        "LONGUEUR_DOS": 47.5,
        "CARRURE_DOS": 48,
        "TOUR_COU": 44,
    },
]

CHARTS = {"FEMME": FEMME_CHART, "HOMME": HOMME_CHART}

MEASUREMENT_KEYS = [
    "TOUR_POITRINE",
    "TOUR_TAILLE",
    "TOUR_BASSIN",
    "LONGUEUR_DOS",
    "CARRURE_DOS",
    "TOUR_COU",
]


def find_closest_entry(gender: str | None, known_measurements: dict[str, float]) -> dict:
    """Nearest chart row by squared distance on whichever keys are known.
    Falls back to the "M" row of the women's chart if nothing is known at all —
    used only as a last-resort deterministic fallback, never as the primary path.
    """
    chart = CHARTS.get((gender or "FEMME").upper(), FEMME_CHART)
    shared_keys = [k for k in MEASUREMENT_KEYS if k in known_measurements]
    if not shared_keys:
        return next((row for row in chart if row["label"] == "M"), chart[len(chart) // 2])

    def distance(row: dict) -> float:
        return sum((row[k] - known_measurements[k]) ** 2 for k in shared_keys)

    return min(chart, key=distance)
