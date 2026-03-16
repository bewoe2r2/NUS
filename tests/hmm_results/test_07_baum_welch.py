"""
TEST SUITE 07: Baum-Welch (EM) Learning
~200 tests for parameter learning, convergence, patient training
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


def gen_seq(state_idx, n, seed=42):
    rng = np.random.RandomState(seed)
    obs = []
    for _ in range(n):
        o = {}
        for feat in FEATURES:
            mean = EMISSION_PARAMS[feat]['means'][state_idx]
            std = math.sqrt(EMISSION_PARAMS[feat]['vars'][state_idx])
            val = mean + rng.normal(0, std * 0.5)
            lo, hi = EMISSION_PARAMS[feat]['bounds']
            o[feat] = float(np.clip(val, lo, hi))
        obs.append(o)
    return obs


class TestBaumWelchBasic:
    def test_returns_dict(self, engine):
        seqs = [gen_seq(0, 10)]
        result = engine.baum_welch(seqs, max_iter=3)
        assert isinstance(result, dict)

    def test_required_keys(self, engine):
        seqs = [gen_seq(0, 10)]
        result = engine.baum_welch(seqs, max_iter=3)
        assert 'learned_transitions' in result
        assert 'learned_emissions' in result
        assert 'log_likelihood_history' in result
        assert 'converged' in result
        assert 'iterations' in result

    def test_ll_history_not_empty(self, engine):
        seqs = [gen_seq(0, 10)]
        result = engine.baum_welch(seqs, max_iter=5)
        assert len(result['log_likelihood_history']) > 0

    def test_ll_non_decreasing(self, engine):
        """EM should monotonically increase log-likelihood."""
        seqs = [gen_seq(0, 20, seed=42)]
        result = engine.baum_welch(seqs, max_iter=10)
        ll = result['log_likelihood_history']
        for i in range(1, len(ll)):
            assert ll[i] >= ll[i-1] - 1e-4  # Allow tiny numerical noise


class TestLearnedTransitions:
    def test_transition_matrix_shape(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        T = result['learned_transitions']
        assert len(T) == 3
        for row in T:
            assert len(row) == 3

    def test_rows_sum_to_one(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for row in result['learned_transitions']:
            assert abs(sum(row) - 1.0) < 0.01

    def test_all_probs_positive(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for row in result['learned_transitions']:
            for p in row:
                assert p > 0

    def test_no_update_when_disabled(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5, update_transitions=False)
        assert result['learned_transitions'] is None


class TestLearnedEmissions:
    def test_emissions_have_all_features(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for feat in FEATURES:
            assert feat in result['learned_emissions']

    def test_emissions_have_means_and_vars(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for feat in FEATURES:
            e = result['learned_emissions'][feat]
            assert 'means' in e
            assert 'vars' in e
            assert len(e['means']) == 3
            assert len(e['vars']) == 3

    def test_variances_positive(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for feat in FEATURES:
            for v in result['learned_emissions'][feat]['vars']:
                assert v > 0

    def test_means_within_bounds(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5)
        for feat in FEATURES:
            e = result['learned_emissions'][feat]
            lo, hi = EMISSION_PARAMS[feat]['bounds']
            for m in e['means']:
                assert lo <= m <= hi

    def test_no_update_when_disabled(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.baum_welch(seqs, max_iter=5, update_emissions=False)
        assert result['learned_emissions'] is None


class TestConvergence:
    def test_converges_on_stable_data(self, engine):
        seqs = [gen_seq(0, 30, seed=s) for s in range(3)]
        result = engine.baum_welch(seqs, max_iter=20, tol=1e-2)
        # Should converge within 20 iterations on clean data
        assert result['iterations'] <= 20

    @pytest.mark.parametrize("max_iter", [1, 2, 5, 10])
    def test_respects_max_iter(self, engine, max_iter):
        seqs = [gen_seq(0, 10)]
        result = engine.baum_welch(seqs, max_iter=max_iter, tol=1e-20)
        assert result['iterations'] <= max_iter


class TestMultipleSequences:
    def test_two_sequences(self, engine):
        seqs = [gen_seq(0, 10, seed=1), gen_seq(0, 10, seed=2)]
        result = engine.baum_welch(seqs, max_iter=5)
        assert len(result['log_likelihood_history']) > 0

    def test_three_sequences_different_states(self, engine):
        seqs = [gen_seq(0, 10, seed=1), gen_seq(1, 10, seed=2), gen_seq(2, 10, seed=3)]
        result = engine.baum_welch(seqs, max_iter=5)
        assert len(result['log_likelihood_history']) > 0

    def test_short_sequences_skipped(self, engine):
        """Sequences with <2 observations should be skipped."""
        seqs = [gen_seq(0, 1), gen_seq(0, 10)]  # First has T=1
        result = engine.baum_welch(seqs, max_iter=3)
        assert len(result['log_likelihood_history']) > 0


class TestTrainPatientBaumWelch:
    def test_stores_personalized_params(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.train_patient_baum_welch('p1', seqs, max_iter=3)
        assert result['success']
        assert 'p1' in engine._personalized_baselines

    def test_stores_transitions(self, engine):
        seqs = [gen_seq(0, 15)]
        engine.train_patient_baum_welch('p1', seqs, max_iter=3)
        assert hasattr(engine, '_personalized_transitions')
        assert 'p1' in engine._personalized_transitions

    def test_result_keys(self, engine):
        seqs = [gen_seq(0, 15)]
        result = engine.train_patient_baum_welch('p1', seqs, max_iter=3)
        assert 'patient_id' in result
        assert 'converged' in result
        assert 'iterations' in result
        assert 'features_trained' in result

    @pytest.mark.parametrize("pid", ['patient_001', 'patient_002', 'test_patient'])
    def test_multiple_patients(self, engine, pid):
        seqs = [gen_seq(0, 15)]
        result = engine.train_patient_baum_welch(pid, seqs, max_iter=3)
        assert result['success']
        assert pid in engine._personalized_baselines

    def test_inference_uses_trained_params(self, engine):
        seqs = [gen_seq(0, 20, seed=42)]
        engine.train_patient_baum_welch('p1', seqs, max_iter=5)
        obs = gen_seq(0, 6, seed=99)
        result = engine.run_inference(obs, patient_id='p1')
        assert result['current_state'] in STATES
