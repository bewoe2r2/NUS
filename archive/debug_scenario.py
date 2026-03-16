"""Debug warning_recovery scenario"""
import _path_setup
from hmm_engine import HMMEngine, STATES

e = HMMEngine()
obs = e.generate_demo_scenario('warning_recovery', days=14)

print('=== Sample observations by day ===')
for day in [0, 5, 7, 9, 12]:
    bucket = day * 6  # 6 buckets per day
    if bucket < len(obs):
        o = obs[bucket]
        print(f"Day {day}: glucose={o['glucose_avg']:.1f}, meds={o['meds_adherence']:.2f}, steps={o['steps_daily']:.0f}")

print()
print('=== Running inference... ===')
result = e.run_inference(obs)
print(f"Final: {result['current_state']} ({result['confidence']*100:.1f}%)")
print(f"State probs: {result['state_probabilities']}")
print()
print(f"Full path ({len(result['path_states'])} steps):")
# Group by day (6 buckets per day)
for day in range(14):
    day_states = result['path_states'][day*6:(day+1)*6]
    day_summary = max(set(day_states), key=day_states.count) if day_states else "?"
    print(f"  Day {day}: {day_summary} ({day_states})")
