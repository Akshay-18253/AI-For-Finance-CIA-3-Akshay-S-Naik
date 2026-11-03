"""Risk scoring and classification utility service."""

from __future__ import annotations

from app.config import settings


def classify_risk_score(score: int) -> str:
    """Classify a 0-100 risk score into LOW, MEDIUM, or HIGH risk category."""
    if score <= settings.risk_low_max:
        return "LOW"
    elif score <= settings.risk_medium_max:
        return "MEDIUM"
    else:
        return "HIGH"


def get_risk_thresholds() -> dict[str, int]:
    """Return currently active configurable risk thresholds."""
    return {
        "low_max": settings.risk_low_max,
        "medium_max": settings.risk_medium_max,
        "high_min": settings.risk_medium_max + 1,
    }
