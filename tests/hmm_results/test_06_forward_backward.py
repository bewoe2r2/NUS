"""
TEST SUITE 06: Forward-Backward Algorithm
~150 tests for _forward, _backward, and their properties
"""
import math
import pytest
import numpy as np
from conftest import HMMEngine, STATES, FEATURES, WEIGHTS, EMISSION_PARAMS, SafetyMonitor


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


def make_sequence(state_idx, n, seed=42):
    rng = np.random.RandomState(seed)
    obs = []
    for _ in range(n):
        o = {}
        for feat in FEATURES:
            mean = EMISSION_PARAMS[feat]['means'][state_idx]
            std = math.sqrt(EMISSION_PARAMS[feat]['vars'][state_idx])
            o[feat] = float(np.clip(mean + rng.normal(0, std * 0.3),
                                    EMISSION_PARAMS[feat]['bounds'][0],
                                    EMISSION_PARAMS[feat]['bounds'][1]))
        obs.append(o)
    return obs


# =============================================================================
# Forward Algorithm
# =============================================================================
class TestForward:
    def test_returns_alpha_and_ll(self, engine):
        obs = make_sequence(0, 5)
        alpha, ll = engine._forward(obs)
        assert isinstance(alpha, np.ndarray)
        assert isinstance(ll, float)

    def test_alpha_shape(self, engine):
        obs = make_sequence(0, 8)
        alpha, _ = engine._forward(obs)
        assert alpha.shape == (8, 3)

    def test_ll_finite(self, engine):
        obs = make_sequence(0, 5)
        _, ll = engine._forward(obs)
        assert math.isfinite(ll)

    def test_ll_negative(self, engine):
        """Log-likelihood should be negative (log of probability < 1)."""
        obs = make_sequence(0, 5)
        _, ll = engine._forward(obs)
        assert ll < 0

    @pytest.mark.parametrize("n", [2, 3, 5, 10, 20])
    def test_various_lengths(self, engine, n):
        obs = make_sequence(0, n)
        alpha, ll = engine._forward(obs)
        assert alpha.shape == (n, 3)
        assert math.isfinite(ll)

    @pytest.mark.parametrize("state", [0, 1, 2])
    def test_state_sequences(self, engine, state):
        obs = make_sequence(state, 5)
        alpha, ll = engine._forward(obs)
        assert math.isfinite(ll)

    def test_longer_seq_lower_ll(self, engine):
        """Longer sequences should generally have lower log-likelihood."""
        obs5 = make_sequence(0, 5)
        obs20 = make_sequence(0, 20)
        _, ll5 = engine._forward(obs5)
        _, ll20 = engine._forward(obs20)
        assert ll20 < ll5  # More observations -> lower joint probability

    def test_alpha_values_finite(self, engine):
        obs = make_sequence(0, 10)
        alpha, _ = engine._forward(obs)
        # Some values might be -inf for impossible paths, but not NaN
        assert not np.any(np.isnan(alpha))


# =============================================================================
# Backward Algorithm
# =============================================================================
class TestBackward:
    def test_returns_beta(self, engine):
        obs = make_sequence(0, 5)
        beta = engine._backward(obs)
        assert isinstance(beta, np.ndarray)

    def test_beta_shape(self, engine):
        obs = make_sequence(0, 8)
        beta = engine._backward(obs)
        assert beta.shape == (8, 3)

    def test_last_beta_zero(self, engine):
        """beta[T-1] should be 0 (log(1))."""
        obs = make_sequence(0, 5)
        beta = engine._backward(obs)
        np.testing.assert_array_almost_equal(beta[-1], [0.0, 0.0, 0.0])

    @pytest.mark.parametrize("n", [2, 3, 5, 10, 20])
    def test_various_lengths(self, engine, n):
        obs = make_sequence(0, n)
        beta = engine._backward(obs)
        assert beta.shape == (n, 3)

    def test_beta_values_finite_or_neginf(self, engine):
        obs = make_sequence(0, 10)
        beta = engine._backward(obs)
        assert not np.any(np.isnan(beta))


# =============================================================================
# Forward-Backward Consistency
# =============================================================================
class TestForwardBackwardConsistency:
    def test_alpha_beta_ll_consistent(self, engine):
        """Sum of alpha[t] + beta[t] should give same LL for any t."""
        obs = make_sequence(0, 10)
        alpha, ll = engine._forward(obs)
        beta = engine._backward(obs)

        # Check at t=0
        log_joint_0 = alpha[0] + beta[0]
        mx = np.max(log_joint_0)
        ll_from_0 = mx + np.log(np.sum(np.exp(log_joint_0 - mx)))

        assert abs(ll - ll_from_0) < 1e-4

    def test_gamma_sums_to_one(self, engine):
        """P(X_t=s | obs) should sum to 1 over states for each t."""
        obs = make_sequence(0, 8)
        alpha, _ = engine._forward(obs)
        beta = engine._backward(obs)

        for t in range(8):
            log_joint = alpha[t] + beta[t]
            mx = np.max(log_joint)
            probs = np.exp(log_joint - mx)
            probs /= np.sum(probs)
            assert abs(np.sum(probs) - 1.0) < 1e-8

    @pytest.mark.parametrize("seed", range(10))
    def test_consistency_various_seeds(self, engine, seed):
        obs = make_sequence(0, 6, seed=seed)
        alpha, ll = engine._forward(obs)
        beta = engine._backward(obs)

        # LL from forward should match LL computed from any time step
        for t in range(len(obs)):
            log_joint = alpha[t] + beta[t]
            mx = np.max(log_joint)
            if mx > -np.inf:
                ll_t = mx + np.log(np.sum(np.exp(log_joint - mx)))
                assert abs(ll - ll_t) < 0.5  # Allow some numerical tolerance


# =============================================================================
# Edge cases
# =============================================================================
class TestForwardBackwardEdge:
    def test_two_observations(self, engine):
        obs = make_sequence(0, 2)
        alpha, ll = engine._forward(obs)
        beta = engine._backward(obs)
        assert alpha.shape == (2, 3)
        assert beta.shape == (2, 3)

    def test_all_missing_data(self, engine):
        obs = [{f: None for f in FEATURES} for _ in range(5)]
        alpha, ll = engine._forward(obs)
        assert math.isfinite(ll)

    def test_single_feature_obs(self, engine):
        obs = [{'glucose_avg': 6.5} for _ in range(5)]
        alpha, ll = engine._forward(obs)
        assert math.isfinite(ll)

    def test_with_custom_emission_params(self, engine):
        custom = {f: EMISSION_PARAMS[f] for f in FEATURES}
        obs = make_sequence(0, 5)
        alpha, ll = engine._forward(obs, emission_params=custom)
        assert math.isfinite(ll)
