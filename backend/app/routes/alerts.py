"""Fraud alerts management API endpoints."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.inference import derive_suspicious_indicators
from app.schemas.transaction import ReviewStatusUpdate, TransactionResponse
from app.services.transaction_service import (
    get_fraud_alerts,
    update_transaction_review_status,
)

router = APIRouter(prefix="/api/alerts", tags=["Fraud Alerts"])


@router.get(
    "",
    summary="List fraud alerts with severity indicators and review status",
)
def list_alerts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    severity: Optional[str] = Query(None, description="Severity filter: HIGH, MEDIUM, ALL"),
    review_status: Optional[str] = Query(None, description="Review status: Pending, Under Review, etc."),
    db: Session = Depends(get_db),
):
    """Retrieve suspicious transactions flagged for human investigator review."""
    try:
        data = get_fraud_alerts(
            db=db,
            page=page if isinstance(page, int) else 1,
            page_size=page_size if isinstance(page_size, int) else 15,
            severity=severity if isinstance(severity, str) else None,
            review_status=review_status if isinstance(review_status, str) else None,
        )

        # Enhance each alert with diagnostic indicators
        enhanced_alerts = []
        for txn in data["alerts"]:
            txn_dict = {
                "id": txn.id,
                "transaction_id": txn.transaction_id,
                "transaction_amount": txn.transaction_amount,
                "transaction_type": txn.transaction_type,
                "merchant_category": txn.merchant_category,
                "transaction_hour": txn.transaction_hour,
                "recent_transaction_count": txn.recent_transaction_count,
                "account_age_days": txn.account_age_days,
                "location_distance": txn.location_distance,
                "new_device": txn.new_device,
                "international_transaction": txn.international_transaction,
                "previous_transaction_amount": txn.previous_transaction_amount,
                "fraud_probability": txn.fraud_probability,
                "risk_score": txn.risk_score,
                "risk_category": txn.risk_category,
                "prediction": txn.prediction,
                "review_status": txn.review_status,
                "created_at": txn.created_at,
            }
            txn_dict["suspicious_indicators"] = derive_suspicious_indicators(txn_dict, 0.0)
            enhanced_alerts.append(txn_dict)

        return {
            "alerts": enhanced_alerts,
            "total": data["total"],
            "page": data["page"],
            "page_size": data["page_size"],
            "total_pages": data["total_pages"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert query error: {str(e)}",
        )


@router.patch(
    "/{transaction_id}/status",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update transaction review status",
)
def update_alert_status(
    transaction_id: str,
    status_update: ReviewStatusUpdate,
    db: Session = Depends(get_db),
):
    """Update review status for human workflow: Under Review, Reviewed, Confirmed Fraud, False Positive."""
    updated = update_transaction_review_status(
        db=db,
        transaction_id=transaction_id,
        new_status=status_update.review_status.value,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found",
        )
    return updated
