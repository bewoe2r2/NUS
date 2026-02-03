# Test new competition scenarios
from hmm_engine import HMMEngine

e = HMMEngine()
scenarios = ['demo_merlion', 'demo_counterfactual', 'demo_intervention_success', 'demo_tier_basic', 'demo_full_crisis']

print("Testing competition scenarios:")
print("-" * 50)
for s in scenarios:
    obs = e.generate_demo_scenario(s, days=14)
    result = e.run_inference(obs)
    print(f"  {s:30s}: {result['current_state']} ({result['confidence']:.1%})")
