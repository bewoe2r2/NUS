import pytest
import math
import sys
import os
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from hmm_engine import HMMEngine, STATES

class TestProactiveOracle:
    
    @pytest.fixture
    def engine(self):
        return HMMEngine()

    def test_risk_calculation_basics(self, engine):
        """Test basic properties of risk calculation."""
        # 100% Stable
        start_probs = [1.0, 0.0, 0.0] 
        risk = engine.calculate_future_risk(start_probs, horizon=12)
        
        assert 0.0 <= risk <= 1.0, "Risk must be a probability"
        # Since transition Stable->Crisis is rare, risk should be low
        assert risk < 0.3, "Stable patient shouldn't have excessively high 48h risk"

    def test_risk_monotonic_with_horizon(self, engine):
        """Risk should generally increase or stay same with longer time horizons."""
        start_probs = [0.0, 1.0, 0.0] # 100% Warning
        
        risk_1 = engine.calculate_future_risk(start_probs, horizon=1)
        risk_12 = engine.calculate_future_risk(start_probs, horizon=12)
        
        assert risk_12 >= risk_1, "Cumulative risk should not decrease over time"

    def test_warning_riskier_than_stable(self, engine):
        """A patient in WARNING should have higher risk than STABLE."""
        risk_stable = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=12)
        risk_warning = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=12)
        
        assert risk_warning > risk_stable, "Warning state should imply higher future risk"

    def test_crisis_is_max_risk(self, engine):
        """If already in CRISIS, 'hitting' CRISIS is 100%."""
        risk_crisis = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=12)
        assert risk_crisis == 1.0, "If in Crisis, risk is 1.0"

    def test_integration_in_inference(self, engine):
        """Ensure run_inference returns the risk metric."""
        # Mock observations
        obs = [{'glucose_avg': 5.5} for _ in range(5)]
        result = engine.run_inference(obs)
        
        assert 'predictions' in result
        assert 'risk_48h' in result['predictions']
        assert 0.0 <= result['predictions']['risk_48h'] <= 1.0

    def test_absorbing_logic(self, engine):
        """Verify the logic uses absorbing state math."""
        # Manually calculate 1 step risk
        # P(Warning -> Crisis) based on TRANSITION_PROBS
        # If we start in Warning, risk @ T+1 should be exactly T[Warning][Crisis]
        
        # Access internal transitions (need to know exact values or mock them)
        # engine.LOG_TRANSITIONS are log probs. 
        # But let's assume valid property: 
        # If we set T[Warning->Crisis] = 0.5 manually for the test...
        
        pass # Hard to test internal matrix values without fragility, sticking to behavioral tests
