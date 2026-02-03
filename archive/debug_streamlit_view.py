"""
Debug: Simulate exactly what Streamlit analysis page does
"""
import sqlite3
import pandas as pd

conn = sqlite3.connect('nexus_health.db')

# Exact same query as streamlit_app.py line 678
states_df = pd.read_sql_query("""
    SELECT 
        datetime(timestamp_utc, 'unixepoch', 'localtime') as datetime,
        date(timestamp_utc, 'unixepoch', 'localtime') as date,
        detected_state,
        confidence_score,
        confidence_margin,
        input_vector_snapshot
    FROM hmm_states
    WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
    ORDER BY timestamp_utc ASC
""", conn)

print(f"Total rows: {len(states_df)}")
print()

# Same grouping as streamlit_app.py line 700
daily_summary = states_df.groupby('date').agg({
    'detected_state': lambda x: x.mode()[0] if len(x) > 0 else 'UNKNOWN',
    'confidence_score': 'mean'
}).reset_index()

print("=== DAILY SUMMARY (what timeline shows) ===")
for _, row in daily_summary.iterrows():
    date = row['date']
    state = row['detected_state']
    conf = row['confidence_score']
    print(f"  {date}: {state} ({conf*100:.1f}%)")

conn.close()
