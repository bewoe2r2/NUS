"""
NEXUS 2026 - Demo Data Injector
Generates realistic patient data for demo scenarios and populates SQLite.

Updated for HMM v2.0 orthogonal feature set.
"""

import sqlite3
import time
import json
import random
import os
import sys

# Add core directory to path so we can import hmm_engine
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core"))
from hmm_engine import HMMEngine

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
SCENARIO = "warning_to_crisis"  # Default scenario
TIER = "PREMIUM"
DAYS = 14

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def inject_tiered_scenario_to_db(observations, tier="PREMIUM", days=14):
    """
    Populate SQLite based on patient tier.

    Features populated by tier:
    - BASIC: glucose, meds, carbs, steps (phone only)
    - ENHANCED: + Fitbit (HR, HRV, sleep, activity)
    - PREMIUM: + CGM continuous glucose
    """
    conn = get_db_connection()
    now = int(time.time())
    start_time = now - (days * 24 * 3600)
    window_size = 4 * 3600

    print(f"Cleaning old data from {DB_PATH}...")
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
        ('hmm_states', 'timestamp_utc')
    ]

    for table, ts_col in all_tables:
        try:
            conn.execute(f"DELETE FROM {table}")
        except Exception as e:
            print(f"Warning clearing {table}: {e}")
            pass

    # Seed prescribed medications
    medications_data = [
        ('P001', 'Metformin 500mg', '500mg', 'BID', '["08:00", "20:00"]'),
        ('P001', 'Amlodipine 5mg', '5mg', 'OD', '["08:00"]'),
        ('P001', 'Atorvastatin 20mg', '20mg', 'ON', '["21:00"]'),
        ('P002', 'Insulin Glargine', '10 units', 'OD', '["22:00"]'),
        ('P002', 'Furosemide 40mg', '40mg', 'OD', '["08:00"]'),
        ('P003', 'Metformin 500mg', '500mg', 'OD', '["08:00"]'),
    ]
    for med in medications_data:
        try:
            conn.execute(
                "INSERT OR IGNORE INTO medications (user_id, medication_name, dosage, frequency, scheduled_times) VALUES (?, ?, ?, ?, ?)",
                med
            )
        except Exception:
            pass

    print(f"Injecting {len(observations)} observations for {tier} tier...")

    for i, obs in enumerate(observations):
        t = start_time + (i * window_size)
        day_start = t - (t % 86400)

        # ===== GLUCOSE READINGS (ALL tiers) =====
        if obs.get('glucose_avg') is not None:
            conn.execute("""
                INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type)
                VALUES (?, ?, ?, ?)
            """, ('P001', obs['glucose_avg'], t + 60, 'MANUAL'))

        # ===== CGM READINGS (PREMIUM only) =====
        # Provides continuous glucose data every 5 minutes
        if tier == "PREMIUM" and obs.get('glucose_avg') is not None:
            base_glucose = obs['glucose_avg']
            # glucose_variability is CV%, so we derive variance from it
            cv_percent = obs.get('glucose_variability', 20.0) or 20.0
            std_dev = (cv_percent / 100.0) * base_glucose

            # 48 readings per 4h window (every 5 min)
            for j in range(48):
                cgm_val = base_glucose + random.gauss(0, std_dev * 0.3)
                cgm_val = max(2.0, min(25.0, cgm_val))
                conn.execute("""
                    INSERT INTO cgm_readings (user_id, glucose_value, timestamp_utc, device_id)
                    VALUES (?, ?, ?, ?)
                """, ('P001', cgm_val, t + (j * 300), 'dexcom_g7'))

        # ===== PASSIVE METRICS (ALL tiers) =====
        # From phone sensors: steps, screen time, social interactions
        steps = obs.get('steps_daily', 0) or 0
        sleep_q = obs.get('sleep_quality', 8) or 8
        screen_s = max(0, int((10 - sleep_q) * 3600))  # Inverse of sleep quality
        social_int = min(50, max(0, obs.get('social_engagement', 10) or 10))  # Clamp to bounds [0, 50]

        conn.execute("""
            INSERT INTO passive_metrics (user_id, window_start_utc, window_end_utc, step_count, screen_time_seconds,
                                        social_interactions, time_at_home_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('P001', t, t + window_size, int(steps / 6), screen_s, int(social_int), int(12 * 3600)))

        # ===== MEDICATION (ALL tiers) =====
        meds = obs.get('meds_adherence', 0)
        if meds and meds > 0.5:
            conn.execute("""
                INSERT INTO medication_logs (user_id, medication_name, taken_timestamp_utc, scheduled_timestamp_utc)
                VALUES (?, ?, ?, ?)
            """, ('P001', 'Metformin 500mg', t + 100, t))

        # ===== FOOD LOGS (ALL tiers) =====
        carbs = obs.get('carbs_intake')
        if carbs is not None:
            carbs_per_meal = carbs / 3
            for meal_idx, meal in enumerate(['BREAKFAST', 'LUNCH', 'DINNER']):
                meal_time = day_start + (meal_idx + 1) * 6 * 3600
                if meal_time >= t and meal_time < t + window_size:
                    conn.execute("""
                        INSERT INTO food_logs (user_id, timestamp_utc, meal_type, carbs_grams, source_type)
                        VALUES (?, ?, ?, ?, ?)
                    """, ('P001', meal_time, meal, carbs_per_meal, 'PHOTO_GEMINI'))

        # ===== FITBIT DATA (ENHANCED & PREMIUM only) =====
        if tier in ["PREMIUM", "ENHANCED"]:
            if i % 6 == 0:  # Once per day (first bucket of each day)
                # Activity data
                steps_daily = obs.get('steps_daily', 0) or 0
                # Derive active minutes from steps (roughly 100 steps = 1 active minute)
                active_min = int(steps_daily / 100)

                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_activity
                    (user_id, date, steps, active_minutes, sedentary_minutes, calories_burned)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, ('P001', day_start,
                      int(steps_daily),
                      active_min,
                      max(0, 480 - active_min),  # Sedentary = 8 hours minus active
                      1800 + int(steps_daily * 0.04)))  # Rough calorie estimate

                # Heart Rate + HRV (CRITICAL for diabetic monitoring)
                hr_resting = obs.get('resting_hr')
                hrv_rmssd = obs.get('hrv_rmssd')

                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_heart_rate
                    (user_id, date, resting_heart_rate, average_heart_rate, hrv_rmssd)
                    VALUES (?, ?, ?, ?, ?)
                """, ('P001', day_start,
                      int(hr_resting) if hr_resting else None,
                      int(hr_resting + 7) if hr_resting else None,  # avg is slightly higher than resting
                      round(hrv_rmssd, 1) if hrv_rmssd else None))

                # Sleep data
                sleep_q = obs.get('sleep_quality', 7) or 7
                conn.execute("""
                    INSERT OR REPLACE INTO fitbit_sleep
                    (user_id, date, total_sleep_minutes, sleep_score)
                    VALUES (?, ?, ?, ?)
                """, ('P001', day_start, int(sleep_q * 50), sleep_q * 10))  # 7 hours sleep at quality 7

    conn.commit()
    conn.close()
    print("Data injection complete.")

def run_analysis_and_save(engine, days=14):
    """Run HMM inference on injected data and save states to DB."""
    print("Running HMM Analysis on injected data...")
    observations = engine.fetch_observations(days=days)

    if not observations:
        print("No observations found after injection!")
        return

    conn = get_db_connection()
    now = int(time.time())
    start_time = now - (days * 24 * 3600)

    # Run HMM and save state for EACH time bucket
    window_size = 4 * 3600  # 4 hours
    buckets_per_day = 6

    for i, obs in enumerate(observations):
        obs_time = start_time + (i * window_size)

        # Sliding window context (last 7 days of context)
        window_start = max(0, i - (7 * buckets_per_day))
        window_obs = observations[window_start:i+1]

        if window_obs:
            result = engine.run_inference(window_obs)

            conn.execute("""
                INSERT INTO hmm_states (user_id, timestamp_utc, detected_state, confidence_score,
                                       confidence_margin, patient_tier, input_vector_snapshot)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ('P001', obs_time, result['current_state'], result['confidence'],
                  result.get('confidence_margin', 0), TIER, json.dumps(obs)))

    conn.commit()
    conn.close()
    print(f"Analyzed {len(observations)} time buckets and saved states.")

def print_summary(engine, days=14):
    """Print a summary of the analysis."""
    conn = get_db_connection()

    # Get state distribution
    rows = conn.execute("""
        SELECT detected_state, COUNT(*) as count, AVG(confidence_score) as avg_conf
        FROM hmm_states
        GROUP BY detected_state
    """).fetchall()

    print("\n" + "=" * 50)
    print("HMM ANALYSIS SUMMARY")
    print("=" * 50)

    for row in rows:
        print(f"  {row['detected_state']}: {row['count']} buckets (avg confidence: {row['avg_conf']:.1%})")

    # Get latest state
    latest = conn.execute("""
        SELECT detected_state, confidence_score, confidence_margin
        FROM hmm_states
        ORDER BY timestamp_utc DESC
        LIMIT 1
    """).fetchone()

    if latest:
        print(f"\nCurrent State: {latest['detected_state']}")
        print(f"Confidence: {latest['confidence_score']:.1%}")
        print(f"Margin: {latest['confidence_margin']:.1%}")

    conn.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Inject demo data for NEXUS 2026')
    parser.add_argument('--scenario', type=str, default=SCENARIO,
                        choices=['stable_perfect', 'stable_realistic', 'stable_noisy', 'missing_data',
                                'gradual_decline', 'warning_to_crisis', 'warning_recovery', 'sudden_crisis', 
                                'sudden_spike', 'recovery',
                                # Competition scenarios
                                'demo_merlion', 'demo_counterfactual', 'demo_intervention_success',
                                'demo_tier_basic', 'demo_full_crisis'],
                        help='Demo scenario to generate')
    parser.add_argument('--tier', type=str, default=TIER,
                        choices=['BASIC', 'ENHANCED', 'PREMIUM'],
                        help='Patient tier (affects available data)')
    parser.add_argument('--days', type=int, default=DAYS,
                        help='Number of days to generate')

    args = parser.parse_args()

    engine = HMMEngine()

    # Generate Scenario Data
    print(f"\nGenerating '{args.scenario}' scenario for {args.days} days ({args.tier} tier)...")
    obs = engine.generate_demo_scenario(args.scenario, days=args.days)

    # Inject into DB
    inject_tiered_scenario_to_db(obs, tier=args.tier, days=args.days)

    # Run Analysis
    run_analysis_and_save(engine, days=args.days)

    # Print Summary
    print_summary(engine, days=args.days)
