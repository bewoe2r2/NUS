"""Check current database state"""
import sqlite3

conn = sqlite3.connect('nexus_health.db')

print('=== hmm_states summary ===')
rows = conn.execute("""
    SELECT detected_state, COUNT(*) as count, AVG(confidence_score) as avg_conf 
    FROM hmm_states GROUP BY detected_state
""").fetchall()

if rows:
    for r in rows:
        print(f"  {r[0]}: {r[1]} records (avg conf: {r[2]*100:.1f}%)")
else:
    print("  No HMM states found!")

print()
print('=== Latest 10 hmm_states ===')
rows = conn.execute("""
    SELECT datetime(timestamp_utc, 'unixepoch', 'localtime') as dt, 
           detected_state, confidence_score 
    FROM hmm_states ORDER BY timestamp_utc DESC LIMIT 10
""").fetchall()

if rows:
    for r in rows:
        print(f"  {r[0]}: {r[1]} ({r[2]*100:.1f}%)")
else:
    print("  No records found!")

conn.close()
