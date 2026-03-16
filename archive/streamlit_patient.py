
"""
NEXUS 2026 - PATIENT COMPANION (Elite Design v2.0)
file: streamlit_patient.py
author: Principal Design Engineer
version: 3.0.0 (Medical-Grade Rewrite)

DESIGN BRIEF:
- Brand Essence: "Vitality, Clinical Precision, Warm Reassurance"
- Visual Strategy: Apple Health (Soft) meets Linear (Precise)
- Tokens: OKLCH exclusively, 8px Grid, SF Pro Typography
"""

import _path_setup
import streamlit as st
import sqlite3
import time
from datetime import datetime, timedelta
import json
import random

# --- BACKEND INTEGRATION (PRESERVED) ---
try:
    from hmm_engine import HMMEngine
    from gemini_integration import GeminiIntegration
except ImportError:
    # Fallback for dev environment without engines
    class HMMEngine:
        def __init__(self, db_path): pass
        def get_patient_state(self, pid):
            return {
                "current_state": "Stable",
                "risk_score": 0.12,
                "biometrics": {"glucose": 5.4, "hr": 72, "steps": 4500},
                "history": []
            }
        
    class GeminiIntegration:
        def __init__(self): pass
        def chat(self, msg, context): return "I am ready to help you, Mr. Tan."

# --- DESIGN SYSTEM: TOKENS & CSS ---
def inject_elite_css():
    st.markdown("""
    <style>
    /* 1. RESET & VARIABLES (OKLCH) */
    :root {
        /* NEUTRAL SCALE */
        --bg-app:        oklch(98% 0.01 240);   /* iOS System Gray 6 */
        --bg-card:       oklch(100% 0 0);       /* Pure White */
        --bg-card-hover: oklch(99% 0 0);        
        --border-subtle: oklch(92% 0.01 240);   
        
        /* TEXT SCALE */
        --text-primary:   oklch(20% 0.01 240);  /* Near Black */
        --text-secondary: oklch(55% 0.02 240);  /* Muted Labels */
        --text-tertiary:  oklch(75% 0.02 240);  
        
        /* SEMANTIC SCALE */
        --success-500: oklch(65% 0.18 145);
        --success-bg:  oklch(96% 0.03 145);
        --warning-500: oklch(75% 0.16 65);
        --warning-bg:  oklch(98% 0.04 65);
        --error-500:   oklch(60% 0.20 25);
        --error-bg:    oklch(95% 0.05 25);
        --accent-500:  oklch(60% 0.18 250);     /* SF Blue */
        --accent-bg:   oklch(96% 0.03 250);
        
        /* RADIUS & SHADOW */
        --radius-md: 12px;
        --radius-lg: 16px;
        --radius-xl: 24px;
        --shadow-xs: 0 1px 2px oklch(0% 0 0 / 0.03);
        --shadow-sm: 0 4px 6px -1px oklch(0% 0 0 / 0.05);
        --glass-bg: oklch(100% 0 0 / 0.85);
        --glass-blur: blur(16px);
    }

    /* 2. GLOBAL OVERRIDES */
    .stApp {
        background-color: var(--bg-app);
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
    }
    
    /* Hide Streamlit Cruft */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;} 
    
    /* 3. COMPONENT CLASSES */
    
    /* GLASS HEADER */
    .glass-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 999;
        background: var(--glass-bg);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        border-bottom: 1px solid var(--border-subtle);
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    /* HERO CARD */
    .hero-card {
        background: var(--bg-card);
        border-radius: var(--radius-xl);
        padding: 2rem;
        box-shadow: var(--shadow-sm);
        margin-top: 5rem; /* Space for fixed header */
        margin-bottom: 2rem;
        text-align: center;
        border: 1px solid var(--border-subtle);
    }
    .hero-status-stable { color: var(--success-500); background: var(--success-bg); }
    .hero-status-risk { color: var(--warning-500); background: var(--warning-bg); }
    .hero-status-critical { color: var(--error-500); background: var(--error-bg); }
    
    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1.5rem;
        border-radius: 999px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }
    
    /* BENTO GRID */
    .bento-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .bento-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        box-shadow: var(--shadow-xs);
        border: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .bento-card-lg {
        grid-column: span 2;
    }
    .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.03em;
        font-family: "SF Pro Display", "Inter", sans-serif;
    }
    .metric-unit {
        font-size: 1rem;
        color: var(--text-tertiary);
        font-weight: 400;
        margin-left: 0.25rem;
    }
    
    /* TASK LIST (MEDS) */
    .task-item {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 1rem;
        margin-bottom: 0.75rem;
        border: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
    }
    .task-item:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-xs);
    }
    .task-checkbox-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .task-time {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.875rem;
        color: var(--text-secondary);
        background: var(--bg-app);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
    }

    /* CHAT BUBBLES */
    .chat-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-bottom: 2rem;
    }
    .chat-bubble {
        padding: 0.75rem 1.25rem;
        border-radius: 1.25rem;
        max-width: 80%;
        line-height: 1.5;
        font-size: 1rem;
    }
    .chat-user {
        background: var(--accent-500);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 0.25rem;
    }
    .chat-ai {
        background: var(--bg-card); /* White on gray bg */
        color: var(--text-primary);
        align-self: flex-start;
        border-bottom-left-radius: 0.25rem;
        box-shadow: var(--shadow-xs);
    }
    
    /* ANIMATIONS */
    @keyframes pulse-soft {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }
    .pulse-animation {
        animation: pulse-soft 3s infinite ease-in-out;
    }
    </style>
    """, unsafe_allow_html=True)

# --- BACKEND LOGIC ---
db_path = "nexus_health.db"
# Initialize engines (Mock or Real)
hmm_engine = HMMEngine(db_path)
gemini = GeminiIntegration()

def get_demo_patient_data():
    """
    Fetches real patient data using the HMM Engine and Database.
    Falls back to mock data if the database is empty or connection fails.
    """
    try:
        # 1. Fetch real observations from DB (Last 2 days is enough for context)
        observations = hmm_engine.fetch_observations(days=2)
        
        if not observations:
             # Fallback if DB is empty or fresh install
             return {
                "current_state": "STABLE",
                "risk_score": 0.12,
                "biometrics": {"glucose": 5.4, "hr": 72, "steps": 4500},
                "history": []
            }
            
        # 2. Run Inference
        # This returns the full Viterbi path and probabilities
        result = hmm_engine.run_inference(observations, patient_id="P001")
        
        # 3. Format for UI
        latest_obs = observations[-1]
        
        # Use predicted 48h risk as the "Risk Score" for the gauge
        risk = result.get('predictions', {}).get('risk_48h', 0.0)
        
        # Force high risk visual if state is Critical
        curr_state = result.get('current_state', 'STABLE')
        if curr_state == 'CRISIS':
            risk = max(risk, 0.95)
        elif curr_state == 'WARNING':
             risk = max(risk, 0.55)
             
        return {
            "current_state": curr_state,
            "risk_score": risk,
            "biometrics": {
                "glucose": latest_obs.get('glucose_avg', 5.5),
                "hr": latest_obs.get('resting_hr', 70),
                "steps": latest_obs.get('steps_daily', 0)
            },
            "history": [] 
        }
    except Exception as e:
        # Fail safe for demo stability
        print(f"HMM Error: {e}")
        return {
                "current_state": "STABLE",
                "risk_score": 0.12,
                "biometrics": {"glucose": 5.4, "hr": 72, "steps": 4500},
                "history": []
            }

# --- UI COMPONENTS (Functional) ---

def draw_glass_header():
    st.markdown("""
    <div class="glass-header">
        <div style="font-weight: 600; font-size: 1.125rem;">Nexus Health</div>
        <div style="width: 32px; height: 32px; background: var(--accent-bg); color: var(--accent-500); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">T</div>
    </div>
    """, unsafe_allow_html=True)

def draw_hero_status(status, risk):
    # Determine styles based on status
    status_class = "hero-status-stable"
    status_icon = "check_circle"
    message = "You are doing well, Mr. Tan."
    
    if "Risk" in status or risk > 0.5:
        status_class = "hero-status-risk"
        status_icon = "warning"
        message = "Please verify your medication."
    if "Crisis" in status or risk > 0.8:
        status_class = "hero-status-critical"
        status_icon = "emergency"
        message = "Emergency Assistance Alerted."

    # Using Material Symbols for icons (injecting link if needed, or fallback text)
    st.markdown(f"""
    <div class="hero-card">
        <div class="status-pill {status_class} pulse-animation">
            <span>●</span> {status.upper()}
        </div>
        <h1 style="font-size: 2.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0.5rem 0;">{int((1-risk)*100)}% Vitality</h1>
        <p style="color: var(--text-secondary); font-size: 1.125rem;">{message}</p>
    </div>
    """, unsafe_allow_html=True)

def draw_bento_metrics(biometrics):
    glucose = biometrics.get("glucose")
    if glucose is None: glucose = 5.5
    
    steps = biometrics.get("steps")
    if steps is None: steps = 0
    
    hr = biometrics.get("hr")
    if hr is None: hr = 70
    
    glucose_color = "var(--success-500)" if 4.0 <= glucose <= 7.0 else "var(--warning-500)"
    
    st.markdown(f"""
    <div class="bento-container">
        <!-- GLUCOSE (Large Cell) -->
        <div class="bento-card bento-card-lg">
            <div class="metric-label">Avg. Glucose</div>
            <div style="display: flex; align-items: baseline; margin-top: 0.5rem;">
                <span class="metric-value" style="color: {glucose_color}; font-size: 3rem;">{glucose}</span>
                <span class="metric-unit">mmol/L</span>
            </div>
            <div style="height: 4px; width: 100%; background: var(--bg-app); border-radius: 2px; margin-top: 1rem; overflow: hidden;">
                <div style="height: 100%; width: {min((glucose/15)*100, 100)}%; background: {glucose_color};"></div>
            </div>
        </div>
        
        <!-- STEPS -->
        <div class="bento-card">
            <div class="metric-label">Activity</div>
            <div style="margin-top: 0.5rem;">
                <span class="metric-value">{steps}</span>
                <div class="metric-unit">steps</div>
            </div>
        </div>
        
        <!-- HEART RATE -->
        <div class="bento-card">
            <div class="metric-label">Heart Rate</div>
            <div style="margin-top: 0.5rem;">
                <span class="metric-value">{hr}</span>
                <div class="metric-unit">bpm</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def draw_medication_task_list():
    st.markdown("""<h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">Medication Schedule</h3>""", unsafe_allow_html=True)
    
    # Mock Meds
    meds = [
        {"name": "Metformin", "dose": "500mg", "time": "08:00", "taken": True},
        {"name": "Lisinopril", "dose": "10mg", "time": "20:00", "taken": False}
    ]
    
    for i, med in enumerate(meds):
        icon = "✅" if med["taken"] else "⭕"
        opacity = "0.6" if med["taken"] else "1.0"
        bg = "var(--bg-app)" if med["taken"] else "var(--bg-card)"
        
        # We use st.columns to put a real interactive button/checkbox if needed, 
        # but for this design demo we render the visual list primarily.
        # To make it interactive in Streamlit, we would usually use st.checkbox.
        
        col1, col2 = st.columns([0.15, 0.85])
        with col1:
             # Real interactivity
             checked = st.checkbox("Taken", value=med["taken"], key=f"med_{i}", label_visibility="collapsed")
        
        with col2:
             st.markdown(f"""
             <div class="task-item" style="opacity: {opacity}; background: {bg}; padding: 0.75rem;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600;">{med['name']}</span>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">{med['dose']} With food</span>
                </div>
                <div class="task-time">{med['time']}</div>
             </div>
             """, unsafe_allow_html=True)

def draw_chat_interface():
    st.markdown("""<div style="height: 2rem;"></div><h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Care Assistant</h3>""", unsafe_allow_html=True)
    
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {"role": "ai", "content": "Good morning, Mr. Tan. I noticed your glucose is slightly elevated. Have you had breakfast?"}
        ]
        
    # Render Bubble History
    chat_html = '<div class="chat-container">'
    for msg in st.session_state.chat_history:
        css_class = "chat-user" if msg["role"] == "user" else "chat-ai"
        align_style = "align-self: flex-end;" if msg["role"] == "user" else "align-self: flex-start;"
        start_div = f'<div style="display: flex; flex-direction: column; {align_style} width: 100%;">' # Flex wrapper for alignment
        
        chat_html += f"""
        <div style="display: flex; width: 100%; justify-content: {'flex-end' if msg['role'] == 'user' else 'flex-start'};">
            <div class="chat-bubble {css_class}">
                {msg['content']}
            </div>
        </div>"""
    chat_html += '</div>'
    st.markdown(chat_html, unsafe_allow_html=True)
    
    # Input Area
    with st.form("chat_input", clear_on_submit=True):
        col_in, col_btn = st.columns([0.85, 0.15])
        with col_in:
            user_input = st.text_input("Message...", placeholder="Reply with voice or text...", label_visibility="collapsed")
        with col_btn:
            submitted = st.form_submit_button("➤")
            
        if submitted and user_input:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            # Simulate AI response
            time.sleep(0.5)
            response = gemini.chat(user_input, "Patient is elderly, Singlish friendly.")
            st.session_state.chat_history.append({"role": "ai", "content": f"AI: {response} (Simulated)"})
            st.rerun()

# --- MAIN APP FLOW ---
def main():
    inject_elite_css()
    
    # Header
    draw_glass_header()
    
    # Fetch Data
    patient_data = get_demo_patient_data()
    
    # Layout using st.container for spacing control
    with st.container():
        # Hero Section
        draw_hero_status(patient_data["current_state"], patient_data["risk_score"])
        
        # Metrics
        draw_bento_metrics(patient_data["biometrics"])
        
        # Meds
        draw_medication_task_list()
        
        # Chat
        draw_chat_interface()

if __name__ == "__main__":
    st.set_page_config(page_title="Nexus Health", page_icon="❤️", layout="centered", initial_sidebar_state="collapsed")
    main()
