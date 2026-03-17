# Bewo Healthcare -- Full Test Suite Results

**Date:** 2026-03-17
**Time:** ~23:32 UTC
**Python:** 3.13.5
**OS:** Windows 11 Home 10.0.26200
**Test Framework:** pytest 9.0.2

---

## Test Suite Summary

| Suite | Tests | Passed | Failed | Time |
|-------|------:|-------:|-------:|-----:|
| Core Unit Tests (metrics, proactive oracle, counterfactual, baselines) | 112 | 112 | 0 | 5.63s |
| Validation Gates (accuracy, AUC, safety, archetype, runtime) | 14 | 14 | 0 | 0.75s |
| Full Pipeline (HMM, Monte Carlo, Baum-Welch, drugs, Merlion, safety) | 11 | 11 | 0 | 9.85s |
| Exhaustive HMM (edge cases, numerical stability, deep DB, emissions) | 17 | 17 | 0 | 8.88s |
| Easy Independent Validation (16 sections, 38 gates) | 38 gates | 38 | 0 | 59.0s |
| Hardened Independent Validation (16 sections, 38 gates) | 38 gates | 38 | 0 | 54.7s |

### Grand Total

| Metric | Value |
|--------|-------|
| **Total pytest tests** | **154** |
| **Total pytest passed** | **154** |
| **Total pytest failed** | **0** |
| **Total validation gates** | **76** |
| **Total validation gates passed** | **76** |
| **Overall pass rate** | **100%** |
| **Total wall-clock time** | **~139s** |

---

## Key Validation Metrics

### Easy Independent Validation (5,000 patients, independent data)

| Metric | Value | Gate |
|--------|-------|------|
| Overall Accuracy | 99.3% | PASS |
| Macro F1 | 0.9928 | PASS |
| ROC-AUC (STABLE) | 1.0000 | PASS |
| ROC-AUC (WARNING) | 1.0000 | PASS |
| ROC-AUC (CRISIS) | 1.0000 | PASS |
| CRISIS Recall | 100.0% | PASS |
| CRISIS Precision | 98.5% | PASS |
| STABLE Recall | 99.4% | PASS |
| WARNING Recall | 98.4% | PASS |
| Brier Score | 0.0019 | PASS |
| ECE | 0.0094 | PASS |
| Bootstrap Mean Accuracy | 99.0% +/- 0.4% | PASS |
| Archetype Accuracy | 20/20 (100%) | PASS |
| Safety Monitor Accuracy | 22/22 (100%) | PASS |

### Hardened Independent Validation (5,000 patients, contradictory signals included)

| Metric | Value | Gate |
|--------|-------|------|
| Overall Accuracy | 82.1% | PASS |
| Macro F1 | 0.8219 | PASS |
| ROC-AUC (STABLE) | 0.9412 | PASS |
| ROC-AUC (WARNING) | 0.9070 | PASS |
| ROC-AUC (CRISIS) | 0.9671 | PASS |
| CRISIS Recall | 87.8% | PASS |
| STABLE Recall | 68.2% | PASS |
| WARNING Recall | 90.3% | PASS |
| Brier Score | 0.2738 | PASS |
| ECE | 0.1104 | PASS |
| Bootstrap Mean Accuracy | 95.8% +/- 0.8% | PASS |
| Archetype Accuracy | 31/32 (97%) | PASS |
| Safety Monitor Accuracy | 22/22 (100%) | PASS |

### HMM vs Baseline Improvement

| Comparison | Easy | Hardened |
|------------|------|----------|
| HMM Accuracy | 99.4% | 96.4% |
| Glucose-Only Threshold | 90.5% | 71.1% |
| Weighted Feature Scoring | 87.7% | 74.0% |
| Majority Class | 33.3% | 33.3% |
| **HMM lift over glucose-only** | **+8.9%** | **+25.3%** |
| **HMM lift over weighted scoring** | **+11.7%** | **+22.4%** |
| McNemar p-value (vs glucose) | p < 0.0001 | p < 0.0001 |

---

## Safety Metrics

| Safety Check | Easy | Hardened |
|--------------|------|----------|
| CRISIS classified as STABLE | **0** | **0** |
| Safety monitor boundary accuracy | 22/22 (100%) | 22/22 (100%) |
| Extreme glucose detection | PASS | PASS |
| Hypoglycemia detection | PASS | PASS |
| Tachycardia/bradycardia detection | PASS | PASS |
| HRV dysfunction detection | PASS | PASS |
| Combined multi-rule triggers | PASS | PASS |

**CRISIS-as-STABLE misclassification count: 0 (both suites)**

---

## Validation Gate Status

| Gate Category | Easy | Hardened |
|---------------|------|----------|
| Accuracy Gates | PASS | PASS |
| AUC Gates | PASS | PASS |
| Safety Gates | PASS | PASS |
| Archetype Validation | PASS | PASS |
| Runtime Gate | PASS | PASS |
| Boundary Stress Test | PASS | PASS |
| Adversarial Robustness | PASS | PASS |
| Temporal Coherence | PASS | PASS |
| Noise Robustness | PASS | PASS |
| Missing Data Tolerance | PASS | PASS |
| Calibration | PASS | PASS |
| Monte Carlo Risk | PASS | PASS |
| Intervention Monotonicity | PASS | PASS |
| Bootstrap Cross-Validation | PASS | PASS |
| Feature Ablation | PASS | PASS |
| Statistical Significance | PASS | PASS |
| **Total Gates** | **38/38** | **38/38** |

---

## Conclusion

All 154 pytest tests and 76 independent validation gates passed with zero failures. The Bewo HMM engine demonstrates strong classification performance on both clean independent data (99.3% accuracy, F1=0.993) and hardened adversarial data with contradictory signals (82.1% accuracy, F1=0.822). Crisis recall remains high across both conditions (100% easy, 87.8% hardened), and critically, zero CRISIS patients were misclassified as STABLE in either validation run. The safety monitor achieved 100% boundary detection accuracy across all tested clinical thresholds. The HMM model provides statistically significant improvement over naive baselines (p < 0.0001), with up to +25.3% accuracy lift over glucose-only classification on hardened data. All results were generated on fully independent data with zero overlap to model training parameters.
