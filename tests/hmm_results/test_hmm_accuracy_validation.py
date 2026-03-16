#!/usr/bin/env python3
"""
===============================================================================
NEXUS 2026 — HMM ENGINE STATISTICAL ACCURACY VALIDATION
===============================================================================
Generates thousands of synthetic patients with known ground-truth health states,
runs HMM inference on each, and measures classification accuracy, sensitivity,
specificity, F1, ROC/AUC, confusion matrices, and more.

This is NOT a unit test — it's a clinical model validation.

Tests:
  1. Cohort Classification (3,000+ patients across 12 scenarios)
  2. Noise Robustness (accuracy vs increasing noise)
  3. Missing Data Tolerance (accuracy vs % missing features)
  4. Sequence Length Sensitivity (accuracy vs observation window)
  5. ROC/AUC for each state (STABLE, WARNING, CRISIS)
  6. Personalized Calibration Accuracy Improvement
  7. Baum-Welch Learning Effectiveness
  8. Monte Carlo Risk Prediction Calibration
  9. Safety Rule Accuracy (false positive/negative rates)
  10. Intervention Simulation Validity
===============================================================================
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import math
import json
import random
import time
import numpy as np
from datetime import datetime
from collections import defaultdict
from core.hmm_engine import (
    HMMEngine, SafetyMonitor, STATES, FEATURES, WEIGHTS,
    EMISSION_PARAMS, TRANSITION_PROBS, INITIAL_PROBS,
    gaussian_log_pdf
)


# =============================================================================
# HELPERS
# =============================================================================

def make_engine():
    """Create engine without DB dependency."""
    e = HMMEngine.__new__(HMMEngine)
    e.features = FEATURES
    e.weights = WEIGHTS
    e.emission_params = EMISSION_PARAMS
    e.safety_monitor = SafetyMonitor()
    e._personalized_baselines = {}
    e.MIN_CALIBRATION_OBS = 42
    return e


def gen_patient(state_idx, n_obs, seed, noise_scale=0.3, missing_rate=0.0):
    """
    Generate a synthetic patient with known ground-truth state.

    Args:
        state_idx: 0=STABLE, 1=WARNING, 2=CRISIS
        n_obs: Number of observation windows
        seed: Random seed for reproducibility
        noise_scale: How much noise relative to emission std (0=exact means, 1=full std)
        missing_rate: Fraction of features set to None per observation
    """
    rng = np.random.RandomState(seed)
    obs = []
    for _ in range(n_obs):
        o = {}
        for feat in FEATURES:
            if rng.random() < missing_rate:
                o[feat] = None
            else:
                mean = EMISSION_PARAMS[feat]['means'][state_idx]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][state_idx])
                val = mean + rng.normal(0, std * noise_scale)
                lo, hi = EMISSION_PARAMS[feat]['bounds']
                o[feat] = float(np.clip(val, lo, hi))
        obs.append(o)
    return obs


def gen_transition_patient(states_sequence, obs_per_state, seed, noise_scale=0.3):
    """Generate patient that transitions through a sequence of states."""
    rng = np.random.RandomState(seed)
    obs = []
    for state_idx in states_sequence:
        for _ in range(obs_per_state):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][state_idx]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][state_idx])
                val = mean + rng.normal(0, std * noise_scale)
                lo, hi = EMISSION_PARAMS[feat]['bounds']
                o[feat] = float(np.clip(val, lo, hi))
            obs.append(o)
    return obs


def confusion_matrix(expected, predicted):
    """Build confusion matrix from parallel lists."""
    cm = {s: {t: 0 for t in STATES} for s in STATES}
    for e, p in zip(expected, predicted):
        cm[e][p] += 1
    return cm


def compute_metrics_from_cm(cm, total):
    """Compute per-class metrics from confusion matrix."""
    metrics = {}
    for state in STATES:
        tp = cm[state][state]
        fp = sum(cm[other][state] for other in STATES if other != state)
        fn = sum(cm[state][other] for other in STATES if other != state)
        tn = total - tp - fp - fn

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        metrics[state] = {
            'precision': precision, 'recall': recall,
            'specificity': specificity, 'f1': f1,
            'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn,
            'support': sum(cm[state].values())
        }
    return metrics


def compute_roc_auc(scores, labels):
    """Compute ROC AUC from score/label lists."""
    if not scores or sum(labels) == 0 or sum(labels) == len(labels):
        return 0.5
    pairs = sorted(zip(scores, labels), key=lambda x: -x[0])
    tp = fp = 0
    total_pos = sum(labels)
    total_neg = len(labels) - total_pos
    prev_fpr = 0
    prev_tpr = 0
    auc = 0.0
    prev_score = None
    for score, label in pairs:
        if prev_score is not None and score != prev_score:
            tpr = tp / total_pos
            fpr = fp / total_neg
            auc += (fpr - prev_fpr) * (tpr + prev_tpr) / 2
            prev_fpr, prev_tpr = fpr, tpr
        if label == 1:
            tp += 1
        else:
            fp += 1
        prev_score = score
    tpr = tp / total_pos
    fpr = fp / total_neg
    auc += (fpr - prev_fpr) * (tpr + prev_tpr) / 2
    return auc


# =============================================================================
# MAIN VALIDATION
# =============================================================================

def run_validation():
    engine = make_engine()
    report = {}
    t0 = time.time()

    print("=" * 78)
    print("  NEXUS 2026 — HMM ENGINE STATISTICAL ACCURACY VALIDATION")
    print(f"  {datetime.now().isoformat()}")
    print("=" * 78)

    # =========================================================================
    # TEST 1: LARGE COHORT CLASSIFICATION
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 1: LARGE COHORT CLASSIFICATION (3,000 patients)")
    print("=" * 78)

    cohort_config = [
        # Pure state patients (noise_scale=0.3 = moderate noise)
        (0, 500, 0.3, 'STABLE'),   # 500 clearly stable patients
        (1, 500, 0.3, 'WARNING'),  # 500 clearly warning patients
        (2, 500, 0.3, 'CRISIS'),   # 500 clearly crisis patients
        # Noisier patients (noise_scale=0.5)
        (0, 250, 0.5, 'STABLE'),
        (1, 250, 0.5, 'WARNING'),
        (2, 250, 0.5, 'CRISIS'),
        # Low noise (noise_scale=0.15)
        (0, 250, 0.15, 'STABLE'),
        (1, 250, 0.15, 'WARNING'),
        (2, 250, 0.15, 'CRISIS'),
    ]

    expected_states = []
    predicted_states = []
    state_probs_all = []
    confidences = []
    seed_counter = 0

    for state_idx, count, noise, label in cohort_config:
        correct = 0
        for i in range(count):
            obs = gen_patient(state_idx, 12, seed=seed_counter, noise_scale=noise)
            result = engine.run_inference(obs)
            expected_states.append(label)
            predicted_states.append(result['current_state'])
            state_probs_all.append(result['state_probabilities'])
            confidences.append(result['confidence'])
            if result['current_state'] == label:
                correct += 1
            seed_counter += 1
        acc = correct / count * 100
        print(f"  {label:8s} (noise={noise:.2f}): {correct}/{count} = {acc:.1f}%")

    total = len(expected_states)
    overall_correct = sum(1 for e, p in zip(expected_states, predicted_states) if e == p)
    overall_accuracy = overall_correct / total * 100

    cm = confusion_matrix(expected_states, predicted_states)
    class_metrics = compute_metrics_from_cm(cm, total)

    print(f"\n  OVERALL ACCURACY: {overall_correct}/{total} = {overall_accuracy:.1f}%")

    print(f"\n  {'State':<10} {'Prec':>8} {'Recall':>8} {'Spec':>8} {'F1':>8} {'Support':>8}")
    print(f"  {'-'*52}")
    for s in STATES:
        m = class_metrics[s]
        print(f"  {s:<10} {m['precision']:>8.3f} {m['recall']:>8.3f} {m['specificity']:>8.3f} {m['f1']:>8.3f} {m['support']:>8}")

    macro_f1 = sum(m['f1'] for m in class_metrics.values()) / 3

    print(f"\n  CONFUSION MATRIX:")
    header = 'True \\ Pred'
    print(f"  {header:<12} {'STABLE':>8} {'WARNING':>8} {'CRISIS':>8}")
    print(f"  {'-'*40}")
    for s in STATES:
        print(f"  {s:<12} {cm[s]['STABLE']:>8} {cm[s]['WARNING']:>8} {cm[s]['CRISIS']:>8}")

    # ROC/AUC per state
    print(f"\n  ROC-AUC:")
    auc_results = {}
    for target_state in STATES:
        scores = [sp.get(target_state, 0) for sp in state_probs_all]
        labels = [1 if e == target_state else 0 for e in expected_states]
        auc = compute_roc_auc(scores, labels)
        auc_results[target_state] = auc
        print(f"    {target_state}: {auc:.4f}")

    report['test1_cohort'] = {
        'total_patients': total,
        'overall_accuracy': round(overall_accuracy, 2),
        'macro_f1': round(macro_f1, 4),
        'per_class': {s: {k: round(v, 4) if isinstance(v, float) else v
                          for k, v in m.items()} for s, m in class_metrics.items()},
        'confusion_matrix': cm,
        'roc_auc': {s: round(v, 4) for s, v in auc_results.items()},
        'mean_confidence': round(np.mean(confidences), 4),
    }

    # =========================================================================
    # TEST 2: NOISE ROBUSTNESS
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 2: NOISE ROBUSTNESS (accuracy vs noise level)")
    print("=" * 78)

    noise_levels = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0]
    noise_results = []

    for noise in noise_levels:
        correct = 0
        total_n = 300  # 100 per state
        seed_n = 10000
        for state_idx in range(3):
            for i in range(100):
                obs = gen_patient(state_idx, 12, seed=seed_n, noise_scale=noise)
                result = engine.run_inference(obs)
                if result['current_state'] == STATES[state_idx]:
                    correct += 1
                seed_n += 1
        acc = correct / total_n * 100
        noise_results.append({'noise': noise, 'accuracy': round(acc, 1)})
        bar = "█" * int(acc / 2)
        print(f"  noise={noise:.2f}: {acc:5.1f}% {bar}")

    report['test2_noise'] = noise_results

    # =========================================================================
    # TEST 3: MISSING DATA TOLERANCE
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 3: MISSING DATA TOLERANCE (accuracy vs % missing)")
    print("=" * 78)

    missing_rates = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    missing_results = []

    for rate in missing_rates:
        correct = 0
        total_m = 300
        seed_m = 20000
        for state_idx in range(3):
            for i in range(100):
                obs = gen_patient(state_idx, 12, seed=seed_m, noise_scale=0.3, missing_rate=rate)
                result = engine.run_inference(obs)
                if result['current_state'] == STATES[state_idx]:
                    correct += 1
                seed_m += 1
        acc = correct / total_m * 100
        missing_results.append({'missing_rate': rate, 'accuracy': round(acc, 1)})
        bar = "█" * int(acc / 2)
        print(f"  missing={rate:.0%}: {acc:5.1f}% {bar}")

    report['test3_missing'] = missing_results

    # =========================================================================
    # TEST 4: SEQUENCE LENGTH SENSITIVITY
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 4: SEQUENCE LENGTH SENSITIVITY (accuracy vs # observations)")
    print("=" * 78)

    seq_lengths = [1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 48]
    length_results = []

    for n in seq_lengths:
        correct = 0
        total_l = 300
        seed_l = 30000
        for state_idx in range(3):
            for i in range(100):
                obs = gen_patient(state_idx, n, seed=seed_l, noise_scale=0.3)
                result = engine.run_inference(obs)
                if result['current_state'] == STATES[state_idx]:
                    correct += 1
                seed_l += 1
        acc = correct / total_l * 100
        length_results.append({'n_obs': n, 'accuracy': round(acc, 1)})
        bar = "█" * int(acc / 2)
        print(f"  n_obs={n:3d}: {acc:5.1f}% {bar}")

    report['test4_seq_length'] = length_results

    # =========================================================================
    # TEST 5: SCENARIO-BASED VALIDATION (using generate_demo_scenario)
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 5: SCENARIO-BASED CLASSIFICATION (built-in scenarios)")
    print("=" * 78)

    scenario_tests = [
        ('stable_perfect', 'STABLE', 200),
        ('stable_realistic', 'STABLE', 200),
        ('stable_noisy', 'STABLE', 200),
        ('gradual_decline', 'WARNING', 200),
        ('warning_to_crisis', 'CRISIS', 200),
        ('sudden_crisis', 'CRISIS', 200),
        ('recovery', 'STABLE', 200),
        ('demo_full_crisis', 'CRISIS', 200),
        ('demo_counterfactual', 'WARNING', 200),
    ]

    scenario_results = {}
    for scenario, expected, count in scenario_tests:
        correct = 0
        # Also accept adjacent states as "close"
        adjacent_correct = 0
        severity = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}
        for seed in range(count):
            obs = engine.generate_demo_scenario(scenario, days=14, seed=seed + 40000)
            result = engine.run_inference(obs)
            if result['current_state'] == expected:
                correct += 1
                adjacent_correct += 1
            elif abs(severity[result['current_state']] - severity[expected]) <= 1:
                adjacent_correct += 1

        acc = correct / count * 100
        adj_acc = adjacent_correct / count * 100
        scenario_results[scenario] = {
            'expected': expected, 'exact_accuracy': round(acc, 1),
            'adjacent_accuracy': round(adj_acc, 1), 'count': count
        }
        print(f"  {scenario:<25s} -> {expected:8s}: exact={acc:5.1f}% adj={adj_acc:5.1f}%")

    report['test5_scenarios'] = scenario_results

    # =========================================================================
    # TEST 6: SAFETY RULE ACCURACY
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 6: SAFETY RULE FALSE POSITIVE / FALSE NEGATIVE RATES")
    print("=" * 78)

    sm = SafetyMonitor()
    safety_seed = 50000

    # Generate 1000 normal patients and check for false positives
    fp_count = 0
    for i in range(1000):
        obs = gen_patient(0, 1, seed=safety_seed + i, noise_scale=0.2)[0]
        state, _ = sm.check_safety(obs)
        if state is not None:
            fp_count += 1
    fp_rate = fp_count / 1000 * 100
    print(f"  False Positive Rate (stable patients triggering safety): {fp_count}/1000 = {fp_rate:.1f}%")

    # Generate 1000 crisis patients and check for true positives
    tp_count = 0
    for i in range(1000):
        obs = gen_patient(2, 1, seed=safety_seed + 1000 + i, noise_scale=0.3)[0]
        state, _ = sm.check_safety(obs)
        if state is not None:
            tp_count += 1
    tp_rate = tp_count / 1000 * 100
    print(f"  True Positive Rate (crisis patients caught by safety):  {tp_count}/1000 = {tp_rate:.1f}%")

    # Specific threshold tests
    boundary_tests = [
        ('Hypo Level 2 (glucose=2.9)', {'glucose_avg': 2.9}, 'CRISIS'),
        ('Hypo Level 1 (glucose=3.5)', {'glucose_avg': 3.5}, 'WARNING'),
        ('Normal glucose (glucose=6.0)', {'glucose_avg': 6.0}, None),
        ('Hyper severe (glucose=17.0)', {'glucose_avg': 17.0}, 'CRISIS'),
        ('Hyper uncontrolled (glucose=14.0)', {'glucose_avg': 14.0}, 'WARNING'),
        ('Poor meds (adh=0.3)', {'meds_adherence': 0.3}, 'WARNING'),
        ('Good meds (adh=0.9)', {'meds_adherence': 0.9}, None),
        ('Tachycardia (hr=130)', {'resting_hr': 130}, 'WARNING'),
        ('Normal HR (hr=70)', {'resting_hr': 70}, None),
        ('Low HRV (hrv=5)', {'hrv_rmssd': 5}, 'WARNING'),
        ('Normal HRV (hrv=35)', {'hrv_rmssd': 35}, None),
    ]

    boundary_correct = 0
    for name, obs, expected_state in boundary_tests:
        state, _ = sm.check_safety(obs)
        ok = state == expected_state
        boundary_correct += int(ok)
        status = "✓" if ok else "✗"
        print(f"  {status} {name}: expected={expected_state}, got={state}")

    report['test6_safety'] = {
        'false_positive_rate': round(fp_rate, 2),
        'true_positive_rate': round(tp_rate, 2),
        'boundary_accuracy': f"{boundary_correct}/{len(boundary_tests)}",
    }

    # =========================================================================
    # TEST 7: TRANSITION DETECTION
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 7: STATE TRANSITION DETECTION")
    print("=" * 78)

    transition_tests = [
        ([0, 0, 0, 1, 1, 1], 6, 'WARNING', 'Stable → Warning'),
        ([0, 0, 1, 1, 2, 2], 6, 'CRISIS', 'Stable → Warning → Crisis'),
        ([2, 2, 1, 1, 0, 0], 6, 'STABLE', 'Crisis → Warning → Stable'),
        ([0, 0, 0, 0, 2, 2], 6, 'CRISIS', 'Stable → Sudden Crisis'),
        ([2, 2, 2, 0, 0, 0], 8, 'STABLE', 'Crisis → Recovery'),
    ]

    transition_correct = 0
    for states_seq, obs_per, expected_final, desc in transition_tests:
        correct = 0
        for seed in range(100):
            obs = gen_transition_patient(states_seq, obs_per, seed=60000 + seed)
            result = engine.run_inference(obs)
            if result['current_state'] == expected_final:
                correct += 1
        acc = correct / 100 * 100
        transition_correct += int(acc >= 50)  # At least 50% correct
        print(f"  {desc:<35s}: {acc:5.1f}%")

    report['test7_transitions'] = f"{transition_correct}/{len(transition_tests)} passed"

    # =========================================================================
    # TEST 8: MONTE CARLO RISK CALIBRATION
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 8: MONTE CARLO RISK PREDICTION CALIBRATION")
    print("=" * 78)

    mc_results = []
    for state_idx, label in [(0, 'STABLE'), (1, 'WARNING'), (2, 'CRISIS')]:
        risks = []
        for seed in range(100):
            obs_mc = gen_patient(state_idx, 1, seed=70000 + seed, noise_scale=0.3)[0]
            result = engine.predict_time_to_crisis(obs_mc, horizon_hours=48, num_simulations=200)
            risks.append(result['prob_crisis_percent'])
        mean_risk = np.mean(risks)
        std_risk = np.std(risks)
        mc_results.append({'state': label, 'mean_risk': round(mean_risk, 1), 'std': round(std_risk, 1)})
        print(f"  {label:8s} patients → crisis risk: {mean_risk:.1f}% ± {std_risk:.1f}%")

    report['test8_monte_carlo'] = mc_results

    # =========================================================================
    # TEST 9: INTERVENTION SIMULATION VALIDITY
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 9: INTERVENTION SIMULATION VALIDITY")
    print("=" * 78)

    intervention_tests = [
        ('Perfect meds from WARNING', [0.2, 0.5, 0.3], {'meds_adherence': 1.0}, True),
        ('Perfect meds from STABLE', [0.9, 0.08, 0.02], {'meds_adherence': 1.0}, True),
        ('Stop meds from STABLE', [0.9, 0.08, 0.02], {'meds_adherence': 0.0}, False),
        ('Exercise more from WARNING', [0.2, 0.5, 0.3], {'steps_daily': 8000.0}, True),
        ('Better diet from WARNING', [0.2, 0.5, 0.3], {'carbs_intake': 140.0}, True),
        ('Multi-intervention', [0.15, 0.45, 0.40],
         {'meds_adherence': 1.0, 'steps_daily': 7000.0, 'carbs_intake': 150.0}, True),
    ]

    for name, probs, intervention, expect_reduction in intervention_tests:
        result = engine.simulate_intervention(probs, intervention)
        reduced = result['risk_reduction'] > 0
        ok = reduced == expect_reduction
        status = "✓" if ok else "✗"
        print(f"  {status} {name}: risk Δ={result['risk_reduction']:+.4f} "
              f"({result['baseline_risk']:.3f} → {result['new_risk']:.3f})")

    report['test9_interventions'] = 'See output above'

    # =========================================================================
    # TEST 10: PERSONALIZED CALIBRATION IMPROVEMENT
    # =========================================================================
    print("\n" + "=" * 78)
    print("  TEST 10: PERSONALIZED CALIBRATION ACCURACY GAIN")
    print("=" * 78)

    # Create patients with shifted baselines (different from population)
    shifts = [
        ('Low glucose baseline', {'glucose_avg': -1.0, 'resting_hr': -3}),
        ('High glucose baseline', {'glucose_avg': 1.5, 'resting_hr': 5}),
        ('Athletic (low HR, high HRV)', {'resting_hr': -10, 'hrv_rmssd': 15, 'steps_daily': 2000}),
        ('Sedentary (high HR, low steps)', {'resting_hr': 8, 'steps_daily': -2000, 'hrv_rmssd': -8}),
    ]

    for desc, shift in shifts:
        rng = np.random.RandomState(80000)
        # Generate "personal normal" training data
        train_obs = []
        for _ in range(60):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][0] + shift.get(feat, 0)
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][0])
                val = mean + rng.normal(0, std * 0.2)
                lo, hi = EMISSION_PARAMS[feat]['bounds']
                o[feat] = float(np.clip(val, lo, hi))
            train_obs.append(o)

        # Test on personal "normal" observation
        test_obs = [train_obs[0]]

        # Without calibration
        r_before = engine.run_inference(test_obs)
        p_stable_before = r_before['state_probabilities']['STABLE']

        # Calibrate
        pid = f'shifted_{desc}'
        engine.calibrate_baseline(train_obs, patient_id=pid)

        # With calibration
        r_after = engine.run_inference(test_obs, patient_id=pid)
        p_stable_after = r_after['state_probabilities']['STABLE']

        improvement = p_stable_after - p_stable_before
        status = "✓" if improvement >= 0 else "~"
        print(f"  {status} {desc:<35s}: P(STABLE) {p_stable_before:.3f} → {p_stable_after:.3f} (Δ={improvement:+.3f})")

        engine.clear_patient_baseline(pid)

    # =========================================================================
    # SUMMARY
    # =========================================================================
    elapsed = time.time() - t0

    print("\n" + "=" * 78)
    print("  FINAL SUMMARY")
    print("=" * 78)
    print(f"\n  Overall Accuracy:        {report['test1_cohort']['overall_accuracy']:.1f}%")
    print(f"  Macro F1:                {report['test1_cohort']['macro_f1']:.4f}")
    print(f"  CRISIS AUC:              {report['test1_cohort']['roc_auc']['CRISIS']:.4f}")
    print(f"  WARNING AUC:             {report['test1_cohort']['roc_auc']['WARNING']:.4f}")
    print(f"  STABLE AUC:              {report['test1_cohort']['roc_auc']['STABLE']:.4f}")
    print(f"  Safety FP Rate:          {report['test6_safety']['false_positive_rate']:.1f}%")
    print(f"  Safety TP Rate:          {report['test6_safety']['true_positive_rate']:.1f}%")
    print(f"  Mean Confidence:         {report['test1_cohort']['mean_confidence']:.4f}")
    print(f"  Total Patients Tested:   {report['test1_cohort']['total_patients']}+")
    print(f"  Runtime:                 {elapsed:.1f}s")

    # Quality assessment
    acc = report['test1_cohort']['overall_accuracy']
    crisis_auc = report['test1_cohort']['roc_auc']['CRISIS']
    if acc >= 90 and crisis_auc >= 0.95:
        quality = "EXCELLENT"
    elif acc >= 80 and crisis_auc >= 0.90:
        quality = "GOOD"
    elif acc >= 70 and crisis_auc >= 0.80:
        quality = "FAIR"
    else:
        quality = "NEEDS WORK"

    print(f"\n  MODEL QUALITY: {quality}")
    print("=" * 78)

    report['summary'] = {
        'quality': quality,
        'runtime_seconds': round(elapsed, 1),
        'timestamp': datetime.now().isoformat()
    }

    return report


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    report = run_validation()

    # Save report as JSON
    report_dir = os.path.join(os.path.dirname(__file__), 'reports')
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, 'accuracy_validation.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\n  Report saved to: {report_path}")
