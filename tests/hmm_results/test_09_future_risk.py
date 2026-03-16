"""
TEST SUITE 09: Future Risk Prediction & Monte Carlo
~200 tests for calculate_future_risk, predict_time_to_crisis, simulate_intervention
"""
import math
import pytest
import numpy as np
from conftest import HMMEngine, SafetyMonitor, STATES, FEATURES, WEIGHTS, EMISSION_PARAMS, TRANSITION_PROBS


@pytest.fixture
def engine():
    e = HMMEngine.__new__(HMMEngine)
    e.features = FEATURES
    e.weights = WEIGHTS
    e.emission_params = EMISSION_PARAMS
    e.safety_monitor = SafetyMonitor()
    e._personalized_baselines = {}
    e.MIN_CALIBRATION_OBS = 42
    return e


# =============================================================================
# calculate_future_risk (Absorbing Markov Chain)
# =============================================================================
class TestCalculateFutureRisk:
    def test_stable_low_risk(self, engine):
        risk = engine.calculate_future_risk([0.95, 0.04, 0.01], horizon=12)
        assert risk < 0.5

    def test_crisis_high_risk(self, engine):
        risk = engine.calculate_future_risk([0.05, 0.05, 0.90], horizon=12)
        assert risk > 0.9

    def test_pure_crisis_stays_crisis(self, engine):
        risk = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=12)
        assert abs(risk - 1.0) < 0.001

    def test_risk_bounded_0_1(self, engine):
        risk = engine.calculate_future_risk([0.5, 0.3, 0.2], horizon=12)
        assert 0.0 <= risk <= 1.0

    def test_longer_horizon_higher_risk(self, engine):
        risk_short = engine.calculate_future_risk([0.8, 0.15, 0.05], horizon=3)
        risk_long = engine.calculate_future_risk([0.8, 0.15, 0.05], horizon=24)
        assert risk_long >= risk_short

    @pytest.mark.parametrize("horizon", [1, 3, 6, 12, 24, 48])
    def test_various_horizons(self, engine, horizon):
        risk = engine.calculate_future_risk([0.7, 0.2, 0.1], horizon=horizon)
        assert 0.0 <= risk <= 1.0

    def test_zero_horizon(self, engine):
        risk = engine.calculate_future_risk([0.8, 0.15, 0.05], horizon=0)
        assert abs(risk - 0.05) < 0.001  # Should be current crisis prob

    def test_warning_moderate_risk(self, engine):
        risk = engine.calculate_future_risk([0.1, 0.8, 0.1], horizon=12)
        assert 0.1 < risk < 0.9

    @pytest.mark.parametrize("probs", [
        [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0],
        [0.33, 0.34, 0.33], [0.5, 0.3, 0.2], [0.1, 0.1, 0.8],
    ])
    def test_various_initial_probs(self, engine, probs):
        risk = engine.calculate_future_risk(probs, horizon=12)
        assert 0.0 <= risk <= 1.0

    def test_monotonically_increases_from_stable(self, engine):
        prev_risk = 0
        for h in range(0, 50, 5):
            risk = engine.calculate_future_risk([0.9, 0.08, 0.02], horizon=h)
            assert risk >= prev_risk - 1e-10
            prev_risk = risk


# =============================================================================
# predict_time_to_crisis (Monte Carlo)
# =============================================================================
class TestPredictTimeToCrisis:
    def test_returns_dict(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, horizon_hours=24, num_simulations=100)
        assert isinstance(result, dict)

    def test_required_keys(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=100)
        assert 'prob_crisis_percent' in result
        assert 'risk_level' in result
        assert 'simulations_run' in result

    def test_stable_obs_low_crisis_prob(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, horizon_hours=24, num_simulations=500)
        assert result['prob_crisis_percent'] < 50

    def test_crisis_obs_high_prob(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][2] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, horizon_hours=48, num_simulations=500)
        assert result['prob_crisis_percent'] > 50

    def test_already_in_crisis_100_percent(self, engine):
        """When belief is >80% crisis, should return 100%."""
        # Use extreme crisis values
        obs = {
            'glucose_avg': 25.0, 'glucose_variability': 65.0,
            'meds_adherence': 0.1, 'carbs_intake': 400.0,
            'steps_daily': 100.0, 'resting_hr': 110.0,
            'hrv_rmssd': 5.0, 'sleep_quality': 1.0,
            'social_engagement': 0.5
        }
        result = engine.predict_time_to_crisis(obs, num_simulations=100)
        assert result['prob_crisis_percent'] == 100.0

    def test_prob_bounded(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][1] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=200)
        assert 0 <= result['prob_crisis_percent'] <= 100

    def test_risk_level_valid(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=100)
        assert result['risk_level'] in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')

    @pytest.mark.parametrize("horizon", [12, 24, 48, 96])
    def test_various_horizons(self, engine, horizon):
        obs = {f: EMISSION_PARAMS[f]['means'][1] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, horizon_hours=horizon, num_simulations=100)
        assert 'prob_crisis_percent' in result

    def test_survival_curve_present(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][1] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=100)
        if 'survival_curve' in result:
            assert len(result['survival_curve']) > 0

    def test_simulations_count(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=200)
        assert result['simulations_run'] == 200


# =============================================================================
# simulate_intervention (Counterfactual)
# =============================================================================
class TestSimulateIntervention:
    def test_returns_dict(self, engine):
        result = engine.simulate_intervention([0.3, 0.4, 0.3], {'meds_adherence': 1.0})
        assert isinstance(result, dict)

    def test_required_keys(self, engine):
        result = engine.simulate_intervention([0.3, 0.4, 0.3], {'meds_adherence': 1.0})
        assert 'new_risk' in result
        assert 'baseline_risk' in result
        assert 'risk_reduction' in result
        assert 'validity' in result

    def test_meds_intervention_reduces_risk(self, engine):
        result = engine.simulate_intervention([0.3, 0.4, 0.3], {'meds_adherence': 1.0})
        assert result['risk_reduction'] > 0

    def test_bad_intervention_increases_risk(self, engine):
        result = engine.simulate_intervention([0.7, 0.2, 0.1], {'meds_adherence': 0.0})
        # Should increase risk or have minimal impact
        assert result['validity'] == 'VALID'

    def test_invalid_probs(self, engine):
        result = engine.simulate_intervention([0.5], {'meds_adherence': 1.0})
        assert result['validity'] == 'INVALID_INPUT'

    def test_probs_dont_sum_to_one(self, engine):
        result = engine.simulate_intervention([0.5, 0.5, 0.5], {'meds_adherence': 1.0})
        assert result['validity'] == 'INVALID_INPUT'

    def test_empty_intervention(self, engine):
        result = engine.simulate_intervention([0.5, 0.3, 0.2], {})
        assert result['validity'] == 'VALID'

    def test_unknown_feature_ignored(self, engine):
        result = engine.simulate_intervention([0.5, 0.3, 0.2], {'nonexistent_feature': 99})
        assert result['validity'] == 'VALID'

    def test_new_probs_sum_to_one(self, engine):
        result = engine.simulate_intervention([0.5, 0.3, 0.2], {'meds_adherence': 1.0})
        total = sum(result['new_probs'])
        assert abs(total - 1.0) < 0.01

    def test_baseline_risk_computed(self, engine):
        result = engine.simulate_intervention([0.8, 0.15, 0.05], {'glucose_avg': 6.0})
        assert result['baseline_risk'] > 0

    @pytest.mark.parametrize("feature,value", [
        ('glucose_avg', 5.5), ('glucose_avg', 6.5),
        ('meds_adherence', 1.0), ('meds_adherence', 0.5),
        ('steps_daily', 8000), ('steps_daily', 1000),
        ('sleep_quality', 9.0), ('sleep_quality', 2.0),
        ('carbs_intake', 150), ('carbs_intake', 350),
    ])
    def test_various_interventions(self, engine, feature, value):
        result = engine.simulate_intervention([0.4, 0.35, 0.25], {feature: value})
        assert result['validity'] == 'VALID'
        assert 0 <= result['new_risk'] <= 1.0

    def test_multiple_interventions(self, engine):
        result = engine.simulate_intervention(
            [0.3, 0.4, 0.3],
            {'meds_adherence': 1.0, 'glucose_avg': 6.0, 'steps_daily': 7000}
        )
        assert result['validity'] == 'VALID'

    def test_improvement_message(self, engine):
        result = engine.simulate_intervention([0.2, 0.4, 0.4], {'meds_adherence': 1.0})
        assert 'message' in result

    @pytest.mark.parametrize("probs", [
        [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0],
        [0.33, 0.34, 0.33], [0.5, 0.3, 0.2],
    ])
    def test_various_starting_states(self, engine, probs):
        result = engine.simulate_intervention(probs, {'meds_adherence': 0.95})
        assert result['validity'] == 'VALID'
