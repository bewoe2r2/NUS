"""
Full debug: Check raw data + rerun HMM analysis to find the bug.
"""
import _path_setup
import sqlite3
import time
from hmm_engine import HMMEngine

conn = sqlite3.connect('nexus_health.db')
engine = HMMEngine()

print("=" * 60)
print("STEP 1: Check what raw data is in the database")
print("=" * 60)

# Check glucose readings
rows = conn.execute("""
    SELECT datetime(reading_timestamp_utc, 'unixepoch', 'localtime') as dt, 
           reading_value 
    FROM glucose_readings 
    ORDER BY reading_timestamp_utc DESC LIMIT 10
""").fetchall()
print("\n=== Latest 10 glucose_readings ===")
for r in rows:
    print(f"  {r[0]}: {r[1]:.1f} mmol/L")

# Check what fetch_observations returns
print("\n" + "=" * 60)
print("STEP 2: What does fetch_observations() return?")
print("=" * 60)

observations = engine.fetch_observations(days=14)
print(f"\nTotal observations: {len(observations)}")

if observations:
    print("\n=== First observation (oldest) ===")
    for k, v in observations[0].items():
        print(f"  {k}: {v}")
    
    print("\n=== Last observation (newest) ===")
    for k, v in observations[-1].items():
        print(f"  {k}: {v}")
    
    # Show day-by-day glucose averages
    print("\n=== Day-by-Day Glucose Values ===")
    for day in range(14):
        bucket_start = day * 6
        bucket_end = min(bucket_start + 6, len(observations))
        day_gluc = [obs.get('glucose_avg') for obs in observations[bucket_start:bucket_end] if obs.get('glucose_avg')]
        if day_gluc:
            avg = sum(day_gluc) / len(day_gluc)
            print(f"  Day {day}: avg glucose = {avg:.1f} mmol/L")
        else:
            print(f"  Day {day}: No glucose data")

print("\n" + "=" * 60)
print("STEP 3: Run HMM inference on fetched data")
print("=" * 60)

if observations:
    # Run day-by-day inference
    print("\n=== Day-by-Day HMM States ===")
    for day in range(14):
        bucket = (day + 1) * 6 - 1  # End of each day
        if bucket < len(observations):
            window_start = max(0, bucket - 42)
            window_obs = observations[window_start:bucket+1]
            if window_obs:
                result = engine.run_inference(window_obs)
                # Get latest glucose in this window
                latest_gluc = window_obs[-1].get('glucose_avg', 'N/A')
                print(f"  Day {day}: {result['current_state']} (conf: {result['confidence']:.1%}) | glucose={latest_gluc}")

conn.close()
print("\n" + "=" * 60)
print("DONE - Compare above with what the UI shows!")
print("=" * 60)
