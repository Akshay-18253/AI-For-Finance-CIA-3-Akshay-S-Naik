"""Synthetic financial fraud dataset generator.

Generates realistic labeled financial transactions with distinct, real-world
financial crime typologies (Account Takeover, Velocity Attacks, International Carding,
Nocturnal Account Drains) with realistic class imbalance (~2.5% fraud rate).
"""

from __future__ import annotations

import os
from pathlib import Path
import numpy as np
import pandas as pd

DATASET_DIR = Path(__file__).resolve().parent
DATASET_PATH = DATASET_DIR / "transactions_dataset.csv"

TRANSACTION_TYPES = ["Payment", "Transfer", "Withdrawal", "Deposit"]
MERCHANT_CATEGORIES = [
    "Retail",
    "Grocery",
    "Travel",
    "Entertainment",
    "Electronics",
    "Online Services",
    "Other",
]


def generate_fraud_dataset(n_samples: int = 30000, random_state: int = 42) -> pd.DataFrame:
    """Generate a labeled financial transaction dataset with clear fraud typologies and realistic imbalance."""
    np.random.seed(random_state)

    # 1. Base Distributions for Normal Financial Activity
    type_probs = [0.48, 0.22, 0.18, 0.12]
    txn_types = np.random.choice(TRANSACTION_TYPES, size=n_samples, p=type_probs)

    cat_probs = [0.32, 0.26, 0.08, 0.12, 0.08, 0.10, 0.04]
    categories = np.random.choice(MERCHANT_CATEGORIES, size=n_samples, p=cat_probs)

    # Typical diurnal spending: higher in afternoon/evening, very low at night
    hour_probs = np.array([
        0.008, 0.005, 0.004, 0.004, 0.005, 0.010,  # 00-05
        0.025, 0.045, 0.060, 0.070, 0.075, 0.080,  # 06-11
        0.085, 0.080, 0.075, 0.070, 0.070, 0.075,  # 12-17
        0.080, 0.070, 0.050, 0.035, 0.020, 0.014,  # 18-23
    ])
    hour_probs /= hour_probs.sum()
    txn_hours = np.random.choice(24, size=n_samples, p=hour_probs)

    account_age_days = np.clip(np.random.exponential(scale=450, size=n_samples) + 1, 1, 3000).astype(int)

    # Typical historical spending baseline per user ($15 - $250)
    prev_amounts = np.round(np.random.lognormal(mean=3.9, sigma=0.75, size=n_samples), 2)
    prev_amounts = np.clip(prev_amounts, 5.0, 10000.0)

    # Standard velocity (transactions in last 24h: typically 1-3)
    recent_txn_counts = np.clip(np.random.poisson(lam=1.8, size=n_samples), 0, 12)

    # Standard proximity (km from home location: mostly within 15 km)
    location_distances = np.round(np.random.exponential(scale=10.0, size=n_samples), 2)

    # Standard device & foreign transaction baselines
    new_devices = (np.random.rand(n_samples) < 0.08).astype(int)
    international_txns = (np.random.rand(n_samples) < 0.04).astype(int)

    # Current amount closely tracks historical average for normal transactions (0.7x - 1.3x)
    base_amounts = np.round(prev_amounts * np.random.uniform(0.75, 1.25, size=n_samples), 2)

    # Category adjustments
    cat_multipliers = {
        "Retail": 1.0,
        "Grocery": 0.55,
        "Travel": 3.2,
        "Entertainment": 1.1,
        "Electronics": 3.0,
        "Online Services": 0.85,
        "Other": 1.0,
    }
    for cat, mult in cat_multipliers.items():
        mask = categories == cat
        base_amounts[mask] = np.round(base_amounts[mask] * mult, 2)

    # Binary fraud target: initialize all as legitimate (0)
    is_fraud = np.zeros(n_samples, dtype=int)

    # 2. Inject Ground-Truth Fraud Typologies (~2.5% of total records)
    fraud_indices = set()

    # Typology 1: Account Takeover (ATO) Spike (~180 cases)
    # Fraudster on new device + long distance + huge amount spike vs previous history
    ato_candidates = np.random.choice(n_samples, size=220, replace=False)
    for idx in ato_candidates:
        new_devices[idx] = 1
        location_distances[idx] = np.round(np.random.uniform(120.0, 1500.0), 2)
        base_amounts[idx] = np.round(prev_amounts[idx] * np.random.uniform(7.0, 25.0) + 500.0, 2)
        txn_types[idx] = np.random.choice(["Transfer", "Withdrawal"], p=[0.7, 0.3])
        is_fraud[idx] = 1
        fraud_indices.add(idx)

    # Typology 2: Rapid Velocity Card Testing (~150 cases)
    # Automated bot rapid attempts (recent_count >= 8) on online services or retail
    remaining = [i for i in range(n_samples) if i not in fraud_indices]
    velocity_candidates = np.random.choice(remaining, size=180, replace=False)
    for idx in velocity_candidates:
        recent_txn_counts[idx] = np.random.randint(8, 16)
        categories[idx] = np.random.choice(["Online Services", "Retail", "Electronics"])
        new_devices[idx] = np.random.choice([0, 1], p=[0.3, 0.7])
        base_amounts[idx] = np.round(np.random.uniform(25.0, 850.0), 2)
        is_fraud[idx] = 1
        fraud_indices.add(idx)

    # Typology 3: Cross-Border International Carding (~140 cases)
    # International transaction on new device buying high-value electronics / travel
    remaining = [i for i in range(n_samples) if i not in fraud_indices]
    intl_candidates = np.random.choice(remaining, size=160, replace=False)
    for idx in intl_candidates:
        international_txns[idx] = 1
        new_devices[idx] = 1
        categories[idx] = np.random.choice(["Electronics", "Travel"], p=[0.65, 0.35])
        base_amounts[idx] = np.round(np.random.uniform(1200.0, 7500.0), 2)
        location_distances[idx] = np.round(np.random.uniform(400.0, 4500.0), 2)
        is_fraud[idx] = 1
        fraud_indices.add(idx)

    # Typology 4: Nocturnal Fresh Account Bust-Out (~120 cases)
    # Fresh account (< 25 days old) doing large nocturnal transfer/withdrawal (hours 1-4 AM)
    remaining = [i for i in range(n_samples) if i not in fraud_indices]
    bustout_candidates = np.random.choice(remaining, size=140, replace=False)
    for idx in bustout_candidates:
        txn_hours[idx] = np.random.choice([1, 2, 3, 4])
        account_age_days[idx] = np.random.randint(1, 20)
        txn_types[idx] = np.random.choice(["Transfer", "Withdrawal"], p=[0.75, 0.25])
        base_amounts[idx] = np.round(np.random.uniform(1500.0, 12000.0), 2)
        new_devices[idx] = np.random.choice([0, 1], p=[0.2, 0.8])
        is_fraud[idx] = 1
        fraud_indices.add(idx)

    # Typology 5: Subtle / Borderline Fraud Cases (~60 cases)
    # Moderate deviation to give the ML model non-trivial edge cases
    remaining = [i for i in range(n_samples) if i not in fraud_indices]
    borderline_candidates = np.random.choice(remaining, size=70, replace=False)
    for idx in borderline_candidates:
        base_amounts[idx] = np.round(prev_amounts[idx] * np.random.uniform(3.5, 5.5), 2)
        recent_txn_counts[idx] = np.random.randint(4, 7)
        location_distances[idx] = np.round(np.random.uniform(45.0, 95.0), 2)
        is_fraud[idx] = 1
        fraud_indices.add(idx)

    # Add realistic false positives (legitimate users who travel or buy new gadgets)
    # Legitimate users with new device or long distance, but NOT fraud
    for _ in range(350):
        idx = np.random.randint(0, n_samples)
        if idx not in fraud_indices:
            location_distances[idx] = np.round(np.random.uniform(100.0, 1200.0), 2)
            if np.random.rand() < 0.4:
                new_devices[idx] = 1

    # Bounds check
    base_amounts = np.round(np.clip(base_amounts, 2.0, 50000.0), 2)
    location_distances = np.round(np.clip(location_distances, 0.1, 5000.0), 2)
    prev_amounts = np.round(np.clip(prev_amounts, 5.0, 15000.0), 2)

    df = pd.DataFrame({
        "transaction_amount": base_amounts,
        "transaction_type": txn_types,
        "merchant_category": categories,
        "transaction_hour": txn_hours,
        "recent_transaction_count": recent_txn_counts,
        "account_age_days": account_age_days,
        "location_distance": location_distances,
        "new_device": new_devices,
        "international_transaction": international_txns,
        "previous_transaction_amount": prev_amounts,
        "is_fraud": is_fraud,
    })

    return df


if __name__ == "__main__":
    print("Generating calibrated financial transactions dataset...")
    df = generate_fraud_dataset(n_samples=30000, random_state=42)
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATASET_PATH, index=False)
    fraud_rate = df["is_fraud"].mean() * 100
    print(f"Dataset successfully created at: {DATASET_PATH}")
    print(f"Total rows: {len(df):,}")
    print(f"Fraud count: {df['is_fraud'].sum():,} ({fraud_rate:.2f}%)")
    print(f"Legitimate count: {(len(df) - df['is_fraud'].sum()):,} ({100 - fraud_rate:.2f}%)")
