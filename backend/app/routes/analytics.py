"""Analytics and reporting API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.transaction import AnalyticsResponse
from app.services.transaction_service import get_analytics_metrics

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get(
    "",
    response_model=AnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated analytics metrics and distributions",
)
def get_analytics(
    days: int = Query(14, ge=1, le=90, description="Number of historical days to analyze"),
    db: Session = Depends(get_db),
):
    """Retrieve time-series volume, category and type breakdowns, and risk score distributions."""
    try:
        data = get_analytics_metrics(db=db, days=days)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics aggregation error: {str(e)}",
        )
