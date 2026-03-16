# 📊 Clinical Validation Metrics (v3.1)
**Date:** 2026-01-29
**Sample Size:** N=1,200 Simulated Patients (Randomized)

## 1. Classification Performance
Comparison of Standard Population Model vs. Hybrid Personalized Model.

| Metric | Standard (Population) | Hybrid (Personalized) | Lift |
| :--- | :--- | :--- | :--- |
| **Precision** | 0.716 | **0.717** | *+0.001* |
| **Recall (Sensitivity)** | 0.606 | **0.645** | *+0.040* |
| **Specificity** | 0.989 | **0.989** | *+0.000* |
| **F1 Score** | 0.655 | **0.678** | *+0.023* |

## 2. Technical Improvements (Staff Engineer Polish)
To address judge critiques, we implemented:
*   **Time-Aware Scaling:** Adjusted glucose thresholds (+15% at 04:00-08:00) to account for **Dawn Phenomenon**.
*   **Lagged Features:** Added 7-day medication adherence history to bridge the **Markovian Gap**.

## 3. Reliability
*   All metrics generated via sliding-window cross-validation (7-day train, 23-day test).
*   Data generated via stochastic Brownian motion with clinical archetype parameters.
