
import sqlite3
import json
import os
from datetime import datetime
from hmm_engine import HMMEngine, STATES
from gemini_integration import GeminiIntegration

def verify_sbar_integration():
    print("=== VERIFYING SBAR COUNTERFACTUAL INTEGRATION ===")
    
    # 1. Setup Data (Inject CRISIS scenario)
    engine = HMMEngine()
    # Using 'warning_to_crisis' scenario, 14 days
    print("\n[1] generating 'warning_to_crisis' scenario...")
    obs = engine.generate_demo_scenario("warning_to_crisis", days=14)
    
    # Manually inject to DB (simplified version of streamlit logic)
    conn = sqlite3.connect("nexus_health.db")
    conn.execute("DELETE FROM hmm_states")
    conn.execute("DELETE FROM passive_metrics")
    conn.execute("DELETE FROM glucose_readings")
    
    # Inject just the last few observations to establish state
    # We'll assume the engine.fetch_observations will pick them up
    # We need to populate the tables that fetch_observations reads from.
    # For simplicity, let's just mock the `observations` list directly for the inference step
    # BUT `gemini_integration` fetches context from DB, so we DO need DB data.
    
    # Let's populate the DB with the generated observations
    print("[2] Populating Mock DB...")
    now = int(datetime.now().timestamp())
    start_time = now - (14 * 24 * 3600)
    window_size = 4 * 3600
    
    for i, o in enumerate(obs):
        t = start_time + (i * window_size)
        if o.get('glucose_avg'):
            conn.execute("INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type) VALUES (?, ?, ?, ?)",
                         ('demo_user', o['glucose_avg'], t, 'MANUAL'))
        
        conn.execute("INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count) VALUES (?, ?, ?)",
                     (t, t+window_size, o.get('steps_daily', 0)//6))
                     
    conn.commit()
    conn.close()
    
    # 2. Run Inference
    print("\n[3] Running Inference...")
    observations = engine.fetch_observations(days=7)
    inference_result = engine.run_inference(observations)
    
    current_state = inference_result['current_state']
    confidence = inference_result['confidence']
    probs_dict = inference_result.get('state_probabilities', {})
    probs = [probs_dict.get(s, 0.0) for s in STATES]
    
    print(f"   Current State: {current_state}")
    print(f"   Confidence: {confidence:.2f}")
    print(f"   Probs: {probs}")
    
    if current_state != "CRISIS":
        print("   [WARN] Expected CRISIS state for this test, but got", current_state)
        # Force it for the test if needed, or just proceed
    
    # 3. Simulate Interventions
    print("\n[4] Simulating Interventions...")
    scenarios = {
        "Medication Adherence (100%)": {'meds_adherence': 1.0},
        "Dietary Control (150g Carbs)": {'carbs_intake': 150},
    }
    
    forecasts = {}
    for name, update in scenarios.items():
        res = engine.simulate_intervention(probs, update)
        print(f"   Scenario '{name}': {res.get('risk_level', 'N/A')} ({res.get('improvement_pct', 0):.1f}% improvement)")
        if res.get('validity') == 'VALID':
            forecasts[name] = res

    print(f"\n[DEBUG] Forecasts dict keys: {list(forecasts.keys())}")
    print(f"[DEBUG] Full forecasts: {json.dumps(forecasts, indent=2)}")
            
    # 4. Generate SBAR
    print("\n[5] Generating SBAR with Forecasts...")
    gi = GeminiIntegration() # Assumes API key is in env or .env
    
    weekly_data = {
        'patient_name': 'Test Patient',
        'current_state': current_state,
        'confidence': confidence,
        'latest_vitals': {'glucose': 15.0}, # Mock
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    
    try:
        report = gi.generate_sbar_report(weekly_data, include_full_context=False, intervention_forecasts=forecasts)
        sbar_text = report.get('sbar_text', '')
        
        # Safe print function
        def safe_print(text):
            try:
                print(text)
            except UnicodeEncodeError:
                print(text.encode('ascii', 'replace').decode('ascii'))

        print("\n=== GENERATED SBAR REPORT ===")
        safe_print(sbar_text)
        print("=============================")
        
        # 5. Verify Content
        if "AI RISK PROJECTIONS" in sbar_text or "AI projects" in sbar_text:
            print("\n[SUCCESS] Counterfactual forecasts found in SBAR report.")
        else:
            print("\n[FAILURE] Counterfactual text NOT found in SBAR report.")
            
    except Exception as e:
        print(f"\n[ERROR] during SBAR generation: {e}")

if __name__ == "__main__":
    verify_sbar_integration()
