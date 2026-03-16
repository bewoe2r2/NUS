"""Shared fixtures for HMM exhaustive tests."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import pytest
import math
import random
import numpy as np
from core.hmm_engine import (
    HMMEngine, SafetyMonitor, STATES, FEATURES, WEIGHTS,
    EMISSION_PARAMS, TRANSITION_PROBS, INITIAL_PROBS,
    LOG_TRANSITIONS, LOG_INITIAL,
    safe_log, gaussian_log_pdf, gaussian_pdf
)

@pytest.fixture
def engine():
    """Fresh HMM engine instance (no DB dependency)."""
    e = HMMEngine.__new__(HMMEngine)
    e.features = FEATURES
    e.weights = WEIGHTS
    e.emission_params = EMISSION_PARAMS
    e.safety_monitor = SafetyMonitor()
    e._personalized_baselines = {}
    e.MIN_CALIBRATION_OBS = 42
    return e

@pytest.fixture
def stable_obs():
    """A single clearly-STABLE observation."""
    return {
        'glucose_avg': 5.8,
        'glucose_variability': 20.0,
        'meds_adherence': 0.95,
        'carbs_intake': 150.0,
        'steps_daily': 6000.0,
        'resting_hr': 68.0,
        'hrv_rmssd': 40.0,
        'sleep_quality': 8.0,
        'social_engagement': 12.0
    }

@pytest.fixture
def warning_obs():
    """A single clearly-WARNING observation."""
    return {
        'glucose_avg': 11.5,
        'glucose_variability': 38.0,
        'meds_adherence': 0.60,
        'carbs_intake': 230.0,
        'steps_daily': 3000.0,
        'resting_hr': 82.0,
        'hrv_rmssd': 18.0,
        'sleep_quality': 5.0,
        'social_engagement': 5.0
    }

@pytest.fixture
def crisis_obs():
    """A single clearly-CRISIS observation."""
    return {
        'glucose_avg': 20.0,
        'glucose_variability': 55.0,
        'meds_adherence': 0.20,
        'carbs_intake': 320.0,
        'steps_daily': 500.0,
        'resting_hr': 100.0,
        'hrv_rmssd': 8.0,
        'sleep_quality': 2.0,
        'social_engagement': 1.0
    }
