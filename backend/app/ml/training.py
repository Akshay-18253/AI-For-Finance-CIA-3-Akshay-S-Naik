"""Model training pipeline for the AI-Powered Fraud Detection System.

Trains a supervised Random Forest classifier with balanced class weighting to handle
financial fraud class imbalance, alongside an unsupervised Isolation Forest for anomaly scoring.
Computes comprehensive evaluation metrics (Precision, Recall, F1, ROC-AUC, Confusion Matrix)
and persists artifacts with version metadata.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from app.config import BASE_DIR, settings
from app.database import SessionLocal, init_db
from app.ml.preprocessing import (
    create_preprocessor,
    engineer_features,
    get_feature_names,
)
from app.models.transaction import ModelEvaluation

DATASET_PATH = BASE_DIR / "dataset" / "transactions_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_SAVE_PATH = ARTIFACTS_DIR / "fraud_model.joblib"
METRICS_SAVE_PATH = ARTIFACTS_DIR / "evaluation_metrics.json"


def train_fraud_model(
    dataset_path: Path = DATASET_PATH,
    model_version: str = "1.0.0",
    random_state: int = 42,
) -> dict:
    """Train Random Forest and Isolation Forest models, evaluate, and save artifacts."""
    print(f"[{datetime.now(timezone.utc).isoformat()}] Loading dataset from: {dataset_path}")
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found at {dataset_path}. Run generate_dataset.py first.")

    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df):,} transactions. Fraud rate: {df['is_fraud'].mean() * 100:.2f}%")

    # 1. Feature Engineering
    df_engineered = engineer_features(df)
    target_col = "is_fraud"
    feature_cols = [c for c in df_engineered.columns if c != target_col]

    X = df_engineered[feature_cols]
    y = df_engineered[target_col].values

    # 2. Stratified Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=random_state,
        stratify=y,
    )
    print(f"Training split: {len(X_train):,} samples ({y_train.sum()} fraud)")
    print(f"Testing split:  {len(X_test):,} samples ({y_test.sum()} fraud)")

    # 3. Fit Preprocessing Pipeline strictly on Train Set
    preprocessor = create_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    feature_names = get_feature_names(preprocessor)

    # 4. Train Supervised Classifier (Random Forest with class_weight='balanced')
    print("Training Random Forest Classifier (balanced class weights)...")
    rf_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=random_state,
        n_jobs=-1,
    )
    rf_model.fit(X_train_trans, y_train)

    # 5. Train Unsupervised Anomaly Detector (Isolation Forest)
    print("Fitting Isolation Forest for unsupervised anomaly detection...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=random_state,
        n_jobs=-1,
    )
    # Fit only on legitimate training records to learn baseline normal behavior
    legit_mask = y_train == 0
    iso_forest.fit(X_train_trans[legit_mask])

    # 6. Comprehensive Model Evaluation on Test Split
    print("Evaluating model performance on unseen test split...")
    y_pred = rf_model.predict(X_test_trans)
    y_prob = rf_model.predict_proba(X_test_trans)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))

    # Confusion matrix: [[tn, fp], [fn, tp]] -> flattened [tn, fp, fn, tp]
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    cm_flat = [int(tn), int(fp), int(fn), int(tp)]

    # Feature importances
    importances = rf_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_importance_dict = {
        feature_names[i]: round(float(importances[i]), 4) for i in sorted_idx
    }

    metrics = {
        "model_name": "RandomForestClassifier",
        "model_version": model_version,
        "dataset_name": dataset_path.name,
        "num_samples": int(len(df)),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": cm_flat,
        "feature_importances": feature_importance_dict,
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
    }

    print("\n--- MODEL PERFORMANCE RESULTS ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1-Score:  {metrics['f1_score']:.4f}")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("---------------------------------\n")

    # 7. Persist Artifacts
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": rf_model,
        "isolation_forest": iso_forest,
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "model_name": "RandomForestClassifier",
        "model_version": model_version,
        "dataset_name": dataset_path.name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
    }
    joblib.dump(bundle, MODEL_SAVE_PATH, compress=3)
    print(f"Model artifact saved to: {MODEL_SAVE_PATH}")

    with open(METRICS_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {METRICS_SAVE_PATH}")

    # 8. Store in Database
    try:
        init_db()
        db = SessionLocal()
        # Save or update ModelEvaluation record
        eval_record = ModelEvaluation(
            model_version=model_version,
            model_name="RandomForestClassifier",
            dataset_name=dataset_path.name,
            num_samples=len(df),
            accuracy=acc,
            precision=prec,
            recall=rec,
            f1_score=f1,
            roc_auc=roc_auc,
            confusion_matrix=",".join(map(str, cm_flat)),
            feature_importances=";".join(
                f"{k}:{v}" for k, v in list(feature_importance_dict.items())[:15]
            ),
            evaluation_timestamp=datetime.now(timezone.utc),
        )
        db.add(eval_record)
        db.commit()
        db.close()
        print("Model evaluation record saved to database.")
    except Exception as e:
        print(f"Warning: Could not save evaluation record to database: {e}")

    return metrics


if __name__ == "__main__":
    train_fraud_model()
