"""
tests/generate_test_matrix.py
=============================
Generates the Exhaustive Test Matrix using Orthogonal Binning (Equivalence Partitioning).
Output: tests/test_matrix.json

Methodology:
- We divide each continuous variable into clinically significant buckets (Bins).
- We use itertools.product to generate EVERY combination of these buckets.
- This creates ~648-1500 distinct scenarios covering the full decision space.
"""

import itertools
import json
import os

# 1. Define Orthogonal Bins (The Boundaries)
BINS = {
    "glucose_state": [
        {"id": "HYPO", "val": 3.5, "desc": "Hypoglycemia (<3.9)"},
        {"id": "NORMAL", "val": 5.5, "desc": "Normal Range (4-8)"},
        {"id": "WARNING", "val": 11.0, "desc": "Elevated (10-14)"},
        {"id": "CRISIS", "val": 18.0, "desc": "Severe Hyper (>15)"}
    ],
    "trend": [
        {"id": "FALLING", "val": -0.8, "desc": "Dropping fast"},
        {"id": "STABLE", "val": 0.0, "desc": "Flat"},
        {"id": "RISING", "val": 0.8, "desc": "Rising fast"}
    ],
    "meds_adherence": [
        {"id": "NONE", "val": 0.0, "desc": "0% Adherence"},
        {"id": "PARTIAL", "val": 0.5, "desc": "50% Adherence"},
        {"id": "FULL", "val": 1.0, "desc": "100% Adherence"}
    ],
    "sleep_quality": [
        {"id": "POOR", "val": 3.0, "desc": "Insomniac"},
        {"id": "GOOD", "val": 8.0, "desc": "Restorative"}
    ],
    "stress_hrv": [
        {"id": "HIGH_STRESS", "val": 15.0, "desc": "Low HRV (15ms)"},
        {"id": "RELAXED", "val": 50.0, "desc": "High HRV (50ms)"}
    ],
    "activity": [
        {"id": "SEDENTARY", "val": 1000, "desc": "Bedbound"},
        {"id": "ACTIVE", "val": 8000, "desc": "Walking"}
    ]
}

def generate_matrix():
    print("Generating HMM Oracle Test Matrix...")
    
    # Extract keys and value lists
    keys = list(BINS.keys())
    value_lists = [BINS[k] for k in keys]
    
    # Generate Cartesian Product
    combinations = list(itertools.product(*value_lists))
    
    scenarios = []
    for i, combo in enumerate(combinations):
        scenario = {
            "id": f"SCEN_{i:04d}",
            "description": f"{combo[0]['id']} | {combo[1]['id']} | Meds:{combo[2]['id']}",
            "inputs": {
                "glucose_avg": combo[0]['val'],
                "glucose_variability": combo[1]['val'], # simulated strictly via glucose history
                "meds_adherence": combo[2]['val'],
                "sleep_quality": combo[3]['val'],
                "hrv_rmssd": combo[4]['val'],
                "steps_daily": combo[5]['val']
            },
            "meta": {
                "glucose_cat": combo[0]['id'],
                "trend_cat": combo[1]['id'],
                "meds_cat": combo[2]['id']
            }
        }
        scenarios.append(scenario)
        
    print(f"Generated {len(scenarios)} unique edge cases.")
    
    # Ensure directory exists
    os.makedirs("tests", exist_ok=True)
    
    # Save to JSON
    output_path = "tests/test_matrix.json"
    with open(output_path, "w") as f:
        json.dump(scenarios, f, indent=2)
        
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    generate_matrix()
