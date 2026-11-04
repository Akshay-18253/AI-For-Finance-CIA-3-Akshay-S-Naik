-- Migration: Initialize Fraud Intelligence System Schema
-- Platform: Supabase Cloud PostgreSQL
-- Target Project: vplpaculiexdlkxjceuy

-- 1. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(20) UNIQUE NOT NULL,
    transaction_amount DOUBLE PRECISION NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    merchant_category VARCHAR(30) NOT NULL,
    transaction_hour INTEGER NOT NULL,
    recent_transaction_count INTEGER NOT NULL,
    account_age_days INTEGER NOT NULL,
    location_distance DOUBLE PRECISION NOT NULL,
    new_device BOOLEAN NOT NULL DEFAULT FALSE,
    international_transaction BOOLEAN NOT NULL DEFAULT FALSE,
    previous_transaction_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    fraud_probability DOUBLE PRECISION,
    risk_score INTEGER,
    risk_category VARCHAR(10),
    prediction INTEGER,
    review_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create model_evaluations table
CREATE TABLE IF NOT EXISTS public.model_evaluations (
    id SERIAL PRIMARY KEY,
    model_version VARCHAR(20) NOT NULL,
    model_name VARCHAR(50) NOT NULL DEFAULT 'RandomForestClassifier',
    dataset_name VARCHAR(100) NOT NULL,
    num_samples INTEGER,
    accuracy DOUBLE PRECISION NOT NULL,
    precision DOUBLE PRECISION NOT NULL,
    recall DOUBLE PRECISION NOT NULL,
    f1_score DOUBLE PRECISION NOT NULL,
    roc_auc DOUBLE PRECISION,
    confusion_matrix VARCHAR(100),
    feature_importances VARCHAR(1000),
    evaluation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create high-performance query indexes
CREATE INDEX IF NOT EXISTS ix_risk_category ON public.transactions (risk_category);
CREATE INDEX IF NOT EXISTS ix_review_status ON public.transactions (review_status);
CREATE INDEX IF NOT EXISTS ix_created_at ON public.transactions (created_at);
CREATE INDEX IF NOT EXISTS ix_transaction_id ON public.transactions (transaction_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow full access to postgres and service_role'
    ) THEN
        CREATE POLICY "Allow full access to postgres and service_role" 
        ON public.transactions FOR ALL 
        USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'model_evaluations' AND policyname = 'Allow full access to postgres and service_role'
    ) THEN
        CREATE POLICY "Allow full access to postgres and service_role" 
        ON public.model_evaluations FOR ALL 
        USING (true) WITH CHECK (true);
    END IF;
END $$;
