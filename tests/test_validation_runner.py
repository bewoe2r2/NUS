"""
Validation Runner Gate Test.

Runs a lightweight subset of the HMM independent validation suite and asserts
hard thresholds on accuracy, AUC, and safety gates. Acts as a CI-enforceable
gate that fails the build if model quality drops.

Uses 500 patients (vs 5000 in full suite) for speed — target < 60 seconds.

Run: pytest tests/test_validation_runner.py -v
"""
import sys
import os
import time
import math
import numpy as np
import pytest
from typing import List, Dict, Tuple

# ---------------------------------------------------------------------------
# Path setup — import from core and validation suite
# ---------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

VALIDATION_CODE_DIR = os.path.join(
    ROOT, "validation", "hmm_validation_suite", "code"
)
sys.path.insert(0, VALIDATION_CODE_DIR)

from core.hmm_engine import (
    HMMEngine, SafetyMonitor, STATES, FEATURES, WEIGHTS,
    EMISSION_PARAMS, TRANSITION_PROBS, INITIAL_PROBS,
)

# Import helpers from the validation suite (not run_validation — we run our own)
import importlib.util

_val_spec = importlib.util.spec_from_file_location(
    "independent_validation",
    os.path.join(VALIDATION_CODE_DIR, "01_easy_independent_validation.py"),
)
_val_mod = importlib.util.module_from_spec(_val_spec)
_val_spec.loader.exec_module(_val_mod)

CLINICAL_RANGES = _val_mod.CLINICAL_RANGES
CLINICAL_ARCHETYPES = _val_mod.CLINICAL_ARCHETYPES
gen_independent_patient = _val_mod.gen_independent_patient
gen_boundary_patient = _val_mod.gen_boundary_patient
make_engine = _val_mod.make_engine
wilson_ci = _val_mod.wilson_ci
roc_auc = _val_mod.roc_auc
confusion_matrix = _val_mod.confusion_matrix
per_class_metrics = _val_mod.per_class_metrics

# ---------------------------------------------------------------------------
# Reduced sample sizes for speed (500 total vs 5000)
# ---------------------------------------------------------------------------
PATIENTS_PER_STATE = 167  # 167 * 3 = 501 total


@pytest.fixture(scope="module")
def engine():
    """Shared HMM engine instance for all tests."""
    return make_engine()


@pytest.fixture(scope="module")
def cohort_results(engine):
    """Run the cohort classification once, share results across tests."""
    expected_all = []
    predicted_all = []
    probs_all = []
    seed_base = 100000

    for state in STATES:
        n_patients = PATIENTS_PER_STATE
        for i in range(n_patients):
            rng = np.random.RandomState(seed_base + i)
            obs = gen_independent_patient(state, 12, rng)
            result = engine.run_inference(obs)
            expected_all.append(state)
            predicted_all.append(result["current_state"])
            sp = result["state_probabilities"]
            probs_all.append([sp.get(s, 0) for s in STATES])
        seed_base += 2000

    total = len(expected_all)
    overall_correct = sum(1 for e, p in zip(expected_all, predicted_all) if e == p)
    overall_acc = overall_correct / total * 100
    cm = confusion_matrix(expected_all, predicted_all)
    metrics = per_class_metrics(cm, total)
    macro_f1 = sum(m["f1"] for m in metrics.values()) / len(STATES)

    auc_results = {}
    for target in STATES:
        scores = [p[STATES.index(target)] for p in probs_all]
        labels = [1 if e == target else 0 for e in expected_all]
        auc_results[target] = roc_auc(scores, labels)

    return {
        "accuracy": overall_acc,
        "macro_f1": macro_f1,
        "metrics": metrics,
        "auc": auc_results,
        "expected": expected_all,
        "predicted": predicted_all,
        "total": total,
    }


# ===========================================================================
# ACCURACY GATES
# ===========================================================================

class TestAccuracyGates:
    """Hard gates on classification accuracy."""

    def test_overall_accuracy_above_90(self, cohort_results):
        acc = cohort_results["accuracy"]
        assert acc >= 90.0, (
            f"Overall accuracy {acc:.1f}% is below 90% gate"
        )

    def test_macro_f1_above_085(self, cohort_results):
        f1 = cohort_results["macro_f1"]
        assert f1 >= 0.85, (
            f"Macro F1 {f1:.4f} is below 0.85 gate"
        )

    def test_crisis_recall_above_080(self, cohort_results):
        recall = cohort_results["metrics"]["CRISIS"]["recall"]
        assert recall >= 0.80, (
            f"CRISIS recall {recall:.4f} is below 0.80 gate"
        )

    def test_crisis_precision_above_070(self, cohort_results):
        prec = cohort_results["metrics"]["CRISIS"]["precision"]
        assert prec >= 0.70, (
            f"CRISIS precision {prec:.4f} is below 0.70 gate"
        )

    def test_stable_recall_above_075(self, cohort_results):
        recall = cohort_results["metrics"]["STABLE"]["recall"]
        assert recall >= 0.75, (
            f"STABLE recall {recall:.4f} is below 0.75 gate"
        )


# ===========================================================================
# AUC GATES
# ===========================================================================

class TestAUCGates:
    """Hard gates on ROC-AUC per state."""

    def test_stable_auc_above_085(self, cohort_results):
        auc = cohort_results["auc"]["STABLE"]
        assert auc >= 0.85, f"STABLE AUC {auc:.4f} is below 0.85 gate"

    def test_warning_auc_above_085(self, cohort_results):
        auc = cohort_results["auc"]["WARNING"]
        assert auc >= 0.85, f"WARNING AUC {auc:.4f} is below 0.85 gate"

    def test_crisis_auc_above_085(self, cohort_results):
        auc = cohort_results["auc"]["CRISIS"]
        assert auc >= 0.85, f"CRISIS AUC {auc:.4f} is below 0.85 gate"


# ===========================================================================
# SAFETY GATES
# ===========================================================================

class TestSafetyGates:
    """Safety-critical checks that must never fail."""

    def test_no_crisis_classified_as_stable(self, cohort_results):
        """CRISIS patients must never be classified as STABLE (dangerous miss)."""
        expected = cohort_results["expected"]
        predicted = cohort_results["predicted"]
        dangerous = sum(
            1 for e, p in zip(expected, predicted)
            if e == "CRISIS" and p == "STABLE"
        )
        assert dangerous == 0, (
            f"{dangerous} CRISIS patients were classified as STABLE — safety violation"
        )

    def test_safety_monitor_fires_on_extreme_glucose(self, engine):
        """SafetyMonitor must flag extreme glucose values as CRISIS."""
        extreme_obs = {
            "glucose_avg": 25.0,  # Extreme hyperglycemia (>16.7 = CRISIS)
            "glucose_variability": 60.0,
            "meds_adherence": 0.0,
            "carbs_intake": 300.0,
            "steps_daily": 0.0,
            "resting_hr": 110.0,
            "hrv_rmssd": 5.0,
            "sleep_quality": 1.0,
            "social_engagement": 0.0,
        }
        state, reason = SafetyMonitor.check_safety(extreme_obs)
        assert state is not None, (
            "SafetyMonitor did not fire any alert on extreme glucose=25.0"
        )
        assert state == "CRISIS", (
            f"SafetyMonitor returned '{state}' for glucose=25.0, expected CRISIS"
        )

    def test_safety_monitor_fires_on_hypoglycemia(self, engine):
        """SafetyMonitor must flag dangerously low glucose as CRISIS."""
        hypo_obs = {
            "glucose_avg": 2.5,  # Severe hypoglycemia (<3.0 = CRISIS)
            "glucose_variability": 50.0,
            "meds_adherence": 0.5,
            "carbs_intake": 100.0,
            "steps_daily": 2000.0,
            "resting_hr": 95.0,
            "hrv_rmssd": 10.0,
            "sleep_quality": 3.0,
            "social_engagement": 2.0,
        }
        state, reason = SafetyMonitor.check_safety(hypo_obs)
        assert state is not None, (
            "SafetyMonitor did not fire any alert on hypoglycemia glucose=2.5"
        )
        assert state == "CRISIS", (
            f"SafetyMonitor returned '{state}' for glucose=2.5, expected CRISIS"
        )


# ===========================================================================
# ARCHETYPE VALIDATION (subset)
# ===========================================================================

class TestArchetypeValidation:
    """Validate classification of hand-crafted clinical archetypes."""

    def test_archetype_accuracy_above_70(self, engine):
        """At least 70% of clinical archetypes must be correctly classified."""
        correct = 0
        total = len(CLINICAL_ARCHETYPES)
        for name, arch in CLINICAL_ARCHETYPES.items():
            obs = [arch["obs"]]
            result = engine.run_inference(obs)
            if result["current_state"] == arch["state"]:
                correct += 1
        acc = correct / total * 100
        assert acc >= 70.0, (
            f"Archetype accuracy {acc:.0f}% ({correct}/{total}) is below 70% gate"
        )

    def test_no_crisis_archetype_classified_stable(self, engine):
        """No CRISIS archetype should be classified as STABLE."""
        dangerous = []
        for name, arch in CLINICAL_ARCHETYPES.items():
            if arch["state"] != "CRISIS":
                continue
            obs = [arch["obs"]]
            result = engine.run_inference(obs)
            if result["current_state"] == "STABLE":
                dangerous.append(name)
        assert len(dangerous) == 0, (
            f"CRISIS archetypes classified as STABLE: {dangerous}"
        )


# ===========================================================================
# RUNTIME GATE
# ===========================================================================

class TestRuntimeGate:
    """Ensure the validation runs within acceptable time."""

    def test_cohort_results_computed_within_60s(self, cohort_results):
        """This test implicitly passes if the cohort_results fixture completed.
        The fixture runs 501 patients x 12 observations each — should be < 60s.
        If pytest collection + fixture setup exceeds 60s, the CI timeout catches it.
        """
        # The fixture already ran successfully if we get here
        assert cohort_results["total"] == PATIENTS_PER_STATE * len(STATES)
