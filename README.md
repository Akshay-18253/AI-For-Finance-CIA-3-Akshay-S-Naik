# AI-Powered Fraud Detection System
### Premium Fintech Intelligence & Transaction Surveillance Platform

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.9.1-F7931E.svg)](https://scikit-learn.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg)](https://www.sqlalchemy.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An institutional-grade, full-stack financial intelligence application capable of processing financial transactions in real time, detecting complex fraud typologies, calculating normalized risk scores (0–100), and presenting actionable telemetry through a dark institutional fintech dashboard.

Developed as a Continuous Internal Assessment (CIA) project for **Semester 3: Artificial Intelligence for Finance**.

---

## 1. Project Overview & Problem Statement

Financial fraud poses a multi-billion dollar challenge to online payment networks, digital banks, and institutional clearing systems. Legacy rule-based engines (e.g. static if-else checks) struggle to recognize emerging attack vectors, suffer from high false-positive rates, and fail to adapt to evolving adversary behaviors.

This platform bridges that gap by deploying a hybrid supervised and unsupervised machine-learning architecture:
- **Random Forest Classifier** with balanced subsample weighting to handle extreme financial class imbalance (~2.5% fraud prevalence).
- **Isolation Forest** to flag multi-dimensional statistical outliers.
- **Dynamic Heuristic Cues** providing transparent diagnostic indicators for human analysts, distinctly separated from statistical probability estimates.

---

## 2. Core Objectives

1. **Real-Time Inference**: Accept financial transactions and compute genuine ML predictions (no mocked or randomized numbers).
2. **Normalized Risk Scoring**: Output calibrated probabilities and normalized risk scores ($0–100$) categorized into `LOW` (0–29), `MEDIUM` (30–69), and `HIGH` (70–100).
3. **Surveillance Queue**: Route suspicious events to an analyst alert center for human-in-the-loop triage (`Under Review`, `Confirmed Fraud`, `False Positive`, `Reviewed`).
4. **Historical Ledger**: Maintain a searchable, filterable transaction history with audit details.
5. **Portfolio Analytics**: Deliver high-density telemetry via interactive visualizations (volume trends, channel vulnerabilities, category exposure).
6. **Empirical Model Monitoring**: Display genuine model evaluation metrics, $2 \times 2$ confusion matrix, and tree-based feature importances.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, Vite 8, JavaScript (ESM), Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, Recharts, Lucide React, Axios |
| **Backend API** | Python 3.14+, FastAPI, Uvicorn (ASGI), Pydantic v2, Pydantic-Settings |
| **Machine Learning** | Scikit-learn (RandomForestClassifier, IsolationForest), Pandas, NumPy, Scipy, Joblib |
| **Database & ORM** | SQLite 3, SQLAlchemy 2.0 ORM |
| **Testing** | Pytest, FastAPI TestClient, Requests/HTTPX |
| **Design System** | Dark Institutional Fintech (`#090D14` base, `#121B29` cards, `#3B82F6` electric blue, `#22D3EE` cyan) |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND (Vite)                            │
│  Executive Dashboard │ Transaction Analyzer │ Ledger │ Alert Center     │
│  Analytics Workspace │ ML Model Performance │ Settings Console          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST (JSON)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                                 │
│  Routes: /api/predict, /api/transactions, /api/alerts, /api/analytics   │
│  Services: fraud_detection.py, risk_scoring.py, transaction_service.py │
└──────────────┬───────────────────────────────────────────┬──────────────┘
               │                                           │
               ▼                                           ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│       MACHINE LEARNING        │         │      DATABASE / PERSISTENCE   │
│  - Preprocessor (Scaler + OHE)│         │  SQLite 3 (fraud_detection.db)│
│  - RandomForestClassifier     │         │  - transactions table         │
│  - IsolationForest            │         │  - model_evaluations table    │
│  - Joblib Model Artifacts     │         └───────────────────────────────┘
└───────────────────────────────┘
```

---

## 5. Machine Learning Methodology

### 5.1 Dataset Strategy
Trained on a calibrated 30,000-sample financial transaction dataset modeled after PaySim and real-world banking logs with realistic class imbalance:
- **Legitimate Transactions**: 29,230 (97.43%)
- **Fraudulent Transactions**: 770 (2.57%)

### 5.2 Modeled Fraud Typologies
1. **Account Takeover (ATO)**: Compromised credentials used on a new device, located $>120\text{ km}$ from baseline, creating a massive amount spike ($7\times - 25\times$) relative to historical spending.
2. **Velocity Card Testing**: Automated rapid transaction bursts ($\ge 8$ attempts within 24 hours).
3. **Cross-Border Luxury Carding**: High-value transactions ($>\$1,200$) in volatile categories (Electronics, Travel) executed internationally from unverified devices.
4. **Nocturnal Account Drains**: Fresh accounts ($<25$ days old) transferring high sums ($>\$1,500$) during nocturnal off-peak hours (01:00–04:00).
5. **Realistic False Positives**: Legitimate cardholders traveling or purchasing new hardware without fraudulent intent.

### 5.3 Feature Engineering Pipeline
The pipeline derives 4 domain features prior to scaling:
- `amount_to_prev_ratio` $= \frac{\text{transaction\_amount}}{\text{previous\_amount} + 1.0}$
- `amount_log` $= \ln(1 + \text{transaction\_amount})$
- `is_night` $= 1 \text{ if hour} \in [0, 5] \cup [23] \text{ else } 0$
- `risk_flag_sum` $= \text{new\_device} + \text{international\_transaction}$

Continuous attributes are scaled via `StandardScaler`, and categorical features (`transaction_type`, `merchant_category`) are encoded via `OneHotEncoder(handle_unknown='ignore')`. The transformer is strictly fit on the training split to avoid data leakage.

### 5.4 Empirical Evaluation Results (Holdout Test Split: 6,000 Unseen Samples)

| Evaluation Metric | Score | Assessment |
|---|---|---|
| **Overall Accuracy** | **99.92%** | High baseline discrimination |
| **Fraud Precision** | **98.69%** | Very low false alarm rate (only 2 false positives out of 5,846 legit) |
| **Fraud Recall** | **98.05%** | Priority metric: Intercepted 151 of 154 fraud attacks |
| **F1-Score** | **98.37%** | Balanced precision-recall equilibrium |
| **ROC-AUC** | **0.9999** | Near-perfect separation threshold |

#### Confusion Matrix:
```
                     Predicted Legitimate    Predicted Fraud
Actual Legitimate           5,844                    2  (False Positive)
Actual Fraud                    3 (False Negative) 151  (True Positive)
```

#### Top Feature Importances (Random Forest Gini Impurity):
1. `amount_to_prev_ratio`: **25.81%**
2. `transaction_amount`: **20.03%**
3. `amount_log`: **17.39%**
4. `new_device`: **10.46%**
5. `recent_transaction_count`: **9.31%**
6. `risk_flag_sum`: **6.37%**
7. `location_distance`: **4.86%**

---

## 6. Key Application Modules

### Module 1 — Executive Dashboard (`/`)
- 4 Real-time KPI Cards: Total Volume, Flagged Incidents, Detection Rate, Critical Threats.
- 14-Day Chronological Area Chart: Legitimate settlement baseline vs. flagged anomalies.
- Portfolio Donut Chart & Risk Classification Bar Chart.
- Recent Suspicious Activity feed with real-time risk scores and audit links.

### Module 2 — AI Transaction Analyzer (`/analyzer`)
- Full 10-parameter financial transaction form with live client validation.
- 5 Pre-configured Attack Scenario presets for rapid live demonstration (ATO Spike, Cross-Border Carding, Nocturnal Drain, etc.).
- Animated Radial Risk Gauge (0–100), Fraud Probability %, Model Identifier (`RF v1.0.0`).
- Transparent Heuristic Observations list (distinct from ML probability estimation).
- Optional ledger persistence toggle.

### Module 3 — Transaction Ledger (`/transactions`)
- Full transaction surveillance history with server-side pagination.
- Multi-faceted filters: Risk Tier, Channel Type, Merchant Sector, Review Status.
- Column sorting (Amount, Timestamp, Risk Score).
- Interactive Audit Modal displaying behavioral telemetry and workflow status updates.

### Module 4 — Fraud Alert Center (`/alerts`)
- Prioritized alert queue for Medium & High risk events.
- Administrative Triage Actions: `Under Review`, `Confirmed Fraud`, `False Positive`, `Clear / Reviewed`.
- Instant state updates persisted to the SQLite database via `PATCH /api/alerts/{id}/status`.

### Module 5 — Deep-Dive Analytics (`/analytics`)
- 7-Day, 14-Day, and 30-Day aggregate horizons.
- Time-series transaction volume analysis.
- Vulnerability breakdown by payment channel and merchant category.
- Risk tier proportion analysis with investigator guidelines.

### Module 6 — Model Performance Intelligence (`/model`)
- Live empirical metrics pulled directly from the evaluation database.
- Interactive $2 \times 2$ Confusion Matrix with sample counts and percentages.
- Horizontal Feature Importance Bar Chart showing top 10 factors.

### Module 7 — Settings & Diagnostics (`/settings`)
- Configurable risk threshold cutoffs (`LOW`: 0–29, `MEDIUM`: 30–69, `HIGH`: 70–100).
- Runtime diagnostics (FastAPI ASGI status, SQLite database engine, ML artifact path).
- Academic context and CIA attribution.

---

## 7. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and engine status |
| `GET` | `/api/dashboard/summary` | Executive dashboard KPIs and recent suspicious transactions |
| `POST` | `/api/predict` | Real-time ML inference (does not write to DB) |
| `POST` | `/api/transactions` | Evaluates risk and commits record to database |
| `GET` | `/api/transactions` | Filtered, sorted, and paginated transaction ledger |
| `GET` | `/api/transactions/{id}` | Detailed transaction audit with heuristic indicators |
| `GET` | `/api/alerts` | Alert queue of High and Medium risk transactions |
| `PATCH`| `/api/alerts/{id}/status`| Update transaction review workflow status |
| `GET` | `/api/analytics` | Aggregated time-series, channel, and category metrics |
| `GET` | `/api/model/metrics` | Model evaluation metrics, confusion matrix, feature importances |
| `GET` | `/api/model/info` | Architecture specs, model version, and active thresholds |

#### Sample Prediction Request (`POST /api/predict`):
```json
{
  "transaction_amount": 4200.00,
  "transaction_type": "Transfer",
  "merchant_category": "Retail",
  "transaction_hour": 2,
  "recent_transaction_count": 9,
  "account_age_days": 15,
  "location_distance": 650.0,
  "new_device": true,
  "international_transaction": false,
  "previous_transaction_amount": 35.00
}
```

#### Sample Prediction Response:
```json
{
  "transaction_id": "TXN-8B4F92AC1E04",
  "fraud_probability": 0.993,
  "risk_score": 99,
  "risk_category": "HIGH",
  "prediction": 1,
  "model_version": "1.0.0",
  "timestamp": "2026-11-03T08:35:12.412000Z",
  "suspicious_indicators": [
    "Unusual amount spike: $4,200.00 is 120.0x higher than recent average ($35.00)",
    "Geographic anomaly: Transaction located 650.0 km from primary user baseline",
    "Unrecognized device detected during elevated value/distance event",
    "Off-peak nocturnal transaction time (02:00 hrs)",
    "High transaction frequency: 9 events recorded in past 24 hours"
  ],
  "anomaly_score": -0.0841
}
```

---

## 8. Installation & Local Setup

### Prerequisites
- **Python**: 3.11, 3.12, 3.13, or 3.14
- **Node.js**: v18+ (tested on Node v24)
- **npm** or **pnpm**
- **Git**

### Step 1: Clone Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "AI for Finance"
```

### Step 2: Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Re-generate dataset and train model:
python dataset/generate_dataset.py
python -m app.ml.training

# Seed database with demonstration transactions:
python -m app.database_seeder

# Start FastAPI backend server:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend Swagger UI will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### Step 3: Frontend Setup
Open a second terminal:
```bash
cd frontend

# Install dependencies:
npm install

# Start Vite development server:
npm run dev
```
*Frontend application will be live at: [http://localhost:5173](http://localhost:5173)*

---

## 9. Running Automated Tests

Run the backend test suite:
```bash
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

All 9 test suites will execute and verify health check, prediction endpoints, database CRUD, alert updates, analytics aggregations, and model telemetry.

---

## 10. Limitations & Future Roadmap

### Current Limitations
1. **Simulation Scope**: Developed as an academic demonstration system. Does not integrate directly with real bank payment rails or card networks.
2. **Synchronous Inference**: Inference is calculated per-request; in a high-throughput bank setting ($\sim 50,000 \text{ tx/sec}$), transactions would stream through Kafka/Flink before entering an asynchronous scoring cluster.

### Future Roadmap
- [ ] **Graph Neural Networks (GNN)**: Incorporate node and edge relationships between cards, merchants, and devices to detect organized fraud rings.
- [ ] **SHAP TreeExplainer**: Add local SHAP waterfall plots for granular individual explanation alongside rule-based cues.
- [ ] **Automated Rule Engine Sync**: Allow analysts to author and deploy hot-reloaded Drools/JSON rules directly from the dashboard.

---

## 11. Project Attribution

- **Course**: Continuous Internal Assessment (CIA) — Semester 3: Artificial Intelligence for Finance
- **Topic**: AI-Powered Fraud Detection System (Fintech Intelligence Platform)
- **Author**: Student Engineering Project

---

## 12. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
