"""Transaction and ModelEvaluation ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Index,
)

from app.database import Base


def _generate_txn_id() -> str:
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


class Transaction(Base):
    """Stores every analyzed transaction and its ML prediction result."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(
        String(20), unique=True, nullable=False, default=_generate_txn_id, index=True
    )

    # --- Transaction features ---
    transaction_amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False)
    merchant_category = Column(String(30), nullable=False)
    transaction_hour = Column(Integer, nullable=False)
    recent_transaction_count = Column(Integer, nullable=False)
    account_age_days = Column(Integer, nullable=False)
    location_distance = Column(Float, nullable=False)
    new_device = Column(Boolean, nullable=False, default=False)
    international_transaction = Column(Boolean, nullable=False, default=False)
    previous_transaction_amount = Column(Float, nullable=False, default=0.0)

    # --- Prediction results ---
    fraud_probability = Column(Float, nullable=True)
    risk_score = Column(Integer, nullable=True)
    risk_category = Column(String(10), nullable=True)  # LOW / MEDIUM / HIGH
    prediction = Column(Integer, nullable=True)  # 0 or 1

    # --- Review workflow ---
    review_status = Column(String(20), nullable=False, default="Pending")

    # --- Metadata ---
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_risk_category", "risk_category"),
        Index("ix_review_status", "review_status"),
        Index("ix_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Transaction {self.transaction_id} risk={self.risk_category}>"


class ModelEvaluation(Base):
    """Persists evaluation metrics for each trained model version."""

    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_version = Column(String(20), nullable=False)
    model_name = Column(String(50), nullable=False, default="RandomForestClassifier")
    dataset_name = Column(String(100), nullable=False)
    num_samples = Column(Integer, nullable=True)

    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=True)

    # Store confusion matrix as comma-separated: "tn,fp,fn,tp"
    confusion_matrix = Column(String(100), nullable=True)

    # Store feature importances as comma-separated name:value pairs
    feature_importances = Column(String(1000), nullable=True)

    evaluation_timestamp = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<ModelEvaluation v{self.model_version} F1={self.f1_score:.3f}>"

