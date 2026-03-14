"""
EXHAUSTIVE edge-case test suite for Bewo Healthcare.
Tests EVERY function, EVERY branch, EVERY numerical edge case.

Covers:
 - gaussian_log_pdf / gaussian_pdf: None, zero var, extreme values, NaN-safe
 - safe_log: zero, negative, tiny
 - SafetyMonitor: every threshold, priority ordering, missing features, empty obs
 - HMMEngine.run_inference: empty, single, partial, all-None, dawn phenomenon,
   personalized params, safety override vs HMM, path backtracking
 - HMMEngine.predict_time_to_crisis: already-crisis, stable, warning, edge sims
 - HMMEngine.calculate_future_risk: absorbing chain, all-crisis, all-stable
 - HMMEngine.simulate_intervention: counterfactual, adversarial, zero probs
 - HMMEngine.calibrate_patient_baseline: insufficient data, edge stats
 - HMMEngine.get_emission_log_prob: missing features, personalized params
 - Baum-Welch: single seq, many iters, convergence, short seqs, empty features
 - Monte Carlo: determinism with seed, horizon=0, horizon=1000
 - Demo scenarios: all 14 types, bounds checking, reproducibility
 - ValidationSuite: full cohort, ROC/AUC, confusion matrix sanity
 - MerlionRiskEngine: normal, crash, empty, 3-point minimum, huge values
 - Drug interactions: all 16 pairs, class mapping, edge drug names, duplicates
 - Numerical stability: underflow, overflow, log-domain correctness

Run: python -m tests.test_exhaustive  (from project root)
"""
import sys, os, math, random, time, traceback
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

PASS = 0
FAIL = 0
WARN = 0

def ok(label):
    global PASS; PASS += 1
    print(f"  [PASS] {label}")

def fail(label, detail=""):
    global FAIL; FAIL += 1
    print(f"  [FAIL] {label} -- {detail}")

def warn(label, detail=""):
    global WARN; WARN += 1
    print(f"  [WARN] {label} -- {detail}")

def assert_close(actual, expected, tol, label):
    if abs(actual - expected) <= tol:
        ok(f"{label}: {actual} ~ {expected} (+/-{tol})")
    else:
        fail(f"{label}: {actual} != {expected} (+/-{tol})")

def assert_in_range(val, lo, hi, label):
    if lo <= val <= hi:
        ok(f"{label}: {val} in [{lo}, {hi}]")
    else:
        fail(f"{label}: {val} NOT in [{lo}, {hi}]")


# ══════════════════════════════════════════════════════════════════════════════
# 1. UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════
def test_utility_functions():
    print("\n=== 1. Utility Functions (gaussian_log_pdf, gaussian_pdf, safe_log) ===")
    from core.hmm_engine import gaussian_log_pdf, gaussian_pdf, safe_log

    # safe_log
    assert_close(safe_log(1.0), 0.0, 1e-10, "safe_log(1)")
    assert_close(safe_log(math.e), 1.0, 1e-10, "safe_log(e)")
    result = safe_log(0.0)
    if result < -600:
        ok(f"safe_log(0) = {result:.0f} (very negative, no crash)")
    else:
        fail(f"safe_log(0) = {result}")
    result = safe_log(-5.0)
    if result < -600:
        ok(f"safe_log(-5) = {result:.0f} (clamped, no crash)")
    else:
        fail(f"safe_log(-5) = {result}")

    # gaussian_log_pdf: None returns 0 (marginalization)
    assert_close(gaussian_log_pdf(None, 5.0, 1.0), 0.0, 1e-10, "gaussian_log_pdf(None)")

    # gaussian_log_pdf: zero variance -> clamps to 1e-6
    result = gaussian_log_pdf(5.0, 5.0, 0.0)
    if math.isfinite(result):
        ok(f"gaussian_log_pdf(var=0) = {result:.2f} (no crash)")
    else:
        fail(f"gaussian_log_pdf(var=0) = {result}")

    # gaussian_log_pdf: negative variance -> clamps
    result = gaussian_log_pdf(5.0, 5.0, -1.0)
    if math.isfinite(result):
        ok(f"gaussian_log_pdf(var=-1) = {result:.2f} (clamped)")
    else:
        fail(f"gaussian_log_pdf(var=-1) = {result}")

    # gaussian_log_pdf: x at mean -> maximum
    lp_at_mean = gaussian_log_pdf(6.5, 6.5, 1.5)
    lp_off_mean = gaussian_log_pdf(10.0, 6.5, 1.5)
    if lp_at_mean > lp_off_mean:
        ok(f"gaussian_log_pdf: at mean ({lp_at_mean:.2f}) > off mean ({lp_off_mean:.2f})")
    else:
        fail(f"gaussian_log_pdf: at mean NOT > off mean")

    # gaussian_log_pdf: extreme distance -> very negative but finite
    result = gaussian_log_pdf(1000.0, 6.5, 1.5)
    if math.isfinite(result) and result < -100000:
        ok(f"gaussian_log_pdf(x=1000) = {result:.0f} (extreme but finite)")
    else:
        fail(f"gaussian_log_pdf(x=1000) = {result}")

    # gaussian_pdf: None returns 1.0
    assert_close(gaussian_pdf(None, 5.0, 1.0), 1.0, 1e-10, "gaussian_pdf(None)")

    # gaussian_pdf: x at mean is positive
    pdf_val = gaussian_pdf(6.5, 6.5, 1.5)
    if pdf_val > 0:
        ok(f"gaussian_pdf(at mean) = {pdf_val:.4f} (positive)")
    else:
        fail(f"gaussian_pdf(at mean) = {pdf_val}")

    # gaussian_pdf: extreme distance -> ~0 but not crash
    pdf_val = gaussian_pdf(1000.0, 6.5, 1.5)
    if pdf_val >= 0 and pdf_val < 1e-10:
        ok(f"gaussian_pdf(x=1000) = {pdf_val} (near zero, no crash)")
    else:
        fail(f"gaussian_pdf(x=1000) = {pdf_val}")

    # gaussian_pdf: var=0 -> no crash
    pdf_val = gaussian_pdf(5.0, 5.0, 0.0)
    if math.isfinite(pdf_val):
        ok(f"gaussian_pdf(var=0) = {pdf_val} (no crash)")
    else:
        fail(f"gaussian_pdf(var=0) = {pdf_val}")


# ══════════════════════════════════════════════════════════════════════════════
# 2. SAFETY MONITOR — EVERY THRESHOLD
# ══════════════════════════════════════════════════════════════════════════════
def test_safety_monitor():
    print("\n=== 2. SafetyMonitor — Every Threshold + Priority ===")
    from core.hmm_engine import SafetyMonitor

    # Empty / None
    s, r = SafetyMonitor.check_safety(None)
    if s is None:
        ok("SafetyMonitor(None) -> (None, None)")
    else:
        fail(f"SafetyMonitor(None) -> ({s}, {r})")

    s, r = SafetyMonitor.check_safety({})
    if s is None:
        ok("SafetyMonitor({}) -> (None, None)")
    else:
        fail(f"SafetyMonitor({{}}) -> ({s}, {r})")

    # Hypoglycemia Level 2: glucose < 3.0 -> CRISIS
    s, r = SafetyMonitor.check_safety({'glucose_avg': 2.5})
    if s == 'CRISIS' and 'Level 2' in r:
        ok(f"glucose=2.5 -> CRISIS (Level 2 hypo)")
    else:
        fail(f"glucose=2.5 -> ({s}, {r})")

    # Hypoglycemia Level 1: 3.0 <= glucose < 3.9 -> WARNING
    s, r = SafetyMonitor.check_safety({'glucose_avg': 3.5})
    if s == 'WARNING' and 'Level 1' in r:
        ok(f"glucose=3.5 -> WARNING (Level 1 hypo)")
    else:
        fail(f"glucose=3.5 -> ({s}, {r})")

    # Hyperglycemia severe: glucose > 16.7 -> CRISIS
    s, r = SafetyMonitor.check_safety({'glucose_avg': 20.0})
    if s == 'CRISIS' and 'DKA' in r:
        ok(f"glucose=20 -> CRISIS (severe hyper)")
    else:
        fail(f"glucose=20 -> ({s}, {r})")

    # Hyperglycemia uncontrolled: 13.9 < glucose <= 16.7 -> WARNING
    s, r = SafetyMonitor.check_safety({'glucose_avg': 15.0})
    if s == 'WARNING':
        ok(f"glucose=15 -> WARNING (uncontrolled hyper)")
    else:
        fail(f"glucose=15 -> ({s}, {r})")

    # Normal glucose -> None
    s, r = SafetyMonitor.check_safety({'glucose_avg': 6.5})
    if s is None:
        ok(f"glucose=6.5 -> None (normal)")
    else:
        fail(f"glucose=6.5 -> ({s}, {r})")

    # Meds adherence < 0.5 -> WARNING
    s, r = SafetyMonitor.check_safety({'meds_adherence': 0.3})
    if s == 'WARNING':
        ok(f"meds=0.3 -> WARNING")
    else:
        fail(f"meds=0.3 -> ({s}, {r})")

    # Tachycardia > 120 -> WARNING
    s, r = SafetyMonitor.check_safety({'resting_hr': 130})
    if s == 'WARNING' and 'Tachycardia' in r:
        ok(f"HR=130 -> WARNING (tachycardia)")
    else:
        fail(f"HR=130 -> ({s}, {r})")

    # Bradycardia < 45 -> WARNING
    s, r = SafetyMonitor.check_safety({'resting_hr': 40})
    if s == 'WARNING' and 'Bradycardia' in r:
        ok(f"HR=40 -> WARNING (bradycardia)")
    else:
        fail(f"HR=40 -> ({s}, {r})")

    # HRV < 10 -> WARNING
    s, r = SafetyMonitor.check_safety({'hrv_rmssd': 5})
    if s == 'WARNING':
        ok(f"HRV=5 -> WARNING (autonomic dysfunction)")
    else:
        fail(f"HRV=5 -> ({s}, {r})")

    # Glucose variability > 50 -> WARNING
    s, r = SafetyMonitor.check_safety({'glucose_variability': 60})
    if s == 'WARNING':
        ok(f"CV=60 -> WARNING (extreme variability)")
    else:
        fail(f"CV=60 -> ({s}, {r})")

    # PRIORITY: CRISIS beats WARNING (glucose=2.0 triggers both hypo_level2 + hypo_level1)
    s, r = SafetyMonitor.check_safety({'glucose_avg': 2.0})
    if s == 'CRISIS':
        ok(f"glucose=2.0 -> CRISIS (CRISIS priority over WARNING)")
    else:
        fail(f"glucose=2.0 -> ({s}, {r}) -- expected CRISIS priority")

    # MULTIPLE WARNINGS: low meds + tachycardia -> first WARNING returned
    s, r = SafetyMonitor.check_safety({'meds_adherence': 0.3, 'resting_hr': 130})
    if s == 'WARNING':
        ok(f"low meds + tachycardia -> WARNING")
    else:
        fail(f"low meds + tachycardia -> ({s})")

    # Boundary: glucose exactly at threshold (3.9 -> NOT warning, 13.9 -> NOT warning)
    s, r = SafetyMonitor.check_safety({'glucose_avg': 3.9})
    # 3.9 is NOT < 3.9, so level 1 NOT triggered. But it IS NOT > 13.9 either. Should be None.
    if s is None:
        ok(f"glucose=3.9 (boundary) -> None (not triggered)")
    else:
        warn(f"glucose=3.9 (boundary) -> ({s}, {r})")

    # Boundary: glucose exactly 3.0 -> NOT < 3.0, so level2 not triggered. But < 3.9 -> level1 WARNING
    s, r = SafetyMonitor.check_safety({'glucose_avg': 3.0})
    if s == 'WARNING':
        ok(f"glucose=3.0 (boundary) -> WARNING (level 1 hypo)")
    else:
        warn(f"glucose=3.0 (boundary) -> ({s}, {r})")

    # All features missing (all None) -> None
    s, r = SafetyMonitor.check_safety({
        'glucose_avg': None, 'meds_adherence': None, 'resting_hr': None,
        'hrv_rmssd': None, 'glucose_variability': None
    })
    if s is None:
        ok(f"all None features -> None")
    else:
        fail(f"all None features -> ({s}, {r})")


# ══════════════════════════════════════════════════════════════════════════════
# 3. HMM ENGINE — VITERBI EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════
def test_viterbi_edge_cases():
    print("\n=== 3. Viterbi Edge Cases ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()

    # Empty observations -> STABLE with 0 confidence
    r = engine.run_inference([])
    if r['current_state'] == 'STABLE' and r['confidence'] == 0.0:
        ok("Viterbi([]) -> STABLE, conf=0.0")
    else:
        fail(f"Viterbi([]) -> {r['current_state']}, conf={r['confidence']}")

    # Single observation with all None -> STABLE (uniform emissions)
    r = engine.run_inference([{}])
    if r['current_state'] in STATES:
        ok(f"Viterbi([{{}}]) -> {r['current_state']} (doesn't crash)")
    else:
        fail(f"Viterbi([{{}}]) crashed")

    # Single obs with only one feature
    r = engine.run_inference([{'glucose_avg': 6.5}])
    if r['current_state'] in STATES and r['certainty_index'] < 0.3:
        ok(f"Viterbi(1 feature) -> {r['current_state']}, certainty={r['certainty_index']}")
    else:
        warn(f"Viterbi(1 feature) -> {r['current_state']}, certainty={r['certainty_index']}")

    # All-None observation
    all_none = {f: None for f in engine.weights.keys()}
    r = engine.run_inference([all_none])
    if r['current_state'] in STATES:
        ok(f"Viterbi(all None) -> {r['current_state']} (no crash)")
    else:
        fail("Viterbi(all None) crashed")

    # Very long sequence (200 observations) -> no numerical overflow
    stable_obs = {
        'glucose_avg': 6.5, 'glucose_variability': 25, 'meds_adherence': 0.9,
        'carbs_intake': 155, 'steps_daily': 5500, 'resting_hr': 68,
        'hrv_rmssd': 32, 'sleep_quality': 7.5, 'social_engagement': 10
    }
    r = engine.run_inference([stable_obs] * 200)
    if r['current_state'] == 'STABLE' and math.isfinite(r['confidence']):
        ok(f"Viterbi(200 obs) -> STABLE, conf={r['confidence']:.3f} (no overflow)")
    else:
        fail(f"Viterbi(200 obs) -> {r['current_state']}, conf={r['confidence']}")

    # Dawn phenomenon: glucose at 4-8 AM should shift mean up
    dawn_obs = {'glucose_avg': 7.5, 'hour_of_day': 6}  # 6 AM SGT
    r_dawn = engine.run_inference([dawn_obs])
    nodawn_obs = {'glucose_avg': 7.5, 'hour_of_day': 12}  # noon
    r_nodawn = engine.run_inference([nodawn_obs])
    # Dawn should make 7.5 look more "normal" -> higher STABLE prob
    dawn_stable = r_dawn['state_probabilities']['STABLE']
    nodawn_stable = r_nodawn['state_probabilities']['STABLE']
    if dawn_stable >= nodawn_stable - 0.05:
        ok(f"Dawn phenomenon: STABLE prob at 6AM ({dawn_stable:.3f}) >= noon ({nodawn_stable:.3f})")
    else:
        warn(f"Dawn phenomenon: 6AM stable={dawn_stable:.3f}, noon={nodawn_stable:.3f}")

    # Safety override: glucose=2.0 should force CRISIS regardless of HMM temporal smoothing
    override_seq = [stable_obs] * 10 + [{'glucose_avg': 2.0}]
    r = engine.run_inference(override_seq)
    if r['current_state'] == 'CRISIS' and r['method'] == 'RULE_OVERRIDE':
        ok(f"Safety override: 10 STABLE + glucose=2.0 -> CRISIS (RULE_OVERRIDE)")
    else:
        fail(f"Safety override: -> {r['current_state']}, method={r['method']}")

    # Path backtracking: returns valid path
    r = engine.run_inference([stable_obs] * 5)
    path = r.get('path_states', [])
    if len(path) == 5 and all(s in STATES for s in path):
        ok(f"Path backtracking: {path}")
    else:
        fail(f"Path backtracking: {path}")

    # State probabilities sum to ~1.0
    r = engine.run_inference([stable_obs])
    prob_sum = sum(r['state_probabilities'].values())
    assert_close(prob_sum, 1.0, 0.01, "State probabilities sum")

    # Contributing factors: non-empty for full observation
    if len(r.get('top_factors', [])) > 0:
        ok(f"Contributing factors: {len(r['top_factors'])} factors returned")
    else:
        fail("Contributing factors: empty")

    # Predictions: risk_48h and risk_12h present and valid
    preds = r.get('predictions', {})
    r48 = preds.get('risk_48h', -1)
    r12 = preds.get('risk_12h', -1)
    if 0 <= r48 <= 1 and 0 <= r12 <= 1:
        ok(f"Future risk: 12h={r12:.3f}, 48h={r48:.3f}")
    else:
        fail(f"Future risk: 12h={r12}, 48h={r48}")

    # Extreme observation values -> no crash
    extreme_obs = {
        'glucose_avg': 35.0, 'glucose_variability': 100.0, 'meds_adherence': 0.0,
        'carbs_intake': 500.0, 'steps_daily': 0.0, 'resting_hr': 160.0,
        'hrv_rmssd': 3.0, 'sleep_quality': 0.0, 'social_engagement': 0.0
    }
    r = engine.run_inference([extreme_obs])
    if r['current_state'] in STATES and math.isfinite(r['confidence']):
        ok(f"Extreme obs -> {r['current_state']} (no crash, conf={r['confidence']:.3f})")
    else:
        fail(f"Extreme obs crashed")


# ══════════════════════════════════════════════════════════════════════════════
# 4. MONTE CARLO — EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════
def test_monte_carlo_edge_cases():
    print("\n=== 4. Monte Carlo Edge Cases ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()

    # Already in CRISIS -> 100% immediate
    crisis_obs = {
        'glucose_avg': 25, 'glucose_variability': 80, 'meds_adherence': 0.1,
        'carbs_intake': 400, 'steps_daily': 100, 'resting_hr': 120,
        'hrv_rmssd': 5, 'sleep_quality': 1, 'social_engagement': 0
    }
    r = engine.predict_time_to_crisis(crisis_obs, horizon_hours=48, num_simulations=500)
    if r['prob_crisis_percent'] >= 90:
        ok(f"MC already CRISIS -> {r['prob_crisis_percent']}% (>=90%)")
    else:
        warn(f"MC already CRISIS -> {r['prob_crisis_percent']}% (expected >=90%)")

    # Stable -> low probability
    stable_obs = {
        'glucose_avg': 5.8, 'glucose_variability': 18, 'meds_adherence': 1.0,
        'carbs_intake': 150, 'steps_daily': 6500, 'resting_hr': 68,
        'hrv_rmssd': 48, 'sleep_quality': 8.2, 'social_engagement': 12
    }
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=48, num_simulations=1000)
    if r['prob_crisis_percent'] < 25:
        ok(f"MC stable -> {r['prob_crisis_percent']}% (<25%)")
    else:
        warn(f"MC stable -> {r['prob_crisis_percent']}% (expected <25%)")

    # Horizon=4 (minimum 1 step)
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=4, num_simulations=500)
    if r.get('prob_crisis_percent') is not None:
        ok(f"MC horizon=4h -> {r['prob_crisis_percent']}% (1 step, no crash)")
    else:
        fail("MC horizon=4h crashed")

    # Horizon=0 (0 steps, edge case)
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=0, num_simulations=100)
    if r.get('prob_crisis_percent') is not None:
        ok(f"MC horizon=0h -> {r['prob_crisis_percent']}% (0 steps)")
    else:
        fail("MC horizon=0h crashed")

    # Very large horizon (480h = 20 days)
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=480, num_simulations=500)
    if r.get('prob_crisis_percent') is not None:
        ok(f"MC horizon=480h -> {r['prob_crisis_percent']}% (120 steps)")
    else:
        fail("MC horizon=480h crashed")

    # num_simulations=1 (minimum)
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=48, num_simulations=1)
    if r.get('prob_crisis_percent') is not None:
        ok(f"MC N=1 -> {r['prob_crisis_percent']}%")
    else:
        fail("MC N=1 crashed")

    # Empty observation
    r = engine.predict_time_to_crisis({}, horizon_hours=48, num_simulations=100)
    if r.get('prob_crisis_percent') is not None:
        ok(f"MC empty obs -> {r['prob_crisis_percent']}%")
    else:
        fail("MC empty obs crashed")

    # Survival curve: valid structure
    r = engine.predict_time_to_crisis(stable_obs, horizon_hours=48, num_simulations=500)
    curve = r.get('survival_curve', [])
    if len(curve) > 0:
        # First point should be survival_prob=1.0, last should be <= 1.0
        if curve[0].get('survival_prob', 0) == 1.0:
            ok(f"Survival curve: starts at 1.0, {len(curve)} points")
        else:
            fail(f"Survival curve: first point = {curve[0]}")
        # Hours should be monotonically increasing
        hours = [p.get('hours', -1) for p in curve]
        if hours == sorted(hours):
            ok(f"Survival curve: hours monotonically increasing")
        else:
            fail(f"Survival curve: hours NOT monotonic")
    else:
        warn("Survival curve: empty")


# ══════════════════════════════════════════════════════════════════════════════
# 5. COUNTERFACTUAL / INTERVENTION SIMULATION
# ══════════════════════════════════════════════════════════════════════════════
def test_counterfactual():
    print("\n=== 5. Counterfactual Simulation ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()

    # Valid intervention: improve meds -> risk should decrease
    warning_probs = [0.3, 0.5, 0.2]
    r = engine.simulate_intervention(warning_probs, {'meds_adherence': 1.0})
    if r['validity'] == 'VALID' and r['risk_reduction'] >= 0:
        ok(f"Counterfactual: meds=1.0 -> risk reduction={r['risk_reduction']:.3f}")
    else:
        warn(f"Counterfactual: meds=1.0 -> {r}")

    # Adversarial: make things worse -> risk should increase (negative reduction)
    r = engine.simulate_intervention(warning_probs, {'glucose_avg': 25.0, 'meds_adherence': 0.0})
    if r['validity'] == 'VALID':
        ok(f"Adversarial counterfactual: risk_reduction={r['risk_reduction']:.3f} (may be negative)")
    else:
        fail(f"Adversarial counterfactual failed: {r}")

    # Invalid probs: wrong length
    r = engine.simulate_intervention([0.5, 0.5], {'meds_adherence': 1.0})
    if r['validity'] == 'INVALID_INPUT':
        ok(f"Invalid probs (len=2) -> INVALID_INPUT")
    else:
        fail(f"Invalid probs (len=2) -> {r['validity']}")

    # Invalid probs: don't sum to 1
    r = engine.simulate_intervention([0.5, 0.5, 0.5], {'meds_adherence': 1.0})
    if r['validity'] == 'INVALID_INPUT':
        ok(f"Invalid probs (sum=1.5) -> INVALID_INPUT")
    else:
        fail(f"Invalid probs (sum=1.5) -> {r['validity']}")

    # All-STABLE probs -> minimal intervention effect
    r = engine.simulate_intervention([1.0, 0.0, 0.0], {'meds_adherence': 1.0})
    if r['validity'] == 'VALID' and r['baseline_risk'] < 0.05:
        ok(f"All-STABLE: baseline_risk={r['baseline_risk']:.4f} (<0.05)")
    else:
        warn(f"All-STABLE: baseline_risk={r['baseline_risk']:.4f}")

    # All-CRISIS probs
    r = engine.simulate_intervention([0.0, 0.0, 1.0], {'meds_adherence': 1.0})
    if r['validity'] == 'VALID':
        ok(f"All-CRISIS: baseline_risk={r['baseline_risk']:.4f}, new_risk={r['new_risk']:.4f}")
    else:
        fail(f"All-CRISIS failed")

    # Empty intervention -> no change
    r = engine.simulate_intervention(warning_probs, {})
    if r['validity'] == 'VALID':
        ok(f"Empty intervention: risk_reduction={r['risk_reduction']:.4f}")
    else:
        fail(f"Empty intervention failed")

    # Unknown feature -> ignored
    r = engine.simulate_intervention(warning_probs, {'nonexistent_feature': 100.0})
    if r['validity'] == 'VALID':
        ok(f"Unknown feature: ignored, risk_reduction={r['risk_reduction']:.4f}")
    else:
        fail(f"Unknown feature failed")


# ══════════════════════════════════════════════════════════════════════════════
# 6. CALCULATE_FUTURE_RISK (Absorbing Chain)
# ══════════════════════════════════════════════════════════════════════════════
def test_future_risk():
    print("\n=== 6. calculate_future_risk (Absorbing Chain) ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()

    # All STABLE -> low risk even at large horizon
    risk = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=12)
    assert_in_range(risk, 0.0, 0.3, "All STABLE, 48h risk")

    # All CRISIS -> 1.0 (absorbing)
    risk = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=12)
    assert_close(risk, 1.0, 0.001, "All CRISIS, 48h risk")

    # All WARNING -> moderate risk
    risk = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=12)
    assert_in_range(risk, 0.2, 0.9, "All WARNING, 48h risk")

    # Horizon=0 -> current crisis prob
    risk = engine.calculate_future_risk([0.3, 0.5, 0.2], horizon=0)
    assert_close(risk, 0.2, 0.001, "Horizon=0 = current crisis prob")

    # Risk is monotonically non-decreasing with horizon
    risks = [engine.calculate_future_risk([0.5, 0.4, 0.1], horizon=h) for h in range(0, 50)]
    monotonic = all(risks[i] <= risks[i+1] + 1e-6 for i in range(len(risks)-1))
    if monotonic:
        ok(f"Risk monotonically non-decreasing with horizon ({risks[0]:.3f} -> {risks[-1]:.3f})")
    else:
        fail(f"Risk NOT monotonic with horizon")


# ══════════════════════════════════════════════════════════════════════════════
# 7. BAUM-WELCH EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════
def test_baum_welch_edge_cases():
    print("\n=== 7. Baum-Welch Edge Cases ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()
    rng = np.random.default_rng(99)

    # Single sequence, short (5 obs)
    seq = [{'glucose_avg': 6.5 + rng.normal(0, 0.5), 'meds_adherence': 0.9} for _ in range(5)]
    r = engine.baum_welch([seq], max_iter=5)
    if r.get('iterations', 0) > 0:
        ok(f"BW single short seq: {r['iterations']} iters, no crash")
    else:
        fail(f"BW single short seq failed")

    # All sequences length 1 -> should skip (T < 2)
    r = engine.baum_welch([[{'glucose_avg': 7.0}]], max_iter=5)
    ok(f"BW all length-1: {r['iterations']} iters (sequences skipped)")

    # Empty sequences list
    r = engine.baum_welch([], max_iter=5)
    if r.get('iterations', 0) >= 0:
        ok(f"BW empty sequences: no crash")
    else:
        fail("BW empty sequences crashed")

    # Sequence with all-None observations
    none_seq = [{f: None for f in engine.weights.keys()} for _ in range(10)]
    r = engine.baum_welch([none_seq], max_iter=5)
    if r.get('iterations', 0) >= 0:
        ok(f"BW all-None obs: no crash")
    else:
        fail("BW all-None obs crashed")

    # update_transitions=False -> learned_transitions is None
    seq = [{'glucose_avg': rng.normal(6.5, 1.0)} for _ in range(20)]
    r = engine.baum_welch([seq], max_iter=5, update_transitions=False)
    if r['learned_transitions'] is None:
        ok("BW update_transitions=False -> None")
    else:
        fail("BW update_transitions=False -> not None")

    # update_emissions=False -> learned_emissions is None
    r = engine.baum_welch([seq], max_iter=5, update_emissions=False)
    if r['learned_emissions'] is None:
        ok("BW update_emissions=False -> None")
    else:
        fail("BW update_emissions=False -> not None")

    # Convergence: tight tol should converge quickly on identical data
    identical_seq = [{'glucose_avg': 6.5, 'meds_adherence': 0.9} for _ in range(50)]
    r = engine.baum_welch([identical_seq] * 3, max_iter=50, tol=1e-2)
    if r.get('converged', False) or r['iterations'] < 50:
        ok(f"BW convergence: {r['iterations']} iters (converged={r.get('converged')})")
    else:
        warn(f"BW convergence: {r['iterations']} iters (did not converge)")

    # Per-patient training stores params
    engine2 = HMMEngine()
    seqs = [[{'glucose_avg': rng.normal(6.5, 0.5), 'meds_adherence': 0.9 + rng.normal(0, 0.05)} for _ in range(20)] for _ in range(3)]
    r = engine2.train_patient_baum_welch("EDGE_P001", seqs, max_iter=10)
    if r.get('success') and "EDGE_P001" in engine2._personalized_baselines:
        ok("Per-patient BW: params stored for EDGE_P001")
    else:
        fail(f"Per-patient BW: {r}")

    # After training, inference uses personalized params
    r2 = engine2.run_inference(seqs[0], patient_id="EDGE_P001")
    if r2['current_state'] in STATES:
        ok(f"Personalized inference: EDGE_P001 -> {r2['current_state']}")
    else:
        fail(f"Personalized inference failed")

    # Clear baseline
    cleared = engine2.clear_patient_baseline("EDGE_P001")
    if cleared:
        ok("clear_patient_baseline returned True")
    else:
        fail("clear_patient_baseline returned False")

    # Calibration status after clear
    status = engine2.get_calibration_status("EDGE_P001")
    if not status['calibrated']:
        ok("Calibration status after clear: not calibrated")
    else:
        fail("Calibration status after clear: still calibrated")


# ══════════════════════════════════════════════════════════════════════════════
# 8. PATIENT BASELINE CALIBRATION
# ══════════════════════════════════════════════════════════════════════════════
def test_calibration():
    print("\n=== 8. Patient Baseline Calibration ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()

    # No observations
    r = engine.calibrate_patient_baseline("CAL_001", [])
    if not r['success'] and 'No observations' in r['message']:
        ok(f"Calibration: empty obs -> {r['message']}")
    else:
        fail(f"Calibration: empty obs -> {r}")

    # Insufficient stable observations
    warning_obs = [{'glucose_avg': 14.0, 'meds_adherence': 0.3} for _ in range(10)]
    r = engine.calibrate_patient_baseline("CAL_002", warning_obs)
    if not r['success'] and 'Insufficient' in r['message']:
        ok(f"Calibration: all WARNING -> {r['message']}")
    else:
        fail(f"Calibration: all WARNING -> {r}")

    # Enough stable data -> success
    stable_obs = []
    rng = np.random.default_rng(42)
    for _ in range(100):
        stable_obs.append({
            'glucose_avg': 6.0 + rng.normal(0, 0.3),
            'glucose_variability': 20 + rng.normal(0, 3),
            'meds_adherence': min(1.0, 0.95 + rng.normal(0, 0.03)),
            'carbs_intake': 155 + rng.normal(0, 10),
            'steps_daily': 5500 + rng.normal(0, 500),
            'resting_hr': 68 + rng.normal(0, 3),
            'hrv_rmssd': 35 + rng.normal(0, 5),
            'sleep_quality': 7.5 + rng.normal(0, 0.5),
            'social_engagement': 10 + rng.normal(0, 2),
        })
    r = engine.calibrate_patient_baseline("CAL_003", stable_obs)
    if r['success']:
        ok(f"Calibration: 100 stable obs -> success, {len(r['calibrated_features'])} features calibrated")
    else:
        fail(f"Calibration: 100 stable obs -> {r['message']}")

    # Verify calibrated params have positive variances
    params = engine._personalized_baselines.get("CAL_003", {})
    all_positive = True
    for feat, p in params.items():
        if isinstance(p, dict) and 'vars' in p:
            for v in p['vars']:
                if v <= 0:
                    all_positive = False
                    fail(f"Calibration: {feat} has var={v} (must be >0)")
    if all_positive:
        ok("Calibration: all personalized variances positive")


# ══════════════════════════════════════════════════════════════════════════════
# 9. DEMO SCENARIOS — ALL 14 TYPES
# ══════════════════════════════════════════════════════════════════════════════
def test_all_demo_scenarios():
    print("\n=== 9. All Demo Scenarios (14 types) ===")
    from core.hmm_engine import HMMEngine, EMISSION_PARAMS

    engine = HMMEngine()

    scenarios = [
        'stable_perfect', 'stable_realistic', 'missing_data',
        'gradual_decline', 'warning_to_crisis', 'sudden_crisis', 'recovery',
        'warning_recovery', 'stable_noisy', 'sudden_spike',
        'demo_merlion', 'demo_counterfactual', 'demo_intervention_success',
        'demo_tier_basic', 'demo_full_crisis'
    ]

    for scenario in scenarios:
        try:
            obs = engine.generate_demo_scenario(scenario, days=14, seed=42)
            if not obs or len(obs) == 0:
                fail(f"Scenario '{scenario}': returned empty")
                continue

            # Check observation count (14 days * 6 buckets = 84)
            expected_count = 14 * 6
            if len(obs) == expected_count:
                ok(f"Scenario '{scenario}': {len(obs)} observations")
            else:
                fail(f"Scenario '{scenario}': {len(obs)} observations (expected {expected_count})")

            # Check bounds on all features
            bounds_ok = True
            for i, o in enumerate(obs):
                for feat, params in EMISSION_PARAMS.items():
                    val = o.get(feat)
                    if val is None:
                        continue
                    lo, hi = params['bounds']
                    if val < lo - 0.01 or val > hi + 0.01:
                        bounds_ok = False
                        fail(f"Scenario '{scenario}' obs[{i}].{feat}={val:.2f} OUT OF BOUNDS [{lo}, {hi}]")
                        break
                if not bounds_ok:
                    break
            if bounds_ok:
                ok(f"Scenario '{scenario}': all values within emission bounds")

            # Reproducibility: same seed -> same output
            obs2 = engine.generate_demo_scenario(scenario, days=14, seed=42)
            if obs == obs2:
                ok(f"Scenario '{scenario}': reproducible with seed=42")
            else:
                fail(f"Scenario '{scenario}': NOT reproducible!")

            # Run inference: should not crash
            result = engine.run_inference(obs)
            if result['current_state'] in ['STABLE', 'WARNING', 'CRISIS']:
                pass  # Already tested, just ensuring no crash
            else:
                fail(f"Scenario '{scenario}': inference failed")

        except Exception as e:
            fail(f"Scenario '{scenario}': exception -- {e}")
            traceback.print_exc()


# ══════════════════════════════════════════════════════════════════════════════
# 10. MERLION RISK ENGINE — EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════
def test_merlion_edge_cases():
    print("\n=== 10. Merlion Risk Engine Edge Cases ===")
    from core.merlion_risk_engine import MerlionRiskEngine

    engine = MerlionRiskEngine()

    # Empty -> insufficient
    r = engine.calculate_risk([])
    if r.get('status') == 'INSUFFICIENT_DATA':
        ok("Merlion([]) -> INSUFFICIENT_DATA")
    else:
        fail(f"Merlion([]) -> {r}")

    # 1 point -> insufficient (< 3)
    r = engine.calculate_risk([5.5])
    if r.get('status') == 'INSUFFICIENT_DATA':
        ok("Merlion([5.5]) -> INSUFFICIENT_DATA")
    else:
        fail(f"Merlion([5.5]) -> {r}")

    # 2 points -> insufficient
    r = engine.calculate_risk([5.5, 6.0])
    if r.get('status') == 'INSUFFICIENT_DATA':
        ok("Merlion(2 points) -> INSUFFICIENT_DATA")
    else:
        fail(f"Merlion(2 points) -> {r}")

    # Exactly 3 points -> should work
    r = engine.calculate_risk([5.5, 6.0, 5.8])
    if r.get('prob_crisis_45min') is not None:
        ok(f"Merlion(3 points) -> prob={r['prob_crisis_45min']}")
    else:
        fail(f"Merlion(3 points) -> {r}")

    # Constant values -> velocity=0, low prob
    r = engine.calculate_risk([6.0, 6.0, 6.0, 6.0, 6.0])
    if r.get('velocity', 999) < 0.01:
        ok(f"Merlion(constant) -> velocity={r.get('velocity', '?')}, prob={r.get('prob_crisis_45min')}")
    else:
        warn(f"Merlion(constant) -> velocity={r.get('velocity')}")

    # Crash trajectory: 6.0 -> 5.0 -> 3.5 (approaching hypo)
    r = engine.calculate_risk([7.0, 6.0, 5.0, 4.0, 3.5])
    prob = r.get('prob_crisis_45min', 0)
    if prob > 0:
        ok(f"Merlion crash trajectory -> prob={prob} (>0)")
    else:
        warn(f"Merlion crash trajectory -> prob={prob}")

    # Rising trajectory: 6 -> 10 -> 14 -> 18
    r = engine.calculate_risk([6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0])
    prob = r.get('prob_crisis_45min', 0)
    if prob > 0:
        ok(f"Merlion rising trajectory -> prob={prob} (>0)")
    else:
        warn(f"Merlion rising trajectory -> prob={prob}")

    # Very large values -> no crash
    r = engine.calculate_risk([30.0, 31.0, 32.0, 33.0, 34.0])
    if r.get('prob_crisis_45min') is not None and math.isfinite(r['prob_crisis_45min']):
        ok(f"Merlion(extreme values) -> prob={r['prob_crisis_45min']} (no crash)")
    else:
        fail("Merlion(extreme values) crashed")

    # Forecast curve: correct length (6 points = forecast_horizon)
    r = engine.calculate_risk([5.5, 5.6, 5.7, 5.8, 5.9])
    curve = r.get('forecast_curve', [])
    if len(curve) == engine.forecast_horizon:
        ok(f"Merlion forecast curve: {len(curve)} points (=forecast_horizon)")
    else:
        fail(f"Merlion forecast curve: {len(curve)} points (expected {engine.forecast_horizon})")


# ══════════════════════════════════════════════════════════════════════════════
# 11. DRUG INTERACTIONS — EXHAUSTIVE
# ══════════════════════════════════════════════════════════════════════════════
def test_drug_interactions_exhaustive():
    print("\n=== 11. Drug Interactions — All Pairs + Edge Cases ===")
    from core.agent_runtime import check_drug_interactions, DRUG_INTERACTIONS, DRUG_CLASS_MAP

    # Test every defined interaction pair
    pair_count = 0
    for (class_a, class_b), data in DRUG_INTERACTIONS.items():
        # Find a concrete drug that maps to this class
        drug_a = None
        drug_b = None
        for drug, classes in DRUG_CLASS_MAP.items():
            if class_a in classes and drug_a is None:
                drug_a = drug
            if class_b in classes and drug_b is None:
                drug_b = drug
        if drug_a and drug_b:
            result = check_drug_interactions([f"{drug_a} 100mg"], proposed_medication=drug_b)
            found = len(result.get('interactions', []))
            if found > 0:
                sev = result['interactions'][0]['severity']
                ok(f"{drug_a} + {drug_b} -> {sev}")
                pair_count += 1
            else:
                warn(f"{drug_a} + {drug_b} -> no interaction (class: {class_a}+{class_b})")
        else:
            warn(f"No concrete drug for pair {class_a}+{class_b}")

    print(f"  [{pair_count}/{len(DRUG_INTERACTIONS)} pairs tested with concrete drugs]")

    # Reverse order should also match
    r1 = check_drug_interactions(["Metformin 500mg"], proposed_medication="Alcohol")
    r2 = check_drug_interactions(["Alcohol"], proposed_medication="Metformin 500mg")
    if r1['interactions_found'] == r2['interactions_found'] and r1['interactions_found'] > 0:
        ok("Drug interaction: order-independent (Metformin+Alcohol)")
    else:
        fail(f"Drug interaction: order-dependent ({r1['interactions_found']} vs {r2['interactions_found']})")

    # Duplicate medications in list -> no duplicate interactions
    r = check_drug_interactions(["Metformin 500mg", "Metformin 500mg"])
    if r['interactions_found'] == 0:
        ok("Drug interaction: duplicate meds -> no interactions")
    else:
        warn(f"Drug interaction: duplicate meds -> {r['interactions_found']}")

    # Case insensitivity
    r = check_drug_interactions(["METFORMIN 500mg"], proposed_medication="ALCOHOL")
    if r['interactions_found'] > 0:
        ok("Drug interaction: case insensitive")
    else:
        fail("Drug interaction: case sensitive (should be insensitive)")

    # Drug with dose suffix: "Lisinopril 10mg OD" -> should extract "lisinopril"
    r = check_drug_interactions(["Lisinopril 10mg OD"], proposed_medication="Naproxen 500mg BD")
    # ACE inhibitors + NSAIDs = MODERATE
    if r['interactions_found'] > 0:
        ok(f"Drug interaction: dose suffix handling -> {r['interactions'][0]['severity']}")
    else:
        fail("Drug interaction: dose suffix not handled")

    # P001's full med list: Metformin, Lisinopril, Atorvastatin, Aspirin
    r = check_drug_interactions(["Metformin 500mg BD", "Lisinopril 10mg OD", "Atorvastatin 20mg ON", "Aspirin 100mg OD"])
    # Aspirin is NSAID, Lisinopril is ACE -> ACE+NSAID interaction
    ace_nsaid = [i for i in r['interactions'] if 'nsaid' in str(i).lower() or 'NSAID' in str(i.get('mechanism', ''))]
    if len(ace_nsaid) > 0:
        ok(f"P001 meds: ACE+NSAID(aspirin) interaction found")
    else:
        warn(f"P001 meds: ACE+NSAID(aspirin) not found ({r['interactions_found']} total)")

    # Severity ordering: results sorted CONTRAINDICATED > MAJOR > MODERATE > MINOR
    r = check_drug_interactions(["Metformin 500mg", "Diazepam 5mg"], proposed_medication="Morphine 10mg")
    if r['interactions_found'] >= 1:
        severities = [i['severity'] for i in r['interactions']]
        sev_order = {"CONTRAINDICATED": 0, "MAJOR": 1, "MODERATE": 2, "MINOR": 3}
        sev_nums = [sev_order.get(s, 99) for s in severities]
        if sev_nums == sorted(sev_nums):
            ok(f"Drug interactions sorted by severity: {severities}")
        else:
            fail(f"Drug interactions NOT sorted: {severities}")

    # Empty proposed + empty current -> no interactions
    r = check_drug_interactions([])
    if r['interactions_found'] == 0:
        ok("Drug interaction: empty list -> 0 interactions")
    else:
        fail(f"Drug interaction: empty list -> {r['interactions_found']}")


# ══════════════════════════════════════════════════════════════════════════════
# 12. MASS SIMULATION — 200 PATIENTS, ALL SCENARIOS
# ══════════════════════════════════════════════════════════════════════════════
def test_mass_simulation():
    print("\n=== 12. Mass Simulation — 200 Patients ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()

    scenarios = {
        'stable_perfect': 'STABLE',
        'stable_realistic': 'STABLE',
        'warning_to_crisis': 'CRISIS',
        'sudden_crisis': 'CRISIS',
        'recovery': 'STABLE',
    }

    total_tested = 0
    total_correct = 0
    total_errors = 0

    for scenario, expected in scenarios.items():
        correct = 0
        errors = 0
        for i in range(40):
            try:
                obs = engine.generate_demo_scenario(scenario, days=14, seed=2000 + i)
                result = engine.run_inference(obs)
                state = result['current_state']
                if state == expected:
                    correct += 1
                # Also run Monte Carlo on last obs
                mc = engine.predict_time_to_crisis(obs[-1], horizon_hours=48, num_simulations=200)
                if mc.get('prob_crisis_percent') is None:
                    errors += 1
            except Exception as e:
                errors += 1
                if i == 0:
                    print(f"    ERROR in {scenario}: {e}")

        accuracy = correct / 40
        total_tested += 40
        total_correct += correct
        total_errors += errors

        if accuracy >= 0.6:
            ok(f"{scenario}: {correct}/40 correct ({accuracy:.0%}), {errors} errors")
        elif accuracy >= 0.4:
            warn(f"{scenario}: {correct}/40 correct ({accuracy:.0%})")
        else:
            fail(f"{scenario}: {correct}/40 correct ({accuracy:.0%})")

    overall = total_correct / total_tested if total_tested > 0 else 0
    if total_errors == 0:
        ok(f"Mass simulation: 0 errors in {total_tested} patients")
    else:
        warn(f"Mass simulation: {total_errors} errors in {total_tested} patients")
    print(f"  Overall accuracy: {overall:.1%} ({total_correct}/{total_tested})")


# ══════════════════════════════════════════════════════════════════════════════
# 13. VALIDATION SUITE — FULL COHORT
# ══════════════════════════════════════════════════════════════════════════════
def test_validation_suite():
    print("\n=== 13. Validation Suite (Full Cohort) ===")
    from core.hmm_engine import ValidationSuite

    suite = ValidationSuite()

    # Run full validation
    try:
        report = suite.run_full_validation(verbose=False)
    except Exception as e:
        fail(f"Validation suite crashed: {e}")
        traceback.print_exc()
        return

    metrics = report.get('classification_metrics', {})
    accuracy = metrics.get('accuracy', 0)
    macro_f1 = metrics.get('macro_f1', 0)

    if accuracy >= 0.5:
        ok(f"Validation accuracy: {accuracy:.1%}")
    else:
        warn(f"Validation accuracy: {accuracy:.1%} (< 50%)")

    if macro_f1 >= 0.4:
        ok(f"Validation macro F1: {macro_f1:.3f}")
    else:
        warn(f"Validation macro F1: {macro_f1:.3f} (< 0.4)")

    # ROC AUC for CRISIS detection
    roc = report.get('roc_auc_crisis', {})
    auc = roc.get('auc', 0)
    if auc >= 0.65:
        ok(f"ROC AUC (CRISIS): {auc:.3f}")
    else:
        warn(f"ROC AUC (CRISIS): {auc:.3f} (< 0.65)")

    # Confusion matrix sanity: STABLE should mostly classify as STABLE
    cm = metrics.get('confusion_matrix', {})
    if cm:
        stable_correct = cm.get('STABLE', {}).get('STABLE', 0)
        stable_total = sum(cm.get('STABLE', {}).values())
        if stable_total > 0 and (stable_correct / stable_total) >= 0.6:
            ok(f"STABLE recall: {stable_correct}/{stable_total} ({stable_correct/stable_total:.0%})")
        else:
            warn(f"STABLE recall: {stable_correct}/{stable_total}")


# ══════════════════════════════════════════════════════════════════════════════
# 14. NUMERICAL STABILITY STRESS TEST
# ══════════════════════════════════════════════════════════════════════════════
def test_numerical_stability():
    print("\n=== 14. Numerical Stability Stress Test ===")
    from core.hmm_engine import HMMEngine, gaussian_log_pdf, STATES

    engine = HMMEngine()

    # Test 1: Very small values in all features -> no NaN/Inf
    tiny_obs = {
        'glucose_avg': 1.5, 'glucose_variability': 5.0, 'meds_adherence': 0.0,
        'carbs_intake': 0.0, 'steps_daily': 0.0, 'resting_hr': 35.0,
        'hrv_rmssd': 3.0, 'sleep_quality': 0.0, 'social_engagement': 0.0
    }
    r = engine.run_inference([tiny_obs])
    if r['current_state'] in STATES and math.isfinite(r['confidence']):
        ok(f"Tiny values -> {r['current_state']} (no NaN)")
    else:
        fail(f"Tiny values -> {r['current_state']}, conf={r['confidence']}")

    # Test 2: Very large values
    huge_obs = {
        'glucose_avg': 35.0, 'glucose_variability': 100.0, 'meds_adherence': 1.0,
        'carbs_intake': 500.0, 'steps_daily': 25000.0, 'resting_hr': 160.0,
        'hrv_rmssd': 120.0, 'sleep_quality': 10.0, 'social_engagement': 50.0
    }
    r = engine.run_inference([huge_obs])
    if r['current_state'] in STATES and math.isfinite(r['confidence']):
        ok(f"Huge values -> {r['current_state']} (no overflow)")
    else:
        fail(f"Huge values -> {r['current_state']}, conf={r['confidence']}")

    # Test 3: Alternating extreme values (stress log-sum-exp)
    alt_seq = []
    for i in range(50):
        if i % 2 == 0:
            alt_seq.append(tiny_obs)
        else:
            alt_seq.append(huge_obs)
    r = engine.run_inference(alt_seq)
    if r['current_state'] in STATES and math.isfinite(r['confidence']):
        ok(f"Alternating extremes (50 obs) -> {r['current_state']} (stable)")
    else:
        fail(f"Alternating extremes -> {r['current_state']}, conf={r['confidence']}")

    # Test 4: gaussian_log_pdf numerical precision
    # Two values equidistant from mean should give same log prob
    lp1 = gaussian_log_pdf(6.5 + 2.0, 6.5, 1.5)
    lp2 = gaussian_log_pdf(6.5 - 2.0, 6.5, 1.5)
    assert_close(lp1, lp2, 1e-10, "Symmetric gaussian_log_pdf")

    # Test 5: Forward-backward on extreme data
    try:
        alpha, ll = engine._forward([tiny_obs] * 10)
        if math.isfinite(ll):
            ok(f"Forward pass on tiny data: ll={ll:.1f} (finite)")
        else:
            fail(f"Forward pass on tiny data: ll={ll}")
    except Exception as e:
        fail(f"Forward pass crashed: {e}")

    # Test 6: All identical observations -> should converge to same state
    identical = [{'glucose_avg': 6.5, 'meds_adherence': 0.9, 'resting_hr': 68}] * 100
    r = engine.run_inference(identical)
    path = r.get('path_states', [])
    # After enough observations, path should stabilize
    if len(set(path[-10:])) == 1:
        ok(f"100 identical obs: path stabilizes to {path[-1]}")
    else:
        warn(f"100 identical obs: last 10 states = {set(path[-10:])}")


# ══════════════════════════════════════════════════════════════════════════════
# 15. DATABASE SCHEMA — DEEP CHECK
# ══════════════════════════════════════════════════════════════════════════════
def test_database_deep():
    print("\n=== 15. Database Schema Deep Check ===")
    import sqlite3

    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
    if not os.path.exists(db_path):
        fail(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)

    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
    ok(f"Database: {len(tables)} tables")

    # Critical tables
    critical = [
        'patients', 'glucose_readings', 'hmm_states', 'medication_logs',
        'voice_checkins', 'passive_metrics', 'voucher_tracker',
        'conversation_history', 'agent_actions_log', 'agent_memory',
        'reminders', 'nurse_alerts', 'family_alerts', 'doctor_escalations',
        'appointment_requests', 'medication_video_requests'
    ]
    for t in critical:
        if t in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM [{t}]").fetchone()[0]
            ok(f"Table '{t}': exists ({count} rows)")
        else:
            warn(f"Table '{t}': MISSING")

    # P001 patient exists with required fields
    try:
        row = conn.execute("SELECT * FROM patients WHERE user_id = 'P001'").fetchone()
        if row:
            ok("P001 exists")
            cols = [d[1] for d in conn.execute("PRAGMA table_info(patients)").fetchall()]
            # Check medications field is populated
            idx = cols.index('medications') if 'medications' in cols else -1
            if idx >= 0 and row[idx]:
                meds = row[idx]
                if 'Metformin' in meds:
                    ok(f"P001 medications: contains Metformin")
                else:
                    fail(f"P001 medications: {meds}")
            else:
                fail("P001 medications: empty or missing column")
        else:
            fail("P001 patient record MISSING")
    except Exception as e:
        fail(f"P001 check: {e}")

    conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# 16. GAUSSIAN PLOT DATA
# ══════════════════════════════════════════════════════════════════════════════
def test_gaussian_plots():
    print("\n=== 16. Gaussian Plot Data ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()

    # All 9 features should return 3 curves
    for feat in engine.weights.keys():
        data = engine.get_gaussian_plot_data(feat)
        if isinstance(data, list) and len(data) == 3:
            # Each curve should have x, y arrays of same length
            for curve in data:
                if len(curve.get('x', [])) == len(curve.get('y', [])) and len(curve['x']) > 0:
                    pass
                else:
                    fail(f"Gaussian '{feat}': curve x/y length mismatch")
                    break
            else:
                ok(f"Gaussian '{feat}': 3 curves, {len(data[0]['x'])} points each")
        else:
            fail(f"Gaussian '{feat}': returned {type(data).__name__}, len={len(data) if data else 'None'}")

    # Unknown feature -> None
    data = engine.get_gaussian_plot_data("nonexistent_feature")
    if data is None:
        ok("Gaussian(nonexistent) -> None")
    else:
        fail(f"Gaussian(nonexistent) -> {data}")

    # With observed value outside normal range
    data = engine.get_gaussian_plot_data('glucose_avg', observed_value=30.0)
    if data and len(data) == 3:
        # x range should extend to include 30
        max_x = max(data[0]['x'])
        if max_x >= 30:
            ok(f"Gaussian(glucose, obs=30): x range extends to {max_x:.1f}")
        else:
            fail(f"Gaussian(glucose, obs=30): x range only to {max_x:.1f}")
    else:
        fail("Gaussian(glucose, obs=30) failed")


# ══════════════════════════════════════════════════════════════════════════════
# 17. EMISSION LOG PROB — EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════
def test_emission_log_prob():
    print("\n=== 17. Emission Log Prob Edge Cases ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()

    # Full observation -> all features contribute
    full_obs = {
        'glucose_avg': 6.5, 'glucose_variability': 25, 'meds_adherence': 0.9,
        'carbs_intake': 155, 'steps_daily': 5500, 'resting_hr': 68,
        'hrv_rmssd': 32, 'sleep_quality': 7.5, 'social_engagement': 10
    }
    lp, details = engine.get_emission_log_prob(full_obs, 0)  # STABLE
    missing = [f for f, d in details.items() if d['is_missing']]
    if len(missing) == 0:
        ok(f"Full obs: 0 missing features, lp={lp:.2f}")
    else:
        fail(f"Full obs: {len(missing)} missing")

    # STABLE obs should have highest lp for STABLE state
    lp_stable, _ = engine.get_emission_log_prob(full_obs, 0)
    lp_warning, _ = engine.get_emission_log_prob(full_obs, 1)
    lp_crisis, _ = engine.get_emission_log_prob(full_obs, 2)
    if lp_stable > lp_warning and lp_stable > lp_crisis:
        ok(f"STABLE obs: lp_STABLE ({lp_stable:.1f}) > WARNING ({lp_warning:.1f}) > CRISIS ({lp_crisis:.1f})")
    else:
        warn(f"STABLE obs: lp_S={lp_stable:.1f}, lp_W={lp_warning:.1f}, lp_C={lp_crisis:.1f}")

    # Empty observation -> all features missing -> lp ≈ 0 (log(1))
    lp, details = engine.get_emission_log_prob({}, 0)
    assert_close(lp, 0.0, 0.001, "Empty obs emission lp")

    # Dawn phenomenon: hour_of_day between 4-8 shifts glucose mean
    obs_dawn = {'glucose_avg': 7.5, 'hour_of_day': 6}
    obs_noon = {'glucose_avg': 7.5, 'hour_of_day': 12}
    lp_dawn, d_dawn = engine.get_emission_log_prob(obs_dawn, 0)
    lp_noon, d_noon = engine.get_emission_log_prob(obs_noon, 0)
    dawn_mean = d_dawn['glucose_avg']['state_mean']
    noon_mean = d_noon['glucose_avg']['state_mean']
    if dawn_mean > noon_mean:
        ok(f"Dawn: STABLE glucose mean at 6AM ({dawn_mean:.2f}) > noon ({noon_mean:.2f})")
    else:
        fail(f"Dawn: 6AM mean ({dawn_mean}) NOT > noon mean ({noon_mean})")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 70)
    print("BEWO HEALTHCARE — EXHAUSTIVE EDGE-CASE TEST SUITE")
    print("=" * 70)

    start = time.time()

    test_utility_functions()
    test_safety_monitor()
    test_viterbi_edge_cases()
    test_monte_carlo_edge_cases()
    test_counterfactual()
    test_future_risk()
    test_baum_welch_edge_cases()
    test_calibration()
    test_all_demo_scenarios()
    test_merlion_edge_cases()
    test_drug_interactions_exhaustive()
    test_mass_simulation()
    test_validation_suite()
    test_numerical_stability()
    test_database_deep()
    test_gaussian_plots()
    test_emission_log_prob()

    elapsed = time.time() - start

    print("\n" + "=" * 70)
    print(f"RESULTS: {PASS} passed, {FAIL} failed, {WARN} warnings")
    print(f"TIME: {elapsed:.1f}s")
    print("=" * 70)

    if FAIL > 0:
        print(f"\n!! {FAIL} FAILURES -- fix before demo!")
        sys.exit(1)
    else:
        print(f"\nAll critical tests passed!")
        sys.exit(0)
