import _path_setup
import sqlite3
import pandas as pd
import numpy as np
import time
from datetime import datetime, timedelta
from hmm_engine import HMMEngine, EMISSION_PARAMS

DB_PATH = "nexus_health.db"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def verify_14_day_logic():
    print("--- Verifying 14-Day Analysis Logic ---")
    conn = get_db_connection()
    
    # 1. Fetch Raw Data
    df = pd.read_sql_query("""
        SELECT 
            date(timestamp_utc, 'unixepoch', 'localtime') as date,
            detected_state,
            confidence_score
        FROM hmm_states
        WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
        ORDER BY timestamp_utc ASC
    """, conn)
    
    conn.close()
    
    if df.empty:
        print("⚠️ No data found for 14-day analysis.")
        return

    # 2. Re-implement Dashboard Aggregation Logic
    # Source: streamlit_app.py get_worst_state
    def get_worst_state(series):
        states = list(series)
        if 'CRISIS' in states: return 'CRISIS'
        if 'WARNING' in states: return 'WARNING'
        return 'STABLE'

    daily_summary = df.groupby('date').agg({
        'detected_state': ['count', get_worst_state],
        'confidence_score': 'mean'
    })
    
    print(f" Analyzed {len(daily_summary)} days of data.")
    
    # Check consistency
    for date, row in daily_summary.iterrows():
        count = row['detected_state']['count']
        worst = row['detected_state']['get_worst_state']
        conf = row['confidence_score']['mean']
        print(f" Date: {date} | Entries: {count} | Worst State: {worst} | Avg Conf: {conf:.2f}")
        
        # Semantic check
        if worst == 'CRISIS':
            # Verify basic rule: If ANY crisis exists in raw data for this date
            raw_states = df[df['date'] == date]['detected_state'].unique()
            if 'CRISIS' not in raw_states:
                print(f"❌ LOGIC ERROR: Dashboard shows CRISIS for {date} but raw data does not contain it!")
            else:
                print("✅ Aggregation Logic Valid")

def verify_voucher_logic():
    print("\n--- Verifying Voucher System ---")
    # Simulate VoucherSystem logic
    from voucher_system import VoucherSystem
    vs = VoucherSystem()
    voucher = vs.get_current_voucher()
    
    print(f" Current Voucher Value: ${voucher['current_value']:.2f}")
    print(f" Days Remaining: {voucher['days_until_redemption']}")
    
    # Check if value matches DB logs
    # Logic: Start at $10, subtract $1 for every missed log day
    # This verification is complex without knowing exact start date, 
    # but we can check if it's within bounds [0, 10]
    if 0 <= voucher['current_value'] <= 10:
        print(f"✅ Voucher value ${voucher['current_value']} is within valid range [0, 10]")
    else:
        print(f"❌ Voucher value ${voucher['current_value']} is INVALID")

def verify_trends_completeness():
    print("\n--- Verifying 7-Day Trends Completeness ---")
    conn = get_db_connection()
    
    # Check for gaps > 4 hours (HMM stride)
    df = pd.read_sql_query("SELECT timestamp_utc FROM hmm_states ORDER BY timestamp_utc ASC", conn)
    conn.close()
    
    if df.empty:
        print("⚠️ No HMM states found.")
        return
        
    timestamps = df['timestamp_utc'].values
    gaps = np.diff(timestamps)
    
    # 4 hours = 14400 seconds
    large_gaps = gaps[gaps > 14500] 
    
    if len(large_gaps) > 0:
        print(f"⚠️ Found {len(large_gaps)} time gaps > 4 hours in HMM history.")
        print(f"   Max gap: {max(large_gaps)/3600:.1f} hours")
    else:
        print("✅ Temporal density looks good (no gaps > 4h)")

if __name__ == "__main__":
    verify_14_day_logic()
    verify_trends_completeness()
    verify_voucher_logic()
