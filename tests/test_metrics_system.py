"""
Comprehensive tests for the BEWO metrics system.

Covers:
  - compute_grounding_score(): patient-specific vs generic responses
  - compute_interaction_cost(): token-based cost estimation
  - log_interaction_metrics(): DB record creation and edge cases
  - agent_metrics table: schema creation via ensure_runtime_tables
  - Integration: run_agent populates grounding_score in metadata
"""

import pytest
import sqlite3
import os
import sys
import time
from unittest.mock import patch, MagicMock

# Path resolution
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, "core"))

try:
    from agent_runtime import (
        compute_grounding_score,
        compute_interaction_cost,
        log_interaction_metrics,
        ensure_runtime_tables,
        _ensure_runtime_tables_inner,
    )
except ImportError:
    from core.agent_runtime import (
        compute_grounding_score,
        compute_interaction_cost,
        log_interaction_metrics,
        ensure_runtime_tables,
        _ensure_runtime_tables_inner,
    )


class _NoCloseConnection:
    """Wrapper around sqlite3.Connection that makes close() a no-op.

    log_interaction_metrics calls conn.close() in a finally block.
    We need the connection to stay open so tests can inspect the data afterward.
    """

    def __init__(self, conn):
        self._conn = conn

    def close(self):
        pass  # no-op

    def __getattr__(self, name):
        return getattr(self._conn, name)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def raw_db():
    """Raw in-memory SQLite connection (closeable) with runtime tables."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    _ensure_runtime_tables_inner(conn)
    yield conn
    conn.close()


@pytest.fixture
def in_memory_db(raw_db):
    """No-close wrapper so log_interaction_metrics cannot close our test DB."""
    return _NoCloseConnection(raw_db)


@pytest.fixture
def patient_id():
    return "P-TEST-001"


# ---------------------------------------------------------------------------
# compute_grounding_score
# ---------------------------------------------------------------------------

class TestComputeGroundingScore:

    def test_empty_response_returns_zero(self, patient_id):
        assert compute_grounding_score("", patient_id) == 0.0

    def test_none_response_returns_zero(self, patient_id):
        assert compute_grounding_score(None, patient_id) == 0.0

    def test_patient_specific_response_scores_high(self, patient_id):
        response = (
            f"Patient {patient_id}, your glucose of 7.2 mmol is within range. "
            "Your Metformin dose is on track. Heart rate 72 bpm and 5432 steps today."
        )
        score = compute_grounding_score(response, patient_id)
        assert score >= 0.4, f"Patient-specific response should score >= 0.4, got {score}"

    def test_generic_response_scores_low(self, patient_id):
        response = (
            "In general, it is recommended that most people exercise regularly. "
            "Studies show that typically a balanced diet helps."
        )
        score = compute_grounding_score(response, patient_id)
        assert score <= 0.3, f"Generic advice should score <= 0.3, got {score}"

    def test_medication_names_boost_score(self, patient_id):
        with_meds = "Your Metformin and Atorvastatin are helping keep levels at 6.5 and 4.2."
        without_meds = "Your medications are helping keep levels stable."
        score_with = compute_grounding_score(with_meds, patient_id)
        score_without = compute_grounding_score(without_meds, patient_id)
        assert score_with > score_without, "Mentioning specific medication names should increase score"

    def test_glucose_values_boost_score(self, patient_id):
        with_glucose = "Your reading of 8.3 mmol shows a slight rise from 7.1 mmol yesterday."
        without_glucose = "Your blood sugar is a bit higher than before."
        score_with = compute_grounding_score(with_glucose, patient_id)
        score_without = compute_grounding_score(without_glucose, patient_id)
        assert score_with > score_without, "Referencing glucose values (mmol) should increase score"

    def test_numeric_references_boost_score(self, patient_id):
        with_nums = "Your heart rate was 72 bpm and you walked 4500 steps."
        without_nums = "Your heart rate and activity look fine."
        score_with = compute_grounding_score(with_nums, patient_id)
        score_without = compute_grounding_score(without_nums, patient_id)
        assert score_with > score_without, "Numeric data references should increase score"

    def test_score_bounded_zero_to_one(self, patient_id):
        response = (
            f"{patient_id} mmol mg/dL bpm heart rate HR steps HbA1c "
            "Metformin Lisinopril Atorvastatin Aspirin 7.2 8.3 120 65"
        )
        score = compute_grounding_score(response, patient_id)
        assert 0.0 <= score <= 1.0, f"Score must be [0,1], got {score}"

    def test_patient_id_in_response_increases_score(self, patient_id):
        with_id = f"Hello {patient_id}, here is your summary."
        without_id = "Hello, here is your summary."
        score_with = compute_grounding_score(with_id, patient_id)
        score_without = compute_grounding_score(without_id, patient_id)
        assert score_with >= score_without, "Including patient_id should not decrease score"

    def test_generic_penalty_reduces_score(self, patient_id):
        no_generic = "Your glucose reading of 6.8 mmol is within range at 72 bpm."
        with_generic = "In general, most people typically find that glucose of 6.8 mmol is fine at 72 bpm."
        score_clean = compute_grounding_score(no_generic, patient_id)
        score_penalized = compute_grounding_score(with_generic, patient_id)
        assert score_clean >= score_penalized, "Generic phrases should penalize score"

    def test_hba1c_reference(self, patient_id):
        response = "Your HbA1c of 6.2% shows excellent long-term control. Values 7.1 and 5.9."
        score = compute_grounding_score(response, patient_id)
        assert score > 0.0, "HbA1c reference should contribute to score"

    def test_steps_reference(self, patient_id):
        response = "You walked 8000 steps today, well above your 5000 target."
        score = compute_grounding_score(response, patient_id)
        assert score > 0.0, "'steps' keyword with numbers should contribute"


# ---------------------------------------------------------------------------
# compute_interaction_cost
# ---------------------------------------------------------------------------

class TestComputeInteractionCost:

    def test_zero_tokens(self):
        cost = compute_interaction_cost(0, 0)
        assert cost == 0.0

    def test_known_input_tokens(self):
        cost = compute_interaction_cost(1_000_000, 0)
        assert abs(cost - 1.25) < 1e-6

    def test_known_output_tokens(self):
        cost = compute_interaction_cost(0, 1_000_000)
        assert abs(cost - 5.00) < 1e-6

    def test_combined_tokens(self):
        cost = compute_interaction_cost(1_000_000, 1_000_000)
        assert abs(cost - 6.25) < 1e-6

    def test_small_token_count(self):
        expected = (1000 / 1_000_000) * 1.25 + (500 / 1_000_000) * 5.00
        cost = compute_interaction_cost(1000, 500)
        assert abs(cost - round(expected, 6)) < 1e-6

    def test_large_token_count(self):
        expected = (10_000_000 / 1_000_000) * 1.25 + (5_000_000 / 1_000_000) * 5.00
        cost = compute_interaction_cost(10_000_000, 5_000_000)
        assert abs(cost - round(expected, 6)) < 1e-6

    def test_cost_is_non_negative(self):
        cost = compute_interaction_cost(100, 200)
        assert cost >= 0.0

    def test_output_tokens_more_expensive(self):
        input_only = compute_interaction_cost(1000, 0)
        output_only = compute_interaction_cost(0, 1000)
        assert output_only > input_only, "Output tokens should be more expensive than input"

    def test_typical_interaction_cost(self):
        cost = compute_interaction_cost(2000, 800)
        assert cost < 0.01, "Typical interaction should cost well under 1 cent"

    def test_cost_precision(self):
        cost = compute_interaction_cost(1, 1)
        assert cost == round(cost, 6)


# ---------------------------------------------------------------------------
# log_interaction_metrics
# ---------------------------------------------------------------------------

class TestLogInteractionMetrics:

    def test_creates_db_record(self, in_memory_db, raw_db, patient_id):
        """log_interaction_metrics inserts a row into agent_metrics."""
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=2,
                max_turns=3,
                tool_trace=[{"result": {"success": True}}],
                latency_ms=150.5,
                input_tokens=1000,
                output_tokens=500,
                grounding_score=0.75,
                safety_verdict="SAFE",
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row is not None
        assert row["patient_id"] == patient_id
        assert row["success"] == 1
        assert row["turns_used"] == 2
        assert row["max_turns"] == 3
        assert row["tools_called"] == 1
        assert row["tools_succeeded"] == 1
        assert abs(row["latency_ms"] - 150.5) < 0.01
        assert row["input_tokens"] == 1000
        assert row["output_tokens"] == 500
        assert abs(row["grounding_score"] - 0.75) < 0.01
        assert row["safety_verdict"] == "SAFE"
        assert row["error_message"] is None

    def test_handles_empty_tool_trace(self, in_memory_db, raw_db, patient_id):
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=50.0,
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row is not None
        assert row["tools_called"] == 0
        assert row["tools_succeeded"] == 0

    def test_handles_failed_tools(self, in_memory_db, raw_db, patient_id):
        tool_trace = [
            {"result": {"success": True}},
            {"result": {"success": False}},
            {"result": {"success": False}},
        ]
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=2,
                max_turns=3,
                tool_trace=tool_trace,
                latency_ms=200.0,
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row["tools_called"] == 3
        assert row["tools_succeeded"] == 1

    def test_error_message_stored(self, in_memory_db, raw_db, patient_id):
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=False,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=0,
                error_message="Gemini API timeout",
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row["success"] == 0
        assert row["error_message"] == "Gemini API timeout"

    def test_default_values(self, in_memory_db, raw_db, patient_id):
        """Default grounding_score=0.0, safety_verdict='SAFE', tokens=0."""
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=100.0,
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row["input_tokens"] == 0
        assert row["output_tokens"] == 0
        assert row["grounding_score"] == 0.0
        assert row["safety_verdict"] == "SAFE"

    def test_timestamp_is_set(self, in_memory_db, raw_db, patient_id):
        before = int(time.time())
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=0,
            )
        after = int(time.time())
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert before <= row["timestamp_utc"] <= after

    def test_tool_trace_with_missing_result_key(self, in_memory_db, raw_db, patient_id):
        """Tool trace entries without 'result' key should not crash."""
        tool_trace = [{"tool": "book_appointment"}, {"result": {"success": True}}]
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=tool_trace,
                latency_ms=100.0,
            )
        row = raw_db.execute(
            "SELECT * FROM agent_metrics WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        assert row["tools_called"] == 2
        assert row["tools_succeeded"] == 1

    def test_multiple_records(self, in_memory_db, raw_db, patient_id):
        """Multiple calls create multiple rows."""
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            for i in range(5):
                log_interaction_metrics(
                    patient_id=patient_id,
                    success=True,
                    turns_used=i + 1,
                    max_turns=5,
                    tool_trace=[],
                    latency_ms=float(i * 10),
                )
        count = raw_db.execute(
            "SELECT COUNT(*) as cnt FROM agent_metrics WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()["cnt"]
        assert count == 5

    def test_db_error_does_not_raise(self, patient_id):
        """If DB write fails, log_interaction_metrics should log a warning, not raise."""
        mock_conn = MagicMock()
        mock_conn.execute.side_effect = sqlite3.OperationalError("disk full")
        with patch("agent_runtime._get_db", return_value=mock_conn):
            # Should not raise
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=0,
            )


# ---------------------------------------------------------------------------
# agent_metrics table schema
# ---------------------------------------------------------------------------

class TestAgentMetricsSchema:

    def test_table_created_by_ensure_runtime_tables(self, raw_db):
        tables = raw_db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_metrics'"
        ).fetchone()
        assert tables is not None

    def test_schema_has_expected_columns(self, raw_db):
        cols = raw_db.execute("PRAGMA table_info(agent_metrics)").fetchall()
        col_names = {c["name"] for c in cols}
        expected = {
            "id", "patient_id", "timestamp_utc", "success", "turns_used",
            "max_turns", "tools_called", "tools_succeeded", "latency_ms",
            "input_tokens", "output_tokens", "grounding_score",
            "safety_verdict", "error_message",
        }
        assert expected.issubset(col_names), f"Missing columns: {expected - col_names}"

    def test_patient_id_not_null(self, raw_db):
        with pytest.raises(sqlite3.IntegrityError):
            raw_db.execute("""
                INSERT INTO agent_metrics (timestamp_utc) VALUES (123)
            """)

    def test_timestamp_not_null(self, raw_db):
        with pytest.raises(sqlite3.IntegrityError):
            raw_db.execute("""
                INSERT INTO agent_metrics (patient_id) VALUES ('P001')
            """)

    def test_idempotent_table_creation(self, raw_db):
        _ensure_runtime_tables_inner(raw_db)
        _ensure_runtime_tables_inner(raw_db)
        tables = raw_db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_metrics'"
        ).fetchone()
        assert tables is not None

    def test_proactive_checkins_table_created(self, raw_db):
        tables = raw_db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='proactive_checkins'"
        ).fetchone()
        assert tables is not None

    def test_conversation_history_table_created(self, raw_db):
        tables = raw_db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='conversation_history'"
        ).fetchone()
        assert tables is not None


# ---------------------------------------------------------------------------
# Integration: run_agent populates grounding_score
# ---------------------------------------------------------------------------

class TestMetricsIntegration:

    def test_compute_grounding_then_log(self, in_memory_db, raw_db, patient_id):
        """Simulate the run_agent flow: compute score, then log it."""
        response_text = (
            f"Good morning {patient_id}! Your glucose reading of 7.8 mmol "
            "is slightly above target. Your Metformin is working — HbA1c 6.5%. "
            "Heart rate 68 bpm, 3200 steps so far."
        )
        score = compute_grounding_score(response_text, patient_id)
        assert score > 0.3, f"Grounded response should score above 0.3, got {score}"

        cost = compute_interaction_cost(2000, 800)
        assert cost > 0.0

        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=2,
                max_turns=3,
                tool_trace=[{"result": {"success": True}}],
                latency_ms=1200.0,
                input_tokens=2000,
                output_tokens=800,
                grounding_score=score,
                safety_verdict="SAFE",
            )

        row = raw_db.execute(
            "SELECT grounding_score, input_tokens, output_tokens FROM agent_metrics WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()
        assert row is not None
        assert abs(row["grounding_score"] - score) < 0.001
        assert row["input_tokens"] == 2000
        assert row["output_tokens"] == 800

    def test_cost_matches_logged_tokens(self, in_memory_db, raw_db, patient_id):
        """Cost computed from logged tokens should match compute_interaction_cost."""
        in_tok, out_tok = 5000, 2000
        expected_cost = compute_interaction_cost(in_tok, out_tok)

        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=500.0,
                input_tokens=in_tok,
                output_tokens=out_tok,
            )

        row = raw_db.execute(
            "SELECT input_tokens, output_tokens FROM agent_metrics WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()
        recomputed = compute_interaction_cost(row["input_tokens"], row["output_tokens"])
        assert abs(recomputed - expected_cost) < 1e-6

    def test_safety_verdict_persisted(self, in_memory_db, raw_db, patient_id):
        with patch("agent_runtime._get_db", return_value=in_memory_db):
            log_interaction_metrics(
                patient_id=patient_id,
                success=True,
                turns_used=1,
                max_turns=3,
                tool_trace=[],
                latency_ms=100.0,
                safety_verdict="CAUTION",
            )
        row = raw_db.execute(
            "SELECT safety_verdict FROM agent_metrics WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()
        assert row["safety_verdict"] == "CAUTION"
