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
import re
from typing import Any

from app.construction_knowledge import CONSTRUCTION_GUIDE, normalize_construction

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
        "BALLON": "manche LONGUE gigot : très bouffante de l'épaule au coude, puis ajustée jusqu'au poignet",
        "PAPILLON": "manches évasées, larges, flottantes",
        "EVEQUE": "manche longue ample dès l'emmanchure, froncée dans un poignet serré",
        "CLOCHE": "manche ajustée jusqu'au coude puis évasée en cloche ou trompette",
        "LANTERNE": "manche froncée en haut et au poignet, bouffante entre les deux",
        "RAGLAN": "manche dont la couture part du col vers le dessous de bras (pas de couture d'épaule)",
        "KIMONO": "manche coupée d'une pièce avec le corps, sans emmanchure",
        "CAP": "minuscule manche couvrant juste le haut de l'épaule",
        "TAILLEUR": "manche longue ajustée en deux pièces (couture visible derrière le bras, coude marqué), "
                    "terminée par un poignet rapporté (souvent d'un autre tissu, parfois bordé de dentelle)",
    },
    "col": {
        "SANS_COL": "encolure simple sans pied de col",
        "ROND": "encolure ronde dégagée",
        "EN_V": "encolure formant un V",
        "BATEAU": "encolure large et horizontale d'une épaule à l'autre",
        "CHEMISIER": "col chemise classique rabattu",
        "OFFICIER": "col droit montant sans rabat (Mao)",
        "LAVALLIERE": "col à nouer en lavallière / nœud",
        "CHALE": "grand col châle / revers qui descend en V sur la poitrine (peut monter en pied de col dans le dos)",
    },
    "decollete": {
        "SAGE": "ras du cou, couvrant",
        "MOYEN": "dégagement modéré",
        "PLONGEANT": "ouverture profonde",
        "COEUR": "ligne en forme de cœur (bustier sweetheart)",
        "CARRE": "ligne carrée",
        "EN_U": "encolure en U : profonde et arrondie, aux côtés presque droits (plus creusée qu'une encolure ronde)",
        "HORS_EPAULES": "hors épaules (bardot) : bord large posé sur le haut des bras, épaules nues, bord nettement sous les clavicules au milieu devant",
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
        "GENOU": "s'arrête au genou",
        "MIDI": "sous le genou, jusqu'à mi-mollet",
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
        "CORDELIERE": "fine cordelière / lien noué (à la taille ou aux hanches) qui retient les deux devants",
        "ZIP_DEVANT": "fermeture éclair visible au milieu devant",
        "BOUTONS_TAILLE": "boutonnage devant du col à la taille seulement, la jupe fermée sans boutons",
        "BRAGUETTE_ZIP": "pantalon : braguette au milieu devant (patte surpiquée en J), fermée par une glissière",
        "BRAGUETTE_BOUTONS": "pantalon : braguette au milieu devant fermée par une rangée de boutons",
        "ZIP_COTE": "pantalon ou jupe sans braguette : devant lisse, glissière cachée dans la couture de côté",
        "ELASTIQUE": "pantalon ou jupe à enfiler : taille froncée par un élastique ou un cordon, aucune fermeture",
    },
    "corsage": {
        "LISSE": "devant du corsage d'un seul tenant, sans fronces",
        "FRONCES_SOUS_POITRINE": "devant froncé sous la poitrine sur un empiècement (bande) jusqu'à la taille",
        "CROISE_FRONCE": "devant froncé dont les deux côtés se croisent en diagonale (cache-cœur) sur l'empiècement",
        "BALEINE": "corsage-corset baleiné : très ajusté et rigide, lignes verticales (baleines, coutures) bien visibles",
        "PRINCESSE": "corsage à découpes princesse : coutures courbes qui partent de l'emmanchure, passent sur la "
                     "poitrine et descendent jusqu'à la taille, devant et dos (pas de pince, pas de baleines)",
    },
    "taille": {
        "NATURELLE": "couture corsage/jupe à la taille naturelle",
        "BASSE": "corsage prolongé sur les hanches (basque), la jupe part plus bas que la taille",
        "HAUTE": "taille empire : la jupe part juste sous la poitrine (couture / ruban sous le buste), corsage court",
        "POINTE": "taille en pointe : le corsage descend en V sous la taille au milieu devant (robes 1840–1870)",
        # Pantalon, jupe : hauteur du bord supérieur (NATURELLE = à la taille, HAUTE = au-dessus, BASSE = sur les hanches).
    },
    "devant": {
        "FERME": "devant d'un seul tenant, fermé du col à l'ourlet",
        "MANTEAU_OUVERT": "robe-manteau / redingote : les deux devants s'écartent du col à l'ourlet sur un plastron "
                          "ou une sous-robe d'une autre couleur",
        "MANTEAU_REVERS": "robe-manteau ouverte sur un plastron dont les bords du corsage sont rabattus en revers "
                          "(bandes de tissu retournées, larges sur la poitrine, étroites à la taille) de chaque côté du plastron",
        "GILET": "corsage (cuirasse) ouvert sur un gilet d'un autre tissu, boutonné au milieu, qui s'arrête avec le "
                 "corsage sur les hanches ; bords retournés en revers ; la jupe dessous reste fermée devant",
    },
    "jupe": {
        "DEUX_PANS": "jupe faite d'un devant et d'un dos (aucune couture verticale visible hormis les côtés)",
        "EN_LES": "jupe en lés : plusieurs panneaux verticaux qui s'évasent vers l'ourlet (coutures visibles entre "
                  "le devant, les côtés et le dos), typique des robes longues 1890–1910",
    },
    "basque": {
        "AUCUNE": "le bas du corsage est droit ou suit la couture de taille, sans pointes ni pans",
        "POINTES": "le gilet ou le devant du corsage finit en pointes (comme un gilet d'homme) sous la taille",
        "PANS_CROISES": "pointes du gilet et deux pans d'étoffe qui se croisent en V sur le haut de la jupe devant",
    },
    # Pantalon et jupe (bas du corps).
    "ceinture": {
        "DROITE": "ceinture rapportée droite (bande de 3-4 cm), boutonnée ou agrafée",
        "FORMEE": "ceinture large et galbée (5 cm et plus), qui suit la courbe des hanches",
        "ELASTIQUEE": "ceinture froncée par un élastique, sans boutonnage",
        "COULISSE": "ceinture froncée par un cordon qui se noue devant (cordon visible)",
        "SANS": "pas de ceinture rapportée : le haut du vêtement est fini par une parementure (bord net)",
    },
    "plis": {
        "AUCUN": "devant plat, ni pli ni pince visible",
        "PINCES": "pinces courtes sous la ceinture (fines coutures en pointe), devant plat",
        "UN_PLI": "un pli couché de chaque côté sous la ceinture, qui donne de l'ampleur aux hanches",
        "DEUX_PLIS": "deux plis de chaque côté sous la ceinture (pantalon à pinces ample, années 1930–1950, 1980)",
    },
    "poches": {
        "AUCUNE": "aucune poche visible devant",
        "ITALIENNES": "poches en biais (italiennes) : ouverture oblique de la ceinture vers la couture de côté",
        "COUTURE": "poches invisibles dans la couture de côté (ouverture verticale dans la couture)",
        "PLAQUEES": "poches plaquées cousues sur le devant (rabat ou bord visible)",
    },
    "poches_dos": {
        "AUCUNE": "aucune poche au dos",
        "PASSEPOIL": "poches passepoilées au dos (fente horizontale bordée, parfois un bouton)",
        "PLAQUEES": "poches plaquées au dos (jean, chino)",
    },
    "bas": {
        "OURLET": "bas de jambe simple, ourlet invisible",
        "REVERS": "bas de jambe retroussé en revers (bande repliée de 3-5 cm)",
    },
    "fente": {
        "AUCUNE": "aucune fente à l'ourlet de la jupe",
        "DOS": "fente au milieu dos, en bas de la jupe (jupe droite / crayon)",
        "COTE": "fente sur un côté de la jupe",
    },
}

# Groups that only make sense on the bottoms (trousers, skirts, the suit's trousers), and the trouser / skirt ones.
_BOTTOM_GROUPS = {"ceinture", "plis", "poches", "poches_dos", "bas", "fente"}
_BOTTOM_GARMENTS = {"PANTALON", "JUPE", "COSTUME"}
_TROUSER_ONLY = {"poches_dos", "bas"}
_SKIRT_ONLY = {"fente"}
_TROUSER_CLOSURES = {"BRAGUETTE_ZIP", "BRAGUETTE_BOUTONS"}

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

# Look of the fabric (informative, for the 3D preview); mirrors FABRIC_PRINTS in pattern-fit.ts.
FABRIC_PRINTS: dict[str, str] = {
    "UNI": "une seule couleur, sans motif",
    "POIS": "pois / points réguliers",
    "RAYURES": "rayures",
    "CARREAUX": "carreaux, vichy, tartan",
    "FLEURI": "motif floral",
    "BROCART": "brocart / jacquard : rinceaux fleuris tissés (souvent or sur ivoire), panneaux de robes historiques",
    "ARABESQUE": "arabesques / volutes (lignes courbes enroulées, souvent dorées sur fond sombre)",
    "AUTRE": "autre imprimé (géométrique, wax, animalier…)",
}

# Surface of the fabric (informative, for the 3D preview); mirrors FABRIC_FINISHES in pattern-fit.ts.
FABRIC_FINISHES: dict[str, str] = {
    "MAT": "tissu mat (coton, laine, lin)",
    "VELOURS": "velours : reflets clairs sur les reliefs, ombres profondes",
    "SATIN": "satin / soie brillante : reflets nets",
}
_HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
# Width of one motif of the print (cm), as `MOTIF_SIZE_BOUNDS_CM` in @angaly/types: out-of-range readings are clamped.
MOTIF_SIZE_MIN_CM = 0.5
MOTIF_SIZE_MAX_CM = 60.0

# name -> (min, max, step); same bounds as FULLNESS_BOUNDS / LENGTH_BOUNDS in pattern-fit.ts.
FIT_NUMBER_BOUNDS: dict[str, tuple[float, float, float]] = {
    "fullness.skirt": (1.0, 4.0, 0.25),
    "fullness.sleeve": (1.0, 2.5, 0.25),
    "lengths.skirtPct": (40.0, 130.0, 1.0),
    "lengths.sleevePct": (0.0, 100.0, 1.0),
    "lengths.bodicePct": (80.0, 120.0, 1.0),
    "fullness.leg": (0.6, 1.8, 0.05),
    "lengths.legPct": (40.0, 110.0, 1.0),
}
_LEG_GARMENTS = {"PANTALON", "COSTUME"}

_SKIRT_GARMENTS = {"JUPE", "ROBE", "ROBE_MARIEE"}
_SLEEVE_GARMENTS = {"ROBE", "VESTE", "COSTUME", "CHEMISE", "ROBE_MARIEE"}
_BODICE_GARMENTS = _SLEEVE_GARMENTS | {"AUTRE"}
_CERTAINTY_KEPT = {"HIGH", "MEDIUM"}

FIT_GUIDE = """\
Ajustements (`fit`, optionnel — omets tout champ dont tu n'es pas SÛR ; mieux vaut ne rien dire qu'inventer) :
- ease : AJUSTE / CONFORT / AMPLE (voir le vocabulaire). Juge l'espace entre le tissu et le corps, pas la
  taille de la personne. Une robe qui tombe droit sans toucher le corps = AMPLE ; un fourreau moulant = AJUSTE.
- fullness.skirt (1 à 4, pas de 0,25) = LARGEUR DE L'OURLET ÷ LARGEUR DE LA TAILLE, vues de face
  (mesure-les sur la photo, ne devine pas) : 1 = jupe droite / fourreau (ourlet ≈ taille) ;
  ≈1,5 = très légèrement évasée ; ≈2 = trapèze net (ourlet deux fois la taille) ; ≈2,5 = jupe ample qui
  s'ouvre largement (ourlet ≈ 2,5 fois la taille) ; ≈3 = très ample, bouffante ou plissée serrée ; 4 = volume
  maximal (cercle, tulle gonflé). Une robe « évasée / trapèze / princesse » est presque toujours ≥ 2 :
  sous-estimer donne un fourreau droit. Ne mets 1,5 que si l'évasement est à peine visible.
- fullness.sleeve (1 à 2,5) : 1 = manche droite ; ≈1,5 = manche légèrement bouffante ; ≈2 = ballon marqué.
  Seulement s'il y a des manches.
- lengths.skirtPct (40 à 130) : longueur de la jupe en % de la longueur « normale » du type (100 = standard
  pour le détail `longueur` choisi). lengths.sleevePct (0 à 100) : 0 = sans manches, 100 = poignet.
  lengths.bodicePct (80 à 120) : buste court (<100) / long (>100) par rapport à la taille naturelle.
- Pantalon : fullness.leg (0,6 à 1,8, pas de 0,05) = largeur du bas de jambe par rapport à la coupe choisie
  (1 = la coupe telle quelle ; 1,3 = ourlet 30 % plus large, pattes d'éléphant très marquées ; 0,8 = plus resserré).
  lengths.legPct (40 à 110) = longueur en % de la jambe jusqu'à la cheville : 45 short, 60 bermuda, 75 pantacourt,
  90 cheville découverte (7/8), 100 cheville, 104 jusqu'au sol (sur le talon).
  Coupe d'un pantalon = forme de la jambe, à lire en comparant la largeur au GENOU et à l'OURLET : DROITE (genou ≈ ourlet,
  jambe moyenne), AJUSTEE (slim, étroite jusqu'à la cheville), EVASEE (bootcut : ourlet un peu plus large que le genou),
  SIRENE (pattes d'éléphant : ajusté au genou, ourlet ≥ 1,5 × genou), PRINCESSE (palazzo : très large dès la hanche,
  genou ≈ ourlet), OVERSIZE (baggy / sarouel : genou large, ourlet resserré).
- fabricBehavior : FLUIDE / STRUCTURE / RIGIDE / STRETCH (informatif, jamais de géométrie).
- fabricPrint : UNI / POIS / RAYURES / CARREAUX / FLEURI / BROCART / ARABESQUE / AUTRE ; fabricColor = couleur
  du fond et motifColor = couleur du motif, en hexadécimal « #rrggbb » (informatif : aperçu 3D seulement) ;
  motifSizeCm = largeur d'UN motif en cm (un pois, une fleur), à estimer d'après la taille du corps : petits pois
  1–2, fleurettes 2–4, grandes fleurs brodées 10–20 (0,5 à 60 ; à omettre si tu ne peux pas l'estimer) ;
  contrastColor = couleur d'un panneau contrastant (plastron, sous-robe d'une robe-manteau), s'il y en a un ;
  contrastPrint / contrastMotifColor = son motif (ex. BROCART or sur ivoire) ; fabricFinish : MAT / VELOURS /
  SATIN ; accentPrint = motif (couleur motifColor) porté seulement par le haut bouffant des manches et les
  bordures du plastron, le reste de la robe étant uni (laisser fabricPrint = UNI dans ce cas) ;
  contrastGores = true quand une jupe en lés (jupe EN_LES) a ses lés de côté dans le tissu contrastant (lés à pois
  de part et d'autre d'un tablier uni), le panneau du milieu restant dans le tissu principal ;
  contrastTrims = true quand le col et les poignets sont taillés dans le tissu contrastant (celui du gilet).
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
- Robe de mariée : la jupe recouvre un jupon dont l'ourlet vaut fullness.skirt × taille × 1,13. Un bloc
  GATHERED_SKIRT / PLEATED_SKIRT doit fournir au moins ce tour (fronces ≥ 1,2 × fullness.skirt ; plis :
  plis × profondeur ≥ (1,2 × fullness.skirt − 1) × 78 cm) — sinon la jupe ne peut pas recouvrir son jupon.
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
   Exceptions : pour une ROBE ou une JUPE, `longueur` est TOUJOURS visible (repère où l'ourlet tombe : au-dessus
   du genou = MINI, au genou = GENOU, mi-mollet = MIDI, cheville = MAXI, sol = SOL) ; et pour une ROBE, `taille` est visible
   dès qu'on voit la couture ou la ceinture de la jupe (sous la poitrine = HAUTE, à la taille = NATURELLE).
   Donne `col` (forme : ROND, EN_V…) OU `decollete` (profondeur), jamais les deux pour un col en forme.
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
   Robe : repère les COUTURES du buste. Si le devant est froncé/plissé sous la poitrine (tissu qui
   « s'ouvre » en plis sous le buste), choisis corsage = FRONCES_SOUS_POITRINE, ou CROISE_FRONCE si les deux
   côtés se croisent en diagonale (cache-cœur). Une bande ajustée qui descend jusqu'aux hanches avant que la
   jupe ne parte = taille BASSE ; jupe qui part à la taille naturelle = NATURELLE (n'écris NATURELLE que
   si la couture est vraiment visible à la taille — un empiècement long n'est PAS la taille naturelle).
   Ne confonds pas ceinture (fermeture) et couture de taille.
9. fit : applique le guide « Ajustements » ci-dessous ; omets `fit` (null) si rien n'est lisible.
10. drapeBlocks : applique le guide « Blocs de drapé » ; omets-les (null) dans le doute ou pour un drapé libre.
    trims : applique le guide « Garnitures » (berthe de dentelle, volants de manche, perles) ; null si aucune.
    construction : applique le guide « Pièces de construction visibles » (volants d'ourlet, godets, basque rapportée,
    jabot, pèlerine, gros nœud, bandes, engageantes, tournure, pli Watteau, écharpe, tablier, broderie, smocks,
    poignets contrastés) ; omets la clé si rien de tel n'est visible.
    Robe de bal 1840–1870 : corsage baleiné à lignes verticales = corsage BALEINE ; corsage qui descend en V sous la
    taille au milieu devant = taille POINTE (pas NATURELLE).
    Des plis réguliers qui partent des hanches et restent visibles tout le long de la jupe = PLEATED_SKIRT
    (compte les plis visibles de face et double-les ; plis creux BOX s'ils sont larges et arrondis, KNIFE
    s'ils sont fins et couchés) ; une jupe simplement évasée sans plis visibles = aucun bloc.
    Manches : tête ou bas gonflé/froncé (silhouette arrondie au-dessus de l'épaule) → fullness.sleeve ≈ 1,5.
    Petites manches courtes bouffantes (au-dessus du coude) = COURTES + fullness.sleeve 1,5 à 2,5 + lengths.sleevePct
    ≈ 20 ; jamais BALLON, qui trace une manche longue jusqu'au poignet. Mancherons minuscules = CAP.
    Choix de la famille de manche : bouffante en haut puis ajustée à l'avant-bras = BALLON (gigot) ; ample sur
    tout le bras et froncée dans un poignet serré = EVEQUE ; ajustée puis évasée du coude = CLOCHE ; froncée en
    haut ET au poignet, gonflée au milieu = LANTERNE ; couture diagonale du col au dessous de bras = RAGLAN ;
    manche taillée d'une pièce avec le corps (chauve-souris, kimono) = KIMONO ; simple bord sur l'épaule = CAP.
    Cols : de larges revers ou un col châle qui s'ouvrent en V sur la poitrine = col CHALE (même s'il y a aussi un
    pied de col montant) ; un simple col montant droit = OFFICIER ; ne les omets pas, le patron n'a de col que si tu le dis.
    Encolure : un bord qui passe SOUS les épaules et se pose sur le haut des bras (épaules nues) = decollete
    HORS_EPAULES, pas col BATEAU (un bateau est large mais reste SUR les épaules, haut au milieu devant).
    Robe-manteau : deux devants qui s'ouvrent sur un panneau central d'une autre couleur (plastron, sous-robe) =
    devant MANTEAU_OUVERT ; un lien fin noué qui les retient = fermeture CORDELIERE. Une robe d'un seul tenant = FERME.
    Si les bords du corsage sont retournés en revers de part et d'autre du plastron (même avec un col montant) =
    devant MANTEAU_REVERS. Si seul le CORSAGE s'ouvre sur le gilet (il s'arrête sur les hanches) et que la jupe
    dessous est fermée devant (tablier, panneau du milieu) = devant GILET, pas MANTEAU_*. Coutures verticales qui
    divisent la jupe en panneaux évasés = jupe EN_LES. Coutures courbes du corsage de l'emmanchure à la taille
    (sans baleines) = corsage PRINCESSE ; manche longue ajustée à deux coutures et poignet rapporté = manches TAILLEUR ;
    gilet qui finit en pointes sous la taille = basque POINTES, avec deux pans croisés en V sur la jupe = PANS_CROISES.
    Les plis visibles du ballon (fronces, drapé) ne changent pas la famille : ils s'expriment par fullness.sleeve.
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
        "scene": "Femme en robe longue verte à manches courtes bouffantes, col rond, devant froncé et croisé sous la "
        "poitrine sur une bande ajustée qui descend aux hanches, puis jupe à plis creux réguliers jusqu'à mi-mollet.",
        "profile": {
            "isGarment": True,
            "garmentType": "ROBE",
            "occasion": "QUOTIDIEN",
            "style": "CLASSIQUE",
            "cutType": "EVASEE",
            "details": {
                "manches": "COURTES",
                "col": "ROND",
                "longueur": "MAXI",
                "corsage": "CROISE_FRONCE",
                "taille": "BASSE",
            },
            "constructionMethod": "FLAT_PATTERN",
            "presentation": "WORN",
            "constructionNotes": None,
            "fit": {
                "ease": "CONFORT",
                "fullness": {"sleeve": 1.5},
                "lengths": {"skirtPct": 95, "sleevePct": 40},
                "fabricBehavior": "FLUIDE",
                "fabricPrint": "UNI",
                "fabricColor": "#2f6b4f",
                "certainty": {
                    "ease": "MEDIUM",
                    "fullness.sleeve": "MEDIUM",
                    "lengths.skirtPct": "MEDIUM",
                    "lengths.sleevePct": "MEDIUM",
                },
            },
            "drapeBlocks": [{"kind": "PLEATED_SKIRT", "pleats": 20, "depthMm": 50, "type": "BOX", "certainty": "MEDIUM"}],
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
        _format_vocab("fit.fabricPrint :", FABRIC_PRINTS),
        _format_vocab("fit.fabricFinish :", FABRIC_FINISHES),
    ]
    for group, options in DETAIL_OPTIONS.items():
        parts.append(_format_vocab(f"details.{group} :", options))
    parts.append(DECISION_PROCEDURE)
    parts.append(FIT_GUIDE)
    parts.append(_format_vocab("drapeBlocks.kind :", DRAPE_BLOCK_KINDS))
    parts.append(DRAPE_GUIDE)
    parts.append(TRIM_GUIDE)
    parts.append(CONSTRUCTION_GUIDE)
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
        "fullness.leg": garment_type in _LEG_GARMENTS,
        "lengths.legPct": garment_type in _LEG_GARMENTS,
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
    for key in ("fabricPrint", "contrastPrint", "accentPrint"):
        picked = _pick(raw.get(key), FABRIC_PRINTS)
        if picked:
            result[key] = picked
    finish = _pick(raw.get("fabricFinish"), FABRIC_FINISHES)
    if finish:
        result["fabricFinish"] = finish
    for key in ("fabricColor", "motifColor", "contrastColor", "contrastMotifColor"):
        color = raw.get(key)
        if isinstance(color, str) and _HEX_COLOR.match(color.strip()):
            result[key] = color.strip().lower()
    if raw.get("contrastGores") is True:
        result["contrastGores"] = True
    if raw.get("contrastTrims") is True:
        result["contrastTrims"] = True
    size = raw.get("motifSizeCm")
    if isinstance(size, (int, float)) and not isinstance(size, bool) and math.isfinite(size) and size > 0:
        result["motifSizeCm"] = round(min(MOTIF_SIZE_MAX_CM, max(MOTIF_SIZE_MIN_CM, float(size))), 1)

    informative = {"fabricBehavior", "fabricPrint", "fabricColor", "motifColor", "motifSizeCm", "contrastColor",
                   "fabricFinish", "contrastPrint", "contrastMotifColor", "accentPrint", "contrastGores",
                   "contrastTrims"}
    if not kept and not informative & result.keys():
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


# Robe de mariée : la jupe recouvre le jupon du moteur (ourlet = fullness.skirt × taille du corps × 1,13, voir
# robe-mariee.rule.ts). Sans mesures, on raisonne sur une taille de référence de 74 cm (78 cm finie).
_JUPON_ROUND = 1.13
_JUPON_MARGIN = 1.05
_REF_BODY_WAIST_MM = 740.0
_REF_SKIRT_WAIST_MM = 780.0


def cover_petticoat(
    blocks: list[dict[str, Any]] | None, fit: dict[str, Any] | None, garment_type: str
) -> list[dict[str, Any]] | None:
    """Widens a ROBE_MARIEE gathered/pleated skirt block whose hem cannot cover the petticoat
    `fullness.skirt` implies (first reading of Met 108161: 32 × 26 mm pleats ≈ 1,55 m on a ≈ 2,5 m
    petticoat). Never narrows; a circle skirt is left to the engine's warning. Pleats deepen first
    (≤ 80 mm), then their number grows (≤ 60)."""
    fullness = ((fit or {}).get("fullness") or {}).get("skirt")
    if garment_type != "ROBE_MARIEE" or not blocks or not isinstance(fullness, (int, float)) or fullness <= 1:
        return blocks
    target = fullness * _REF_BODY_WAIST_MM * _JUPON_ROUND * _JUPON_MARGIN
    out: list[dict[str, Any]] = []
    for block in blocks:
        if block["kind"] == "GATHERED_SKIRT":
            needed = min(4.0, math.ceil(target / _REF_SKIRT_WAIST_MM * 4) / 4)
            if block["fullness"] < needed:
                logger.info("drape.GATHERED_SKIRT fullness %s → %s (petticoat)", block["fullness"], needed)
                block = {**block, "fullness": needed}
        elif block["kind"] == "PLEATED_SKIRT":
            per_pleat = 2 if block["type"] == "BOX" else 1
            extra = target - _REF_SKIRT_WAIST_MM
            if block["pleats"] * block["depthMm"] * per_pleat < extra:
                depth = math.ceil(extra / (block["pleats"] * per_pleat) / 5) * 5
                pleats = block["pleats"]
                if depth > 80:
                    depth, pleats = 80.0, min(60.0, float(math.ceil(extra / (80 * per_pleat))))
                logger.info(
                    "drape.PLEATED_SKIRT %s × %s → %s × %s (petticoat)", block["pleats"], block["depthMm"], pleats, depth
                )
                block = {**block, "pleats": float(pleats), "depthMm": float(depth)}
        out.append(block)
    return out


# --- Garnitures (trims) ---------------------------------------------------------------------------
TRIM_KINDS = ["BERTHE", "SLEEVE_FRILL", "BEADING"]
TRIM_MATERIALS = ["DENTELLE", "TISSU", "TULLE"]
TRIM_PLACES = ["ENCOLURE", "BERTHE", "MANCHES", "TAILLE"]
# Same bounds as TRIM_BOUNDS in packages/types/src/pattern-fit.ts: (min, max, step).
TRIM_BOUNDS = {
    "bertheDepthMm": (30.0, 200.0, 5.0),
    "berthePointMm": (0.0, 250.0, 5.0),
    "frillTiers": (1.0, 4.0, 1.0),
    "frillDepthMm": (15.0, 120.0, 5.0),
    "beadMm": (2.0, 14.0, 1.0),
    "beadRows": (1.0, 3.0, 1.0),
}
MAX_TRIMS = 6
_TRIMS_FOR = {"ROBE", "ROBE_MARIEE", "CHEMISE", "VESTE", "AUTRE"}

TRIM_GUIDE = """\
Garnitures (`trims`, optionnel) — ce qui est COUSU sur la robe finie, à lire sur la photo :
- BERTHE : bande (dentelle, tulle ou même tissu) posée le long du décolleté ; depthMm (30–200) = sa hauteur, pointMm
  (0–250) = ce qu'elle descend EN PLUS au milieu devant (berthe en V jusqu'à la poitrine ≈ 120–160 ; droite = 0).
- SLEEVE_FRILL : volants froncés au bas des manches ; tiers (1–4) = nombre d'étages, depthMm (15–120) = hauteur d'un volant.
- BEADING : rang de perles ; place ENCOLURE (bord du décolleté), BERTHE (le long de la pointe de la berthe), MANCHES,
  TAILLE ; beadMm (2–14) = diamètre d'une perle, rows (1–3).
- Chaque garniture : {"kind": ..., <paramètres>, "material": "DENTELLE" | "TISSU" | "TULLE" (berthe, volants),
  "color": "#rrggbb" (couleur de la dentelle ou des perles), "certainty": "HIGH" | "MEDIUM"}.
- Une berthe et des volants au plus une fois, un rang de perles par place ; 6 garnitures maximum. Dans le doute, omets.
"""


def _trim_number(name: str, value: Any) -> float | None:
    """Like `_bounded` for trims: aberrant ⇒ reject, mild overshoot ⇒ clamp, snapped to the step."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    low, high, step = TRIM_BOUNDS[name]
    if value < 0 or value > high * 2:
        return None
    return _round_to_step(float(min(high, max(low, value))), step)


def _trim(raw: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    kind = _pick(raw.get("kind"), TRIM_KINDS)
    certainty = raw.get("certainty")
    if kind is None or not isinstance(certainty, str) or certainty.strip().upper() not in _CERTAINTY_KEPT:
        return None
    color = raw.get("color")
    extra = {"color": color.strip().lower()} if isinstance(color, str) and _HEX_COLOR.match(color.strip()) else {}
    if kind == "BEADING":
        place = _pick(raw.get("place"), TRIM_PLACES)
        bead, rows = _trim_number("beadMm", raw.get("beadMm")), _trim_number("beadRows", raw.get("rows"))
        if place is None or bead is None or rows is None:
            return None
        return f"BEADING:{place}", {"kind": kind, "place": place, "beadMm": bead, "rows": rows, **extra}
    material = _pick(raw.get("material"), TRIM_MATERIALS)
    if material is None:
        return None
    if kind == "BERTHE":
        depth, point = _trim_number("bertheDepthMm", raw.get("depthMm")), _trim_number("berthePointMm", raw.get("pointMm", 0))
        if depth is None or point is None:
            return None
        return kind, {"kind": kind, "depthMm": depth, "pointMm": point, "material": material, **extra}
    tiers, depth = _trim_number("frillTiers", raw.get("tiers")), _trim_number("frillDepthMm", raw.get("depthMm"))
    if tiers is None or depth is None:
        return None
    return kind, {"kind": kind, "tiers": tiers, "depthMm": depth, "material": material, **extra}


def normalize_trims(raw: Any, garment_type: str) -> list[dict[str, Any]] | None:
    """Keeps only certain, in-range garnitures on garments that can carry them (not trousers or skirts); a berthe and
    frills at most once, one bead row per place. Nothing valid ⇒ None."""
    if not isinstance(raw, list) or garment_type not in _TRIMS_FOR:
        return None
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for item in raw[: MAX_TRIMS * 2]:
        trim = _trim(item) if isinstance(item, dict) else None
        if trim is None or trim[0] in seen or len(out) >= MAX_TRIMS:
            continue
        seen.add(trim[0])
        out.append(trim[1])
    return out or None


_SHAPED_COLLARS = {"EN_V", "BATEAU", "OFFICIER", "CHEMISIER", "LAVALLIERE"}


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
        "trims": None,
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
        if garment_type in _NO_SLEEVES_NECK_FOR and group in {"manches", "col", "decollete", "dos", "corsage", "devant", "basque"}:
            continue
        if garment_type == "PANTALON" and group == "jupe":
            continue
        if group in _BOTTOM_GROUPS and garment_type not in _BOTTOM_GARMENTS:
            continue
        if group in _TROUSER_ONLY and garment_type == "JUPE":
            continue
        if group in _SKIRT_ONLY and garment_type != "JUPE":
            continue
        picked = _pick(raw_details.get(group), options) if isinstance(raw_details, dict) else None
        # A fly belongs to trousers; a pointed waist and the dress closures (ties, cord) never to the bottoms.
        if picked in _TROUSER_CLOSURES and garment_type not in {"PANTALON", "COSTUME"}:
            continue
        if garment_type in _NO_SLEEVES_NECK_FOR and (
            (group == "taille" and picked == "POINTE")
            or (group == "fermeture" and picked in {"CEINTURE_NOUEE", "CEINTURE_INTEGREE", "CORDELIERE", "BOUTONS_TAILLE", "ZIP_DEVANT"})
        ):
            continue
        if picked:
            details[group] = picked

    # A shaped collar (V, boat, mandarin…) and a depth class describe the same neckline and the engine lets the
    # depth class win: keep the shape the reader named (a V-neck must not become a generic « décolleté moyen »).
    # Off the shoulders is the exception: the edge is below the shoulders, so it is the whole neckline (a boat line
    # read with it described the same edge seen from the front).
    if details.get("decollete") == "HORS_EPAULES":
        if details.get("col") in _SHAPED_COLLARS:
            details.pop("col")
    elif details.get("col") in _SHAPED_COLLARS:
        details.pop("decollete", None)

    construction = _pick(raw.get("constructionMethod"), CONSTRUCTION_METHODS)
    fit = normalize_fit(raw.get("fit"), garment_type, details)
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
        "fit": fit,
        "drapeBlocks": cover_petticoat(
            normalize_drape_blocks(raw.get("drapeBlocks"), garment_type, construction), fit, garment_type
        ),
        "trims": normalize_trims(raw.get("trims"), garment_type),
        # Visible construction pieces (flounces, godets, peplum, jabot…): only present when the photo shows some.
        **({"construction": seen} if (seen := normalize_construction(raw.get("construction"), garment_type)) else {}),
    }
