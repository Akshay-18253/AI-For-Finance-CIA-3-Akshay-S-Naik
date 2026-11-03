"""Database seeder for the AI-Powered Fraud Detection System.

Populates the SQLite database with 180 realistic demonstration transactions
spanning the past 30 days. Every single record runs through genuine ML inference
to compute authentic fraud probabilities, risk scores, and classifications.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

import numpy as np

from app.database import SessionLocal, init_db
from app.ml.inference import predict_transaction
from app.models.transaction import Transaction

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


def seed_database(num_transactions: int = 180, clear_existing: bool = True) -> int:
    """Populate database with realistic historical transactions."""
    random.seed(42)
    np.random.seed(42)

    init_db()
    db = SessionLocal()

    if clear_existing:
        print("Clearing existing transaction records...")
        db.query(Transaction).delete()
        db.commit()

    print(f"Generating and evaluating {num_transactions} demonstration transactions...")

    now = datetime.now(timezone.utc)
    records: list[Transaction] = []

    for i in range(num_transactions):
        # Determine transaction persona
        # 85% normal legitimate, 10% high-risk fraud, 5% borderline / medium risk
        roll = random.random()

        # Date distribution across past 25 days
        days_ago = random.uniform(0.1, 25.0)
        txn_timestamp = now - timedelta(days=days_ago)
        hour = txn_timestamp.hour

        if roll < 0.85:
            # --- Legitimate Normal Transaction ---
            txn_type = random.choices(
                TRANSACTION_TYPES, weights=[0.55, 0.20, 0.15, 0.10]
            )[0]
            cat = random.choices(
                MERCHANT_CATEGORIES, weights=[0.35, 0.30, 0.08, 0.10, 0.05, 0.08, 0.04]
            )[0]
            prev_amt = round(float(np.random.lognormal(3.8, 0.6)), 2)
            prev_amt = max(10.0, min(prev_amt, 450.0))
            amt = round(prev_amt * random.uniform(0.7, 1.3), 2)
            dist = round(float(np.random.exponential(8.0)), 1)
            recent_count = random.randint(0, 3)
            acc_age = random.randint(60, 1800)
            new_dev = random.random() < 0.06
            intl = random.random() < 0.03
            status = "Reviewed"

        elif roll < 0.95:
            # --- High Risk Fraud Event ---
            fraud_type = random.choice(["ATO", "International", "Nocturnal", "Velocity"])
            if fraud_type == "ATO":
                txn_type = "Transfer"
                cat = "Retail"
                prev_amt = round(random.uniform(25.0, 75.0), 2)
                amt = round(prev_amt * random.uniform(15.0, 45.0) + 1200.0, 2)
                dist = round(random.uniform(250.0, 1800.0), 1)
                new_dev = True
                intl = False
                recent_count = random.randint(2, 5)
                acc_age = random.randint(90, 800)
            elif fraud_type == "International":
                txn_type = "Payment"
                cat = "Electronics"
                prev_amt = round(random.uniform(60.0, 150.0), 2)
                amt = round(random.uniform(1800.0, 6500.0), 2)
                dist = round(random.uniform(600.0, 4500.0), 1)
                new_dev = True
                intl = True
                recent_count = random.randint(3, 7)
                acc_age = random.randint(40, 500)
            elif fraud_type == "Nocturnal":
                txn_type = "Withdrawal"
                cat = "Other"
                hour = random.choice([1, 2, 3, 4])
                txn_timestamp = txn_timestamp.replace(hour=hour)
                prev_amt = round(random.uniform(40.0, 100.0), 2)
                amt = round(random.uniform(2200.0, 8500.0), 2)
                dist = round(random.uniform(40.0, 180.0), 1)
                new_dev = random.choice([True, False])
                intl = False
                recent_count = random.randint(1, 4)
                acc_age = random.randint(2, 18)
            else:  # Velocity
                txn_type = "Payment"
                cat = "Online Services"
                prev_amt = round(random.uniform(30.0, 90.0), 2)
                amt = round(random.uniform(350.0, 1200.0), 2)
                dist = round(random.uniform(10.0, 80.0), 1)
                new_dev = True
                intl = False
                recent_count = random.randint(8, 14)
                acc_age = random.randint(15, 300)

            # Realistic review status distribution for high-risk
            status = random.choices(
                ["Pending", "Under Review", "Confirmed Fraud", "False Positive"],
                weights=[0.40, 0.30, 0.20, 0.10],
            )[0]

        else:
            # --- Borderline / Medium Risk Event ---
            txn_type = random.choice(["Payment", "Transfer"])
            cat = random.choice(["Travel", "Electronics", "Entertainment"])
            prev_amt = round(random.uniform(50.0, 120.0), 2)
            amt = round(prev_amt * random.uniform(3.0, 5.5), 2)
            dist = round(random.uniform(45.0, 110.0), 1)
            new_dev = random.choice([True, False])
            intl = random.choice([True, False])
            recent_count = random.randint(4, 6)
            acc_age = random.randint(30, 200)

            status = random.choices(
                ["Pending", "Reviewed", "Under Review"],
                weights=[0.50, 0.35, 0.15],
            )[0]

        txn_input = {
            "transaction_amount": amt,
            "transaction_type": txn_type,
            "merchant_category": cat,
            "transaction_hour": hour,
            "recent_transaction_count": recent_count,
            "account_age_days": acc_age,
            "location_distance": dist,
            "new_device": new_dev,
            "international_transaction": intl,
            "previous_transaction_amount": prev_amt,
        }

        # Run genuine ML inference
        pred = predict_transaction(txn_input)

        record = Transaction(
            transaction_amount=amt,
            transaction_type=txn_type,
            merchant_category=cat,
            transaction_hour=hour,
            recent_transaction_count=recent_count,
            account_age_days=acc_age,
            location_distance=dist,
            new_device=new_dev,
            international_transaction=intl,
            previous_transaction_amount=prev_amt,
            fraud_probability=pred["fraud_probability"],
            risk_score=pred["risk_score"],
            risk_category=pred["risk_category"],
            prediction=pred["prediction"],
            review_status=status,
            created_at=txn_timestamp,
        )
        records.append(record)

    db.add_all(records)
    db.commit()

    count = db.query(Transaction).count()
    flagged = (
        db.query(Transaction)
        .filter(Transaction.risk_category.in_(["HIGH", "MEDIUM"]))
        .count()
    )
    print(f"Database seeded successfully with {count} transactions ({flagged} flagged).")
    db.close()
    return count


if __name__ == "__main__":
    seed_database(180)
