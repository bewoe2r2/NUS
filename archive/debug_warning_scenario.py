"""
Debug script to verify why warning_to_crisis scenario shows as STABLE.
"""
from hmm_engine import HMMEngine, EMISSION_PARAMS

engine = HMMEngine()

# Generate warning_to_crisis scenario
obs = engine.generate_demo_scenario('warning_to_crisis', days=14)

print('=== WARNING_TO_CRISIS Scenario Values ===')
print()
print('Day 0-4: STABLE phase')
for day in [0, 2, 4]:
    bucket = day * 6
    if bucket < len(obs):
        o = obs[bucket]
        gluc = o.get('glucose_avg', 'N/A')
        meds = o.get('meds_adherence', 'N/A')
        steps = o.get('steps_daily', 'N/A')
        print(f"Day {day}: glucose={gluc:.1f}, meds={meds:.2f}, steps={steps:.0f}")

print()
print('Day 5-9: WARNING phase')
for day in [5, 7, 9]:
    bucket = day * 6
    if bucket < len(obs):
        o = obs[bucket]
        gluc = o.get('glucose_avg', 'N/A')
        meds = o.get('meds_adherence', 'N/A')
        steps = o.get('steps_daily', 'N/A')
        print(f"Day {day}: glucose={gluc:.1f}, meds={meds:.2f}, steps={steps:.0f}")

print()
print('Day 10-13: CRISIS phase')
for day in [10, 12, 13]:
    bucket = day * 6
    if bucket < len(obs):
        o = obs[bucket]
        gluc = o.get('glucose_avg', 'N/A')
        meds = o.get('meds_adherence', 'N/A')
        steps = o.get('steps_daily', 'N/A')
        print(f"Day {day}: glucose={gluc:.1f}, meds={meds:.2f}, steps={steps:.0f}")

print()
print('=== EMISSION_PARAMS Means ===')
for state_idx, state in enumerate(['STABLE', 'WARNING', 'CRISIS']):
    print(f'{state}:')
    print(f"  glucose_avg mean: {EMISSION_PARAMS['glucose_avg']['means'][state_idx]}")
    print(f"  meds_adherence mean: {EMISSION_PARAMS['meds_adherence']['means'][state_idx]}")
    print(f"  steps_daily mean: {EMISSION_PARAMS['steps_daily']['means'][state_idx]}")

print()
print('=== Running HMM Inference ===')
result = engine.run_inference(obs)
print(f"Final State: {result['current_state']}")
print(f"Confidence: {result['confidence']:.1%}")
print(f"State Probabilities: {result['state_probabilities']}")

print()
print('=== Day-by-Day States ===')
for day in range(14):
    bucket = day * 6
    window_start = max(0, bucket - 42)  
    window_obs = obs[window_start:bucket+6]
    if window_obs:
        day_result = engine.run_inference(window_obs)
        print(f"Day {day}: {day_result['current_state']} (conf: {day_result['confidence']:.1%})")
