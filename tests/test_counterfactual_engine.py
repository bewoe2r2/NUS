
import sys
import unittest
import math
# Adjust path to import hmm_engine from parent directory if needed
sys.path.append('..') 
from hmm_engine import HMMEngine, STATES

class TestCounterfactualEngine(unittest.TestCase):
    def setUp(self):
        self.engine = HMMEngine()

    def test_01_happy_path_medication(self):
        """
        Scenario 1: Happy Path
        Context: Patient in WARNING.
        Intervention: Taking Meds (0.95).
        Expectation: Risk reduces significantly.
        """
        # P(Stable, Warning, Crisis)
        current_probs = [0.0, 1.0, 0.0]
        
        intervention = {'meds_adherence': 0.95}
        result = self.engine.simulate_intervention(current_probs, intervention)
        
        print("\n[Scenario 1] Happy Path (Meds):")
        print(f"  Baseline Crisis Risk: {result['baseline_risk']:.4f}")
        print(f"  New Crisis Risk:      {result['new_risk']:.4f}")
        print(f"  Reduction:            {result['improvement_pct']:.1f}%")
        
        self.assertEqual(result['validity'], 'VALID')
        self.assertGreater(result['risk_reduction'], 0.0, "Risk should decrease")
        self.assertGreater(result['improvement_pct'], 10.0, "Should be significant improvement")

    def test_02_futile_intervention(self):
        """
        Scenario 2: Futile Intervention (Stickiness)
        Context: Patient in CRISIS (Sticky state).
        Intervention: Social Engagement (20).
        Expectation: Minimal reduction because Crisis is absorbing.
        """
        current_probs = [0.0, 0.0, 1.0] # 100% Crisis
        
        intervention = {'social_engagement': 4} # Moderate attempt, but insufficient
        result = self.engine.simulate_intervention(current_probs, intervention)
        
        print("\n[Scenario 2] Futile Intervention (Crisis):")
        print(f"  Baseline Crisis Risk: {result['baseline_risk']:.4f}")
        print(f"  New Crisis Risk:      {result['new_risk']:.4f}")
        print(f"  Reduction:            {result['improvement_pct']:.1f}%")
        
        # Should be small reduction or Warning transition, but not full cure
        # Crisis (0.84 transition) is sticky.
        # 4 is close to Warning (5), far from Stable (10).
        self.assertLess(result['improvement_pct'], 40.0, "Should not totally cure Crisis")
        self.assertGreater(result['new_risk'], 0.50, "Should remain significant risk")

    def test_03_already_perfect(self):
        """
        Scenario 3: Already Perfect (Probability Floor)
        Context: Patient in STABLE.
        Intervention: 10k Steps.
        Expectation: Risk remains near zero.
        """
        current_probs = [1.0, 0.0, 0.0]
        
        intervention = {'steps_daily': 10000}
        result = self.engine.simulate_intervention(current_probs, intervention)
        
        print("\n[Scenario 3] Already Perfect:")
        print(f"  Baseline Crisis Risk: {result['baseline_risk']:.4f}")
        print(f"  New Crisis Risk:      {result['new_risk']:.4f}")
        
        self.assertLess(result['new_risk'], 0.01, "Risk should stay negligible")

    def test_04_adversarial_intervention(self):
        """
        Scenario 4: Adversarial Intervention (Risk Paradox)
        Context: Patient in STABLE.
        Intervention: Massive Carb Binge (450g).
        Expectation: Risk INCREASES (Negative reduction).
        """
        current_probs = [1.0, 0.0, 0.0]
        
        intervention = {'carbs_intake': 450} # Massive binge
        result = self.engine.simulate_intervention(current_probs, intervention)
        
        print("\n[Scenario 4] Adversarial (Carb Binge):")
        print(f"  Baseline Crisis Risk: {result['baseline_risk']:.4f}")
        print(f"  New Crisis Risk:      {result['new_risk']:.4f}")
        print(f"  Reduction:            {result['risk_reduction']:.4f}")
        
        self.assertLess(result['risk_reduction'], 0.0, "Risk should INCREASE (negative reduction)")
        self.assertIn("INCREASES", result['message'], "Message should warn about increase")

    def test_05_non_orthogonal_conflict(self):
        """
        Scenario 5: Non-Orthogonal Conflict
        Context: Patient in WARNING.
        Intervention: Meds=1.0 (Good) BUT HR=110 (Bad).
        Expectation: The bad physiological signal (HR) should temper the good behavioral signal (Meds).
        """
        current_probs = [0.0, 1.0, 0.0]
        
        # Case A: Just Meds
        res_meds = self.engine.simulate_intervention(current_probs, {'meds_adherence': 1.0})
        
        # Case B: Meds + Tachycardia
        res_conflict = self.engine.simulate_intervention(current_probs, {'meds_adherence': 1.0, 'resting_hr': 110})
        
        print("\n[Scenario 5] Conflict (Meds vs Tachycardia):")
        print(f"  Meds Only Risk:       {res_meds['new_risk']:.4f}")
        print(f"  Meds + High HR Risk:  {res_conflict['new_risk']:.4f}")
        
        # The risk should be HIGHER in the conflict case than in the pure meds case
        self.assertGreater(res_conflict['new_risk'], res_meds['new_risk'], 
                          "Physical distress should partially override behavioral compliance")

    def test_06_sparse_data(self):
        """
        Scenario 6: Sparse Data (Missing Baseline - Simulated)
        This logic is mostly handled by the caller checking certainty index, 
        but we verify the engine handles 'uniform priors' robustly.
        """
        # Uniform prior = high uncertainty
        current_probs = [0.33, 0.33, 0.34] 
        
        intervention = {'meds_adherence': 1.0}
        result = self.engine.simulate_intervention(current_probs, intervention)
        
        print("\n[Scenario 6] Sparse Data (Uniform Prior):")
        print(f"  Baseline: {result['baseline_risk']:.4f}")
        print(f"  New:      {result['new_risk']:.4f}")
        
        self.assertEqual(result['validity'], 'VALID') # Engine itself returns valid math
        # We verify it doesn't crash or return NaN

if __name__ == '__main__':
    unittest.main()
