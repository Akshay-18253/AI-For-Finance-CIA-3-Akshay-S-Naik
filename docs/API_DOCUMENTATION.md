# REST API Documentation
## AI-Powered Fraud Detection System

The backend exposes an asynchronous RESTful API built on **FastAPI**. All request and response bodies utilize standard JSON encoding. All datetime fields are formatted according to ISO 8601 in UTC (`YYYY-MM-DDTHH:MM:SSZ`).

- **Base URL**: `http://localhost:8000/api`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **OpenAPI JSON Spec**: `http://localhost:8000/openapi.json`

---

## 1. Endpoints Overview

| Category | Method | Path | Summary |
|---|---|---|---|
| **System** | `GET` | `/api/health` | Service health status and timestamp |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Executive KPIs and recent suspicious incidents |
| **Inference** | `POST`| `/api/predict` | Real-time ML risk scoring (stateless, no DB write) |
| **Transactions** | `POST`| `/api/transactions` | Evaluates risk, generates TXN-ID, and commits to DB |
| **Transactions** | `GET` | `/api/transactions` | Filtered, sorted, and paginated transaction ledger |
| **Transactions** | `GET` | `/api/transactions/{transaction_id}` | Detailed transaction audit with heuristic indicators |
| **Alerts** | `GET` | `/api/alerts` | Triage queue of High and Medium risk transactions |
| **Alerts** | `PATCH`| `/api/alerts/{transaction_id}/status`| Update transaction review workflow status |
| **Analytics** | `GET` | `/api/analytics` | Aggregated portfolio trends and channel vulnerabilities |
| **Model** | `GET` | `/api/model/metrics` | Empirical ML performance metrics and confusion matrix |
| **Model** | `GET` | `/api/model/info` | Architecture specs, model version, and risk cutoffs |

---

## 2. Detailed Endpoint Reference

### 2.1 Health Check
`GET /api/health`

Validates that the FastAPI application and ASGI server are operational.

#### Response `200 OK`:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-11-03T12:00:00.000000Z"
}
```

---

### 2.2 Executive Dashboard Summary
`GET /api/dashboard/summary`

Returns top-level key performance indicators and the most recent suspicious activity queue.

#### Response `200 OK`:
```json
{
  "total_transactions": 181,
  "flagged_transactions": 26,
  "fraud_detection_rate": 14.36,
  "high_risk_transactions": 18,
  "recent_suspicious": [
    {
      "id": 142,
      "transaction_id": "TXN-8B4F92AC1E04",
      "transaction_amount": 4200.0,
      "transaction_type": "Transfer",
      "merchant_category": "Retail",
      "transaction_hour": 2,
      "recent_transaction_count": 9,
      "account_age_days": 15,
      "location_distance": 450.0,
      "new_device": true,
      "international_transaction": false,
      "previous_transaction_amount": 35.0,
      "fraud_probability": 0.993,
      "risk_score": 99,
      "risk_category": "HIGH",
      "prediction": 1,
      "review_status": "Pending",
      "created_at": "2026-11-03T08:15:30Z"
    }
  ]
}
```

---

### 2.3 Real-Time Transaction Prediction (Stateless)
`POST /api/predict`

Executes real-time machine learning inference and heuristic observation on transaction parameters without committing records to the persistence layer.

#### Request Body:
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

#### Response `200 OK`:
```json
{
  "transaction_id": "TXN-9A1F4C82E602",
  "fraud_probability": 0.993,
  "risk_score": 99,
  "risk_category": "HIGH",
  "prediction": 1,
  "model_version": "1.0.0",
  "timestamp": "2026-11-03T08:45:10.120000Z",
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

#### Error Response `422 Unprocessable Entity`:
Triggered when input parameters fail Pydantic validation (e.g., negative amount, invalid category enum).
```json
{
  "detail": [
    {
      "loc": ["body", "transaction_amount"],
      "msg": "Input should be greater than 0",
      "type": "greater_than"
    }
  ]
}
```

---

### 2.4 Create and Evaluate Transaction
`POST /api/transactions`

Executes ML inference, determines initial review status, and persists the record to the SQLite database.

#### Request Body:
Same as `POST /api/predict`.

#### Response `201 Created`:
Returns the created `TransactionResponse` entity with assigned synthetic ID and timestamps.

---

### 2.5 List Transactions (Paginated Ledger)
`GET /api/transactions`

#### Query Parameters:
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number ($\ge 1$) |
| `page_size` | Integer | `15` | Page size ($1 - 100$) |
| `search` | String | `None` | Free-text search on `transaction_id` or `merchant_category` |
| `risk_category` | String | `None` | Filter by `LOW`, `MEDIUM`, `HIGH` |
| `transaction_type` | String | `None` | Filter by `Payment`, `Transfer`, `Withdrawal`, `Deposit` |
| `merchant_category`| String | `None` | Filter by merchant sector |
| `review_status` | String | `None` | Filter by `Pending`, `Under Review`, `Confirmed Fraud`, etc. |
| `sort_by` | String | `"created_at"` | Field name to sort by |
| `sort_order` | String | `"desc"` | Sort direction: `"asc"` or `"desc"` |

#### Response `200 OK`:
```json
{
  "transactions": [ ... ],
  "total": 181,
  "page": 1,
  "page_size": 15,
  "total_pages": 13
}
```

---

### 2.6 Get Transaction Detail
`GET /api/transactions/{transaction_id}`

Retrieves complete transaction attributes along with dynamic heuristic rule observations.

#### Response `200 OK`:
```json
{
  "id": 14,
  "transaction_id": "TXN-7B2E49A1F023",
  "transaction_amount": 189.99,
  "transaction_type": "Payment",
  "merchant_category": "Electronics",
  "transaction_hour": 16,
  "recent_transaction_count": 2,
  "account_age_days": 140,
  "location_distance": 12.0,
  "new_device": false,
  "international_transaction": false,
  "previous_transaction_amount": 150.0,
  "fraud_probability": 0.012,
  "risk_score": 1,
  "risk_category": "LOW",
  "prediction": 0,
  "review_status": "Reviewed",
  "created_at": "2026-11-01T14:32:00Z",
  "suspicious_indicators": []
}
```

---

### 2.7 Update Alert Review Status
`PATCH /api/alerts/{transaction_id}/status`

Updates the workflow state of a flagged transaction.

#### Request Body:
```json
{
  "review_status": "Under Review"
}
```
*Allowed values: `"Pending"`, `"Under Review"`, `"Reviewed"`, `"Confirmed Fraud"`, `"False Positive"`.*

#### Response `200 OK`:
Returns updated transaction entity.

---

### 2.8 Aggregated Risk Analytics
`GET /api/analytics`

#### Query Parameters:
- `days`: Integer (Default: `14`, Min: `1`, Max: `90`). Historical lookback window.

#### Response `200 OK`:
```json
{
  "volume_over_time": [
    {
      "date": "2026-10-21",
      "total": 12,
      "legitimate": 10,
      "flagged": 2
    }
  ],
  "fraud_by_type": [
    { "type": "Payment", "total": 85, "flagged": 8 },
    { "type": "Transfer", "total": 42, "flagged": 11 }
  ],
  "fraud_by_category": [
    { "category": "Retail", "total": 54, "flagged": 6 },
    { "category": "Electronics", "total": 24, "flagged": 9 }
  ],
  "risk_distribution": {
    "Low": 155,
    "Medium": 8,
    "High": 18
  },
  "avg_transaction_amount": 348.65,
  "total_transactions": 181,
  "total_flagged": 26
}
```

---

### 2.9 Model Evaluation Metrics
`GET /api/model/metrics`

Returns empirical evaluation metrics, confusion matrix, and feature importances calculated on the holdout test set.

#### Response `200 OK`:
```json
{
  "model_name": "RandomForestClassifier",
  "model_version": "1.0.0",
  "dataset_name": "transactions_dataset.csv",
  "num_samples": 30000,
  "accuracy": 0.9992,
  "precision": 0.9869,
  "recall": 0.9805,
  "f1_score": 0.9837,
  "roc_auc": 0.9999,
  "confusion_matrix": [5844, 2, 3, 151],
  "feature_importances": {
    "amount_to_prev_ratio": 0.2581,
    "transaction_amount": 0.2003,
    "amount_log": 0.1739,
    "new_device": 0.1046,
    "recent_transaction_count": 0.0931,
    "risk_flag_sum": 0.0637,
    "location_distance": 0.0486
  },
  "evaluation_timestamp": "2026-11-03T08:19:01.305111Z"
}
```
