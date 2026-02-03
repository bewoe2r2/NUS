import sys
import os
import json
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hmm_engine import HMMEngine

def run_demo():
    engine = HMMEngine()
    
    print("Running Proactive Oracle Demo...")
    
    scenarios = {
        "stable_patient": [
            {'glucose_avg': 5.5, 'glucose_var': 1.0},
            {'glucose_avg': 5.6, 'glucose_var': 1.1},
            {'glucose_avg': 5.4, 'glucose_var': 0.9}
        ],
        "deteriorating_patient": [
            {'glucose_avg': 7.5, 'glucose_var': 2.0},  # Warning-ish
            {'glucose_avg': 8.5, 'glucose_var': 3.5},  # Worsening
            {'glucose_avg': 10.5, 'glucose_var': 5.0}  # Near Crisis
        ],
        "crisis_patient": [
            {'glucose_avg': 16.0, 'glucose_var': 10.0}
        ]
    }
    
    results = {}
    
    for name, obs in scenarios.items():
        print(f"  Simulating {name}...")
        inference = engine.run_inference(obs)
        
        results[name] = {
            "final_state": inference['current_state'],
            "confidence": inference['confidence'],
            "predicted_risk_48h": inference['predictions']['risk_48h'],
            "predicted_risk_12h": inference['predictions']['risk_12h'],
            "state_probs": inference['state_probabilities']
        }
        
    # Save to file
    with open('feature8_oracle_results.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    print("Results saved to feature8_oracle_results.json")

if __name__ == "__main__":
    run_demo()
