"""Garment knowledge base for the Pattern Studio photo analysis.

A hosted vision LLM cannot be fine-tuned from here, so "teaching" it what a garment is happens in
three layers, all in this module:

1. a closed taxonomy (the exact ids used by the wizard in `apps/web/.../pattern-studio-wizard/consts`)
   with the visual cues that tell each value apart,
2. a decision procedure + worked examples injected in the prompt (few-shot grounding),
3. a deterministic `normalize_profile` that rejects anything outside the taxonomy, so a
   hallucinated id can never reach the wizard.

Keep the ids in sync with the web consts and with `packages/pattern-engine` garment types.
Descriptive output only — never geometry (ADR-005).
"""

from __future__ import annotations

import logging
import math
from typing import Any

logger = logging.getLogger("angaly.ai_service")

# --- Closed vocabularies ---------------------------------------------------------------------

GARMENT_TYPES: dict[str, str] = {
    "ROBE": "robe d'une seule pièce couvrant buste et jupe, hors mariage (jour, cocktail, soirée)",
    "JUPE": "vêtement du bas ceinturé à la taille, sans séparation des jambes",
    "PANTALON": "vêtement du bas à deux jambes séparées (tailleur, fluide, cigarette, palazzo)",
    "VESTE": "pièce du haut à manches, ouverte devant, portée par-dessus (blazer, veste cintrée, kimono, manteau court)",
    "COSTUME": "ensemble assorti veste + pantalon ou veste + jupe, même tissu, porté ensemble",
    "CHEMISE": "haut léger à manches (chemise, blouse, top) qui ne se porte pas comme une veste",
    "ROBE_MARIEE": "robe de cérémonie nuptiale : blanc/ivoire/champagne, dentelle, tulle, traîne, voile, bustier structuré",
    "AUTRE": "vêtement identifiable mais hors des catégories ci-dessus (combinaison, cape, tenue traditionnelle…)",
}

OCCASIONS: dict[str, str] = {
    "MARIAGE": "robe de mariée, tenue de témoin/invité de mariage très habillée",
    "SOIREE": "tissus brillants (satin, velours, paillettes), décolletés, coupes spectaculaires",
    "QUOTIDIEN": "tissus simples (coton, lin, maille), coupes confortables, portable tous les jours",
    "CEREMONIE": "habillé mais pas nuptial : baptême, fête, remise de diplôme, tenue traditionnelle festive",
    "PROFESSIONNEL": "tailleur, chemisier sobre, tons neutres, coupes structurées",
    "AUTRE": "occasion indéterminée",
}

STYLES: dict[str, str] = {
    "CLASSIQUE": "lignes pures, proportions équilibrées, aucun effet marqué",
    "MODERNE": "coupes architecturales, asymétries, découpes inattendues",
    "ELEGANT": "tombé fluide, tissus nobles (soie, crêpe, satin), raffinement discret",
    "MINIMALISTE": "volumes simples, aucun ornement, unie, peu de coutures visibles",
    "TRADITIONNEL": "lamba, motifs et tissages malgaches, drapés et coupes d'inspiration locale",
    "GLAMOUR": "silhouette affirmée, drapés voluptueux, fente haute, traîne, brillance",
}

CUT_TYPES: dict[str, str] = {
    "DROITE": "tombé vertical, largeur quasi constante épaules→bas",
    "EVASEE": "trapèze : le volume augmente progressivement vers le bas",
    "SIRENE": "ajustée du buste aux genoux puis évasée en volant/godets",
    "PRINCESSE": "buste ajusté, taille marquée, jupe ample et volumineuse",
    "AJUSTEE": "épouse les courbes (cintrée, découpes de taille/pinces visibles)",
    "OVERSIZE": "aisance généreuse, silhouette ample, épaules souvent tombantes",
}

DETAIL_OPTIONS: dict[str, dict[str, str]] = {
    "manches": {
        "SANS_MANCHES": "épaules nues ou bretelles",
        "COURTES": "s'arrêtent au-dessus du coude",
        "TROIS_QUARTS": "s'arrêtent entre coude et poignet",
        "LONGUES": "jusqu'au poignet",
        "BALLON": "volume bouffant en tête ou en bas de manche",
        "PAPILLON": "manches évasées, larges, flottantes",
    },
    "col": {
        "SANS_COL": "encolure simple sans pied de col",
        "ROND": "encolure ronde dégagée",
        "EN_V": "encolure formant un V",
        "BATEAU": "encolure large et horizontale d'une épaule à l'autre",
        "CHEMISIER": "col chemise classique rabattu",
        "OFFICIER": "col droit montant sans rabat (Mao)",
        "LAVALLIERE": "col à nouer en lavallière / nœud",
    },
    "decollete": {
        "SAGE": "ras du cou, couvrant",
        "MOYEN": "dégagement modéré",
        "PLONGEANT": "ouverture profonde",
        "COEUR": "ligne en forme de cœur (bustier sweetheart)",
        "CARRE": "ligne carrée",
    },
    "dos": {
        "FERME": "dos entièrement couvert",
        "DECOLLETE_V": "dos échancré en V",
        "DOS_NU": "dos nu plongeant",
        "GOUTTE": "ouverture en goutte",
        "TRANSPARENT": "dentelle ou voile illusion dans le dos",
    },
    "longueur": {
        "MINI": "au-dessus du genou",
        "MIDI": "du genou à mi-mollet",
        "MAXI": "aux chevilles",
        "SOL": "touche le sol",
        "ASYMETRIQUE": "ourlet de longueur inégale",
    },
    "fermeture": {
        "ZIP_INVISIBLE": "fermeture éclair discrète dans le dos ou le côté",
        "BOUTONS": "boutonnage devant visible",
        "CEINTURE_NOUEE": "ceinture à nouer",
        "CEINTURE_INTEGREE": "ceinture cousue / surpiquée à la taille",
        "AUCUNE": "aucune fermeture ni ceinture visible",
    },
}

CONSTRUCTION_METHODS: dict[str, str] = {
    "FLAT_PATTERN": "patron plat : pièces tracées à plat (bustier/corsage ajusté, veste, pantalon, jupe coupée)",
    "DRAPING": "moulage / drapé : le tissu est épinglé directement sur le mannequin (sari, lamba, drapé grec, "
    "col bénitier, jupe portefeuille, volumes asymétriques non géométriques)",
    "MIXED": "mixte : base ajustée tracée à plat + éléments drapés (traîne, surjupe, écharpe, bustier drapé)",
}

PRESENTATIONS: dict[str, str] = {
    "WORN": "portée par une personne (mesure l'ajustement réel, attention aux poses qui déforment)",
    "MANNEQUIN": "présentée sur un mannequin de couture / buste (drapé souvent façonné directement dessus)",
    "FLAT": "posée à plat ou sur cintre",
    "SKETCH": "croquis ou illustration de mode",
}

# What the wizard calls each detail, used when a garment type makes a detail meaningless.
_NO_SLEEVES_NECK_FOR = {"JUPE", "PANTALON"}


# --- Fit (ease / fullness / lengths) -----------------------------------------------------------
# Mirrors `packages/types/src/pattern-fit.ts` (checked by tests/test_taxonomy_sync.py). The model only
# proposes bounded numbers; the pattern-engine alone turns them into geometry (ADR-005).

EASE_LEVELS: dict[str, str] = {
    "AJUSTE": "près du corps : le tissu épouse la silhouette, aucune aisance visible",
    "CONFORT": "aisance standard : tombe naturellement, ni serré ni flottant",
    "AMPLE": "visiblement ample : le tissu flotte autour du corps, plis de mouvement larges",
}

FABRIC_BEHAVIORS: dict[str, str] = {
    "FLUIDE": "tombe en plis souples et suit le mouvement (crêpe, soie, viscose, mousseline)",
    "STRUCTURE": "tient sa forme (gabardine, popeline épaisse, coton dense)",
    "RIGIDE": "forme sculptée qui se tient seule (taffetas, duchesse, mikado, entoilé)",
    "STRETCH": "épouse en s'étirant (jersey, maille, élasthanne)",
}

# name -> (min, max, step); same bounds as FULLNESS_BOUNDS / LENGTH_BOUNDS in pattern-fit.ts.
FIT_NUMBER_BOUNDS: dict[str, tuple[float, float, float]] = {
    "fullness.skirt": (1.0, 4.0, 0.25),
    "fullness.sleeve": (1.0, 2.5, 0.25),
    "lengths.skirtPct": (40.0, 130.0, 1.0),
    "lengths.sleevePct": (0.0, 100.0, 1.0),
    "lengths.bodicePct": (80.0, 120.0, 1.0),
}

_SKIRT_GARMENTS = {"JUPE", "ROBE", "ROBE_MARIEE"}
_SLEEVE_GARMENTS = {"ROBE", "VESTE", "COSTUME", "CHEMISE", "ROBE_MARIEE"}
_BODICE_GARMENTS = _SLEEVE_GARMENTS | {"AUTRE"}
_CERTAINTY_KEPT = {"HIGH", "MEDIUM"}

FIT_GUIDE = """\
Ajustements (`fit`, optionnel — omets tout champ dont tu n'es pas SÛR ; mieux vaut ne rien dire qu'inventer) :
- ease : AJUSTE / CONFORT / AMPLE (voir le vocabulaire). Juge l'espace entre le tissu et le corps, pas la
  taille de la personne. Une robe qui tombe droit sans toucher le corps = AMPLE ; un fourreau moulant = AJUSTE.
- fullness.skirt (1 à 4, pas de 0,25) = quantité de tissu de la jupe rapportée à sa largeur finie :
  1 = jupe droite sans fronces ; ≈1,5 = légèrement évasée ; ≈2 = plis/fronces réguliers visibles ;
  ≈3 = très froncée ou plissée serrée ; 4 = volume maximal (cercle, tulle gonflé).
- fullness.sleeve (1 à 2,5) : 1 = manche droite ; ≈1,5 = manche légèrement bouffante ; ≈2 = ballon marqué.
  Seulement s'il y a des manches.
- lengths.skirtPct (40 à 130) : longueur de la jupe en % de la longueur « normale » du type (100 = standard
  pour le détail `longueur` choisi). lengths.sleevePct (0 à 100) : 0 = sans manches, 100 = poignet.
  lengths.bodicePct (80 à 120) : buste court (<100) / long (>100) par rapport à la taille naturelle.
- fabricBehavior : FLUIDE / STRUCTURE / RIGIDE / STRETCH (informatif, jamais de géométrie).
- certainty : pour CHAQUE champ numérique ou ease que tu donnes, une clé de même nom
  (ex. "ease", "fullness.skirt") valant HIGH ou MEDIUM. Un champ sans certitude HIGH/MEDIUM sera ignoré.
- Ne donne jamais de valeur hors des bornes ci-dessus. Si le vêtement est porté, ne confonds pas les plis
  du corps en mouvement avec l'ampleur du tissu."""

# --- Drape blocks ------------------------------------------------------------------------------
# Deterministic blocks the pattern-engine can build (packages/pattern-engine/src/blocks). The model only
# NAMES one and gives bounded numbers; anything else stays a mannequin note. Mirrors
# DRAPE_BLOCK_KINDS / DRAPE_BOUNDS / DRAPE_BLOCKS_BY_GARMENT in packages/types/src/pattern-fit.ts.

DRAPE_BLOCK_KINDS: dict[str, str] = {
    "GATHERED_SKIRT": "jupe froncée : rectangle de tissu froncé à la taille (fullness = tissu / largeur finie)",
    "PLEATED_SKIRT": "jupe plissée régulièrement : plis plats (KNIFE) ou plis creux (BOX), nombre et profondeur",
    "CIRCLE_SKIRT": "jupe cercle : quart (0.25), demi (0.5) ou cercle complet (1) ; tombé en ondulations régulières",
    "WRAP_FRONT": "devant portefeuille : un pan croise sur l'autre (overlapMm = croisement, side = pan du dessus)",
    "COWL_NECK": "col bénitier : encolure qui retombe en plis souples, taillée dans le biais (depthMm = profondeur)",
    "TRAIN": "traîne derrière la jupe (lengthMm au-delà de l'ourlet)",
    "OVERSKIRT": "surjupe asymétrique qui croise la jupe d'un côté (lengthPct = longueur en % de la jupe)",
    "DRAPED_BODICE": "bustier/corsage à plis drapés sur un côté (pleats = nombre de plis)",
    "ASYMMETRIC_HEM": "ourlet plus long d'un côté (dropMm = différence de longueur)",
}

# name -> (min, max, step)
DRAPE_BOUNDS: dict[str, tuple[float, float, float]] = {
    "gatheredFullness": (1.25, 4.0, 0.25),
    "pleats": (4.0, 60.0, 1.0),
    "pleatDepthMm": (10.0, 80.0, 1.0),
    "wrapOverlapMm": (40.0, 250.0, 1.0),
    "cowlDepthMm": (60.0, 300.0, 1.0),
    "trainLengthMm": (200.0, 1200.0, 10.0),
    "overskirtLengthPct": (50.0, 100.0, 1.0),
    "bodicePleats": (3.0, 12.0, 1.0),
    "hemDropMm": (100.0, 500.0, 10.0),
}

CIRCLE_FRACTIONS = (0.25, 0.5, 1)
MAX_DRAPE_BLOCKS = 6
_SKIRT_BLOCKS = {"GATHERED_SKIRT", "PLEATED_SKIRT", "CIRCLE_SKIRT"}

_ALL_BLOCKS = set(DRAPE_BLOCK_KINDS)
DRAPE_BLOCKS_BY_GARMENT: dict[str, set[str]] = {
    "JUPE": {"GATHERED_SKIRT", "PLEATED_SKIRT", "CIRCLE_SKIRT", "WRAP_FRONT", "TRAIN", "OVERSKIRT", "ASYMMETRIC_HEM"},
    "ROBE": _ALL_BLOCKS,
    "ROBE_MARIEE": _ALL_BLOCKS,
}

DRAPE_GUIDE = """\
Blocs de drapé (`drapeBlocks`, optionnel) — réservé aux plis RÉGULIERS que le moteur sait tracer à plat :
- Propose un bloc seulement si tu le reconnais nettement : fronces régulières → GATHERED_SKIRT, plis
  réguliers → PLEATED_SKIRT, tombé en ondulations circulaires → CIRCLE_SKIRT, pan croisé sur le devant →
  WRAP_FRONT, encolure qui retombe en plis → COWL_NECK, traîne → TRAIN, couche asymétrique par-dessus la
  jupe → OVERSKIRT, plis drapés sur le buste → DRAPED_BODICE, ourlet plus long d'un côté → ASYMMETRIC_HEM.
- Chaque bloc : {"kind": ..., <paramètres numériques dans les bornes>, "certainty": "HIGH" | "MEDIUM"}.
  Paramètres : GATHERED_SKIRT.fullness (1.25–4) ; PLEATED_SKIRT.pleats (4–60), depthMm (10–80), type
  KNIFE|BOX ; CIRCLE_SKIRT.fraction (0.25, 0.5 ou 1) ; WRAP_FRONT.overlapMm (40–250), side LEFT|RIGHT ;
  COWL_NECK.depthMm (60–300) ; TRAIN.lengthMm (200–1200) ; OVERSKIRT.lengthPct (50–100), side ;
  DRAPED_BODICE.pleats (3–12), side ; ASYMMETRIC_HEM.dropMm (100–500), side.
- Un seul bloc de jupe (froncée/plissée/cercle), chaque bloc au plus une fois, 6 blocs maximum.
- Drapé libre (sari, lamba, drapé grec, plis impossibles à tracer à plat) : AUCUN bloc, mets constructionMethod
  à DRAPING et décris-le dans constructionNotes — un bloc ne remplace jamais un moulage sur mannequin.
- Dans le doute, n'en propose pas : le conseil de moulage suffit."""

DECISION_PROCEDURE = """\
Procédure (suis-la dans l'ordre) :
1. Est-ce une photo où un vêtement est le sujet principal (porté, sur cintre, mannequin, à plat,
   croquis de mode) ? Sinon (paysage, nourriture, animal, visage seul, logo, capture d'écran,
   texte…) → isGarment=false et tous les autres champs vides. Ne force JAMAIS une catégorie.
2. S'il y a plusieurs vêtements, décris celui qui occupe le plus de place / le plus au centre.
3. garmentType : combien de pièces et où s'arrête chacune ?
   - une seule pièce buste+jupe → ROBE (ROBE_MARIEE si cérémonie nuptiale évidente) ;
   - deux jambes séparées → PANTALON ; taille seule + jupe → JUPE ;
   - haut ouvert porté par-dessus → VESTE ; haut léger porté seul → CHEMISE ;
   - veste ET bas assortis visibles → COSTUME.
4. cutType : regarde la silhouette globale, pas un détail. Cintrée en haut + volume en bas → PRINCESSE ;
   fuselée puis évasée aux genoux → SIRENE ; large partout → OVERSIZE ; trapèze → EVASEE.
5. details : une seule valeur par groupe, uniquement si le groupe est visible ET pertinent pour le
   garmentType (pas de manches/col pour une JUPE ou un PANTALON). Omet le groupe dans le doute.
6. occasion et style : déduis-les du tissu, de la finition et de la mise en scène ; mets AUTRE /
   omets si la photo ne permet pas de trancher.
7. constructionMethod : le tissu tient-il par des pièces géométriques tracées à plat (FLAT_PATTERN) ou par
   des plis/drapés façonnés sur le mannequin (DRAPING) ? Un bustier ajusté + jupe/traîne drapée = MIXED.
   Si DRAPING ou MIXED, constructionNotes (français, 1–2 phrases) dit OÙ est le drapé et comment
   l'aborder (ex. « jupe drapée en cascade : mouler sur mannequin, la base du corsage se trace à plat »).
   Sinon constructionNotes = null.
8. presentation : portée (WORN), sur mannequin (MANNEQUIN), à plat/cintre (FLAT) ou croquis (SKETCH).
   Si le vêtement est porté ou sur mannequin, les plis visibles peuvent venir de la pose : ne conclus
   DRAPING que si le drapé est structurel (le tissu serait impossible à tracer à plat).
9. fit : applique le guide « Ajustements » ci-dessous ; omets `fit` (null) si rien n'est lisible.
10. drapeBlocks : applique le guide « Blocs de drapé » ; omets-les (null) dans le doute ou pour un drapé libre.
11. confidence : 0.9+ si tout est net, 0.5–0.7 si cadrage partiel ou flou, <0.4 si tu devines."""

# Worked examples (textual few-shot — no images, they only calibrate vocabulary and restraint).
FEW_SHOT_EXAMPLES: list[dict[str, Any]] = [
    {
        "scene": "Femme en robe longue ivoire, bustier en cœur, jupe volumineuse en tulle, traîne, voile.",
        "profile": {
            "isGarment": True,
            "garmentType": "ROBE_MARIEE",
            "occasion": "MARIAGE",
            "style": "GLAMOUR",
            "cutType": "PRINCESSE",
            "details": {"manches": "SANS_MANCHES", "decollete": "COEUR", "longueur": "SOL", "fermeture": "ZIP_INVISIBLE"},
            "constructionMethod": "MIXED",
            "presentation": "MANNEQUIN",
            "constructionNotes": "Bustier ajusté à tracer à plat ; jupe en tulle et traîne à draper sur mannequin.",
            "fit": {
                "ease": "AJUSTE",
                "fullness": {"skirt": 3.0},
                "fabricBehavior": "RIGIDE",
                "certainty": {"ease": "HIGH", "fullness.skirt": "MEDIUM"},
            },
            "drapeBlocks": [{"kind": "TRAIN", "lengthMm": 900, "certainty": "HIGH"}],
        },
    },
    {
        "scene": "Blazer noir croisé sur pantalon cigarette assorti, mannequin en studio.",
        "profile": {
            "isGarment": True,
            "garmentType": "COSTUME",
            "occasion": "PROFESSIONNEL",
            "style": "CLASSIQUE",
            "cutType": "AJUSTEE",
            "details": {"manches": "LONGUES", "col": "CHEMISIER", "fermeture": "BOUTONS", "longueur": "MAXI"},
            "constructionMethod": "FLAT_PATTERN",
            "presentation": "WORN",
            "constructionNotes": None,
            "fit": {"ease": "AJUSTE", "fabricBehavior": "STRUCTURE", "certainty": {"ease": "HIGH"}},
        },
    },
    {
        "scene": "Jupe plissée midi en satin vert posée à plat.",
        "profile": {
            "isGarment": True,
            "garmentType": "JUPE",
            "occasion": "SOIREE",
            "style": "ELEGANT",
            "cutType": "EVASEE",
            "details": {"longueur": "MIDI", "fermeture": "ZIP_INVISIBLE"},
            "constructionMethod": "FLAT_PATTERN",
            "presentation": "FLAT",
            "constructionNotes": None,
            "fit": {
                "fullness": {"skirt": 2.0},
                "lengths": {"skirtPct": 100},
                "fabricBehavior": "FLUIDE",
                "certainty": {"fullness.skirt": "HIGH", "lengths.skirtPct": "MEDIUM"},
            },
            "drapeBlocks": [
                {"kind": "PLEATED_SKIRT", "pleats": 24, "depthMm": 25, "type": "KNIFE", "certainty": "HIGH"}
            ],
        },
    },
    {
        "scene": "Robe longue en lin beige, coupe droite très ample, manches ballon courtes, portée sans ceinture.",
            "profile": {
                "isGarment": True,
                "garmentType": "ROBE",
                "occasion": "QUOTIDIEN",
                "style": "MINIMALISTE",
                "cutType": "OVERSIZE",
                "details": {"manches": "BALLON", "longueur": "MAXI"},
                "constructionMethod": "FLAT_PATTERN",
                "presentation": "WORN",
                "constructionNotes": None,
                "fit": {
                    "ease": "AMPLE",
                    "fullness": {"sleeve": 1.5},
                    "lengths": {"sleevePct": 30},
                    "fabricBehavior": "FLUIDE",
                    "certainty": {"ease": "HIGH", "fullness.sleeve": "MEDIUM", "lengths.sleevePct": "MEDIUM"},
                },
            },
    },
    {
        "scene": "Mannequin de couture drapé d'un long tissu rouge plissé en cascade sur une épaule, sans coutures visibles (type lamba/sari).",
        "profile": {
            "isGarment": True,
            "garmentType": "ROBE",
            "occasion": "CEREMONIE",
            "style": "TRADITIONNEL",
            "cutType": "EVASEE",
            "details": {"manches": "SANS_MANCHES", "longueur": "SOL"},
            "constructionMethod": "DRAPING",
            "presentation": "MANNEQUIN",
            "constructionNotes": "Entièrement drapé : épingler le tissu sur mannequin, plis en cascade depuis l'épaule ; patron plat limité à la doublure/base.",
            "fit": None,
        },
    },
    {
        "scene": "Photo d'un plat de riz sur une table.",
        "profile": {"isGarment": False, "garmentType": None, "occasion": None, "style": None, "cutType": None, "details": {},
                    "constructionMethod": None, "presentation": None, "constructionNotes": None, "fit": None},
    },
]


def _format_vocab(title: str, vocab: dict[str, str]) -> str:
    lines = "\n".join(f"  - {key} : {hint}" for key, hint in vocab.items())
    return f"{title}\n{lines}"


def build_taxonomy_prompt() -> str:
    """The full instruction block sent with the photo (vocabularies + procedure + examples)."""
    import json

    parts = [
        "Tu es modéliste senior chez ANGALY. Tu classes la photo d'un vêtement pour pré-remplir un "
        "formulaire de patronage. Réponds uniquement avec des identifiants du vocabulaire fermé "
        "ci-dessous (MAJUSCULES exactes), jamais d'autre valeur.",
        _format_vocab("garmentType :", GARMENT_TYPES),
        _format_vocab("occasion :", OCCASIONS),
        _format_vocab("style :", STYLES),
        _format_vocab("cutType :", CUT_TYPES),
        _format_vocab("constructionMethod :", CONSTRUCTION_METHODS),
        _format_vocab("presentation :", PRESENTATIONS),
        _format_vocab("fit.ease :", EASE_LEVELS),
        _format_vocab("fit.fabricBehavior :", FABRIC_BEHAVIORS),
    ]
    for group, options in DETAIL_OPTIONS.items():
        parts.append(_format_vocab(f"details.{group} :", options))
    parts.append(DECISION_PROCEDURE)
    parts.append(FIT_GUIDE)
    parts.append(_format_vocab("drapeBlocks.kind :", DRAPE_BLOCK_KINDS))
    parts.append(DRAPE_GUIDE)
    examples = "\n".join(
        f"- Scène : {ex['scene']}\n  profile : {json.dumps(ex['profile'], ensure_ascii=False)}"
        for ex in FEW_SHOT_EXAMPLES
    )
    parts.append(f"Exemples :\n{examples}")
    parts.append(
        "Dans `features`, ajoute en français (1 à 4 mots) pour l'affichage : silhouette, encolure, "
        "manches, longueur, taille, tissu, détails — omets ce qui est invisible. "
        "N'invente aucune mesure ni géométrie."
    )
    return "\n\n".join(parts)


# --- Deterministic post-validation -----------------------------------------------------------

def _pick(value: Any, allowed: dict[str, str]) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = value.strip().upper().replace(" ", "_").replace("-", "_")
    return candidate if candidate in allowed else None


def _round_to_step(value: float, step: float) -> float:
    rounded = round(round(value / step) * step, 4)
    return int(rounded) if float(rounded).is_integer() else rounded


def _fit_number(path: str, value: Any, certainty: dict[str, str]) -> float | None:
    """Bounded, certain, rounded number — or None. Wildly aberrant values (beyond twice the upper bound,
    or below half the lower one) are rejected; mildly out-of-range ones are clamped and logged."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    if certainty.get(path) not in _CERTAINTY_KEPT:
        return None
    low, high, step = FIT_NUMBER_BOUNDS[path]
    if value > high * 2 or value < 0 or (low > 0 and value < low / 2):
        logger.warning("fit.%s=%r rejected: aberrant (bounds %s..%s)", path, value, low, high)
        return None
    if value < low or value > high:
        logger.warning("fit.%s=%r clamped to bounds %s..%s", path, value, low, high)
        value = min(high, max(low, value))
    return _round_to_step(float(value), step)


def normalize_fit(raw: Any, garment_type: str, details: dict[str, str]) -> dict[str, Any] | None:
    """Keeps only certain, in-range, garment-relevant fit values. Nothing left ⇒ None."""
    if not isinstance(raw, dict):
        return None
    raw_certainty = raw.get("certainty")
    certainty: dict[str, str] = (
        {k: str(v).strip().upper() for k, v in raw_certainty.items() if isinstance(k, str)}
        if isinstance(raw_certainty, dict)
        else {}
    )
    result: dict[str, Any] = {}
    kept: dict[str, str] = {}

    ease = _pick(raw.get("ease"), EASE_LEVELS)
    if ease and certainty.get("ease") in _CERTAINTY_KEPT:
        result["ease"] = ease
        kept["ease"] = certainty["ease"]

    sleeveless = details.get("manches") == "SANS_MANCHES"
    allowed = {
        "fullness.skirt": garment_type in _SKIRT_GARMENTS,
        "lengths.skirtPct": garment_type in _SKIRT_GARMENTS,
        "fullness.sleeve": garment_type in _SLEEVE_GARMENTS and not sleeveless,
        "lengths.sleevePct": garment_type in _SLEEVE_GARMENTS,
        "lengths.bodicePct": garment_type in _BODICE_GARMENTS,
    }
    for path, ok in allowed.items():
        if not ok:
            continue
        group, name = path.split(".")
        group_raw = raw.get(group)
        value = _fit_number(path, group_raw.get(name) if isinstance(group_raw, dict) else None, certainty)
        if value is None:
            continue
        result.setdefault(group, {})[name] = value
        kept[path] = certainty[path]

    behavior = _pick(raw.get("fabricBehavior"), FABRIC_BEHAVIORS)
    if behavior:
        result["fabricBehavior"] = behavior

    if not kept and "fabricBehavior" not in result:
        return None
    result["certainty"] = kept
    return result


def _bounded(name: str, value: Any) -> float | None:
    """Same rule as `_fit_number` for drape parameters: aberrant ⇒ reject, mild overshoot ⇒ clamp."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    low, high, step = DRAPE_BOUNDS[name]
    if value > high * 2 or value < 0 or (low > 0 and value < low / 2):
        logger.warning("drape.%s=%r rejected: aberrant (bounds %s..%s)", name, value, low, high)
        return None
    if value < low or value > high:
        logger.warning("drape.%s=%r clamped to bounds %s..%s", name, value, low, high)
        value = min(high, max(low, value))
    return _round_to_step(float(value), step)


def _side(value: Any) -> str | None:
    side = value.strip().upper() if isinstance(value, str) else None
    return side if side in {"LEFT", "RIGHT"} else None


def _drape_block(raw: dict[str, Any]) -> dict[str, Any] | None:
    kind = _pick(raw.get("kind"), DRAPE_BLOCK_KINDS)
    if kind is None:
        return None
    certainty = raw.get("certainty")
    if not isinstance(certainty, str) or certainty.strip().upper() not in _CERTAINTY_KEPT:
        return None  # "if in doubt, leave it out"
    if kind == "GATHERED_SKIRT":
        fullness = _bounded("gatheredFullness", raw.get("fullness"))
        return {"kind": kind, "fullness": fullness} if fullness is not None else None
    if kind == "PLEATED_SKIRT":
        pleats = _bounded("pleats", raw.get("pleats"))
        depth = _bounded("pleatDepthMm", raw.get("depthMm"))
        pleat_type = raw.get("type").strip().upper() if isinstance(raw.get("type"), str) else None
        if pleats is None or depth is None or pleat_type not in {"KNIFE", "BOX"}:
            return None
        return {"kind": kind, "pleats": pleats, "depthMm": depth, "type": pleat_type}
    if kind == "CIRCLE_SKIRT":
        fraction = raw.get("fraction")
        if isinstance(fraction, bool) or fraction not in CIRCLE_FRACTIONS:
            return None
        return {"kind": kind, "fraction": fraction}
    if kind == "WRAP_FRONT":
        overlap, side = _bounded("wrapOverlapMm", raw.get("overlapMm")), _side(raw.get("side"))
        return {"kind": kind, "overlapMm": overlap, "side": side} if overlap is not None and side else None
    if kind == "COWL_NECK":
        depth = _bounded("cowlDepthMm", raw.get("depthMm"))
        return {"kind": kind, "depthMm": depth} if depth is not None else None
    if kind == "TRAIN":
        length = _bounded("trainLengthMm", raw.get("lengthMm"))
        return {"kind": kind, "lengthMm": length} if length is not None else None
    if kind == "OVERSKIRT":
        pct, side = _bounded("overskirtLengthPct", raw.get("lengthPct")), _side(raw.get("side"))
        return {"kind": kind, "lengthPct": pct, "side": side} if pct is not None and side else None
    if kind == "DRAPED_BODICE":
        pleats, side = _bounded("bodicePleats", raw.get("pleats")), _side(raw.get("side"))
        return {"kind": kind, "pleats": pleats, "side": side} if pleats is not None and side else None
    drop, side = _bounded("hemDropMm", raw.get("dropMm")), _side(raw.get("side"))
    return {"kind": kind, "dropMm": drop, "side": side} if drop is not None and side else None


def normalize_drape_blocks(raw: Any, garment_type: str, construction: str | None) -> list[dict[str, Any]] | None:
    """Keeps only certain, in-range, garment-relevant blocks. A free drape (DRAPING) gets none: a block
    never replaces a mannequin moulding. Nothing valid ⇒ None (the note stays as mannequin advice)."""
    if not isinstance(raw, list) or construction == "DRAPING":
        return None
    allowed = DRAPE_BLOCKS_BY_GARMENT.get(garment_type, set())
    blocks: list[dict[str, Any]] = []
    seen: set[str] = set()
    has_skirt = False
    for item in raw[: MAX_DRAPE_BLOCKS * 2]:
        if len(blocks) >= MAX_DRAPE_BLOCKS:
            break
        block = _drape_block(item) if isinstance(item, dict) else None
        if block is None or block["kind"] not in allowed or block["kind"] in seen:
            continue
        if block["kind"] in _SKIRT_BLOCKS:
            if has_skirt:
                continue
            has_skirt = True
        seen.add(block["kind"])
        blocks.append(block)
    return blocks or None


def normalize_profile(raw: dict[str, Any] | None) -> dict[str, Any]:
    """Keeps only taxonomy-valid values. Not a garment ⇒ everything else is emptied."""
    empty: dict[str, Any] = {
        "isGarment": False,
        "garmentType": None,
        "occasion": None,
        "style": None,
        "cutType": None,
        "details": {},
        "constructionMethod": None,
        "presentation": None,
        "constructionNotes": None,
        "fit": None,
        "drapeBlocks": None,
    }
    if not raw or raw.get("isGarment") is not True:
        return empty

    garment_type = _pick(raw.get("garmentType"), GARMENT_TYPES)
    if garment_type is None:
        # A garment we cannot place in the taxonomy is still not usable to pre-fill the wizard.
        return empty

    raw_details = raw.get("details") or {}
    details: dict[str, str] = {}
    for group, options in DETAIL_OPTIONS.items():
        if garment_type in _NO_SLEEVES_NECK_FOR and group in {"manches", "col", "decollete", "dos"}:
            continue
        picked = _pick(raw_details.get(group), options) if isinstance(raw_details, dict) else None
        if picked:
            details[group] = picked

    construction = _pick(raw.get("constructionMethod"), CONSTRUCTION_METHODS)
    notes = raw.get("constructionNotes")
    notes = notes.strip()[:400] if isinstance(notes, str) and notes.strip() else None

    return {
        "isGarment": True,
        "garmentType": garment_type,
        "occasion": _pick(raw.get("occasion"), OCCASIONS),
        "style": _pick(raw.get("style"), STYLES),
        "cutType": _pick(raw.get("cutType"), CUT_TYPES),
        "details": details,
        "constructionMethod": construction,
        "presentation": _pick(raw.get("presentation"), PRESENTATIONS),
        # Notes only make sense when part of the garment is draped.
        "constructionNotes": notes if construction in {"DRAPING", "MIXED"} else None,
        "fit": normalize_fit(raw.get("fit"), garment_type, details),
        "drapeBlocks": normalize_drape_blocks(raw.get("drapeBlocks"), garment_type, construction),
    }
