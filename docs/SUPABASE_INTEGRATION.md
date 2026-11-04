# Supabase Cloud PostgreSQL Integration Guide
## AI-Powered Fraud Detection System (CIA-3: AI for Finance)

This document details the configuration, connection architecture, and synchronization between the **Supabase Cloud PostgreSQL Database** and the **GitHub Repository** for the AI-Powered Fraud Detection System.

---

## 1. Project Specifications

| Attribute | Value |
|---|---|
| **Cloud Provider** | Supabase (AWS ap-northeast-1 / Tokyo) |
| **Project ID** | `vplpaculiexdlkxjceuy` |
| **Database Engine** | PostgreSQL 15+ |
| **ORM / Client** | SQLAlchemy 2.0 (`psycopg2-binary>=2.9.10`) |
| **Connection Pooling** | Supavisor (Port 5432 - Session Mode) |
| **GitHub Repository** | [`Akshay-18253/AI-For-Finance-CIA-3-Akshay-S-Naik`](https://github.com/Akshay-18253/AI-For-Finance-CIA-3-Akshay-S-Naik) |
| **Linked Branch** | `main` (Production) |

---

## 2. Architecture & Connection Pooling

Supabase provides two primary pooler modes via Supavisor:
1. **Transaction Mode (`:6543`)**: Optimized for brief serverless stateless queries.
2. **Session Mode (`:5432`)**: Optimized for persistent connections, ORM schema reflection, and prepared statements.

The system utilizes **Session Mode (`port 5432`)** combined with SQLAlchemy connection pool recycling:
```python
engine_kwargs = {
    "pool_pre_ping": True,  # Actively verifies connection vitality
    "pool_recycle": 300,    # Re-establishes stale connections after 5 minutes
    "pool_size": 5,         # Base connection pool size
    "max_overflow": 10      # Burst concurrency allowance
}
```

---

## 3. Database Schema & Migration Directory

Database migrations are synchronized via the repository's `supabase/` directory:
- `supabase/config.toml`: Project metadata and local emulation configuration.
- `supabase/migrations/20261104000000_create_fraud_detection_schema.sql`: Authoritative DDL for the fraud detection schema.

### 3.1 Tables
1. **`public.transactions`**:
   - Stores operational telemetry (amount, type, category, hour, velocity, account age, distance, device flag, international flag) alongside machine learning inferences (fraud probability, risk score, risk category, model prediction, and triage status).
2. **`public.model_evaluations`**:
   - Stores immutable model performance metrics (Accuracy: 99.92%, Precision: 98.69%, Recall: 98.05%, F1: 98.37%, ROC-AUC: 0.9999, confusion matrix, and feature importances).

### 3.2 Performance Indexes
- `ix_risk_category` on `transactions(risk_category)`
- `ix_review_status` on `transactions(review_status)`
- `ix_created_at` on `transactions(created_at)`
- `ix_transaction_id` on `transactions(transaction_id)`

---

## 4. Security & Row Level Security (RLS)

All tables within the `public` schema have **Row Level Security (RLS) enabled**:
```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;
```

Access policies ensure that the internal backend engine (`postgres` / `service_role`) maintains authorized read/write access while unauthorized direct PostgREST calls over the public internet are blocked.

---

## 5. Supabase GitHub Integration Workflow

With the GitHub integration enabled in the Supabase Dashboard:
1. Any commits pushed to `main` containing migration files in `supabase/migrations/` can be applied automatically or reviewed via Supabase branch previews.
2. The Supabase dashboard links directly to commits in `Akshay-18253/AI-For-Finance-CIA-3-Akshay-S-Naik`.
3. CI/CD pipelines can validate SQL migrations before applying them to production.
