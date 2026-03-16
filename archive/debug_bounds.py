# Debug scenario generation
import _path_setup
from hmm_engine import HMMEngine

e = HMMEngine()
obs = e.generate_demo_scenario('warning_to_crisis', days=14)

print("Day | social_engagement | glucose_variability | Phase")
print("-" * 60)
for i, o in enumerate(obs):
    if i % 6 == 0:  # First bucket of each day
        day = i // 6
        se = o.get('social_engagement')
        gv = o.get('glucose_variability')
        if day <= 4:
            phase = "STABLE"
        elif day <= 9:
            phase = "WARNING"
        else:
            phase = "CRISIS"
        
        issue = ""
        if se is not None and se > 50:
            issue = " **EXCEEDS 50**"
        if gv is not None and gv < 5:
            issue += " **BELOW 5**"
            
        print(f"D{day:2d} | {se:17} | {gv:19.2f} | {phase}{issue}")
