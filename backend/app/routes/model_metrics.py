"""Model metrics and monitoring API endpoints."""

from __future__ import annotations

import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.config import BASE_DIR, settings
from app.database import get_db
from app.ml.model_loader import get_model_bundle, get_model_metrics
from app.models.transaction import ModelEvaluation
from app.schemas.transaction import ModelMetrics
from app.services.risk_scoring import get_risk_thresholds

router = APIRouter(prefix="/api/model", tags=["Model Intelligence"])


@router.get(
    "/metrics",
    response_model=ModelMetrics,
    status_code=status.HTTP_200_OK,
    summary="Get machine learning model performance evaluation metrics",
)
def get_metrics(db: Session = Depends(get_db)):
    """Fetch genuine evaluation metrics (Precision, Recall, ROC-AUC, Confusion Matrix, Feature Importance)."""
    # 1. Try reading from database
    db_record = (
        db.query(ModelEvaluation)
        .order_by(desc(ModelEvaluation.evaluation_timestamp))
        .first()
    )

    if db_record:
        cm_list = [int(x) for x in db_record.confusion_matrix.split(",")] if db_record.confusion_matrix else None
        feat_dict = {}
        if db_record.feature_importances:
            for pair in db_record.feature_importances.split(";"):
                if ":" in pair:
                    k, v = pair.split(":", 1)
                    feat_dict[k] = float(v)

        return {
            "model_name": db_record.model_name,
            "model_version": db_record.model_version,
            "dataset_name": db_record.dataset_name,
            "num_samples": db_record.num_samples,
            "accuracy": db_record.accuracy,
            "precision": db_record.precision,
            "recall": db_record.recall,
            "f1_score": db_record.f1_score,
            "roc_auc": db_record.roc_auc,
            "confusion_matrix": cm_list,
            "feature_importances": feat_dict,
            "evaluation_timestamp": db_record.evaluation_timestamp,
        }

    # 2. Fallback to evaluation_metrics.json artifact
    json_path = BASE_DIR / "artifacts" / "evaluation_metrics.json"
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Model evaluation metrics not found. Please train the model first.",
    )


@router.get(
    "/info",
    status_code=status.HTTP_200_OK,
    summary="Get model metadata, architecture details, and active thresholds",
)
def get_model_info():
    """Retrieve operational specifications, algorithm details, and risk thresholds."""
    try:
        bundle = get_model_bundle()
        return {
            "model_name": bundle.get("model_name", "RandomForestClassifier"),
            "model_version": bundle.get("model_version", "1.0.0"),
            "algorithm": "Ensemble Random Forest with Balanced Subsample Weighting + Isolation Forest Anomaly Filter",
            "features_count": len(bundle.get("feature_names", [])),
            "trained_at": bundle.get("trained_at"),
            "dataset": bundle.get("dataset_name", "PaySim-Synthetic-30k"),
            "risk_thresholds": get_risk_thresholds(),
            "status": "Operational / Active",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model info retrieval error: {str(e)}",
        )
