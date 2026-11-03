"""Real-time transaction inference pipeline for fraud risk assessment.

Loads trained scikit-learn model, applies identical training feature transformations,
generates probabilistic fraud score (0-100), and flags supplementary heuristic indicators
clearly distinguished from model inference.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings
from app.ml.model_loader import get_model_bundle
from app.ml.preprocessing import engineer_features


def derive_suspicious_indicators(txn: dict[str, Any], anomaly_score: float) -> list[str]:
    """Identify transparent domain indicators to assist human analyst review.

    NOTE: Per master specification, these are transparent rule-based observations
    for human investigators, kept distinct from the statistical ML probability.
    """
    indicators: list[str] = []

    amt = float(txn.get("transaction_amount", 0.0))
    prev_amt = float(txn.get("previous_transaction_amount", 0.0))
    dist = float(txn.get("location_distance", 0.0))
    hour = int(txn.get("transaction_hour", 12))
    velocity = int(txn.get("recent_transaction_count", 0))
    account_age = int(txn.get("account_age_days", 365))
    new_device = bool(txn.get("new_device", False))
    intl = bool(txn.get("international_transaction", False))
    txn_type = str(txn.get("transaction_type", ""))
    merchant_cat = str(txn.get("merchant_category", ""))

    # 1. Amount spike check
    if prev_amt > 0 and (amt / (prev_amt + 1.0)) >= 6.0 and amt > 250:
        indicators.append(
            f"Unusual amount spike: ${amt:,.2f} is {amt / prev_amt:.1f}x higher than recent average (${prev_amt:,.2f})"
        )
    elif amt > 3000:
        indicators.append(f"High single transaction amount: ${amt:,.2f}")

    # 2. Location anomaly
    if dist >= 100.0:
        indicators.append(
            f"Geographic anomaly: Transaction located {dist:,.1f} km from primary user baseline"
        )

    # 3. Device security
    if new_device and (amt > 300 or dist > 50):
        indicators.append("Unrecognized device detected during elevated value/distance event")

    # 4. International activity
    if intl:
        indicators.append(
            f"Cross-border / international transaction via channel '{txn_type}'"
        )

    # 5. Nocturnal timing
    if hour in [1, 2, 3, 4]:
        indicators.append(
            f"Off-peak nocturnal transaction time ({hour:02d}:00 hrs)"
        )

    # 6. Velocity spike
    if velocity >= 6:
        indicators.append(
            f"High transaction frequency: {velocity} events recorded in past 24 hours"
        )

    # 7. High-risk merchant on fresh account
    if account_age < 30 and merchant_cat in ["Electronics", "Travel", "Online Services"] and amt > 400:
        indicators.append(
            f"New account ({account_age} days old) transacting high value in volatile category '{merchant_cat}'"
        )

    # 8. Unsupervised isolation forest anomaly signal
    if anomaly_score < -0.05:
        indicators.append(
            "Unsupervised Anomaly: Statistical outlier deviation detected across multi-dimensional feature space"
        )

    return indicators


def predict_transaction(txn_data: dict[str, Any]) -> dict[str, Any]:
    """Execute end-to-end ML inference on a single transaction.

    Returns:
        dict containing transaction_id, fraud_probability, risk_score (0-100),
        risk_category (LOW, MEDIUM, HIGH), binary prediction, model metadata,
        and human review indicators.
    """
    bundle = get_model_bundle()
    rf_model = bundle["model"]
    iso_forest = bundle["isolation_forest"]
    preprocessor = bundle["preprocessor"]
    model_version = bundle.get("model_version", "1.0.0")

    # Format input into single-row DataFrame
    raw_df = pd.DataFrame([txn_data])

    # Apply deterministic feature engineering
    engineered_df = engineer_features(raw_df)

    # Transform through fitted preprocessor
    X_trans = preprocessor.transform(engineered_df)

    # Supervised classification inference
    prob_array = rf_model.predict_proba(X_trans)
    fraud_prob = float(prob_array[0, 1])

    # Unsupervised anomaly score
    anomaly_score = float(iso_forest.decision_function(X_trans)[0])

    # Normalized risk score: 0 - 100
    risk_score = int(round(np.clip(fraud_prob * 100.0, 0.0, 100.0)))

    # Risk categorization based on configurable settings
    if risk_score <= settings.risk_low_max:
        risk_category = "LOW"
    elif risk_score <= settings.risk_medium_max:
        risk_category = "MEDIUM"
    else:
        risk_category = "HIGH"

    # Binary prediction threshold (0.50)
    prediction = 1 if risk_score >= 50 else 0

    # Rule-based diagnostic observations for analysts
    indicators = derive_suspicious_indicators(txn_data, anomaly_score)

    txn_id = txn_data.get("transaction_id") or f"TXN-{uuid.uuid4().hex[:12].upper()}"

    return {
        "transaction_id": txn_id,
        "fraud_probability": round(fraud_prob, 4),
        "risk_score": risk_score,
        "risk_category": risk_category,
        "prediction": prediction,
        "model_version": model_version,
        "timestamp": datetime.now(timezone.utc),
        "suspicious_indicators": indicators,
        "anomaly_score": round(anomaly_score, 4),
    }
