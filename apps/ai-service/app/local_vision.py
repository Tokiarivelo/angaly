"""Local photo analysis (no external API): a CLIP image encoder (ONNX, run on CPU) turns the photo into an embedding,
small classifiers trained on Angaly's own readings (`ml/scripts/train_vision_model.py`) turn it into a GarmentProfile.

Artefacts (gitignored, under `ml/models/`):
  - `clip/vision_model_quantized.onnx` — CLIP ViT-B/32 image encoder (OpenAI, MIT licence; Xenova ONNX export);
  - `vision_profile.joblib` — {fields: {name: classifier}, regressors: {...}, labels: {...}, metrics: {...}}.

When either is missing the model is unavailable and the caller falls back to its usual (empty) analysis. The model
only names options of the closed vocabulary (`garment_knowledge.normalize_profile` validates them again); it never
produces geometry (CLAUDE.md rule 18).
"""
from __future__ import annotations

import io
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from .feature_flags import local_models_enabled

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path(os.environ.get("ANGALY_ML_MODELS", ROOT / "ml" / "models"))
ENCODER = MODELS / "clip" / "vision_model_quantized.onnx"
PROFILE_MODEL = MODELS / "vision_profile.joblib"
MODEL_VERSION_PREFIX = "local-vision"

# CLIP preprocessing (preprocessor_config.json of the export): shortest side 224 (bicubic), centre crop, normalise.
_SIZE = 224
_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def _pixels(image_bytes: bytes) -> np.ndarray:
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    scale = _SIZE / min(w, h)
    img = img.resize((max(_SIZE, round(w * scale)), max(_SIZE, round(h * scale))), Image.Resampling.BICUBIC)
    w, h = img.size
    left, top = (w - _SIZE) // 2, (h - _SIZE) // 2
    img = img.crop((left, top, left + _SIZE, top + _SIZE))
    arr = (np.asarray(img, dtype=np.float32) / 255.0 - _MEAN) / _STD
    return arr.transpose(2, 0, 1)[None, ...]


def _pixels_full(image_bytes: bytes) -> np.ndarray:
    """The whole photo letterboxed in the square (a full-length garment is not cut off by the centre crop)."""
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    scale = _SIZE / max(w, h)
    img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.BICUBIC)
    canvas = Image.new("RGB", (_SIZE, _SIZE), (255, 255, 255))
    canvas.paste(img, ((_SIZE - img.width) // 2, (_SIZE - img.height) // 2))
    arr = (np.asarray(canvas, dtype=np.float32) / 255.0 - _MEAN) / _STD
    return arr.transpose(2, 0, 1)[None, ...]


@lru_cache(maxsize=1)
def _session() -> Any:
    import onnxruntime as ort

    return ort.InferenceSession(str(ENCODER), providers=["CPUExecutionProvider"])


def encoder_available() -> bool:
    try:
        import onnxruntime  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        return False
    return ENCODER.exists()


def embed(image_bytes: bytes) -> np.ndarray:
    """L2-normalised embedding (1024 values: the centre crop's and the whole letterboxed photo's, 512 each)."""
    session = _session()
    parts = []
    for pixels in (_pixels(image_bytes), _pixels_full(image_bytes)):
        out = session.run(None, {"pixel_values": pixels})[0][0].astype(np.float32)
        parts.append(out / (np.linalg.norm(out) + 1e-8))
    return np.concatenate(parts)


@lru_cache(maxsize=1)
def _profile_model() -> dict[str, Any] | None:
    if not PROFILE_MODEL.exists():
        return None
    import joblib

    return joblib.load(PROFILE_MODEL)


def available() -> bool:
    return local_models_enabled() and encoder_available() and PROFILE_MODEL.exists()


def model_version() -> str | None:
    model = _profile_model()
    return f"{MODEL_VERSION_PREFIX}-{model.get('version', '0')}" if model else None


def predict_profile(image_bytes: bytes) -> tuple[dict[str, Any], float] | None:
    """Raw profile (to be validated by `normalize_profile`) and a confidence in [0, 1], or None when unavailable.

    Each field is kept only when its classifier is sure enough (`min_proba` stored with the model, chosen on held-out
    data); the confidence is the garment-type probability.
    """
    if not available():
        return None
    model = _profile_model()
    assert model is not None
    x = embed(image_bytes)[None, :]
    min_proba: dict[str, float] = model.get("min_proba", {})

    def pick(name: str) -> tuple[str | None, float]:
        clf = model["fields"].get(name)
        if clf is None:
            return None, 0.0
        proba = clf.predict_proba(x)[0]
        k = int(np.argmax(proba))
        label = str(clf.classes_[k])
        p = float(proba[k])
        return (label if p >= min_proba.get(name, 0.5) and label != "__NONE__" else None), p

    garment, confidence = pick("garmentType")
    if garment is None or garment == "NON_VETEMENT":
        return {"isGarment": False}, confidence
    profile: dict[str, Any] = {"isGarment": True, "garmentType": garment, "details": {}, "fit": {}}
    for name in ("occasion", "style", "cutType", "presentation", "constructionMethod"):
        value, _ = pick(name)
        if value:
            profile[name] = value
    for name, clf in model["fields"].items():
        if not name.startswith("details."):
            continue
        value, _ = pick(name)
        if value:
            profile["details"][name.split(".", 1)[1]] = value
    fit: dict[str, Any] = {}
    certainty: dict[str, str] = {}
    for name, reg in model.get("regressors", {}).items():
        group, key = name.split(".", 1)
        value = float(reg.predict(x)[0])
        fit.setdefault(group, {})[key] = round(value, 2)
        certainty[name] = "MEDIUM"
    ease, _ = pick("fit.ease")
    if ease:
        fit["ease"] = ease
        certainty["ease"] = "MEDIUM"
    behavior, _ = pick("fit.fabricBehavior")
    if behavior:
        fit["fabricBehavior"] = behavior
    # The fabric colour: the median colour of the photo's centre (where the garment usually is).
    fit["fabricColor"] = _centre_colour(image_bytes)
    fit["certainty"] = certainty
    profile["fit"] = fit
    return profile, confidence


def _centre_colour(image_bytes: bytes) -> str:
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    crop = np.asarray(img.crop((int(w * 0.35), int(h * 0.35), int(w * 0.65), int(h * 0.7))), dtype=np.float32).reshape(-1, 3)
    r, g, b = (int(v) for v in np.median(crop, axis=0))
    return f"#{r:02x}{g:02x}{b:02x}"
