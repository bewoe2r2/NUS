"""
Test sudden_crisis injection like Streamlit does
"""
import _path_setup
import sqlite3
import time
import json
import random
from hmm_engine import HMMEngine

DB_PATH = 'nexus_health.db'
conn = sqlite3.connect(DB_PATH)
engine = HMMEngine()

print("=" * 60)
print("TESTING: SUDDEN_CRISIS SCENARIO")
print("=" * 60)

# STEP 1: Clear all tables (like the fixed Streamlit code does)
print("\n1. Clearing all data...")
tables = [
    'glucose_readings', 'cgm_readings', 'passive_metrics',
    'medication_logs', 'food_logs', 'fitbit_activity',
    'fitbit_heart_rate', 'fitbit_sleep', 'hmm_states'
]
for table in tables:
    try:
        conn.execute(f"DELETE FROM {table}")
    except:
        pass
conn.commit()
print("   Done!")

# STEP 2: Generate scenario
print("\n2. Generating sudden_crisis scenario...")
obs = engine.generate_demo_scenario('sudden_crisis', days=14)
print(f"   Generated {len(obs)} observations")

print("\n   Sample values:")
for day in [0, 5, 9, 10, 12, 13]:
    bucket = day * 6
    if bucket < len(obs):
        o = obs[bucket]
        print(f"   Day {day}: glucose={o.get('glucose_avg', 0):.1f}, meds={o.get('meds_adherence', 0):.2f}")

# STEP 3: Inject into database (EXACTLY like streamlit does)
print("\n3. Injecting into database...")

now = int(time.time())
start_time = now - (14 * 24 * 3600)
window_size = 4 * 3600

for i, ob in enumerate(obs):
    t = start_time + (i * window_size)
    day_start = t - (t % 86400)
    
    # Glucose readings
    if ob.get('glucose_avg') is not None:
        conn.execute("""
            INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
            VALUES (?, ?, ?, ?)
        """, ('demo_user', ob['glucose_avg'], t + 60, 'MANUAL'))
    
    # CGM readings (PREMIUM)
    if ob.get('glucose_avg') is not None:
        base_glucose = ob['glucose_avg']
        cv_percent = ob.get('glucose_variability', 20.0) or 20.0
        std_dev = (cv_percent / 100.0) * base_glucose
        for j in range(48):
            cgm_val = base_glucose + random.gauss(0, std_dev * 0.3)
            cgm_val = max(2.0, min(25.0, cgm_val))
            conn.execute("""
                INSERT INTO cgm_readings (user_id, glucose_value, timestamp_utc, device_id)
                VALUES (?, ?, ?, ?)
            """, ('demo_user', cgm_val, t + (j * 300), 'dexcom_g7'))
    
    # Passive metrics
    steps = ob.get('steps_daily', 0) or 0
    sleep_q = ob.get('sleep_quality', 8) or 8
    screen_s = max(0, int((10 - sleep_q) * 3600))
    conn.execute("""
        INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
        VALUES (?, ?, ?, ?, ?)
    """, (t, t + window_size, int(steps / 6), screen_s, 3600))
    
    # Medication
    if ob.get('meds_adherence', 0) and ob['meds_adherence'] > 0.5:
        conn.execute("""
            INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
            VALUES (?, ?, ?)
        """, ('Metformin 500mg', t + 100, t))
    
    # Fitbit (daily)
    if i % 6 == 0:
        steps_daily = ob.get('steps_daily', 0) or 0
        active_min = int(steps_daily / 100)
        conn.execute("""
            INSERT OR REPLACE INTO fitbit_activity
            (user_id, date, steps, active_minutes, sedentary_minutes, calories_burned)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ('demo_user', day_start, int(steps_daily), active_min, max(0, 480 - active_min), 1800 + int(steps_daily * 0.04)))
        
        hr_resting = ob.get('resting_hr')
        hrv_rmssd = ob.get('hrv_rmssd')
        conn.execute("""
            INSERT OR REPLACE INTO fitbit_heart_rate
            (user_id, date, resting_heart_rate, average_heart_rate, hrv_rmssd)
            VALUES (?, ?, ?, ?, ?)
        """, ('demo_user', day_start, int(hr_resting) if hr_resting else None, int(hr_resting + 7) if hr_resting else None, round(hrv_rmssd, 1) if hrv_rmssd else None))
        
        conn.execute("""
            INSERT OR REPLACE INTO fitbit_sleep
            (user_id, date, total_sleep_minutes, sleep_score)
            VALUES (?, ?, ?, ?)
        """, ('demo_user', day_start, int(sleep_q * 60), sleep_q * 10))

conn.commit()
print("   Done!")

# STEP 4: Run HMM Analysis (EXACTLY like streamlit does)
print("\n4. Running HMM Analysis...")

observations = engine.fetch_observations(days=14)
print(f"   Fetched {len(observations)} observations")

# Clear old HMM states
conn.execute("DELETE FROM hmm_states WHERE timestamp_utc >= ?", (start_time,))

for i, ob in enumerate(observations):
    obs_time = start_time + (i * window_size)
    window_start = max(0, i - 42)
    window_obs = observations[window_start:i+1]
    
    if window_obs:
        result = engine.run_inference(window_obs)
        conn.execute("""
            INSERT INTO hmm_states (timestamp_utc, detected_state, confidence_score,
                                   confidence_margin, patient_tier, input_vector_snapshot)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (obs_time, result['current_state'], result['confidence'],
              result.get('confidence_margin', 0), 'PREMIUM', json.dumps(ob)))

conn.commit()
print("   Done!")

# STEP 5: Check results
print("\n5. Checking results...")

import pandas as pd
states_df = pd.read_sql_query("""
    SELECT 
        date(timestamp_utc, 'unixepoch', 'localtime') as date,
        detected_state,
        confidence_score
    FROM hmm_states
    WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
    ORDER BY timestamp_utc ASC
""", conn)

daily = states_df.groupby('date').agg({
    'detected_state': lambda x: x.mode()[0] if len(x) > 0 else 'UNKNOWN',
    'confidence_score': 'mean'
}).reset_index()

print("\n=== DAY-BY-DAY STATES ===")
for _, row in daily.iterrows():
    state = row['detected_state']
    emoji = "✅" if state == "STABLE" else "⚠️" if state == "WARNING" else "🚨"
    print(f"  {row['date']}: {emoji} {state} ({row['confidence_score']*100:.1f}%)")

crisis_count = (daily['detected_state'] == 'CRISIS').sum()
warning_count = (daily['detected_state'] == 'WARNING').sum()
stable_count = (daily['detected_state'] == 'STABLE').sum()

print(f"\nSUMMARY: STABLE={stable_count}, WARNING={warning_count}, CRISIS={crisis_count}")

if crisis_count >= 2:
    print("✅ SUDDEN_CRISIS scenario working correctly!")
else:
    print("❌ ISSUE: Expected at least 2 CRISIS days!")

conn.close()
