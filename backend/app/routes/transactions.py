"""Transaction management API routes."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.inference import derive_suspicious_indicators
from app.schemas.transaction import (
    TransactionInput,
    TransactionListResponse,
    TransactionResponse,
)
from app.services.fraud_detection import analyze_and_store_transaction
from app.services.transaction_service import (
    get_transaction_by_id,
    get_transactions_paginated,
)

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create, analyze, and persist a new transaction",
)
def create_transaction(txn_input: TransactionInput, db: Session = Depends(get_db)):
    """Analyze incoming transaction with ML model, calculate risk, and persist to database."""
    try:
        data = txn_input.model_dump()
        record = analyze_and_store_transaction(db, data)
        return record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction processing error: {str(e)}",
        )


@router.get(
    "",
    response_model=TransactionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List transactions with filters and pagination",
)
def list_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search transaction ID or merchant"),
    risk_category: Optional[str] = Query(None, description="Filter by risk: LOW, MEDIUM, HIGH, ALL"),
    transaction_type: Optional[str] = Query(None, description="Filter by type: Payment, Transfer, etc."),
    merchant_category: Optional[str] = Query(None, description="Filter by merchant category"),
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
):
    """Retrieve filtered, sorted, and paginated transaction records."""
    try:
        results = get_transactions_paginated(
            db=db,
            page=page if isinstance(page, int) else 1,
            page_size=page_size if isinstance(page_size, int) else 15,
            search=search if isinstance(search, str) else None,
            risk_category=risk_category if isinstance(risk_category, str) else None,
            transaction_type=transaction_type if isinstance(transaction_type, str) else None,
            merchant_category=merchant_category if isinstance(merchant_category, str) else None,
            review_status=review_status if isinstance(review_status, str) else None,
            sort_by=sort_by if isinstance(sort_by, str) else "created_at",
            sort_order=sort_order if isinstance(sort_order, str) else "desc",
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query error: {str(e)}",
        )


@router.get(
    "/{transaction_id}",
    summary="Get single transaction detail by transaction ID",
)
def get_transaction_detail(transaction_id: str, db: Session = Depends(get_db)):
    """Retrieve full details for a specific transaction including diagnostic observations."""
    txn = get_transaction_by_id(db, transaction_id)
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found",
        )

    # Convert ORM to dictionary and attach diagnostic indicators
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

    # Derive human-readable rule observations
    indicators = derive_suspicious_indicators(txn_dict, anomaly_score=0.0)
    txn_dict["suspicious_indicators"] = indicators

    return txn_dict
