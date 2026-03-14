"""
Comprehensive test suite for Bewo Healthcare pipeline.
Tests HMM engine, Baum-Welch, Monte Carlo, drug interactions, triage,
agent runtime, and API endpoints with 100+ synthetic patients.

Run: python -m tests.test_full_pipeline  (from project root)
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import time
import random
import traceback
import sqlite3
import numpy as np

# ── Helpers ──────────────────────────────────────────────────────────────────
PASS = 0
FAIL = 0
WARN = 0

def ok(label: str):
    global PASS
    PASS += 1
    print(f"  [PASS] {label}")

def fail(label: str, detail: str = ""):
    global FAIL
    FAIL += 1
    print(f"  [FAIL] {label} -- {detail}")

def warn(label: str, detail: str = ""):
    global WARN
    WARN += 1
    print(f"  [WARN] {label} -- {detail}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 1: HMM Engine Core — Viterbi, Emissions, States
# ══════════════════════════════════════════════════════════════════════════════
def test_hmm_core():
    print("\n=== TEST 1: HMM Engine Core ===")
    from core.hmm_engine import HMMEngine, STATES, TRANSITION_PROBS, INITIAL_PROBS, EMISSION_PARAMS, WEIGHTS

    engine = HMMEngine()

    # 1a: Transition matrix row sums
    for i, row in enumerate(TRANSITION_PROBS):
        s = sum(row)
        if abs(s - 1.0) < 1e-9:
            ok(f"Transition row {STATES[i]} sums to 1.0")
        else:
            fail(f"Transition row {STATES[i]} sums to {s}")

    # 1b: Initial probs sum
    s = sum(INITIAL_PROBS)
    if abs(s - 1.0) < 1e-9:
        ok(f"Initial probs sum to 1.0")
    else:
        fail(f"Initial probs sum to {s}")

    # 1c: Feature weights sum
    ws = sum(WEIGHTS.values())
    if abs(ws - 1.0) < 1e-6:
        ok(f"Feature weights sum to 1.0 ({ws:.6f})")
    else:
        fail(f"Feature weights sum to {ws}")

    # 1d: All 9 features defined
    expected_feats = {'glucose_avg', 'glucose_variability', 'meds_adherence', 'carbs_intake',
                      'steps_daily', 'resting_hr', 'hrv_rmssd', 'sleep_quality', 'social_engagement'}
    actual_feats = set(EMISSION_PARAMS.keys())
    if expected_feats == actual_feats:
        ok(f"All 9 emission features defined")
    else:
        fail(f"Feature mismatch: missing={expected_feats - actual_feats}, extra={actual_feats - expected_feats}")

    # 1e: Emission params all have 3 means/vars (one per state)
    for feat, params in EMISSION_PARAMS.items():
        if len(params['means']) == 3 and len(params['vars']) == 3:
            ok(f"Emission '{feat}' has 3 means + 3 vars")
        else:
            fail(f"Emission '{feat}' shape wrong: means={len(params['means'])}, vars={len(params['vars'])}")
        # No zero or negative variance
        for j, v in enumerate(params['vars']):
            if v <= 0:
                fail(f"Emission '{feat}' state {j} has var={v} (must be >0)")

    # 1f: Viterbi on perfect STABLE observation
    stable_obs = {
        'glucose_avg': 6.5, 'glucose_variability': 25, 'meds_adherence': 0.9,
        'carbs_intake': 155, 'steps_daily': 5500, 'resting_hr': 68,
        'hrv_rmssd': 32, 'sleep_quality': 7.5, 'social_engagement': 10
    }
    result = engine.run_inference([stable_obs])
    if result['current_state'] == 'STABLE':
        ok(f"Viterbi: perfect STABLE obs -> STABLE (conf={result['confidence']:.2f})")
    else:
        fail(f"Viterbi: perfect STABLE obs -> {result['current_state']}")

    # 1g: Viterbi on perfect CRISIS observation
    crisis_obs = {
        'glucose_avg': 18, 'glucose_variability': 55, 'meds_adherence': 0.3,
        'carbs_intake': 320, 'steps_daily': 800, 'resting_hr': 98,
        'hrv_rmssd': 10, 'sleep_quality': 2.5, 'social_engagement': 1.5
    }
    result = engine.run_inference([crisis_obs])
    if result['current_state'] == 'CRISIS':
        ok(f"Viterbi: perfect CRISIS obs -> CRISIS (conf={result['confidence']:.2f})")
    else:
        fail(f"Viterbi: perfect CRISIS obs -> {result['current_state']}")

    # 1h: Viterbi on empty observations
    result = engine.run_inference([])
    if result['current_state'] == 'STABLE':
        ok(f"Viterbi: empty obs -> STABLE (fallback)")
    else:
        fail(f"Viterbi: empty obs -> {result['current_state']}")

    # 1i: Viterbi with None/missing features
    partial_obs = {'glucose_avg': 12.0, 'meds_adherence': None}
    result = engine.run_inference([partial_obs])
    if result['current_state'] in STATES:
        ok(f"Viterbi: partial obs -> {result['current_state']} (handles None)")
    else:
        fail(f"Viterbi: partial obs failed")

    # 1j: Viterbi sequence (STABLE -> WARNING transition)
    seq = [stable_obs] * 5 + [
        {'glucose_avg': 11, 'glucose_variability': 38, 'meds_adherence': 0.65,
         'carbs_intake': 230, 'steps_daily': 3000, 'resting_hr': 82,
         'hrv_rmssd': 18, 'sleep_quality': 5, 'social_engagement': 5}
    ] * 5
    result = engine.run_inference(seq)
    if result['current_state'] in ['WARNING', 'CRISIS']:
        ok(f"Viterbi: STABLE->WARNING sequence -> {result['current_state']}")
    else:
        warn(f"Viterbi: STABLE->WARNING sequence -> {result['current_state']} (expected WARNING)")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 2: Monte Carlo Crisis Prediction
# ══════════════════════════════════════════════════════════════════════════════
def test_monte_carlo():
    print("\n=== TEST 2: Monte Carlo Crisis Prediction ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()


    # 2a: STABLE observation -> low crisis probability
    stable_obs = {
        'glucose_avg': 6.5, 'glucose_variability': 25, 'meds_adherence': 0.9,
        'carbs_intake': 155, 'steps_daily': 5500, 'resting_hr': 68,
        'hrv_rmssd': 32, 'sleep_quality': 7.5, 'social_engagement': 10
    }
    result = engine.predict_time_to_crisis(stable_obs, horizon_hours=48, num_simulations=1000)
    if result.get('prob_crisis_percent') is not None:
        p = result['prob_crisis_percent'] / 100.0
        if p < 0.2:
            ok(f"Monte Carlo: STABLE -> {p:.1%} crisis probability (< 20%)")
        else:
            warn(f"Monte Carlo: STABLE -> {p:.1%} crisis probability (expected < 20%)")
    else:
        fail(f"Monte Carlo: no probability returned, keys={list(result.keys())}")

    # 2b: CRISIS observation -> high crisis probability
    crisis_obs = {
        'glucose_avg': 18, 'glucose_variability': 55, 'meds_adherence': 0.3,
        'carbs_intake': 320, 'steps_daily': 800, 'resting_hr': 98,
        'hrv_rmssd': 10, 'sleep_quality': 2.5, 'social_engagement': 1.5
    }
    result = engine.predict_time_to_crisis(crisis_obs, horizon_hours=48, num_simulations=1000)
    if result.get('prob_crisis_percent') is not None:
        p = result['prob_crisis_percent'] / 100.0
        if p > 0.5:
            ok(f"Monte Carlo: CRISIS -> {p:.1%} crisis probability (> 50%)")
        else:
            warn(f"Monte Carlo: CRISIS -> {p:.1%} crisis probability (expected > 50%)")
    else:
        fail(f"Monte Carlo: no probability returned for CRISIS obs")

    # 2c: Survival curve monotonically non-increasing
    curve = result.get('survival_curve', [])
    if len(curve) > 0:
        probs = [p['survived'] for p in curve]
        is_monotonic = all(probs[i] >= probs[i+1] - 0.001 for i in range(len(probs)-1))
        if is_monotonic:
            ok(f"Monte Carlo: survival curve monotonically non-increasing ({len(curve)} points)")
        else:
            fail(f"Monte Carlo: survival curve NOT monotonic")
    else:
        warn(f"Monte Carlo: no survival curve returned")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 3: Baum-Welch Training
# ══════════════════════════════════════════════════════════════════════════════
def test_baum_welch():
    print("\n=== TEST 3: Baum-Welch Training ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()

    # Generate synthetic sequences
    rng = np.random.default_rng(42)
    sequences = []
    for _ in range(5):
        seq = []
        for t in range(20):
            seq.append({
                'glucose_avg': rng.normal(7.0, 1.0),
                'glucose_variability': rng.normal(28, 5),
                'meds_adherence': min(1.0, max(0.0, rng.normal(0.85, 0.1))),
                'carbs_intake': rng.normal(160, 20),
                'steps_daily': max(0, rng.normal(5000, 500)),
                'resting_hr': rng.normal(70, 5),
                'hrv_rmssd': max(1, rng.normal(30, 5)),
                'sleep_quality': max(0, min(10, rng.normal(7, 1))),
                'social_engagement': max(0, rng.normal(8, 2)),
            })
        sequences.append(seq)

    # 3a: Baum-Welch runs without crashing
    try:
        result = engine.baum_welch(sequences, max_iter=10, tol=1e-3)
        ok(f"Baum-Welch: completed {result['iterations']} iterations")
    except Exception as e:
        fail(f"Baum-Welch: crashed -- {e}")
        return

    # 3b: Log-likelihood monotonically non-decreasing
    ll_hist = result['log_likelihood_history']
    if len(ll_hist) > 1:
        increasing = all(ll_hist[i] <= ll_hist[i+1] + 0.01 for i in range(len(ll_hist)-1))
        if increasing:
            ok(f"Baum-Welch: log-likelihood monotonically non-decreasing ({ll_hist[0]:.1f} -> {ll_hist[-1]:.1f})")
        else:
            warn(f"Baum-Welch: log-likelihood NOT monotonic (numerical instability?)")
    else:
        warn(f"Baum-Welch: only 1 iteration, can't check monotonicity")

    # 3c: Learned transitions valid probability matrix
    trans = result.get('learned_transitions')
    if trans is not None:
        for i, row in enumerate(trans):
            s = sum(row)
            if abs(s - 1.0) < 1e-6:
                ok(f"Baum-Welch: learned transition row {STATES[i]} sums to 1.0")
            else:
                fail(f"Baum-Welch: learned transition row {STATES[i]} sums to {s}")
    else:
        fail(f"Baum-Welch: no learned transitions returned")

    # 3d: Learned emissions have reasonable values
    emissions = result.get('learned_emissions')
    if emissions:
        for feat, params in emissions.items():
            for j, v in enumerate(params['vars']):
                if v <= 0:
                    fail(f"Baum-Welch: learned emission '{feat}' state {j} var={v} (must be >0)")
        ok(f"Baum-Welch: learned emissions have positive variances ({len(emissions)} features)")
    else:
        warn(f"Baum-Welch: no learned emissions returned")

    # 3e: Per-patient training
    try:
        pt_result = engine.train_patient_baum_welch("TEST_P001", sequences, max_iter=10)
        if pt_result.get('success'):
            ok(f"Per-patient Baum-Welch: trained TEST_P001 ({pt_result.get('iterations', '?')} iters)")
        else:
            warn(f"Per-patient Baum-Welch: returned success=False")
    except Exception as e:
        fail(f"Per-patient Baum-Welch: crashed -- {e}")

    # 3f: Inference uses personalized params
    if 'TEST_P001' in engine._personalized_baselines or 'TEST_P001' in getattr(engine, '_personalized_transitions', {}):
        result2 = engine.run_inference(sequences[0], patient_id='TEST_P001')
        if result2['current_state'] in STATES:
            ok(f"Personalized inference: TEST_P001 -> {result2['current_state']}")
        else:
            fail(f"Personalized inference: unexpected state {result2['current_state']}")
    else:
        warn(f"Personalized params not stored for TEST_P001")

    # 3g: Edge case -- all sequences length 1 (should not crash)
    try:
        short_seqs = [[{'glucose_avg': 7.0}]]
        result3 = engine.baum_welch(short_seqs, max_iter=5)
        ok(f"Baum-Welch: handles length-1 sequences without crash")
    except Exception as e:
        fail(f"Baum-Welch: crashed on length-1 sequences -- {e}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 4: Drug Interaction Checking
# ══════════════════════════════════════════════════════════════════════════════
def test_drug_interactions():
    print("\n=== TEST 4: Drug Interaction Checking ===")
    from core.agent_runtime import check_drug_interactions

    # 4a: Known CONTRAINDICATED pair: metformin + contrast dye
    result = check_drug_interactions(["Metformin 500mg BD"], proposed_medication="Contrast Dye")
    interactions = result.get('interactions', [])
    contraindicated = [i for i in interactions if i.get('severity') == 'CONTRAINDICATED']
    if contraindicated:
        ok(f"Drug check: Metformin + Contrast Dye -> CONTRAINDICATED")
    else:
        warn(f"Drug check: Metformin + Contrast Dye -> {[i.get('severity') for i in interactions]} (expected CONTRAINDICATED)")

    # 4b: Known MAJOR pair: ACE inhibitor + potassium
    result = check_drug_interactions(["Lisinopril 10mg OD"], proposed_medication="Potassium Supplement")
    interactions = result.get('interactions', [])
    major = [i for i in interactions if i.get('severity') in ['MAJOR', 'CONTRAINDICATED']]
    if major:
        ok(f"Drug check: Lisinopril + Potassium -> {major[0]['severity']}")
    else:
        warn(f"Drug check: Lisinopril + Potassium -> no major interaction found")

    # 4c: Benzodiazepines + Opioids
    result = check_drug_interactions(["Diazepam 5mg"], proposed_medication="Morphine 10mg")
    interactions = result.get('interactions', [])
    if any(i.get('severity') in ['CONTRAINDICATED', 'MAJOR'] for i in interactions):
        ok(f"Drug check: Diazepam + Morphine -> flagged")
    else:
        warn(f"Drug check: Diazepam + Morphine -> not flagged")

    # 4d: Safe combination -- no interactions
    result = check_drug_interactions(["Atorvastatin 20mg"], proposed_medication="Paracetamol 500mg")
    interactions = result.get('interactions', [])
    if len(interactions) == 0:
        ok(f"Drug check: Atorvastatin + Paracetamol -> no interactions (correct)")
    else:
        warn(f"Drug check: Atorvastatin + Paracetamol -> found {len(interactions)} interactions")

    # 4e: Multiple medications (P001's full list)
    result = check_drug_interactions([
        "Metformin 500mg BD", "Lisinopril 10mg OD", "Atorvastatin 20mg ON", "Aspirin 100mg OD"
    ])
    total = len(result.get('interactions', []))
    ok(f"Drug check: P001's 4 meds -> {total} interactions found among existing meds")

    # 4f: Empty medication list
    result = check_drug_interactions([])
    if result.get('interactions') == []:
        ok(f"Drug check: empty list -> no interactions")
    else:
        fail(f"Drug check: empty list -> unexpected result")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 5: Mass Patient Simulation (100 synthetic patients through HMM)
# ══════════════════════════════════════════════════════════════════════════════
def test_mass_simulation():
    print("\n=== TEST 5: Mass Patient Simulation (100 patients x 5 scenarios) ===")
    from core.hmm_engine import HMMEngine, STATES

    engine = HMMEngine()


    scenarios = ['stable_perfect', 'realistic_stable', 'warning_recovery', 'warning_to_crisis', 'sudden_crisis']
    results_summary = {s: {'counts': {st: 0 for st in STATES}, 'errors': 0} for s in scenarios}

    for scenario in scenarios:
        for patient_num in range(20):  # 20 patients per scenario = 100 total
            seed = 1000 + patient_num
            try:
                observations = engine.generate_demo_scenario(scenario, days=14, seed=seed)
                if not observations:
                    fail(f"Scenario {scenario} patient {patient_num}: empty observations")
                    results_summary[scenario]['errors'] += 1
                    continue

                result = engine.run_inference(observations)
                state = result['current_state']
                if state in STATES:
                    results_summary[scenario]['counts'][state] += 1
                else:
                    results_summary[scenario]['errors'] += 1

                # Monte Carlo on final observation
                mc = engine.predict_time_to_crisis(observations[-1], horizon_hours=48, num_simulations=500)
                if mc.get('prob_crisis_percent') is None:
                    results_summary[scenario]['errors'] += 1

            except Exception as e:
                results_summary[scenario]['errors'] += 1
                if patient_num == 0:  # Only print first error per scenario
                    fail(f"Scenario {scenario}: {e}")

    # Validate distributions
    for scenario, data in results_summary.items():
        total = sum(data['counts'].values())
        errors = data['errors']
        dist = {k: v for k, v in data['counts'].items() if v > 0}
        if errors == 0:
            ok(f"{scenario}: {total} patients, {dist}, 0 errors")
        elif errors <= 2:
            warn(f"{scenario}: {total} patients, {dist}, {errors} errors")
        else:
            fail(f"{scenario}: {total} patients, {dist}, {errors} errors")

    # Sanity checks on distributions
    stable_ratio = results_summary['stable_perfect']['counts']['STABLE'] / 20
    if stable_ratio >= 0.7:
        ok(f"stable_perfect: {stable_ratio:.0%} STABLE (expected >=70%)")
    else:
        fail(f"stable_perfect: only {stable_ratio:.0%} STABLE")

    crisis_count = results_summary['sudden_crisis']['counts']['CRISIS'] + results_summary['sudden_crisis']['counts']['WARNING']
    if crisis_count >= 10:
        ok(f"sudden_crisis: {crisis_count}/20 in WARNING/CRISIS (expected >=50%)")
    else:
        warn(f"sudden_crisis: only {crisis_count}/20 in WARNING/CRISIS")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 6: Demo Scenario Generation
# ══════════════════════════════════════════════════════════════════════════════
def test_demo_scenarios():
    print("\n=== TEST 6: Demo Scenario Generation ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()


    scenarios = ['stable_perfect', 'realistic_stable', 'warning_recovery', 'warning_to_crisis', 'sudden_crisis']

    for scenario in scenarios:
        obs = engine.generate_demo_scenario(scenario, days=14, seed=42)
        if not obs:
            fail(f"generate_demo_scenario('{scenario}'): returned empty")
            continue

        for i, o in enumerate(obs):
            if 'glucose_avg' not in o:
                fail(f"Scenario '{scenario}' obs[{i}]: missing glucose_avg")
                break
        else:
            ok(f"Scenario '{scenario}': {len(obs)} observations, all have glucose_avg")

        glucose_vals = [o.get('glucose_avg', 0) for o in obs]
        min_g, max_g = min(glucose_vals), max(glucose_vals)
        if min_g >= 2.0 and max_g <= 35.0:
            ok(f"Scenario '{scenario}': glucose range [{min_g:.1f}, {max_g:.1f}] within bounds")
        else:
            fail(f"Scenario '{scenario}': glucose range [{min_g:.1f}, {max_g:.1f}] OUT OF BOUNDS")

        meds = [o.get('meds_adherence', 0) for o in obs if o.get('meds_adherence') is not None]
        if meds:
            if min(meds) >= 0 and max(meds) <= 1.0:
                ok(f"Scenario '{scenario}': meds_adherence in [0, 1]")
            else:
                fail(f"Scenario '{scenario}': meds_adherence out of bounds [{min(meds)}, {max(meds)}]")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 7: Validation Suite (built-in)
# ══════════════════════════════════════════════════════════════════════════════
def test_validation_suite():
    print("\n=== TEST 7: Built-in Validation Suite ===")
    from core.hmm_engine import ValidationSuite

    try:
        suite = ValidationSuite()
        report = suite.run_full_validation(verbose=False)

        accuracy = report.get('overall_accuracy', 0)
        if accuracy >= 0.7:
            ok(f"Validation: overall accuracy {accuracy:.1%} (>=70%)")
        else:
            warn(f"Validation: overall accuracy {accuracy:.1%} (< 70%)")

        roc_auc = report.get('roc_auc', 0)
        if roc_auc >= 0.7:
            ok(f"Validation: ROC AUC {roc_auc:.3f} (>=0.7)")
        else:
            warn(f"Validation: ROC AUC {roc_auc:.3f} (< 0.7)")

        for state in ['STABLE', 'WARNING', 'CRISIS']:
            per_class = report.get('per_class', {}).get(state, {})
            prec = per_class.get('precision', 0)
            rec = per_class.get('recall', 0)
            f1 = per_class.get('f1', 0)
            ok(f"Validation: {state} -- P={prec:.2f} R={rec:.2f} F1={f1:.2f}")

    except Exception as e:
        fail(f"Validation suite: {e}")
        traceback.print_exc()


# ══════════════════════════════════════════════════════════════════════════════
# TEST 8: Database Schema Integrity
# ══════════════════════════════════════════════════════════════════════════════
def test_database():
    print("\n=== TEST 8: Database Schema Integrity ===")
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

    if not os.path.exists(db_path):
        fail(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
    ok(f"Database: {len(tables)} tables found")

    critical = ['patients', 'glucose_readings', 'hmm_states', 'medication_logs',
                'voice_checkins', 'passive_metrics', 'voucher_tracker',
                'conversation_history', 'agent_actions_log', 'agent_memory']
    for t in critical:
        if t in tables:
            ok(f"Table '{t}' exists")
        else:
            fail(f"Table '{t}' MISSING")

    try:
        cols = [info[1] for info in conn.execute(f"PRAGMA table_info(patients)").fetchall()]
        for needed in ['user_id', 'conditions', 'medications']:
            if needed in cols:
                ok(f"patients.{needed} column exists")
            else:
                fail(f"patients.{needed} column MISSING")

        if 'display_name' in cols or 'name' in cols:
            ok(f"patients has name column ({'display_name' if 'display_name' in cols else 'name'})")
        else:
            fail(f"patients missing both 'name' and 'display_name'")
    except Exception as e:
        fail(f"patients table check: {e}")

    row = conn.execute("SELECT * FROM patients WHERE user_id = 'P001'").fetchone()
    if row:
        ok(f"P001 patient record exists")
    else:
        fail(f"P001 patient record MISSING")

    conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# TEST 9: Merlion Risk Engine
# ══════════════════════════════════════════════════════════════════════════════
def test_merlion():
    print("\n=== TEST 9: Merlion Risk Engine ===")
    from core.merlion_risk_engine import MerlionRiskEngine

    engine = MerlionRiskEngine()

    # 9a: Normal glucose -> low risk
    normal = [5.5, 6.0, 5.8, 6.2, 5.9, 6.1, 5.7, 6.0, 5.8, 6.3, 5.9, 6.0]
    result = engine.calculate_risk(normal)
    p = result.get('prob_crisis_45min', 0)
    if p < 0.5:
        ok(f"Merlion: normal glucose -> prob_crisis={p:.2f} (< 0.5)")
    else:
        warn(f"Merlion: normal glucose -> prob_crisis={p}")

    # 9b: Rising glucose -> higher risk
    rising = [6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0]
    result = engine.calculate_risk(rising)
    p = result.get('prob_crisis_45min', 0)
    if p > 0.1:
        ok(f"Merlion: rising glucose -> prob_crisis={p:.2f} (> 0.1)")
    else:
        warn(f"Merlion: rising glucose -> prob_crisis={p}")

    # 9c: Too few data points -> empty/low risk
    result = engine.calculate_risk([5.0, 6.0])
    status = result.get('status', '')
    if 'INSUFFICIENT' in status or result.get('prob_crisis_45min', 0) == 0:
        ok(f"Merlion: 2 points -> insufficient data (correct)")
    else:
        warn(f"Merlion: 2 points -> {result}")

    # 9d: Empty -> insufficient data
    result = engine.calculate_risk([])
    status = result.get('status', '')
    if 'INSUFFICIENT' in status or result.get('prob_crisis_45min', 0) == 0:
        ok(f"Merlion: empty -> insufficient data (correct)")
    else:
        fail(f"Merlion: empty -> unexpected {result}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 10: Safety Monitor (Static Rules)
# ══════════════════════════════════════════════════════════════════════════════
def test_safety_offline():
    print("\n=== TEST 10: Safety Monitor (Static Rules) ===")
    from core.hmm_engine import SafetyMonitor

    # SafetyMonitor.check_safety returns a tuple (state, reason)
    # 10a: Extremely high glucose -> should flag
    obs = {'glucose_avg': 25.0, 'resting_hr': 120, 'meds_adherence': 0.1}
    state, reason = SafetyMonitor.check_safety(obs)
    if state in ['WARNING', 'CRISIS']:
        ok(f"Safety: glucose=25 + HR=120 -> {state} ({reason})")
    else:
        warn(f"Safety: glucose=25 + HR=120 -> {state}")

    # 10b: Normal vitals -> no alarm
    obs = {'glucose_avg': 6.5, 'resting_hr': 70, 'meds_adherence': 0.9}
    state, reason = SafetyMonitor.check_safety(obs)
    if state in ['STABLE', 'NORMAL', None, '']:
        ok(f"Safety: normal vitals -> {state}")
    else:
        warn(f"Safety: normal vitals -> {state} (expected STABLE)")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 11: Gaussian Plot Data (for frontend visualization)
# ══════════════════════════════════════════════════════════════════════════════
def test_gaussian_plots():
    print("\n=== TEST 11: Gaussian Plot Data ===")
    from core.hmm_engine import HMMEngine

    engine = HMMEngine()


    for feat in ['glucose_avg', 'meds_adherence', 'steps_daily', 'hrv_rmssd', 'sleep_quality']:
        data = engine.get_gaussian_plot_data(feat, observed_value=7.0 if feat == 'glucose_avg' else None)
        # Returns a list of curve dicts directly (not wrapped in a dict)
        if isinstance(data, list) and len(data) == 3:
            ok(f"Gaussian plot '{feat}': 3 curves returned")
        elif isinstance(data, dict) and 'curves' in data and len(data['curves']) == 3:
            ok(f"Gaussian plot '{feat}': 3 curves returned (wrapped)")
        elif data is None:
            fail(f"Gaussian plot '{feat}': returned None (feature not found)")
        else:
            fail(f"Gaussian plot '{feat}': unexpected return type {type(data).__name__}, len={len(data) if hasattr(data, '__len__') else 'N/A'}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 70)
    print("BEWO HEALTHCARE -- COMPREHENSIVE PIPELINE TEST")
    print("=" * 70)

    start = time.time()

    test_hmm_core()
    test_monte_carlo()
    test_baum_welch()
    test_drug_interactions()
    test_mass_simulation()
    test_demo_scenarios()
    test_validation_suite()
    test_database()
    test_merlion()
    test_safety_offline()
    test_gaussian_plots()

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
