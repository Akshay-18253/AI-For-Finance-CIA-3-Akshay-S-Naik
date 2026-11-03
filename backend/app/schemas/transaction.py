"""Pydantic schemas for transaction-related requests and responses."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------- Enums ----------

class TransactionType(str, Enum):
    PAYMENT = "Payment"
    TRANSFER = "Transfer"
    WITHDRAWAL = "Withdrawal"
    DEPOSIT = "Deposit"


class MerchantCategory(str, Enum):
    RETAIL = "Retail"
    GROCERY = "Grocery"
    TRAVEL = "Travel"
    ENTERTAINMENT = "Entertainment"
    ELECTRONICS = "Electronics"
    ONLINE_SERVICES = "Online Services"
    OTHER = "Other"


class RiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ReviewStatus(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    REVIEWED = "Reviewed"
    CONFIRMED_FRAUD = "Confirmed Fraud"
    FALSE_POSITIVE = "False Positive"


# ---------- Request Schemas ----------

class TransactionInput(BaseModel):
    """Schema for incoming transaction analysis requests."""

    transaction_amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    transaction_type: TransactionType
    merchant_category: MerchantCategory
    transaction_hour: int = Field(..., ge=0, le=23, description="Hour of transaction (0-23)")
    recent_transaction_count: int = Field(..., ge=0, description="Number of recent transactions")
    account_age_days: int = Field(..., ge=0, description="Account age in days")
    location_distance: float = Field(..., ge=0, description="Distance from usual location (km)")
    new_device: bool = Field(False, description="Whether transaction uses a new device")
    international_transaction: bool = Field(False, description="Whether this is an international transaction")
    previous_transaction_amount: float = Field(0.0, ge=0, description="Previous transaction amount")

    @field_validator("transaction_amount", "previous_transaction_amount")
    @classmethod
    def round_amount(cls, v: float) -> float:
        return round(v, 2)


class ReviewStatusUpdate(BaseModel):
    """Schema for updating a transaction's review status."""

    review_status: ReviewStatus


# ---------- Response Schemas ----------

class PredictionResult(BaseModel):
    """Schema for ML prediction response."""

    transaction_id: str
    fraud_probability: float
    risk_score: int
    risk_category: RiskCategory
    prediction: int
    model_version: str
    timestamp: datetime
    suspicious_indicators: list[str] = []

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    """Full transaction record response."""

    id: int
    transaction_id: str
    transaction_amount: float
    transaction_type: str
    merchant_category: str
    transaction_hour: int
    recent_transaction_count: int
    account_age_days: int
    location_distance: float
    new_device: bool
    international_transaction: bool
    previous_transaction_amount: float
    fraud_probability: Optional[float] = None
    risk_score: Optional[int] = None
    risk_category: Optional[str] = None
    prediction: Optional[int] = None
    review_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    """Paginated transaction list."""

    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DashboardSummary(BaseModel):
    """Executive dashboard KPI summary."""

    total_transactions: int
    flagged_transactions: int
    fraud_detection_rate: float
    high_risk_transactions: int
    recent_suspicious: list[TransactionResponse]


class ModelMetrics(BaseModel):
    """Model evaluation metrics response."""

    model_name: str
    model_version: str
    dataset_name: str
    num_samples: Optional[int] = None
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    confusion_matrix: Optional[list[int]] = None
    feature_importances: Optional[dict[str, float]] = None
    evaluation_timestamp: datetime

    model_config = {"from_attributes": True}


class AnalyticsResponse(BaseModel):
    """Analytics data for charts."""

    volume_over_time: list[dict]
    fraud_by_type: list[dict]
    fraud_by_category: list[dict]
    risk_distribution: dict[str, int]
    avg_transaction_amount: float
    total_transactions: int
    total_flagged: int

