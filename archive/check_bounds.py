# Check stored HMM snapshots for bounds violations
import sqlite3
import json

conn = sqlite3.connect('nexus_health.db')
rows = conn.execute('SELECT id, input_vector_snapshot FROM hmm_states ORDER BY id DESC LIMIT 10').fetchall()

for r in rows:
    data = json.loads(r[1])
    se = data.get('social_engagement')
    gv = data.get('glucose_variability')
    print(f"ID {r[0]}: social_engagement={se}, glucose_variability={gv}")
    
    # Check bounds
    issues = []
    if se is not None and (se < 0 or se > 50):
        issues.append(f"social_engagement={se} out of [0,50]")
    if gv is not None and (gv < 5 or gv > 100):
        issues.append(f"glucose_variability={gv} out of [5,100]")
    if issues:
        print(f"  -> {', '.join(issues)}")
