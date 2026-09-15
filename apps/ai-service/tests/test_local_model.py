from app import local_model


def test_local_model_available_when_artifacts_present() -> None:
    # ml/models/*.joblib are produced by ml/scripts/train_measurement_model.py
    # and are gitignored — this test documents the expected dev-environment
    # state rather than asserting a hard requirement of every CI run.
    if not local_model.is_local_model_available():
        return
    assert local_model.is_local_model_available("FEMME") or local_model.is_local_model_available(
        "HOMME"
    )


def test_estimate_with_local_model_returns_only_requested_keys() -> None:
    if not local_model.is_local_model_available("FEMME"):
        return

    estimated, confidence = local_model.estimate_with_local_model(
        {"TOUR_POITRINE": 88, "TOUR_TAILLE": 70}, "FEMME", ["TOUR_BASSIN", "TOUR_COU"]
    )

    assert set(estimated.keys()) == {"TOUR_BASSIN", "TOUR_COU"}
    assert all(isinstance(v, float) for v in estimated.values())
    # Plausible cm range for an adult — sanity bound, not a precision claim.
    assert all(20 < v < 200 for v in estimated.values())
    assert 0 < confidence <= 0.6


def test_estimate_with_local_model_never_reestimates_a_known_key() -> None:
    if not local_model.is_local_model_available("FEMME"):
        return

    estimated, _ = local_model.estimate_with_local_model(
        {"TOUR_POITRINE": 88}, "FEMME", ["TOUR_POITRINE", "TOUR_TAILLE"]
    )

    assert "TOUR_POITRINE" not in estimated
    assert "TOUR_TAILLE" in estimated


def test_estimate_with_local_model_raises_for_unavailable_gender_artifact() -> None:
    import pytest

    original = dict(local_model._artifacts)
    try:
        local_model._artifacts.clear()
        local_model._load_attempted = True
        with pytest.raises(RuntimeError):
            local_model.estimate_with_local_model({}, "FEMME", ["TOUR_BASSIN"])
    finally:
        local_model._artifacts.clear()
        local_model._artifacts.update(original)
