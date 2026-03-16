"""
TEST SUITE 03: SafetyMonitor (Deterministic Rules Layer)
~250 tests covering all thresholds, edge cases, combinations
"""
import pytest
from conftest import SafetyMonitor


@pytest.fixture
def sm():
    return SafetyMonitor()


# =============================================================================
# Hypoglycemia Tests
# =============================================================================
class TestHypoglycemia:
    """Tests for hypoglycemia detection thresholds."""

    def test_level2_crisis_at_2_9(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 2.9})
        assert state == 'CRISIS'

    def test_level2_crisis_at_2_0(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 2.0})
        assert state == 'CRISIS'

    def test_level2_crisis_at_1_0(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 1.0})
        assert state == 'CRISIS'

    def test_level2_crisis_at_0(self, sm):
        """Edge: glucose=0 (physiologically impossible but test handling)."""
        state, _ = sm.check_safety({'glucose_avg': 0.0})
        assert state == 'CRISIS'

    def test_level2_boundary_exactly_3_0(self, sm):
        """At exactly 3.0, should NOT trigger level2 (uses < not <=)."""
        state, _ = sm.check_safety({'glucose_avg': 3.0})
        # 3.0 is NOT < 3.0, so level2 not triggered
        # But 3.0 < 3.9, so level1 WARNING triggers
        assert state == 'WARNING'

    def test_level1_warning_at_3_5(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 3.5})
        assert state == 'WARNING'

    def test_level1_warning_at_3_1(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 3.1})
        assert state == 'WARNING'

    def test_level1_boundary_exactly_3_9(self, sm):
        """At exactly 3.9, should NOT trigger level1 (uses < not <=)."""
        state, reason = sm.check_safety({'glucose_avg': 3.9})
        # 3.9 is NOT < 3.9
        assert state is None or state != 'WARNING' or 'hypo' not in (reason or '').lower()

    def test_normal_glucose_no_trigger(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 5.5})
        assert state is None

    @pytest.mark.parametrize("glucose", [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 2.9])
    def test_severe_hypo_range(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        assert state == 'CRISIS'

    @pytest.mark.parametrize("glucose", [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8])
    def test_alert_hypo_range(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        assert state == 'WARNING'


# =============================================================================
# Hyperglycemia Tests
# =============================================================================
class TestHyperglycemia:
    def test_severe_crisis_at_17_0(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 17.0})
        assert state == 'CRISIS'

    def test_severe_crisis_at_20_0(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 20.0})
        assert state == 'CRISIS'

    def test_severe_crisis_at_33_3(self, sm):
        """HHS territory."""
        state, _ = sm.check_safety({'glucose_avg': 33.3})
        assert state == 'CRISIS'

    def test_severe_boundary_16_7(self, sm):
        """At exactly 16.7, NOT > 16.7."""
        state, _ = sm.check_safety({'glucose_avg': 16.7})
        # 16.7 is NOT > 16.7, but 16.7 > 13.9 so WARNING triggers
        assert state == 'WARNING'

    def test_uncontrolled_warning_at_14_0(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 14.0})
        assert state == 'WARNING'

    def test_uncontrolled_boundary_13_9(self, sm):
        state, _ = sm.check_safety({'glucose_avg': 13.9})
        assert state is None

    @pytest.mark.parametrize("glucose", [17.0, 18.0, 20.0, 25.0, 30.0, 35.0])
    def test_severe_hyper_range(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        assert state == 'CRISIS'

    @pytest.mark.parametrize("glucose", [14.0, 14.5, 15.0, 15.5, 16.0, 16.5, 16.7])
    def test_uncontrolled_hyper_range(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        # Should be WARNING (14.0-16.7 > 13.9 but <= 16.7)
        assert state in ('WARNING', 'CRISIS')


# =============================================================================
# Medication Adherence
# =============================================================================
class TestMedsAdherence:
    def test_poor_adherence_warning(self, sm):
        state, _ = sm.check_safety({'meds_adherence': 0.3})
        assert state == 'WARNING'

    def test_poor_adherence_at_0(self, sm):
        state, _ = sm.check_safety({'meds_adherence': 0.0})
        assert state == 'WARNING'

    def test_boundary_0_5(self, sm):
        state, _ = sm.check_safety({'meds_adherence': 0.5})
        assert state is None

    def test_good_adherence(self, sm):
        state, _ = sm.check_safety({'meds_adherence': 0.9})
        assert state is None

    @pytest.mark.parametrize("adh", [0.0, 0.1, 0.2, 0.3, 0.4, 0.49])
    def test_poor_adherence_range(self, sm, adh):
        state, _ = sm.check_safety({'meds_adherence': adh})
        assert state == 'WARNING'


# =============================================================================
# Cardiac - Resting HR
# =============================================================================
class TestCardiac:
    def test_tachycardia_warning(self, sm):
        state, _ = sm.check_safety({'resting_hr': 125})
        assert state == 'WARNING'

    def test_tachycardia_boundary(self, sm):
        state, _ = sm.check_safety({'resting_hr': 120})
        assert state is None

    def test_bradycardia_warning(self, sm):
        state, _ = sm.check_safety({'resting_hr': 40})
        assert state == 'WARNING'

    def test_bradycardia_boundary(self, sm):
        state, _ = sm.check_safety({'resting_hr': 45})
        assert state is None

    def test_normal_hr(self, sm):
        state, _ = sm.check_safety({'resting_hr': 70})
        assert state is None

    @pytest.mark.parametrize("hr", [121, 130, 140, 150, 160, 180, 200])
    def test_tachycardia_range(self, sm, hr):
        state, _ = sm.check_safety({'resting_hr': hr})
        assert state == 'WARNING'

    @pytest.mark.parametrize("hr", [10, 20, 30, 35, 40, 44])
    def test_bradycardia_range(self, sm, hr):
        state, _ = sm.check_safety({'resting_hr': hr})
        assert state == 'WARNING'


# =============================================================================
# HRV Autonomic Dysfunction
# =============================================================================
class TestHRV:
    def test_severe_dysfunction(self, sm):
        state, _ = sm.check_safety({'hrv_rmssd': 8})
        assert state == 'WARNING'

    def test_boundary_10(self, sm):
        state, _ = sm.check_safety({'hrv_rmssd': 10})
        assert state is None

    def test_normal_hrv(self, sm):
        state, _ = sm.check_safety({'hrv_rmssd': 35})
        assert state is None

    @pytest.mark.parametrize("hrv", [1, 3, 5, 7, 9, 9.9])
    def test_dysfunction_range(self, sm, hrv):
        state, _ = sm.check_safety({'hrv_rmssd': hrv})
        assert state == 'WARNING'


# =============================================================================
# Glucose Variability
# =============================================================================
class TestGlucoseVariability:
    def test_extreme_variability(self, sm):
        state, _ = sm.check_safety({'glucose_variability': 55})
        assert state == 'WARNING'

    def test_boundary_50(self, sm):
        state, _ = sm.check_safety({'glucose_variability': 50})
        assert state is None

    def test_normal_cv(self, sm):
        state, _ = sm.check_safety({'glucose_variability': 25})
        assert state is None

    @pytest.mark.parametrize("cv", [51, 55, 60, 70, 80, 90, 100])
    def test_high_variability_range(self, sm, cv):
        state, _ = sm.check_safety({'glucose_variability': cv})
        assert state == 'WARNING'


# =============================================================================
# Edge Cases & Combinations
# =============================================================================
class TestEdgeCases:
    def test_empty_observation(self, sm):
        state, reason = sm.check_safety({})
        assert state is None
        assert reason is None

    def test_none_observation(self, sm):
        state, reason = sm.check_safety(None)
        assert state is None
        assert reason is None

    def test_all_none_values(self, sm):
        obs = {'glucose_avg': None, 'resting_hr': None, 'hrv_rmssd': None}
        state, reason = sm.check_safety(obs)
        assert state is None

    def test_unknown_features_ignored(self, sm):
        state, _ = sm.check_safety({'unknown_feature': 999})
        assert state is None

    def test_crisis_beats_warning(self, sm):
        """When both CRISIS and WARNING rules trigger, CRISIS wins."""
        obs = {'glucose_avg': 2.5, 'meds_adherence': 0.3}
        state, _ = sm.check_safety(obs)
        assert state == 'CRISIS'

    def test_multiple_warnings(self, sm):
        obs = {'meds_adherence': 0.3, 'resting_hr': 130, 'hrv_rmssd': 5}
        state, _ = sm.check_safety(obs)
        assert state == 'WARNING'

    def test_crisis_reason_contains_critical(self, sm):
        _, reason = sm.check_safety({'glucose_avg': 2.0})
        assert 'CRITICAL' in reason

    def test_warning_reason_contains_alert(self, sm):
        _, reason = sm.check_safety({'glucose_avg': 3.5})
        assert 'ALERT' in reason

    def test_normal_all_features(self, sm):
        obs = {
            'glucose_avg': 6.0, 'glucose_variability': 25, 'meds_adherence': 0.9,
            'resting_hr': 70, 'hrv_rmssd': 35
        }
        state, _ = sm.check_safety(obs)
        assert state is None


# =============================================================================
# Parametric boundary sweep
# =============================================================================
class TestBoundarySweep:
    """Sweep across boundaries to verify exact threshold behavior."""

    @pytest.mark.parametrize("glucose", [2.99, 3.0, 3.01])
    def test_hypo_level2_boundary(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        if glucose < 3.0:
            assert state == 'CRISIS'
        elif glucose < 3.9:
            assert state == 'WARNING'

    @pytest.mark.parametrize("glucose", [3.89, 3.9, 3.91])
    def test_hypo_level1_boundary(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        if glucose < 3.9:
            assert state == 'WARNING'
        else:
            assert state is None

    @pytest.mark.parametrize("glucose", [13.89, 13.9, 13.91, 14.0])
    def test_hyper_uncontrolled_boundary(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        if glucose > 16.7:
            assert state == 'CRISIS'
        elif glucose > 13.9:
            assert state == 'WARNING'
        else:
            assert state is None

    @pytest.mark.parametrize("glucose", [16.69, 16.7, 16.71])
    def test_hyper_severe_boundary(self, sm, glucose):
        state, _ = sm.check_safety({'glucose_avg': glucose})
        if glucose > 16.7:
            assert state == 'CRISIS'
        elif glucose > 13.9:
            assert state == 'WARNING'

    @pytest.mark.parametrize("hr", [119, 120, 121])
    def test_tachycardia_boundary_sweep(self, sm, hr):
        state, _ = sm.check_safety({'resting_hr': hr})
        if hr > 120:
            assert state == 'WARNING'
        else:
            assert state is None

    @pytest.mark.parametrize("hr", [44, 45, 46])
    def test_bradycardia_boundary_sweep(self, sm, hr):
        state, _ = sm.check_safety({'resting_hr': hr})
        if hr < 45:
            assert state == 'WARNING'
        else:
            assert state is None

    @pytest.mark.parametrize("adh", [0.49, 0.50, 0.51])
    def test_meds_boundary_sweep(self, sm, adh):
        state, _ = sm.check_safety({'meds_adherence': adh})
        if adh < 0.5:
            assert state == 'WARNING'
        else:
            assert state is None
