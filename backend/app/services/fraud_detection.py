"""Fraud detection orchestration service."""

from __future__ import annotations

from typing import Any
from sqlalchemy.orm import Session

from app.ml.inference import predict_transaction
from app.models.transaction import Transaction


def analyze_transaction_input(txn_dict: dict[str, Any]) -> dict[str, Any]:
    """Execute real-time ML fraud prediction and heuristic observation."""
    return predict_transaction(txn_dict)


def analyze_and_store_transaction(db: Session, txn_dict: dict[str, Any]) -> Transaction:
    """Predict risk for incoming transaction and commit the record to the database."""
    pred_result = predict_transaction(txn_dict)

    # Determine initial review status based on risk score
    # High risk defaults to Pending review; Low risk can be auto-cleared as Reviewed
    if pred_result["risk_category"] == "HIGH":
        initial_status = "Pending"
    elif pred_result["risk_category"] == "MEDIUM":
        initial_status = "Pending"
    else:
        initial_status = "Reviewed"

    transaction = Transaction(
        transaction_amount=txn_dict["transaction_amount"],
        transaction_type=txn_dict["transaction_type"],
        merchant_category=txn_dict["merchant_category"],
        transaction_hour=txn_dict["transaction_hour"],
        recent_transaction_count=txn_dict["recent_transaction_count"],
        account_age_days=txn_dict["account_age_days"],
        location_distance=txn_dict["location_distance"],
        new_device=txn_dict.get("new_device", False),
        international_transaction=txn_dict.get("international_transaction", False),
        previous_transaction_amount=txn_dict.get("previous_transaction_amount", 0.0),
        fraud_probability=pred_result["fraud_probability"],
        risk_score=pred_result["risk_score"],
        risk_category=pred_result["risk_category"],
        prediction=pred_result["prediction"],
        review_status=initial_status,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction
