# Machine Learning Model Training & Evaluation Guide
## AI-Powered Fraud Detection System

This guide covers the mathematical formulations, preprocessing pipelines, model training workflows, and evaluation procedures implemented in the machine-learning engine.

---

## 1. Machine Learning Pipeline Architecture

The training pipeline is implemented in [`backend/app/ml/training.py`](file:///d:/CIAs/SEM%20-%203/AI%20for%20Finance/backend/app/ml/training.py) and follows strict anti-leakage best practices:

```
┌────────────────────────────────────────────────────────┐
│             Raw Dataset (30,000 Rows)                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Feature Engineering Phase                 │
│  - Derive amount_to_prev_ratio, amount_log             │
│  - Derive is_night, risk_flag_sum                      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       Stratified Train / Test Split (80% / 20%)        │
│       Train: 24,000 Samples  │  Test: 6,000 Samples    │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ Fit ColumnTransformer     │ │ Transform Test Split      │
│ (StandardScaler + OHE)    │ │ (Using Fitted Parameters) │
└─────────────┬─────────────┘ └───────────┬───────────────┘
              │                           │
              ▼                           │
┌───────────────────────────┐             │
│ Train Estimators:         │             │
│ 1. RandomForestClassifier │             │
│    (class_weight=balanced)│             │
│ 2. IsolationForest        │             │
└─────────────┬─────────────┘             │
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              Holdout Split Evaluation                  │
│  Accuracy, Precision, Recall, F1, ROC-AUC, CM          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Artifact Serialization (Joblib)            │
│  Saved to: backend/artifacts/fraud_model.joblib        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Feature Engineering & Preprocessing Pipeline

### 2.1 Engineered Features
Raw transaction attributes are transformed into 4 informative interaction features:
1. **Amount-to-Previous Ratio** (`amount_to_prev_ratio`):
   $$\text{ratio} = \frac{\text{transaction\_amount}}{\text{previous\_transaction\_amount} + 1.0}$$
   Captures relative magnitude deviation rather than absolute scale.
2. **Log-Transformed Amount** (`amount_log`):
   $$\text{amount\_log} = \ln(1 + \text{transaction\_amount})$$
   Compresses long-tailed monetary values to improve numerical stability.
3. **Nocturnal Indicator** (`is_night`):
   $$\text{is\_night} = \begin{cases} 1 & \text{if } \text{hour} \in \{0, 1, 2, 3, 4, 5, 23\} \\ 0 & \text{otherwise} \end{cases}$$
4. **Composite Risk Flag Sum** (`risk_flag_sum`):
   $$\text{risk\_flag\_sum} = \text{new\_device} + \text{international\_transaction}$$

### 2.2 Scikit-Learn `ColumnTransformer`
- **Numerical Pipeline**: `StandardScaler()` applied to continuous numericals.
- **Categorical Pipeline**: `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` with fixed category registries:
  - `transaction_type`: `[Payment, Transfer, Withdrawal, Deposit]`
  - `merchant_category`: `[Retail, Grocery, Travel, Entertainment, Electronics, Online Services, Other]`
- **Binary Pipeline**: `passthrough` for pre-binarized flags (`new_device`, `international_transaction`).

---

## 3. Model Training & Hyperparameter Tuning

### 3.1 Primary Classifier: Random Forest
- **Estimator Count (`n_estimators`)**: `150` decision trees.
- **Tree Depth (`max_depth`)**: `12` levels (prevents memorization while capturing non-linear interactions).
- **Split Quality**: Gini Impurity.
- **Class Imbalance Handling**: `class_weight="balanced"`. Automatically scales class weights inversely proportional to class frequencies.
- **Subsample Controls**: `min_samples_split=5`, `min_samples_leaf=2`.
- **Parallelism**: `n_jobs=-1`.

### 3.2 Secondary Anomaly Detector: Isolation Forest
- **Purpose**: Unsupervised detection of multi-dimensional outlier signatures.
- **Contamination Parameter**: `0.02` ($2\%$).
- **Training Strategy**: Fit exclusively on legitimate training samples ($y=0$) to model normal consumer behavior.
- **Inference Signal**: Evaluated via `decision_function(X)`. Scores below $-0.05$ trigger an unsupervised anomaly cue.

---

## 4. Empirical Benchmark Results

Evaluated on an independent **6,000-sample unseen holdout test set** (154 actual fraud cases):

| Metric | Score | Industry Interpretation |
|---|---|---|
| **Overall Accuracy** | **99.92%** | Standard metric; high performance across dominant class |
| **Fraud Precision** | **98.69%** | $\frac{151}{151 + 2}$ — Only 2 false alarms across 5,846 normal transactions |
| **Fraud Recall** | **98.05%** | $\frac{151}{151 + 3}$ — Intercepted 151 out of 154 actual fraud attacks |
| **F1-Score** | **98.37%** | Balanced harmonic precision-recall equilibrium |
| **ROC-AUC** | **0.9999** | Area under the Receiver Operating Characteristic curve |

### Confusion Matrix Breakdown
```
                       Predicted Legitimate    Predicted Fraud
Actual Legitimate (5,846)    5,844 (TN)               2 (FP)
Actual Fraud (154)               3 (FN)             151 (TP)
```

- **True Negatives (TN = 5,844)**: Legitimate transactions cleared with zero friction.
- **False Positives (FP = 2)**: Legitimate transactions incorrectly flagged ($0.03\%$ false alarm rate).
- **False Negatives (FN = 3)**: Fraud incidents that bypassed classification ($1.95\%$ miss rate).
- **True Positives (TP = 151)**: Fraudulent attacks successfully detected and routed to alert center.

---

## 5. Global Feature Importance Ranking

Derived from Gini impurity reduction across all 150 ensemble trees:

| Rank | Feature | Relative Importance | Analysis |
|---|---|---|---|
| 1 | `amount_to_prev_ratio` | **25.81%** | Strongest single indicator of sudden financial anomalies |
| 2 | `transaction_amount` | **20.03%** | Absolute magnitude of currency transacted |
| 3 | `amount_log` | **17.39%** | Log-scaled monetary impact |
| 4 | `new_device` | **10.46%** | High weight on terminal verification |
| 5 | `recent_transaction_count`| **9.31%** | Velocity check targeting automated carding scripts |
| 6 | `risk_flag_sum` | **6.37%** | Compound risk indicator (device + foreign clearing) |
| 7 | `location_distance` | **4.86%** | Distance anomaly from baseline |
| 8 | `previous_transaction_amount`| **0.97%** | Baseline spending history |
| 9 | `international_transaction`| **0.89%** | Cross-border transaction indicator |
| 10| `transaction_hour` | **0.81%** | Nocturnal circadian timing |

---

## 6. How to Retrain the Model

To generate a new dataset and retrain the model locally:

```bash
cd backend

# Step 1: Generate updated transaction dataset
.\.venv\Scripts\python.exe dataset/generate_dataset.py

# Step 2: Run training and evaluation pipeline
.\.venv\Scripts\python.exe -m app.ml.training
```

The script will automatically update:
- `backend/artifacts/fraud_model.joblib`
- `backend/artifacts/evaluation_metrics.json`
- SQLite `model_evaluations` table

