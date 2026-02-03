import sqlite3

def verify_schema():
    conn = sqlite3.connect('nexus_health.db')
    cursor = conn.cursor()
    
    # Check tables
    tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    table_names = [t[0] for t in tables]
    print(f"Tables found: {len(table_names)}")
    
    required_tables = ['cgm_readings', 'food_logs', 'fitbit_activity', 'fitbit_heart_rate', 'fitbit_sleep', 'hmm_states']
    missing_tables = [t for t in required_tables if t not in table_names]
    
    if missing_tables:
        print(f"❌ Missing tables: {missing_tables}")
    else:
        print("✅ All new tables present.")
        
    # Check hmm_states columns
    columns = cursor.execute("PRAGMA table_info(hmm_states)").fetchall()
    col_names = [c[1] for c in columns]
    
    required_cols = ['confidence_margin', 'patient_tier', 'retention_until']
    missing_cols = [c for c in required_cols if c not in col_names]
    
    if missing_cols:
         print(f"❌ Missing columns in hmm_states: {missing_cols}")
    else:
         print("✅ hmm_states schema updated successfully.")
         
    conn.close()

if __name__ == "__main__":
    verify_schema()
