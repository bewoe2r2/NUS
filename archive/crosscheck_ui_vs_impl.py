"""
CROSS-CHECK: UI Scenarios vs Actual Implementations
This finds ALL discrepancies between what's in the UI and what actually works
"""
import _path_setup
import os
import re

print("=" * 60)
print("CROSS-CHECK: UI vs IMPLEMENTATION")
print("=" * 60)

# 1. Find UI scenarios from streamlit_app.py
_archive_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_archive_dir)
with open(os.path.join(_archive_dir, "streamlit_app.py"), "r", encoding="utf-8") as f:
    streamlit_content = f.read()

# Look for scenario definitions in the admin panel
ui_scenarios = set()
# Pattern: "scenario_name": {
matches = re.findall(r'"(\w+)":\s*{\s*"name":', streamlit_content)
ui_scenarios.update(matches)

# Also check inject_data choices
with open(os.path.join(_project_root, "scripts", "inject_data.py"), "r", encoding="utf-8") as f:
    inject_content = f.read()
inject_matches = re.findall(r"choices=\[([^\]]+)\]", inject_content)
for match in inject_matches:
    choices = re.findall(r"'(\w+)'", match)
    ui_scenarios.update(choices)

# Filter out tier names (BASIC, ENHANCED, PREMIUM are not scenarios)
tier_names = {"BASIC", "ENHANCED", "PREMIUM"}
ui_scenarios = ui_scenarios - tier_names

print(f"\n[1] UI/CLI SCENARIOS FOUND: {len(ui_scenarios)}")
for s in sorted(ui_scenarios):
    print(f"    - {s}")

# 2. Find implemented scenarios in hmm_engine.py
with open(os.path.join(_project_root, "core", "hmm_engine.py"), "r", encoding="utf-8") as f:
    hmm_content = f.read()

# Pattern: elif scenario_type == "name" or if scenario_type == "name"
impl_matches = re.findall(r'(?:if|elif)\s+scenario_type\s*==\s*"(\w+)"', hmm_content)
implemented_scenarios = set(impl_matches)

print(f"\n[2] IMPLEMENTED SCENARIOS: {len(implemented_scenarios)}")
for s in sorted(implemented_scenarios):
    print(f"    - {s}")

# 3. Find discrepancies
missing_impl = ui_scenarios - implemented_scenarios
extra_impl = implemented_scenarios - ui_scenarios

print("\n" + "=" * 60)
if missing_impl:
    print(f"❌ IN UI BUT NOT IMPLEMENTED: {missing_impl}")
else:
    print("✅ All UI scenarios are implemented!")

if extra_impl:
    print(f"⚠️  IMPLEMENTED BUT NOT IN UI: {extra_impl}")

# 4. Test each scenario actually works
print("\n" + "=" * 60)
print("[3] FUNCTIONAL TEST OF EACH SCENARIO")
print("=" * 60)

from hmm_engine import HMMEngine
engine = HMMEngine()

all_scenarios = ui_scenarios | implemented_scenarios
expected_results = {
    "stable_perfect": "STABLE",
    "stable_realistic": "STABLE", 
    "stable_noisy": "STABLE",
    "missing_data": "STABLE",
    "gradual_decline": "WARNING",
    "warning_to_crisis": "CRISIS",
    "warning_recovery": "STABLE",  # Ends in recovery
    "sudden_crisis": "CRISIS",
    "sudden_spike": "STABLE",  # Spikes recover, stays STABLE overall
    "recovery": "STABLE",  # Ends in recovery
}

errors = []
for scenario in sorted(all_scenarios):
    try:
        obs = engine.generate_demo_scenario(scenario, days=14)
        result = engine.run_inference(obs)
        final = result['current_state']
        expected = expected_results.get(scenario, "?")
        
        if final == expected:
            print(f"  ✓ {scenario:20s} → {final} (expected {expected})")
        else:
            print(f"  ✗ {scenario:20s} → {final} (expected {expected})")
            errors.append(f"{scenario}: got {final}, expected {expected}")
    except Exception as e:
        print(f"  ✗ {scenario:20s} → ERROR: {e}")
        errors.append(f"{scenario}: {e}")

print("\n" + "=" * 60)
if errors:
    print(f"❌ {len(errors)} ERRORS FOUND:")
    for e in errors:
        print(f"  • {e}")
else:
    print("✅ ALL SCENARIOS WORK CORRECTLY!")
