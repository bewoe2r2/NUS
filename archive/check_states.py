import sqlite3
conn = sqlite3.connect('nexus_health.db')
conn.row_factory = sqlite3.Row
rows = conn.execute('''
    SELECT 
        date(timestamp_utc, 'unixepoch', 'localtime') as date, 
        detected_state, 
        COUNT(*) as cnt 
    FROM hmm_states 
    GROUP BY date 
    ORDER BY date
''').fetchall()

print('Date         State      Count')
print('-' * 35)
for r in rows:
    print(f"{r['date']}   {r['detected_state']:10} {r['cnt']}")
conn.close()
