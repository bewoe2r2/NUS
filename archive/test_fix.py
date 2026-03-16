"""
Test fix: Clear all data, inject warning_to_crisis, run HMM, verify states.
"""
import _path_setup
import sqlite3
import time
import json
from hmm_engine import HMMEngine

DB_PATH = 'nexus_health.db'
conn = sqlite3.connect(DB_PATH)
engine = HMMEngine()

print("=" * 60)
print("STEP 1: CLEAR ALL DATA")
print("=" * 60)

tables = [
    'glucose_readings', 'cgm_readings', 'passive_metrics',
    'medication_logs', 'food_logs', 'fitbit_activity',
    'fitbit_heart_rate', 'fitbit_sleep', 'hmm_states'
]

for table in tables:
    try:
        conn.execute(f"DELETE FROM {table}")
        print(f"  Cleared {table}")
    except Exception as e:
        print(f"  Error clearing {table}: {e}")

conn.commit()

print("\n" + "=" * 60)
print("STEP 2: GENERATE WARNING_TO_CRISIS SCENARIO")
print("=" * 60)

obs = engine.generate_demo_scenario('warning_to_crisis', days=14)
print(f"Generated {len(obs)} observations")

# Show sample values
for day in [0, 5, 9, 13]:
    bucket = day * 6
    if bucket < len(obs):
        o = obs[bucket]
        print(f"  Day {day}: glucose={o.get('glucose_avg', 0):.1f}, meds={o.get('meds_adherence', 0):.2f}")

print("\n" + "=" * 60)
print("STEP 3: INJECT INTO DATABASE")
print("=" * 60)

now = int(time.time())
start_time = now - (14 * 24 * 3600)
window_size = 4 * 3600

for i, ob in enumerate(obs):
    t = start_time + (i * window_size)
    
    # Insert glucose
    if ob.get('glucose_avg') is not None:
        conn.execute("""
            INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
            VALUES (?, ?, ?, ?)
        """, ('demo_user', ob['glucose_avg'], t + 60, 'MANUAL'))
    
    # Insert passive metrics
    steps = ob.get('steps_daily', 0) or 0
    conn.execute("""
        INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count, screen_time_seconds, time_at_home_seconds)
        VALUES (?, ?, ?, ?, ?)
    """, (t, t + window_size, int(steps / 6), 3600, 3600))
    
    # Insert medication
    if ob.get('meds_adherence', 0) > 0.5:
        conn.execute("""
            INSERT INTO medication_logs (medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
            VALUES (?, ?, ?)
        """, ('Metformin 500mg', t + 100, t))

conn.commit()
print("Injection complete!")

print("\n" + "=" * 60)
print("STEP 4: RUN HMM ANALYSIS")
print("=" * 60)

observations = engine.fetch_observations(days=14)
print(f"Fetched {len(observations)} observations from DB")

# Run day-by-day and save to hmm_states
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
print("HMM states saved!")

print("\n" + "=" * 60)
print("STEP 5: VERIFY RESULTS")
print("=" * 60)

rows = conn.execute("""
    SELECT detected_state, COUNT(*) as cnt
    FROM hmm_states GROUP BY detected_state
""").fetchall()

print("\nState Distribution:")
for r in rows:
    print(f"  {r[0]}: {r[1]} records")

print("\nDay-by-Day States:")
for day in range(14):
    bucket = day * 6 + 5  # End of day
    row = conn.execute("""
        SELECT detected_state, confidence_score
        FROM hmm_states
        ORDER BY timestamp_utc ASC
        LIMIT 1 OFFSET ?
    """, (bucket,)).fetchone()
    if row:
        print(f"  Day {day}: {row[0]} ({row[1]*100:.1f}%)")

conn.close()
print("\n✅ TEST COMPLETE - Now check the UI!")
