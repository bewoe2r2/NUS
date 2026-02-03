"""
NEXUS 2026 - Personalized Baselines Research Validation
========================================================
OBJECTIVE: Honestly evaluate if personalized baselines improve detection accuracy.

This is NOT a demo designed to succeed. This is a rigorous A/B test that will
show both successes AND failures of personalization.

METHODOLOGY:
1. Generate 100 synthetic patients with varying "true" baselines
2. For each patient, generate a 30-day health trajectory
3. Run BOTH population HMM and personalized HMM
4. Compare detection accuracy against GROUND TRUTH
5. Calculate sensitivity, specificity, and accuracy
6. Identify WHERE personalization helps and WHERE it fails

HYPOTHESIS:
- Personalized HMM should detect deterioration EARLIER for patients
  whose baselines differ significantly from population mean
- Personalized HMM might OVER-ALERT for patients with high variability
- For "average" patients, both should perform similarly

Author: NEXUS Research Team
Date: 2026-01-29
"""

import sys
import os
import random
import json
import math
from dataclasses import dataclass
from typing import List, Dict, Tuple
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hmm_engine import HMMEngine, EMISSION_PARAMS, STATES


# ==============================================================================
# PATIENT ARCHETYPES (Real clinical phenotypes)
# ==============================================================================

@dataclass
class PatientProfile:
    """Represents a patient's TRUE baseline (ground truth)."""
    patient_id: str
    archetype: str
    
    # True baseline values (what's "normal" for THIS patient)
    true_glucose_baseline: float
    true_glucose_variability: float
    true_hr_baseline: float
    true_hrv_baseline: float
    
    # How different from population mean
    glucose_deviation: float  # mmol/L from population mean
    
    # Expected outcome
    expected_advantage: str  # "personalized", "population", "neutral"


PATIENT_ARCHETYPES = {
    # -----------------------------------------------------------------
    # PATIENTS WHERE PERSONALIZATION SHOULD HELP
    # -----------------------------------------------------------------
    "athlete_diabetic": {
        "description": "Athletic T2D patient with excellent control",
        "true_glucose": 5.0,  # Well below population mean
        "glucose_var": 8.0,   # Low variability (tight control)
        "true_hr": 55,        # Low resting HR (athlete)
        "true_hrv": 55,       # High HRV (good autonomic function)
        "expected": "personalized"
    },
    "elderly_high_baseline": {
        "description": "Elderly patient with naturally higher glucose",
        "true_glucose": 7.5,  # Above population mean
        "glucose_var": 15.0,  # Moderate variability
        "true_hr": 75,        # Higher resting HR
        "true_hrv": 25,       # Lower HRV (age-related)
        "expected": "personalized"
    },
    "young_tight_control": {
        "description": "Young T1D with pump, very tight control",
        "true_glucose": 5.2,  # Low baseline
        "glucose_var": 10.0,  # Low variability (pump)
        "true_hr": 62,        # Normal
        "true_hrv": 50,       # Good HRV
        "expected": "personalized"
    },
    
    # -----------------------------------------------------------------
    # PATIENTS WHERE POPULATION MIGHT BE BETTER
    # -----------------------------------------------------------------
    "highly_variable": {
        "description": "Patient with erratic glucose (hard to establish baseline)",
        "true_glucose": 6.5,  # Average
        "glucose_var": 35.0,  # HIGH variability
        "true_hr": 70,        # Normal
        "true_hrv": 35,       # Below average
        "expected": "population"  # Personalization might overfit to noise
    },
    "newly_diagnosed": {
        "description": "Newly diagnosed, no stable baseline yet",
        "true_glucose": 8.0,  # Still adjusting
        "glucose_var": 25.0,  # High variability
        "true_hr": 72,        # Normal
        "true_hrv": 40,       # Average
        "expected": "population"  # Not enough stable data
    },
    
    # -----------------------------------------------------------------
    # PATIENTS WHERE IT DOESN'T MATTER
    # -----------------------------------------------------------------
    "average_joe": {
        "description": "Average patient, close to population mean",
        "true_glucose": 6.5,  # Population mean exactly
        "glucose_var": 20.0,  # Average
        "true_hr": 68,        # Average
        "true_hrv": 40,       # Average
        "expected": "neutral"
    },
}


# ==============================================================================
# TRAJECTORY GENERATION (Ground Truth)
# ==============================================================================

def generate_patient_trajectory(profile: PatientProfile, days: int = 30, seed: int = None) -> List[Dict]:
    """
    Generate a realistic 30-day trajectory for a patient.
    
    GROUND TRUTH: We know exactly when the patient transitions to WARNING/CRISIS.
    This allows us to measure detection accuracy.
    """
    if seed:
        random.seed(seed)
        np.random.seed(seed)
    
    trajectory = []
    buckets_per_day = 6
    
    # Decide on a crisis event timing (random day 15-25)
    crisis_day = random.randint(15, 25) if random.random() < 0.7 else None  # 70% have a crisis
    
    for day in range(days):
        for bucket in range(buckets_per_day):
            obs = {}
            
            # Determine ground truth state
            if crisis_day and day >= crisis_day:
                if day >= crisis_day + 2:
                    ground_truth_state = "CRISIS"
                else:
                    ground_truth_state = "WARNING"
            else:
                ground_truth_state = "STABLE"
            
            # Generate data based on ground truth state
            if ground_truth_state == "STABLE":
                # Normal variation around patient's TRUE baseline
                obs['glucose_avg'] = profile.true_glucose_baseline + np.random.normal(0, 0.5)
                obs['glucose_variability'] = profile.true_glucose_variability + np.random.normal(0, 3)
                obs['meds_adherence'] = min(1.0, max(0.7, np.random.normal(0.90, 0.05)))
                obs['carbs_intake'] = profile.true_glucose_baseline * 22 + np.random.normal(0, 15)  # Scaled to glucose
                obs['steps_daily'] = 7000 + np.random.normal(0, 1500)
                obs['resting_hr'] = profile.true_hr_baseline + np.random.normal(0, 3)
                obs['hrv_rmssd'] = profile.true_hrv_baseline + np.random.normal(0, 5)
                obs['sleep_quality'] = 7.0 + np.random.normal(0, 0.5)
                obs['social_engagement'] = 12 + np.random.normal(0, 3)
                
            elif ground_truth_state == "WARNING":
                # Deterioration from baseline
                days_since_crisis = day - crisis_day
                deterioration = 1.0 + (days_since_crisis * 0.3)
                
                obs['glucose_avg'] = profile.true_glucose_baseline * deterioration + np.random.normal(0, 0.8)
                obs['glucose_variability'] = profile.true_glucose_variability * 1.3 + np.random.normal(0, 4)
                obs['meds_adherence'] = min(1.0, max(0.4, np.random.normal(0.70, 0.10)))
                obs['carbs_intake'] = 200 + np.random.normal(0, 30)
                obs['steps_daily'] = 4000 + np.random.normal(0, 1000)
                obs['resting_hr'] = profile.true_hr_baseline * 1.1 + np.random.normal(0, 4)
                obs['hrv_rmssd'] = profile.true_hrv_baseline * 0.8 + np.random.normal(0, 5)
                obs['sleep_quality'] = 5.5 + np.random.normal(0, 0.8)
                obs['social_engagement'] = 7 + np.random.normal(0, 3)
                
            else:  # CRISIS
                days_since_crisis = day - crisis_day
                severity = min(1.5, 1.2 + (days_since_crisis * 0.1))
                
                obs['glucose_avg'] = profile.true_glucose_baseline * severity + 4.0 + np.random.normal(0, 1.0)
                obs['glucose_variability'] = profile.true_glucose_variability * 1.8 + np.random.normal(0, 5)
                obs['meds_adherence'] = min(1.0, max(0.2, np.random.normal(0.45, 0.15)))
                obs['carbs_intake'] = 280 + np.random.normal(0, 40)
                obs['steps_daily'] = 1500 + np.random.normal(0, 800)
                obs['resting_hr'] = profile.true_hr_baseline * 1.25 + np.random.normal(0, 5)
                obs['hrv_rmssd'] = profile.true_hrv_baseline * 0.5 + np.random.normal(0, 4)
                obs['sleep_quality'] = 4.0 + np.random.normal(0, 0.8)
                obs['social_engagement'] = 3 + np.random.normal(0, 2)
            
            # Clamp all values to valid ranges
            obs['glucose_avg'] = max(2.0, min(30.0, obs['glucose_avg']))
            obs['glucose_variability'] = max(5.0, min(80.0, obs['glucose_variability']))
            obs['meds_adherence'] = max(0.0, min(1.0, obs['meds_adherence']))
            obs['carbs_intake'] = max(50, min(450, obs['carbs_intake']))
            obs['steps_daily'] = max(0, min(25000, obs['steps_daily']))
            obs['resting_hr'] = max(40, min(120, obs['resting_hr']))
            obs['hrv_rmssd'] = max(5, min(100, obs['hrv_rmssd']))
            obs['sleep_quality'] = max(1, min(10, obs['sleep_quality']))
            obs['social_engagement'] = max(0, min(50, obs['social_engagement']))
            
            trajectory.append({
                'observation': obs,
                'ground_truth_state': ground_truth_state,
                'day': day,
                'bucket': bucket
            })
    
    return trajectory, crisis_day


# ==============================================================================
# VALIDATION ENGINE
# ==============================================================================

class PersonalizationValidator:
    """Validates personalization against population baseline."""
    
    def __init__(self):
        self.engine = HMMEngine()
        self.results = []
    
    def validate_patient(self, profile: PatientProfile, trajectory: List[Dict], 
                         calibration_days: int = 7) -> Dict:
        """
        Compare population vs personalized HMM for a single patient.
        
        Uses first `calibration_days` of STABLE data for personalization.
        Evaluates detection accuracy on remaining data.
        """
        # Split data: calibration vs evaluation
        calibration_obs = []
        evaluation_data = []
        
        buckets_per_day = 6
        calibration_buckets = calibration_days * buckets_per_day
        
        for i, item in enumerate(trajectory):
            if i < calibration_buckets and item['ground_truth_state'] == 'STABLE':
                calibration_obs.append(item['observation'])
            if i >= calibration_buckets:
                evaluation_data.append(item)
        
        # Calibrate personalized baseline
        personalized_params = self.engine.calibrate_baseline(
            calibration_obs, 
            patient_id=profile.patient_id
        )
        
        # Run both HMMs on evaluation data
        pop_results = []
        personal_results = []
        
        # Sliding window inference (7-day windows)
        window_size = 7 * 6  # 7 days
        
        for i in range(len(evaluation_data) - window_size + 1):
            window = evaluation_data[i:i + window_size]
            obs_window = [item['observation'] for item in window]
            ground_truth = window[-1]['ground_truth_state']
            
            # Population HMM (standard)
            pop_result = self.engine.run_inference(obs_window)
            pop_state = pop_result['current_state']
            
            # Personalized HMM (using calibrated params)
            # Full integration modifies emission params at inference time
            personal_result = self.engine.run_inference(obs_window, patient_id=profile.patient_id)
            personal_state = personal_result['current_state']
            
            pop_results.append({
                'predicted': pop_state,
                'ground_truth': ground_truth,
                'correct': pop_state == ground_truth
            })
            
            personal_results.append({
                'predicted': personal_state,
                'ground_truth': ground_truth,
                'correct': personal_state == ground_truth
            })
        
        # Calculate metrics
        pop_metrics = self._calculate_metrics(pop_results)
        personal_metrics = self._calculate_metrics(personal_results)
        
        # Determine winner
        pop_score = pop_metrics['f1_score'] if pop_metrics['f1_score'] else 0
        personal_score = personal_metrics['f1_score'] if personal_metrics['f1_score'] else 0
        
        if personal_score > pop_score + 0.05:
            winner = "personalized"
        elif pop_score > personal_score + 0.05:
            winner = "population"
        else:
            winner = "neutral"
        
        return {
            'patient_id': profile.patient_id,
            'archetype': profile.archetype,
            'expected_winner': profile.expected_advantage,
            'actual_winner': winner,
            'population_metrics': pop_metrics,
            'personalized_metrics': personal_metrics,
            'glucose_deviation': profile.glucose_deviation,
            'personalized_baseline': personalized_params['glucose_avg']['STABLE']['mean'],
            'population_baseline': EMISSION_PARAMS['glucose_avg']['means'][0],
            'true_baseline': profile.true_glucose_baseline,
            'calibration_data': {
                'personalized_params': personalized_params
            },
            'trajectory_data': [
                {
                    'day': item['day'],
                    'bucket': item['bucket'],
                    'ground_truth': item['ground_truth_state'],
                    'glucose': item['observation'].get('glucose_avg'),
                    'pop_prediction': pop_results[i - (len(trajectory) - len(pop_results))]['predicted'] if i >= (len(trajectory) - len(pop_results)) else None,
                    'personal_prediction': personal_results[i - (len(trajectory) - len(personal_results))]['predicted'] if i >= (len(trajectory) - len(personal_results)) else None
                }
                for i, item in enumerate(trajectory)
            ]
        }
    
    def _calculate_metrics(self, results: List[Dict]) -> Dict:
        """Calculate sensitivity, specificity, precision, recall, F1."""
        if not results:
            return {'accuracy': 0, 'sensitivity': 0, 'specificity': 0, 'f1_score': 0}
        
        # True Positives: Predicted WARNING/CRISIS when actually WARNING/CRISIS
        # False Positives: Predicted WARNING/CRISIS when actually STABLE
        # True Negatives: Predicted STABLE when actually STABLE
        # False Negatives: Predicted STABLE when actually WARNING/CRISIS
        
        tp = sum(1 for r in results if r['predicted'] != 'STABLE' and r['ground_truth'] != 'STABLE')
        fp = sum(1 for r in results if r['predicted'] != 'STABLE' and r['ground_truth'] == 'STABLE')
        tn = sum(1 for r in results if r['predicted'] == 'STABLE' and r['ground_truth'] == 'STABLE')
        fn = sum(1 for r in results if r['predicted'] == 'STABLE' and r['ground_truth'] != 'STABLE')
        
        accuracy = (tp + tn) / len(results) if results else 0
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0  # Recall for danger
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0
        
        return {
            'accuracy': round(accuracy, 3),
            'sensitivity': round(sensitivity, 3),  # Catching actual danger
            'specificity': round(specificity, 3),  # Not false alarming
            'precision': round(precision, 3),
            'f1_score': round(f1, 3),
            'true_positives': tp,
            'false_positives': fp,
            'true_negatives': tn,
            'false_negatives': fn
        }
    
    def run_full_validation(self, n_patients_per_archetype: int = 10) -> Dict:
        """Run validation across all patient archetypes."""
        print("=" * 70)
        print("PERSONALIZED BASELINES RESEARCH VALIDATION")
        print("=" * 70)
        print(f"\nGenerating {n_patients_per_archetype} patients per archetype...")
        print(f"Total patients: {len(PATIENT_ARCHETYPES) * n_patients_per_archetype}")
        print()
        
        all_results = []
        archetype_summaries = {}
        
        for archetype_name, archetype_data in PATIENT_ARCHETYPES.items():
            print(f"\n--- Testing: {archetype_name} ---")
            print(f"    {archetype_data['description']}")
            
            archetype_results = []
            
            for i in range(n_patients_per_archetype):
                patient_id = f"{archetype_name}_{i:03d}"
                
                # Create patient profile with some random variation
                variation = np.random.normal(0, 0.3)
                profile = PatientProfile(
                    patient_id=patient_id,
                    archetype=archetype_name,
                    true_glucose_baseline=archetype_data['true_glucose'] + variation,
                    true_glucose_variability=archetype_data['glucose_var'] + np.random.normal(0, 2),
                    true_hr_baseline=archetype_data['true_hr'] + np.random.normal(0, 3),
                    true_hrv_baseline=archetype_data['true_hrv'] + np.random.normal(0, 4),
                    glucose_deviation=archetype_data['true_glucose'] - EMISSION_PARAMS['glucose_avg']['means'][0],
                    expected_advantage=archetype_data['expected']
                )
                
                # Generate trajectory
                trajectory, crisis_day = generate_patient_trajectory(profile, days=30, seed=i * 100 + hash(archetype_name) % 1000)
                
                # Validate
                result = self.validate_patient(profile, trajectory)
                archetype_results.append(result)
                all_results.append(result)
            
            # Summarize archetype
            winners = [r['actual_winner'] for r in archetype_results]
            personalized_wins = winners.count('personalized')
            population_wins = winners.count('population')
            neutral = winners.count('neutral')
            
            archetype_summaries[archetype_name] = {
                'expected': archetype_data['expected'],
                'personalized_wins': personalized_wins,
                'population_wins': population_wins,
                'neutral': neutral,
                'hypothesis_supported': (
                    (archetype_data['expected'] == 'personalized' and personalized_wins > population_wins) or
                    (archetype_data['expected'] == 'population' and population_wins > personalized_wins) or
                    (archetype_data['expected'] == 'neutral' and abs(personalized_wins - population_wins) <= 2)
                )
            }
            
            print(f"    Results: Personalized={personalized_wins}, Population={population_wins}, Neutral={neutral}")
            print(f"    Hypothesis ({'[OK]' if archetype_summaries[archetype_name]['hypothesis_supported'] else '[X]'}): Expected '{archetype_data['expected']}'")
        
        # Overall summary
        print("\n" + "=" * 70)
        print("OVERALL RESULTS")
        print("=" * 70)
        
        total_personalized = sum(s['personalized_wins'] for s in archetype_summaries.values())
        total_population = sum(s['population_wins'] for s in archetype_summaries.values())
        total_neutral = sum(s['neutral'] for s in archetype_summaries.values())
        
        print(f"\nTotal Wins:")
        print(f"  Personalized HMM: {total_personalized}")
        print(f"  Population HMM:   {total_population}")
        print(f"  Neutral/Tie:      {total_neutral}")
        
        hypotheses_supported = sum(1 for s in archetype_summaries.values() if s['hypothesis_supported'])
        print(f"\nHypotheses Supported: {hypotheses_supported}/{len(archetype_summaries)}")
        
        # Calculate average metrics
        avg_pop_sensitivity = np.mean([r['population_metrics']['sensitivity'] for r in all_results])
        avg_personal_sensitivity = np.mean([r['personalized_metrics']['sensitivity'] for r in all_results])
        avg_pop_specificity = np.mean([r['population_metrics']['specificity'] for r in all_results])
        avg_personal_specificity = np.mean([r['personalized_metrics']['specificity'] for r in all_results])
        
        print(f"\nAverage Sensitivity (catching danger):")
        print(f"  Population:    {avg_pop_sensitivity:.3f}")
        print(f"  Personalized:  {avg_personal_sensitivity:.3f}")
        
        print(f"\nAverage Specificity (avoiding false alarms):")
        print(f"  Population:    {avg_pop_specificity:.3f}")
        print(f"  Personalized:  {avg_personal_specificity:.3f}")
        
        # Honest assessment
        print("\n" + "=" * 70)
        print("HONEST ASSESSMENT")
        print("=" * 70)
        
        if total_personalized > total_population * 1.2:
            verdict = "POSITIVE: Personalization shows clear improvement"
        elif total_personalized > total_population:
            verdict = "MARGINAL: Personalization shows slight improvement"
        elif abs(total_personalized - total_population) <= total_neutral:
            verdict = "NEUTRAL: No significant difference"
        else:
            verdict = "NEGATIVE: Personalization performs worse"
        
        print(f"\nVerdict: {verdict}")
        
        # Recommendations
        print("\nRecommendations:")
        for archetype, summary in archetype_summaries.items():
            if summary['personalized_wins'] > summary['population_wins']:
                print(f"  [+] Use personalization for: {archetype}")
            elif summary['population_wins'] > summary['personalized_wins']:
                print(f"  [-] Keep population for: {archetype}")
            else:
                print(f"  [=] Either works for: {archetype}")
        
        return {
            'all_results': all_results,
            'archetype_summaries': archetype_summaries,
            'overall': {
                'personalized_wins': total_personalized,
                'population_wins': total_population,
                'neutral': total_neutral,
                'verdict': verdict
            }
        }


# ==============================================================================
# MAIN
# ==============================================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Run HMM Personalization Validation Study')
    parser.add_argument('--n', type=int, default=10, help='Number of patients per archetype')
    args = parser.parse_args()

    print("\n" + "=" * 70)
    print(f"NEXUS 2026 - PERSONALIZED BASELINES VALIDATION STUDY (N={args.n * 6} patients)")
    print("=" * 70)
    print("\nThis is an HONEST evaluation. Results may show personalization")
    print("doesn't help - that's a valid and important finding.")
    print()
    
    validator = PersonalizationValidator()
    results = validator.run_full_validation(n_patients_per_archetype=args.n)
    
    # Save results
    output_path = 'personalization_validation_full_data.json'
    with open(output_path, 'w') as f:
        # Convert numpy types for JSON serialization
        def convert(obj):
            if isinstance(obj, np.floating):
                return float(obj)
            if isinstance(obj, np.integer):
                return int(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            return obj
        
        serializable_results = {
            'metadata': {
                'date': '2026-01-29',
                'description': 'Full validation study data including trajectories and predictions for detailed analysis.'
            },
            'overall': results['overall'],
            'archetype_summaries': results['archetype_summaries'],
            'patient_data': results['all_results']
        }
        json.dump(serializable_results, f, indent=2, default=convert)
    
    print(f"\n\nResults saved to: {output_path}")
