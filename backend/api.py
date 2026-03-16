"""
Bewo 2026 - COMPLETE PATIENT API
file: backend/api.py
version: 4.0.0

Full API for Healthcare HMM Engine with ALL features:
- Patient state & history
- AI Chat (Agentic Gemini)
- Glucose logging (manual + photo OCR)
- Medication tracking
- Voucher system
- Voice check-ins
- Reminders
- Nurse dashboard
"""

import sys
import os
import sqlite3
import logging
import time
import json
import math
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

# Ensure we can import from core directory
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core"))

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools"))

try:
    from hmm_engine import HMMEngine, TRANSITION_PROBS, EMISSION_PARAMS, WEIGHTS, gaussian_pdf, safe_log, STATES, LOG_TRANSITIONS, INITIAL_PROBS
    from gemini_integration import GeminiIntegration
    from voucher_system import VoucherSystem
    from agent_runtime import (run_agent, ensure_runtime_tables, build_full_hmm_context,
                                get_patient_streaks, get_optimal_nudge_times,
                                generate_weekly_report, detect_mood_from_message,
                                calculate_engagement_score, generate_daily_challenge,
                                detect_caregiver_fatigue, generate_glucose_narrative,
                                compute_impact_metrics, _exec_clinician_summary,
                                _get_merlion_forecast, check_drug_interactions,
                                classify_response_safety, compute_tool_effectiveness_scores,
                                run_proactive_scan, _check_proactive_triggers,
                                process_caregiver_response, compute_caregiver_burden_score,
                                generate_nurse_triage, compute_attention_score,
                                _load_agent_memory, _consolidate_memories,
                                _get_patient_profile_from_db)
except ImportError as e:
    logging.error(f"Failed to import modules: {e}")

# --- CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("BewoAPI")

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

@asynccontextmanager
async def lifespan(app):
    startup_event()
    yield

app = FastAPI(
    title="Bewo Health API",
    description="Complete Backend for Bewo Healthcare Companion",
    version="4.0.0",
    lifespan=lifespan,
)

# --- CORS (locked to known origins only) ---
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:3002").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)

# --- API Key Authentication ---
API_KEY = os.getenv("BEWO_API_KEY", "bewo-dev-key-2026")  # Override in production via env var
if API_KEY == "bewo-dev-key-2026":
    logging.getLogger("BewoAPI").warning("SECURITY: Using default API key. Set BEWO_API_KEY env var in production.")
ADMIN_KEY = os.getenv("BEWO_ADMIN_KEY", API_KEY)  # Separate admin key; defaults to API_KEY for dev
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key for protected endpoints. Returns True for valid keys."""
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return api_key

# Public endpoints that don't need auth (health check, docs)
PUBLIC_PATHS = {"/", "/docs", "/openapi.json", "/redoc", "/health"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# --- Rate Limiting (in-memory, per-IP) ---
_rate_limit_store: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 60  # requests per window (per IP)
RATE_LIMIT_CHAT_MAX = 30  # stricter limit for /chat (Gemini calls cost money)

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Combined auth + rate limiting middleware. Runs on every request."""
    from starlette.responses import JSONResponse
    path = request.url.path

    # 1. Skip auth for CORS preflight and public paths
    if request.method == "OPTIONS" or path in PUBLIC_PATHS:
        return await call_next(request)

    api_key = request.headers.get("X-API-Key", "")
    if api_key != API_KEY:
        return JSONResponse(status_code=403, content={"detail": "Invalid or missing API key. Set X-API-Key header."})

    # 2. Rate limiting per client IP
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    if client_ip in _rate_limit_store:
        _rate_limit_store[client_ip] = [t for t in _rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW]
    else:
        _rate_limit_store[client_ip] = []

    max_req = RATE_LIMIT_CHAT_MAX if "/chat" in path else RATE_LIMIT_MAX
    if len(_rate_limit_store[client_ip]) >= max_req:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again later."})

    _rate_limit_store[client_ip].append(now)
    response = await call_next(request)
    return response

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class Biometrics(BaseModel):
    glucose: float = Field(..., description="Average glucose in mmol/L")
    glucose_variability: Optional[float] = None
    steps: int = Field(..., description="Daily steps count")
    hr: int = Field(..., description="Resting heart rate in bpm")
    hrv: Optional[float] = None
    sleep_quality: Optional[float] = None

class SurvivalPoint(BaseModel):
    hours: float
    survival_prob: float

class PatientStateResponse(BaseModel):
    patient_id: str
    current_state: str
    confidence: float = 0.5
    risk_score: float
    risk_48h: Optional[float] = None
    biometrics: Biometrics
    top_factors: Optional[List[dict]] = None
    last_updated: str
    message: Optional[str] = None
    trend: Optional[str] = None
    survival_curve: Optional[List[SurvivalPoint]] = None
    transition_matrix: Optional[List[List[float]]] = None


class HistoryPoint(BaseModel):
    timestamp: str
    glucose: Optional[float]
    steps: Optional[int]
    state: Optional[str] = None
    risk: Optional[float] = None

class PatientHistoryResponse(BaseModel):
    patient_id: str
    history: List[HistoryPoint]

class ChatRequest(BaseModel):
    message: str
    patient_id: str = "P001"

class ChatResponse(BaseModel):
    message: str
    tone: Optional[str] = None
    actions: Optional[List[dict]] = None
    priority_factor: Optional[str] = None
    hmm_state: Optional[str] = None

class FoodInput(BaseModel):
    description: str
    carbs_grams: float = 0
    meal_type: str = "snack"  # breakfast, lunch, dinner, snack
    patient_id: str = "P001"

class GlucoseInput(BaseModel):
    value: float = Field(..., gt=0, le=50.0)
    unit: str = "mmol/L"
    source: str = "MANUAL"
    patient_id: str = "P001"

class GlucoseOCRResponse(BaseModel):
    success: bool
    value: Optional[float] = None
    unit: Optional[str] = None
    confidence: Optional[float] = None
    error: Optional[str] = None

class MedicationLog(BaseModel):
    medication_name: str
    taken: bool
    patient_id: str = "P001"

class VoucherResponse(BaseModel):
    current_value: float
    max_value: float
    days_until_redemption: int
    can_redeem: bool
    streak_days: int = 0
    deductions_today: List[dict] = []

class CaregiverResponseInput(BaseModel):
    caregiver_id: str = ""
    response_type: str = "acknowledged"
    message: str = ""

class CounterfactualInput(BaseModel):
    intervention: str = "take_medication"
    medication: str = "Metformin"
    dose: str = "500mg"
    carb_reduction: int = 30
    additional_steps: int = 3000

class MoodDetectInput(BaseModel):
    message: str = ""

class DrugInteractionCheckInput(BaseModel):
    proposed_medication: str = ""

class VoiceCheckInRequest(BaseModel):
    transcript: str
    patient_id: str = "P001"

class VoiceCheckInResponse(BaseModel):
    sentiment_score: float
    urgency: str
    health_keywords: List[str]
    ai_response: Optional[str] = None

class ReminderResponse(BaseModel):
    id: int
    reminder_type: str
    message: str
    time: str
    status: str

class NurseAlert(BaseModel):
    id: int
    patient_id: str
    priority: str
    reason: str
    timestamp: str
    status: str

# =============================================================================
# DEPENDENCIES
# =============================================================================

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

_cached_engine = None
_cached_gemini = None

def get_engine():
    """Get HMM Engine instance (cached singleton)"""
    global _cached_engine
    if _cached_engine is not None:
        return _cached_engine
    try:
        _cached_engine = HMMEngine()
        return _cached_engine
    except Exception as e:
        logger.error(f"Engine init failed: {e}")
        raise HTTPException(status_code=500, detail="HMM Engine unavailable")

def get_gemini():
    """Get Gemini Integration instance (cached singleton)"""
    global _cached_gemini
    if _cached_gemini is not None:
        return _cached_gemini
    try:
        gi = GeminiIntegration()
        _cached_gemini = gi
        return _cached_gemini
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return None

def get_voucher_system(user_id: str = 'demo_user'):
    """Get Voucher System instance"""
    try:
        return VoucherSystem(user_id=user_id)
    except Exception as e:
        logger.error(f"Voucher system init failed: {e}")
        return None

# =============================================================================
# CORE ENDPOINTS
# =============================================================================

@app.get("/")
def root_health_check():
    """Root health check endpoint"""
    return {"status": "ok", "system": "Bewo Health API v2.0"}

@app.get("/patient/{patient_id}/state", response_model=PatientStateResponse)
async def get_patient_state(patient_id: str):
    """Get current patient health state from HMM"""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=7, patient_id=patient_id)

        if not observations:
            return PatientStateResponse(
                patient_id=patient_id,
                current_state="STABLE",
                confidence=0.5,
                risk_score=0.1,
                biometrics=Biometrics(glucose=5.5, steps=0, hr=70),
                last_updated=datetime.now().isoformat(),
                message="No recent data. Please log your glucose."
            )

        # Run HMM inference
        result = engine.run_inference(observations, patient_id=patient_id)
        latest_obs = observations[-1]

        # Extract values safely
        glucose = latest_obs.get('glucose_avg') or 5.5
        steps = latest_obs.get('steps_daily') or 0
        hr = latest_obs.get('resting_hr') or 70

        curr_state = result.get('current_state', 'STABLE')
        confidence = result.get('confidence', 0.5)
        risk_48h = result.get('predictions', {}).get('risk_48h', 0.0)

        # Calculate display risk
        risk = risk_48h
        if curr_state == 'CRISIS':
            risk = max(risk, 0.85)
        elif curr_state == 'WARNING':
            risk = max(risk, 0.45)

        # Get trend
        trend = "STABLE"
        path_states = result.get('path_states', [])
        if len(path_states) >= 6:
            state_values = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}
            first_avg = sum(state_values.get(s, 0) for s in path_states[:len(path_states)//2]) / (len(path_states)//2)
            second_half = path_states[len(path_states)//2:]
            second_avg = sum(state_values.get(s, 0) for s in second_half) / len(second_half)
            if second_avg < first_avg - 0.3:
                trend = "IMPROVING"
            elif second_avg > first_avg + 0.3:
                trend = "DECLINING"

        # Get forecast data
        forecast = engine.predict_time_to_crisis(latest_obs, horizon_hours=48)
        survival_curve = [SurvivalPoint(hours=p['hours'], survival_prob=p['survival_prob']) for p in forecast.get('survival_curve', [])]

        return PatientStateResponse(
            patient_id=patient_id,
            current_state=curr_state,
            confidence=confidence,
            risk_score=risk,
            risk_48h=risk_48h,
            biometrics=Biometrics(
                glucose=float(glucose),
                glucose_variability=latest_obs.get('glucose_variability'),
                steps=int(steps),
                hr=int(hr),
                hrv=latest_obs.get('hrv_rmssd'),
                sleep_quality=latest_obs.get('sleep_quality')
            ),
            top_factors=result.get('top_factors', [])[:5],
            last_updated=datetime.now().isoformat(),
            trend=trend,
            survival_curve=survival_curve,
            transition_matrix=TRANSITION_PROBS
        )

    except Exception as e:
        logger.exception(f"Error getting state for {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

@app.get("/patient/{patient_id}/history", response_model=PatientHistoryResponse)
async def get_patient_history(patient_id: str, days: int = 7):
    """Get patient history for charts"""
    days = max(1, min(days, 365))  # BUG-19: clamp to reasonable range
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=days, patient_id=patient_id)

        history_points = []
        now = datetime.now()

        for i, obs in enumerate(observations):
            point_time = now - timedelta(hours=(len(observations) - i - 1) * 4)
            history_points.append(HistoryPoint(
                timestamp=point_time.isoformat(),
                glucose=obs.get('glucose_avg'),
                steps=obs.get('steps_daily'),
                risk=None
            ))

        return PatientHistoryResponse(patient_id=patient_id, history=history_points)

    except Exception as e:
        logger.exception(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

class DailyAnalysis(BaseModel):
    date: str
    state: str
    confidence: float

class PatientAnalysisResponse(BaseModel):
    patient_id: str
    history: List[DailyAnalysis]

@app.get("/patient/{patient_id}/analysis/14days", response_model=PatientAnalysisResponse)
async def get_patient_analysis(patient_id: str):
    """Get stable 14-day HMM analysis (Worst-Case Aggregation)"""
    try:
        conn = get_db()
        
        # Fetch all states for last 14 days
        # We use a raw query similar to Streamlit but handle aggregation in Python to match logic perfectly
        start_time = int(time.time()) - (14 * 24 * 3600)
        
        rows = conn.execute("""
            SELECT
                date(timestamp_utc, 'unixepoch', 'localtime') as date_str,
                detected_state,
                confidence_score
            FROM hmm_states
            WHERE timestamp_utc >= ? AND (user_id = ? OR user_id = 'current_user')
            ORDER BY timestamp_utc ASC
        """, (start_time, patient_id)).fetchall()
        
        conn.close()
        
        # Aggregation Logic: Group by Date -> Worst Case State
        daily_map = {} # date -> {states: [], confs: []}
        
        for row in rows:
            d = row['date_str']
            if d not in daily_map:
                daily_map[d] = {'states': [], 'confs': []}
            daily_map[d]['states'].append(row['detected_state'])
            daily_map[d]['confs'].append(row['confidence_score'])
            
        result_history = []
        
        # Sort dates to ensure order
        sorted_dates = sorted(daily_map.keys())
        
        for d in sorted_dates:
            data = daily_map[d]
            states = data['states']
            
            # Worst Case Logic: CRISIS > WARNING > STABLE
            final_state = 'STABLE'
            if 'CRISIS' in states:
                final_state = 'CRISIS'
            elif 'WARNING' in states:
                final_state = 'WARNING'
                
            # Avg confidence
            avg_conf = sum(data['confs']) / len(data['confs']) if data['confs'] else 0.0
            
            result_history.append(DailyAnalysis(
                date=d,
                state=final_state,
                confidence=avg_conf
            ))
            
        # Ensure we return at least empty list if no data, but model handles that
        return PatientAnalysisResponse(patient_id=patient_id, history=result_history)

    except Exception as e:
        logger.exception(f"Error getting 14-day analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

class GaussianPoint(BaseModel):
    x: float
    y: float

class GaussianCurve(BaseModel):
    state: str
    points: List[GaussianPoint]
    mean: float
    std: float

class FeaturePlotData(BaseModel):
    feature: str
    curves: List[GaussianCurve]
    observed_value: Optional[float] = None
    unit: str

class EvidenceItem(BaseModel):
    feature: str
    value: str
    contribution: str # "Normal", "Warning", "Critical"
    weight: float

class HeatmapRow(BaseModel):
    feature: str
    log_probs: List[float]  # [STABLE, WARNING, CRISIS]

class AnalysisDetailResponse(BaseModel):
    date: str
    selected_state: str
    gaussian_plots: List[FeaturePlotData]
    evidence: List[EvidenceItem]
    heatmap: List[HeatmapRow] = []

@app.get("/patient/{patient_id}/analysis/detail", response_model=AnalysisDetailResponse)
async def get_analysis_detail(patient_id: str, date: str):
    """
    Get deep-dive analysis for a specific date.
    Returns Gaussian curves vs observed values for all features.
    """
    try:
        conn = get_db()
        engine = get_engine()
        
        # 1. Find the 'worst' state snapshot for this date
        # date param is YYYY-MM-DD
        rows = conn.execute("""
            SELECT
                detected_state,
                input_vector_snapshot,
                timestamp_utc
            FROM hmm_states
            WHERE date(timestamp_utc, 'unixepoch', 'localtime') = ? AND (user_id = ? OR user_id = 'current_user')
            ORDER BY timestamp_utc ASC
        """, (date, patient_id)).fetchall()
        
        conn.close()
        
        if not rows:
            # Return empty/safe response if no data for that day
            return AnalysisDetailResponse(
                date=date, selected_state="UNKNOWN", gaussian_plots=[], evidence=[]
            )
            
        # Find worst state row
        worst_row = None
        severity_map = {"CRISIS": 3, "WARNING": 2, "STABLE": 1}
        max_sev = 0
        
        for row in rows:
            sev = severity_map.get(row['detected_state'], 0)
            if sev >= max_sev:
                max_sev = sev
                worst_row = row
                
        # Parse observation
        try:
            obs = json.loads(worst_row['input_vector_snapshot']) if worst_row['input_vector_snapshot'] else {}
        except (json.JSONDecodeError, TypeError):
            obs = {}
        
        # 2. Generate Gaussian Plots
        plots = []
        evidence = []
        
        feat_meta = engine.get_feature_metadata()
        
        for feat, meta in feat_meta.items():
            # Get plot data from engine
            val = obs.get(feat)
            
            # Skip if value is missing/None, unless we want to show empty graphs
            if val is None:
                continue
                
            raw_curves = engine.get_gaussian_plot_data(feat, val)
            if not raw_curves:
                continue
                
            # Convert to pydantic models
            curves_model = []
            for c in raw_curves:
                points = [GaussianPoint(x=px, y=py) for px, py in zip(c['x'], c['y'])]
                curves_model.append(GaussianCurve(
                    state=c['state'],
                    points=points,
                    mean=c['mean'],
                    std=c['std']
                ))
            
            plots.append(FeaturePlotData(
                feature=feat,
                curves=curves_model,
                observed_value=val,
                unit=meta.get('unit', '')
            ))
            
            # 3. Calculate Evidence Contribution
            # Compare log-likelihoods across states to determine which state
            # this feature's value most supports
            params = engine.emission_params[feat]
            state_names = ["STABLE", "WARNING", "CRISIS"]
            max_prob = -float('inf')
            likely_state = "STABLE"

            for si, sn in enumerate(state_names):
                p = gaussian_pdf(val, params['means'][si], params['vars'][si])
                lp = safe_log(p)
                if lp > max_prob:
                    max_prob = lp
                    likely_state = sn

            # Classify contribution based on which state this feature supports
            if likely_state == "CRISIS":
                contribution = "Critical"
            elif likely_state == "WARNING":
                contribution = "Elevated"
            else:
                contribution = "Normal"

            val_str = f"{val:.1f} {meta.get('unit','')}"

            evidence.append(EvidenceItem(
                feature=feat,
                value=val_str,
                contribution=contribution,
                weight=meta.get('weight', 0)
            ))
        
        # 4. Calculate Log-Likelihood Heatmap
        heatmap = []
        for feat in engine.get_feature_metadata().keys():
            val = obs.get(feat)
            if feat in EMISSION_PARAMS and val is not None:
                params = EMISSION_PARAMS[feat]
                weight = WEIGHTS.get(feat, 1.0)
                log_probs = []
                for state_idx in range(3):  # STABLE, WARNING, CRISIS
                    p = gaussian_pdf(val, params['means'][state_idx], params['vars'][state_idx])
                    lp = safe_log(p) * weight
                    log_probs.append(round(lp, 3))
                heatmap.append(HeatmapRow(feature=feat, log_probs=log_probs))

        return AnalysisDetailResponse(
            date=date,
            selected_state=worst_row['detected_state'],
            gaussian_plots=plots,
            evidence=evidence,
            heatmap=heatmap
        )

    except Exception as e:
        logger.exception(f"Error getting analysis detail: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

def _get_patient_profile(patient_id: str) -> dict:
    """Get patient profile from database, with demo fallback."""
    # Demo fallback profiles (used only when DB has no data)
    DEMO_PROFILES = {
        "P001": {"id": "P001", "name": "Mr. Tan Ah Kow", "age": 67, "conditions": "Type 2 Diabetes, Hypertension", "medications": "Metformin 500mg BID, Lisinopril 10mg OD"},
        "P002": {"id": "P002", "name": "Mdm. Lim Siew Eng", "age": 72, "conditions": "Type 2 Diabetes, Chronic Kidney Disease Stage 2", "medications": "Metformin 500mg, Gliclazide 80mg"},
        "P003": {"id": "P003", "name": "Mr. Ahmad bin Ismail", "age": 58, "conditions": "Type 2 Diabetes", "medications": "Metformin 1000mg"},
    }
    try:
        conn = get_db()
        try:
            row = conn.execute(
                "SELECT user_id, name, age, conditions, medications FROM patients WHERE user_id = ?",
                (patient_id,)
            ).fetchone()
            if row:
                # json already imported at module level
                conditions = row["conditions"] or ""
                medications = row["medications"] or ""
                # Handle JSON-encoded lists
                try:
                    conditions = ", ".join(json.loads(conditions)) if conditions.startswith("[") else conditions
                except Exception:
                    pass
                try:
                    medications = ", ".join(json.loads(medications)) if medications.startswith("[") else medications
                except Exception:
                    pass
                return {
                    "id": row["user_id"],
                    "name": row["name"] or f"Patient {patient_id}",
                    "age": row["age"] if "age" in row.keys() else 67,
                    "conditions": conditions,
                    "medications": medications,
                }
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Could not load patient profile from DB: {e}")
    # Fallback to demo data — never return another patient's data for unknown IDs
    return DEMO_PROFILES.get(patient_id, {"id": patient_id, "name": f"Patient {patient_id}", "age": 67, "conditions": "Type 2 Diabetes", "medications": "Metformin 500mg BID"})


@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with the agentic AI — powered by AgentRuntime with full HMM + tool execution."""
    try:
        engine = get_engine()
        gi = get_gemini()
        observations = engine.fetch_observations(days=7, patient_id=request.patient_id)
        patient_profile = _get_patient_profile(request.patient_id)

        result = run_agent(
            patient_profile=patient_profile,
            hmm_engine=engine,
            observations=observations,
            patient_id=request.patient_id,
            user_message=request.message,
            gemini_integration=gi,
        )

        # Convert tool_calls to actions for backward compat
        actions = []
        for tc in result.get("tool_calls", []):
            actions.append({"action": tc.get("tool", ""), "params": tc.get("args", {})})
        for et in result.get("_metadata", {}).get("executed_tools", []):
            actions.append({"action": et.get("tool", ""), "params": et.get("args", {}),
                           "result": et.get("result", {})})

        return ChatResponse(
            message=result.get("message_to_patient", result.get("message", "I'm here to help!")),
            tone=result.get("tone"),
            actions=actions,
            priority_factor=result.get("priority_factor"),
            hmm_state=result.get("_metadata", {}).get("hmm_state"),
        )

    except Exception as e:
        logger.exception(f"Chat error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

# =============================================================================
# GLUCOSE ENDPOINTS
# =============================================================================

@app.post("/glucose/log")
async def log_glucose(data: GlucoseInput):
    """Log a glucose reading"""
    try:
        conn = get_db()

        # Convert mg/dL to mmol/L if needed
        value = data.value
        if data.unit == "mg/dL":
            value = value / 18.0

        conn.execute("""
            INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
            VALUES (?, ?, ?, ?)
        """, (data.patient_id, value, int(time.time()), data.source))
        conn.commit()
        conn.close()

        return {"success": True, "value": value, "unit": "mmol/L"}

    except Exception as e:
        logger.exception(f"Error logging glucose: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB max file upload
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

@app.post("/glucose/ocr", response_model=GlucoseOCRResponse)
async def extract_glucose_from_photo(file: UploadFile = File(...)):
    """Extract glucose reading from photo using Gemini OCR"""
    try:
        # Validate file type
        if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
            return GlucoseOCRResponse(success=False, error=f"Invalid file type. Allowed: JPEG, PNG, WebP, HEIC")

        gi = get_gemini()
        if not gi:
            return GlucoseOCRResponse(success=False, error="OCR service unavailable")

        # Read with size limit
        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE:
            return GlucoseOCRResponse(success=False, error=f"File too large. Max {MAX_UPLOAD_SIZE // (1024*1024)}MB")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Call Gemini OCR
        try:
            result = gi.extract_glucose_from_photo(tmp_path)
        finally:
            # Always clean up temp file
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        if result and result.get('value'):
            raw_confidence = result.get('confidence', 0.8)
            if isinstance(raw_confidence, str):
                confidence = {'high': 0.9, 'medium': 0.7, 'low': 0.3}.get(raw_confidence, 0.5)
            else:
                confidence = float(raw_confidence) if raw_confidence is not None else 0.8
            return GlucoseOCRResponse(
                success=True,
                value=result['value'],
                unit=result.get('unit', 'mmol/L'),
                confidence=confidence
            )
        else:
            return GlucoseOCRResponse(success=False, error="Could not read glucose value from image")

    except Exception as e:
        logger.exception(f"OCR error: {e}")
        return GlucoseOCRResponse(success=False, error="Could not process image. Please try again.")

# =============================================================================
# FOOD LOGGING ENDPOINT
# =============================================================================

@app.post("/food/log")
async def log_food(data: FoodInput):
    """Log a food entry with description and carbs"""
    conn = get_db()
    try:
        meal_upper = data.meal_type.upper()
        if meal_upper not in ("BREAKFAST", "LUNCH", "DINNER", "SNACK"):
            meal_upper = "SNACK"
        conn.execute(
            "INSERT INTO food_logs (user_id, timestamp_utc, meal_type, description, carbs_grams, source_type) VALUES (?, ?, ?, ?, ?, ?)",
            (data.patient_id, int(time.time()), meal_upper, data.description, data.carbs_grams, "MANUAL")
        )
        conn.commit()
        return {"success": True, "message": f"Logged {data.meal_type}: {data.description}"}
    except Exception as e:
        logger.exception(f"Error logging food: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")
    finally:
        conn.close()

# =============================================================================
# MEDICATION ENDPOINTS
# =============================================================================

@app.get("/medications/{patient_id}")
async def get_medications(patient_id: str):
    """Get today's medication schedule from patient profile"""
    try:
        conn = get_db()
        profile = _get_patient_profile(patient_id)
        med_names = [m.strip() for m in profile.get("medications", "").split(",") if m.strip()]

        MED_DEFAULTS = {
            "Metformin": [{"dose": "500mg", "time": "08:00", "with_food": True}, {"dose": "500mg", "time": "20:00", "with_food": True}],
            "Lisinopril": [{"dose": "10mg", "time": "08:00", "with_food": False}],
            "Atorvastatin": [{"dose": "20mg", "time": "21:00", "with_food": False}],
            "Amlodipine": [{"dose": "5mg", "time": "08:00", "with_food": False}],
            "Gliclazide": [{"dose": "80mg", "time": "08:00", "with_food": True}],
        }

        medications = []
        med_id = 1
        for name in med_names:
            parts = name.strip().split()
            base_name = parts[0] if parts else "Unknown"
            schedules = MED_DEFAULTS.get(base_name, [{"dose": "", "time": "08:00", "with_food": False}])
            for sched in schedules:
                medications.append({"id": med_id, "name": name, "dose": sched["dose"], "time": sched["time"], "with_food": sched["with_food"], "taken": False})
                med_id += 1

        now = int(time.time())
        today_start = now - ((now + 28800) % 86400)  # SGT midnight (UTC+8)
        try:
            taken_meds = conn.execute("""
                SELECT medication_name, taken_timestamp_utc FROM medication_logs
                WHERE taken_timestamp_utc >= ? AND user_id = ?
            """, (today_start, patient_id)).fetchall()
        except sqlite3.OperationalError:
            # user_id column may not exist — fall back to unfiltered
            taken_meds = conn.execute("""
                SELECT medication_name, taken_timestamp_utc FROM medication_logs
                WHERE taken_timestamp_utc >= ?
            """, (today_start,)).fetchall()
        conn.close()

        # Build list of (name, sgt_hour) for each taken log
        taken_entries = []
        for row in taken_meds:
            ts = row['taken_timestamp_utc']
            if ts is None:
                continue
            sgt_hour = ((int(ts) + 28800) % 86400) // 3600
            taken_entries.append((row['medication_name'], sgt_hour))

        def _time_window(scheduled_time: str) -> tuple:
            """Return (start_hour, end_hour) window for a scheduled time."""
            try:
                hour = int(scheduled_time.split(":")[0])
            except (ValueError, IndexError):
                hour = 8  # Default to morning
            if hour < 12:
                return (6, 12)   # morning
            elif hour < 18:
                return (12, 18)  # afternoon
            else:
                return (18, 24)  # evening

        for med in medications:
            window_start, window_end = _time_window(med['time'])
            for t_name, t_hour in taken_entries:
                # Match on exact name (with time label) or base name, AND time window
                name_match = (t_name == f"{med['name']} ({med['time']})" or t_name == med['name'])
                if name_match and window_start <= t_hour < window_end:
                    med['taken'] = True
                    break

    except Exception as e:
        logger.warning(f"Error loading medications: {e}")
        medications = []

    return {"medications": medications}

@app.post("/medications/log")
async def log_medication(data: MedicationLog):
    """Log medication taken"""
    try:
        conn = get_db()

        now = int(time.time())
        today_start = now - ((now + 28800) % 86400)  # SGT midnight (UTC+8)

        if data.taken:
            try:
                conn.execute("""
                    INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc, user_id)
                    VALUES (?, ?, ?, ?)
                """, (data.medication_name, now, now, data.patient_id))
            except sqlite3.OperationalError:
                # user_id column may not exist
                conn.execute("""
                    INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                    VALUES (?, ?, ?)
                """, (data.medication_name, now, now))
            conn.commit()
        else:
            # Remove the most recent log for this medication today
            try:
                conn.execute("""
                    DELETE FROM medication_logs WHERE rowid = (
                        SELECT rowid FROM medication_logs
                        WHERE user_id = ? AND medication_name = ? AND taken_timestamp_utc > ?
                        ORDER BY taken_timestamp_utc DESC LIMIT 1
                    )
                """, (data.patient_id, data.medication_name, today_start))
            except sqlite3.OperationalError:
                conn.execute("""
                    DELETE FROM medication_logs WHERE rowid = (
                        SELECT rowid FROM medication_logs
                        WHERE medication_name = ? AND taken_timestamp_utc > ?
                        ORDER BY taken_timestamp_utc DESC LIMIT 1
                    )
                """, (data.medication_name, today_start))
            conn.commit()

        conn.close()
        return {"success": True, "medication": data.medication_name, "taken": data.taken}

    except Exception as e:
        logger.exception(f"Error logging medication: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# =============================================================================
# VOUCHER ENDPOINTS
# =============================================================================

@app.get("/voucher/{patient_id}", response_model=VoucherResponse)
async def get_voucher(patient_id: str):
    """Get current voucher status"""
    try:
        vs = get_voucher_system(user_id=patient_id)
        if not vs:
            return VoucherResponse(
                current_value=5.00,
                max_value=5.00,
                days_until_redemption=7,
                can_redeem=False,
                streak_days=0,
                deductions_today=[]
            )

        vs.check_and_apply_daily_penalties()
        voucher = vs.get_current_voucher()

        # Compute streak_days from agent streaks if available
        streak_days = voucher.get('streak_days', 0)
        if streak_days == 0:
            try:
                streaks = get_patient_streaks(patient_id)
                if isinstance(streaks, dict):
                    streak_vals = streaks.get('streaks', streaks)
                    if isinstance(streak_vals, dict):
                        streak_days = max((v.get('current', 0) if isinstance(v, dict) else 0) for v in streak_vals.values()) if streak_vals else 0
            except Exception:
                pass

        return VoucherResponse(
            current_value=voucher.get('current_value', 5.00),
            max_value=voucher.get('max_value', 5.00),
            days_until_redemption=voucher.get('days_until_redemption', 7),
            can_redeem=voucher.get('can_redeem', False),
            streak_days=streak_days,
            deductions_today=voucher.get('deductions_today', [])
        )

    except Exception as e:
        logger.exception(f"Error getting voucher: {e}")
        return VoucherResponse(
            current_value=5.00,
            max_value=5.00,
            days_until_redemption=7,
            can_redeem=False,
            streak_days=0,
            deductions_today=[]
        )

@app.get("/voucher/{patient_id}/qr")
async def get_voucher_qr(patient_id: str):
    """Generate QR code for voucher redemption"""
    try:
        vs = get_voucher_system(user_id=patient_id)
        if not vs:
            raise HTTPException(status_code=500, detail="Voucher system unavailable")

        voucher = vs.get_current_voucher()
        if not voucher.get('can_redeem'):
            raise HTTPException(status_code=400, detail="Voucher not redeemable yet")

        qr_base64 = vs.generate_qr_code(voucher['current_value'])
        return {"qr_code": qr_base64, "value": voucher['current_value']}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating QR: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# =============================================================================
# VOICE CHECK-IN ENDPOINTS
# =============================================================================

@app.post("/voice/checkin", response_model=VoiceCheckInResponse)
async def voice_checkin(data: VoiceCheckInRequest):
    """Process voice check-in and analyze sentiment"""
    try:
        gi = get_gemini()

        if gi:
            result = gi.analyze_voice_sentiment(data.transcript)

            # Store in database
            conn = get_db()
            conn.execute("""
                INSERT INTO voice_checkins (timestamp_utc, transcript_text, sentiment_score, user_id)
                VALUES (?, ?, ?, ?)
            """, (int(time.time()), data.transcript, result.get('sentiment_score', 0), data.patient_id))
            conn.commit()
            conn.close()

            return VoiceCheckInResponse(
                sentiment_score=result.get('sentiment_score', 0),
                urgency=result.get('urgency', 'low'),
                health_keywords=result.get('health_keywords', []),
                ai_response=result.get('response')
            )
        else:
            # Simple fallback analysis
            positive_words = ['good', 'better', 'great', 'fine', 'okay', 'well']
            negative_words = ['bad', 'pain', 'tired', 'sick', 'dizzy', 'weak']

            text_lower = data.transcript.lower()
            pos_count = sum(1 for w in positive_words if w in text_lower)
            neg_count = sum(1 for w in negative_words if w in text_lower)

            sentiment = (pos_count - neg_count) / max(1, pos_count + neg_count)

            return VoiceCheckInResponse(
                sentiment_score=sentiment,
                urgency='high' if neg_count > 2 else 'low',
                health_keywords=[w for w in negative_words if w in text_lower]
            )

    except Exception as e:
        logger.exception(f"Voice check-in error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# =============================================================================
# REMINDERS ENDPOINTS
# =============================================================================

@app.get("/reminders/{patient_id}")
async def get_reminders(patient_id: str):
    """Get pending reminders for patient"""
    try:
        conn = get_db()

        rows = conn.execute("""
            SELECT id, reminder_type, message, reminder_time, status
            FROM reminders
            WHERE user_id = ? AND status = 'pending'
            ORDER BY reminder_time
        """, (patient_id,)).fetchall()
        conn.close()

        reminders = []
        for row in rows:
            reminders.append({
                "id": row['id'],
                "type": row['reminder_type'] or 'general',
                "message": row['message'],
                "time": row['reminder_time'],
                "status": row['status']
            })

        return {"reminders": reminders}

    except Exception as e:
        logger.warning(f"Error getting reminders: {e}")
        return {"reminders": []}

@app.post("/reminders/{patient_id}/dismiss/{reminder_id}")
async def dismiss_reminder(patient_id: str, reminder_id: int):
    """Dismiss a reminder"""
    try:
        conn = get_db()
        conn.execute("""
            UPDATE reminders SET status = 'dismissed'
            WHERE id = ? AND user_id = ?
        """, (reminder_id, patient_id))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        logger.exception(f"Error dismissing reminder: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# =============================================================================
# NURSE DASHBOARD ENDPOINTS
# =============================================================================

@app.get("/nurse/alerts")
async def get_nurse_alerts():
    """Get all pending alerts across ALL patients for nurse dashboard."""
    try:
        conn = get_db()
        data = {
            "nurse_alerts": [],
            "medication_videos": [],
            "appointment_requests": [],
            "doctor_escalations": [],
            "family_alerts": [],
            "caregiver_alerts": [],
            "agent_actions": [],
        }

        # Nurse alerts
        try:
            rows = conn.execute("""
                SELECT id, user_id, timestamp_utc, priority, reason, status
                FROM nurse_alerts WHERE status = 'pending'
                ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1
                         WHEN 'medium' THEN 2 ELSE 3 END, timestamp_utc DESC
                LIMIT 50
            """).fetchall()
            data["nurse_alerts"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Medication video requests
        try:
            rows = conn.execute("""
                SELECT id, user_id, timestamp_utc, medication_name, status
                FROM medication_video_requests WHERE status IN ('pending', 'submitted')
                ORDER BY timestamp_utc DESC LIMIT 20
            """).fetchall()
            data["medication_videos"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Appointment requests
        try:
            rows = conn.execute("""
                SELECT id, user_id, timestamp_utc, appointment_type, urgency, reason, status
                FROM appointment_requests WHERE status IN ('pending', 'booked')
                ORDER BY CASE urgency WHEN 'emergency' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END,
                         timestamp_utc DESC LIMIT 20
            """).fetchall()
            data["appointment_requests"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Doctor escalations
        try:
            rows = conn.execute("""
                SELECT id, user_id, timestamp_utc, reason, metrics_snapshot, status
                FROM doctor_escalations WHERE status = 'pending'
                ORDER BY timestamp_utc DESC LIMIT 20
            """).fetchall()
            data["doctor_escalations"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Family alerts
        try:
            rows = conn.execute("""
                SELECT id, user_id, timestamp_utc, message, status
                FROM family_alerts WHERE status = 'pending'
                ORDER BY timestamp_utc DESC LIMIT 20
            """).fetchall()
            data["family_alerts"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Caregiver alerts (from tools)
        try:
            rows = conn.execute("""
                SELECT id, patient_id, timestamp_utc, severity, message
                FROM caregiver_alerts
                ORDER BY timestamp_utc DESC LIMIT 20
            """).fetchall()
            data["caregiver_alerts"] = [dict(r) for r in rows]
        except Exception:
            pass

        # Recent agent actions
        try:
            rows = conn.execute("""
                SELECT id, patient_id, timestamp_utc, action_type, tool_name, status,
                       hmm_state, risk_48h, reasoning
                FROM agent_actions_log
                ORDER BY timestamp_utc DESC LIMIT 30
            """).fetchall()
            data["agent_actions"] = [dict(r) for r in rows]
        except Exception:
            pass

        conn.close()
        return data

    except Exception as e:
        logger.exception(f"Error getting nurse alerts: {e}")
        return {"nurse_alerts": [], "medication_videos": [], "appointment_requests": [],
                "doctor_escalations": [], "family_alerts": [], "caregiver_alerts": [], "agent_actions": []}

@app.get("/nurse/patients")
async def get_all_patients():
    """Get all patients with their current states for nurse triage"""
    try:
        engine = get_engine()
        conn = get_db()

        # Query patients from DB, fallback to demo list
        patients = []
        try:
            rows = conn.execute("SELECT user_id, name, age FROM patients").fetchall()
            for r in rows:
                patients.append({"id": r["user_id"], "name": r["name"] or f"Patient {r['user_id']}", "age": r["age"] if "age" in r.keys() else 67})
        except Exception:
            pass
        if not patients:
            patients = [
                {"id": "P001", "name": "Mr. Tan Ah Kow", "age": 67},
                {"id": "P002", "name": "Mrs. Lim Mei Ling", "age": 72},
                {"id": "P003", "name": "Mr. Wong Keng Huat", "age": 58},
            ]

        results = []
        for p in patients:
            observations = engine.fetch_observations(days=2, patient_id=p['id'])
            if observations:
                result = engine.run_inference(observations, patient_id=p['id'])
                latest = observations[-1]

                results.append({
                    "patient_id": p['id'],
                    "name": p['name'],
                    "age": p['age'],
                    "state": result.get('current_state', 'STABLE'),
                    "confidence": result.get('confidence', 0.5),
                    "glucose": latest.get('glucose_avg', 5.5),
                    "risk_48h": result.get('predictions', {}).get('risk_48h', 0)
                })
            else:
                results.append({
                    "patient_id": p['id'],
                    "name": p['name'],
                    "age": p['age'],
                    "state": "UNKNOWN",
                    "confidence": 0,
                    "glucose": None,
                    "risk_48h": None
                })

        # Sort by risk
        state_order = {"CRISIS": 0, "WARNING": 1, "STABLE": 2, "UNKNOWN": 3}
        results.sort(key=lambda x: state_order.get(x['state'], 99))

        return {"patients": results}

    except Exception as e:
        logger.exception(f"Error getting patients: {e}")
        return {"patients": []}

# =============================================================================
# AGENTIC ENDPOINTS
# =============================================================================

@app.post("/agent/proactive-checkin/{patient_id}")
async def trigger_proactive_checkin(patient_id: str):
    """Trigger an AI-initiated proactive check-in (no user message — agent reaches out)."""
    try:
        engine = get_engine()
        gi = get_gemini()
        observations = engine.fetch_observations(days=7, patient_id=patient_id)
        patient_profile = _get_patient_profile(patient_id)

        result = run_agent(
            patient_profile=patient_profile,
            hmm_engine=engine,
            observations=observations,
            patient_id=patient_id,
            user_message=None,  # Proactive — no user message
            gemini_integration=gi,
        )

        return {
            "success": True,
            "message": result.get("message_to_patient", ""),
            "tone": result.get("tone"),
            "actions_taken": [t.get("tool") for t in result.get("_metadata", {}).get("executed_tools", [])],
            "hmm_state": result.get("_metadata", {}).get("hmm_state"),
            "risk_48h": result.get("_metadata", {}).get("risk_48h"),
            "trend": result.get("_metadata", {}).get("trend"),
        }

    except Exception as e:
        logger.exception(f"Proactive check-in error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/status/{patient_id}")
async def get_agent_status(patient_id: str):
    """Get full agent intelligence for a patient — HMM state, risk, counterfactuals, trend."""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=7, patient_id=patient_id)

        hmm_context = build_full_hmm_context(engine, observations, patient_id)

        return {
            "patient_id": patient_id,
            "current_state": hmm_context.get("current_state"),
            "confidence": hmm_context.get("confidence"),
            "risk_48h": hmm_context.get("risk_48h"),
            "risk_level": hmm_context.get("risk_level"),
            "trend": hmm_context.get("trend"),
            "expected_hours_to_crisis": hmm_context.get("expected_hours_to_crisis"),
            "state_probabilities": hmm_context.get("state_probabilities"),
            "top_factors": hmm_context.get("top_factors"),
            "counterfactuals": hmm_context.get("counterfactuals"),
            "state_change": hmm_context.get("state_change"),
            "latest_metrics": {
                "glucose": hmm_context.get("latest_obs", {}).get("glucose_avg"),
                "steps": hmm_context.get("latest_obs", {}).get("steps_daily"),
                "meds_adherence": hmm_context.get("latest_obs", {}).get("meds_adherence"),
                "sleep_quality": hmm_context.get("latest_obs", {}).get("sleep_quality"),
                "hr": hmm_context.get("latest_obs", {}).get("resting_hr"),
                "hrv": hmm_context.get("latest_obs", {}).get("hrv_rmssd"),
            },
        }
    except Exception as e:
        logger.exception(f"Agent status error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/actions/{patient_id}")
async def get_agent_actions(patient_id: str, limit: int = 20):
    """Get recent agent actions and tool executions for a patient."""
    limit = max(1, min(limit, 100))
    try:
        conn = get_db()
        rows = conn.execute("""
            SELECT id, timestamp_utc, action_type, tool_name, tool_args, tool_result,
                   status, hmm_state, risk_48h, reasoning
            FROM agent_actions_log
            WHERE patient_id = ?
            ORDER BY timestamp_utc DESC LIMIT ?
        """, (patient_id, limit)).fetchall()
        conn.close()
        return {"patient_id": patient_id, "actions": [dict(r) for r in rows]}
    except Exception as e:
        logger.warning(f"Error getting agent actions: {e}")
        return {"patient_id": patient_id, "actions": []}


@app.get("/agent/conversation/{patient_id}")
async def get_conversation_history_endpoint(patient_id: str, limit: int = 20):
    """Get conversation history between patient and AI agent."""
    limit = max(1, min(limit, 200))
    try:
        conn = get_db()
        rows = conn.execute("""
            SELECT id, timestamp_utc, role, message, hmm_state, actions_taken
            FROM conversation_history
            WHERE patient_id = ?
            ORDER BY timestamp_utc DESC LIMIT ?
        """, (patient_id, limit)).fetchall()
        conn.close()
        return {"patient_id": patient_id, "history": [dict(r) for r in reversed(rows)]}
    except Exception as e:
        logger.warning(f"Error getting conversation history: {e}")
        return {"patient_id": patient_id, "history": []}


@app.post("/agent/counterfactual/{patient_id}")
async def run_counterfactual(patient_id: str, body: CounterfactualInput):
    """Run a counterfactual 'what-if' scenario directly."""
    try:
        from clinical_interventions import calculate_counterfactual_tool

        params = {}
        if body.intervention == "take_medication":
            params = {"medication": body.medication, "dose": body.dose}
        elif body.intervention == "adjust_carbs":
            params = {"carb_reduction": body.carb_reduction}
        elif body.intervention == "increase_activity":
            params = {"additional_steps": body.additional_steps}

        result = calculate_counterfactual_tool(
            patient_id=patient_id,
            intervention=body.intervention,
            intervention_params=params,
            horizon_hours=24,
        )
        return result

    except Exception as e:
        logger.exception(f"Counterfactual error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# ENGAGEMENT & RETENTION ENDPOINTS
# =============================================================================

@app.get("/agent/streaks/{patient_id}")
async def get_streaks(patient_id: str):
    """Get patient's current streaks (medication, glucose, exercise, app usage)."""
    try:
        streaks = get_patient_streaks(patient_id)
        return streaks
    except Exception as e:
        logger.exception(f"Streaks error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/engagement/{patient_id}")
async def get_engagement(patient_id: str):
    """Get patient's engagement score (0-100) with risk level and recommendations."""
    try:
        score = calculate_engagement_score(patient_id)
        return score
    except Exception as e:
        logger.exception(f"Engagement error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/weekly-report/{patient_id}")
async def get_weekly_report(patient_id: str):
    """Generate weekly health summary for patient and/or caregiver."""
    try:
        profile = _get_patient_profile(patient_id)
        report = generate_weekly_report(patient_id, profile)
        return report
    except Exception as e:
        logger.exception(f"Weekly report error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/nudge-times/{patient_id}")
async def get_nudge_times(patient_id: str):
    """Get optimal nudge/reminder times learned from patient response patterns."""
    try:
        times = get_optimal_nudge_times(patient_id)
        return times
    except Exception as e:
        logger.exception(f"Nudge times error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.post("/agent/detect-mood")
async def detect_mood(body: MoodDetectInput):
    """Detect mood/sentiment from a message (for testing)."""
    try:
        mood = detect_mood_from_message(body.message)
        return mood
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/daily-challenge/{patient_id}")
async def get_daily_challenge(patient_id: str):
    """Get personalized daily health challenge based on HMM state."""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=7, patient_id=patient_id)
        hmm_context = build_full_hmm_context(engine, observations, patient_id)
        challenge = generate_daily_challenge(patient_id, hmm_context)
        return challenge
    except Exception as e:
        logger.exception(f"Daily challenge error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/caregiver-fatigue/{patient_id}")
async def get_caregiver_fatigue(patient_id: str):
    """Detect caregiver burnout from alert response patterns."""
    try:
        result = detect_caregiver_fatigue(patient_id)
        return result
    except Exception as e:
        logger.exception(f"Caregiver fatigue error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/glucose-narrative/{patient_id}")
async def get_glucose_narrative(patient_id: str):
    """Get human-readable glucose pattern narrative with actionable tips."""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=7, patient_id=patient_id)
        hmm_context = build_full_hmm_context(engine, observations, patient_id)
        narrative = generate_glucose_narrative(patient_id, hmm_context)
        return narrative
    except Exception as e:
        logger.exception(f"Glucose narrative error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# DEMO/ADMIN ENDPOINTS
# =============================================================================

async def _require_admin(request: Request):
    """Verify admin-level authorization for sensitive endpoints."""
    key = request.headers.get("X-API-Key", "")
    if key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin access required. Set X-API-Key to admin key.")


@app.post("/admin/inject-scenario", dependencies=[Depends(_require_admin)])
async def inject_scenario(scenario: str = "stable_perfect", days: int = 14, tier: str = "PREMIUM", patient_id: str = "P001"):
    """Inject demo scenario data (for testing)"""
    try:
        engine = get_engine()
        observations = engine.generate_demo_scenario(scenario, days=days)

        conn = get_db()
        now = int(time.time())
        start_time = now - (days * 24 * 3600)
        window_size = 4 * 3600

        # Clear existing data (hardcoded allowlist — no user input in table names)
        SAFE_TABLES_SCENARIO = {'glucose_readings', 'passive_metrics', 'medication_logs'}
        for table in SAFE_TABLES_SCENARIO:
            try:
                conn.execute(f"DELETE FROM {table}")  # nosec: table name from hardcoded allowlist
            except Exception:
                pass

        for i, obs in enumerate(observations):
            t = start_time + (i * window_size)

            if obs.get('glucose_avg'):
                conn.execute("""
                    INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
                    VALUES (?, ?, ?, ?)
                """, (patient_id, obs['glucose_avg'], t, 'MANUAL'))

            steps = obs.get('steps_daily', 0) or 0
            conn.execute("""
                INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
                VALUES (?, ?, ?, ?, ?)
            """, (t, t + window_size, int(steps / 6), 3600, 3600))

            if obs.get('meds_adherence', 0) and obs['meds_adherence'] > 0.5:
                try:
                    conn.execute("""
                        INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc, user_id)
                        VALUES (?, ?, ?, ?)
                    """, ('Metformin', t + 100, t, patient_id))
                except sqlite3.OperationalError:
                    conn.execute("""
                        INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                        VALUES (?, ?, ?)
                    """, ('Metformin', t + 100, t))

        conn.commit()
        conn.close()

        return {"success": True, "scenario": scenario, "days": days, "observations": len(observations)}

    except Exception as e:
        logger.exception(f"Error injecting scenario: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

@app.post("/admin/run-hmm", dependencies=[Depends(_require_admin)])
async def run_hmm_analysis():
    """Run HMM analysis on current data"""
    try:
        engine = get_engine()

        conn = get_db()
        now = int(time.time())
        start_time = now - (14 * 24 * 3600)
        window_size = 4 * 3600

        # Clear old HMM states
        conn.execute("DELETE FROM hmm_states WHERE timestamp_utc >= ?", (start_time,))

        patient_ids = ["P001", "P002", "P003"]
        total_analyzed = 0

        for patient_id in patient_ids:
            observations = engine.fetch_observations(days=14, patient_id=patient_id)
            if not observations:
                continue

            for i, obs in enumerate(observations):
                obs_time = start_time + (i * window_size)
                window_start = max(0, i - 42)  # 7 days context
                window_obs = observations[window_start:i+1]

                if window_obs:
                    result = engine.run_inference(window_obs, patient_id=patient_id)

                    conn.execute("""
                        INSERT INTO hmm_states (timestamp_utc, detected_state, confidence_score,
                                               confidence_margin, patient_tier, input_vector_snapshot, user_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (obs_time, result['current_state'], result['confidence'],
                          result.get('confidence_margin', 0), 'PREMIUM', json.dumps(obs), patient_id))

            total_analyzed += len(observations)

        conn.commit()
        conn.close()

        if total_analyzed == 0:
            return {"success": False, "error": "No data available"}

        return {"success": True, "analyzed": total_analyzed}

    except Exception as e:
        logger.exception(f"Error running HMM: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# ... (existing admin endpoints)

@app.post("/admin/reset", dependencies=[Depends(_require_admin)])
async def reset_data():
    """Reset all data for demo"""
    try:
        conn = get_db()
        # Hardcoded allowlist — no user input in table names
        SAFE_TABLES_RESET = {'glucose_readings', 'cgm_readings', 'passive_metrics', 'medication_logs', 'hmm_states', 'voice_checkins', 'reminders', 'nurse_alerts', 'caregiver_alerts', 'agent_actions', 'agent_memory', 'daily_insights', 'agent_actions_log', 'conversation_history', 'fitbit_activity', 'fitbit_heart_rate', 'fitbit_sleep', 'food_logs', 'clinical_notes_history', 'impact_metrics'}
        for table in SAFE_TABLES_RESET:
            try:
                conn.execute(f"DELETE FROM {table}")  # nosec: table name from hardcoded allowlist
            except Exception:
                pass
        conn.commit()
        conn.close()
        return {"success": True, "message": "All data reset"}
    except Exception as e:
        logger.exception(f"Error resetting data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# =============================================================================
# CLINICIAN & IMPACT ENDPOINTS
# =============================================================================

@app.get("/clinician/summary/{patient_id}")
async def get_clinician_summary(patient_id: str, period_days: int = 7):
    """Structured clinician intelligence briefing with SBAR, trajectory, interventions."""
    try:
        from agent_runtime import DB_PATH
        _conn = sqlite3.connect(DB_PATH)
        _conn.row_factory = sqlite3.Row
        summary = _exec_clinician_summary({"period_days": period_days}, patient_id, _conn, int(time.time()))
        _conn.close()
        # Sanitize NaN/Inf values that break JSON serialization
        def _sanitize(obj):
            if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                return 0.0
            if isinstance(obj, dict):
                return {k: _sanitize(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_sanitize(v) for v in obj]
            return obj
        summary = _sanitize(summary)
        return {"success": True, "patient_id": patient_id, "period_days": period_days, **summary}
    except Exception as e:
        logger.exception(f"Clinician summary failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/impact/metrics/{patient_id}")
async def get_impact_metrics(patient_id: str, period_days: int = 30):
    """Impact measurement framework: adherence, time-in-range, engagement, intervention effectiveness."""
    try:
        metrics = compute_impact_metrics(patient_id, period_days)
        return {"success": True, "patient_id": patient_id, "period_days": period_days, "metrics": metrics}
    except Exception as e:
        logger.exception(f"Impact metrics failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/impact/intervention-effectiveness/{patient_id}")
async def get_intervention_effectiveness(patient_id: str):
    """Which agent tools led to state improvements? Correlates tool execution with HMM state transitions."""
    try:
        metrics = compute_impact_metrics(patient_id, period_days=90)
        effectiveness = metrics.get("intervention_effectiveness", {})
        return {
            "success": True,
            "patient_id": patient_id,
            "intervention_effectiveness": effectiveness,
            "methodology": "Correlates agent tool executions with HMM state improvements within 24h window"
        }
    except Exception as e:
        logger.exception(f"Intervention effectiveness failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# AGENT MEMORY ENDPOINTS
# =============================================================================

@app.get("/agent/memory/{patient_id}")
async def get_agent_memory(patient_id: str):
    """View all memories for a patient (cross-session learned preferences and facts)."""
    try:
        # sqlite3 already imported at module level
        db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM agent_memory WHERE patient_id = ? ORDER BY updated_at DESC", (patient_id,)
        ).fetchall()
        conn.close()
        return {"success": True, "patient_id": patient_id, "memories": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.post("/agent/memory/consolidate/{patient_id}")
async def consolidate_memory(patient_id: str):
    """Trigger memory consolidation: merge episodic memories into semantic patterns."""
    try:
        gi = get_gemini()
        _consolidate_memories(patient_id, gi)
        return {"success": True, "message": f"Memory consolidation triggered for {patient_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.delete("/agent/memory/{patient_id}/{memory_id}")
async def delete_memory(patient_id: str, memory_id: int):
    """Delete a specific memory."""
    try:
        # sqlite3 already imported at module level
        db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        conn = sqlite3.connect(db)
        conn.execute("DELETE FROM agent_memory WHERE id = ? AND patient_id = ?", (memory_id, patient_id))
        conn.commit()
        conn.close()
        return {"success": True, "deleted": memory_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# DRUG INTERACTION ENDPOINTS
# =============================================================================

@app.get("/patient/{patient_id}/drug-interactions")
async def get_drug_interactions(patient_id: str):
    """View all current drug interactions for a patient's medications."""
    try:
        profile = _get_patient_profile_from_db(patient_id)
        meds = profile.get("medications", "")
        if isinstance(meds, str):
            med_list = [m.strip() for m in meds.split(",") if m.strip()]
        elif isinstance(meds, list):
            med_list = meds
        else:
            med_list = []
        result = check_drug_interactions(med_list)
        return {"success": True, "patient_id": patient_id, "medications": med_list, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.post("/patient/{patient_id}/drug-interactions/check")
async def check_proposed_interaction(patient_id: str, body: DrugInteractionCheckInput):
    """Check a proposed new medication against patient's current medications."""
    try:
        profile = _get_patient_profile_from_db(patient_id)
        meds = profile.get("medications", "")
        if isinstance(meds, str):
            med_list = [m.strip() for m in meds.split(",") if m.strip()]
        elif isinstance(meds, list):
            med_list = meds
        else:
            med_list = []
        result = check_drug_interactions(med_list, body.proposed_medication)
        return {"success": True, "patient_id": patient_id, "proposed": body.proposed_medication, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# TOOL EFFECTIVENESS ENDPOINTS
# =============================================================================

@app.get("/agent/tool-effectiveness/{patient_id}")
async def get_tool_effectiveness(patient_id: str):
    """View tool effectiveness scores (learned from clinical outcomes)."""
    try:
        scores = compute_tool_effectiveness_scores(patient_id)
        return {"success": True, "patient_id": patient_id, "effectiveness": scores}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# SAFETY LOG ENDPOINTS
# =============================================================================

@app.get("/agent/safety-log/{patient_id}")
async def get_safety_log(patient_id: str):
    """View safety classifier flags for a patient."""
    try:
        # sqlite3 already imported at module level
        db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT * FROM agent_actions_log
            WHERE patient_id = ? AND action_type = 'safety_flag'
            ORDER BY timestamp_utc DESC LIMIT 50
        """, (patient_id,)).fetchall()
        conn.close()
        return {"success": True, "patient_id": patient_id, "safety_events": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# PROACTIVE SCHEDULER ENDPOINTS
# =============================================================================

@app.post("/agent/proactive-scan")
async def proactive_scan_all():
    """Scan all patients for proactive triggers (called by cron/scheduler)."""
    try:
        results = run_proactive_scan()
        return {"success": True, "scanned": len(results), "triggered": results}
    except Exception as e:
        logger.exception(f"Proactive scan failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.post("/agent/proactive-scan/{patient_id}")
async def proactive_scan_patient(patient_id: str):
    """Scan single patient for proactive triggers."""
    try:
        results = run_proactive_scan([patient_id])
        return {"success": True, "patient_id": patient_id, "triggered": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/agent/proactive-history/{patient_id}")
async def get_proactive_history(patient_id: str):
    """View past proactive interactions for a patient."""
    try:
        # sqlite3 already imported at module level
        db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT * FROM proactive_checkins WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 50
        """, (patient_id,)).fetchall()
        conn.close()
        return {"success": True, "patient_id": patient_id, "history": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# CAREGIVER BIDIRECTIONAL ENDPOINTS
# =============================================================================

@app.post("/caregiver/respond/{alert_id}")
async def caregiver_respond(alert_id: int, body: CaregiverResponseInput):
    """Submit caregiver response to an alert (acknowledged/on_the_way/need_help/escalate/note)."""
    try:
        result = process_caregiver_response(alert_id, body.caregiver_id, body.response_type, body.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/caregiver/dashboard/{patient_id}")
async def caregiver_dashboard(patient_id: str):
    """Caregiver view: patient status + recent alerts + burden score."""
    try:
        profile = _get_patient_profile_from_db(patient_id)
        burden = compute_caregiver_burden_score(patient_id)
        # sqlite3 already imported at module level
        db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        alerts = conn.execute("""
            SELECT * FROM caregiver_alerts WHERE patient_id = ?
            ORDER BY timestamp_utc DESC LIMIT 20
        """, (patient_id,)).fetchall()
        conn.close()
        return {
            "success": True, "patient_id": patient_id,
            "patient_name": profile.get("name", patient_id),
            "burden": burden,
            "recent_alerts": [dict(a) for a in alerts],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/caregiver/burden/{patient_id}")
async def get_caregiver_burden(patient_id: str):
    """Caregiver burden score (0-100) with burnout signals."""
    try:
        return {"success": True, "patient_id": patient_id, **compute_caregiver_burden_score(patient_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# NURSE TRIAGE ENDPOINTS
# =============================================================================

@app.get("/nurse/triage")
async def nurse_triage():
    """Multi-patient clinical triage dashboard: urgency-sorted with SBAR for critical patients."""
    try:
        return {"success": True, **generate_nurse_triage()}
    except Exception as e:
        logger.exception(f"Nurse triage failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


@app.get("/nurse/triage/{patient_id}")
async def nurse_triage_single(patient_id: str):
    """Single patient triage detail."""
    try:
        result = generate_nurse_triage([patient_id])
        patient = result["patients"][0] if result["patients"] else {}
        return {"success": True, "patient_id": patient_id, **patient}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# BAUM-WELCH HMM TRAINING
# =============================================================================

@app.post("/hmm/train/{patient_id}")
async def train_hmm_baum_welch(patient_id: str, days: int = 30):
    """
    Train personalized HMM parameters for a patient using Baum-Welch (EM).
    Uses the patient's historical observation data to learn personalized
    transition probabilities and emission parameters.
    """
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=days, patient_id=patient_id)
        if len(observations) < 10:
            return {
                "success": False,
                "patient_id": patient_id,
                "error": f"Insufficient data: {len(observations)} observations (need >= 10)",
            }
        result = engine.train_patient_baum_welch(
            patient_id=patient_id,
            observations_sequences=[observations],
            max_iter=20,
            tol=1e-4,
        )
        return {"success": True, "patient_id": patient_id, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

@app.get("/hmm/params/{patient_id}")
async def get_hmm_params(patient_id: str):
    """
    View current HMM parameters for a patient (population or personalized).
    Shows transition matrix and emission parameters being used for inference.
    """
    try:
        engine = get_engine()
        personalized = engine.get_personalized_baseline(patient_id)
        calibration = engine.get_calibration_status(patient_id)
        has_custom_transitions = (
            hasattr(engine, '_personalized_transitions')
            and patient_id in engine._personalized_transitions
        )
        return {
            "patient_id": patient_id,
            "using_personalized": personalized is not None,
            "calibration": calibration,
            "has_learned_transitions": has_custom_transitions,
            "transition_matrix": (
                engine._personalized_transitions[patient_id]
                if has_custom_transitions
                else TRANSITION_PROBS
            ),
            "initial_probs": (
                engine._personalized_initial[patient_id]
                if hasattr(engine, '_personalized_initial') and patient_id in engine._personalized_initial
                else INITIAL_PROBS
            ),
            "source": "baum_welch" if has_custom_transitions else "population",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")


# =============================================================================
# STARTUP
# =============================================================================

def startup_event():
    """Initialize on startup — auto-creates schema and seeds demo data if DB is empty."""
    logger.info("Starting Bewo Health API v4.0 (Diamond v7 + 7 Ceiling Features)...")

    # Auto-initialize schema if database is empty or missing core tables
    try:
        _auto_init_database()
    except Exception as e:
        logger.warning(f"Auto-init database: {e}")

    try:
        ensure_runtime_tables()
    except Exception:
        pass

    # Ensure reminder_type column exists (added by agent_runtime but may not exist yet)
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("ALTER TABLE reminders ADD COLUMN reminder_type TEXT DEFAULT 'general'")
        conn.commit()
        conn.close()
    except Exception:
        pass  # Column already exists or table doesn't exist yet

    logger.info("API ready with AgentRuntime!")


def _auto_init_database():
    """Initialize schema and seed demo data if the database is empty."""
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_schema.sql")

    # Check if core tables exist
    conn = sqlite3.connect(DB_PATH)
    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    has_schema = "patients" in tables and "glucose_readings" in tables

    if not has_schema:
        logger.info("Database missing core tables — loading schema...")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
            logger.info("Schema loaded successfully.")
        else:
            logger.warning(f"Schema file not found: {schema_path}")
            conn.close()
            return

    # Check if demo data exists
    patient_row = conn.execute("SELECT COUNT(*) FROM patients").fetchone()
    patient_count = patient_row[0] if patient_row else 0
    if patient_count == 0:
        logger.info("No patients found — seeding demo data...")
        _seed_demo_patients(conn)

    glucose_row = conn.execute("SELECT COUNT(*) FROM glucose_readings").fetchone()
    glucose_count = glucose_row[0] if glucose_row else 0
    if glucose_count == 0:
        logger.info("No glucose data — injecting demo scenario...")
        conn.close()
        _seed_demo_scenario()
    else:
        conn.close()


def _seed_demo_patients(conn):
    """Insert 3 Singapore demo patients."""
    demo_patients = [
        ("P001", "Mr. Tan Ah Kow", 67,
         '["Type 2 Diabetes", "Hypertension"]',
         '["Metformin 500mg", "Lisinopril 10mg"]', "PREMIUM"),
        ("P002", "Mdm. Lim Siew Eng", 72,
         '["Type 2 Diabetes", "Chronic Kidney Disease Stage 2"]',
         '["Metformin 500mg", "Gliclazide 80mg"]', "ENHANCED"),
        ("P003", "Mr. Ahmad bin Ismail", 58,
         '["Type 2 Diabetes"]',
         '["Metformin 1000mg"]', "BASIC"),
    ]
    for uid, name, age, conds, meds, tier in demo_patients:
        try:
            conn.execute(
                "INSERT OR IGNORE INTO patients (user_id, name, age, conditions, medications, tier) VALUES (?, ?, ?, ?, ?, ?)",
                (uid, name, age, conds, meds, tier),
            )
        except Exception as e:
            logger.warning(f"Seed patient {uid}: {e}")
    conn.commit()
    logger.info("Demo patients seeded.")


def _seed_demo_scenario():
    """Generate and inject a demo scenario using HMM engine."""
    try:
        engine = HMMEngine()
        obs = engine.generate_demo_scenario("demo_intervention_success", days=14)

        # Import inject function
        scripts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts")
        sys.path.insert(0, scripts_dir)
        from inject_data import inject_tiered_scenario_to_db, run_analysis_and_save

        # Temporarily override inject_data's DB_PATH
        import inject_data
        original_db = inject_data.DB_PATH
        inject_data.DB_PATH = DB_PATH

        inject_tiered_scenario_to_db(obs, tier="PREMIUM", days=14)
        run_analysis_and_save(engine, days=14)

        inject_data.DB_PATH = original_db
        logger.info("Demo scenario injected successfully.")
    except Exception as e:
        logger.warning(f"Demo scenario injection failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
