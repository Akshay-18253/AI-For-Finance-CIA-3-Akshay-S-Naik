# Dataset Documentation & Methodology
## AI-Powered Fraud Detection System

This document outlines the design, statistical distributions, domain assumptions, and fraud typology modeling utilized to construct the training and benchmark datasets for the platform.

---

## 1. Overview & Statistical Profile

To train the fraud detection model without exposing proprietary banking data or violating privacy regulations, the platform implements a domain-calibrated synthetic data generation engine (`backend/dataset/generate_dataset.py`) inspired by the **PaySim** financial simulator and empirical credit card fraud datasets.

- **Total Sample Population**: 30,000 transactions
- **Class Imbalance Ratio**:
  - Legitimate Transactions ($y=0$): **29,230 (97.43%)**
  - Fraudulent Transactions ($y=1$): **770 (2.57%)**
- **File Format**: Standard CSV with headers (`backend/dataset/transactions_dataset.csv`)

This realistic ~2.5% fraud rate mirrors real-world payment card networks, where fraud is a high-cost but rare event requiring specialized class-imbalance mitigation.

---

## 2. Feature Schema & Statistical Distributions

| Feature Name | Data Type | Range / Domain | Modeled Distribution | Financial Domain Rationale |
|---|---|---|---|---|
| `transaction_amount` | Float | $\$1.00 - \$50,000.00$ | Lognormal ($\mu=3.9, \sigma=0.75$) with category multiplier | Typical retail ticket size is $\$15 - \$200$; heavy right tail represents large settlements and attack spikes |
| `transaction_type` | Categorical | `Payment`, `Transfer`, `Withdrawal`, `Deposit` | Multinomial ($p=[0.48, 0.22, 0.18, 0.12]$) | Real-world clearing distribution across retail payments and banking transfers |
| `merchant_category` | Categorical | `Retail`, `Grocery`, `Travel`, `Entertainment`, `Electronics`, `Online Services`, `Other` | Multinomial ($p=[0.32, 0.26, 0.08, 0.12, 0.08, 0.10, 0.04]$) | Consumer spending pattern across common Merchant Category Codes (MCC) |
| `transaction_hour` | Integer | $0 - 23$ | Empirical Diurnal Curve | Reflects human circadian spending activity: peaks at 12:00–18:00, drops sharply at 01:00–05:00 |
| `recent_transaction_count`| Integer | $0 - 15$ | Poisson ($\lambda=1.8$) | Normal user frequency is 1–3 transactions/day; automated carding bots burst $>8$ |
| `account_age_days` | Integer | $1 - 3,000$ days | Exponential ($\beta=450$) | Distribution of mature accounts vs. newly registered accounts vulnerable to bust-out attacks |
| `location_distance` | Float | $0.1 - 5,000.0\text{ km}$ | Exponential ($\beta=10.0$) | Most transactions occur near user baseline ($<15\text{ km}$); remote attempts indicate compromised sessions |
| `new_device` | Integer (0/1)| $\{0, 1\}$ | Bernoulli ($p=0.08$) | Normal device churn is low ($8\%$); high-risk fraud frequently originates from fresh devices |
| `international_transaction`| Integer (0/1)| $\{0, 1\}$ | Bernoulli ($p=0.04$) | Foreign cross-border clearing is rare ($4\%$) but represents high per-incident loss exposure |
| `previous_transaction_amount`| Float | $\$5.00 - \$15,000.00$ | Lognormal ($\mu=3.9, \sigma=0.75$) | Historical moving average used as baseline to detect sudden velocity spikes |
| `is_fraud` (Target) | Integer (0/1)| $\{0, 1\}$ | Binary Ground Truth | $1 = \text{Fraudulent transaction}$, $0 = \text{Legitimate transaction}$ |

---

## 3. Ground-Truth Financial Fraud Typologies

Rather than applying uniform random noise, ground-truth fraud labels are constructed around five real-world financial crime vectors:

### 3.1 Typology 1: Account Takeover (ATO) Spike
- **Mechanism**: A malicious actor obtains credential access and attempts to rapidly liquidate account balances.
- **Data Signature**:
  - `new_device = 1`
  - `location_distance` $> 120.0\text{ km}$
  - `transaction_amount` spikes to $7\times - 25\times$ the user's historical baseline (`previous_transaction_amount`).
  - Channel typically concentrated in `Transfer` or `Withdrawal`.
- **Prevalence**: $\sim 220$ injected incidents.

### 3.2 Typology 2: Rapid Velocity Card Testing
- **Mechanism**: Automated scripts test stolen payment card credentials through rapid, low-to-medium value attempts.
- **Data Signature**:
  - `recent_transaction_count` $\ge 8$ attempts within 24 hours.
  - Channels concentrated in `Online Services` or `Retail`.
- **Prevalence**: $\sim 180$ injected incidents.

### 3.3 Typology 3: Cross-Border Luxury / Electronics Exploitation
- **Mechanism**: International carding rings purchase high-resale items (smartphones, airline tickets) across borders.
- **Data Signature**:
  - `international_transaction = 1`
  - `new_device = 1`
  - `merchant_category` $\in [\text{"Electronics"}, \text{"Travel"}]$
  - High ticket amount ($>\$1,200.00$) and high distance ($>400\text{ km}$).
- **Prevalence**: $\sim 160$ injected incidents.

### 3.4 Typology 4: Nocturnal Fresh Account Bust-Out
- **Mechanism**: Synthetically created or freshly registered "mule" accounts transacting during overnight hours.
- **Data Signature**:
  - `transaction_hour` $\in [1, 2, 3, 4]$ (01:00–04:00 AM)
  - `account_age_days` $< 25$ days old
  - High settlement value ($>\$1,500.00$) in `Transfer` or `Withdrawal`.
- **Prevalence**: $\sim 140$ injected incidents.

### 3.5 Typology 5: Subtle Borderline Edge Cases
- **Mechanism**: Moderate anomalies intended to test classifier boundary sensitivity.
- **Data Signature**: Moderate amount deviation ($3.5\times - 5.5\times$), velocity of $4 - 7$ events, distance $45 - 95\text{ km}$.
- **Prevalence**: $\sim 70$ injected incidents.

### 3.6 Realistic False Positives
To ensure the machine-learning model learns non-trivial multi-dimensional decision boundaries and does not simply memorize single-attribute rules, **350 legitimate transactions** were injected with non-fraudulent anomalies (e.g. traveling users purchasing items from a new laptop $>200\text{ km}$ away from home).

---

## 4. Class Imbalance Mitigation Strategy

1. **Stratified Splitting**: The dataset is partitioned into an $80/20$ train/test split utilizing `StratifiedShuffleSplit` on `is_fraud`, ensuring both training ($24,000$ samples) and testing ($6,000$ samples) splits maintain an identical $2.57\%$ fraud incidence rate.
2. **Balanced Subsample Cost Weighting**: The Random Forest classifier utilizes `class_weight='balanced'`, which automatically penalizes misclassifications of the rare fraud class inversely proportional to class frequencies:
   $$W_c = \frac{N}{2 \times N_c}$$
   Where $N$ is total training samples and $N_c$ is the count of class $c$.

