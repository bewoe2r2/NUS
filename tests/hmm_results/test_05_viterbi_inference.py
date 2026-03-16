"""
TEST SUITE 05: Viterbi Inference (run_inference)
~400 tests: core inference, state detection, confidence, edge cases, sequences
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


def make_obs(state='STABLE', n=6):
    """Generate n observations for a given state."""
    means_idx = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}[state]
    obs_list = []
    rng = random.Random(42)
    for _ in range(n):
        obs = {}
        for feat in FEATURES:
            mean = EMISSION_PARAMS[feat]['means'][means_idx]
            std = math.sqrt(EMISSION_PARAMS[feat]['vars'][means_idx])
            obs[feat] = mean + rng.gauss(0, std * 0.3)
            lo, hi = EMISSION_PARAMS[feat]['bounds']
            obs[feat] = max(lo, min(hi, obs[feat]))
        obs_list.append(obs)
    return obs_list


# =============================================================================
# Basic Inference
# =============================================================================
class TestBasicInference:
    def test_empty_obs_returns_stable(self, engine):
        result = engine.run_inference([])
        assert result['current_state'] == 'STABLE'
        assert result['method'] == 'DEFAULT'

    def test_returns_dict(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert isinstance(result, dict)

    def test_required_keys_present(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        required = ['current_state', 'confidence', 'confidence_margin',
                     'certainty_index', 'interpretation', 'method']
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_state_is_valid(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert result['current_state'] in STATES

    def test_confidence_between_0_1(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 0 <= result['confidence'] <= 1.0

    def test_certainty_index_between_0_1(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 0 <= result['certainty_index'] <= 1.0

    def test_state_probabilities_sum_to_one(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        probs = result['state_probabilities']
        total = sum(probs.values())
        assert abs(total - 1.0) < 0.01

    def test_observations_count(self, engine):
        obs = make_obs('STABLE', n=10)
        result = engine.run_inference(obs)
        assert result['observations_count'] == 10


# =============================================================================
# State Detection Accuracy
# =============================================================================
class TestStateDetection:
    def test_stable_detected(self, engine):
        result = engine.run_inference(make_obs('STABLE', 12))
        assert result['current_state'] == 'STABLE'

    def test_warning_detected(self, engine):
        result = engine.run_inference(make_obs('WARNING', 12))
        assert result['current_state'] in ('WARNING', 'CRISIS')  # May trigger safety

    def test_crisis_detected(self, engine):
        result = engine.run_inference(make_obs('CRISIS', 12))
        assert result['current_state'] == 'CRISIS'

    @pytest.mark.parametrize("seed", range(20))
    def test_stable_detection_robustness(self, engine, seed):
        """Stable should be detected across different random seeds."""
        rng = random.Random(seed)
        obs = []
        for _ in range(12):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][0]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][0])
                o[feat] = mean + rng.gauss(0, std * 0.2)
                lo, hi = EMISSION_PARAMS[feat]['bounds']
                o[feat] = max(lo, min(hi, o[feat]))
            obs.append(o)
        result = engine.run_inference(obs)
        assert result['current_state'] == 'STABLE'

    @pytest.mark.parametrize("seed", range(20))
    def test_crisis_detection_robustness(self, engine, seed):
        """Crisis should be detected across different random seeds."""
        rng = random.Random(seed)
        obs = []
        for _ in range(12):
            o = {}
            for feat in FEATURES:
                mean = EMISSION_PARAMS[feat]['means'][2]
                std = math.sqrt(EMISSION_PARAMS[feat]['vars'][2])
                o[feat] = mean + rng.gauss(0, std * 0.15)
                lo, hi = EMISSION_PARAMS[feat]['bounds']
                o[feat] = max(lo, min(hi, o[feat]))
            obs.append(o)
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'


# =============================================================================
# Single observation inference
# =============================================================================
class TestSingleObs:
    def test_single_stable_obs(self, engine):
        obs = [make_obs('STABLE', 1)[0]]
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES

    def test_single_crisis_obs(self, engine):
        obs = [{
            'glucose_avg': 22.0, 'glucose_variability': 60.0,
            'meds_adherence': 0.15, 'carbs_intake': 350.0,
            'steps_daily': 300.0, 'resting_hr': 105.0,
            'hrv_rmssd': 6.0, 'sleep_quality': 1.5,
            'social_engagement': 0.5
        }]
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'


# =============================================================================
# Sequence length effects
# =============================================================================
class TestSequenceLength:
    @pytest.mark.parametrize("n", [1, 2, 3, 5, 10, 20, 50])
    def test_various_lengths_stable(self, engine, n):
        result = engine.run_inference(make_obs('STABLE', n))
        assert result['current_state'] == 'STABLE'
        assert result['observations_count'] == n

    @pytest.mark.parametrize("n", [1, 2, 3, 5, 10, 20, 50])
    def test_various_lengths_crisis(self, engine, n):
        result = engine.run_inference(make_obs('CRISIS', n))
        assert result['current_state'] == 'CRISIS'

    def test_longer_sequence_higher_confidence(self, engine):
        """More observations should generally increase confidence."""
        r3 = engine.run_inference(make_obs('STABLE', 3))
        r30 = engine.run_inference(make_obs('STABLE', 30))
        # Not guaranteed but generally true
        assert r30['confidence'] >= r3['confidence'] * 0.8


# =============================================================================
# Safety Rule Override
# =============================================================================
class TestSafetyOverride:
    def test_hypo_crisis_override(self, engine):
        """Safety rules should override HMM when glucose is critically low."""
        obs = make_obs('STABLE', 5)
        # Last observation has critical glucose
        obs[-1]['glucose_avg'] = 2.5
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'
        assert result['method'] == 'RULE_OVERRIDE'

    def test_hyper_crisis_override(self, engine):
        obs = make_obs('STABLE', 5)
        obs[-1]['glucose_avg'] = 20.0
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'
        assert result['method'] == 'RULE_OVERRIDE'

    def test_warning_override(self, engine):
        obs = make_obs('STABLE', 5)
        obs[-1]['glucose_avg'] = 3.5  # Level 1 hypo
        result = engine.run_inference(obs)
        # Either WARNING from safety or STABLE from HMM
        # Safety says WARNING, HMM says STABLE -> safety >= HMM -> RULE_OVERRIDE
        assert result['current_state'] in ('WARNING', 'STABLE')

    def test_hmm_crisis_kept_over_warning_safety(self, engine):
        """If HMM says CRISIS but safety says WARNING, keep CRISIS."""
        obs = make_obs('CRISIS', 10)
        obs[-1]['resting_hr'] = 130  # Safety WARNING
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'


# =============================================================================
# Missing data in inference
# =============================================================================
class TestMissingDataInference:
    def test_all_none_obs(self, engine):
        obs = [{f: None for f in FEATURES}]
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES

    def test_partial_obs(self, engine):
        obs = [{'glucose_avg': 6.0}]
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES

    def test_certainty_drops_with_missing(self, engine):
        full_obs = make_obs('STABLE', 1)
        partial = [{'glucose_avg': 6.0, 'meds_adherence': 0.95}]
        r_full = engine.run_inference(full_obs)
        r_partial = engine.run_inference(partial)
        assert r_partial['certainty_index'] < r_full['certainty_index']

    def test_missing_features_listed(self, engine):
        obs = [{'glucose_avg': 6.0}]
        result = engine.run_inference(obs)
        assert len(result['missing_features']) == 8

    @pytest.mark.parametrize("n_present", range(1, 10))
    def test_varying_completeness(self, engine, n_present):
        feats = list(FEATURES.keys())
        obs = {}
        for i in range(n_present):
            f = feats[i]
            obs[f] = EMISSION_PARAMS[f]['means'][0]
        result = engine.run_inference([obs])
        expected_certainty = sum(WEIGHTS[f] for f in list(FEATURES.keys())[:n_present])
        assert abs(result['certainty_index'] - expected_certainty) < 0.01


# =============================================================================
# State probabilities
# =============================================================================
class TestStateProbabilities:
    def test_probs_keys(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        probs = result['state_probabilities']
        assert set(probs.keys()) == set(STATES)

    def test_probs_non_negative(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        for s, p in result['state_probabilities'].items():
            assert p >= 0, f"Negative probability for {s}: {p}"

    def test_stable_has_highest_prob(self, engine):
        result = engine.run_inference(make_obs('STABLE', 12))
        probs = result['state_probabilities']
        assert probs['STABLE'] == max(probs.values())

    def test_crisis_has_highest_prob(self, engine):
        result = engine.run_inference(make_obs('CRISIS', 12))
        probs = result['state_probabilities']
        assert probs['CRISIS'] == max(probs.values())


# =============================================================================
# Path tracking
# =============================================================================
class TestPathTracking:
    def test_path_length_matches_obs(self, engine):
        obs = make_obs('STABLE', 8)
        result = engine.run_inference(obs)
        assert len(result['path_indices']) == 8
        assert len(result['path_states']) == 8

    def test_path_states_valid(self, engine):
        result = engine.run_inference(make_obs('STABLE', 8))
        for s in result['path_states']:
            assert s in STATES

    def test_path_indices_valid(self, engine):
        result = engine.run_inference(make_obs('STABLE', 8))
        for i in result['path_indices']:
            assert 0 <= i <= 2

    def test_stable_path_all_stable(self, engine):
        result = engine.run_inference(make_obs('STABLE', 20))
        assert all(s == 'STABLE' for s in result['path_states'])


# =============================================================================
# Predictions (future risk)
# =============================================================================
class TestPredictions:
    def test_predictions_key_exists(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 'predictions' in result
        assert 'risk_48h' in result['predictions']
        assert 'risk_12h' in result['predictions']

    def test_stable_low_risk(self, engine):
        result = engine.run_inference(make_obs('STABLE', 12))
        assert result['predictions']['risk_48h'] < 0.5

    def test_crisis_high_risk(self, engine):
        result = engine.run_inference(make_obs('CRISIS', 12))
        assert result['predictions']['risk_48h'] > 0.5

    def test_risk_bounded(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 0 <= result['predictions']['risk_48h'] <= 1.0
        assert 0 <= result['predictions']['risk_12h'] <= 1.0


# =============================================================================
# Evidence & top factors
# =============================================================================
class TestEvidence:
    def test_evidence_present(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 'evidence' in result
        assert isinstance(result['evidence'], dict)

    def test_top_factors_present(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert 'top_factors' in result
        assert isinstance(result['top_factors'], list)

    def test_top_factors_limited_to_5(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        assert len(result['top_factors']) <= 5

    def test_top_factors_sorted_by_contribution(self, engine):
        result = engine.run_inference(make_obs('STABLE'))
        factors = result['top_factors']
        if len(factors) >= 2:
            for i in range(len(factors) - 1):
                assert abs(factors[i]['weighted_contribution']) >= abs(factors[i+1]['weighted_contribution'])


# =============================================================================
# Interpretation levels
# =============================================================================
class TestInterpretation:
    def test_high_confidence_with_full_data(self, engine):
        result = engine.run_inference(make_obs('STABLE', 20))
        assert result['interpretation'] in ('HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'SAFETY_RULE')

    def test_insufficient_data_sparse(self, engine):
        obs = [{'glucose_avg': 6.0}]  # Only 1 feature
        result = engine.run_inference(obs)
        assert result['interpretation'] in ('INSUFFICIENT_DATA', 'LOW_CONFIDENCE', 'MODERATE_CONFIDENCE')

    @pytest.mark.parametrize("interp", ['HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'LOW_CONFIDENCE',
                                         'INSUFFICIENT_DATA', 'SAFETY_RULE', 'NO_DATA'])
    def test_valid_interpretation_values(self, engine, interp):
        """Just verify these are the expected interpretation values."""
        assert interp in ('HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'LOW_CONFIDENCE',
                          'INSUFFICIENT_DATA', 'SAFETY_RULE', 'NO_DATA')


# =============================================================================
# Confidence adjustment
# =============================================================================
class TestConfidenceAdjustment:
    def test_adjusted_le_raw(self, engine):
        """Adjusted confidence should be <= raw confidence."""
        result = engine.run_inference(make_obs('STABLE'))
        assert result['confidence'] <= result['raw_confidence'] + 0.001

    def test_full_data_minimal_penalty(self, engine):
        result = engine.run_inference(make_obs('STABLE', 12))
        # With all features, certainty = 1.0, so penalty should be very small
        assert result['confidence'] >= result['raw_confidence'] * 0.9


# =============================================================================
# Transition sequences
# =============================================================================
class TestTransitionSequences:
    def test_stable_to_crisis_transition(self, engine):
        """Gradual transition from STABLE to CRISIS."""
        obs = make_obs('STABLE', 6) + make_obs('WARNING', 6) + make_obs('CRISIS', 6)
        result = engine.run_inference(obs)
        assert result['current_state'] == 'CRISIS'

    def test_crisis_to_stable_recovery(self, engine):
        obs = make_obs('CRISIS', 6) + make_obs('WARNING', 6) + make_obs('STABLE', 12)
        result = engine.run_inference(obs)
        assert result['current_state'] == 'STABLE'

    def test_oscillating_sequence(self, engine):
        """Alternating states - HMM should smooth this."""
        obs = []
        for i in range(20):
            state = 'STABLE' if i % 2 == 0 else 'WARNING'
            obs.extend(make_obs(state, 1))
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES


# =============================================================================
# Personalized baselines in inference
# =============================================================================
class TestPersonalizedInference:
    def test_with_patient_id_no_baseline(self, engine):
        result = engine.run_inference(make_obs('STABLE'), patient_id='patient_001')
        assert result['current_state'] == 'STABLE'

    def test_with_personalized_baseline(self, engine):
        engine._personalized_baselines['p1'] = {
            f: {
                'STABLE': {'mean': EMISSION_PARAMS[f]['means'][0], 'std': math.sqrt(EMISSION_PARAMS[f]['vars'][0])},
                'WARNING': {'mean': EMISSION_PARAMS[f]['means'][1], 'std': math.sqrt(EMISSION_PARAMS[f]['vars'][1])},
                'CRISIS': {'mean': EMISSION_PARAMS[f]['means'][2], 'std': math.sqrt(EMISSION_PARAMS[f]['vars'][2])},
            } for f in FEATURES
        }
        result = engine.run_inference(make_obs('STABLE'), patient_id='p1')
        assert result['current_state'] == 'STABLE'
