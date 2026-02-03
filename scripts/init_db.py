import sqlite3
import os

DB_PATH = "nexus_health.db"
SCHEMA_PATH = "nexus_schema.sql"

def init_db():
    if not os.path.exists(SCHEMA_PATH):
        print(f"Error: {SCHEMA_PATH} not found.")
        return
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        cursor.executescript(sql_script)
        
        # Add missing columns to hmm_states if they don't exist
        try:
            cursor.execute("ALTER TABLE hmm_states ADD COLUMN confidence_margin REAL")
        except:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE hmm_states ADD COLUMN patient_tier TEXT DEFAULT 'BASIC'")
        except:
            pass  # Column already exists

        # Add retention_until to all relevant tables if missing
        tables_with_retention = ['glucose_readings', 'medication_logs', 'passive_metrics', 'voice_checkins', 'hmm_states']
        for table in tables_with_retention:
            try:
                # Default to +6 months (15552000 seconds) from now
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000)")
                print(f"Added retention_until to {table}")
            except Exception as e:
                print(f"Skipping {table} (might exist or error): {e}")
        
        # Add social_interactions to passive_metrics
        try:
            cursor.execute("ALTER TABLE passive_metrics ADD COLUMN social_interactions INTEGER DEFAULT 0")
            print("Added social_interactions to passive_metrics")
        except:
            pass # Column exists

        # Add HRV columns to fitbit_heart_rate (critical for diabetic autonomic neuropathy detection)
        try:
            cursor.execute("ALTER TABLE fitbit_heart_rate ADD COLUMN hrv_rmssd REAL")
            print("Added hrv_rmssd to fitbit_heart_rate")
        except:
            pass # Column exists

        try:
            cursor.execute("ALTER TABLE fitbit_heart_rate ADD COLUMN hrv_sdnn REAL")
            print("Added hrv_sdnn to fitbit_heart_rate")
        except:
            pass # Column exists

        conn.commit()
        conn.close()
        print(f"✅ Successfully initialized {DB_PATH}")
        
    except Exception as e:
        print(f"Database Initialization Error: {e}")

if __name__ == "__main__":
    init_db()
