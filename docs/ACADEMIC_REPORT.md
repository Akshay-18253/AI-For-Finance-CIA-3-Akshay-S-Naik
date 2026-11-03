# Academic Project Assessment Report
## Course: Semester 3 — Artificial Intelligence for Finance
### Project Title: AI-Powered Fraud Detection System

---

## Executive Abstract

Digital banking and payment networks process trillions of dollars in transactions annually, making them prime targets for sophisticated financial crime. This academic project presents the design, mathematical formulation, and end-to-end full-stack implementation of an **AI-Powered Fraud Detection System**. 

The system utilizes an ensemble **Random Forest Classifier** trained with balanced subsample cost-weighting to combat extreme class imbalance ($2.57\%$ fraud prevalence across $30,000$ transactions). It is paired with an **Isolation Forest** for multi-dimensional anomaly detection and a **Transparent Rule Observer** providing explainable diagnostic observations for compliance officers. Evaluated against an unseen $6,000$-sample holdout test partition, the model achieves **$98.05\%$ Fraud Recall**, **$98.69\%$ Precision**, and an **ROC-AUC of $0.9999$**, successfully intercepting $151$ out of $154$ simulated fraud attacks while generating only $2$ false alarms ($0.03\%$ false positive rate).

---

## 1. Problem Statement & Financial Domain Significance

Traditional financial surveillance relies heavily on heuristic rule engines (e.g., *“flag if amount > \$5,000”*). While interpretable, static rule systems face fundamental operational limitations:
1. **Curse of Rigidity**: Attackers systematically probe and reverse-engineer static thresholds, staying just below detection triggers.
2. **False Positive Fatigue**: Overly conservative rule engines generate tens of thousands of false alerts daily, overwhelming human investigation teams and degrading customer experience.
3. **Compound Risk Blindness**: A \$180 transaction from a new device in a foreign city at 03:00 AM may not trigger any individual amount or location rule, yet the *compound multivariate interaction* represents a high probability of account takeover.

Machine-learning classifiers overcome these challenges by mapping complex, non-linear multi-dimensional interactions across behavioral, spatial, temporal, and monetary dimensions.

---

## 2. Methodology & Mathematical Formulation

### 2.1 Feature Derivation & Domain Representation
To avoid raw absolute bias and normalize heavy-tailed distributions, four domain-specific features are engineered:
- **Velocity Ratio**:
  $$R_{\text{amt}} = \frac{A_{\text{current}}}{A_{\text{historical}} + 1.0}$$
- **Log Transformation**:
  $$L_{\text{amt}} = \ln(1 + A_{\text{current}})$$
- **Nocturnal Activity Indicator**:
  $$I_{\text{night}} = \mathbb{I}(H \in \{0, 1, 2, 3, 4, 5, 23\})$$
- **Compound Security Risk Indicator**:
  $$S_{\text{risk}} = D_{\text{new}} + I_{\text{intl}}$$

### 2.2 Cost-Sensitive Balanced Class Weighting
In financial fraud detection, the asymmetric loss matrix dictates that a False Negative (undetected fraud resulting in direct capital loss and chargeback fees) is substantially more severe than a False Positive (a temporary verification challenge):
$$C(\text{FN}) \gg C(\text{FP})$$

To counter the $97.43\% : 2.57\%$ class disparity without synthetic data distortion (e.g. SMOTE boundary artifacts), the Random Forest optimization minimizes weighted Gini impurity:
$$W_0 = \frac{N}{2 \times N_0} \approx 0.513, \quad W_1 = \frac{N}{2 \times N_1} \approx 19.48$$

Every fraudulent sample carries $\sim 38\times$ higher cost penalty during tree node splitting, forcing trees to isolate rare fraud topologies effectively.

---

## 3. Empirical Results & Comparative Analysis

The model was evaluated against a held-out test split of $6,000$ transactions:

```
                          CONFUSION MATRIX
                    Predicted Legit    Predicted Fraud    Total Actual
Actual Legit (0)         5,844                 2              5,846
Actual Fraud (1)             3               151                154
Total Predicted          5,847               153              6,000
```

### Key Performance Indices:
- **Accuracy**: $99.92\%$
- **Precision**: $\frac{151}{151 + 2} = 98.69\%$
- **Recall (Sensitivity)**: $\frac{151}{151 + 3} = 98.05\%$
- **F1-Score**: $2 \times \frac{0.9869 \times 0.9805}{0.9869 + 0.9805} = 98.37\%$
- **ROC-AUC**: $0.9999$

### Feature Importance Attribution:
Analysis of Mean Decrease in Impurity (MDI) revealed that the single most influential predictor is the **amount-to-previous ratio ($25.81\%$)**, followed by absolute **transaction amount ($20.03\%$)**, **log amount ($17.39\%$)**, and **unrecognized device flag ($10.46\%$)**.

---

## 4. Ethical, Regulatory & Governance Considerations

1. **Human-in-the-Loop Triage**: The system explicitly treats ML outputs as probabilistic risk scores ($0–100$), routing flagged transactions to human analysts via the Alert Monitoring Center rather than executing irrevocable payment blocks automatically.
2. **Explainability & Transparency**: As mandated by financial compliance standards (e.g. Fair Credit Reporting Act, GDPR Article 22), the platform presents transparent heuristic diagnostic cues alongside statistical probability estimates to assist human audits.
3. **Absence of Protected Demographics**: The model features are strictly behavioral, spatial, temporal, and monetary. No demographic, gender, ethnic, or personal identifiers are incorporated, mitigating disparate impact and algorithmic bias.

---

## 5. Academic Conclusion

This project demonstrates that combining domain-specific feature engineering, balanced cost-sensitive ensemble trees, and modern web application architecture yields a functional, institutional-grade fraud detection platform. The system satisfies all requirements of the Continuous Internal Assessment (CIA) for Semester 3: Artificial Intelligence for Finance.

