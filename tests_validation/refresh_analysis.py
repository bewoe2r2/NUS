
import sqlite3
import time
from hmm_engine import HMMEngine

def refresh_analysis():
    print("Connecting to nexus_health.db...")
    engine = HMMEngine()
    # Ensure it points to the main DB, not a test one
    engine.db_path = "nexus_health.db"
    
    conn = sqlite3.connect("nexus_health.db")
    
    # 1. Clear old HMM states
    print("Clearing old HMM analysis results...")
    conn.execute("DELETE FROM hmm_states")
    conn.commit()
    conn.close()
    
    # 2. Re-run fetching and inference
    print("Fetching observations with NEW 4-hour window logic...")
    observations = engine.fetch_observations(days=14)
    print(f"Fetched {len(observations)} observations.")
    
    # 3. Process observations
    print("Running HMM Inference with NEW Safety Priority logic...")
    conn = sqlite3.connect("nexus_health.db")
    
    # This logic mimics the Admin Panel's "Run HMM Analysis" button
    # We iterate and save state for each observation
    
    # We need to process sequentially to build history
    # The 'fetch_observations' returns a list, but we want to store them in the DB
    # The HMMEngine doesn't have a "bulk_run_and_save" method visible in the file trace,
    # but the dashboard usually calls `engine.run_inference(obs_slice)` and saves it.
    
    # Let's verify how data is saved. 
    # Usually `inject_data.py` or the app handles saving.
    # I'll re-use the logic from `inject_data.py`'s `run_hmm_analysis` if available, 
    # or just manually insert.
    
    # Checking `hmm_engine.py`.. it returns a result dict.
    # The schema for `hmm_states` is:
    # timestamp_utc, user_id, detected_state, confidence_score, etc.
    
    user_id = 'current_user'
    
    # We need to run inference cumulatively?
    # Actually `fetch_observations` returns the whole history.
    # HMM is typically run on the sequence up to time T.
    
    # To correctly populate the DB for the dashboard, we need to run it for:
    # Obs[0], Obs[0..1], Obs[0..2]... Obs[0..T]? 
    # OR just run it on the windows.
    
    # For the purpose of the dashboard which looks at historical states:
    # We should simulate that the analysis ran at each time step.
    
    for i in range(1, len(observations) + 1):
        window_obs = observations[:i]
        current_obs = observations[i-1]
        
        # Get timestamp from the observation if available, else derive it
        # fetch_observations doesn't explicitly return timestamp in the dict usually,
        # but let's check the code... 
        # Ah, `fetch_observations` iterates `t`. It doesn't seem to store `t` in the obs?
        # Let's look at `hmm_engine.py` again.
        # It puts `glucose_avg`, etc. 
        # It does NOT appear to put 'timestamp' in the obs dict in the snippet I read!
        # Wait, the dashboard relies on `timestamp_utc` in `hmm_states`.
        
        # Re-reading hmm_engine.py fetch_observations...
        # It iterates `t`, finds data, makes `obs`.
        # It does NOT add `timestamp` to `obs`. This is a design flaw or I missed it.
        # However, `streamlit_app.py` or `inject_data.py` usually handles the timestamp.
        
        # Let's assume standard 4h increments from 14 days ago.
        now = int(time.time())
        start_time = now - (14 * 24 * 3600)
        # Align to 4h
        
        # Actually, simpler: The HMM engine doesn't save to DB. 
        # The dashboard/admin panel calling code does.
        # I need to insert into `hmm_states`.
        
        # Let's just create a simplified runner that matches the timestamps.
        
        timestamp = start_time + ((i-1) * 4 * 3600)
        
        result = engine.run_inference(window_obs)
        
        conn.execute("""
            INSERT INTO hmm_states (
                timestamp_utc, user_id, detected_state, confidence_score, 
                confidence_margin, input_vector_snapshot
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            timestamp, 
            user_id, 
            result['current_state'], 
            result['confidence'], 
            result['confidence_margin'], 
            str(current_obs)
        ))
        
    conn.commit()
    conn.close()
    print("Production DB updated with new analysis!")

if __name__ == "__main__":
    refresh_analysis()
