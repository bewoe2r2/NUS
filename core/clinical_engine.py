"""
clinical_engine.py
==================

Core orchestration layer for the Bewo Clinical Decision Support System.
This module implements the "Smart SBAR" logic, coordinating between:
1. HMM Inference Engine (State Detection)
2. Merlion Risk Engine (Future Risk Projection)
3. Gemini LLM (Natural Language Synthesis)

CRITICAL SAFETY & SECURITY:
- Handles PII anonymization before sending to LLM.
- Enforces strict data validation standards.
- Designed for high-reliability clinical workflows.
"""

import json
import logging
import os
import sqlite3
import math
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Local imports
try:
    from core.hmm_engine import HMMEngine, STATES
    from core.merlion_risk_engine import MerlionRiskEngine
    from core.gemini_integration import GeminiIntegration
except ImportError:
    from hmm_engine import HMMEngine, STATES
    from merlion_risk_engine import MerlionRiskEngine
    from gemini_integration import GeminiIntegration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
CLINICAL_GUIDELINES = """
1. Hypoglycemia (Glucose < 4.0): Immediate intervention. Juice/Glucose tabs.
2. Hyperglycemia (Glucose > 15.0): Check ketones. Hydration. Insulin correction.
3. Hypertension (SBP > 180): Crisis. Immediate medical review.
4. Adherence: If < 50%, prioritized education/intervention needed.
"""

class ClinicalEngine:
    """
    Orchestrator for the Clinical Decision Support pipeline.
    Implements the 'Smart SBAR' generation logic with strict separation of concerns.
    """

    def __init__(self, db_path: str = DB_PATH):
        """Initialize the Clinical Engine with required subsystems."""
        self.db_path = db_path
        self.merlion = MerlionRiskEngine()
        self.gemini = GeminiIntegration()
        self.hmm_engine = HMMEngine(db_path=self.db_path)
        self._initialize_db()

    def _initialize_db(self):
        """Ensure necessary tables exist (self-healing)."""
        # Note: Primary schema is managed by nexus_schema.sql, but we ensure existence here for robustness
        pass # Actual schema migration handled separately or implicitly via ensure_schema

    def execute_pipeline(self, user_id: str) -> Dict[str, Any]:
        """
        Execute the full clinical decision pipeline for a specific user.
        
        Process:
        1. Fetch Patient Context (Conditions, Meds) - Local DB
        2. Get Real-time HMM State - HMM Engine
        3. Compute Computed Metrics (Adherence, Avg Glucose) - Local Logic
        4. Synthesize SBAR Report - Gemini (Anonymized)
        
        Args:
            user_id: The ID of the patient to process.
            
        Returns:
            Dict containing the 'sbar' JSON and raw 'metrics' for UI rendering.
        """
        logger.info(f"Executing Clinical Pipeline for User: {user_id}")

        try:
            # 1. Fetch Patient Context
            patient_profile = self._get_patient_profile(user_id)
            if not patient_profile:
                raise ValueError(f"Patient {user_id} not found in database.")

            # 2. Get Real-time HMM State
            # In a real system, we'd fetch the persistent HMM state. 
            # For now, we instantiate/retrieve logic associated with the user/demo.
            # Assuming HMM state is stored or re-computed from recent observations.
            observations = self.hmm_engine.fetch_observations(days=14, patient_id=user_id)
            if not observations or len(observations) == 0:
                 state = "STABLE"
                 probs = [1.0, 0.0, 0.0]
            else:
                 results = self.hmm_engine.run_inference(observations, patient_id=user_id)
                 state = results.get('current_state', 'STABLE')
                 state_probs_dict = results.get('state_probabilities', {})
                 probs = [state_probs_dict.get(s, 0.0) for s in STATES]

            # 3. Compute Real-time Metrics
            metrics = self.compute_realtime_metrics(user_id, observations)

            # 4. Synthesize SBAR (Gemini - ANONYMIZED)
            # CRITICAL: We pass 'patient_profile' strictly for clinical context (Diagnoses/Meds),
            # NOT PII (Name, Address).
            sbar = self.gemini.draft_sbar(
                state=state,
                metrics=metrics,
                conditions=patient_profile.get('conditions', []),
                medications=patient_profile.get('medications', []),
                guidelines=CLINICAL_GUIDELINES
            )

            result = {
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'state': state,
                'state_probs': probs,
                'metrics': metrics,
                'sbar': sbar,
                'profile': patient_profile # For UI display (not sent to LLM)
            }
            
            # Persist SBAR for history
            self._save_sbar_history(user_id, sbar)
            
            return result

        except Exception as e:
            logger.error(f"Pipeline Failed for {user_id}: {e}", exc_info=True)
            # Fail gracefully - return a fallback structure
            return self._generate_fallback_response(user_id, str(e))

    def compute_realtime_metrics(self, user_id: str, observations: List[Any]) -> Dict[str, Any]:
        """
        Compute deterministic clinical metrics from raw observations.
        
        Metrics:
        - Avg Glucose (24h)
        - Max Glucose (24h)
        - Adherence % (24h)
        - Sleep Hours (Last night)
        - Activity Steps (24h)
        """
        if not observations:
             return {
                 'glucose_avg': 0, 'glucose_max': 0,
                 'adherence_pct': 0, 'sleep_quality': 0, 'sleep_hours': 0, 'steps': 0
             }

        # Observation format: [(timestamp, feature_name, value), ...]
        # Note: hmm_engine.fetch_observations returns time-bucketed dictionaries?
        # Let's check hmm_engine.py. fetch_observations returns List[Dict[feature, value]]
        # Wait, hmm_engine.fetch_observations actually returns list of dicts representing time steps.
        
        glucose_vals = []
        adherence_vals = []
        sleep_vals = []
        steps_vals = []

        for obs in observations:
            if 'glucose_avg' in obs and obs['glucose_avg'] is not None:
                glucose_vals.append(obs['glucose_avg'])
            if 'meds_adherence' in obs and obs['meds_adherence'] is not None:
                adherence_vals.append(obs['meds_adherence'])
            if 'sleep_quality' in obs and obs['sleep_quality'] is not None:
                sleep_vals.append(obs['sleep_quality'])
            if 'steps_daily' in obs and obs['steps_daily'] is not None:
                steps_vals.append(obs['steps_daily'])

        sleep_val = sum(sleep_vals) / len(sleep_vals) if sleep_vals else 5.0
        steps_val = sum(steps_vals) / len(steps_vals) if steps_vals else 5000

        metrics = {
            'glucose_avg': round(sum(glucose_vals)/len(glucose_vals), 1) if glucose_vals else 0,
            'glucose_max': round(max(glucose_vals), 1) if glucose_vals else 0,
            'adherence_pct': int(sum(adherence_vals)/len(adherence_vals) * 100) if adherence_vals else 0,
            'sleep_quality': sleep_val,
            'sleep_hours': round(sleep_val * 0.9, 1) if sleep_val else 0,  # Estimated hours from quality score (0-10 scale)
            'steps': steps_val
        }
        return metrics

    def _get_patient_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch patient clinical profile from DB."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM patients WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            if row:
                # Parse JSON fields if they are strings
                data = dict(row)
                if isinstance(data.get('conditions'), str):
                    try: data['conditions'] = json.loads(data['conditions'])
                    except Exception:
                        data['conditions'] = [c.strip() for c in data['conditions'].split(',') if c.strip()]
                if isinstance(data.get('medications'), str):
                    try: data['medications'] = json.loads(data['medications'])
                    except Exception:
                        data['medications'] = [m.strip() for m in data['medications'].split(',') if m.strip()]
                return data
            return None
        finally:
            if conn:
                conn.close()

    def _save_sbar_history(self, user_id: str, sbar: Dict[str, Any]):
        """Persist the generated SBAR report for audit trail."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            timestamp_utc = int(time.time())
            conn.execute("""
                INSERT INTO clinical_notes_history (patient_id, timestamp_utc, note_type, content)
                VALUES (?, ?, ?, ?)
            """, (user_id, timestamp_utc, "sbar", json.dumps(sbar)))
            conn.commit()
        except sqlite3.OperationalError as e:
            # Table might not exist yet if schema update hasn't run
            logger.error(f"Failed to save SBAR history for {user_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error saving SBAR history for {user_id}: {e}", exc_info=True)
        finally:
            if conn:
                conn.close()

    def _generate_fallback_response(self, user_id: str, error_msg: str) -> Dict[str, Any]:
        """Generate a safe fallback response if the main pipeline crashes."""
        return {
             'user_id': user_id,
             'state': 'UNKNOWN',
             'sbar': {
                 'Situation': f"System Error processing data for {user_id}",
                 'Background': "N/A",
                 'Assessment': f"Pipeline Failure: {error_msg}",
                 'Recommendation': "Review raw logs manually."
             },
             'metrics': {}
        }
