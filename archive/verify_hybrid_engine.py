import sys
import os
import unittest
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from hmm_engine import HMMEngine

class TestHybridEngine(unittest.TestCase):
    def setUp(self):
        self.engine = HMMEngine()
        
    def test_hypoglycemia_crisis(self):
        """Test that glucose < 3.5 triggers CRISIS immediately."""
        print("\nTesting Hypoglycemia (Glucose < 3.5)...")
        
        # Observation with critical glucose but otherwise stable stats
        obs = [{
            'glucose_avg': 3.0, # CRITICAL
            'glucose_variability': 20.0,
            'meds_adherence': 1.0, # Perfect meds
            'steps_daily': 5000,
            'sleep_quality': 8.0
        }]
        
        result = self.engine.run_inference(obs)
        
        print(f"Result State: {result['current_state']}")
        print(f"Reason: {result['reason']}")
        print(f"Method: {result.get('method', 'UNKNOWN')}")
        
        self.assertEqual(result['current_state'], 'CRISIS')
        self.assertIn("Hypoglycemia", result['reason'])
        self.assertEqual(result['method'], 'RULE')

    def test_hyperglycemia_severe(self):
        """Test that glucose > 20 triggers CRISIS immediately."""
        print("\nTesting Severe Hyperglycemia (Glucose > 20)...")
        
        obs = [{
            'glucose_avg': 22.0, # CRITICAL
            'glucose_variability': 30.0,
            'meds_adherence': 0.5,
        }]
        
        result = self.engine.run_inference(obs)
        
        print(f"Result State: {result['current_state']}")
        print(f"Reason: {result['reason']}")
        
        self.assertEqual(result['current_state'], 'CRISIS')
        self.assertIn("Hyperglycemia", result['reason'])
        self.assertEqual(result['method'], 'RULE')

    def test_meds_adherence_warning(self):
        """Test that low meds adherence triggers WARNING."""
        print("\nTesting Low Meds Adherence (< 20%)...")
        
        obs = [{
            'glucose_avg': 6.0, # Good glucose
            'meds_adherence': 0.1, # CRITICAL MISS
            'steps_daily': 5000
        }]
        
        result = self.engine.run_inference(obs)
        
        print(f"Result State: {result['current_state']}")
        print(f"Reason: {result['reason']}")
        
        self.assertEqual(result['current_state'], 'WARNING')
        self.assertIn("medication", result['reason'])
        self.assertEqual(result['method'], 'RULE')

    def test_normal_hmm_fallthrough(self):
        """Test that if no rules break, HMM runs normally."""
        print("\nTesting Normal HMM Operation...")
        
        # 3 days of stable data
        obs = []
        for _ in range(18):
            obs.append({
                'glucose_avg': 5.5,
                'glucose_variability': 20.0,
                'meds_adherence': 1.0,
                'steps_daily': 8000,
                'sleep_quality': 9.0
            })
            
        result = self.engine.run_inference(obs)
        
        print(f"Result State: {result['current_state']}")
        print(f"Method: {result.get('method', 'UNKNOWN')}")
        
        self.assertEqual(result['current_state'], 'STABLE')
        self.assertEqual(result['method'], 'HMM')

if __name__ == '__main__':
    unittest.main()
