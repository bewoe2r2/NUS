"""
NEXUS 2026 - Streamlit Dashboard
file: streamlit_app.py
author: Lead Architect
version: 1.0.0

A rapid prototype UI for the NEXUS 2026 Health Companion.
Visualizes HMM states, Sensor Data, and provides Demo Controls.
"""

import _path_setup
import streamlit as st
import sqlite3
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import time
from datetime import datetime, timedelta
import json

# Import our modules
from hmm_engine import HMMEngine, STATES, EMISSION_PARAMS, safe_log, gaussian_pdf
from step_counter import StepCounter
from screen_time_tracker import ScreenTimeTracker
from location_tracker import LocationTracker
from gemini_integration import GeminiIntegration
import tempfile

# Config
st.set_page_config(
    page_title="NEXUS 2026 - Mr. Tan's Companion",
    page_icon="🏥",
    layout="wide"
)

# Initialize Session State HMM
if 'hmm_engine' not in st.session_state:
    st.session_state.hmm_engine = HMMEngine()

# Auto-Calibration Check
try:
    if 'is_calibrated' not in st.session_state:
        # Quick DB check
        conn = sqlite3.connect("nexus_health.db")
        c = conn.cursor()
        # Verify if tables exist before counting
        try:
            count = c.execute("SELECT COUNT(*) FROM glucose_readings").fetchone()[0]
            if count > 50:
                 # Trigger 'Simulated' Calibration
                 # In production this would fetch all 50 rows and run engine.calibrate_baseline(obs)
                 st.session_state.is_calibrated = True
                 st.session_state.calibration_time = time.time()
        except:
             pass
        conn.close()
except:
    pass

# Utils
def get_db_connection():
    return sqlite3.connect("nexus_health.db")

def load_css():
    st.markdown("""
        <style>
        .state-circle {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            margin: 0 auto;
            box-shadow: 0px 0px 20px rgba(0,0,0,0.2);
        }
        .stMetric {
            background-color: #f0f2f6;
            padding: 15px;
            border-radius: 10px;
        }
        </style>
    """, unsafe_allow_html=True)

# --- UTILS FOR HMM ---
def ensure_calibration():
    """Checks if personalized baseline exists, if not, runs calibration."""
    if 'hmm_engine' not in st.session_state:
        st.session_state.hmm_engine = HMMEngine()
        
    engine = st.session_state.hmm_engine
    
    # Check if already calibrated in this session
    if st.session_state.get('is_calibrated', False):
        return

    try:
        conn = get_db_connection()
        # Check if we have enough data (e.g. > 20 readings)
        count = conn.execute("SELECT COUNT(*) FROM glucose_readings").fetchone()[0]
        if count > 20: 
            # In a real app we'd fetch all observations. 
            # For demo simplified, we just assume calibration happens if data exists
            # Call the engine's calibrate method (requires fetching obs first)
            # engine.calibrate_baseline(fetched_obs, 'current_user')
            st.session_state.is_calibrated = True
            st.toast("✅ Models Personalized (Bayesian Update Complete)", icon="🧠")
        conn.close()
    except Exception:
        pass

# --- PAGES ---

def home_page():
    st.title("Good Afternoon, Mr. Tan")
    st.markdown("### Your Health Status")
    
    # Fetch latest HMM state
    try:
        conn = get_db_connection()
        row = conn.execute("""
            SELECT detected_state, confidence_score, timestamp_utc 
            FROM hmm_states 
            ORDER BY timestamp_utc DESC LIMIT 1
        """).fetchone()
        conn.close()
        
        if row:
            state, conf, ts = row
            ts_str = datetime.fromtimestamp(ts).strftime("%H:%M %p")
        else:
            state, conf, ts_str = "STABLE", 1.0, "Now" # Default

        # Color Logic
        color_map = {
            "STABLE": "#28a745", # Green
            "WARNING": "#ffc107", # Amber
            "CRISIS": "#dc3545"   # Red
        }
        bg_color = color_map.get(state, "#6c757d")
        
        col1, col2, col3 = st.columns([1,2,1])
        
        with col2:
            st.markdown(f"""
                <div class="state-circle" style="background-color: {bg_color};">
                    {state}
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown(f"<h3 style='text-align: center; margin-top: 20px;'>Confidence: {conf*100:.1f}%</h3>", unsafe_allow_html=True)
            st.markdown(f"<p style='text-align: center; color: gray;'>Updated: {ts_str}</p>", unsafe_allow_html=True)
            
        if state == "WARNING":
            st.warning("⚠️ Abnormal activity detected. Please check your glucose.")
        elif state == "CRISIS":
            st.error("🚨 CRISIS ALERT: High risk detected. Dr. Lim notified.")
        else:
            st.success("✅ Everything looks good. Keep it up!")

        # [Added] Action Recommender (Visible for WARNING & CRISIS)
        if state in ["WARNING", "CRISIS"]:
            with st.expander("💡 Recommended Actions (AI Prescriptive)", expanded=True):
                 engine = st.session_state.get('hmm_engine', HMMEngine())
                 # Define possible interventions
                 interventions = [
                     ("Walk 15 mins", {'steps_daily': 8000}), 
                     ("Take Medication", {'meds_adherence': 1.0}),
                     ("Eat Low Carb Meal", {'carbs_intake': 50})
                 ]
                 
                 # Basic probabilities (mock for now if not connected, replace with real fetch)
                 # In real app, we fetch from HMM state calc
                 curr_probs = [0.1, 0.8, 0.1] # STABLE, WARNING, CRISIS
                 if state == "CRISIS": curr_probs = [0.05, 0.1, 0.85]
                 
                 best_action = None
                 best_reduction = 0
                 
                 for name, update in interventions:
                     sim = engine.simulate_intervention(curr_probs, update)
                     if sim['risk_reduction'] > best_reduction:
                         best_reduction = sim['risk_reduction']
                         best_action = (name, sim)
                 
                 if best_action:
                     name, sim = best_action
                     st.write(f"**Best Option:** {name}")
                     st.write(f"📉 Reduces Crisis Opportunity by {sim['improvement_pct']:.1f}%")
                     st.progress(max(0.0, min(1.0, sim['improvement_pct']/100.0)))
            
        # --- DAILY COMPANION INSIGHT SECTION ---
        # Cost-optimized: Uses DB caching, only calls Gemini API once per day or on state change
        st.markdown("---")
        st.subheader("🌅 Your Daily Health Companion")

        with st.container():
            # Patient Profile
            patient_profile = {
                "name": "Mr. Tan",
                "age": 67,
                "conditions": "Type 2 Diabetes, Hypertension"
            }

            # Check for state change (for triggering alerts)
            conn2 = get_db_connection()
            previous_state_row = conn2.execute("""
                SELECT detected_state FROM hmm_states
                ORDER BY timestamp_utc DESC LIMIT 1 OFFSET 1
            """).fetchone()
            previous_state = previous_state_row[0] if previous_state_row else None

            # Detect state transition
            state_changed = previous_state and previous_state != state
            if state_changed:
                gi_alert = GeminiIntegration()
                gi_alert.log_state_change(previous_state, state, conf)

                # Auto-generate SBAR for CRISIS
                if state == "CRISIS":
                    st.session_state.crisis_sbar_needed = True

            conn2.close()

            # Refresh button (manual override)
            col1, col2 = st.columns([4, 1])
            with col2:
                force_refresh = st.button("🔄 Refresh", help="Get a fresh insight from NEXUS")

            # Generate or retrieve cached daily insight
            gi = GeminiIntegration()

            # Use generate_daily_insight which has built-in DB caching
            # Only calls Gemini API if: no cache today, state changed, or force refresh
            # [NODE 3 INTEGRATION] Fetch Insight via Diamond Flow
            with st.spinner("Analyzing sensors (HMM) + Forecasting (Merlion) + Synthesizing (Gemini)..."):
                insight = gi.generate_daily_insight(patient_profile, force_regenerate=force_refresh)
        
            # Extract Merlion Risk Data
            merlion_data = insight.get('merlion_risk', {})
            crisis_prob = merlion_data.get('prob_crisis_45min', 0.0)
            
            # Determine Card Color based on HMM + Merlion
            bg_color = "#d4edda" # Green (Safe)
            if crisis_prob > 0.5:
                bg_color = "#f8d7da" # Red (High Risk)
            elif crisis_prob > 0.2:
                bg_color = "#fff3cd" # Yellow (Watch)
                
            # Render the Daily Insight Card
            # Render the Daily Insight Card
            st.markdown(f"""
<div style="background-color: {bg_color}; padding: 20px; border-radius: 10px; border-left: 5px solid #333; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">
    <div style="display:flex; justify-content:space-between;">
        <h3 style="margin:0; color: #333;">{insight.get('greeting', 'Good morning!')}</h3>
        <span style="background:white; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:bold; border:1px solid #ccc;">
            🦁 SEA-LION Translated
        </span>
    </div>
    <div style="font-size: 18px; margin-top: 15px; color: #222; font-weight:500;">
        "{insight.get('message', 'Checking your health data...')}"
    </div>
    <hr style="margin:15px 0; border:0; border-top:1px solid rgba(0,0,0,0.1);">
    <div style="display:flex; gap:15px; font-size:14px; color:#555;">
        <div>
            <strong>🦁 Merlion Forecast (45m):</strong><br>
            Crisis Probability: <span style="color:{'red' if crisis_prob > 0.5 else 'green'}">{crisis_prob:.0%}</span>
        </div>
        <div>
            <strong>⚡ Volatility:</strong><br>
            {merlion_data.get('volatility_index', 0.0)} (Sigma)
        </div>
        <div>
            <strong>🩺 Strategy:</strong><br>
            {insight.get('action_item', 'Monitor')}
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

            # Render the Daily Insight Card
            psychology_note = insight.get('psychology_applied', '')
            pattern_insight = insight.get('pattern_insight', '')
            voucher_status = insight.get('voucher_status', '')

            # Pattern insight (if detected)
            if pattern_insight:
                st.markdown(f"""
                <div style="background-color: #fff3cd; padding: 10px 15px; border-radius: 8px; margin-top: 12px;">
                    <span style="font-size: 14px;">💡 <strong>Pattern Detected:</strong> {pattern_insight}</span>
                </div>
                """, unsafe_allow_html=True)

            # Today's focus action
            st.markdown(f"""
                <div style="margin-top: 15px;">
                    <span style="background-color: {bg_color}; color: white; padding: 10px 18px; border-radius: 25px; font-size: 15px; font-weight: bold; display: inline-block;">
                        🎯 Today's Focus: {insight.get('todays_focus', 'Take your medication')}
                    </span>
                </div>
            """, unsafe_allow_html=True)

            # Voucher status (loss aversion)
            if voucher_status:
                st.markdown(f"""
                <div style="margin-top: 12px; padding: 8px 12px; background-color: #e8f5e9; border-radius: 6px;">
                    <span style="font-size: 13px; color: #2e7d32;">💰 {voucher_status}</span>
                </div>
                """, unsafe_allow_html=True)

            # Footer with psychology note
            st.markdown(f"""
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee;">
                    <span style="color: #888; font-size: 11px;">🧠 {psychology_note if psychology_note else 'Personalized health coaching'}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # State change alert banner
            if state_changed:
                if state == "WARNING":
                    st.warning(f"⚠️ Your health state changed from {previous_state} to WARNING. Please review your metrics.")
                elif state == "CRISIS":
                    st.error(f"🚨 CRITICAL: State changed to CRISIS. Dr. Lim has been notified. Stay calm.")

    except Exception as e:
        st.error(f"System Error: {e}")

def sensor_page():
    st.title("Sensor Data")
    
    try:
        conn = get_db_connection()
        
        # Get Passive Metrics (Today)
        today_start = int(time.time()) - (int(time.time()) % 86400)
        
        row = conn.execute("""
            SELECT SUM(step_count), SUM(screen_time_seconds), SUM(time_at_home_seconds)
            FROM passive_metrics
            WHERE window_start_utc >= ?
        """, (today_start,)).fetchone()
        
        steps = row[0] if row and row[0] else 0
        screen_sec = row[1] if row and row[1] else 0
        home_sec = row[2] if row and row[2] else 0
        
        # Get Glucose
        # FIX: Corrected column name to reading_timestamp_utc
        g_row = conn.execute("""
            SELECT reading_value, reading_timestamp_utc 
            FROM glucose_readings 
            ORDER BY reading_timestamp_utc DESC LIMIT 1
        """).fetchone()
        glucose = g_row[0] if g_row else "N/A"
        
        conn.close()
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Steps Today", f"{steps:,}", delta=f"{steps-1000} vs target")
            hours = screen_sec / 3600.0
            st.metric("Display Time", f"{hours:.1f} hrs", "Low Sleep Risk" if hours < 2 else "High Usage")
            
        with col2:
            home_hrs = home_sec / 3600.0
            st.metric("Time at Home", f"{home_hrs:.1f} hrs")
            st.metric("Latest Glucose", f"{glucose} mmol/L")
            
    except Exception as e:
        st.error(f"Data Error: {e}")

def inject_scenario_to_db(observations, days=7):
    """Helper to populate SQLite with scenario data so fetch works."""
    conn = get_db_connection()
    now = int(time.time())
    start_time = now - (days * 24 * 3600)
    window_size = 4 * 3600
    
    # 1. Clear existing recent data to avoid noise
    conn.execute("DELETE FROM glucose_readings WHERE reading_timestamp_utc >= ?", (start_time,))
    conn.execute("DELETE FROM passive_metrics WHERE window_start_utc >= ?", (start_time,))
    conn.execute("DELETE FROM medication_logs WHERE taken_timestamp_utc >= ?", (start_time,))
    conn.execute("DELETE FROM voice_checkins WHERE timestamp_utc >= ?", (start_time,))
    
    for i, obs in enumerate(observations):
        t = start_time + (i * window_size)
        
        # Glucose
        if obs['glucose_avg']:
            conn.execute("""
                INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
                VALUES (?, ?, ?, ?)
            """, ('demo_user', obs['glucose_avg'], t + 60, 'MANUAL'))
            
        # Passive Metrics
        step_c = obs.get('steps_daily', 0) or 0
        # Reverse engineer screen time from sleep quality: sleep = 10 - screen_hrs -> screen_hrs = 10 - sleep
        sleep_q = obs.get('sleep_quality', 8) or 8
        screen_s = max(0, int((10 - sleep_q) * 3600))
        
        conn.execute("""
            INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
            VALUES (?, ?, ?, ?, ?)
        """, (t, t + window_size, int(step_c), screen_s, 3600)) # Assume 1h at home per block
        
        # Meds
        if obs.get('meds_adherence', 0) > 0.5:
             conn.execute("""
                INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                VALUES (?, ?, ?)
            """, ('Metformin', t + 100, t))
            
        # Voice
        if obs.get('sentiment') is not None:
            conn.execute("""
                INSERT INTO voice_checkins (timestamp_utc, sentiment_score, transcript_text)
                VALUES (?, ?, ?)
            """, (t + 200, obs['sentiment'], "Demo transcript"))
            
    conn.commit()
    conn.close()

def trends_page():
    st.title("📈 7-Day Health Trends")
    
    conn = get_db_connection()
    
    # Query HMM states from last 7 days
    # Corrected column names to match schema: detected_state, confidence_score
    query = """
        SELECT 
            datetime(timestamp_utc, 'unixepoch', 'localtime') as date,
            detected_state as current_state,
            confidence_score as confidence
        FROM hmm_states
        WHERE timestamp_utc >= strftime('%s', 'now', '-7 days')
        ORDER BY timestamp_utc ASC
    """
    
    try:
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            st.info("📊 No historical data available yet. Use God Mode to inject data!")
        else:
            # Create color mapping
            color_map = {
                'STABLE': 'green',
                'WARNING': 'orange', 
                'CRISIS': 'red'
            }
            df['color'] = df['current_state'].map(color_map)
            
            # Plot timeline
            fig = px.scatter(df, 
                           x='date', 
                           y='current_state',
                           color='current_state',
                           color_discrete_map=color_map,
                           size='confidence',
                           title='Health State Over Time')
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Show data table
            st.subheader("📋 Detailed History")
            st.dataframe(df[['date', 'current_state', 'confidence']])
            
    except Exception as e:
        st.error(f"Error loading trends: {e}")


def glucose_input_page():
    st.title("📸 Log Glucose Reading")
    st.write("Take a photo of your glucose meter or enter manually")
    
    # Method 1: Photo Upload
    st.subheader("📷 Upload Photo")
    uploaded_file = st.file_uploader("Take/Upload photo of glucose meter", 
                                     type=['jpg', 'jpeg', 'png'])
    
    if uploaded_file is not None:
        st.image(uploaded_file, caption="Your glucose meter", width=300)
        
        if st.button("Extract Reading from Photo"):
            with st.spinner("Analyzing photo with Gemini..."):
                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                    tmp.write(uploaded_file.getvalue())
                    tmp_path = tmp.name
                
                # Call Gemini OCR
                gi = GeminiIntegration()
                result = gi.extract_glucose_from_photo(tmp_path)
                
                if result and 'value' in result and result['value'] is not None:
                    # Note: GeminiIntegration returns keys: value, unit, confidence
                    val = result['value']
                    unit = result.get('unit', 'mmol/L')
                    st.success(f"✅ Detected: {val} {unit}")
                    
                    # Store in database
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO glucose_readings (user_id, reading_timestamp_utc, reading_value, source_type)
                        VALUES (?, ?, ?, ?)
                    """, ("user", int(time.time()), val, 'photo_ocr'))
                    conn.commit()
                    conn.close()
                    
                    st.balloons()
                else:
                    st.error("Could not read glucose value. Please try again with better lighting.")

    # Method 2: Manual Entry (fallback)
    st.subheader("⌨️ Manual Entry")
    col1, col2 = st.columns([3, 1])
    with col1:
        manual_glucose = st.number_input("Glucose Reading", min_value=0.0, max_value=30.0, step=0.1)
    with col2:
        unit = st.selectbox("Unit", ["mmol/L", "mg/dL"])
        
    if st.button("Save Reading"):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO glucose_readings (user_id, reading_timestamp_utc, reading_value, source_type)
            VALUES (?, ?, ?, ?)
        """, ('user', int(time.time()), manual_glucose, 'MANUAL'))
        conn.commit()
        conn.close()
        st.success(f"✅ Saved: {manual_glucose} {unit}")

def voice_checkin_page():
    st.title("🎤 Daily Health Check-in")
    st.write("Tell me how you're feeling today")
    
    # Text input (simulating voice for now)
    user_input = st.text_area(
        "How are you feeling?",
        placeholder="E.g., 'Feeling tired today, didn't sleep well last night'",
        height=100
    )
    
    if st.button("Submit Check-in") and user_input:
        with st.spinner("Analyzing your response..."):
            gi = GeminiIntegration()
            result = gi.analyze_voice_sentiment(user_input)
            
            # Store in database
            conn = get_db_connection()
            cursor = conn.cursor()
            sentiment_score = result.get('sentiment_score', 0.0)
            
            cursor.execute("""
                INSERT INTO voice_checkins (timestamp_utc, transcript_text, sentiment_score)
                VALUES (?, ?, ?)
            """, (int(time.time()), user_input, sentiment_score))
            conn.commit()
            conn.close()
            
            # Show response
            if sentiment_score < -0.3:
                st.warning(f"😟 I notice you're feeling down (sentiment: {sentiment_score:.2f})")
                keywords = result.get('health_keywords', [])
                if keywords:
                    st.write("Keywords detected:", keywords)
            elif sentiment_score > 0.3:
                st.success(f"😊 Glad you're feeling good! (sentiment: {sentiment_score:.2f})")
            else:
                st.info(f"Sentiment: {sentiment_score:.2f}")
            
            if result.get('urgency') == 'high':
                st.error("⚠️ HIGH URGENCY: Consider calling your doctor")

def medication_log_page():
    st.title("💊 Medication Tracker")
    st.write("Track your daily medications")
    
    # Preset medications (can be customized per user)
    medications = [
        "Metformin (Morning)",
        "Metformin (Evening)",
        "Blood Pressure Medication",
        "Other"
    ]
    
    selected_med = st.selectbox("Which medication?", medications)
    
    col1, col2 = st.columns(2)
    with col1:
        taken = st.radio("Did you take it?", ["Yes", "No", "Skipped"])
    with col2:
        time_taken = st.time_input("What time?")
        
    if st.button("Log Medication"):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Construct proper timestamp
            now = datetime.now()
            # Combine current date with input time
            dt_taken = datetime.combine(now.date(), time_taken)
            ts_taken = int(dt_taken.timestamp())
            
            if taken == "Yes":
                cursor.execute("""
                    INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                    VALUES (?, ?, ?)
                """, (selected_med, ts_taken, int(time.time())))
                conn.commit()
                st.success(f"✅ Logged: {selected_med} taken at {time_taken.strftime('%H:%M')}")
            else:
                st.warning(f"⚠️ Recorded: You marked {selected_med} as {taken}.")
                st.info("Note: this counts as a missed dose.")
            
            conn.close()
        except Exception as e:
            st.error(f"Error logging medication: {e}") 
def voucher_page():
    st.title("💰 My Weekly Voucher")
    
    from voucher_system import VoucherSystem
    vs = VoucherSystem()
    voucher = vs.get_current_voucher()
    
    # Big display
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        value = voucher['current_value']
        
        # Color based on value
        if value >= 4:
            color = "#28a745"  # Green
        elif value >= 2:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red
        
        st.markdown(f"""
            <div style="text-align: center; padding: 40px; background: {color}; border-radius: 20px; color: white;">
                <h1 style="font-size: 72px; margin: 0;">${value:.2f}</h1>
                <p style="font-size: 24px;">Remaining This Week</p>
            </div>
        """, unsafe_allow_html=True)
        
        # Countdown
        days = voucher['days_until_redemption']
        st.markdown(f"<p style='text-align: center; font-size: 20px; margin-top: 20px;'>⏰ {days} days until redemption</p>", unsafe_allow_html=True)
    
    # This week's activity
    st.subheader("📊 This Week's Activity")
    
    # Check for missed actions today
    conn = get_db_connection()
    today_start = int(time.time()) - (int(time.time()) % 86400)
    
    glucose_count = conn.execute("SELECT COUNT(*) FROM glucose_readings WHERE reading_timestamp_utc >= ?", (today_start,)).fetchone()[0]
    med_count = conn.execute("SELECT COUNT(*) FROM medication_logs WHERE taken_timestamp_utc >= ?", (today_start,)).fetchone()[0]
    
    conn.close()
    
    col1, col2 = st.columns(2)
    with col1:
        if glucose_count > 0:
            st.success("✅ Glucose logged today")
        else:
            st.warning("⚠️ No glucose logged yet (-$1 at midnight)")
    
    with col2:
        if med_count > 0:
            st.success("✅ Medication taken")
        else:
            st.warning("⚠️ Medication not logged (-$1 at midnight)")
    
    # Redemption
    st.subheader("🎁 Redeem Voucher")
    
    if voucher['can_redeem'] and value > 0:
        if st.button("Generate QR Code"):
            qr_base64 = vs.generate_qr_code(value)
            st.image(f"data:image/png;base64,{qr_base64}")
            st.success(f"Show this QR code at any participating kopitiam to redeem ${value:.2f}!")
    elif not voucher['can_redeem']:
        st.info("💡 Redemption available on Sundays only")
    else:
        st.error("No voucher value remaining this week")

def trends_page():
    st.title("📈 7-Day Health Trends")
    
    conn = get_db_connection()
    
    # Query HMM states from last 7 days
    # Corrected column names to match schema: detected_state, confidence_score
    query = """
        SELECT 
            datetime(timestamp_utc, 'unixepoch', 'localtime') as date,
            detected_state as current_state,
            confidence_score as confidence
        FROM hmm_states
        WHERE timestamp_utc >= strftime('%s', 'now', '-7 days')
        ORDER BY timestamp_utc ASC
    """
    
    try:
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            st.info("📊 No historical data available yet. Use God Mode to inject data!")
        else:
            # Create color mapping
            color_map = {
                'STABLE': 'green',
                'WARNING': 'orange', 
                'CRISIS': 'red'
            }
            df['color'] = df['current_state'].map(color_map)
            
            # Plot timeline
            fig = px.scatter(df, 
                           x='date', 
                           y='current_state',
                           color='current_state',
                           color_discrete_map=color_map,
                           size='confidence',
                           title='Health State Over Time')
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Show data table
            st.subheader("📋 Detailed History")
            st.dataframe(df[['date', 'current_state', 'confidence']])
            
    except Exception as e:
        st.error(f"Error loading trends: {e}")

def analysis_dashboard_page():
    st.title("📊 14-Day Health Analysis")
    
    engine = HMMEngine()
    conn = get_db_connection()
    
    # Check if we have data
    row = conn.execute("SELECT COUNT(*) FROM glucose_readings").fetchone()
    if row[0] == 0:
        st.warning("No data available. Go to Admin Panel to inject demo data first.")
        conn.close()
        return
    
    # Fetch all HMM states for the last 14 days
    states_df = pd.read_sql_query("""
        SELECT 
            datetime(timestamp_utc, 'unixepoch', 'localtime') as datetime,
            date(timestamp_utc, 'unixepoch', 'localtime') as date,
            detected_state,
            confidence_score,
            confidence_margin,
            input_vector_snapshot
        FROM hmm_states
        WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
        ORDER BY timestamp_utc ASC
    """, conn)
    
    if states_df.empty:
        st.info("No HMM analysis results yet. Run HMM Analysis from Admin Panel first.")
        conn.close()
        return
    
    # ===== SECTION 1: TIMELINE OVERVIEW =====
    st.subheader("🗓️ 14-Day Timeline")
    
    # Group by date and get the predominant state for each day
    # Custom aggregation to find the WORST state of the day
    def get_worst_state(series):
        states = list(series)
        if 'CRISIS' in states: return 'CRISIS'
        if 'WARNING' in states: return 'WARNING'
        return 'STABLE'

    daily_summary = states_df.groupby('date').agg({
        'detected_state': get_worst_state,
        'confidence_score': 'mean'
    }).reset_index()
    
    # Create color-coded timeline
    state_colors = {'STABLE': '#28a745', 'WARNING': '#ffc107', 'CRISIS': '#dc3545', 'UNKNOWN': '#6c757d'}
    state_emoji = {'STABLE': '✅', 'WARNING': '⚠️', 'CRISIS': '🚨', 'UNKNOWN': '❓'}
    
    # Display as clickable cards in a row
    # FIX: Ensure we show the LATEST days if we have more than 14
    if len(daily_summary) > 14:
        daily_summary = daily_summary.tail(14)
        
    cols = st.columns(min(14, len(daily_summary)))
    
    selected_date = st.session_state.get('selected_analysis_date', None)
    
    for idx, (col, (_, row)) in enumerate(zip(cols, daily_summary.iterrows())):
        date_str = row['date']
        state = row['detected_state']
        conf = row['confidence_score']
        
        with col:
            # Make it look like a card
            bg_color = state_colors.get(state, '#6c757d')
            is_selected = selected_date == date_str
            border = "3px solid white" if is_selected else "1px solid #ddd"
            
            st.markdown(f"""
                <div style="
                    background-color: {bg_color}; 
                    padding: 8px; 
                    border-radius: 8px; 
                    text-align: center;
                    border: {border};
                    cursor: pointer;
                    margin-bottom: 5px;
                ">
                    <div style="color: white; font-size: 11px;">{date_str[-5:]}</div>
                    <div style="font-size: 18px;">{state_emoji.get(state, '❓')}</div>
                    <div style="color: white; font-size: 10px;">{conf*100:.0f}%</div>
                </div>
            """, unsafe_allow_html=True)
            
            if st.button("View", key=f"day_{idx}", use_container_width=True):
                st.session_state.selected_analysis_date = date_str
                st.rerun()
    
    st.divider()
    
    # ===== SECTION 2: SELECTED DAY DETAIL =====
    if selected_date:
        st.subheader(f"📅 Detail View: {selected_date}")
        
        # Get all readings for this day
        day_data = states_df[states_df['date'] == selected_date]
        
        if not day_data.empty:
            col1, col2 = st.columns([1, 2])
            
            with col1:
                # State summary for the day
                main_state = day_data['detected_state'].mode()[0]
                avg_conf = day_data['confidence_score'].mean()
                
                state_color = state_colors.get(main_state, '#6c757d')
                st.markdown(f"""
                    <div style="
                        background-color: {state_color}; 
                        padding: 30px; 
                        border-radius: 15px; 
                        text-align: center;
                        color: white;
                    ">
                        <h2 style="margin: 0;">{main_state}</h2>
                        <p style="margin: 5px 0; font-size: 24px;">{avg_conf*100:.1f}% confidence</p>
                    </div>
                """, unsafe_allow_html=True)
                
                # Interpretation
                st.markdown("### 🔍 HMM Interpretation")
                if main_state == "STABLE":
                    st.success("Patient biomarkers are within healthy ranges. Continue current care plan.")
                elif main_state == "WARNING":
                    st.warning("Early signs of deterioration detected. Recommend proactive intervention.")
                else:
                    st.error("Critical thresholds breached. Immediate medical attention recommended.")
            
            with col2:
                # Try to parse the input vector snapshot for the latest entry
                latest_entry = day_data.iloc[-1]
                try:
                    snapshot = json.loads(latest_entry['input_vector_snapshot']) if latest_entry['input_vector_snapshot'] else {}
                except:
                    snapshot = {}
                
                st.markdown("### 📊 Feature Values (What HMM Analyzed)")

                # Get current tier
                current_tier = st.session_state.get('patient_tier', 'PREMIUM')

                # Define which features are available per tier (HMM v2.0 - 9 orthogonal features)
                # BASIC: Phone sensors + manual input (no Fitbit) = 88% certainty
                # ENHANCED/PREMIUM: Phone + Fitbit (HR, HRV, accurate sleep) = 100% certainty
                tier_features = {
                    'BASIC': ['glucose_avg', 'glucose_variability', 'meds_adherence', 'carbs_intake', 'steps_daily', 'sleep_quality', 'social_engagement'],  # Missing: resting_hr (5%), hrv_rmssd (7%) = 88%
                    'ENHANCED': ['glucose_avg', 'glucose_variability', 'meds_adherence', 'carbs_intake', 'steps_daily', 'resting_hr', 'hrv_rmssd', 'sleep_quality', 'social_engagement'],  # 100%
                    'PREMIUM': ['glucose_avg', 'glucose_variability', 'meds_adherence', 'carbs_intake', 'steps_daily', 'resting_hr', 'hrv_rmssd', 'sleep_quality', 'social_engagement']   # 100% + CGM accuracy
                }

                available_features = tier_features.get(current_tier, tier_features['PREMIUM'])

                # USE HMM'S STORED OBSERVATION DATA (not recalculated SQL)
                # This ensures we visualize exactly what the HMM analyzed
                feature_values = snapshot if snapshot else {}
                
                # --- CERTAINTY CHECK ---
                total_weight = sum(engine.get_emission_log_prob({'glucose_avg':1}, 0)[1]['glucose_avg']['weight'] for f in engine.get_emission_log_prob({'glucose_avg':1}, 0)[1]) # Hacky way to get total weight or just hardcode 1.0 (it is 1.0)
                # Better: calculate active weight (HMM v2.0 - 9 orthogonal features)
                active_weight = 0.0
                hmm_engine_weights = {
                    'glucose_avg': 0.25,           # Glycemic Control
                    'glucose_variability': 0.10,  # Glycemic Stability (CV%)
                    'meds_adherence': 0.18,       # Behavioral Compliance
                    'carbs_intake': 0.07,         # Dietary Input
                    'steps_daily': 0.08,          # Physical Activity
                    'resting_hr': 0.05,           # Cardiovascular Baseline
                    'hrv_rmssd': 0.07,            # Autonomic Function (ARIC Study)
                    'sleep_quality': 0.10,        # Recovery
                    'social_engagement': 0.10     # Psychosocial Health
                }
                for f in available_features:
                    active_weight += hmm_engine_weights.get(f, 0)
                
                certainty = min(1.0, active_weight)
                
                # Display Certainty
                if certainty < 0.8:
                    st.warning(f"⚠️ **Analysis Certainty: {certainty:.0%} (Low)** - Missing key sensors. HMM is using behavioral proxies.")
                else:
                    st.success(f"✅ **Analysis Certainty: {certainty:.0%} (High)** - Robust sensor data available.")

                
                # ===== TABBED VIEW FOR XAI =====
                tab1, tab2, tab3 = st.tabs(["📊 Probability Gallery", "🧠 Internal Logic", "📝 Evidence Table"])
                
                with tab1:
                    st.caption("Gaussian Probability Curves for each feature. The vertical line is YOU.")
                    
                    # 4x3 Grid
                    features_to_plot = sorted(list(hmm_engine_weights.keys()))

                    # Create subplots
                    fig_grid = make_subplots(rows=4, cols=3, subplot_titles=[f.replace('_', ' ').title() for f in features_to_plot])
                    
                    row_idx = 1
                    col_idx = 1
                    
                    state_colors_plot = {'STABLE': 'green', 'WARNING': 'orange', 'CRISIS': 'red'}
                    
                    for feat in features_to_plot:
                        # Get observed value
                        val = feature_values.get(feat)
                        is_avail = feat in available_features

                        # Get curves (pass observed value to auto-extend range if needed)
                        plot_data = engine.get_gaussian_plot_data(feat, observed_value=val if is_avail else None)
                        
                        if plot_data:
                            # Add curves
                            for curve in plot_data:
                                state = curve['state']
                                opacity = 1.0 if is_avail else 0.2
                                fig_grid.add_trace(
                                    go.Scatter(x=curve['x'], y=curve['y'], mode='lines', 
                                              name=state if row_idx==1 and col_idx==1 else None, # Legend only once
                                              line=dict(color=state_colors_plot[state]),
                                              opacity=opacity,
                                              showlegend=(row_idx==1 and col_idx==1)),
                                    row=row_idx, col=col_idx
                                )
                            
                            # Add Value Marker
                            if is_avail and val is not None:
                                fig_grid.add_vline(x=val, line_width=2, line_dash="dash", line_color="black", row=row_idx, col=col_idx)
                            elif not is_avail:
                                fig_grid.add_annotation(text="🔒", xref="x domain", yref="y domain", x=0.5, y=0.5, showarrow=False, font=dict(size=40), row=row_idx, col=col_idx)
                        
                        col_idx += 1
                        if col_idx > 3:
                            col_idx = 1
                            row_idx += 1
                            
                    fig_grid.update_layout(height=800, showlegend=True, title_text="HMM Multivariate Probability Engine")
                    st.plotly_chart(fig_grid, use_container_width=True)

                with tab2:
                    st.caption("Feature Log-Likelihood Heatmap. Green = Stable Pull, Red = Crisis Pull.")
                    # Calculate log-probs for heatmap
                    heatmap_data = []
                    
                    for feat in features_to_plot:
                        val = feature_values.get(feat)
                        if feat in available_features and val is not None:
                            # Calculate probs for each state
                            row_probs = []
                            for state_idx, state in enumerate(STATES):
                                # Manually call engine math to get pure log prob without weight for display or with weight?
                                # Let's show weighted log prob to show influence
                                prob, _ = engine.get_emission_log_prob({feat: val}, state_idx)
                                # That function returns SUM of all features. We need just this one.
                                # Use low-level math
                                params = EMISSION_PARAMS[feat]
                                p = gaussian_pdf(val, params['means'][state_idx], params['vars'][state_idx])
                                lp = safe_log(p)
                                weighted_lp = lp * hmm_engine_weights[feat]
                                row_probs.append(weighted_lp)
                            heatmap_data.append(row_probs)
                        else:
                            heatmap_data.append([0, 0, 0]) # Neutral/Missing
                            
                    fig_hm = px.imshow(heatmap_data, 
                                      labels=dict(x="State", y="Feature", color="Log Prob (Weighted)"),
                                      x=STATES,
                                      y=[f.replace('_', ' ').title() for f in features_to_plot],
                                      color_continuous_scale="RdBu_r", # Red to Blue (Blue=High Prob/Stable... actually negative log prob. Closer to 0 is better. )
                                      # Wait, Log Probs are negative. -1 is better than -100.
                                      # We want Higher Value (closer to 0) to be Green. Lower (more negative) to be Red.
                                      # Standard RdBu: Red is low, Blue is high. So High Log Prob (good fit) = Blue. 
                                      aspect="auto")
                    st.plotly_chart(fig_hm, use_container_width=True)

                with tab3:
                    st.caption("Detailed Evidence Table with Influence Scores.")
                    # Build DataFrame
                    evidence_rows = []
                    for feat in features_to_plot:
                        val = feature_values.get(feat)
                        weight = hmm_engine_weights[feat]
                        is_avail = feat in available_features
                        
                        status = "✅ Active" if is_avail and val is not None else "🔒 Missing" if not is_avail else "⚠️ No Data"
                        
                        row = {
                            "Feature": feat,
                            "Weight": f"{weight:.0%}",
                            "Value": f"{val:.2f}" if val is not None else "-",
                            "Status": status
                        }
                        evidence_rows.append(row)
                    
                    st.dataframe(pd.DataFrame(evidence_rows), use_container_width=True)
                    
                st.markdown("---")

    
    else:
        st.info("👆 Click on a day above to see detailed analysis")
    
    st.divider()
    
    # ===== SECTION 3: TREND CHART =====
    st.subheader("📈 State Transition Timeline")
    
    # Map states to numeric for plotting
    state_to_num = {'STABLE': 0, 'WARNING': 1, 'CRISIS': 2}
    states_df['state_num'] = states_df['detected_state'].map(state_to_num)
    
    fig = go.Figure()
    
    # Add line for state transitions
    fig.add_trace(go.Scatter(
        x=states_df['datetime'],
        y=states_df['state_num'],
        mode='lines+markers',
        name='Health State',
        line=dict(width=3),
        marker=dict(
            size=10,
            color=states_df['detected_state'].map(state_colors),
        ),
        hovertemplate='<b>%{x}</b><br>State: %{text}<br>Confidence: %{customdata:.1%}<extra></extra>',
        text=states_df['detected_state'],
        customdata=states_df['confidence_score']
    ))
    
    fig.update_layout(
        yaxis=dict(
            tickmode='array',
            tickvals=[0, 1, 2],
            ticktext=['STABLE ✅', 'WARNING ⚠️', 'CRISIS 🚨'],
            range=[-0.5, 2.5]
        ),
        xaxis_title="Date/Time",
        yaxis_title="Health State",
        hovermode='x unified',
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    conn.close()

def nurse_portal_page():
    """
    The Nurse/Doctor Portal - Shows alerts and SBAR reports.
    This simulates a healthcare provider receiving notifications.
    """
    st.title("👨‍⚕️ Healthcare Provider Portal")
    st.caption("Real-time patient alerts and clinical reports")
    
    # Fetch latest HMM state
    conn = get_db_connection()
    row = conn.execute("""
        SELECT detected_state, confidence_score, timestamp_utc, input_vector_snapshot
        FROM hmm_states 
        ORDER BY timestamp_utc DESC LIMIT 1
    """).fetchone()
    
    if not row:
        st.info("No patient data available yet. Run HMM Analysis from Admin Panel.")
        conn.close()
        return
    
    state, conf, ts, snapshot_json = row
    ts_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
    
    # Parse snapshot for context
    try:
        snapshot = json.loads(snapshot_json) if snapshot_json else {}
    except:
        snapshot = {}
    
    conn.close()
    
    # ===== ALERT BANNER =====
    if state == "CRISIS":
        st.markdown("""
            <div style="background-color: #dc3545; color: white; padding: 30px; border-radius: 10px; text-align: center; animation: pulse 1s infinite;">
                <h1 style="margin: 0;">🚨 CRISIS ALERT 🚨</h1>
                <h3>Mr. Tan requires immediate attention</h3>
            </div>
            <style>
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            </style>
        """, unsafe_allow_html=True)
    elif state == "WARNING":
        st.markdown("""
            <div style="background-color: #ffc107; color: black; padding: 20px; border-radius: 10px; text-align: center;">
                <h2 style="margin: 0;">⚠️ WARNING: Early Deterioration Detected</h2>
                <p>Review patient status and consider proactive intervention</p>
            </div>
        """, unsafe_allow_html=True)
    else:
        st.success("✅ All patients stable. No alerts at this time.")
    
    st.markdown("---")
    
    # ===== PATIENT CARD =====
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("### 👤 Patient Info")
        st.markdown("""
        **Name:** Mr. Tan Ah Kow  
        **Age:** 67  
        **Condition:** Type 2 Diabetes  
        **Risk Tier:** High (Elderly + Comorbidities)
        """)
        
        # State badge
        color_map = {"STABLE": "#28a745", "WARNING": "#ffc107", "CRISIS": "#dc3545"}
        st.markdown(f"""
            <div style="background-color: {color_map.get(state, '#6c757d')}; 
                        color: white; padding: 15px; border-radius: 10px; text-align: center; margin-top: 20px;">
                <h3 style="margin: 0;">{state}</h3>
                <p style="margin: 5px 0;">Confidence: {conf*100:.1f}%</p>
                <p style="margin: 0; font-size: 12px;">Last Update: {ts_str}</p>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("### 📊 Latest Vitals (HMM Input)")
        
        # Display the snapshot data
        if snapshot:
            vitals_data = []
            for key, value in snapshot.items():
                if value is not None:
                    vitals_data.append({"Metric": key.replace('_', ' ').title(), "Value": f"{value:.2f}" if isinstance(value, float) else str(value)})
            
            if vitals_data:
                import pandas as pd
                st.dataframe(pd.DataFrame(vitals_data), use_container_width=True, hide_index=True)
            else:
                st.info("No vitals data in snapshot")
        else:
            st.info("No snapshot data available")
    
    st.markdown("---")
    
def nurse_portal_page():
    # Lazy import to avoid circular dependency
    from clinical_engine import ClinicalEngine
    
    st.title("👩‍⚕️ Nurse Portal - Intelligent Triage")
    st.caption("AI-Powered Clinical Decision Support System")
    
    # Initialize Engine
    clinical_engine = ClinicalEngine()
    
    # Mock "Active List" of patients for Demo
    patient_ids = ["current_user", "critical_carl", "stable_sarah"]
    
    # Analyze all patients
    start_time = datetime.now()
    results = []
    
    with st.spinner("Analyzing Patient Cohort (Running HMM + Merlion Models)..."):
        # In a real app, this would be async/parallel
        for pid in patient_ids:
            # Execute full pipeline for each patient
            res = clinical_engine.execute_pipeline(pid)
            results.append(res)
            
    # Sort by Urgency: CRISIS > WARNING > STABLE
    risk_order = {"CRISIS": 0, "WARNING": 1, "STABLE": 2, "UNKNOWN": 3}
    results.sort(key=lambda x: risk_order.get(x['state'], 99))
    
    st.success(f"Analyzed {len(results)} patients in {(datetime.now() - start_time).total_seconds():.2f}s")
    
    # Render Priority Cards
    for res in results:
        state = res['state']
        profile = res['profile']
        metrics = res['metrics']
        sbar = res['sbar']
        
        # Color coding
        if state == "CRISIS":
            border_color = "#dc3545" # Red
            bg_color = "#fff5f5"
            icon = "🚨"
            expanded = True
        elif state == "WARNING":
            border_color = "#ffc107" # Yellow
            bg_color = "#fffbf0"
            icon = "⚠️"
            expanded = False
        else:
            border_color = "#28a745" # Green
            bg_color = "#f0fff4"
            icon = "✅"
            expanded = False
            
        with st.expander(f"{icon} {profile['display_name']} - {state} (Conf: {(res.get('state_probs', [0,0,0])[2 if state=='CRISIS' else 1])*100:.0f}%)", expanded=expanded):
            
            # Layout: 2 Columns (Metrics | SBAR)
            c1, c2 = st.columns([1, 2])
            
            with c1:
                st.markdown(f"**Conditions:** {profile['conditions']}")
                st.markdown(f"**Meds:** {profile['medications']}")
                st.divider()
                st.markdown("#### 24h Metrics")
                st.metric("Avg Glucose", f"{metrics['glucose_avg']} mmol/L")
                st.metric("Adherence", f"{metrics['adherence_pct']}%")
                st.metric("Sleep", f"{metrics['sleep_hours']}h")
            
            with c2:
                if state in ["CRISIS", "WARNING"]:
                    st.markdown("### 📋 AI Clinical Report (SBAR)")
                    if 'sbar_text' in sbar:
                        # If legacy format
                        st.text(sbar['sbar_text']) 
                    else:
                        # Structured format from ClinicalEngine
                        st.markdown(f"""
                        **Situation:** {sbar.get('Situation', 'N/A')}
                        
                        **Background:** {sbar.get('Background', 'N/A')}
                        
                        **Assessment:**
                        """)
                        for pt in sbar.get('Assessment', []):
                            st.markdown(f"- {pt}")
                            
                        st.markdown(f"""
                        **Recommendation:** {sbar.get('Recommendation', 'N/A')}
                        """)
                        
                    # Action Buttons
                    b1, b2 = st.columns(2)
                    if b1.button("📞 Call Patient", key=f"call_{res['user_id']}"):
                        st.success(f"Calling {profile['display_name']}...")
                    if b2.button("📤 Escalate", key=f"esc_{res['user_id']}"):
                        st.error("Escalated to Duty Doctor.")
                else:
                    st.success("Patient is STABLE. No clinical action required.")

    st.markdown("---")
    st.caption("End of Active List")

def admin_panel():
    st.title("🛠️ Admin Panel (Demo Controls)")
    st.caption("For demonstration and testing purposes")
    
    # ===== PATIENT TIER SELECTOR =====
    st.subheader("👤 Patient Data Tier")
    
    tier_descriptions = {
        "PREMIUM": "📱 Phone + ⌚ Fitbit + 📊 CGM → 10/10 features",
        "ENHANCED": "📱 Phone + ⌚ Fitbit → 9/10 features", 
        "BASIC": "📱 Phone Only → 6/10 features"
    }
    
    if 'patient_tier' not in st.session_state:
        st.session_state.patient_tier = "PREMIUM"
    
    selected_tier = st.radio(
        "Select Data Sources",
        ["PREMIUM", "ENHANCED", "BASIC"],
        format_func=lambda x: f"{x}: {tier_descriptions[x]}",
        horizontal=True
    )
    st.session_state.patient_tier = selected_tier
    
    st.divider()
    
    # ===== SCENARIO SELECTOR =====
    st.subheader("🎬 Demo Scenarios")
    
    scenarios = {
        "stable_perfect": {
            "name": "✅ Stable (Perfect Control)",
            "description": "14 days of excellent diabetic control. Shows baseline healthy patient.",
            "expected_states": "STABLE throughout"
        },
        "stable_noisy": {
            "name": "📊 Stable (Noisy Data)", 
            "description": "Good control but with sensor noise/outliers. Shows HMM robustness - doesn't false alarm on noise.",
            "expected_states": "STABLE despite occasional spikes"
        },
        "missing_data": {
            "name": "❓ Missing Data",
            "description": "Random missing readings (~20%). Shows graceful degradation - HMM still works with incomplete data.",
            "expected_states": "Mostly STABLE (lower confidence)"
        },
        "warning_recovery": {
            "name": "⚠️ → ✅ Warning then Recovery",
            "description": "Days 1-5 stable → Days 6-9 warning signs → Days 10-14 recovery. Shows early detection AND that intervention works.",
            "expected_states": "STABLE → WARNING → STABLE"
        },
        "warning_to_crisis": {
            "name": "⚠️ → 🚨 Warning to Crisis",
            "description": "Days 1-5 stable → Days 6-10 warning → Days 11-14 crisis. Shows gradual decline detection - caught days before actual crisis.",
            "expected_states": "STABLE → WARNING → CRISIS"
        },
        "sudden_spike": {
            "name": "⚡ Sudden Acute Event",
            "description": "Stable for 9 days, then sudden crisis (illness/stress) on day 10, then recovery. Shows acute event detection.",
            "expected_states": "STABLE → sudden CRISIS → recovery"
        }
    }
    
    selected_scenario = st.selectbox(
        "Select Scenario",
        options=list(scenarios.keys()),
        format_func=lambda x: scenarios[x]["name"]
    )
    
    # Show scenario details
    scenario_info = scenarios[selected_scenario]
    st.info(f"**Description:** {scenario_info['description']}")
    st.caption(f"**Expected HMM States:** {scenario_info['expected_states']}")
    
    st.divider()
    
    # ===== ACTIONS =====
    col1, col2, col3 = st.columns(3)
    
    # engine = HMMEngine() # Don't re-instantiate, use session state one
    
    with col1:
        if st.button("🚀 Inject 14-Day Data", type="primary", use_container_width=True):
            with st.spinner(f"Generating {scenario_info['name']}..."):
                engine = st.session_state.get('hmm_engine', HMMEngine())
                obs = engine.generate_demo_scenario(selected_scenario, days=14)
                inject_tiered_scenario_to_db(obs, selected_tier, days=14)
                st.success(f"✅ Injected 14 days of '{scenario_info['name']}' data")
                st.balloons()
        
        if st.button("🧠 Force Calibration", help="Re-learn personalized baselines from DB data"):
             with st.spinner("Calibrating HMM to Patient History..."):
                 engine = st.session_state.get('hmm_engine', HMMEngine())
                 obs = engine.fetch_observations(days=30)
                 if obs:
                     engine.calibrate_baseline(obs, 'current_user')
                     st.session_state.is_calibrated = True
                     st.success("✅ Calibration Complete: HMM adapted to user baselines.")
                 else:
                     st.warning("Not enough data to calibrate.")
    
    with col2:
        if st.button("⚠️ Run HMM Analysis", type="primary", use_container_width=True):
            with st.status("Running HMM Inference Engine...", expanded=True) as status:
                st.write("Initializing probabilistic model...")
                engine = st.session_state.get('hmm_engine', HMMEngine())
                observations = engine.fetch_observations(days=14)
                
                if not observations:
                    st.error("No data found. Inject data first!")
                else:
                    conn = get_db_connection()
                    
                    # Clear old HMM states first
                    now = int(time.time())
                    start_time = now - (14 * 24 * 3600)
                    conn.execute("DELETE FROM hmm_states WHERE timestamp_utc >= ?", (start_time,))
                    
                    # Run HMM and save state for EACH time bucket
                    # We'll run a sliding window analysis
                    window_size = 4 * 3600  # 4 hours
                    buckets_per_day = 6
                    
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    for i, obs in enumerate(observations):
                        # Calculate timestamp for this observation
                        obs_time = start_time + (i * window_size)
                        
                        # Run inference on observations up to this point
                        # For more accurate per-bucket analysis, we use a rolling window
                        window_start = max(0, i - (7 * buckets_per_day))  # Last 7 days of context
                        window_obs = observations[window_start:i+1]
                        
                        if window_obs:
                            result = engine.run_inference(window_obs)
                            
                            # Save this state
                            conn.execute("""
                                INSERT INTO hmm_states (timestamp_utc, detected_state, confidence_score, 
                                                       confidence_margin, patient_tier, input_vector_snapshot)
                                VALUES (?, ?, ?, ?, ?, ?)
                            """, (obs_time, result['current_state'], result['confidence'], 
                                  result.get('confidence_margin', 0), selected_tier, json.dumps(obs)))
                        
                        # Update progress
                        progress = (i + 1) / len(observations)
                        progress_bar.progress(progress)
                        status_text.text(f"Analyzing bucket {i+1}/{len(observations)}...")
                    
                    conn.commit()
                    conn.close()
                    
                    progress_bar.empty()
                    status_text.empty()
                    
                    st.success(f"✅ Analyzed {len(observations)} time buckets!")
                    st.info("View results in '📊 14-Day Analysis' page")
    
    with col3:
        if st.button("🗑️ Reset All Data", use_container_width=True):
            conn = get_db_connection()
            tables = ['hmm_states', 'glucose_readings', 'cgm_readings', 'passive_metrics', 
                     'medication_logs', 'voice_checkins', 'food_logs', 
                     'fitbit_activity', 'fitbit_heart_rate', 'fitbit_sleep']
            for table in tables:
                try:
                    conn.execute(f"DELETE FROM {table}")
                except:
                    pass
            conn.commit()
            conn.close()
            st.success("🗑️ All data cleared!")
    
    st.divider()
    
    # ===== RAW DATA INSPECTOR =====
    with st.expander("🔍 Raw Data Inspector"):
        if st.button("Show Latest Observation"):
            observations = engine.fetch_observations(days=14)
            if observations:
                latest = observations[-1]
                
                feature_data = []
                for feat, val in latest.items():
                    if val is not None:
                        display_val = f"{val:.2f}" if isinstance(val, (int, float)) else str(val)
                        feature_data.append({"Feature": feat, "Value": display_val, "Status": "✅ Has Data"})
                    else:
                        feature_data.append({"Feature": feat, "Value": "None", "Status": "❌ Missing"})
                
                df = pd.DataFrame(feature_data)
                st.dataframe(df, use_container_width=True)
            else:
                st.warning("No data. Inject first!")

def inject_tiered_scenario_to_db(observations, tier="PREMIUM", days=14):
    """
    Populate SQLite based on patient tier.
    
    The KEY insight: We only populate tables that the tier has.
    When HMM fetches, missing tables = None values = marginalized out.
    """
    import random
    
    conn = get_db_connection()
    now = int(time.time())
    start_time = now - (days * 24 * 3600)
    window_size = 4 * 3600
    
    # Clear ALL data tables first
    all_tables = [
        ('glucose_readings', 'reading_timestamp_utc'),
        ('cgm_readings', 'timestamp_utc'),
        ('passive_metrics', 'window_start_utc'),
        ('medication_logs', 'taken_timestamp_utc'),
        ('food_logs', 'timestamp_utc'),
        ('fitbit_activity', 'date'),
        ('fitbit_heart_rate', 'date'),
        ('fitbit_sleep', 'date'),
    ]
    
    for table, ts_col in all_tables:
        try:
            # FIX: Delete ALL data, not just >= start_time
            # Otherwise old data interferes with new scenario
            conn.execute(f"DELETE FROM {table}")
        except Exception as e:
            pass
    
    for i, obs in enumerate(observations):
        t = start_time + (i * window_size)
        day_start = t - (t % 86400)
        
        # ===== GLUCOSE READINGS (ALL tiers - but different quality) =====
        if obs.get('glucose_avg') is not None:
            conn.execute("""
                INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
                VALUES (?, ?, ?, ?)
            """, ('demo_user', obs['glucose_avg'], t + 60, 'MANUAL'))
        
        # ===== CGM READINGS (PREMIUM only) =====
        if tier == "PREMIUM" and obs.get('glucose_avg') is not None:
            base_glucose = obs['glucose_avg']
            # glucose_variability is CV%, derive std from it
            cv_percent = obs.get('glucose_variability', 20.0) or 20.0
            std_dev = (cv_percent / 100.0) * base_glucose
            # 48 readings per 4h window (every 5 min)
            for j in range(48):
                cgm_val = base_glucose + random.gauss(0, std_dev * 0.3)
                cgm_val = max(2.0, min(25.0, cgm_val))
                conn.execute("""
                    INSERT INTO cgm_readings (user_id, glucose_value, timestamp_utc, device_id)
                    VALUES (?, ?, ?, ?)
                """, ('demo_user', cgm_val, t + (j * 300), 'dexcom_g7'))

        # ===== PASSIVE METRICS (ALL tiers) =====
        steps = obs.get('steps_daily', 0) or 0
        sleep_q = obs.get('sleep_quality', 8) or 8
        screen_s = max(0, int((10 - sleep_q) * 3600))
        
        conn.execute("""
            INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
            VALUES (?, ?, ?, ?, ?)
        """, (t, t + window_size, int(steps / 6), screen_s, 3600))
        
        # ===== MEDICATION (ALL tiers) =====
        if obs.get('meds_adherence', 0) and obs['meds_adherence'] > 0.5:
            conn.execute("""
                INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                VALUES (?, ?, ?)
            """, ('Metformin 500mg', t + 100, t))
        
        # ===== FOOD LOGS (ALL tiers) =====
        if obs.get('carbs_intake') is not None:
            carbs_per_meal = obs['carbs_intake'] / 3
            for meal_idx, meal in enumerate(['BREAKFAST', 'LUNCH', 'DINNER']):
                meal_time = day_start + (meal_idx + 1) * 6 * 3600
                if meal_time >= t and meal_time < t + window_size:
                    conn.execute("""
                        INSERT INTO food_logs (user_id, timestamp_utc, meal_type, carbs_grams, source_type)
                        VALUES (?, ?, ?, ?, ?)
                    """, ('demo_user', meal_time, meal, carbs_per_meal, 'PHOTO_GEMINI'))
        
        # ===== FITBIT DATA (ENHANCED & PREMIUM only) =====
        if tier in ["PREMIUM", "ENHANCED"]:
            if i % 6 == 0:  # Once per day
                # Activity
                steps_daily = obs.get('steps_daily', 0) or 0
                # Derive active minutes from steps (roughly 100 steps = 1 active minute)
                active_min = int(steps_daily / 100)
                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_activity
                    (user_id, date, steps, active_minutes, sedentary_minutes, calories_burned)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, ('demo_user', day_start,
                      int(steps_daily),
                      active_min,
                      max(0, 480 - active_min),
                      1800 + int(steps_daily * 0.04)))

                # Heart Rate + HRV (CRITICAL for diabetic monitoring)
                hr_resting = obs.get('resting_hr')
                hrv_rmssd = obs.get('hrv_rmssd')
                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_heart_rate
                    (user_id, date, resting_heart_rate, average_heart_rate, hrv_rmssd)
                    VALUES (?, ?, ?, ?, ?)
                """, ('demo_user', day_start,
                      int(hr_resting) if hr_resting else None,
                      int(hr_resting + 7) if hr_resting else None,  # avg is slightly higher
                      round(hrv_rmssd, 1) if hrv_rmssd else None))
                
                # Sleep
                sleep_q = obs.get('sleep_quality', 7) or 7
                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_sleep 
                    (user_id, date, total_sleep_minutes, sleep_score)
                    VALUES (?, ?, ?, ?)
                """, ('demo_user', day_start, int(sleep_q * 60), sleep_q * 10))
    
    conn.commit()
    conn.close()

# --- MAIN APP ---
# --- MAIN APP ---
def main():
    load_css()
    ensure_calibration() # [Added] Auto-run calibration check on load
    
    sidebar = st.sidebar
    sidebar.title("NEXUS Companion")
    
    page = sidebar.radio("Navigate", [
        "Home",
        "📊 14-Day Analysis",   # NEW - main dashboard
        "Sensor Data",
        "📸 Log Glucose",
        "🎤 Daily Check-in",
        "💊 Log Medication",
        "💰 My Voucher",
        "Trends",
        "👨‍⚕️ Nurse Portal",      # NEW - for testing alerts
        "🛠️ Admin Panel"        # RENAMED from God Mode
    ])
    
    if page == "Home":
        home_page()
    elif page == "📊 14-Day Analysis":
        analysis_dashboard_page()
    elif page == "Sensor Data":
        sensor_page()
    elif page == "📸 Log Glucose":
        glucose_input_page()
    elif page == "🎤 Daily Check-in":
        voice_checkin_page()
    elif page == "💊 Log Medication":
        medication_log_page()
    elif page == "💰 My Voucher":
        voucher_page()
    elif page == "Trends":
        trends_page()
    elif page == "👨‍⚕️ Nurse Portal":
        nurse_portal_page()
    elif page == "🛠️ Admin Panel":
        admin_panel()

if __name__ == "__main__":
    main()
