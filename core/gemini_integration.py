"""
Bewo 2026 - Gemini 2.5 Flash Integration
file: gemini_integration.py
author: Lead Architect
version: 3.0.0

Handles interaction with Google Gemini API for:
1. Glucose OCR (Vision)
2. Voice Sentiment (Text/Audio Analysis)
3. SBAR Reporting (Text Generation)
4. Proactive Patient Insights (Agentic) - NOW WITH FULL CONTEXTUAL DATA

Model Hierarchy:
- Primary: gemini-2.5-flash (with fallback to gemini-2.0-flash)
- Fallback 1: gemini-2.0-flash
- Fallback 2: gemini-2.0-flash-exp

===============================================================================
BEHAVIORAL SCIENCE FRAMEWORK (for nudging elderly diabetics)
===============================================================================
Based on:
- Thaler & Sunstein's Nudge Theory (2008)
- Kahneman's Prospect Theory (loss aversion)
- Fogg Behavior Model (motivation, ability, trigger)
- Self-Determination Theory (autonomy, competence, relatedness)
- Health Belief Model (perceived susceptibility, severity, benefits, barriers)

Key Principles Applied:
1. LOSS AVERSION: Frame messages around what they'll lose, not gain
   - "Don't lose your $5 voucher" > "Earn $5 voucher"
2. SOCIAL PROOF: Reference what "other patients like you" do
3. IMPLEMENTATION INTENTIONS: Specific when-where-how instructions
4. TEMPORAL DISCOUNTING: Connect today's action to tomorrow's benefit
5. IDENTITY-BASED HABITS: "You're the kind of person who..."
6. AUTONOMY SUPPORT: Give choices, not commands
===============================================================================
"""

import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import time
import sqlite3
import math

class GeminiIntegration:
    def __init__(self, api_key=None):
        load_dotenv()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')

        if not self.api_key:
            print("WARNING: No GEMINI_API_KEY found. API calls will fail/fallback.")
        else:
            genai.configure(api_key=self.api_key)

        # Model hierarchy with fallback
        self.model_candidates = [
            'gemini-2.5-flash',         # Stable production model
            'gemini-2.0-flash',         # Fallback
        ]
        self.model_name = self._select_available_model()
        self.max_retries = 2

        self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
        print(f"[OK] Gemini Integration initialized with model: {self.model_name}")

    def _get_db_connection(self):
        """Returns a database connection."""
        return sqlite3.connect(self.db_path)

    def fetch_full_context(self, days=7, patient_id=None):
        """
        Fetches ALL available contextual data for Gemini to use.

        This goes BEYOND the 9 HMM features to include:
        - Voice check-in transcripts and sentiment
        - Screen time and digital behavior patterns
        - Walking speed and gait (fall risk)
        - Location patterns (time at home, distance traveled)
        - Food descriptions (not just carbs)
        - Active vs sedentary minutes
        - CGM patterns (for PREMIUM users)
        - Recent HMM trajectory (trend direction)

        Returns:
            dict: Rich contextual data for personalized insights
        """
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        now = int(time.time())
        start_time = now - (days * 24 * 3600)
        today_start = now - (now % 86400)

        context = {
            'voice_checkins': [],
            'recent_meals': [],
            'activity_pattern': {},
            'digital_behavior': {},
            'location_pattern': {},
            'gait_data': {},
            'sleep_details': {},
            'glucose_pattern': {},
            'hmm_trajectory': [],
            'medication_details': []
        }

        try:
            # ===== 1. VOICE CHECK-INS (Last 7 days) =====
            # Rich qualitative data - patient's own words!
            voice_rows = cursor.execute("""
                SELECT
                    datetime(timestamp_utc, 'unixepoch', 'localtime') as time,
                    transcript_text,
                    sentiment_score,
                    topics_detected
                FROM voice_checkins
                WHERE timestamp_utc >= ?
                ORDER BY timestamp_utc DESC
                LIMIT 10
            """, (start_time,)).fetchall()

            for row in voice_rows:
                context['voice_checkins'].append({
                    'time': row['time'],
                    'transcript': row['transcript_text'],
                    'sentiment': row['sentiment_score'],
                    'topics': row['topics_detected']
                })

            # ===== 2. RECENT MEALS (Last 3 days) =====
            # Food descriptions for cultural context
            food_rows = cursor.execute("""
                SELECT
                    datetime(timestamp_utc, 'unixepoch', 'localtime') as time,
                    meal_type,
                    description,
                    carbs_grams,
                    source_type
                FROM food_logs
                WHERE timestamp_utc >= ?
                ORDER BY timestamp_utc DESC
                LIMIT 15
            """, (now - 3*86400,)).fetchall()

            for row in food_rows:
                context['recent_meals'].append({
                    'time': row['time'],
                    'meal': row['meal_type'],
                    'description': row['description'],
                    'carbs': row['carbs_grams'],
                    'source': row['source_type']
                })

            # ===== 3. ACTIVITY PATTERN (Fitbit) =====
            # Note: fitbit_activity.date is stored as INTEGER (Unix epoch day_start).
            # start_time is also Unix epoch, so integer comparison is correct.
            activity_row = cursor.execute("""
                SELECT
                    AVG(steps) as avg_steps,
                    AVG(active_minutes) as avg_active_min,
                    AVG(sedentary_minutes) as avg_sedentary_min,
                    AVG(calories_burned) as avg_calories,
                    MAX(steps) as best_day_steps,
                    MIN(steps) as worst_day_steps
                FROM fitbit_activity
                WHERE CAST(date AS INTEGER) >= ?
            """, (start_time,)).fetchone()

            if activity_row and activity_row['avg_steps']:
                context['activity_pattern'] = {
                    'avg_steps': int(activity_row['avg_steps']) if activity_row['avg_steps'] else 0,
                    'avg_active_minutes': int(activity_row['avg_active_min']) if activity_row['avg_active_min'] else 0,
                    'avg_sedentary_minutes': int(activity_row['avg_sedentary_min']) if activity_row['avg_sedentary_min'] else 0,
                    'avg_calories': int(activity_row['avg_calories']) if activity_row['avg_calories'] else 0,
                    'best_day': int(activity_row['best_day_steps']) if activity_row['best_day_steps'] else 0,
                    'worst_day': int(activity_row['worst_day_steps']) if activity_row['worst_day_steps'] else 0
                }

            # ===== 4. DIGITAL BEHAVIOR (Screen time, typing) =====
            digital_row = cursor.execute("""
                SELECT
                    AVG(screen_time_seconds) as avg_screen_sec,
                    AVG(typing_speed_cpm) as avg_typing_speed,
                    AVG(typing_correction_rate) as avg_typo_rate,
                    SUM(social_interactions) as total_social
                FROM passive_metrics
                WHERE window_start_utc >= ?
            """, (start_time,)).fetchone()

            if digital_row:
                context['digital_behavior'] = {
                    'avg_screen_hours': round((digital_row['avg_screen_sec'] or 0) / 3600, 1),
                    'typing_speed': round(digital_row['avg_typing_speed'] or 0, 1),
                    'typo_rate': round((digital_row['avg_typo_rate'] or 0) * 100, 1),
                    'social_interactions': int(digital_row['total_social'] or 0)
                }

            # ===== 5. LOCATION PATTERN (Privacy-preserving) =====
            location_row = cursor.execute("""
                SELECT
                    AVG(time_at_home_seconds) as avg_home_sec,
                    AVG(max_distance_from_home_km) as avg_distance
                FROM passive_metrics
                WHERE window_start_utc >= ?
            """, (start_time,)).fetchone()

            if location_row:
                context['location_pattern'] = {
                    'avg_hours_at_home': round((location_row['avg_home_sec'] or 0) / 3600, 1),
                    'avg_max_distance_km': round(location_row['avg_distance'] or 0, 2)
                }

            # ===== 6. GAIT DATA (Fall risk) =====
            gait_row = cursor.execute("""
                SELECT
                    AVG(walking_speed_avg) as avg_speed,
                    AVG(gait_asymmetry_score) as avg_asymmetry
                FROM passive_metrics
                WHERE window_start_utc >= ? AND walking_speed_avg IS NOT NULL
            """, (start_time,)).fetchone()

            if gait_row and gait_row['avg_speed']:
                context['gait_data'] = {
                    'avg_walking_speed_mps': round(gait_row['avg_speed'], 2),
                    'gait_asymmetry': round(gait_row['avg_asymmetry'] or 0, 2)
                }

            # ===== 7. SLEEP DETAILS =====
            # Note: fitbit_sleep.date is stored as INTEGER (Unix epoch day_start).
            sleep_row = cursor.execute("""
                SELECT
                    AVG(total_sleep_minutes) as avg_sleep_min,
                    AVG(sleep_score) as avg_score,
                    MIN(total_sleep_minutes) as worst_night,
                    MAX(total_sleep_minutes) as best_night
                FROM fitbit_sleep
                WHERE CAST(date AS INTEGER) >= ?
            """, (start_time,)).fetchone()

            if sleep_row and sleep_row['avg_sleep_min']:
                context['sleep_details'] = {
                    'avg_hours': round((sleep_row['avg_sleep_min'] or 0) / 60, 1),
                    'avg_score': round(sleep_row['avg_score'] or 0, 0),
                    'worst_night_hours': round((sleep_row['worst_night'] or 0) / 60, 1),
                    'best_night_hours': round((sleep_row['best_night'] or 0) / 60, 1)
                }

            # ===== 8. GLUCOSE PATTERN (CGM if available) =====
            # Check for CGM data first (more granular)
            cgm_rows = cursor.execute("""
                SELECT glucose_value
                FROM cgm_readings
                WHERE timestamp_utc >= ?
                ORDER BY timestamp_utc DESC
            """, (now - 86400,)).fetchall()

            if cgm_rows:
                values = [r['glucose_value'] for r in cgm_rows]
                context['glucose_pattern'] = {
                    'source': 'CGM',
                    'readings_24h': len(values),
                    'min': round(min(values), 1),
                    'max': round(max(values), 1),
                    'avg': round(sum(values) / len(values), 1),
                    'time_in_range': round(sum(1 for v in values if 3.9 <= v <= 10.0) / len(values) * 100, 0)
                }
            else:
                # Fallback to manual readings
                manual_rows = cursor.execute("""
                    SELECT reading_value, source_type
                    FROM glucose_readings
                    WHERE reading_timestamp_utc >= ?
                """, (now - 86400,)).fetchall()

                if manual_rows:
                    values = [r['reading_value'] for r in manual_rows]
                    context['glucose_pattern'] = {
                        'source': 'Manual',
                        'readings_24h': len(values),
                        'min': round(min(values), 1),
                        'max': round(max(values), 1),
                        'avg': round(sum(values) / len(values), 1)
                    }

            # ===== 9. HMM TRAJECTORY (Trend Direction) =====
            hmm_rows = cursor.execute("""
                SELECT
                    datetime(timestamp_utc, 'unixepoch', 'localtime') as time,
                    detected_state,
                    confidence_score
                FROM hmm_states
                WHERE timestamp_utc >= ?
                ORDER BY timestamp_utc ASC
            """, (now - 3*86400,)).fetchall()  # Last 3 days

            for row in hmm_rows:
                context['hmm_trajectory'].append({
                    'time': row['time'],
                    'state': row['detected_state'],
                    'confidence': row['confidence_score']
                })

            # Derive trend
            if len(context['hmm_trajectory']) >= 2:
                states = [h['state'] for h in context['hmm_trajectory']]
                state_values = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}

                # Compare first half to second half
                mid = len(states) // 2
                first_half_avg = sum(state_values[s] for s in states[:mid]) / max(mid, 1)
                second_half_avg = sum(state_values[s] for s in states[mid:]) / max(len(states) - mid, 1)

                if second_half_avg < first_half_avg - 0.3:
                    context['trend'] = 'IMPROVING'
                elif second_half_avg > first_half_avg + 0.3:
                    context['trend'] = 'DECLINING'
                else:
                    context['trend'] = 'STABLE'
            else:
                context['trend'] = 'UNKNOWN'

            # ===== 10. MEDICATION DETAILS =====
            med_rows = cursor.execute("""
                SELECT
                    medication_name,
                    COUNT(*) as times_taken,
                    MAX(datetime(taken_timestamp_utc, 'unixepoch', 'localtime')) as last_taken
                FROM medication_logs
                WHERE taken_timestamp_utc >= ?
                AND (user_id IS NULL OR user_id = ?)
                GROUP BY medication_name
            """, (start_time, patient_id or 'P001')).fetchall()

            for row in med_rows:
                context['medication_details'].append({
                    'name': row['medication_name'],
                    'times_taken': row['times_taken'],
                    'last_taken': row['last_taken']
                })

        except Exception as e:
            print(f"[WARN] Error fetching context: {e}")

        conn.close()
        return context

    def _select_available_model(self):
        """
        Attempts to use the latest Gemini model, with fallbacks.
        Tests by listing available models from the API.
        """
        if not self.api_key:
            return self.model_candidates[-1]  # Default to oldest known model

        try:
            # List all available models
            available_models = [m.name for m in genai.list_models()]

            # Try each candidate in order
            for candidate in self.model_candidates:
                # Check if model exists in available models
                # Models are returned as "models/gemini-3.0-flash" format
                if any(candidate in model for model in available_models):
                    print(f"[OK] Found model: {candidate}")
                    return candidate

            # If no match found, fall back to last candidate
            print(f"[WARN] No preferred models found. Defaulting to: {self.model_candidates[-1]}")
            return self.model_candidates[-1]

        except Exception as e:
            print(f"[WARN] Could not query available models: {e}")
            print(f"       Defaulting to: {self.model_candidates[0]}")
            return self.model_candidates[0]

    def _get_model(self):
        """Lazy loader for model to prevent init errors if key missing."""
        return genai.GenerativeModel(self.model_name)

    def extract_glucose_from_photo(self, image_path):
        """
        Extracts glucose reading from photo of glucose meter.
        """
        if not self.api_key:
            return {'error': 'No API Key', 'value': None}

        # Validate Image
        if not os.path.exists(image_path):
            return {'error': 'Image file not found', 'value': None}

        prompt = """
        You are analyzing a photo of a glucose meter display.
        Extract ONLY the glucose reading number.
        
        Rules:
        - Return just the number (e.g., 8.5, 12.3, 6.2)
        - If you see both mmol/L and mg/dL, prefer mmol/L
        - Typical range: 4.0-20.0 mmol/L
        - If multiple numbers, choose the one that looks like the main reading
        - If unclear, return "ERROR"
        
        Return JSON format:
        { "value": 8.5, "unit": "mmol/L", "confidence": "high" }
        """

        try:
            model = self._get_model()
            
            # Read image for upload
            # In a real deployed scenario, we might use the file API or inline data
            with open(image_path, 'rb') as f:
                image_data = f.read()
                
            response = model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg", 
                    "data": image_data
                }
            ])
            
            # Parse JSON
            text = response.text.strip()
            # Clean md code blocks if present
            if text.startswith('```json'):
                text = text[7:-3]
            elif text.startswith('```'):
                text = text[3:-3]
                
            return json.loads(text)

        except Exception as e:
            print(f"OCR Error: {e}")
            return {
                'value': None,
                'unit': 'mmol/L',
                'confidence': 'low',
                'error': str(e)
            }
    
    def analyze_voice_sentiment(self, transcript):
        """
        Analyzes voice transcript for sentiment and health keywords.
        """
        if not self.api_key:
            # Safe Fallback for Offline/No-Key demo
            return {
                'sentiment_score': 0.0,
                'health_keywords': [],
                'urgency': 'low',
                'reasoning': 'Offline Mode'
            }

        prompt = f"""
        Analyze this patient's voice transcript for health sentiment.
        
        Transcript: "{transcript}"
        
        Extract:
        1. Sentiment score (-1.0 to +1.0)
           -1.0 = very negative/concerning (pain, distress)
           0.0 = neutral
           +1.0 = very positive (feeling great)
        
        2. Health keywords (fatigue, pain, dizziness, etc.)
        
        3. Urgency level: "high", "medium", "low"
        
        Return JSON format:
        {{
            "sentiment_score": -0.3,
            "health_keywords": ["tired"],
            "urgency": "low",
            "reasoning": "Patient reports fatigue"
        }}
        """
        
        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith('```json'): text = text[7:-3]
            elif text.startswith('```'): text = text[3:-3]
            
            return json.loads(text)
            
        except Exception as e:
            print(f"Sentiment Analysis Error: {e}")
            return {
                'sentiment_score': 0.0,
                'health_keywords': [],
                'urgency': 'low',
                'error': str(e)
            }
    
    def draft_sbar(self, state, metrics, conditions, medications, guidelines):
        """
        Generates a privacy-preserving SBAR report using Gemini.
        CRITICAL: Never sends Patient Name or ID. Only metrics and clinical context.
        """
        if not self.api_key:
            return {
                "Situation": "Offline Mode: Gemini API Key missing.",
                "Background": "Unable to fetch context.",
                "Assessment": f"State detected: {state}. Metrics: {metrics}",
                "Recommendation": "Please check API configuration."
            }

        prompt = f"""
        You are an expert Clinical Decision Support AI.
        Draft a concise SBAR (Situation, Background, Assessment, Recommendation) report for a nurse.

        INPUT CONTEXT (Anonymized):
        - Current HMM State: {state}
        - Clinical Conditions: {conditions}
        - Current Medications: {medications}
        - 24h Metrics: 
          * Avg Glucose: {metrics.get('glucose_avg')} mmol/L
          * Max Glucose: {metrics.get('glucose_max')} mmol/L
          * Adherence: {metrics.get('adherence_pct')}%
          * Sleep Quality: {metrics.get('sleep_quality')}/10 (~{metrics.get('sleep_hours')}h)
          * Steps: {metrics.get('steps')}

        CLINICAL GUIDELINES:
        {guidelines}

        INSTRUCTIONS:
        1. Situation: Start with the HMM State and the most critical metric.
        2. Background: Mention relevant history (conditions/meds) and recent trends (adherence).
        3. Assessment: Connect the dots. Why is the state {state}? (e.g. "Hyperglycemia likely due to 50% adherence").
        4. Recommendation: Specific, actionable steps for the nurse.

        OUTPUT FORMAT:
        Return ONLY a raw JSON object (no markdown formatting) with keys:
        {{
            "Situation": "...",
            "Background": "...",
            "Assessment": [ "Point 1", "Point 2" ],
            "Recommendation": "..."
        }}
        """

        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean potential markdown
            if text.startswith('```json'): text = text[7:-3]
            elif text.startswith('```'): text = text[3:-3]
            
            return json.loads(text.strip())
        except Exception as e:
            print(f"SBAR Synthesis Error: {e}")
            # Generate useful fallback SBAR from available data
            glucose_avg = metrics.get('glucose_avg', 0)
            adherence = metrics.get('adherence_pct', 0)
            steps = metrics.get('steps', 0)
            situation = f"Patient in {state} state."
            if glucose_avg > 10:
                situation += f" Glucose elevated at {glucose_avg:.1f} mmol/L."
            elif glucose_avg > 0:
                situation += f" Glucose at {glucose_avg:.1f} mmol/L."
            background = f"Conditions: {', '.join(conditions) if conditions else 'N/A'}. Medications: {', '.join(medications) if medications else 'N/A'}."
            assessment = []
            if state == "CRISIS":
                assessment.append("Patient in CRISIS state — immediate clinical review recommended.")
            elif state == "WARNING":
                assessment.append("Patient in WARNING state — monitor closely for deterioration.")
            if adherence < 80:
                assessment.append(f"Medication adherence low at {adherence:.0f}%.")
            if glucose_avg > 10:
                assessment.append(f"Hyperglycemia: avg glucose {glucose_avg:.1f} mmol/L exceeds target.")
            if not assessment:
                assessment.append(f"Metrics within acceptable range. Continue monitoring.")
            rec = "Continue current care plan." if state == "STABLE" else "Escalate to attending physician for review."
            return {
                "Situation": situation,
                "Background": background,
                "Assessment": assessment,
                "Recommendation": rec,
            }


    def generate_patient_insight(self, patient_profile, hmm_result, recent_observations, full_context=None):
        """
        [AGENTIC NODE v3.0 - DIAMOND ARCHITECTURE]
        Orchestrates the 4-Node Flow:
        1. Node 1 (HMM): Current State (Passed in args)
        2. Node 3A (Merlion): Future Risk (Calculated here)
        3. Node 2 (Gemini): Strategy Synthesis
        4. Node 3B (Sea-Lion): Cultural Delivery
        """
        # Lazy import to avoid circular defaults
        from merlion_risk_engine import MerlionRiskEngine
        from sealion_interface import SeaLionInterface

        if not self.api_key:
            return {
                "greeting": "Hello Mr. Tan",
                "message": "I noticed some changes in your health patterns. Please check your glucose.",
                "action_item": "Check Glucose",
                "tone": "Neutral"
            }

        # Fetch full context if not provided
        if full_context is None:
            full_context = self.fetch_full_context(days=7)

        # --- STEP 1: GROUND TRUTH (HMM + MERLION) ---
        
        # HMM Data
        state = hmm_result.get('current_state', 'UNKNOWN')
        confidence = hmm_result.get('confidence', 0)
        top_factors = hmm_result.get('top_factors', [])

        # Merlion Data (Future Risk)
        merlion = MerlionRiskEngine()
        # Extract glucose history from context or observations
        glucose_history = []
        if full_context.get('glucose_pattern') and full_context.get('glucose_pattern').get('readings_24h', 0) > 0:
             # Ideally fetch actual list, here we might have to mock if full history not in context dict yet
             # For now, let's look for it in the DB or use a placeholder
             conn = self._get_db_connection()
             rows = conn.execute("SELECT reading_value FROM glucose_readings ORDER BY reading_timestamp_utc DESC LIMIT 12").fetchall()
             glucose_history = [r[0] for r in rows][::-1] # Reverse to chronological
             conn.close()

        merlion_risk = merlion.calculate_risk(glucose_history)
        
        # --- STEP 2: CONTEXT SYNTHESIS (GEMINI INPUTS) ---

        # [HMM Metrics Construction - Preserved from previous version]
        hmm_metrics = []
        glucose = recent_observations.get('glucose_avg')
        if glucose is not None:
            if glucose < 3.9: hmm_metrics.append(f"🚨 GLUCOSE: {glucose:.1f} mmol/L - HYPOGLYCEMIA RISK!")
            elif glucose < 5.5: hmm_metrics.append(f"✅ GLUCOSE: {glucose:.1f} mmol/L - Excellent")
            elif glucose < 7.0: hmm_metrics.append(f"✅ GLUCOSE: {glucose:.1f} mmol/L - Good")
            elif glucose < 10.0: hmm_metrics.append(f"⚠️ GLUCOSE: {glucose:.1f} mmol/L - Elevated")
            else: hmm_metrics.append(f"🚨 GLUCOSE: {glucose:.1f} mmol/L - HIGH")

        glucose_var = recent_observations.get('glucose_variability')
        if glucose_var is not None:
            if glucose_var < 20:
                hmm_metrics.append(f"✅ STABILITY: {glucose_var:.0f}% CV - Very stable (target <36%)")
            elif glucose_var < 36:
                hmm_metrics.append(f"✅ STABILITY: {glucose_var:.0f}% CV - Acceptable variability")
            else:
                hmm_metrics.append(f"⚠️ STABILITY: {glucose_var:.0f}% CV - Roller-coaster pattern. Meals timing issue?")

        meds = recent_observations.get('meds_adherence')
        if meds is not None:
            pct = meds * 100
            if pct >= 90:
                hmm_metrics.append(f"✅ MEDICATION: {pct:.0f}% adherence - Excellent! Keep it up.")
            elif pct >= 70:
                hmm_metrics.append(f"⚠️ MEDICATION: {pct:.0f}% adherence - Missed {int((1-meds)*14)} doses this week")
            else:
                hmm_metrics.append(f"🚨 MEDICATION: {pct:.0f}% adherence - CRITICAL. Each missed dose = ~0.5% HbA1c rise")

        steps = recent_observations.get('steps_daily')
        if steps is not None:
            if steps >= 7000:
                hmm_metrics.append(f"✅ STEPS: {int(steps):,}/day - Great! Hitting WHO target.")
            elif steps >= 4000:
                hmm_metrics.append(f"⚠️ STEPS: {int(steps):,}/day - Good, but {7000-int(steps):,} more would be better")
            elif steps >= 2000:
                hmm_metrics.append(f"⚠️ STEPS: {int(steps):,}/day - Low activity. Even 10 min walk helps!")
            else:
                hmm_metrics.append(f"🚨 STEPS: {int(steps):,}/day - Very sedentary. Is something wrong?")

        hr = recent_observations.get('resting_hr')
        if hr is not None:
            if 55 <= hr <= 75:
                hmm_metrics.append(f"✅ HEART RATE: {int(hr)} bpm - Normal resting rate")
            elif hr < 55:
                hmm_metrics.append(f"⚠️ HEART RATE: {int(hr)} bpm - Low. Are you on beta-blockers?")
            elif hr <= 90:
                hmm_metrics.append(f"⚠️ HEART RATE: {int(hr)} bpm - Slightly elevated. Stress? Caffeine?")
            else:
                hmm_metrics.append(f"🚨 HEART RATE: {int(hr)} bpm - HIGH. Rest and check again.")

        hrv = recent_observations.get('hrv_rmssd')
        if hrv is not None:
            if hrv >= 40:
                hmm_metrics.append(f"✅ HRV: {hrv:.0f}ms - Good autonomic function (stress recovery OK)")
            elif hrv >= 20:
                hmm_metrics.append(f"⚠️ HRV: {hrv:.0f}ms - Moderate stress. Consider relaxation.")
            else:
                hmm_metrics.append(f"🚨 HRV: {hrv:.0f}ms - LOW. High stress or early neuropathy sign.")

        sleep = recent_observations.get('sleep_quality')
        if sleep is not None:
            if sleep >= 7:
                hmm_metrics.append(f"✅ SLEEP: {sleep:.1f}/10 - Well rested")
            elif sleep >= 5:
                hmm_metrics.append(f"⚠️ SLEEP: {sleep:.1f}/10 - Could be better. Affects glucose next day!")
            else:
                hmm_metrics.append(f"🚨 SLEEP: {sleep:.1f}/10 - Poor sleep = 23% higher glucose variability")

        carbs = recent_observations.get('carbs_intake')
        if carbs is not None:
            if carbs <= 150:
                hmm_metrics.append(f"✅ CARBS: {int(carbs)}g/day - Good control")
            elif carbs <= 200:
                hmm_metrics.append(f"⚠️ CARBS: {int(carbs)}g/day - Moderate. Watch portion sizes.")
            else:
                hmm_metrics.append(f"🚨 CARBS: {int(carbs)}g/day - High! This explains glucose elevation.")

        social = recent_observations.get('social_engagement')
        if social is not None:
            if social >= 5:
                hmm_metrics.append(f"✅ SOCIAL: {int(social)} interactions - Socially active!")
            elif social >= 2:
                hmm_metrics.append(f"⚠️ SOCIAL: {int(social)} interactions - A bit quiet. Call a friend?")
            else:
                hmm_metrics.append(f"🚨 SOCIAL: {int(social)} interactions - Isolated. Loneliness affects health.")

        # Re-build Voice/Activity/etc context strings (same as before)
        voice_context = ""
        if full_context.get('voice_checkins'):
            recent_voice = full_context['voice_checkins'][:3]  # Last 3
            voice_entries = []
            for v in recent_voice:
                sentiment_emoji = "😊" if (v.get('sentiment') or 0) > 0.3 else "😟" if (v.get('sentiment') or 0) < -0.3 else "😐"
                if v.get('transcript'):
                    voice_entries.append(f"{sentiment_emoji} \"{v['transcript'][:100]}...\" (sentiment: {v.get('sentiment', 0):.2f})")
            if voice_entries:
                voice_context = "PATIENT'S OWN WORDS (from voice check-ins):\n" + "\n".join(voice_entries)

        # --- 3. FOOD CONTEXT (Cultural) ---
        food_context = ""
        if full_context.get('recent_meals'):
            meals = full_context['recent_meals'][:5]
            meal_items = []
            for m in meals:
                desc = m.get('description') or m.get('meal', 'Unknown')
                carbs_val = m.get('carbs')
                meal_items.append(f"- {m.get('meal', 'Meal')}: {desc} ({carbs_val}g carbs)" if carbs_val else f"- {desc}")
            if meal_items:
                food_context = "RECENT MEALS:\n" + "\n".join(meal_items)

        # --- 4. ACTIVITY PATTERN ---
        activity_context = ""
        if full_context.get('activity_pattern'):
            ap = full_context['activity_pattern']
            activity_context = f"""ACTIVITY PATTERN (7-day):
- Average: {ap.get('avg_steps', 0):,} steps/day
- Active time: {ap.get('avg_active_minutes', 0)} min/day
- Sedentary time: {ap.get('avg_sedentary_minutes', 0)} min/day
- Best day: {ap.get('best_day', 0):,} steps
- Worst day: {ap.get('worst_day', 0):,} steps"""

        # --- 5. SLEEP PATTERN ---
        sleep_context = ""
        if full_context.get('sleep_details'):
            sd = full_context['sleep_details']
            sleep_context = f"""SLEEP PATTERN:
- Average: {sd.get('avg_hours', 0)} hours/night
- Best night: {sd.get('best_night_hours', 0)} hours
- Worst night: {sd.get('worst_night_hours', 0)} hours"""

        # --- 6. GLUCOSE PATTERN (CGM if available) ---
        glucose_context = ""
        if full_context.get('glucose_pattern'):
            gp = full_context['glucose_pattern']
            glucose_context = f"""GLUCOSE PATTERN (24h, {gp.get('source', 'Manual')}):
- Range: {gp.get('min', 0)} - {gp.get('max', 0)} mmol/L
- Average: {gp.get('avg', 0)} mmol/L
- Time in Range (3.9-10): {gp.get('time_in_range', 'N/A')}%
- Readings: {gp.get('readings_24h', 0)}"""

        # --- 7. TREND DIRECTION (from HMM trajectory) ---
        trend = full_context.get('trend', 'UNKNOWN')
        trend_context = f"HEALTH TREND: {trend}"
        if trend == 'IMPROVING':
            trend_context += " 📈 (Getting better! Reinforce positive behavior)"
        elif trend == 'DECLINING':
            trend_context += " 📉 (Getting worse. Intervention needed!)"
        else:
            trend_context += " ➡️ (Stable trajectory)"

        # --- 8. GAIT/FALL RISK ---
        gait_context = ""
        if full_context.get('gait_data'):
            gd = full_context['gait_data']
            speed = gd.get('avg_walking_speed_mps', 0)
            asymmetry = gd.get('gait_asymmetry', 0)
            if speed < 0.8 or asymmetry > 0.15:
                gait_context = f"⚠️ FALL RISK: Walking speed {speed} m/s, asymmetry {asymmetry:.1%}. Watch for trips!"

        # --- 9. DIGITAL BEHAVIOR ---
        digital_context = ""
        if full_context.get('digital_behavior'):
            db = full_context['digital_behavior']
            if db.get('avg_screen_hours', 0) > 4:
                digital_context = f"📱 Screen time: {db['avg_screen_hours']}h/day (high - may affect sleep)"

        # --- STEP 3: STRATEGIC REASONING (GEMINI) ---
        
        prompt = f"""
        You are Bewo (Node 2), the Medical Strategist.
        
        INPUTS:
        1. CURRENT STATE (HMM): {state} (Conf: {confidence:.0%})
        2. FUTURE RISK (MERLION): 
           - Crisis Prob (45min): {merlion_risk['prob_crisis_45min']:.0%}
           - Velocity: {merlion_risk.get('velocity', 0)} mmol/L/min
        3. PATIENT: Patient ({patient_profile.get('age', 67)}yo)

        Your goal is to devise a CLINICAL STRATEGY.
        Do NOT write the final dialogue. Write the MEDICAL INTENT.
        
        Merlion Alert:
        If Crisis Prob > 50%, you MUST prioritize averting the crash.
        
        RETURN JSON:
        {{
            "medical_intent": "Prevent hypoglycemia immediately",
            "core_message": "Glucose is dropping fast. Eat 15g carbs now.",
            "recommended_action": "Eat 1 piece of bread or drink half cup juice",
            "tone": "Urgent"
        }}
        """

        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith('```json'): text = text[7:-3]
            strategy = json.loads(text)
        except Exception as e:
            strategy = {
                "medical_intent": "General Checkup",
                "core_message": "Please check your glucose levels.",
                "recommended_action": "Measure Glucose",
                "tone": "Neutral"
            }

        # --- STEP 4: CULTURAL TRANSLATION (SEA-LION) ---
        
        sealion = SeaLionInterface(self.api_key)
        
        # Determine Register based on profile
        # For Mr. Tan (67), we use Singlish Elder
        register = "singlish_elder"
        
        final_message = sealion.translate_message(
            strategy['core_message'] + " " + strategy['recommended_action'],
            target_dialect=register,
            mood=strategy['tone']
        )
        
        return {
            "greeting": f"Hello {patient_profile.get('name', 'there')}",
            "message": final_message, # This is now the Singlish version
            "action_item": strategy['recommended_action'],
            "tone": strategy['tone'],
            "merlion_risk": merlion_risk,   # Return for UI visualization
            "original_strategy": strategy   # Return for transparency
        }

    def get_cached_daily_insight(self, user_id='current_user'):
        """
        Retrieves cached daily insight if it exists and is still valid.

        Returns cached insight if:
        - Generated today AND
        - HMM state hasn't changed since generation

        Returns None if cache miss (triggers new generation).
        """
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        # Get today's date as YYYYMMDD integer
        from datetime import datetime
        today = int(datetime.now().strftime('%Y%m%d'))

        try:
            # Check for today's cached insight
            row = conn.execute("""
                SELECT insight_json, hmm_state_at_generation, generated_at_utc
                FROM daily_insights
                WHERE user_id = ? AND date = ?
            """, (user_id, today)).fetchone()

            if row:
                # Check if HMM state has changed since generation
                current_state_row = conn.execute("""
                    SELECT detected_state FROM hmm_states
                    ORDER BY timestamp_utc DESC LIMIT 1
                """).fetchone()

                current_state = current_state_row['detected_state'] if current_state_row else None
                cached_state = row['hmm_state_at_generation']

                # Return cached if state hasn't changed
                if current_state == cached_state:
                    return json.loads(row['insight_json'])
                else:
                    # State changed - invalidate cache
                    print(f"[CACHE] State changed from {cached_state} to {current_state} - regenerating insight")
                    return None

            return None  # No cache for today

        except Exception as e:
            print(f"[WARN] Cache lookup error: {e}")
            return None
        finally:
            conn.close()

    def cache_daily_insight(self, insight, hmm_state, user_id='current_user',
                           trigger_reason='DAILY', pattern_detected=None):
        """
        Caches a daily insight to avoid repeated Gemini API calls.
        """
        conn = self._get_db_connection()

        from datetime import datetime
        today = int(datetime.now().strftime('%Y%m%d'))
        now = int(time.time())

        try:
            # Use INSERT OR REPLACE to handle existing entries
            conn.execute("""
                INSERT OR REPLACE INTO daily_insights
                (user_id, date, insight_json, generated_at_utc, hmm_state_at_generation,
                 pattern_detected, trigger_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, today, json.dumps(insight), now, hmm_state,
                  pattern_detected, trigger_reason))
            conn.commit()
            print(f"[CACHE] Daily insight cached for {today}")
        except Exception as e:
            print(f"[WARN] Failed to cache insight: {e}")
        finally:
            conn.close()

    def detect_food_glucose_patterns(self, days=7):
        """
        Analyzes correlations between food descriptions and glucose spikes.

        Returns patterns like:
        - "Char kway teow dinners correlate with +2.1 higher morning glucose"
        - "Rice portions >1 cup correlate with post-meal spikes >10 mmol/L"

        Only returns patterns with:
        - At least 3 occurrences
        - Correlation confidence > 60%
        """
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        patterns = []

        try:
            now = int(time.time())
            start_time = now - (days * 24 * 3600)

            # Get all meals with their timestamps
            meals = conn.execute("""
                SELECT timestamp_utc, description, carbs_grams, meal_type
                FROM food_logs
                WHERE timestamp_utc >= ? AND description IS NOT NULL
                ORDER BY timestamp_utc ASC
            """, (start_time,)).fetchall()

            # Get all glucose readings
            glucose_readings = conn.execute("""
                SELECT reading_timestamp_utc, reading_value
                FROM glucose_readings
                WHERE reading_timestamp_utc >= ?
                ORDER BY reading_timestamp_utc ASC
            """, (start_time,)).fetchall()

            if not meals or not glucose_readings:
                return patterns

            # Build a simple pattern detector
            # Look for foods that appear multiple times and check glucose 2-4h after
            food_glucose_map = {}  # food_keyword -> [glucose_deltas]

            for meal in meals:
                meal_time = meal['timestamp_utc']
                desc = (meal['description'] or '').lower()

                # Find glucose readings 2-4 hours after meal
                post_meal_readings = [
                    g['reading_value'] for g in glucose_readings
                    if meal_time + 7200 <= g['reading_timestamp_utc'] <= meal_time + 14400
                ]

                # Find baseline glucose (1h before meal)
                baseline_readings = [
                    g['reading_value'] for g in glucose_readings
                    if meal_time - 3600 <= g['reading_timestamp_utc'] <= meal_time
                ]

                if post_meal_readings and baseline_readings:
                    delta = sum(post_meal_readings)/len(post_meal_readings) - sum(baseline_readings)/len(baseline_readings)

                    # Extract food keywords (simple tokenization)
                    keywords = ['char kway teow', 'nasi lemak', 'mee goreng', 'rice',
                               'noodles', 'bread', 'roti prata', 'chicken rice',
                               'laksa', 'mee siam', 'carrot cake', 'popiah']

                    for kw in keywords:
                        if kw in desc:
                            if kw not in food_glucose_map:
                                food_glucose_map[kw] = []
                            food_glucose_map[kw].append(delta)

            # Find patterns with 3+ occurrences and significant effect
            for food, deltas in food_glucose_map.items():
                if len(deltas) >= 3:
                    avg_delta = sum(deltas) / len(deltas)
                    if avg_delta > 1.5:  # Significant spike
                        patterns.append({
                            'food': food,
                            'avg_glucose_increase': round(avg_delta, 1),
                            'occurrences': len(deltas),
                            'insight': f"When you eat {food}, your glucose rises ~{avg_delta:.1f} mmol/L on average ({len(deltas)} times observed)"
                        })

            # Sort by impact
            patterns.sort(key=lambda x: x['avg_glucose_increase'], reverse=True)

        except Exception as e:
            print(f"[WARN] Pattern detection error: {e}")
        finally:
            conn.close()

        return patterns[:3]  # Return top 3 patterns

    def generate_daily_insight(self, patient_profile, force_regenerate=False):
        """
        [DAILY COMPANION - Cost Optimized]

        Generates a morning briefing insight with:
        - Yesterday's health summary
        - Pattern insights (food → glucose correlations)
        - ONE high-impact action for today
        - Voucher status (loss aversion)
        - Behavioral psychology framing

        Uses caching to minimize API calls:
        - Returns cached insight if valid (same day, same HMM state)
        - Only calls Gemini API when cache miss or state change

        Args:
            patient_profile: dict with name, age, conditions
            force_regenerate: bool - bypass cache (for manual refresh)

        Returns:
            dict with greeting, yesterday_summary, pattern_insight, todays_focus,
                 voucher_status, psychology_applied, tone
        """
        user_id = 'current_user'

        # Check cache first (unless forced regeneration)
        if not force_regenerate:
            cached = self.get_cached_daily_insight(user_id)
            if cached:
                print("[GEMINI] Returning cached daily insight")
                return cached

        print("[GEMINI] Generating new daily insight...")

        # Fetch full context
        full_context = self.fetch_full_context(days=7)

        # Detect food-glucose patterns
        food_patterns = self.detect_food_glucose_patterns(days=7)

        # Get current HMM state
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        hmm_row = conn.execute("""
            SELECT detected_state, confidence_score, input_vector_snapshot
            FROM hmm_states ORDER BY timestamp_utc DESC LIMIT 1
        """).fetchone()

        current_state = hmm_row['detected_state'] if hmm_row else 'UNKNOWN'
        confidence = hmm_row['confidence_score'] if hmm_row else 0
        recent_obs = json.loads(hmm_row['input_vector_snapshot']) if hmm_row and hmm_row['input_vector_snapshot'] else {}

        # Get voucher status
        voucher_row = conn.execute("""
            SELECT current_value FROM voucher_tracker
            ORDER BY week_start_utc DESC LIMIT 1
        """).fetchone()
        voucher_balance = voucher_row['current_value'] if voucher_row else 5.00

        conn.close()

        # Build pattern insight text
        pattern_text = ""
        if food_patterns:
            pattern_text = "\n".join([p['insight'] for p in food_patterns])

        # Build yesterday's metrics summary
        yesterday_metrics = []
        if recent_obs.get('glucose_avg'):
            yesterday_metrics.append(f"Glucose avg: {recent_obs['glucose_avg']:.1f} mmol/L")
        if recent_obs.get('steps_daily'):
            yesterday_metrics.append(f"Steps: {int(recent_obs['steps_daily']):,}")
        if recent_obs.get('meds_adherence'):
            yesterday_metrics.append(f"Meds: {recent_obs['meds_adherence']*100:.0f}% taken")

        # Construct the prompt
        prompt = f"""
You are Bewo, an AI Health Companion delivering a MORNING BRIEFING to an elderly diabetic patient in Singapore.

═══════════════════════════════════════════════════════════════════════════════
PATIENT PROFILE
═══════════════════════════════════════════════════════════════════════════════
Name: {patient_profile.get('name', 'Mr. Tan')}
Age: {patient_profile.get('age', 67)}
Conditions: {patient_profile.get('conditions', 'Type 2 Diabetes')}

═══════════════════════════════════════════════════════════════════════════════
CURRENT STATE
═══════════════════════════════════════════════════════════════════════════════
HMM State: {current_state} (Confidence: {confidence:.0%})
Trend: {full_context.get('trend', 'UNKNOWN')}

═══════════════════════════════════════════════════════════════════════════════
YESTERDAY'S METRICS
═══════════════════════════════════════════════════════════════════════════════
{chr(10).join(yesterday_metrics) if yesterday_metrics else "No data from yesterday"}

═══════════════════════════════════════════════════════════════════════════════
DETECTED PATTERNS (Food → Glucose Correlations)
═══════════════════════════════════════════════════════════════════════════════
{pattern_text if pattern_text else "No strong patterns detected yet (need more data)"}

═══════════════════════════════════════════════════════════════════════════════
VOUCHER STATUS
═══════════════════════════════════════════════════════════════════════════════
Current Balance: ${voucher_balance:.2f}
(Started at $5.00 - loses $1 for each missed glucose log or medication)

═══════════════════════════════════════════════════════════════════════════════
BEHAVIORAL PSYCHOLOGY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. Use LOSS AVERSION: "Don't lose your ${voucher_balance:.2f}" not "Keep your money"
2. Use IMPLEMENTATION INTENTIONS: Specific when-where-how for today's action
3. Keep it SHORT - elderly patients don't read long messages
4. Use Singlish naturally (lah, lor, can/cannot)
5. Reference SPECIFIC numbers from the data above
6. If pattern detected, mention it conversationally

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Generate a warm, personalized MORNING BRIEFING.

Return JSON:
{{
    "greeting": "Warm morning greeting with patient name",
    "yesterday_summary": "1 sentence summarizing yesterday's key metric",
    "pattern_insight": "If pattern detected, mention it. Otherwise null.",
    "todays_focus": "ONE specific action with implementation intention (when/where/how)",
    "voucher_status": "Loss-framed reminder about voucher balance",
    "psychology_applied": "Which principles you used",
    "tone": "Celebratory / Encouraging / Concerned / Urgent"
}}
"""

        if not self.api_key:
            fallback = {
                "greeting": f"Good morning {patient_profile.get('name', 'Mr. Tan')}!",
                "yesterday_summary": "Your health data looks stable.",
                "pattern_insight": None,
                "todays_focus": "Remember to take your medication after breakfast",
                "voucher_status": f"You have ${voucher_balance:.2f} remaining - keep it up!",
                "psychology_applied": "Fallback mode - no API key",
                "tone": "Encouraging"
            }
            return fallback

        try:
            model = self._get_model()
            response = model.generate_content(prompt)

            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

            insight = json.loads(text)

            # Cache the result
            pattern_summary = food_patterns[0]['food'] if food_patterns else None
            self.cache_daily_insight(insight, current_state, user_id,
                                    trigger_reason='DAILY',
                                    pattern_detected=pattern_summary)

            return insight

        except Exception as e:
            print(f"Daily Insight Error: {e}")
            return {
                "greeting": f"Good morning {patient_profile.get('name', 'there')}!",
                "yesterday_summary": "Let me check your health data...",
                "pattern_insight": None,
                "todays_focus": "Start with your morning medication",
                "voucher_status": f"Your voucher balance: ${voucher_balance:.2f}",
                "psychology_applied": "Error fallback",
                "tone": "System"
            }

    def log_state_change(self, previous_state, new_state, confidence, user_id='current_user'):
        """
        Logs a state change to the database for tracking and alerting.

        Called by HMM when state transitions (STABLE→WARNING, WARNING→CRISIS, etc.)
        """
        conn = self._get_db_connection()
        now = int(time.time())

        try:
            conn.execute("""
                INSERT INTO state_change_alerts
                (user_id, timestamp_utc, previous_state, new_state, confidence_score)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, now, previous_state, new_state, confidence))
            conn.commit()
            print(f"[ALERT] State change logged: {previous_state} → {new_state}")
            return True
        except Exception as e:
            print(f"[WARN] Failed to log state change: {e}")
            return False
        finally:
            conn.close()

    def get_pending_alerts(self, user_id='current_user'):
        """
        Gets unprocessed state change alerts for the nurse portal.
        """
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        try:
            rows = conn.execute("""
                SELECT id, timestamp_utc, previous_state, new_state, confidence_score,
                       alert_sent, sbar_generated, nurse_notified
                FROM state_change_alerts
                WHERE user_id = ? AND dismissed = 0
                ORDER BY timestamp_utc DESC
                LIMIT 10
            """, (user_id,)).fetchall()

            return [dict(row) for row in rows]
        except Exception as e:
            print(f"[WARN] Failed to get pending alerts: {e}")
            return []
        finally:
            conn.close()

    # ==========================================================================
    # AGENTIC BEWO v4.0 - FULL HMM INTEGRATION + AGENTIC CAPABILITIES
    # ==========================================================================

    # Master System Prompt for Agentic AI
    AGENTIC_SYSTEM_PROMPT = """
═══════════════════════════════════════════════════════════════════════════════
BEWO AGENTIC AI - SYSTEM INSTRUCTIONS v4.0
═══════════════════════════════════════════════════════════════════════════════

You are Bewo, an AI Health Companion for elderly diabetic patients in Singapore.
You have access to comprehensive health intelligence from the HMM (Hidden Markov Model)
inference engine and can take ACTIONS on behalf of the patient.

═══════════════════════════════════════════════════════════════════════════════
CORE PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

1. SAFETY FIRST
   - Never recommend stopping medications
   - Never diagnose - you support, not replace doctors
   - Escalate to nurse/doctor for: chest pain, severe hypo (<3.0), confusion
   - Always err on the side of caution

2. ELDERLY-APPROPRIATE COMMUNICATION
   - Short sentences (max 15 words)
   - Use Singlish naturally (lah, lor, can, cannot, aiyo)
   - Never use medical jargon without explanation
   - Be warm like a family member, not clinical
   - Use positive framing when possible

3. BEHAVIORAL PSYCHOLOGY (Apply these)
   - LOSS AVERSION: "Don't lose your $5" > "Keep your $5"
   - IMPLEMENTATION INTENTIONS: "After breakfast, take the blue pill with water"
   - SOCIAL PROOF: "Other patients your age find this helpful"
   - AUTONOMY: Give choices, not commands
   - TEMPORAL BRIDGING: Connect today's action to future benefit

4. PROACTIVE, NOT REACTIVE
   - Use predictive data to PREVENT crises, not just respond
   - If risk is rising, intervene BEFORE the crisis
   - Celebrate improvements to reinforce good behavior

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE ACTIONS (You can trigger these)
═══════════════════════════════════════════════════════════════════════════════

When you determine an action is needed, include it in your response JSON:

1. SET_REMINDER
   - Purpose: Schedule a reminder for medication, glucose check, exercise
   - Parameters: {time: "HH:MM", message: "...", repeat: "daily|once"}
   - Use when: Patient needs prompting for adherence

2. BOOK_APPOINTMENT
   - Purpose: Schedule clinic visit or teleconsult
   - Parameters: {type: "clinic|teleconsult", urgency: "routine|soon|urgent", reason: "..."}
   - Use when: Health metrics suggest medical review needed

3. ALERT_NURSE
   - Purpose: Send alert to assigned nurse with SBAR summary
   - Parameters: {priority: "low|medium|high|critical", reason: "..."}
   - Use when: State is WARNING/CRISIS or significant deterioration

4. ALERT_FAMILY
   - Purpose: Notify family caregiver
   - Parameters: {message: "...", include_metrics: true|false}
   - Use when: Patient needs support or missed multiple check-ins

5. AWARD_VOUCHER
   - Purpose: Give bonus voucher for good behavior
   - Parameters: {amount: 1-5, reason: "..."}
   - Use when: Patient achieves streak or significant improvement

6. REQUEST_MEDICATION_VIDEO
   - Purpose: Ask patient to record medication intake
   - Parameters: {medication: "...", gentle: true}
   - Use when: Adherence is low and needs verification

7. SUGGEST_ACTIVITY
   - Purpose: Recommend specific activity
   - Parameters: {activity: "walk|stretch|rest|hydrate", duration: "X mins", reason: "..."}
   - Use when: Activity metrics are low or stress is high

8. ESCALATE_TO_DOCTOR
   - Purpose: Flag for doctor review (serious)
   - Parameters: {reason: "...", metrics_snapshot: {...}}
   - Use when: Crisis state or safety concern

═══════════════════════════════════════════════════════════════════════════════
INTERPRETING HMM DATA
═══════════════════════════════════════════════════════════════════════════════

You will receive:

1. CURRENT STATE: STABLE / WARNING / CRISIS
   - STABLE: All good, reinforce positive behavior
   - WARNING: Intervention needed, prevent deterioration
   - CRISIS: Urgent action, may need nurse/doctor

2. CONFIDENCE: How sure the model is (0-100%)
   - >80%: Trust the state
   - 50-80%: State likely correct but monitor
   - <50%: Insufficient data, ask for more check-ins

3. PREDICTIVE RISK (Monte Carlo Simulation)
   - prob_crisis_48h: Chance of crisis in next 48 hours
   - expected_hours_to_crisis: When crisis might occur
   - This is PREDICTIVE - use it to PREVENT, not scare

4. COUNTERFACTUAL ANALYSIS ("What If" scenarios)
   - Shows impact of potential interventions
   - Use this to motivate: "If you take your medicine, risk drops by X%"

5. TOP CONTRIBUTING FACTORS
   - Which health metrics are driving the state
   - Focus your message on the TOP 1-2 factors

6. TREND: IMPROVING / STABLE / DECLINING
   - IMPROVING: Celebrate and reinforce
   - STABLE: Maintain current behavior
   - DECLINING: Intervene before it worsens

═══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

Always return valid JSON:
{
    "message_to_patient": "Your warm, Singlish message to the patient",
    "internal_reasoning": "Your medical reasoning (not shown to patient)",
    "tone": "celebratory|encouraging|concerned|urgent|calm",
    "actions": [
        {"action": "SET_REMINDER", "params": {...}},
        {"action": "ALERT_NURSE", "params": {...}}
    ],
    "priority_factor": "The #1 thing patient should focus on",
    "follow_up_needed": true|false,
    "escalation_needed": true|false
}

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Example 1 - Good day, reinforce behavior:
State: STABLE, Trend: IMPROVING, Risk: 5%
→ "Wah Uncle Tan! Your numbers looking good today leh! Yesterday walk 6000 steps - shiok! Keep it up, tonight after dinner take your medicine with water, can?"
→ Actions: [AWARD_VOUCHER if streak achieved]

Example 2 - Warning signs, gentle intervention:
State: WARNING, Trend: DECLINING, Risk: 35%, Top factor: meds_adherence at 60%
→ "Uncle, I notice you missed some medicine this week lah. Aiyo, don't like that - each missed dose makes sugar go up. Tonight 8pm I remind you ok? Your voucher still got $4, don't want to lose right?"
→ Actions: [SET_REMINDER, ALERT_NURSE priority:medium]

Example 3 - Crisis, urgent but calm:
State: CRISIS, Risk: 78%, Glucose: 18.5 mmol/L
→ "Uncle Tan, your sugar quite high now - 18.5. Don't panic, but please drink water and rest. Nurse Jenny will call you in 10 minutes ok? Don't eat anything sweet first."
→ Actions: [ALERT_NURSE priority:critical, ALERT_FAMILY]
"""

    def generate_agentic_response_full(self, patient_profile, hmm_engine, observations, user_id='current_user'):
        """
        [AGENTIC BEWO v4.0 - Full HMM-integrated version]

        Generates a fully agentic response using ALL available HMM intelligence.

        This method:
        1. Runs HMM inference to get current state + predictions
        2. Runs Monte Carlo simulation for crisis probability
        3. Runs counterfactual analysis for intervention impact
        4. Passes everything to Gemini with comprehensive system prompt
        5. Parses response and executes any triggered actions

        Args:
            patient_profile: dict with name, age, conditions, medications
            hmm_engine: HMMEngine instance (already initialized)
            observations: List of observation dicts for HMM
            user_id: Patient identifier

        Returns:
            dict with message, actions taken, and full context
        """
        from hmm_engine import HMMEngine, STATES

        if not observations:
            return {
                "message_to_patient": "Hello! Please do a health check-in so I can help you better.",
                "actions": [],
                "error": "No observations available"
            }

        # =====================================================================
        # STEP 1: RUN HMM INFERENCE
        # =====================================================================
        hmm_result = hmm_engine.run_inference(observations, patient_id=user_id)

        current_state = hmm_result.get('current_state', 'UNKNOWN')
        confidence = hmm_result.get('confidence', 0)
        state_probs = hmm_result.get('state_probabilities', {})
        top_factors = hmm_result.get('top_factors', [])
        risk_48h = hmm_result.get('predictions', {}).get('risk_48h', 0)
        risk_12h = hmm_result.get('predictions', {}).get('risk_12h', 0)

        # Get latest observation for current metrics
        latest_obs = observations[-1] if observations else {}

        # =====================================================================
        # STEP 2: RUN MONTE CARLO PREDICTION
        # =====================================================================
        monte_carlo_result = None
        try:
            monte_carlo_result = hmm_engine.predict_time_to_crisis(
                latest_obs,
                horizon_hours=48,
                num_simulations=2000  # Balance speed vs accuracy
            )
        except Exception as e:
            print(f"[WARN] Monte Carlo failed: {e}")
            monte_carlo_result = {
                "prob_crisis_percent": risk_48h * 100,
                "risk_level": "UNKNOWN",
                "error": str(e)
            }

        # =====================================================================
        # STEP 3: RUN COUNTERFACTUAL ANALYSIS
        # =====================================================================
        counterfactuals = {}
        current_probs = [state_probs.get(s, 0) for s in STATES]

        # Test key interventions
        intervention_scenarios = {
            "perfect_medication": {"meds_adherence": 0.95},
            "good_exercise": {"steps_daily": 6000},
            "better_sleep": {"sleep_quality": 8.0},
            "lower_carbs": {"carbs_intake": 130}
        }

        for scenario_name, intervention in intervention_scenarios.items():
            try:
                result = hmm_engine.simulate_intervention(current_probs, intervention)
                if result.get('validity') == 'VALID':
                    counterfactuals[scenario_name] = {
                        "intervention": intervention,
                        "risk_reduction_pct": round(result.get('improvement_pct', 0), 1),
                        "new_crisis_risk": round(result.get('new_risk', 0) * 100, 1),
                        "message": result.get('message', '')
                    }
            except Exception as e:
                print(f"[WARN] Counterfactual {scenario_name} failed: {e}")

        # =====================================================================
        # STEP 4: DETECT STATE CHANGES AND TRENDS
        # =====================================================================
        state_change = hmm_engine.detect_state_change(current_state, user_id)

        # Calculate trend from path
        path_states = hmm_result.get('path_states', [])
        trend = "STABLE"
        if len(path_states) >= 6:
            state_values = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}
            first_half = path_states[:len(path_states)//2]
            second_half = path_states[len(path_states)//2:]
            first_avg = sum(state_values.get(s, 0) for s in first_half) / len(first_half)
            second_avg = sum(state_values.get(s, 0) for s in second_half) / len(second_half)

            if second_avg < first_avg - 0.3:
                trend = "IMPROVING"
            elif second_avg > first_avg + 0.3:
                trend = "DECLINING"

        # =====================================================================
        # STEP 5: FETCH ADDITIONAL CONTEXT
        # =====================================================================
        full_context = self.fetch_full_context(days=7)

        # Get voucher balance
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row
        voucher_row = conn.execute("""
            SELECT current_value FROM voucher_tracker
            ORDER BY week_start_utc DESC LIMIT 1
        """).fetchone()
        voucher_balance = voucher_row['current_value'] if voucher_row else 5.00
        conn.close()

        # =====================================================================
        # STEP 6: BUILD COMPREHENSIVE PROMPT
        # =====================================================================

        # Format top factors
        factors_text = ""
        if top_factors:
            factors_list = []
            for i, f in enumerate(top_factors[:5], 1):
                factors_list.append(f"{i}. {f['feature']}: {f['value']:.2f} (weight: {f['weight']:.2f})")
            factors_text = "\n".join(factors_list)

        # Format counterfactuals
        counterfactual_text = ""
        if counterfactuals:
            cf_list = []
            for name, cf in counterfactuals.items():
                intervention_desc = ", ".join([f"{k}={v}" for k, v in cf['intervention'].items()])
                cf_list.append(f"- If {intervention_desc}: Risk drops by {cf['risk_reduction_pct']}% → {cf['new_crisis_risk']}%")
            counterfactual_text = "\n".join(cf_list)

        # Format recent voice check-ins
        voice_text = ""
        if full_context.get('voice_checkins'):
            voice_entries = []
            for v in full_context['voice_checkins'][:3]:
                if v.get('transcript'):
                    sentiment = v.get('sentiment', 0)
                    emoji = "😊" if sentiment > 0.3 else "😟" if sentiment < -0.3 else "😐"
                    voice_entries.append(f'{emoji} "{v["transcript"][:80]}..." (sentiment: {sentiment:.2f})')
            if voice_entries:
                voice_text = "\n".join(voice_entries)

        data_prompt = f"""
═══════════════════════════════════════════════════════════════════════════════
PATIENT PROFILE
═══════════════════════════════════════════════════════════════════════════════
Name: {patient_profile.get('name', 'Patient')}
Age: {patient_profile.get('age', 'Unknown')}
Conditions: {patient_profile.get('conditions', 'Type 2 Diabetes')}
Medications: {patient_profile.get('medications', 'Metformin')}

═══════════════════════════════════════════════════════════════════════════════
HMM INFERENCE RESULTS (Current State)
═══════════════════════════════════════════════════════════════════════════════
Current State: {current_state}
Confidence: {confidence:.1%}
State Probabilities: STABLE={state_probs.get('STABLE', 0):.1%}, WARNING={state_probs.get('WARNING', 0):.1%}, CRISIS={state_probs.get('CRISIS', 0):.1%}

State Change: {state_change.get('transition_type', 'None')} (Previous: {state_change.get('previous_state', 'N/A')})
Overall Trend: {trend}

═══════════════════════════════════════════════════════════════════════════════
PREDICTIVE RISK (Monte Carlo Simulation - {monte_carlo_result.get('simulations_run', 'N/A')} paths)
═══════════════════════════════════════════════════════════════════════════════
Probability of CRISIS in next 48h: {monte_carlo_result.get('prob_crisis_percent', 'N/A')}%
Risk Level: {monte_carlo_result.get('risk_level', 'UNKNOWN')}
Expected hours to crisis: {monte_carlo_result.get('expected_hours_to_crisis', 'N/A')}
Median hours to crisis: {monte_carlo_result.get('median_hours_to_crisis', 'N/A')}
95% Confidence Interval: {monte_carlo_result.get('confidence_interval_95', 'N/A')}

═══════════════════════════════════════════════════════════════════════════════
COUNTERFACTUAL ANALYSIS ("What If" Scenarios)
═══════════════════════════════════════════════════════════════════════════════
{counterfactual_text if counterfactual_text else "No counterfactual data available"}

═══════════════════════════════════════════════════════════════════════════════
TOP CONTRIBUTING FACTORS (Why this state?)
═══════════════════════════════════════════════════════════════════════════════
{factors_text if factors_text else "No factor data available"}

═══════════════════════════════════════════════════════════════════════════════
CURRENT METRICS (Latest Observation)
═══════════════════════════════════════════════════════════════════════════════
Glucose: {latest_obs.get('glucose_avg', 'N/A')} mmol/L
Glucose Variability: {latest_obs.get('glucose_variability', 'N/A')}% CV
Medication Adherence: {(latest_obs.get('meds_adherence', 0) or 0) * 100:.0f}%
Steps: {latest_obs.get('steps_daily', 'N/A')}
Resting HR: {latest_obs.get('resting_hr', 'N/A')} bpm
HRV: {latest_obs.get('hrv_rmssd', 'N/A')} ms
Sleep Quality: {latest_obs.get('sleep_quality', 'N/A')}/10
Carbs Intake: {latest_obs.get('carbs_intake', 'N/A')}g
Social Interactions: {latest_obs.get('social_engagement', 'N/A')}

═══════════════════════════════════════════════════════════════════════════════
BEHAVIORAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Voucher Balance: ${voucher_balance:.2f} (loses $1 per missed check-in/medication)
Recent Voice Check-ins:
{voice_text if voice_text else "No recent voice check-ins"}

Activity Pattern (7-day): Avg {full_context.get('activity_pattern', {}).get('avg_steps', 'N/A')} steps/day
Sleep Pattern: Avg {full_context.get('sleep_details', {}).get('avg_hours', 'N/A')} hours/night

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Based on ALL the above data:
1. Craft a warm, personalized message for the patient (in Singlish)
2. Decide what ACTIONS to take (reminders, alerts, etc.)
3. Identify the #1 priority for the patient right now
4. Determine if escalation is needed

Return your response as valid JSON following the format in the system prompt.
"""

        # =====================================================================
        # STEP 7: CALL GEMINI
        # =====================================================================
        if not self.api_key:
            return self._generate_fallback_agentic_response(
                current_state, latest_obs, patient_profile, voucher_balance
            )

        try:
            model = self._get_model()

            # Combine system prompt with data
            full_prompt = self.AGENTIC_SYSTEM_PROMPT + "\n\n" + data_prompt

            response = model.generate_content(full_prompt)
            text = response.text.strip()

            # Clean markdown formatting
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

            result = json.loads(text)

            # =====================================================================
            # STEP 8: EXECUTE ACTIONS
            # =====================================================================
            executed_actions = []
            for action in result.get('actions', []):
                action_result = self._execute_agentic_action(action, user_id, patient_profile)
                executed_actions.append(action_result)

            # Add metadata
            result['_metadata'] = {
                'hmm_state': current_state,
                'confidence': confidence,
                'risk_48h': monte_carlo_result.get('prob_crisis_percent'),
                'trend': trend,
                'executed_actions': executed_actions,
                'timestamp': time.time()
            }

            return result

        except Exception as e:
            print(f"[ERROR] Agentic response failed: {e}")
            return self._generate_fallback_agentic_response(
                current_state, latest_obs, patient_profile, voucher_balance
            )

    def _execute_agentic_action(self, action, user_id, patient_profile):
        """
        Executes an action triggered by the agentic AI.

        Returns dict with action status and details.
        """
        action_type = action.get('action', '')
        params = action.get('params', {})

        conn = self._get_db_connection()
        now = int(time.time())

        try:
            if action_type == 'SET_REMINDER':
                # Store reminder in database
                conn.execute("""
                    INSERT INTO reminders (user_id, reminder_time, message, repeat_type, created_at, status)
                    VALUES (?, ?, ?, ?, ?, 'pending')
                """, (user_id, params.get('time', '08:00'), params.get('message', ''),
                      params.get('repeat', 'once'), now))
                conn.commit()
                return {'action': action_type, 'status': 'success', 'details': params}

            elif action_type == 'ALERT_NURSE':
                # Store nurse alert
                priority = params.get('priority', 'medium')
                conn.execute("""
                    INSERT INTO nurse_alerts (user_id, timestamp_utc, priority, reason, status)
                    VALUES (?, ?, ?, ?, 'pending')
                """, (user_id, now, priority, params.get('reason', '')))
                conn.commit()
                return {'action': action_type, 'status': 'success', 'priority': priority}

            elif action_type == 'ALERT_FAMILY':
                # Store family notification
                conn.execute("""
                    INSERT INTO family_alerts (user_id, timestamp_utc, message, include_metrics, status)
                    VALUES (?, ?, ?, ?, 'pending')
                """, (user_id, now, params.get('message', ''),
                      1 if params.get('include_metrics', False) else 0))
                conn.commit()
                return {'action': action_type, 'status': 'success'}

            elif action_type == 'AWARD_VOUCHER':
                # Add voucher bonus
                amount = min(params.get('amount', 1), 5)  # Cap at $5
                conn.execute("""
                    UPDATE voucher_tracker
                    SET current_value = MIN(COALESCE(current_value, 0) + ?, 10.0),
                        bonus_earned = COALESCE(bonus_earned, 0) + ?
                    WHERE user_id = ?
                """, (amount, amount, user_id))
                conn.commit()
                return {'action': action_type, 'status': 'success', 'amount': amount}

            elif action_type == 'REQUEST_MEDICATION_VIDEO':
                # Store medication video request
                conn.execute("""
                    INSERT INTO medication_video_requests
                    (user_id, timestamp_utc, medication_name, status)
                    VALUES (?, ?, ?, 'pending')
                """, (user_id, now, params.get('medication', 'medication')))
                conn.commit()
                return {'action': action_type, 'status': 'success'}

            elif action_type == 'BOOK_APPOINTMENT':
                # Store appointment request
                conn.execute("""
                    INSERT INTO appointment_requests
                    (user_id, timestamp_utc, appointment_type, urgency, reason, status)
                    VALUES (?, ?, ?, ?, ?, 'pending')
                """, (user_id, now, params.get('type', 'clinic'),
                      params.get('urgency', 'routine'), params.get('reason', '')))
                conn.commit()
                return {'action': action_type, 'status': 'success', 'urgency': params.get('urgency')}

            elif action_type == 'SUGGEST_ACTIVITY':
                # Log activity suggestion (no DB storage needed, just return)
                return {'action': action_type, 'status': 'success', 'activity': params.get('activity')}

            elif action_type == 'ESCALATE_TO_DOCTOR':
                # Store doctor escalation (highest priority)
                conn.execute("""
                    INSERT INTO doctor_escalations
                    (user_id, timestamp_utc, reason, metrics_snapshot, status)
                    VALUES (?, ?, ?, ?, 'pending')
                """, (user_id, now, params.get('reason', ''),
                      json.dumps(params.get('metrics_snapshot', {}))))
                conn.commit()
                return {'action': action_type, 'status': 'success', 'escalated': True}

            else:
                return {'action': action_type, 'status': 'unknown_action'}

        except Exception as e:
            print(f"[ERROR] Action {action_type} failed: {e}")
            return {'action': action_type, 'status': 'error', 'error': str(e)}
        finally:
            conn.close()

    def _generate_fallback_agentic_response(self, state, latest_obs, patient_profile, voucher_balance):
        """
        Generates a safe fallback response when Gemini API is unavailable.
        """
        name = patient_profile.get('name', 'there')

        # State-based messages
        if state == 'CRISIS':
            message = f"Hello {name}, your health readings need attention. Please rest and drink water. A nurse will contact you soon."
            tone = "concerned"
            actions = [{"action": "ALERT_NURSE", "params": {"priority": "high", "reason": "Crisis state detected"}}]
        elif state == 'WARNING':
            message = f"Hi {name}! I noticed some changes in your health patterns. Remember to take your medication and check your glucose, ok?"
            tone = "encouraging"
            actions = [{"action": "SET_REMINDER", "params": {"time": "20:00", "message": "Time to take your medication!"}}]
        else:
            message = f"Good day {name}! Your health is looking stable. Keep up the good work! Your voucher balance is ${voucher_balance:.2f}."
            tone = "celebratory"
            actions = []

        return {
            "message_to_patient": message,
            "internal_reasoning": "Fallback response - API unavailable",
            "tone": tone,
            "actions": actions,
            "priority_factor": "medication adherence",
            "follow_up_needed": state != 'STABLE',
            "escalation_needed": state == 'CRISIS',
            "_metadata": {
                "fallback": True,
                "hmm_state": state
            }
        }

    def ensure_agentic_tables(self):
        """
        Creates necessary database tables for agentic features.
        Call this on app initialization.
        """
        conn = self._get_db_connection()

        tables = [
            """
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                reminder_time TEXT NOT NULL,
                message TEXT,
                repeat_type TEXT DEFAULT 'once',
                created_at INTEGER,
                status TEXT DEFAULT 'pending'
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS nurse_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp_utc INTEGER,
                priority TEXT DEFAULT 'medium',
                reason TEXT,
                status TEXT DEFAULT 'pending',
                acknowledged_at INTEGER,
                acknowledged_by TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS family_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp_utc INTEGER,
                message TEXT,
                include_metrics INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                sent_at INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS medication_video_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp_utc INTEGER,
                medication_name TEXT,
                status TEXT DEFAULT 'pending',
                video_path TEXT,
                self_reported INTEGER,
                nurse_verified INTEGER,
                verified_at INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS appointment_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp_utc INTEGER,
                appointment_type TEXT,
                urgency TEXT DEFAULT 'routine',
                reason TEXT,
                status TEXT DEFAULT 'pending',
                scheduled_for INTEGER,
                confirmed_at INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS doctor_escalations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp_utc INTEGER,
                reason TEXT,
                metrics_snapshot TEXT,
                status TEXT DEFAULT 'pending',
                reviewed_at INTEGER,
                reviewed_by TEXT,
                outcome TEXT
            )
            """
        ]

        try:
            for table_sql in tables:
                conn.execute(table_sql)
            conn.commit()
            print("[OK] Agentic tables ensured")
        except Exception as e:
            print(f"[WARN] Table creation error: {e}")
        finally:
            conn.close()

    def get_pending_reminders(self, user_id='current_user'):
        """Gets all pending reminders for a user."""
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        try:
            rows = conn.execute("""
                SELECT * FROM reminders
                WHERE user_id = ? AND status = 'pending'
                ORDER BY reminder_time
            """, (user_id,)).fetchall()
            return [dict(row) for row in rows]
        except:
            return []
        finally:
            conn.close()

    def get_nurse_dashboard_data(self, user_id='current_user'):
        """
        Gets all pending alerts and requests for the nurse dashboard.
        """
        conn = self._get_db_connection()
        conn.row_factory = sqlite3.Row

        data = {
            'nurse_alerts': [],
            'medication_videos': [],
            'appointment_requests': [],
            'doctor_escalations': []
        }

        try:
            # Nurse alerts
            rows = conn.execute("""
                SELECT * FROM nurse_alerts
                WHERE user_id = ? AND status = 'pending'
                ORDER BY timestamp_utc DESC
            """, (user_id,)).fetchall()
            data['nurse_alerts'] = [dict(row) for row in rows]

            # Medication videos pending verification
            rows = conn.execute("""
                SELECT * FROM medication_video_requests
                WHERE user_id = ? AND status IN ('pending', 'submitted')
                ORDER BY timestamp_utc DESC
            """, (user_id,)).fetchall()
            data['medication_videos'] = [dict(row) for row in rows]

            # Appointment requests
            rows = conn.execute("""
                SELECT * FROM appointment_requests
                WHERE user_id = ? AND status = 'pending'
                ORDER BY urgency DESC, timestamp_utc DESC
            """, (user_id,)).fetchall()
            data['appointment_requests'] = [dict(row) for row in rows]

            # Doctor escalations
            rows = conn.execute("""
                SELECT * FROM doctor_escalations
                WHERE user_id = ? AND status = 'pending'
                ORDER BY timestamp_utc DESC
            """, (user_id,)).fetchall()
            data['doctor_escalations'] = [dict(row) for row in rows]

        except Exception as e:
            print(f"[WARN] Nurse dashboard data error: {e}")
        finally:
            conn.close()

        return data

    def submit_medication_video(self, user_id, request_id, video_path, self_reported_taken):
        """
        Records a medication video submission from the patient.

        Args:
            user_id: Patient ID
            request_id: ID of the medication video request
            video_path: Path to saved video file
            self_reported_taken: Boolean - did patient say they took it?
        """
        conn = self._get_db_connection()
        now = int(time.time())

        try:
            conn.execute("""
                UPDATE medication_video_requests
                SET status = 'submitted',
                    video_path = ?,
                    self_reported = ?
                WHERE id = ? AND user_id = ?
            """, (video_path, 1 if self_reported_taken else 0, request_id, user_id))
            conn.commit()
            return {'status': 'success', 'message': 'Video submitted for nurse review'}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
        finally:
            conn.close()

    def nurse_verify_medication(self, request_id, verified, nurse_id):
        """
        Nurse verifies whether medication was taken based on video.
        """
        conn = self._get_db_connection()
        now = int(time.time())

        try:
            conn.execute("""
                UPDATE medication_video_requests
                SET status = 'verified',
                    nurse_verified = ?,
                    verified_at = ?
                WHERE id = ?
            """, (1 if verified else 0, now, request_id))
            conn.commit()
            return {'status': 'success', 'verified': verified}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
        finally:
            conn.close()


    # =========================================================================
    # AGENTIC CAPABILITIES (for AgentRuntime)
    # =========================================================================

    def _ensure_conversation_table(self):
        """Ensure conversation_history table exists (called internally)."""
        conn = self._get_db_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT,
                timestamp_utc INTEGER,
                role TEXT,
                message TEXT,
                hmm_state TEXT,
                actions_taken TEXT
            )
        """)
        conn.commit()
        conn.close()
    
    def generate_agentic_reasoning(
        self, 
        prompt: str, 
        available_tools: list, 
        observation: dict
    ) -> dict:
        """
        Generate reasoning for ReAct pattern.
        
        Uses Gemini to analyze patient state and decide what action to take.
        This is the "Think" step in Observe → Think → Act → Reflect.
        
        Args:
            prompt: Reasoning prompt with patient context
            available_tools: List of tool names available to call
            observation: Current patient state
        
        Returns:
            dict with reasoning, action, tool_name, tool_args, confidence, urgency
        """
        if not self.api_key:
            # Fallback: rule-based reasoning
            return self._fallback_reasoning(observation, available_tools)
        
        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:-3]
            elif text.startswith('```'):
                text = text[3:-3]
            
            result = json.loads(text.strip())
            
            # Validate tool_name is in available_tools
            if result.get('tool_name') and result['tool_name'] not in available_tools:
                print(f"Warning: LLM suggested invalid tool '{result['tool_name']}'")
                result['tool_name'] = None
                result['action'] = 'none'
            
            return result
            
        except Exception as e:
            print(f"Agentic reasoning error: {e}")
            return self._fallback_reasoning(observation, available_tools)
    
    def _fallback_reasoning(self, observation: dict, available_tools: list) -> dict:
        """
        Rule-based reasoning when Gemini unavailable.
        Simple heuristics for common scenarios.
        """
        hmm_state = observation.get('hmm_state', 'STABLE')
        risk_48h = observation.get('risk_48h', 0)
        recent_actions = observation.get('recent_actions', [])
        
        # Check if already acted recently (avoid spam)
        recent_alerts = [a for a in recent_actions if 'alert' in a.get('action', '')]
        if len(recent_alerts) > 0:
            return {
                "reasoning": "Already sent alert recently, avoiding alert fatigue",
                "action": "none",
                "tool_name": None,
                "confidence": 0.8,
                "urgency": "low"
            }
        
        # CRISIS state → send alert
        if hmm_state == "CRISIS":
            return {
                "reasoning": "Patient in CRISIS state, sending caregiver alert",
                "action": "send_alert",
                "tool_name": "send_tiered_alert",
                "tool_args": {
                    "message": f"Patient entered CRISIS state. Immediate attention needed.",
                    "severity": "critical"
                },
                "confidence": 0.9,
                "urgency": "high"
            }
        
        # WARNING + high risk → book appointment
        if hmm_state == "WARNING" and risk_48h > 50:
            return {
                "reasoning": "WARNING state with >50% crisis risk in 48h, booking preventive checkup",
                "action": "book_appointment",
                "tool_name": "book_appointment",
                "tool_args": {
                    "urgency": "urgent",
                    "reason": "Preventive consultation due to elevated risk"
                },
                "confidence": 0.7,
                "urgency": "medium"
            }
        
        # Default: no action needed
        return {
            "reasoning": f"Patient in {hmm_state} state with {risk_48h:.1f}% risk. Continuing monitoring.",
            "action": "none",
            "tool_name": None,
            "confidence": 0.6,
            "urgency": "low"
        }
    
    def generate_agentic_response(
        self,
        patient_profile: dict,
        hmm_engine,
        observations: list,
        user_id: str,
        user_message: str
    ) -> dict:
        """
        Generate agentic conversational response (for chat interface).
        
        Multi-turn conversation with context awareness and action execution.
        
        Args:
            patient_profile: Patient demographics
            hmm_engine: HMM engine instance
            observations: Recent health observations
            user_id: Patient identifier
            user_message: User's message
        
        Returns:
            dict with message_to_patient, tone, actions, priority_factor
        """
        if not self.api_key:
            return {
                "message_to_patient": "I'm here to help! However, my AI features are currently offline.",
                "tone": "calm"
            }
        
        try:
            # Get HMM state
            if observations and len(observations) > 0:
                result = hmm_engine.run_inference(observations, patient_id=user_id)
                current_state = result.get('current_state', 'STABLE')
                latest_obs = observations[-1]
            else:
                current_state = "NO_DATA"
                latest_obs = {}
            
            # Build contextual prompt
            prompt = f"""You are Bewo, a compassionate AI health companion for {patient_profile.get('name', 'the patient')}.

PATIENT CONTEXT:
- Age: {patient_profile.get('age', 67)}
- Conditions: {patient_profile.get('conditions', 'Type 2 Diabetes')}
- Current State: {current_state}
- Recent Glucose: {latest_obs.get('glucose_avg', 'N/A')} mmol/L

USER MESSAGE: "{user_message}"

YOUR TASK:
1. Respond empathetically and helpfully
2. If they mention symptoms, acknowledge and suggest checking glucose
3. If they ask health questions, provide evidence-based guidance
4. If urgent, suggest actions (take medication, check glucose, call doctor)

TONE: Caring but professional. Like a knowledgeable family member.

RESPOND IN JSON:
{{
    "message_to_patient": "Your conversational response here",
    "tone": "calm/encouraging/concerned",
    "actions": ["check_glucose", "take_medication"] or [],
    "priority_factor": "glucose_avg" if relevant
}}
"""
            
            model = self._get_model()
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:-3]
            elif text.startswith('```'):
                text = text[3:-3]
            
            result = json.loads(text.strip())
            result['_metadata'] = {
                'hmm_state': current_state,
                'user_message': user_message
            }
            
            # Store in conversation history
            self._store_conversation(user_id, "user", user_message)
            self._store_conversation(user_id, "assistant", result.get('message_to_patient', ''))
            
            return result
            
        except Exception as e:
            print(f"Agentic response error: {e}")
            return {
                "message_to_patient": "I'm here to help! Could you please rephrase that?",
                "tone": "calm",
                "actions": []
            }
    
    def _store_conversation(self, patient_id: str, role: str, message: str):
        """Store conversation turn in database"""
        try:
            self._ensure_conversation_table()
            conn = self._get_db_connection()
            conn.execute("""
                INSERT INTO conversation_history (patient_id, timestamp_utc, role, message)
                VALUES (?, ?, ?, ?)
            """, (patient_id, int(time.time()), role, message))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Warning: Could not store conversation: {e}")


if __name__ == "__main__":
    # Integration Testing
    gi = GeminiIntegration()
    
    print("\n=== Test 1: Voice Sentiment Analysis ===")
    # Note: Without a real key, this might return the fallback or fail if init checks pass but call fails
    result = gi.analyze_voice_sentiment("I'm feeling very tired today. Didn't sleep well last night and have a headache.")
    print(json.dumps(result, indent=2))
    
    print("\n=== Test 2: SBAR Clinical Report ===")
    weekly_data = {
        'patient_name': 'Mr. Tan',
        'age': 67,
        'condition': 'Type 2 Diabetes',
        'crisis_episodes': 2,
        'warning_episodes': 5,
       'avg_glucose_mmol': 8.5,
        'glucose_variance': 3.2,
        'medication_adherence': 0.65,
        'step_count_avg': 1800,
        'concerning_trends': ['declining activity', 'poor sleep', 'missed check-ins']
    }
    result = gi.draft_sbar(
        state="WARNING",
        metrics=weekly_data,
        conditions=weekly_data.get('condition', 'Type 2 Diabetes'),
        medications="Metformin 500mg BID",
        guidelines="ADA Standards of Care 2024"
    )
    print(json.dumps(result, indent=2))
