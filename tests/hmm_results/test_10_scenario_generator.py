"""
TEST SUITE 10: Demo Scenario Generator & Bounds
~200 tests for generate_demo_scenario and _apply_bounds
"""
import math
import pytest
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


SCENARIOS = [
    "stable_perfect", "stable_realistic", "missing_data",
    "gradual_decline", "warning_to_crisis", "sudden_crisis", "recovery"
]


class TestScenarioGeneration:
    @pytest.mark.parametrize("scenario", SCENARIOS)
    def test_generates_observations(self, engine, scenario):
        obs = engine.generate_demo_scenario(scenario)
        assert len(obs) > 0

    @pytest.mark.parametrize("scenario", SCENARIOS)
    def test_correct_count_14_days(self, engine, scenario):
        obs = engine.generate_demo_scenario(scenario, days=14)
        assert len(obs) == 14 * 6  # 6 buckets per day

    @pytest.mark.parametrize("scenario", SCENARIOS)
    @pytest.mark.parametrize("days", [1, 3, 7, 14, 30])
    def test_various_durations(self, engine, scenario, days):
        obs = engine.generate_demo_scenario(scenario, days=days)
        assert len(obs) == days * 6

    @pytest.mark.parametrize("scenario", SCENARIOS)
    def test_reproducible_with_seed(self, engine, scenario):
        obs1 = engine.generate_demo_scenario(scenario, seed=42)
        obs2 = engine.generate_demo_scenario(scenario, seed=42)
        for o1, o2 in zip(obs1, obs2):
            for feat in FEATURES:
                v1, v2 = o1.get(feat), o2.get(feat)
                if v1 is not None and v2 is not None:
                    assert v1 == v2

    @pytest.mark.parametrize("scenario", SCENARIOS)
    def test_different_seeds_differ(self, engine, scenario):
        obs1 = engine.generate_demo_scenario(scenario, seed=42)
        obs2 = engine.generate_demo_scenario(scenario, seed=99)
        differs = False
        for o1, o2 in zip(obs1, obs2):
            for feat in FEATURES:
                v1, v2 = o1.get(feat), o2.get(feat)
                if v1 is not None and v2 is not None and v1 != v2:
                    differs = True
                    break
            if differs:
                break
        assert differs


class TestBoundsEnforced:
    @pytest.mark.parametrize("scenario", SCENARIOS)
    def test_all_values_within_bounds(self, engine, scenario):
        obs = engine.generate_demo_scenario(scenario, days=14)
        for o in obs:
            for feat in FEATURES:
                val = o.get(feat)
                if val is not None:
                    lo, hi = EMISSION_PARAMS[feat]['bounds']
                    assert lo <= val <= hi, f"{feat}={val} outside [{lo},{hi}] in {scenario}"


class TestStablePerfect:
    def test_all_features_present(self, engine):
        obs = engine.generate_demo_scenario("stable_perfect")
        for o in obs:
            for feat in FEATURES:
                assert feat in o
                assert o[feat] is not None

    def test_glucose_in_range(self, engine):
        obs = engine.generate_demo_scenario("stable_perfect")
        for o in obs:
            assert 4.0 < o['glucose_avg'] < 8.0

    def test_meds_perfect(self, engine):
        obs = engine.generate_demo_scenario("stable_perfect")
        for o in obs:
            assert o['meds_adherence'] == 1.0

    def test_inference_detects_stable(self, engine):
        obs = engine.generate_demo_scenario("stable_perfect")
        result = engine.run_inference(obs)
        assert result['current_state'] == 'STABLE'


class TestStableRealistic:
    def test_has_variation(self, engine):
        obs = engine.generate_demo_scenario("stable_realistic")
        glucose_vals = [o['glucose_avg'] for o in obs]
        assert max(glucose_vals) - min(glucose_vals) > 0.5

    def test_inference_detects_stable(self, engine):
        obs = engine.generate_demo_scenario("stable_realistic")
        result = engine.run_inference(obs)
        assert result['current_state'] == 'STABLE'


class TestMissingData:
    def test_has_none_values(self, engine):
        obs = engine.generate_demo_scenario("missing_data")
        has_none = any(o.get(f) is None for o in obs for f in FEATURES)
        assert has_none

    def test_inference_handles_missing(self, engine):
        obs = engine.generate_demo_scenario("missing_data")
        result = engine.run_inference(obs)
        assert result['current_state'] in STATES


class TestGradualDecline:
    def test_glucose_increases_over_time(self, engine):
        obs = engine.generate_demo_scenario("gradual_decline", days=14)
        early_glucose = np.mean([o['glucose_avg'] for o in obs[:12]])
        late_glucose = np.mean([o['glucose_avg'] for o in obs[-12:]])
        assert late_glucose > early_glucose

    def test_meds_decreases(self, engine):
        obs = engine.generate_demo_scenario("gradual_decline", days=14)
        early = np.mean([o['meds_adherence'] for o in obs[:12]])
        late = np.mean([o['meds_adherence'] for o in obs[-12:]])
        assert late < early

    def test_final_state_warning_or_crisis(self, engine):
        obs = engine.generate_demo_scenario("gradual_decline", days=14)
        result = engine.run_inference(obs)
        assert result['current_state'] in ('WARNING', 'CRISIS')


class TestWarningToCrisis:
    def test_final_state_crisis(self, engine):
        obs = engine.generate_demo_scenario("warning_to_crisis", days=14)
        result = engine.run_inference(obs)
        assert result['current_state'] in ('WARNING', 'CRISIS')

    def test_path_shows_progression(self, engine):
        obs = engine.generate_demo_scenario("warning_to_crisis", days=14)
        result = engine.run_inference(obs)
        path = result['path_states']
        # Early states should be more stable
        early_stable = sum(1 for s in path[:20] if s == 'STABLE')
        late_stable = sum(1 for s in path[-20:] if s == 'STABLE')
        assert early_stable >= late_stable


class TestRecovery:
    def test_final_state_stable_or_warning(self, engine):
        obs = engine.generate_demo_scenario("recovery", days=14)
        result = engine.run_inference(obs)
        assert result['current_state'] in ('STABLE', 'WARNING')


class TestApplyBounds:
    def test_clamps_low(self, engine):
        obs = {'glucose_avg': -5.0}
        result = engine._apply_bounds(obs)
        assert result['glucose_avg'] >= EMISSION_PARAMS['glucose_avg']['bounds'][0]

    def test_clamps_high(self, engine):
        obs = {'glucose_avg': 100.0}
        result = engine._apply_bounds(obs)
        assert result['glucose_avg'] <= EMISSION_PARAMS['glucose_avg']['bounds'][1]

    def test_within_bounds_unchanged(self, engine):
        obs = {'glucose_avg': 6.5}
        result = engine._apply_bounds(obs)
        assert result['glucose_avg'] == 6.5

    def test_none_ignored(self, engine):
        obs = {'glucose_avg': None}
        result = engine._apply_bounds(obs)
        assert result['glucose_avg'] is None

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_bounds_applied_per_feature(self, engine, feat):
        lo, hi = EMISSION_PARAMS[feat]['bounds']
        obs = {feat: lo - 10}
        result = engine._apply_bounds(obs)
        assert result[feat] == lo

        obs = {feat: hi + 10}
        result = engine._apply_bounds(obs)
        assert result[feat] == hi


class TestGaussianPlotData:
    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_returns_curves(self, engine, feat):
        curves = engine.get_gaussian_plot_data(feat)
        assert curves is not None
        assert len(curves) == 3

    def test_invalid_feature(self, engine):
        assert engine.get_gaussian_plot_data('nonexistent') is None

    @pytest.mark.parametrize("feat", list(FEATURES.keys()))
    def test_curve_structure(self, engine, feat):
        curves = engine.get_gaussian_plot_data(feat)
        for curve in curves:
            assert 'state' in curve
            assert 'x' in curve
            assert 'y' in curve
            assert 'mean' in curve
            assert 'std' in curve
            assert len(curve['x']) > 0
            assert len(curve['y']) == len(curve['x'])

    def test_with_observed_value(self, engine):
        curves = engine.get_gaussian_plot_data('glucose_avg', observed_value=6.0)
        assert curves is not None

    def test_extreme_observed_extends_range(self, engine):
        curves_normal = engine.get_gaussian_plot_data('glucose_avg', observed_value=6.0)
        curves_extreme = engine.get_gaussian_plot_data('glucose_avg', observed_value=40.0)
        max_x_normal = max(curves_normal[0]['x'])
        max_x_extreme = max(curves_extreme[0]['x'])
        assert max_x_extreme >= max_x_normal
