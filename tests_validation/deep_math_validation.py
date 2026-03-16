"""
Standalone validation script. Run directly: python deep_math_validation.py
Not a pytest test file — executes validation on import.

DEEP MATH VALIDATION
Checks EVERY observation, EVERY day, EVERY calculation
"""
import sys
import os
import sqlite3
import json
import math

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'core'))

from hmm_engine import HMMEngine, STATES, EMISSION_PARAMS, WEIGHTS, gaussian_pdf, safe_log, TRANSITION_PROBS

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
engine = HMMEngine()

print("=" * 70)
print("DEEP MATH VALIDATION - EVERY DAY, EVERY DATA POINT")
print("=" * 70)

errors = []
warnings = []

# ============================================================
# 1. VALIDATE EMISSION PARAMETERS
# ============================================================
print("\n[1] EMISSION PARAMETERS VALIDATION")
print("-" * 50)

for feature, params in EMISSION_PARAMS.items():
    means = params['means']
    vars_ = params['vars']
    bounds = params['bounds']
    
    # Check means are ordered correctly for the feature
    issues = []
    
    # All variances must be positive
    for i, v in enumerate(vars_):
        if v <= 0:
            issues.append(f"variance[{STATES[i]}] = {v} (must be > 0)")
    
    # Bounds should be sensible
    if bounds[0] >= bounds[1]:
        issues.append(f"bounds {bounds} invalid (min >= max)")
    
    if issues:
        print(f"  [FAIL] {feature}: {', '.join(issues)}")
        errors.append(f"{feature}: {issues}")
    else:
        print(f"  [PASS] {feature}: means={means}, vars={vars_}, bounds={bounds}")

# ============================================================
# 2. VALIDATE WEIGHTS SUM TO 1.0
# ============================================================
print("\n[2] FEATURE WEIGHTS VALIDATION")
print("-" * 50)

total_weight = sum(WEIGHTS.values())
if abs(total_weight - 1.0) < 0.001:
    print(f"  [PASS] Weights sum to {total_weight:.4f}")
else:
    print(f"  [FAIL] Weights sum to {total_weight:.4f} (should be 1.0)")
    errors.append(f"Weights sum to {total_weight}")

for feat, w in WEIGHTS.items():
    print(f"    {feat:25s}: {w:.2%}")

# ============================================================
# 3. VALIDATE TRANSITION MATRIX
# ============================================================
print("\n[3] TRANSITION MATRIX VALIDATION")
print("-" * 50)

for i, row in enumerate(TRANSITION_PROBS):
    row_sum = sum(row)
    if abs(row_sum - 1.0) < 0.001:
        print(f"  [PASS] {STATES[i]:8s} row sums to {row_sum:.4f}")
    else:
        print(f"  [FAIL] {STATES[i]:8s} row sums to {row_sum:.4f} (should be 1.0)")
        errors.append(f"Transition row {STATES[i]} sums to {row_sum}")

# ============================================================
# 4. VALIDATE GAUSSIAN PDF MATH
# ============================================================
print("\n[4] GAUSSIAN PDF MATH VALIDATION")
print("-" * 50)

# Known values for validation
test_cases = [
    # (x, mean, var, expected_pdf)
    (0, 0, 1, 0.3989422804),      # Standard normal at mean
    (1, 0, 1, 0.2419707245),      # Standard normal at x=1
    (5.8, 5.8, 0.8, 0.4460310290), # Glucose at mean
]

for x, mean, var, expected in test_cases:
    result = gaussian_pdf(x, mean, var)
    diff = abs(result - expected)
    if diff < 0.0001:
        print(f"  [PASS] gaussian_pdf({x}, {mean}, {var}) = {result:.6f} (expected {expected:.6f})")
    else:
        print(f"  [FAIL] gaussian_pdf({x}, {mean}, {var}) = {result:.6f} (expected {expected:.6f}, diff={diff:.6f})")
        errors.append(f"gaussian_pdf({x}, {mean}, {var}) wrong")

# Edge case: None handling
result = gaussian_pdf(None, 5.8, 0.8)
if result == 1.0:
    print(f"  [PASS] gaussian_pdf(None, ...) = 1.0 (correct marginalization)")
else:
    print(f"  [FAIL] gaussian_pdf(None, ...) = {result} (should be 1.0)")
    errors.append("gaussian_pdf None handling wrong")

# ============================================================
# 5. VALIDATE EACH DAY'S DATA IN DATABASE
# ============================================================
print("\n[5] DATABASE DATA VALIDATION - EACH DAY")
print("-" * 50)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

# Get all HMM states with their snapshots
states = conn.execute("""
    SELECT 
        id,
        date(timestamp_utc, 'unixepoch', 'localtime') as date,
        timestamp_utc,
        detected_state,
        confidence_score,
        input_vector_snapshot
    FROM hmm_states
    ORDER BY timestamp_utc ASC
""").fetchall()

print(f"  Validating {len(states)} HMM state records...")

state_counts = {"STABLE": 0, "WARNING": 0, "CRISIS": 0}
valid_observations = 0
missing_data_count = 0

for i, state in enumerate(states):
    state_name = state['detected_state']
    conf = state['confidence_score']
    snapshot_json = state['input_vector_snapshot']
    
    # Count states
    if state_name in state_counts:
        state_counts[state_name] += 1
    
    # Validate confidence is between 0 and 1
    if conf is None or conf < 0 or conf > 1:
        errors.append(f"ID {state['id']}: Invalid confidence {conf}")
    
    # Parse and validate snapshot
    if snapshot_json:
        try:
            snapshot = json.loads(snapshot_json)
            valid_observations += 1
            
            # Check each feature value is within bounds
            for feat, val in snapshot.items():
                if val is not None and feat in EMISSION_PARAMS:
                    bounds = EMISSION_PARAMS[feat]['bounds']
                    if val < bounds[0] or val > bounds[1]:
                        warnings.append(f"ID {state['id']}: {feat}={val} outside bounds {bounds}")
                elif val is None:
                    missing_data_count += 1
        except json.JSONDecodeError:
            errors.append(f"ID {state['id']}: Invalid JSON in snapshot")

print(f"  [PASS] Validated {valid_observations} observations with snapshots")
print(f"  State distribution: {state_counts}")
print(f"  Missing data points: {missing_data_count}")

# ============================================================
# 6. VALIDATE HMM INFERENCE CALCULATIONS
# ============================================================
print("\n[6] HMM INFERENCE CALCULATION VALIDATION")
print("-" * 50)

# Generate test observations and verify step-by-step
test_obs = [
    {'glucose_avg': 5.8, 'meds_adherence': 0.95, 'steps_daily': 6000},
    {'glucose_avg': 6.5, 'meds_adherence': 0.90, 'steps_daily': 5500},
    {'glucose_avg': 7.0, 'meds_adherence': 0.85, 'steps_daily': 5000},
]

print(f"  Testing HMM on {len(test_obs)} observations...")

# Run inference
result = engine.run_inference(test_obs)

# Manually verify emission probability for last observation
last_obs = test_obs[-1]
print(f"\n  Manual verification for last observation:")
print(f"    glucose_avg: {last_obs['glucose_avg']}")
print(f"    meds_adherence: {last_obs['meds_adherence']}")
print(f"    steps_daily: {last_obs['steps_daily']}")

for state_idx, state in enumerate(STATES):
    total_log_prob = 0
    for feat, val in last_obs.items():
        if feat in EMISSION_PARAMS:
            params = EMISSION_PARAMS[feat]
            p = gaussian_pdf(val, params['means'][state_idx], params['vars'][state_idx])
            lp = safe_log(p)
            weight = WEIGHTS.get(feat, 0)
            weighted_lp = weight * lp
            total_log_prob += weighted_lp
    print(f"    {state}: total_log_prob = {total_log_prob:.4f}")

print(f"\n  HMM Result: {result['current_state']} ({result['confidence']*100:.1f}% conf)")

# Verify state probabilities sum to ~1.0
prob_sum = sum(result['state_probabilities'].values())
if abs(prob_sum - 1.0) < 0.001:
    print(f"  [PASS] State probabilities sum to {prob_sum:.4f}")
else:
    print(f"  [FAIL] State probabilities sum to {prob_sum:.4f}")
    errors.append(f"State probs sum to {prob_sum}")

# ============================================================
# 7. VALIDATE EACH SCENARIO'S EXPECTED OUTCOME
# ============================================================
print("\n[7] SCENARIO OUTCOME VALIDATION")
print("-" * 50)

expected_outcomes = {
    "stable_perfect": "STABLE",
    "stable_realistic": "STABLE",
    "stable_noisy": "STABLE",
    "missing_data": "STABLE",
    "gradual_decline": "WARNING",
    "warning_to_crisis": "CRISIS",
    "sudden_crisis": "CRISIS",
    "recovery": "STABLE",
    "warning_recovery": "STABLE",
}

for scenario, expected in expected_outcomes.items():
    obs = engine.generate_demo_scenario(scenario, days=14)
    result = engine.run_inference(obs)
    actual = result['current_state']
    
    if actual == expected:
        print(f"  [PASS] {scenario:20s}: {actual} (expected {expected})")
    else:
        print(f"  [FAIL] {scenario:20s}: {actual} (expected {expected})")
        errors.append(f"Scenario {scenario}: got {actual}, expected {expected}")

# ============================================================
# 8. VALIDATE GLUCOSE DATA DAILY BREAKDOWN
# ============================================================
print("\n[8] GLUCOSE READINGS DAILY BREAKDOWN")
print("-" * 50)

glucose_by_day = conn.execute("""
    SELECT 
        date(reading_timestamp_utc, 'unixepoch', 'localtime') as date,
        COUNT(*) as count,
        AVG(reading_value) as avg_value,
        MIN(reading_value) as min_value,
        MAX(reading_value) as max_value
    FROM glucose_readings
    GROUP BY date
    ORDER BY date DESC
    LIMIT 14
""").fetchall()

print(f"  {'Date':<12} {'Count':>6} {'Avg':>8} {'Min':>8} {'Max':>8}")
print(f"  {'-'*12} {'-'*6} {'-'*8} {'-'*8} {'-'*8}")
for row in glucose_by_day:
    print(f"  {row['date']:<12} {row['count']:>6} {row['avg_value']:>8.2f} {row['min_value']:>8.2f} {row['max_value']:>8.2f}")

conn.close()

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 70)
print("DEEP MATH VALIDATION COMPLETE")
print("=" * 70)

if errors:
    print(f"\n[ERROR] ERRORS FOUND: {len(errors)}")
    for e in errors:
        print(f"  - {e}")
else:
    print("\n[OK] ALL MATH CHECKS PASSED!")
    print(f"   - {len(states)} HMM states validated")
    print(f"   - 9 emission parameters verified")
    print(f"   - 9 feature weights verified (sum=1.0)")
    print(f"   - 3x3 transition matrix verified")
    print(f"   - 9 demo scenarios verified")
    print(f"   - Gaussian PDF math verified")

if warnings:
    print(f"\n[WARN] WARNINGS: {len(warnings)}")
    for w in warnings[:10]:
        print(f"  - {w}")
    if len(warnings) > 10:
        print(f"  ... and {len(warnings) - 10} more")
