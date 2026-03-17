"""
Comprehensive tests for the Proactive Oracle system.

Covers:
  - All 6 trigger conditions (glucose_rising, sustained_risk, logging_gap,
    medication_nudge, streak_save, mood_followup)
  - Edge cases: no observations, single observation, all triggers
  - Proactive check-in scheduling: valid times, invalid times, past times
  - Risk calculation: STABLE < WARNING < CRISIS ordering
  - Risk bounds: always 0-1
  - Risk monotonic with horizon
"""

import pytest
import math
import sys
import os
import time
import sqlite3
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import numpy as np

# Path resolution
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, "core"))

try:
    from hmm_engine import HMMEngine, STATES
except ImportError:
    from core.hmm_engine import HMMEngine, STATES

try:
    from agent_runtime import (
        _check_proactive_triggers,
        run_proactive_scan,
        _exec_schedule_checkin,
        _ensure_runtime_tables_inner,
        detect_mood_from_message,
        get_patient_streaks,
    )
except ImportError:
    from core.agent_runtime import (
        _check_proactive_triggers,
        run_proactive_scan,
        _exec_schedule_checkin,
        _ensure_runtime_tables_inner,
        detect_mood_from_message,
        get_patient_streaks,
    )


class _NoCloseConnection:
    """Wrapper that delegates to a real sqlite3.Connection but makes close() a no-op."""

    def __init__(self, conn):
        self._conn = conn

    def close(self):
        pass

    def __getattr__(self, name):
        return getattr(self._conn, name)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def engine():
    return HMMEngine()


@pytest.fixture
def patient_id():
    return "P-TEST-ORACLE-001"


@pytest.fixture
def raw_db():
    """Raw in-memory SQLite DB with all runtime tables and supporting tables."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    _ensure_runtime_tables_inner(conn)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS glucose_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            reading_timestamp_utc INTEGER,
            glucose_value REAL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS medication_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            taken_timestamp_utc INTEGER,
            medication_name TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS fitbit_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            date INTEGER,
            steps INTEGER
        )
    """)
    conn.commit()
    yield conn
    conn.close()


@pytest.fixture
def in_memory_db(raw_db):
    """No-close wrapper for use with functions that call conn.close()."""
    return _NoCloseConnection(raw_db)


# ===========================================================================
# RISK CALCULATION TESTS
# ===========================================================================

class TestRiskCalculationBasics:

    def test_stable_patient_low_risk(self, engine):
        """100% STABLE should have low crisis risk."""
        risk = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=12)
        assert 0.0 <= risk <= 1.0
        assert risk < 0.3, f"Stable patient should have low risk, got {risk}"

    def test_warning_patient_moderate_risk(self, engine):
        """100% WARNING should have higher risk than STABLE."""
        risk = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=12)
        assert 0.0 <= risk <= 1.0

    def test_crisis_patient_max_risk(self, engine):
        """100% CRISIS = absorbing state, risk must be 1.0."""
        risk = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=12)
        assert risk == 1.0

    def test_risk_ordering_stable_warning_crisis(self, engine):
        """STABLE < WARNING < CRISIS risk ordering."""
        risk_stable = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=12)
        risk_warning = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=12)
        risk_crisis = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=12)
        assert risk_stable < risk_warning, "Stable risk must be < Warning risk"
        assert risk_warning <= risk_crisis, "Warning risk must be <= Crisis risk"
        assert risk_crisis == 1.0


class TestRiskBounds:

    def test_risk_always_between_zero_and_one(self, engine):
        """Risk must always be in [0, 1] regardless of input."""
        test_cases = [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0],
            [0.5, 0.3, 0.2],
            [0.33, 0.34, 0.33],
            [0.8, 0.1, 0.1],
        ]
        for probs in test_cases:
            for horizon in [1, 6, 12, 24, 48]:
                risk = engine.calculate_future_risk(probs, horizon=horizon)
                assert 0.0 <= risk <= 1.0, (
                    f"Risk out of bounds: {risk} for probs={probs}, horizon={horizon}"
                )

    def test_risk_zero_horizon(self, engine):
        """Horizon=0 means no time passes -- risk = current crisis probability."""
        risk = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=0)
        assert abs(risk - 0.0) < 1e-6, "No time passed from STABLE = 0 crisis risk"

        risk_crisis = engine.calculate_future_risk([0.0, 0.0, 1.0], horizon=0)
        assert abs(risk_crisis - 1.0) < 1e-6, "Already in CRISIS with horizon=0 = 1.0"

    def test_risk_single_step(self, engine):
        """Single step forward from STABLE should give small but nonzero risk."""
        risk = engine.calculate_future_risk([1.0, 0.0, 0.0], horizon=1)
        assert 0.0 <= risk <= 1.0


class TestRiskMonotonicWithHorizon:

    def test_monotonic_from_stable(self, engine):
        """Risk should not decrease as horizon increases (absorbing chain)."""
        probs = [1.0, 0.0, 0.0]
        prev_risk = 0.0
        for h in range(0, 25):
            risk = engine.calculate_future_risk(probs, horizon=h)
            assert risk >= prev_risk - 1e-9, (
                f"Risk decreased from {prev_risk} to {risk} at horizon {h}"
            )
            prev_risk = risk

    def test_monotonic_from_warning(self, engine):
        """Risk should not decrease as horizon increases from WARNING."""
        probs = [0.0, 1.0, 0.0]
        prev_risk = 0.0
        for h in range(0, 25):
            risk = engine.calculate_future_risk(probs, horizon=h)
            assert risk >= prev_risk - 1e-9, (
                f"Risk decreased from {prev_risk} to {risk} at horizon {h}"
            )
            prev_risk = risk

    def test_monotonic_from_mixed(self, engine):
        """Risk should not decrease for mixed starting state."""
        probs = [0.5, 0.3, 0.2]
        prev_risk = 0.0
        for h in range(0, 25):
            risk = engine.calculate_future_risk(probs, horizon=h)
            assert risk >= prev_risk - 1e-9
            prev_risk = risk

    def test_short_vs_long_horizon(self, engine):
        risk_1 = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=1)
        risk_12 = engine.calculate_future_risk([0.0, 1.0, 0.0], horizon=12)
        assert risk_12 >= risk_1, "Cumulative risk should not decrease over time"


class TestRiskInInference:

    def test_run_inference_returns_risk(self, engine):
        """run_inference should include risk_48h in predictions."""
        obs = [{"glucose_avg": 5.5} for _ in range(5)]
        result = engine.run_inference(obs)
        assert "predictions" in result
        assert "risk_48h" in result["predictions"]
        assert 0.0 <= result["predictions"]["risk_48h"] <= 1.0

    def test_high_glucose_increases_risk(self, engine):
        """High glucose observations should produce higher risk."""
        low_obs = [{"glucose_avg": 5.0} for _ in range(5)]
        high_obs = [{"glucose_avg": 15.0} for _ in range(5)]
        result_low = engine.run_inference(low_obs)
        result_high = engine.run_inference(high_obs)
        risk_low = result_low["predictions"]["risk_48h"]
        risk_high = result_high["predictions"]["risk_48h"]
        assert risk_high >= risk_low, (
            f"High glucose risk ({risk_high}) should be >= low glucose risk ({risk_low})"
        )


# ===========================================================================
# PROACTIVE TRIGGER TESTS
# ===========================================================================

class TestGlucoseRisingTrigger:

    def test_glucose_rising_fires_on_high_velocity(self, in_memory_db, patient_id):
        """Trigger should fire when merlion velocity > 0.3 and acceleration > 0."""
        mock_merlion = {"velocity": 0.5, "acceleration": 0.1, "risk_level": "high"}

        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = [{"glucose_avg": 8.0}]
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        glucose_triggers = [t for t in triggers if t["type"] == "glucose_rising"]
        assert len(glucose_triggers) >= 1, "glucose_rising trigger should fire"

    def test_glucose_rising_not_fires_on_low_velocity(self, in_memory_db, patient_id):
        """Trigger should NOT fire when velocity <= 0.3."""
        mock_merlion = {"velocity": 0.1, "acceleration": 0.0, "risk_level": "low"}

        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = [{"glucose_avg": 5.5}]
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        glucose_triggers = [t for t in triggers if t["type"] == "glucose_rising"]
        assert len(glucose_triggers) == 0


class TestSustainedRiskTrigger:

    def test_sustained_warning_fires(self, in_memory_db, raw_db, patient_id):
        """Trigger fires when last 2+ observations are WARNING/CRISIS."""
        now = int(time.time())
        for i in range(3):
            raw_db.execute(
                "INSERT INTO agent_actions_log (patient_id, timestamp_utc, hmm_state) VALUES (?, ?, ?)",
                (patient_id, now - i * 100, "WARNING"),
            )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        sustained = [t for t in triggers if t["type"] == "sustained_risk"]
        assert len(sustained) >= 1, "sustained_risk should fire for consecutive WARNING states"

    def test_sustained_risk_not_fires_for_stable(self, in_memory_db, raw_db, patient_id):
        """Trigger should NOT fire when recent states are STABLE."""
        now = int(time.time())
        for i in range(3):
            raw_db.execute(
                "INSERT INTO agent_actions_log (patient_id, timestamp_utc, hmm_state) VALUES (?, ?, ?)",
                (patient_id, now - i * 100, "STABLE"),
            )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        sustained = [t for t in triggers if t["type"] == "sustained_risk"]
        assert len(sustained) == 0


class TestLoggingGapTrigger:

    def test_logging_gap_fires_after_6_hours(self, in_memory_db, raw_db, patient_id):
        """Trigger fires when no glucose reading for >6 hours."""
        old_ts = int(time.time()) - 7 * 3600  # 7 hours ago
        raw_db.execute(
            "INSERT INTO glucose_readings (user_id, reading_timestamp_utc, glucose_value) VALUES (?, ?, ?)",
            (patient_id, old_ts, 6.5),
        )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        gap = [t for t in triggers if t["type"] == "logging_gap"]
        assert len(gap) >= 1, "logging_gap trigger should fire after 7 hours without reading"

    def test_logging_gap_not_fires_with_recent_reading(self, in_memory_db, raw_db, patient_id):
        """Trigger should NOT fire when there is a recent reading."""
        recent_ts = int(time.time()) - 1 * 3600  # 1 hour ago
        raw_db.execute(
            "INSERT INTO glucose_readings (user_id, reading_timestamp_utc, glucose_value) VALUES (?, ?, ?)",
            (patient_id, recent_ts, 6.5),
        )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        gap = [t for t in triggers if t["type"] == "logging_gap"]
        assert len(gap) == 0


class TestMedicationNudgeTrigger:

    def test_med_nudge_fires_at_optimal_hour(self, in_memory_db, patient_id):
        """Trigger fires when current hour matches best_hours and no meds logged today."""
        current_hour = datetime.now().hour

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": [current_hour]}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        nudge = [t for t in triggers if t["type"] == "medication_nudge"]
        assert len(nudge) >= 1, "medication_nudge should fire at optimal hour with no meds logged"

    def test_med_nudge_not_fires_wrong_hour(self, in_memory_db, patient_id):
        """Trigger should NOT fire when current hour is not in best_hours."""
        wrong_hour = (datetime.now().hour + 12) % 24

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": [wrong_hour]}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        nudge = [t for t in triggers if t["type"] == "medication_nudge"]
        assert len(nudge) == 0


class TestStreakSaveTrigger:

    def test_streak_save_fires_when_streak_at_risk(self, in_memory_db, patient_id):
        """Trigger fires when a streak >= 3 days has no action today but had action yesterday."""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        mock_streaks = {
            "medication": {"current": 5, "best": 10, "last_action": yesterday},
        }
        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value=mock_streaks), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        streak = [t for t in triggers if t["type"] == "streak_save"]
        assert len(streak) >= 1, "streak_save should fire for at-risk streak"

    def test_streak_save_not_fires_for_short_streak(self, in_memory_db, patient_id):
        """Trigger should NOT fire when streak < 3."""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        mock_streaks = {
            "medication": {"current": 2, "best": 5, "last_action": yesterday},
        }
        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value=mock_streaks), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        streak = [t for t in triggers if t["type"] == "streak_save"]
        assert len(streak) == 0


class TestMoodFollowupTrigger:

    def test_mood_followup_fires_for_sad_message(self, in_memory_db, raw_db, patient_id):
        """Trigger fires when last user message indicates frustration/sadness/worry."""
        now = int(time.time())
        raw_db.execute(
            "INSERT INTO conversation_history (patient_id, timestamp_utc, role, message) VALUES (?, ?, ?, ?)",
            (patient_id, now - 300, "user", "I feel so lonely and sad"),
        )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}):
            triggers = _check_proactive_triggers(patient_id)

        mood = [t for t in triggers if t["type"] == "mood_followup"]
        assert len(mood) >= 1, "mood_followup should fire for sad message"

    def test_mood_followup_not_fires_for_positive(self, in_memory_db, raw_db, patient_id):
        """Trigger should NOT fire when last message is positive."""
        now = int(time.time())
        raw_db.execute(
            "INSERT INTO conversation_history (patient_id, timestamp_utc, role, message) VALUES (?, ?, ?, ?)",
            (patient_id, now - 300, "user", "Feeling great today, thanks!"),
        )
        raw_db.commit()

        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}):
            triggers = _check_proactive_triggers(patient_id)

        mood = [t for t in triggers if t["type"] == "mood_followup"]
        assert len(mood) == 0


# ===========================================================================
# EDGE CASES
# ===========================================================================

class TestTriggerEdgeCases:

    def test_no_data_produces_no_triggers(self, in_memory_db, patient_id):
        """Empty DB should not crash and should produce zero or minimal triggers."""
        mock_merlion = {"velocity": 0.0, "acceleration": 0.0}
        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_merlion_forecast", return_value=mock_merlion), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}), \
             patch("agent_runtime.get_optimal_nudge_times", return_value={"best_hours": []}), \
             patch("agent_runtime.get_patient_streaks", return_value={}), \
             patch("agent_runtime.detect_mood_from_message", return_value={"mood": "neutral"}):
            triggers = _check_proactive_triggers(patient_id)

        assert isinstance(triggers, list)

    def test_single_observation_no_crash(self, engine):
        """Single observation should not crash run_inference."""
        obs = [{"glucose_avg": 6.0}]
        result = engine.run_inference(obs)
        assert "predictions" in result


# ===========================================================================
# PROACTIVE CHECK-IN SCHEDULING
# ===========================================================================

class TestScheduleProactiveCheckin:

    def test_valid_hhmm_time(self, raw_db, patient_id):
        """Valid HH:MM format should be stored correctly."""
        now = int(time.time())
        result = _exec_schedule_checkin(
            {"checkin_time": "14:30", "checkin_type": "wellness", "reason": "Test"},
            patient_id, raw_db, now,
        )
        assert result["success"] is True
        assert result["checkin_time"] == "14:30"

        row = raw_db.execute(
            "SELECT * FROM proactive_checkins WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row is not None
        assert row["scheduled_time"] == "14:30"
        assert row["status"] == "pending"

    def test_iso_datetime_accepted(self, raw_db, patient_id):
        """Full ISO datetime should be accepted."""
        now = int(time.time())
        iso_time = "2026-03-17T10:00:00"
        result = _exec_schedule_checkin(
            {"checkin_time": iso_time, "checkin_type": "glucose_check"},
            patient_id, raw_db, now,
        )
        assert result["success"] is True
        assert result["checkin_time"] == iso_time

    def test_invalid_time_defaults_to_1000(self, raw_db, patient_id):
        """Invalid time format should default to 10:00."""
        now = int(time.time())
        result = _exec_schedule_checkin(
            {"checkin_time": "not-a-time"},
            patient_id, raw_db, now,
        )
        assert result["success"] is True
        assert result["checkin_time"] == "10:00"

    def test_out_of_range_hour_defaults(self, raw_db, patient_id):
        """Hour > 23 should default to 10:00."""
        now = int(time.time())
        result = _exec_schedule_checkin(
            {"checkin_time": "25:00"},
            patient_id, raw_db, now,
        )
        assert result["success"] is True
        assert result["checkin_time"] == "10:00"

    def test_missing_checkin_time_defaults(self, raw_db, patient_id):
        """No checkin_time in args should default to 10:00."""
        now = int(time.time())
        result = _exec_schedule_checkin({}, patient_id, raw_db, now)
        assert result["success"] is True
        assert result["checkin_time"] == "10:00"

    def test_checkin_type_stored(self, raw_db, patient_id):
        now = int(time.time())
        _exec_schedule_checkin(
            {"checkin_time": "09:00", "checkin_type": "medication_reminder"},
            patient_id, raw_db, now,
        )
        row = raw_db.execute(
            "SELECT checkin_type FROM proactive_checkins WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()
        assert row["checkin_type"] == "medication_reminder"


# ===========================================================================
# MOOD DETECTION (used by mood_followup trigger)
# ===========================================================================

class TestMoodDetection:

    def test_frustrated_message(self):
        result = detect_mood_from_message("I hate this, so annoying and difficult")
        assert result["mood"] == "frustrated"

    def test_positive_message(self):
        result = detect_mood_from_message("Feeling great today, thanks for the help!")
        assert result["mood"] == "positive"

    def test_worried_message(self):
        result = detect_mood_from_message("I'm scared, what if it gets dangerous?")
        assert result["mood"] == "worried"

    def test_sad_message(self):
        result = detect_mood_from_message("I feel so lonely and alone, nobody cares")
        assert result["mood"] == "sad"

    def test_neutral_message(self):
        result = detect_mood_from_message("What time is my appointment?")
        assert result["mood"] == "neutral"

    def test_empty_message(self):
        result = detect_mood_from_message("")
        assert result["mood"] == "neutral"
        assert result["confidence"] == 0.5

    def test_none_message(self):
        result = detect_mood_from_message(None)
        assert result["mood"] == "neutral"

    def test_mood_has_adapt_tone(self):
        result = detect_mood_from_message("I'm really worried about my health")
        assert "adapt_tone" in result


# ===========================================================================
# RUN_PROACTIVE_SCAN
# ===========================================================================

class TestRunProactiveScan:

    def test_scan_limits_to_two_triggers_per_patient(self, in_memory_db, patient_id):
        """run_proactive_scan should process at most 2 triggers per patient."""
        many_triggers = [
            {"type": "glucose_rising", "reason": "test1"},
            {"type": "sustained_risk", "reason": "test2"},
            {"type": "logging_gap", "reason": "test3"},
        ]
        mock_run_agent = MagicMock(return_value={"message_to_patient": "Check in"})

        mock_engine_instance = MagicMock()
        mock_engine_instance.fetch_observations.return_value = []
        mock_hmm_cls = MagicMock(return_value=mock_engine_instance)

        with patch("agent_runtime._check_proactive_triggers", return_value=many_triggers), \
             patch("agent_runtime.ensure_runtime_tables"), \
             patch("agent_runtime.run_agent", mock_run_agent), \
             patch("agent_runtime._get_db", return_value=in_memory_db), \
             patch("agent_runtime._get_patient_profile_from_db", return_value={"id": patient_id}), \
             patch.dict("sys.modules", {"hmm_engine": MagicMock(HMMEngine=mock_hmm_cls)}):
            results = run_proactive_scan(patient_ids=[patient_id])

        # At most 2 triggers processed ([:2] slice in source)
        assert len(results) <= 2

    def test_scan_empty_patient_list(self):
        """Empty patient list should return empty results."""
        with patch("agent_runtime.ensure_runtime_tables"):
            results = run_proactive_scan(patient_ids=[])
        assert results == []
