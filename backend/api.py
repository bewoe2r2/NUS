"""
NEXUS 2026 - COMPLETE PATIENT API
file: backend/api.py
version: 2.0.0

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
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure we can import from core directory
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core"))

try:
    from hmm_engine import HMMEngine, TRANSITION_PROBS, EMISSION_PARAMS, WEIGHTS, gaussian_pdf, safe_log, STATES
    from gemini_integration import GeminiIntegration
    from voucher_system import VoucherSystem
except ImportError as e:
    logging.error(f"Failed to import modules: {e}")

# --- CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("NexusAPI")

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

app = FastAPI(
    title="Nexus Health API",
    description="Complete Backend for NEXUS Healthcare Companion",
    version="2.0.0"
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class GlucoseInput(BaseModel):
    value: float
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

def get_engine():
    """Get HMM Engine instance"""
    try:
        return HMMEngine()
    except Exception as e:
        logger.error(f"Engine init failed: {e}")
        raise HTTPException(status_code=500, detail="HMM Engine unavailable")

def get_gemini():
    """Get Gemini Integration instance"""
    try:
        gi = GeminiIntegration()
        gi.ensure_agentic_tables()
        return gi
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return None

def get_voucher_system():
    """Get Voucher System instance"""
    try:
        return VoucherSystem()
    except Exception as e:
        logger.error(f"Voucher system init failed: {e}")
        return None

# =============================================================================
# CORE ENDPOINTS
# =============================================================================

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "system": "Nexus Health API v2.0"}

@app.get("/patient/{patient_id}/state", response_model=PatientStateResponse)
async def get_patient_state(patient_id: str):
    """Get current patient health state from HMM"""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=7)

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
            second_avg = sum(state_values.get(s, 0) for s in path_states[len(path_states)//2:]) / (len(path_states)//2)
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
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/history", response_model=PatientHistoryResponse)
async def get_patient_history(patient_id: str, days: int = 7):
    """Get patient history for charts"""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=days)

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

        return PatientHistoryResponse(patient_id=patient_id, history=history_points)

    except Exception as e:
        logger.exception(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            WHERE timestamp_utc >= ?
            ORDER BY timestamp_utc ASC
        """, (start_time,)).fetchall()
        
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
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.exception(f"Error getting 14-day analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            WHERE date(timestamp_utc, 'unixepoch', 'localtime') = ?
            ORDER BY timestamp_utc ASC
        """, (date,)).fetchall()
        
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
        obs = json.loads(worst_row['input_vector_snapshot'])
        
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
            
            # 3. Calculate "Evidence" / Contribution
            # Simple heuristic: how far is it from STABLE mean?
            # Or check which state curve is highest at this x?
            
            # Let's check which state density is max at this value
            max_prob = -1
            likely_state = "STABLE"
            
            for c in raw_curves:
                # Find y value at observed x (approx)
                # simpler: re-calc pdf
                # from hmm_engine import gaussian_pdf
                # prob = gaussian_pdf(val, c['mean'], c['std']**2)
                # Actually, simpler logic:
                # If value is in WARNING or CRISIS range (mean +/- 1 std), flag it
                pass 
            
            # Using engine params to classify severity purely for display
            params = engine.emission_params[feat]
            # Heuristic: Compare log likelihoods
             # (Simplification for UI)
            
            # Just map textual value
            val_str = f"{val:.1f} {meta.get('unit','')}"
            
            # We can use the 'detected_state' of the row, but that's overall.
            # Let's vaguely classify the feature contribution based on weights
            # This is complex to do perfectly without running inference again.
            # We'll just list it with its weight for now.
            
            evidence.append(EvidenceItem(
                feature=feat,
                value=val_str,
                contribution="Normal", # Placeholder, frontend can colorize based on overall state
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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with the agentic AI assistant"""
    try:
        engine = get_engine()
        gi = get_gemini()

        observations = engine.fetch_observations(days=7)

        patient_profile = {
            'name': 'Mr. Tan',
            'age': 67,
            'conditions': 'Type 2 Diabetes, Hypertension',
            'medications': 'Metformin, Lisinopril'
        }

        if gi:
            # Use full agentic response
            result = gi.generate_agentic_response(
                patient_profile=patient_profile,
                hmm_engine=engine,
                observations=observations,
                user_id=request.patient_id,
                user_message=request.message
            )

            return ChatResponse(
                message=result.get('message_to_patient', result.get('message', "I'm here to help!")),
                tone=result.get('tone'),
                actions=result.get('actions', []),
                priority_factor=result.get('priority_factor'),
                hmm_state=result.get('_metadata', {}).get('hmm_state')
            )
        else:
            # Fallback response
            return ChatResponse(
                message="Hello! I'm NEXUS, your health companion. How can I help you today?",
                tone="calm"
            )

    except Exception as e:
        logger.exception(f"Chat error: {e}")
        return ChatResponse(
            message="Sorry, I'm having trouble right now. Please try again.",
            tone="calm"
        )

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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/glucose/ocr", response_model=GlucoseOCRResponse)
async def extract_glucose_from_photo(file: UploadFile = File(...)):
    """Extract glucose reading from photo using Gemini OCR"""
    try:
        gi = get_gemini()
        if not gi:
            return GlucoseOCRResponse(success=False, error="OCR service unavailable")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Call Gemini OCR
        result = gi.extract_glucose_from_photo(tmp_path)

        # Clean up
        os.unlink(tmp_path)

        if result and result.get('value'):
            return GlucoseOCRResponse(
                success=True,
                value=result['value'],
                unit=result.get('unit', 'mmol/L'),
                confidence=result.get('confidence', 0.8)
            )
        else:
            return GlucoseOCRResponse(success=False, error="Could not read glucose value from image")

    except Exception as e:
        logger.exception(f"OCR error: {e}")
        return GlucoseOCRResponse(success=False, error=str(e))

# =============================================================================
# MEDICATION ENDPOINTS
# =============================================================================

@app.get("/medications/{patient_id}")
async def get_medications(patient_id: str):
    """Get today's medication schedule"""
    # Mock data - in production, fetch from patient profile
    medications = [
        {"id": 1, "name": "Metformin", "dose": "500mg", "time": "08:00", "with_food": True, "taken": False},
        {"id": 2, "name": "Metformin", "dose": "500mg", "time": "20:00", "with_food": True, "taken": False},
        {"id": 3, "name": "Lisinopril", "dose": "10mg", "time": "08:00", "with_food": False, "taken": False},
    ]

    # Check what's been taken today
    try:
        conn = get_db()
        today_start = int(time.time()) - (int(time.time()) % 86400)

        taken_meds = conn.execute("""
            SELECT medication_name FROM medication_logs
            WHERE taken_timestamp_utc >= ?
        """, (today_start,)).fetchall()
        conn.close()

        taken_names = [row['medication_name'] for row in taken_meds]

        for med in medications:
            if f"{med['name']} ({med['time']})" in taken_names or med['name'] in taken_names:
                med['taken'] = True

    except Exception as e:
        logger.warning(f"Error checking taken meds: {e}")

    return {"medications": medications}

@app.post("/medications/log")
async def log_medication(data: MedicationLog):
    """Log medication taken"""
    try:
        conn = get_db()

        if data.taken:
            conn.execute("""
                INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                VALUES (?, ?, ?)
            """, (data.medication_name, int(time.time()), int(time.time())))
            conn.commit()

        conn.close()
        return {"success": True, "medication": data.medication_name, "taken": data.taken}

    except Exception as e:
        logger.exception(f"Error logging medication: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# VOUCHER ENDPOINTS
# =============================================================================

@app.get("/voucher/{patient_id}", response_model=VoucherResponse)
async def get_voucher(patient_id: str):
    """Get current voucher status"""
    try:
        vs = get_voucher_system()
        if not vs:
            return VoucherResponse(
                current_value=5.00,
                max_value=5.00,
                days_until_redemption=7,
                can_redeem=False,
                streak_days=0,
                deductions_today=[]
            )

        voucher = vs.get_current_voucher()

        return VoucherResponse(
            current_value=voucher.get('current_value', 5.00),
            max_value=voucher.get('max_value', 5.00),
            days_until_redemption=voucher.get('days_until_redemption', 7),
            can_redeem=voucher.get('can_redeem', False),
            streak_days=voucher.get('streak_days', 0),
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
        vs = get_voucher_system()
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
        raise HTTPException(status_code=500, detail=str(e))

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
                INSERT INTO voice_checkins (timestamp_utc, transcript_text, sentiment_score)
                VALUES (?, ?, ?)
            """, (int(time.time()), data.transcript, result.get('sentiment_score', 0)))
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
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# NURSE DASHBOARD ENDPOINTS
# =============================================================================

@app.get("/nurse/alerts")
async def get_nurse_alerts():
    """Get all pending alerts for nurse dashboard"""
    try:
        gi = get_gemini()
        if gi:
            data = gi.get_nurse_dashboard_data('current_user')
            return data
        return {"nurse_alerts": [], "medication_videos": [], "appointment_requests": [], "doctor_escalations": []}
    except Exception as e:
        logger.exception(f"Error getting nurse alerts: {e}")
        return {"nurse_alerts": [], "medication_videos": [], "appointment_requests": [], "doctor_escalations": []}

@app.get("/nurse/patients")
async def get_all_patients():
    """Get all patients with their current states for nurse triage"""
    try:
        engine = get_engine()

        # In production, fetch from patients table
        # For demo, return mock patient list
        patients = [
            {"id": "P001", "name": "Mr. Tan Ah Kow", "age": 67},
            {"id": "P002", "name": "Mrs. Lim Mei Ling", "age": 72},
            {"id": "P003", "name": "Mr. Wong Keng Huat", "age": 58},
        ]

        results = []
        for p in patients:
            observations = engine.fetch_observations(days=2)
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
# DEMO/ADMIN ENDPOINTS
# =============================================================================

@app.post("/admin/inject-scenario")
async def inject_scenario(scenario: str = "stable_perfect", days: int = 14, tier: str = "PREMIUM"):
    """Inject demo scenario data (for testing)"""
    try:
        engine = get_engine()
        observations = engine.generate_demo_scenario(scenario, days=days)

        conn = get_db()
        now = int(time.time())
        start_time = now - (days * 24 * 3600)
        window_size = 4 * 3600

        # Clear existing data
        tables = ['glucose_readings', 'passive_metrics', 'medication_logs']
        for table in tables:
            try:
                conn.execute(f"DELETE FROM {table}")
            except:
                pass

        for i, obs in enumerate(observations):
            t = start_time + (i * window_size)

            if obs.get('glucose_avg'):
                conn.execute("""
                    INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
                    VALUES (?, ?, ?, ?)
                """, ('P001', obs['glucose_avg'], t, 'DEMO'))

            steps = obs.get('steps_daily', 0) or 0
            conn.execute("""
                INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
                VALUES (?, ?, ?, ?, ?)
            """, (t, t + window_size, int(steps / 6), 3600, 3600))

            if obs.get('meds_adherence', 0) and obs['meds_adherence'] > 0.5:
                conn.execute("""
                    INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                    VALUES (?, ?, ?)
                """, ('Metformin', t + 100, t))

        conn.commit()
        conn.close()

        return {"success": True, "scenario": scenario, "days": days, "observations": len(observations)}

    except Exception as e:
        logger.exception(f"Error injecting scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/run-hmm")
async def run_hmm_analysis():
    """Run HMM analysis on current data"""
    try:
        engine = get_engine()
        observations = engine.fetch_observations(days=14)

        if not observations:
            return {"success": False, "error": "No data available"}

        conn = get_db()
        now = int(time.time())
        start_time = now - (14 * 24 * 3600)
        window_size = 4 * 3600

        # Clear old HMM states
        conn.execute("DELETE FROM hmm_states WHERE timestamp_utc >= ?", (start_time,))

        for i, obs in enumerate(observations):
            obs_time = start_time + (i * window_size)
            window_start = max(0, i - 42)  # 7 days context
            window_obs = observations[window_start:i+1]

            if window_obs:
                result = engine.run_inference(window_obs)

                conn.execute("""
                    INSERT INTO hmm_states (timestamp_utc, detected_state, confidence_score,
                                           confidence_margin, patient_tier, input_vector_snapshot)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (obs_time, result['current_state'], result['confidence'],
                      result.get('confidence_margin', 0), 'PREMIUM', json.dumps(obs)))

        conn.commit()
        conn.close()

        return {"success": True, "analyzed": len(observations)}

    except Exception as e:
        logger.exception(f"Error running HMM: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ... (existing admin endpoints)

@app.post("/admin/reset")
async def reset_data():
    """Reset all data for demo"""
    try:
        conn = get_db()
        tables = ['glucose_readings', 'passive_metrics', 'medication_logs', 'hmm_states', 'voice_checkins', 'reminders']
        for table in tables:
            try:
                conn.execute(f"DELETE FROM {table}")
            except:
                pass
        conn.commit()
        conn.close()
        return {"success": True, "message": "All data reset"}
    except Exception as e:
        logger.exception(f"Error resetting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("Starting Nexus Health API v2.0...")

    # Ensure agentic tables exist
    try:
        gi = get_gemini()
        if gi:
            gi.ensure_agentic_tables()
    except:
        pass

    logger.info("API ready!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
