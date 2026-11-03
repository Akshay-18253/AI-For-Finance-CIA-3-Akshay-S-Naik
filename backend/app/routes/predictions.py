"""Prediction and Dashboard summary API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.transaction import (
    DashboardSummary,
    PredictionResult,
    TransactionInput,
    TransactionResponse,
)
from app.services.fraud_detection import analyze_transaction_input
from app.services.transaction_service import get_dashboard_summary_metrics

router = APIRouter(prefix="/api", tags=["Predictions & Dashboard"])


@router.post(
    "/predict",
    response_model=PredictionResult,
    status_code=status.HTTP_200_OK,
    summary="Predict transaction fraud risk",
)
def predict_fraud(txn_input: TransactionInput):
    """Run real-time machine-learning inference on transaction parameters.

    Returns calculated fraud probability, normalized risk score (0-100),
    risk classification (LOW, MEDIUM, HIGH), and supplementary rule observations.
    """
    try:
        data = txn_input.model_dump()
        result = analyze_transaction_input(data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummary,
    status_code=status.HTTP_200_OK,
    summary="Executive Dashboard KPIs and recent suspicious activities",
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Fetch live executive KPIs and recent suspicious transactions from the database."""
    try:
        metrics = get_dashboard_summary_metrics(db)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database aggregation error: {str(e)}",
        )
