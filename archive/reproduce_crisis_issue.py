
import _path_setup
import sys
import os
import sqlite3
import json
from datetime import datetime

from hmm_engine import HMMEngine

def test_sudden_crisis_detection():
    print("Initializing HMM Engine...")
    engine = HMMEngine()
    
    print("Generating 'sudden_crisis' scenario (14 days)...")
    
    TEST_DB = "test_crisis_repro.db"
    
    # Clean up previous runs
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except:
            pass
        
    engine.db_path = TEST_DB
    
    # Create tables first
    print(f"Creating test database: {TEST_DB}")
    conn = sqlite3.connect(TEST_DB)
    # We need to find nexus_schema.sql
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_schema.sql")
    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.close()
    
    # Patch get_db_connection in inject_data to use our test DB
    import inject_data
    inject_data.DB_PATH = TEST_DB
    
    # Generate data
    raw_obs = engine.generate_demo_scenario("sudden_crisis", days=14)
    
    # Inject data
    print(f"Injecting {len(raw_obs)} observations into {TEST_DB}...")
    inject_data.inject_tiered_scenario_to_db(raw_obs, tier="PREMIUM", days=14)
    
    # Fetch observations (Applying the rolling window logic)
    print("Fetching observations with rolling window logic...")
    observations = engine.fetch_observations(days=14)
    
    print(f"Fetched {len(observations)} rolling observations.")
    
    # DEBUG: Print values around Day 12 (crisis)
    print("\n--- DEBUG OBSERVATION VALUES (Day 11-13) ---")
    start_idx = 11 * 6 # Day 11 start
    for i in range(start_idx, len(observations)):
        obs = observations[i]
        print(f"Idx {i} (Day {i//6}): Glucose={obs.get('glucose_avg')}, Meds={obs.get('meds_adherence')}")
        
        # Check safety manually
        s, r = engine.safety_monitor.check_safety(obs)
        if s:
            print(f"   -> SAFETY TRIGGER: {s} ({r})")
    
    # Run Inference on the sequence
    print("\nRunning Viterbi Inference...")
    result = engine.run_inference(observations)
    
    print(f"Result method: {result.get('method')}")
    print(f"Result final state: {result.get('current_state')}")

    if 'path_states' in result:
        # ... existing verification code ...
        pass
            
    else:
        print("\nWARNING: No 'path_states' returned. Likely Safety Override.")
        print(f"Reason: {result.get('reason')}")
        if result.get('current_state') == 'CRISIS':
             print("SUCCESS: CRISIS detected (via Safety Rule).")
        else:
             print("FAIL: Safety triggered but not CRISIS?")

    # Clean up
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except:
            pass

if __name__ == "__main__":
    test_sudden_crisis_detection()
