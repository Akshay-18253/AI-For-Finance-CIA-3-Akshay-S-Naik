"""Direct endpoint verification test suite (safe on Python 3.14 Windows)."""

from __future__ import annotations

import pytest
from app.database import SessionLocal
from app.routes.alerts import list_alerts, update_alert_status
from app.routes.analytics import get_analytics
from app.routes.model_metrics import get_metrics, get_model_info
from app.routes.predictions import get_dashboard_summary, predict_fraud
from app.routes.transactions import (
    create_transaction,
    get_transaction_detail,
    list_transactions,
)
from app.schemas.transaction import ReviewStatus, ReviewStatusUpdate, TransactionInput


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_predict_fraud_low_risk():
    inp = TransactionInput(
        transaction_amount=25.00,
        transaction_type="Payment",
        merchant_category="Grocery",
        transaction_hour=14,
        recent_transaction_count=1,
        account_age_days=600,
        location_distance=2.1,
        new_device=False,
        international_transaction=False,
        previous_transaction_amount=30.0,
    )
    res = predict_fraud(inp)
    assert res["risk_category"] == "LOW"
    assert res["risk_score"] < 30
    assert res["prediction"] == 0


def test_predict_fraud_high_risk():
    inp = TransactionInput(
        transaction_amount=4800.00,
        transaction_type="Transfer",
        merchant_category="Retail",
        transaction_hour=3,
        recent_transaction_count=10,
        account_age_days=10,
        location_distance=800.0,
        new_device=True,
        international_transaction=True,
        previous_transaction_amount=20.0,
    )
    res = predict_fraud(inp)
    assert res["risk_category"] == "HIGH"
    assert res["risk_score"] >= 70
    assert res["prediction"] == 1
    assert len(res["suspicious_indicators"]) > 0


def test_dashboard_summary(db):
    res = get_dashboard_summary(db)
    assert res["total_transactions"] >= 180
    assert res["flagged_transactions"] >= 20
    assert res["high_risk_transactions"] >= 5
    assert len(res["recent_suspicious"]) > 0


def test_create_and_fetch_transaction(db):
    inp = TransactionInput(
        transaction_amount=189.99,
        transaction_type="Payment",
        merchant_category="Electronics",
        transaction_hour=16,
        recent_transaction_count=2,
        account_age_days=140,
        location_distance=12.0,
        new_device=False,
        international_transaction=False,
        previous_transaction_amount=150.0,
    )
    created = create_transaction(inp, db)
    assert created.transaction_id.startswith("TXN-")
    assert created.transaction_amount == 189.99

    # Detail
    detail = get_transaction_detail(created.transaction_id, db)
    assert detail["transaction_id"] == created.transaction_id
    assert "suspicious_indicators" in detail


def test_list_transactions(db):
    res = list_transactions(page=1, page_size=10, risk_category="HIGH", db=db)
    assert "transactions" in res
    assert res["total"] >= 5
    assert len(res["transactions"]) <= 10
    for txn in res["transactions"]:
        assert txn.risk_category == "HIGH"


def test_alerts_and_status_update(db):
    # List alerts
    alerts_data = list_alerts(page=1, page_size=5, db=db)
    assert len(alerts_data["alerts"]) > 0
    target_id = alerts_data["alerts"][0]["transaction_id"]

    # Update to Under Review
    upd = update_alert_status(
        target_id,
        ReviewStatusUpdate(review_status=ReviewStatus.UNDER_REVIEW),
        db=db,
    )
    assert upd.review_status == "Under Review"

    # Update to Confirmed Fraud
    upd2 = update_alert_status(
        target_id,
        ReviewStatusUpdate(review_status=ReviewStatus.CONFIRMED_FRAUD),
        db=db,
    )
    assert upd2.review_status == "Confirmed Fraud"


def test_analytics(db):
    data = get_analytics(days=14, db=db)
    assert "volume_over_time" in data
    assert "fraud_by_type" in data
    assert "fraud_by_category" in data
    assert "risk_distribution" in data
    assert data["total_transactions"] >= 180


def test_model_metrics(db):
    metrics = get_metrics(db)
    assert metrics["model_name"] == "RandomForestClassifier"
    assert metrics["accuracy"] > 0.95
    assert metrics["recall"] > 0.90
    assert metrics["confusion_matrix"] is not None
    assert metrics["feature_importances"] is not None


def test_model_info():
    info = get_model_info()
    assert info["status"] == "Operational / Active"
    assert "risk_thresholds" in info
