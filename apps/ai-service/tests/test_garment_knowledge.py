import base64
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.garment_knowledge import (
    CUT_TYPES,
    DETAIL_OPTIONS,
    FEW_SHOT_EXAMPLES,
    GARMENT_TYPES,
    build_taxonomy_prompt,
    normalize_profile,
)
from app.main import app

client = TestClient(app)
PIXEL = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg").decode("ascii")
PROVIDER = {"provider": "ANTHROPIC", "model": "claude-haiku-4-5-20251001", "apiKey": "sk-ant-test-1234"}


def test_prompt_lists_every_vocabulary_value() -> None:
    prompt = build_taxonomy_prompt()
    for key in [*GARMENT_TYPES, *CUT_TYPES]:
        assert key in prompt
    for options in DETAIL_OPTIONS.values():
        for key in options:
            assert key in prompt
    assert "isGarment=false" in prompt


def test_few_shot_examples_are_valid_against_the_taxonomy() -> None:
    for example in FEW_SHOT_EXAMPLES:
        profile = example["profile"]
        # Blocks carry a per-block `certainty` in the model's answer; normalisation consumes it.
        blocks = [{k: v for k, v in b.items() if k != "certainty"} for b in profile.get("drapeBlocks") or []]
        assert normalize_profile(profile) == {
            "drapeBlocks": None,
            "trims": None,
            **profile,
            "details": profile["details"],
            **({"drapeBlocks": blocks} if blocks else {}),
        }


def test_normalize_rejects_non_garment_and_clears_everything() -> None:
    result = normalize_profile({"isGarment": False, "garmentType": "ROBE", "cutType": "SIRENE"})
    assert result["isGarment"] is False
    assert result["garmentType"] is None and result["cutType"] is None


def test_normalize_drops_unknown_values_and_irrelevant_details() -> None:
    result = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "jupe",
            "style": "PUNK",
            "cutType": "evasee",
            "details": {"longueur": "midi", "manches": "LONGUES", "col": "NOPE"},
        }
    )
    assert result["garmentType"] == "JUPE"
    assert result["style"] is None
    assert result["cutType"] == "EVASEE"
    assert result["details"] == {"longueur": "MIDI"}  # a skirt has no sleeves


def test_normalize_unknown_garment_type_is_not_usable() -> None:
    assert normalize_profile({"isGarment": True, "garmentType": "CHAPEAU"})["isGarment"] is False


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_returns_validated_profile(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"silhouette": "sirène"}, "profile": {"isGarment": true, '
                '"garmentType": "ROBE_MARIEE", "occasion": "MARIAGE", "style": "GLAMOUR", '
                '"cutType": "SIRENE", "details": {"manches": "SANS_MANCHES", "col": "BIZARRE"}}, '
                '"confidence": 0.9, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["garmentType"] == "ROBE_MARIEE"
    assert body["profile"]["details"] == {"manches": "SANS_MANCHES"}
    assert body["suggestedCutType"] == "SIRENE"


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_non_garment_photo_prefills_nothing(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"tissu": "riz"}, "profile": {"isGarment": false}, '
                '"suggestedCutType": "DROITE", "confidence": 0.95, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["isGarment"] is False
    assert body["features"] == {}
    assert body["suggestedCutType"] is None


def test_normalize_keeps_construction_only_when_valid_and_notes_only_for_drapes() -> None:
    draped = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "ROBE",
            "constructionMethod": "draping",
            "presentation": "mannequin",
            "constructionNotes": "  Cascade sur l'épaule.  ",
        }
    )
    assert draped["constructionMethod"] == "DRAPING"
    assert draped["presentation"] == "MANNEQUIN"
    assert draped["constructionNotes"] == "Cascade sur l'épaule."

    flat = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "JUPE",
            "constructionMethod": "FLAT_PATTERN",
            "constructionNotes": "ne doit pas rester",
        }
    )
    assert flat["constructionNotes"] is None

    bogus = normalize_profile({"isGarment": True, "garmentType": "JUPE", "constructionMethod": "MAGIE"})
    assert bogus["constructionMethod"] is None


def test_prompt_teaches_draping_vs_flat_pattern() -> None:
    prompt = build_taxonomy_prompt()
    for token in ("DRAPING", "FLAT_PATTERN", "MIXED", "MANNEQUIN", "WORN", "constructionNotes"):
        assert token in prompt


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_returns_construction_method(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {}, "profile": {"isGarment": true, "garmentType": "ROBE", '
                '"constructionMethod": "DRAPING", "presentation": "MANNEQUIN", '
                '"constructionNotes": "Drapé en cascade."}, "confidence": 0.8, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["constructionMethod"] == "DRAPING"
    assert body["profile"]["constructionNotes"] == "Drapé en cascade."


def test_normalize_profile_keeps_a_coat_dress_and_its_cord() -> None:
    profile = normalize_profile({
        "isGarment": True, "garmentType": "ROBE", "cutType": "PRINCESSE",
        "details": {"devant": "MANTEAU_OUVERT", "fermeture": "CORDELIERE", "col": "CHALE", "manches": "EVEQUE"},
        "fit": {"fabricColor": "#1A2448", "contrastColor": "#E6DCC2"},
    })
    assert profile["details"]["devant"] == "MANTEAU_OUVERT"
    assert profile["details"]["fermeture"] == "CORDELIERE"
    assert profile["details"]["col"] == "CHALE"
    assert profile["details"]["manches"] == "EVEQUE"
    assert profile["fit"]["contrastColor"] == "#e6dcc2"


def test_normalize_profile_drops_the_front_detail_on_a_skirt() -> None:
    profile = normalize_profile({"isGarment": True, "garmentType": "JUPE", "details": {"devant": "MANTEAU_OUVERT"}})
    assert "devant" not in profile["details"]


def test_prompt_tells_short_puffs_from_gigot_sleeves() -> None:
    prompt = build_taxonomy_prompt()
    assert "jamais BALLON" in prompt
    assert "MANTEAU_OUVERT" in prompt and "CORDELIERE" in prompt


def test_normalize_profile_keeps_revers_and_gored_skirt_but_no_skirt_on_trousers() -> None:
    profile = normalize_profile({
        "isGarment": True, "garmentType": "ROBE",
        "details": {"devant": "MANTEAU_REVERS", "jupe": "EN_LES", "col": "OFFICIER"},
    })
    assert profile["details"]["devant"] == "MANTEAU_REVERS"
    assert profile["details"]["jupe"] == "EN_LES"
    skirt = normalize_profile({"isGarment": True, "garmentType": "JUPE", "details": {"jupe": "EN_LES"}})
    assert skirt["details"]["jupe"] == "EN_LES"
    trousers = normalize_profile({"isGarment": True, "garmentType": "PANTALON", "details": {"jupe": "EN_LES"}})
    assert "jupe" not in trousers["details"]


def test_prompt_tells_revers_and_gores() -> None:
    prompt = build_taxonomy_prompt()
    assert "MANTEAU_REVERS" in prompt and "EN_LES" in prompt


def test_normalize_fit_keeps_finish_contrast_and_accent_prints() -> None:
    profile = normalize_profile({
        "isGarment": True, "garmentType": "ROBE",
        "fit": {"fabricColor": "#141B38", "fabricFinish": "VELOURS", "contrastPrint": "BROCART",
                "contrastMotifColor": "#C8A45A", "accentPrint": "ARABESQUE", "motifColor": "#D4AF5A",
                "fabricPrint": "PAILLETTES"},
    })
    fit = profile["fit"]
    assert fit["fabricFinish"] == "VELOURS"
    assert fit["contrastPrint"] == "BROCART" and fit["contrastMotifColor"] == "#c8a45a"
    assert fit["accentPrint"] == "ARABESQUE"
    assert "fabricPrint" not in fit


def test_normalize_fit_keeps_contrast_gores_only_when_true() -> None:
    fit = normalize_profile({"isGarment": True, "garmentType": "ROBE", "fit": {"contrastGores": True}})["fit"]
    assert fit["contrastGores"] is True
    other = normalize_profile({"isGarment": True, "garmentType": "ROBE", "fit": {"contrastGores": "yes", "fabricColor": "#112233"}})["fit"]
    assert "contrastGores" not in other


def test_prompt_tells_a_gilet_bodice_from_a_coat_dress() -> None:
    prompt = build_taxonomy_prompt()
    assert "devant GILET" in prompt
    assert "GILET" in DETAIL_OPTIONS["devant"]
    assert "contrastGores" in prompt


def test_normalize_fit_keeps_contrast_trims_only_when_true() -> None:
    fit = normalize_profile({"isGarment": True, "garmentType": "ROBE", "fit": {"contrastTrims": True}})["fit"]
    assert fit["contrastTrims"] is True
    other = normalize_profile({"isGarment": True, "garmentType": "ROBE", "fit": {"contrastTrims": 1, "fabricColor": "#112233"}})["fit"]
    assert "contrastTrims" not in other


def test_prompt_reads_princess_seams_tailored_sleeves_and_a_gilet_basque() -> None:
    prompt = build_taxonomy_prompt()
    assert "corsage PRINCESSE" in prompt and "manches TAILLEUR" in prompt and "PANS_CROISES" in prompt
    assert {"AUCUNE", "POINTES", "PANS_CROISES"} == set(DETAIL_OPTIONS["basque"])
    profile = normalize_profile({"isGarment": True, "garmentType": "ROBE", "details": {"basque": "PANS_CROISES", "manches": "TAILLEUR", "corsage": "PRINCESSE"}})
    assert profile["details"] == {"basque": "PANS_CROISES", "manches": "TAILLEUR", "corsage": "PRINCESSE"}
    skirt = normalize_profile({"isGarment": True, "garmentType": "JUPE", "details": {"basque": "POINTES"}})
    assert "basque" not in skirt.get("details", {})


def test_normalize_fit_keeps_a_motif_size_clamped_and_drops_nonsense() -> None:
    def fit(size: object) -> dict:
        return normalize_profile({"isGarment": True, "garmentType": "ROBE",
                                  "fit": {"fabricPrint": "FLEURI", "motifSizeCm": size}})["fit"]
    assert fit(15)["motifSizeCm"] == 15.0
    assert fit(250)["motifSizeCm"] == 60.0
    assert fit(0.1)["motifSizeCm"] == 0.5
    for bad in (0, -3, "15", True, float("nan")):
        assert "motifSizeCm" not in fit(bad)


def test_prompt_asks_for_the_motif_size() -> None:
    assert "motifSizeCm" in build_taxonomy_prompt()


def _mariee(
    blocks: list[dict], fullness: float | None = 3.0, garment_type: str = "ROBE_MARIEE"
) -> dict:
    fit = {"fullness": {"skirt": fullness}, "certainty": {"fullness.skirt": "HIGH"}} if fullness else None
    return normalize_profile(
        {"isGarment": True, "garmentType": garment_type, "details": {}, "fit": fit, "drapeBlocks": blocks}
    )


def _pleats(pleats: int, depth: int, kind: str = "KNIFE") -> dict:
    return {"kind": "PLEATED_SKIRT", "pleats": pleats, "depthMm": depth, "type": kind, "certainty": "HIGH"}


def test_wedding_skirt_block_is_widened_to_cover_its_petticoat() -> None:
    # First reading of Met 108161: 32 × 26 mm pleats ≈ 1,55 m on a ≈ 2,5 m petticoat.
    pleated = _mariee([_pleats(32, 26)])
    block = pleated["drapeBlocks"][0]
    assert block["pleats"] == 32 and block["depthMm"] >= 55
    assert 780 + block["pleats"] * block["depthMm"] >= 3.0 * 740 * 1.13 * 1.05
    # Deeper than 80 mm needed: more pleats instead.
    few = _mariee([_pleats(8, 20, "BOX")])["drapeBlocks"][0]
    assert few["depthMm"] == 80 and few["pleats"] * 80 * 2 >= 3.0 * 740 * 1.13 * 1.05 - 780
    gathered = _mariee([{"kind": "GATHERED_SKIRT", "fullness": 1.5, "certainty": "HIGH"}])
    gathered = gathered["drapeBlocks"][0]
    assert gathered["fullness"] == 3.5


def test_cover_petticoat_keeps_wide_enough_blocks_and_other_garments() -> None:
    wide = _pleats(40, 80)
    assert _mariee([wide])["drapeBlocks"][0]["depthMm"] == 80
    narrow = _pleats(32, 26)
    # No fullness read: no petticoat target. Only the wedding dress has a petticoat.
    assert _mariee([narrow], fullness=None)["drapeBlocks"][0]["depthMm"] == 26
    assert _mariee([narrow], garment_type="ROBE")["drapeBlocks"][0]["depthMm"] == 26
    circle = _mariee([{"kind": "CIRCLE_SKIRT", "fraction": 0.25, "certainty": "HIGH"}])
    circle = circle["drapeBlocks"][0]
    assert circle == {"kind": "CIRCLE_SKIRT", "fraction": 0.25}


def test_prompt_states_the_petticoat_coverage_rule() -> None:
    assert "recouvrir son jupon" in build_taxonomy_prompt()


def test_off_shoulder_neckline_is_kept_and_wins_over_a_boat_line() -> None:
    assert "HORS_EPAULES" in DETAIL_OPTIONS["decollete"]
    profile = normalize_profile(
        {"isGarment": True, "garmentType": "ROBE_MARIEE", "details": {"decollete": "hors_epaules", "col": "BATEAU"}}
    )
    assert profile["details"] == {"decollete": "HORS_EPAULES"}
    # Any other décolleté still gives way to a shaped collar line.
    other = normalize_profile({"isGarment": True, "garmentType": "ROBE", "details": {"decollete": "MOYEN", "col": "BATEAU"}})
    assert other["details"] == {"col": "BATEAU"}


def test_prompt_tells_off_shoulder_from_boat_neck() -> None:
    prompt = build_taxonomy_prompt()
    assert "HORS_EPAULES, pas col BATEAU" in prompt


def _trims(items: list, garment_type: str = "ROBE_MARIEE") -> list | None:
    return normalize_profile({"isGarment": True, "garmentType": garment_type, "details": {}, "trims": items})["trims"]


def test_trims_keep_certain_in_range_garnitures() -> None:
    berthe = {"kind": "BERTHE", "depthMm": 112, "pointMm": 140, "material": "dentelle", "color": "#ECDCB6", "certainty": "HIGH"}
    frill = {"kind": "SLEEVE_FRILL", "tiers": 2, "depthMm": 50, "material": "DENTELLE", "certainty": "MEDIUM"}
    pearls = {"kind": "BEADING", "place": "ENCOLURE", "beadMm": 6, "rows": 1, "color": "#f2e6c9", "certainty": "HIGH"}
    assert _trims([berthe, frill, pearls]) == [
        {"kind": "BERTHE", "depthMm": 110.0, "pointMm": 140.0, "material": "DENTELLE", "color": "#ecdcb6"},
        {"kind": "SLEEVE_FRILL", "tiers": 2.0, "depthMm": 50.0, "material": "DENTELLE"},
        {"kind": "BEADING", "place": "ENCOLURE", "beadMm": 6.0, "rows": 1.0, "color": "#f2e6c9"},
    ]
    # Mild overshoot is clamped; a berthe without point is a straight band.
    assert _trims([{**berthe, "depthMm": 230, "pointMm": None}]) is None
    assert _trims([{**berthe, "depthMm": 230}])[0]["depthMm"] == 200.0
    straight = {k: v for k, v in berthe.items() if k != "pointMm"}
    assert _trims([straight])[0]["pointMm"] == 0.0


def test_trims_reject_doubtful_aberrant_duplicate_and_misplaced() -> None:
    pearls = {"kind": "BEADING", "place": "ENCOLURE", "beadMm": 6, "rows": 1, "certainty": "HIGH"}
    assert _trims([{**pearls, "certainty": "LOW"}]) is None
    assert _trims([{**pearls, "beadMm": 99}]) is None
    assert _trims([{**pearls, "place": "DOS"}]) is None
    assert _trims([{"kind": "SLEEVE_FRILL", "tiers": 2, "depthMm": 50, "material": "CUIR", "certainty": "HIGH"}]) is None
    assert _trims([{"kind": "PLUMES", "certainty": "HIGH"}, "x"]) is None
    assert len(_trims([pearls, {**pearls, "beadMm": 8}, {**pearls, "place": "TAILLE"}])) == 2
    assert _trims([pearls], garment_type="PANTALON") is None
    assert _trims("berthe") is None


def test_prompt_has_the_trims_guide_and_the_ball_gown_options() -> None:
    prompt = build_taxonomy_prompt()
    assert "Garnitures (`trims`" in prompt
    assert "POINTE" in prompt and "BALEINE" in prompt
