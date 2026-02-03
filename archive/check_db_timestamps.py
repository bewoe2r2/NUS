
import sqlite3
from datetime import datetime
import time

def check_timestamps():
    conn = sqlite3.connect("nexus_health.db")
    conn.row_factory = sqlite3.Row
    
    now_ts = int(time.time())
    print(f"Current System Time: {datetime.fromtimestamp(now_ts)} (TS: {now_ts})")
    
    # 1. Check raw range in DB
    print("\n[Raw DB Range]")
    min_row = conn.execute("SELECT MIN(timestamp_utc) FROM hmm_states").fetchone()
    max_row = conn.execute("SELECT MAX(timestamp_utc) FROM hmm_states").fetchone()
    
    if min_row and min_row[0]:
        print(f"Min TS: {datetime.fromtimestamp(min_row[0])} ({min_row[0]})")
    else:
        print("DB is empty!")
        
    if max_row and max_row[0]:
        print(f"Max TS: {datetime.fromtimestamp(max_row[0])} ({max_row[0]})")

    # 2. Check Streamlit Query Logic
    # Streamlit uses: WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
    print("\n[Streamlit Query Test]")
    rows = conn.execute("""
        SELECT 
            datetime(timestamp_utc, 'unixepoch', 'localtime') as datetime,
            date(timestamp_utc, 'unixepoch', 'localtime') as date,
            detected_state
        FROM hmm_states
        WHERE timestamp_utc >= strftime('%s', 'now', '-14 days')
        ORDER BY timestamp_utc ASC
    """).fetchall()
    
    if not rows:
        print("Query returned NO rows.")
    else:
        print(f"Query returned {len(rows)} rows.")
        first = rows[0]
        last = rows[-1]
        print(f"First Row Date: {first['date']} (DT: {first['datetime']})")
        print(f"Last  Row Date: {last['date']} (DT: {last['datetime']})")
        
        # Unique dates
        dates = sorted(list(set(row['date'] for row in rows)))
        print(f"Unique Dates ({len(dates)}): {dates}")

    conn.close()

if __name__ == "__main__":
    check_timestamps()
