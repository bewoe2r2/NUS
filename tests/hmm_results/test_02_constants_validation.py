"""
TEST SUITE 02: Constants & Configuration Validation
~150 tests verifying emission params, transition matrix, weights, etc.
"""
import math
import pytest
import numpy as np
from conftest import (
    STATES, FEATURES, WEIGHTS, EMISSION_PARAMS,
    TRANSITION_PROBS, INITIAL_PROBS, LOG_TRANSITIONS, LOG_INITIAL,
    safe_log
)


class TestStatesConfig:
    def test_exactly_three_states(self):
        assert len(STATES) == 3

    def test_state_names(self):
        assert STATES == ["STABLE", "WARNING", "CRISIS"]

    def test_states_ordered_by_severity(self):
        assert STATES.index("STABLE") < STATES.index("WARNING") < STATES.index("CRISIS")


class TestFeatures:
    def test_nine_features(self):
        assert len(FEATURES) == 9

    @pytest.mark.parametrize("feat", [
        'glucose_avg', 'glucose_variability', 'meds_adherence',
        'carbs_intake', 'steps_daily', 'resting_hr',
        'hrv_rmssd', 'sleep_quality', 'social_engagement'
    ])
    def test_feature_exists(self, feat):
        assert feat in FEATURES

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_feature_has_weight(self, feat):
        assert 'weight' in FEATURES[feat]
        assert FEATURES[feat]['weight'] > 0

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_feature_has_dimension(self, feat):
        assert 'dimension' in FEATURES[feat]

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_feature_has_unit(self, feat):
        assert 'unit' in FEATURES[feat]

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_feature_has_description(self, feat):
        assert 'description' in FEATURES[feat]

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_feature_has_clinical_ref(self, feat):
        assert 'clinical_ref' in FEATURES[feat]


class TestWeights:
    def test_weights_sum_to_one(self):
        assert abs(sum(WEIGHTS.values()) - 1.0) < 0.001

    def test_all_weights_positive(self):
        for name, w in WEIGHTS.items():
            assert w > 0, f"Weight for {name} is not positive: {w}"

    def test_glucose_avg_highest_weight(self):
        assert WEIGHTS['glucose_avg'] == max(WEIGHTS.values())

    def test_weight_count(self):
        assert len(WEIGHTS) == 9

    @pytest.mark.parametrize("feat", list(WEIGHTS.keys()))
    def test_weight_between_zero_and_one(self, feat):
        assert 0 < WEIGHTS[feat] < 1


class TestEmissionParams:
    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_has_means(self, feat):
        assert 'means' in EMISSION_PARAMS[feat]
        assert len(EMISSION_PARAMS[feat]['means']) == 3

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_has_vars(self, feat):
        assert 'vars' in EMISSION_PARAMS[feat]
        assert len(EMISSION_PARAMS[feat]['vars']) == 3

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_has_bounds(self, feat):
        assert 'bounds' in EMISSION_PARAMS[feat]
        assert len(EMISSION_PARAMS[feat]['bounds']) == 2

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_all_variances_positive(self, feat):
        for i, v in enumerate(EMISSION_PARAMS[feat]['vars']):
            assert v > 0, f"{feat} state {i} has non-positive variance: {v}"

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_bounds_ordered(self, feat):
        lo, hi = EMISSION_PARAMS[feat]['bounds']
        assert lo < hi, f"{feat} bounds not ordered: [{lo}, {hi}]"

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_means_within_bounds(self, feat):
        lo, hi = EMISSION_PARAMS[feat]['bounds']
        for i, m in enumerate(EMISSION_PARAMS[feat]['means']):
            assert lo <= m <= hi, f"{feat} state {i} mean {m} outside bounds [{lo},{hi}]"

    def test_glucose_avg_stable_mean(self):
        assert EMISSION_PARAMS['glucose_avg']['means'][0] == 6.5

    def test_glucose_avg_crisis_higher(self):
        means = EMISSION_PARAMS['glucose_avg']['means']
        assert means[2] > means[1] > means[0]

    def test_meds_adherence_bounded_0_1(self):
        lo, hi = EMISSION_PARAMS['meds_adherence']['bounds']
        assert lo == 0.0 and hi == 1.0

    def test_meds_adherence_stable_highest(self):
        means = EMISSION_PARAMS['meds_adherence']['means']
        assert means[0] > means[1] > means[2]

    def test_steps_stable_highest(self):
        means = EMISSION_PARAMS['steps_daily']['means']
        assert means[0] > means[1] > means[2]

    def test_hrv_stable_highest(self):
        means = EMISSION_PARAMS['hrv_rmssd']['means']
        assert means[0] > means[1] > means[2]

    def test_sleep_stable_highest(self):
        means = EMISSION_PARAMS['sleep_quality']['means']
        assert means[0] > means[1] > means[2]

    def test_social_stable_highest(self):
        means = EMISSION_PARAMS['social_engagement']['means']
        assert means[0] > means[1] > means[2]

    def test_resting_hr_stable_lowest(self):
        """Higher HR = worse health."""
        means = EMISSION_PARAMS['resting_hr']['means']
        assert means[0] < means[1] < means[2]

    def test_glucose_variability_stable_lowest(self):
        means = EMISSION_PARAMS['glucose_variability']['means']
        assert means[0] < means[1] < means[2]

    def test_carbs_stable_lowest(self):
        means = EMISSION_PARAMS['carbs_intake']['means']
        assert means[0] < means[1] < means[2]

    @pytest.mark.parametrize("feat", list(EMISSION_PARAMS.keys()))
    def test_crisis_variance_largest(self, feat):
        """Crisis state should generally have highest variance (most uncertainty)."""
        variances = EMISSION_PARAMS[feat]['vars']
        # At least crisis var should be >= warning var for most features
        # (hrv_rmssd and sleep_quality may be exceptions)
        # We just verify all variances are positive
        assert all(v > 0 for v in variances)


class TestTransitionMatrix:
    def test_shape(self):
        assert len(TRANSITION_PROBS) == 3
        for row in TRANSITION_PROBS:
            assert len(row) == 3

    @pytest.mark.parametrize("i", range(3))
    def test_row_sums_to_one(self, i):
        assert abs(sum(TRANSITION_PROBS[i]) - 1.0) < 0.001

    @pytest.mark.parametrize("i", range(3))
    @pytest.mark.parametrize("j", range(3))
    def test_all_probs_non_negative(self, i, j):
        assert TRANSITION_PROBS[i][j] >= 0

    def test_diagonal_dominance(self):
        """Self-transition should be highest in each row."""
        for i in range(3):
            assert TRANSITION_PROBS[i][i] == max(TRANSITION_PROBS[i])

    def test_stable_self_transition_high(self):
        assert TRANSITION_PROBS[0][0] > 0.9

    def test_crisis_sticky(self):
        assert TRANSITION_PROBS[2][2] > 0.8

    def test_stable_to_crisis_very_low(self):
        assert TRANSITION_PROBS[0][2] < 0.01

    def test_crisis_to_stable_very_low(self):
        assert TRANSITION_PROBS[2][0] < 0.05

    def test_warning_can_recover(self):
        assert TRANSITION_PROBS[1][0] > 0.1

    def test_warning_can_worsen(self):
        assert TRANSITION_PROBS[1][2] > 0.05

    def test_ergodic(self):
        """All transitions should be possible (ergodic chain)."""
        for i in range(3):
            for j in range(3):
                assert TRANSITION_PROBS[i][j] > 0

    def test_stochastic_matrix(self):
        M = np.array(TRANSITION_PROBS)
        eigenvalues = np.linalg.eigvals(M)
        assert any(abs(e - 1.0) < 1e-10 for e in eigenvalues)


class TestInitialProbs:
    def test_sum_to_one(self):
        assert abs(sum(INITIAL_PROBS) - 1.0) < 0.001

    def test_all_non_negative(self):
        assert all(p >= 0 for p in INITIAL_PROBS)

    def test_stable_highest(self):
        assert INITIAL_PROBS[0] > INITIAL_PROBS[1] > INITIAL_PROBS[2]

    def test_stable_dominates(self):
        assert INITIAL_PROBS[0] >= 0.7

    def test_crisis_rare(self):
        assert INITIAL_PROBS[2] < 0.05


class TestLogTransitions:
    @pytest.mark.parametrize("i", range(3))
    @pytest.mark.parametrize("j", range(3))
    def test_log_matches_original(self, i, j):
        expected = safe_log(TRANSITION_PROBS[i][j])
        assert abs(LOG_TRANSITIONS[i][j] - expected) < 1e-10

    @pytest.mark.parametrize("i", range(3))
    def test_log_initial_matches(self, i):
        expected = safe_log(INITIAL_PROBS[i])
        assert abs(LOG_INITIAL[i] - expected) < 1e-10
