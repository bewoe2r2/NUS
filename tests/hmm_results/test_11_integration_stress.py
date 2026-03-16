"""
TEST SUITE 11: Integration & Stress Tests
~300 tests: end-to-end flows, stress tests, randomized inputs, property-based
"""
import math
import pytest
import random
import numpy as np
from conftest import HMMEngine, SafetyMonitor, STATES, FEATURES, WEIGHTS, EMISSION_PARAMS


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
# End-to-End Pipeline Tests
# =============================================================================
class TestEndToEnd:
    @pytest.mark.parametrize("scenario", [
        "stable_perfect", "stable_realistic", "gradual_decline",
        "warning_to_crisis", "recovery", "missing_data"
    ])
    def test_full_pipeline(self, engine, scenario):
        """Generate -> Infer -> Predict -> Verify."""
        obs = engine.generate_demo_scenario(scenario, days=7)
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES
        assert 0 <= result['confidence'] <= 1.0
        assert 0 <= result['predictions']['risk_48h'] <= 1.0

    @pytest.mark.parametrize("scenario", [
        "stable_perfect", "stable_realistic", "gradual_decline",
        "warning_to_crisis", "recovery"
    ])
    def test_pipeline_with_monte_carlo(self, engine, scenario):
        obs = engine.generate_demo_scenario(scenario, days=7)
        mc = engine.predict_time_to_crisis(obs[-1], num_simulations=100)
        assert 0 <= mc['prob_crisis_percent'] <= 100

    @pytest.mark.parametrize("scenario", ["stable_perfect", "gradual_decline"])
    def test_pipeline_with_intervention(self, engine, scenario):
        obs = engine.generate_demo_scenario(scenario, days=7)
        result = engine.run_inference(obs)
        probs = [result['state_probabilities'][s] for s in STATES]
        intervention = engine.simulate_intervention(probs, {'meds_adherence': 1.0})
        assert intervention['validity'] == 'VALID'


# =============================================================================
# Calibration -> Inference Pipeline
# =============================================================================
class TestCalibrationPipeline:
    def test_calibrate_then_infer(self, engine):
        train_obs = []
        rng = np.random.RandomState(42)
        for _ in range(60):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][0]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][0])
                o[feat] = float(np.clip(mean + rng.normal(0, std * 0.2),
                                        EMISSION_PARAMS[feat]['bounds'][0],
                                        EMISSION_PARAMS[feat]['bounds'][1]))
            train_obs.append(o)

        engine.calibrate_baseline(train_obs, patient_id='p1')
        test_obs = train_obs[:6]
        result = engine.run_inference(test_obs, patient_id='p1')
        assert result['current_state'] in STATES

    def test_baum_welch_then_infer(self, engine):
        rng = np.random.RandomState(42)
        seq = []
        for _ in range(20):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][0]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][0])
                o[feat] = float(np.clip(mean + rng.normal(0, std * 0.3),
                                        EMISSION_PARAMS[feat]['bounds'][0],
                                        EMISSION_PARAMS[feat]['bounds'][1]))
            seq.append(o)

        engine.train_patient_baum_welch('p2', [seq], max_iter=3)
        result = engine.run_inference(seq[:6], patient_id='p2')
        assert result['current_state'] in STATES


# =============================================================================
# Randomized / Fuzz Tests
# =============================================================================
class TestRandomized:
    @pytest.mark.parametrize("seed", range(50))
    def test_random_obs_no_crash(self, engine, seed):
        """Random observation values should never crash the engine."""
        rng = random.Random(seed)
        obs = {}
        for feat in FEATURES:
            lo, hi = EMISSION_PARAMS[feat]['bounds']
            obs[feat] = rng.uniform(lo, hi)
        result = engine.run_inference([obs])
        assert result['current_state'] in STATES

    @pytest.mark.parametrize("seed", range(50))
    def test_random_sequence_no_crash(self, engine, seed):
        """Random sequence of observations should never crash."""
        rng = random.Random(seed)
        n = rng.randint(1, 30)
        obs_list = []
        for _ in range(n):
            obs = {}
            for feat in FEATURES:
                if rng.random() < 0.15:  # 15% missing
                    obs[feat] = None
                else:
                    lo, hi = EMISSION_PARAMS[feat]['bounds']
                    obs[feat] = rng.uniform(lo, hi)
            obs_list.append(obs)
        result = engine.run_inference(obs_list)
        assert result['current_state'] in STATES

    @pytest.mark.parametrize("seed", range(30))
    def test_random_intervention_no_crash(self, engine, seed):
        rng = random.Random(seed)
        probs = [rng.random() for _ in range(3)]
        total = sum(probs)
        probs = [p / total for p in probs]
        intervention = {}
        feat = list(FEATURES.keys())[rng.randint(0, 8)]
        lo, hi = EMISSION_PARAMS[feat]['bounds']
        intervention[feat] = rng.uniform(lo, hi)
        result = engine.simulate_intervention(probs, intervention)
        assert result['validity'] == 'VALID'

    @pytest.mark.parametrize("seed", range(20))
    def test_random_monte_carlo_no_crash(self, engine, seed):
        rng = random.Random(seed)
        obs = {}
        for feat in FEATURES:
            lo, hi = EMISSION_PARAMS[feat]['bounds']
            obs[feat] = rng.uniform(lo, hi)
        result = engine.predict_time_to_crisis(obs, horizon_hours=24, num_simulations=50)
        assert 0 <= result['prob_crisis_percent'] <= 100


# =============================================================================
# Stress Tests: Large inputs
# =============================================================================
class TestStress:
    def test_100_observations(self, engine):
        obs = engine.generate_demo_scenario("stable_realistic", days=17)[:100]
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES

    def test_500_observations(self, engine):
        obs = engine.generate_demo_scenario("stable_realistic", days=84)[:500]
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES

    def test_many_monte_carlo_sims(self, engine):
        obs = {f: EMISSION_PARAMS[f]['means'][0] for f in FEATURES}
        result = engine.predict_time_to_crisis(obs, num_simulations=5000)
        assert 0 <= result['prob_crisis_percent'] <= 100

    def test_baum_welch_many_sequences(self, engine):
        rng = np.random.RandomState(42)
        seqs = []
        for s in range(5):
            seq = []
            for _ in range(10):
                o = {}
                for feat in FEATURES:
                    mean = EMISSION_PARAMS[feat]['means'][0]
                    std = math.sqrt(EMISSION_PARAMS[feat]['vars'][0])
                    o[feat] = float(np.clip(mean + rng.normal(0, std * 0.3),
                                            EMISSION_PARAMS[feat]['bounds'][0],
                                            EMISSION_PARAMS[feat]['bounds'][1]))
                seq.append(o)
            seqs.append(seq)
        result = engine.baum_welch(seqs, max_iter=3)
        assert len(result['log_likelihood_history']) > 0


# =============================================================================
# Property-Based Tests
# =============================================================================
class TestProperties:
    def test_stable_obs_never_crisis(self, engine):
        """Perfect stable obs should never produce CRISIS."""
        for seed in range(30):
            obs = engine.generate_demo_scenario("stable_perfect", days=7, seed=seed)
            result = engine.run_inference(obs)
            assert result['current_state'] != 'CRISIS', f"False CRISIS with seed {seed}"

    @pytest.mark.parametrize("seed", range(20))
    def test_crisis_obs_always_crisis(self, engine, seed):
        """Extreme crisis obs should always detect CRISIS."""
        obs = [{
            'glucose_avg': 22.0, 'glucose_variability': 60.0,
            'meds_adherence': 0.10, 'carbs_intake': 380.0,
            'steps_daily': 200.0, 'resting_hr': 105.0,
            'hrv_rmssd': 5.0, 'sleep_quality': 1.5,
            'social_engagement': 0.5
        }] * 6
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'

    def test_more_data_never_decreases_certainty(self, engine):
        """Adding more complete data should not decrease certainty index."""
        obs1 = [{'glucose_avg': 6.0}]
        obs2 = [{'glucose_avg': 6.0, 'meds_adherence': 0.9, 'steps_daily': 5000}]
        r1 = engine.run_inference(obs1)
        r2 = engine.run_inference(obs2)
        assert r2['certainty_index'] >= r1['certainty_index']

    def test_intervention_risk_bounded(self, engine):
        """Post-intervention risk should always be in [0, 1]."""
        for seed in range(30):
            rng = random.Random(seed)
            probs = [rng.random() for _ in range(3)]
            total = sum(probs)
            probs = [p / total for p in probs]
            result = engine.simulate_intervention(probs, {'meds_adherence': 1.0})
            assert 0 <= result['new_risk'] <= 1.0

    def test_future_risk_monotonic_in_horizon(self, engine):
        probs = [0.7, 0.2, 0.1]
        prev = 0
        for h in range(0, 30):
            risk = engine.calculate_future_risk(probs, horizon=h)
            assert risk >= prev - 1e-10
            prev = risk


# =============================================================================
# Feature metadata
# =============================================================================
class TestFeatureMetadata:
    def test_returns_features(self, engine):
        meta = engine.get_feature_metadata()
        assert meta == FEATURES
        assert len(meta) == 9

    def test_each_feature_complete(self, engine):
        meta = engine.get_feature_metadata()
        for feat, info in meta.items():
            assert 'weight' in info
            assert 'dimension' in info
            assert 'unit' in info
            assert 'description' in info
            assert 'clinical_ref' in info
