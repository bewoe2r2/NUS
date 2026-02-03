"""
COMPREHENSIVE SCENARIO TEST
Tests ALL demo scenarios and shows what HMM states they produce.
"""
from hmm_engine import HMMEngine

engine = HMMEngine()

ALL_SCENARIOS = [
    "stable_perfect",
    "stable_realistic", 
    "stable_noisy",
    "missing_data",
    "gradual_decline",
    "warning_to_crisis",
    "warning_recovery",
    "sudden_crisis",
    "sudden_spike",
    "recovery"
]

print("=" * 80)
print("COMPREHENSIVE SCENARIO TEST")
print("=" * 80)

for scenario in ALL_SCENARIOS:
    print(f"\n{'='*80}")
    print(f"SCENARIO: {scenario.upper()}")
    print("=" * 80)
    
    # Generate scenario
    obs = engine.generate_demo_scenario(scenario, days=14)
    
    # Show key values per phase
    print("\n--- RAW DATA (sample days) ---")
    for day in [0, 4, 7, 10, 13]:
        bucket = day * 6
        if bucket < len(obs):
            o = obs[bucket]
            gluc = o.get('glucose_avg', 0)
            meds = o.get('meds_adherence', 0)
            steps = o.get('steps_daily', 0)
            gluc_str = f"{gluc:5.1f}" if gluc is not None else " None"
            meds_str = f"{meds:.2f}" if meds is not None else "None"
            steps_str = f"{steps:5.0f}" if steps is not None else " None"
            print(f"  Day {day:2d}: glucose={gluc_str}, meds={meds_str}, steps={steps_str}")
    
    # Run HMM day by day
    print("\n--- HMM INFERENCE ---")
    states_by_day = []
    for day in range(14):
        bucket = (day + 1) * 6 - 1  # End of each day
        if bucket < len(obs):
            window_start = max(0, bucket - 42)
            window_obs = obs[window_start:bucket+1]
            if window_obs:
                result = engine.run_inference(window_obs)
                states_by_day.append(result['current_state'])
                print(f"  Day {day:2d}: {result['current_state']:8s} (conf: {result['confidence']:5.1%})")
    
    # Summary
    print("\n--- SUMMARY ---")
    stable_count = states_by_day.count('STABLE')
    warning_count = states_by_day.count('WARNING')
    crisis_count = states_by_day.count('CRISIS')
    print(f"  STABLE: {stable_count}, WARNING: {warning_count}, CRISIS: {crisis_count}")
    
    # Check if it matches expectations
    if scenario == "stable_perfect":
        expected = "All STABLE"
        ok = stable_count == 14
    elif scenario == "stable_realistic":
        expected = "All STABLE"
        ok = stable_count >= 12
    elif scenario == "stable_noisy":
        expected = "Mostly STABLE"
        ok = stable_count >= 10
    elif scenario == "missing_data":
        expected = "Mostly STABLE"
        ok = stable_count >= 10
    elif scenario == "gradual_decline":
        expected = "STABLE → WARNING"
        ok = warning_count >= 3
    elif scenario == "warning_to_crisis":
        expected = "STABLE → WARNING → CRISIS"
        ok = warning_count >= 2 and crisis_count >= 1
    elif scenario == "warning_recovery":
        expected = "STABLE → WARNING → STABLE"
        ok = warning_count >= 2
    elif scenario == "sudden_crisis":
        expected = "STABLE then CRISIS"
        ok = crisis_count >= 1
    elif scenario == "sudden_spike":
        expected = "STABLE → CRISIS → recovery"
        ok = crisis_count >= 1 or warning_count >= 2
    elif scenario == "recovery":
        expected = "CRISIS → WARNING → STABLE"
        ok = crisis_count >= 1 or warning_count >= 3
    else:
        expected = "Unknown"
        ok = True
    
    status = "✅ PASS" if ok else "❌ FAIL"
    print(f"  Expected: {expected}")
    print(f"  Status: {status}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
