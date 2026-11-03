"""Transaction database operations, querying, filtering, and analytics aggregation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import and_, desc, asc, func, or_, case
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def get_transactions_paginated(
    db: Session,
    page: int = 1,
    page_size: int = 15,
    search: Optional[str] = None,
    risk_category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    merchant_category: Optional[str] = None,
    review_status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Retrieve paginated transactions matching filter criteria."""
    query = db.query(Transaction)

    # 1. Search filter (transaction_id or merchant)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.transaction_id.ilike(search_pattern),
                Transaction.merchant_category.ilike(search_pattern),
            )
        )

    # 2. Categorical filters
    if risk_category and risk_category.upper() != "ALL":
        query = query.filter(Transaction.risk_category == risk_category.upper())

    if transaction_type and transaction_type.upper() != "ALL":
        query = query.filter(Transaction.transaction_type == transaction_type)

    if merchant_category and merchant_category.upper() != "ALL":
        query = query.filter(Transaction.merchant_category == merchant_category)

    if review_status and review_status.upper() != "ALL":
        query = query.filter(Transaction.review_status == review_status)

    # 3. Date range filters
    if date_from:
        query = query.filter(Transaction.created_at >= date_from)
    if date_to:
        query = query.filter(Transaction.created_at <= date_to)

    # 4. Count total matching
    total = query.count()

    # 5. Sorting
    sort_col = getattr(Transaction, sort_by, Transaction.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # 6. Pagination offset/limit
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return {
        "transactions": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_transaction_by_id(db: Session, transaction_id: str) -> Optional[Transaction]:
    """Retrieve a single transaction record by its public TXN identifier."""
    return db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()


def update_transaction_review_status(
    db: Session, transaction_id: str, new_status: str
) -> Optional[Transaction]:
    """Update review status (e.g. Under Review, Reviewed, Confirmed Fraud, False Positive)."""
    txn = get_transaction_by_id(db, transaction_id)
    if not txn:
        return None
    txn.review_status = new_status
    db.commit()
    db.refresh(txn)
    return txn


def get_fraud_alerts(
    db: Session,
    page: int = 1,
    page_size: int = 15,
    severity: Optional[str] = None,
    review_status: Optional[str] = None,
) -> dict[str, Any]:
    """Query suspicious transactions (Medium and High risk) for the fraud alert center."""
    query = db.query(Transaction).filter(
        Transaction.risk_category.in_(["HIGH", "MEDIUM"])
    )

    if severity and severity.upper() != "ALL":
        query = query.filter(Transaction.risk_category == severity.upper())

    if review_status and review_status.upper() != "ALL":
        query = query.filter(Transaction.review_status == review_status)

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    # Order by highest risk score first, then newest
    alerts = (
        query.order_by(desc(Transaction.risk_score), desc(Transaction.created_at))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "alerts": alerts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_dashboard_summary_metrics(db: Session) -> dict[str, Any]:
    """Calculate executive KPI cards and recent suspicious activities."""
    total_txns = db.query(func.count(Transaction.id)).scalar() or 0
    flagged_txns = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category.in_(["HIGH", "MEDIUM"]))
        .scalar()
        or 0
    )
    high_risk_txns = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category == "HIGH")
        .scalar()
        or 0
    )

    rate = round((flagged_txns / total_txns * 100.0), 2) if total_txns > 0 else 0.0

    # Recent suspicious activity: top 6 high or medium risk transactions
    recent_suspicious = (
        db.query(Transaction)
        .filter(Transaction.risk_category.in_(["HIGH", "MEDIUM"]))
        .order_by(desc(Transaction.created_at))
        .limit(6)
        .all()
    )

    return {
        "total_transactions": total_txns,
        "flagged_transactions": flagged_txns,
        "fraud_detection_rate": rate,
        "high_risk_transactions": high_risk_txns,
        "recent_suspicious": recent_suspicious,
    }


def get_analytics_metrics(db: Session, days: int = 14) -> dict[str, Any]:
    """Aggregate trend metrics and distributions for analytics charts."""
    total_txns = db.query(func.count(Transaction.id)).scalar() or 0
    total_flagged = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category.in_(["HIGH", "MEDIUM"]))
        .scalar()
        or 0
    )
    avg_amt = db.query(func.avg(Transaction.transaction_amount)).scalar() or 0.0

    # 1. Risk distribution
    low_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category == "LOW")
        .scalar()
        or 0
    )
    med_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category == "MEDIUM")
        .scalar()
        or 0
    )
    high_count = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.risk_category == "HIGH")
        .scalar()
        or 0
    )

    risk_dist = {
        "Low": low_count,
        "Medium": med_count,
        "High": high_count,
    }

    # 2. Fraud breakdown by transaction type
    type_rows = (
        db.query(
            Transaction.transaction_type,
            func.count(Transaction.id).label("total"),
            func.sum(
                case((Transaction.risk_category.in_(["HIGH", "MEDIUM"]), 1), else_=0)
            ).label("flagged"),
        )
        .group_by(Transaction.transaction_type)
        .all()
    )
    fraud_by_type = [
        {"type": r[0], "total": int(r[1]), "flagged": int(r[2] or 0)}
        for r in type_rows
    ]

    # 3. Fraud breakdown by merchant category
    cat_rows = (
        db.query(
            Transaction.merchant_category,
            func.count(Transaction.id).label("total"),
            func.sum(
                case((Transaction.risk_category.in_(["HIGH", "MEDIUM"]), 1), else_=0)
            ).label("flagged"),
        )
        .group_by(Transaction.merchant_category)
        .all()
    )
    fraud_by_category = [
        {"category": r[0], "total": int(r[1]), "flagged": int(r[2] or 0)}
        for r in cat_rows
    ]

    # 4. Daily transaction volume over time (past N days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    daily_rows = (
        db.query(
            func.date(Transaction.created_at).label("day"),
            func.count(Transaction.id).label("total"),
            func.sum(
                case((Transaction.risk_category == "LOW", 1), else_=0)
            ).label("legitimate"),
            func.sum(
                case((Transaction.risk_category.in_(["HIGH", "MEDIUM"]), 1), else_=0)
            ).label("flagged"),
        )
        .filter(Transaction.created_at >= cutoff)
        .group_by(func.date(Transaction.created_at))
        .order_by(asc("day"))
        .all()
    )

    volume_over_time = [
        {
            "date": str(r[0]),
            "total": int(r[1]),
            "legitimate": int(r[2] or 0),
            "flagged": int(r[3] or 0),
        }
        for r in daily_rows
    ]

    return {
        "volume_over_time": volume_over_time,
        "fraud_by_type": fraud_by_type,
        "fraud_by_category": fraud_by_category,
        "risk_distribution": risk_dist,
        "avg_transaction_amount": round(float(avg_amt), 2),
        "total_transactions": total_txns,
        "total_flagged": total_flagged,
    }
