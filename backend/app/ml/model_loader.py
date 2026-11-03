"""Model loader and artifact cache manager."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

import joblib

from app.config import settings

_model_bundle: Optional[dict[str, Any]] = None


def load_model(force_reload: bool = False) -> dict[str, Any]:
    """Load and cache the trained ML model bundle from disk."""
    global _model_bundle

    if _model_bundle is not None and not force_reload:
        return _model_bundle

    model_path = Path(settings.model_path)
    if not model_path.is_absolute():
        from app.config import BASE_DIR
        model_path = BASE_DIR / model_path

    if not model_path.exists():
        raise FileNotFoundError(
            f"Trained model artifact not found at {model_path}. "
            "Run 'python -m app.ml.training' to train the model first."
        )

    bundle = joblib.load(model_path)
    _model_bundle = bundle
    return _model_bundle


def get_model_bundle() -> dict[str, Any]:
    """Retrieve the loaded model bundle, loading if necessary."""
    return load_model(force_reload=False)


def get_model_metrics() -> dict[str, Any]:
    """Retrieve the persisted evaluation metrics from the model bundle."""
    bundle = get_model_bundle()
    return bundle.get("metrics", {})
