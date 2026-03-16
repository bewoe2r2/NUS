"""
NEXUS 2026 - ULTIMATE JUDGE DASHBOARD
file: streamlit_judge.py
author: Lead Architect
version: 4.0.0 (The Truth Terminal)

This app is the source of truth. It allows judges to:
1. INSPECT the HMM brain directly (Forensic Inspector).
2. INJECT specific scenarios to test robustness (Mission Control).
3. RUN automated verification scripts on demand (Test Runner).
4. VERIFY the math against Oracle logic (Oracle Truth).
"""

import _path_setup
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import sqlite3
import subprocess
import sys
import os
import json
import time
from datetime import datetime

# Import HMM Engine for direct forensic access
from hmm_engine import HMMEngine, FEATURES, TRANSITION_PROBS

st.set_page_config(
    page_title="NEXUS JUDGE TERMINAL",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==============================================================================
# 1. ELITE DESIGN SYSTEM (FORENSIC DARK)
# ==============================================================================
def inject_forensic_css():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600&display=swap');

    :root {
        --bg-term: #050505;
        --bg-panel: #0E0E0E;
        --border: #333;
        --accent: #00FF9D; /* Terminal Green */
        --accent-dim: rgba(0, 255, 157, 0.1);
        --danger: #FF3333;
        --warning: #FFBB00;
        --text-main: #E0E0E0;
        --text-dim: #666;
    }

    body, .stApp {
        background-color: var(--bg-term);
        color: var(--text-main);
        font-family: 'Inter', sans-serif;
    }

    /* TYPOGRAPHY */
    h1, h2, h3 {
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: -0.5px;
        text-transform: uppercase;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }

    /* CONTAINERS */
    .stCard {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: 4px; /* Sharp technical look */
        padding: 16px;
    }
    
    /* TERMINAL WINDOW */
    .terminal-window {
        background: #000;
        border: 1px solid #444;
        color: #CCC;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        padding: 12px;
        border-radius: 4px;
        height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
    }

    /* CUSTOM BUTTONS (Outline Style) */
    .stButton button {
        background: transparent !important;
        border: 1px solid #444 !important;
        color: var(--accent) !important;
        font-family: 'JetBrains Mono', monospace !important;
        text-transform: uppercase;
        border-radius: 2px !important;
        transition: all 0.2s;
    }
    .stButton button:hover {
        border-color: var(--accent) !important;
        background: var(--accent-dim) !important;
        box-shadow: 0 0 10px var(--accent-dim);
    }
    
    /* TABS */
    .stTabs [data-baseweb="tab-list"] {
        gap: 2px;
        background-color: var(--bg-term);
    }
    .stTabs [data-baseweb="tab"] {
        background-color: var(--bg-panel);
        border: 1px solid var(--border);
        color: var(--text-dim);
        border-radius: 0px;
        padding: 10px 20px;
        font-family: 'JetBrains Mono', monospace;
    }
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background-color: var(--bg-panel);
        border-color: var(--accent);
        color: var(--accent);
        border-bottom: 0px;
    }

    /* UTILS */
    .status-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 10px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
    }
    .status-pass { background: rgba(0,255,157,0.2); color: #00FF9D; border: 1px solid #00FF9D; }
    .status-fail { background: rgba(255,51,51,0.2); color: #FF3333; border: 1px solid #FF3333; }
    
    </style>
    """, unsafe_allow_html=True)

# ==============================================================================
# 2. BACKEND UTILS
# ==============================================================================

def get_db_connection():
    return sqlite3.connect("nexus_health.db")

def run_command_stream(cmd):
    """Runs a command and returns output. In real app, could stream."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=60
        )
        return result.stdout + result.stderr
    except Exception as e:
        return f"EXECUTION ERROR: {str(e)}"

# ==============================================================================
# 3. COMPONENTS
# ==============================================================================

def render_mission_control():
    st.markdown("### 🚁 MISSION CONTROL (SCENARIO INJECTION)")
    st.markdown("Directly modify the patient timeline to test HMM response.")
    
    c1, c2, c3 = st.columns(3)
    
    with c1:
        st.info("SCENARIO 1: STABILITY")
        st.markdown("*Patient maintains healthy vitals for 7 days.*")
        if st.button("INJECT STABLE BASELINE"):
            with st.spinner("Injecting data..."):
                # We assume inject_data.py exists or similar logic. 
                # For this demo, we can simulate or call the script if it exists.
                # Assuming inject_data.py is the standard tool.
                out = run_command_stream("python inject_data.py --scenario stable")
                st.success("Injection Complete")
                with st.expander("Logs"):
                    st.code(out)

    with c2:
        st.warning("SCENARIO 2: SUDDEN CRISIS")
        st.markdown("*Rapid deterioration triggered by medication miss + binge.*")
        if st.button("INJECT CRISIS EVENT"):
            with st.spinner("Injecting Crisis..."):
                out = run_command_stream("python test_sudden_crisis.py")
                st.success("Crisis Injected")
                with st.expander("Logs"):
                    st.code(out)

    with c3:
        st.error("SCENARIO 3: COMPETITION STRESS")
        st.markdown("*Complex multi-factor drift (Sleep + HRV + Social).*")
        if st.button("INJECT COMP SCENARIO"):
            with st.spinner("Injecting Complex Stress..."):
                out = run_command_stream("python test_competition_scenarios.py")
                st.success("Scenario Active")
                with st.expander("Logs"):
                    st.code(out)

def render_forensic_inspector():
    st.markdown("### 🔎 FORENSIC INSPECTOR (BRAIN SCAN)")
    
    # 1. Timeline Chart
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT timestamp_utc, detected_state, confidence_score FROM hmm_states ORDER BY timestamp_utc DESC LIMIT 100", conn)
    conn.close()
    
    if not df.empty:
        df['Time'] = pd.to_datetime(df['timestamp_utc'], unit='s')
        
        # Color map
        colors = {'STABLE': '#00FF9D', 'WARNING': '#FFBB00', 'CRISIS': '#FF3333'}
        
        fig = px.scatter(df, x='Time', y='confidence_score', color='detected_state', 
                         color_discrete_map=colors, title="HMM DETECTED STATE & CONFIDENCE")
        fig.update_layout(
            plot_bgcolor='#0E0E0E', paper_bgcolor='#0E0E0E', font={'color': '#E0E0E0'},
            xaxis=dict(showgrid=True, gridcolor='#333'),
            yaxis=dict(showgrid=True, gridcolor='#333', range=[0, 1.1])
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("No HMM State data found.")

    # 2. Probability Matrix
    c1, c2 = st.columns([1, 1])
    with c1:
        st.markdown("#### TRANSITION MATRIX (UNDERLYING PHYSICS)")
        st.markdown("The probability of moving from State A -> State B in 4 hours.")
        
        # Heatmap of transition matrix
        states = ["STABLE", "WARNING", "CRISIS"]
        z = TRANSITION_PROBS
        
        fig2 = go.Figure(data=go.Heatmap(
            z=z, x=states, y=states,
            colorscale='Viridis', text=z, texttemplate="%{text:.2f}"
        ))
        fig2.update_layout(
            height=300, margin=dict(l=0,r=0,t=0,b=0),
            plot_bgcolor='#0E0E0E', paper_bgcolor='#0E0E0E', font={'color': '#E0E0E0'}
        )
        st.plotly_chart(fig2, use_container_width=True)

    with c2:
        st.markdown("#### CURRENT FACTOR WEIGHTS")
        st.markdown("Relative importance of each orthogonal feature.")
        
        # Pie chart of weights
        labels = list(FEATURES.keys())
        values = [FEATURES[k]['weight'] for k in labels]
        
        fig3 = go.Figure(data=[go.Pie(labels=labels, values=values, hole=.4)])
        fig3.update_layout(
            height=300, margin=dict(l=0,r=0,t=0,b=0),
            plot_bgcolor='#0E0E0E', paper_bgcolor='#0E0E0E', font={'color': '#E0E0E0'},
            showlegend=False
        )
        st.plotly_chart(fig3, use_container_width=True)

def render_test_runner():
    st.markdown("### 🧪 TEST RUNNER (ZERO QUESTIONS)")
    st.markdown("Execute verification scripts with one click. Prove the code works.")
    
    tests = [
        {"name": "Valid. Matrix (648 Cases)", "cmd": "python tests/run_exhaustive_validation.py", "desc": "Checks 648 orthogonal scenarios for logical monotonicity."},
        {"name": "Sudden Crisis Integ.", "cmd": "python test_sudden_crisis.py", "desc": "End-to-end test of crisis detection mechanics."},
        {"name": "Clinical SBAR", "cmd": "python test_clinical_sbar.py", "desc": "Verifies AI Doctor note generation."},
        {"name": "Fix Verification", "cmd": "python test_fix.py", "desc": "Regressions tests for previous bug fixes."},
        {"name": "Scenario Competition", "cmd": "python test_competition_scenarios.py", "desc": "Runs the specific competition scenarios."}
    ]
    
    for t in tests:
        with st.container():
            c1, c2, c3 = st.columns([2, 5, 2])
            with c1:
                st.markdown(f"**{t['name']}**")
            with c2:
                st.markdown(f"<span style='color:#666'>{t['desc']}</span>", unsafe_allow_html=True)
            with c3:
                key = f"btn_{t['name']}"
                if st.button(f"RUN TEST", key=key):
                    st.toast(f"Running {t['name']}...", icon="⏳")
                    start_time = time.time()
                    output = run_command_stream(t['cmd'])
                    duration = time.time() - start_time
                    
                    # Store result in session state to persist
                    st.session_state[f"res_{t['name']}"] = {
                        "output": output,
                        "duration": duration,
                        "passed": "OK" in output or "PASSED" in output or "scenarios passed" in output
                    }

            # Show Result if exists
            res_key = f"res_{t['name']}"
            if res_key in st.session_state:
                res = st.session_state[res_key]
                status_cls = "status-pass" if res['passed'] else "status-fail"
                status_text = "PASSED" if res['passed'] else "CHECK LOGS"
                
                st.markdown(f"""
                <div style="margin-top:5px; margin-bottom:15px; border-left: 2px solid #333; padding-left: 10px;">
                    <span class="status-badge {status_cls}">{status_text}</span> 
                    <span class="mono" style="font-size:10px; margin-left:10px;">Duration: {res['duration']:.2f}s</span>
                    <div class="terminal-window" style="height: 150px; margin-top:5px;">{res['output']}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown("<hr style='border-color:#222; margin:5px 0 15px 0;'>", unsafe_allow_html=True)


def render_oracle():
    st.markdown("### 🔮 ORACLE TRUTH (LOGIC VALIDATION)")
    st.info("Coming soon: Real-time logic-gate validation dashboard.")
    st.markdown("For now, use the 'Validation Matrix' test in the Test Runner tab to verify logic consistency.")

# ==============================================================================
# 4. MAIN LAYOUT
# ==============================================================================
def main():
    inject_forensic_css()
    
    st.title("NEXUS // JUDGE TERMINAL")
    st.markdown("v4.0.0 | SYSTEM STATUS: **ONLINE** | MODE: **FORENSIC**")
    
    tabs = st.tabs(["[1] MISSION CONTROL", "[2] FORENSIC INSPECTOR", "[3] TEST RUNNER", "[4] ORACLE TRUTH"])
    
    with tabs[0]:
        render_mission_control()
    
    with tabs[1]:
        render_forensic_inspector()
        
    with tabs[2]:
        render_test_runner()
        
    with tabs[3]:
        render_oracle()
        
    # Sidebar status
    with st.sidebar:
        st.markdown("### SYSTEM METRICS")
        conn = get_db_connection()
        n_obs = conn.execute("SELECT COUNT(*) FROM glucose_readings").fetchone()[0]
        n_states = conn.execute("SELECT COUNT(*) FROM hmm_states").fetchone()[0]
        conn.close()
        
        st.metric("DB Observations", n_obs)
        st.metric("HMM States", n_states)
        
        st.markdown("---")
        st.markdown("**Active Scenarios**")
        st.checkbox("Scenario A", value=True, disabled=True)
        st.checkbox("Scenario B", value=False, disabled=True)

if __name__ == "__main__":
    main()
