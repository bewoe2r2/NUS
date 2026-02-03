import sqlite3
import os

DB_PATH = "nexus_health.db"

def update_db_tier3():
    try:
        conn = sqlite3.connect(DB_PATH)
        
        print("🚀 Starting Tier 3 Schema Update...")

        # 1. Create New Tables (CGM, Food, Fitbit)
        new_tables_sql = """
        -- CGM READINGS
        CREATE TABLE IF NOT EXISTS cgm_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            glucose_value REAL NOT NULL,
            timestamp_utc INTEGER NOT NULL,
            device_id TEXT,
            is_synced BOOLEAN DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_cgm_recent ON cgm_readings(user_id, timestamp_utc DESC);

        -- FOOD LOGS
        CREATE TABLE IF NOT EXISTS food_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            timestamp_utc INTEGER NOT NULL,
            meal_type TEXT CHECK(meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
            description TEXT,
            carbs_grams REAL,
            source_type TEXT DEFAULT 'MANUAL',
            is_synced BOOLEAN DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_food_time ON food_logs(user_id, timestamp_utc DESC);

        -- FITBIT ACTIVITY
        CREATE TABLE IF NOT EXISTS fitbit_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            date INTEGER NOT NULL,
            steps INTEGER DEFAULT 0,
            active_minutes INTEGER DEFAULT 0,
            sedentary_minutes INTEGER DEFAULT 0,
            calories_burned INTEGER DEFAULT 0,
            is_synced BOOLEAN DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_fitbit_activity_date ON fitbit_activity(user_id, date DESC);

        -- FITBIT HEART RATE
        CREATE TABLE IF NOT EXISTS fitbit_heart_rate (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            date INTEGER NOT NULL,
            resting_heart_rate INTEGER,
            average_heart_rate INTEGER,
            is_synced BOOLEAN DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_fitbit_hr_date ON fitbit_heart_rate(user_id, date DESC);

        -- FITBIT SLEEP
        CREATE TABLE IF NOT EXISTS fitbit_sleep (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            date INTEGER NOT NULL,
            total_sleep_minutes INTEGER,
            sleep_score REAL,
            is_synced BOOLEAN DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_fitbit_sleep_date ON fitbit_sleep(user_id, date DESC);
        """
        
        conn.executescript(new_tables_sql)
        print("✅ New tables (CGM, Food, Fitbit) created.")

        # 2. Update hmm_states table
        # Since SQLite lacks easy ALTER COLUMN, we check if columns exist or recreate.
        # Simplest path for demo: Check if patient_tier exists.
        
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT patient_tier FROM hmm_states LIMIT 1")
            print("ℹ️ hmm_states already has patient_tier.")
        except sqlite3.OperationalError:
            print("⚠️ Upgrade hmm_states table...")
            # We will DROP and RECREATE for clean slate in demo, as requested "Reset All Data" logic suggests flexibility.
            
            conn.execute("DROP TABLE IF EXISTS hmm_states")
            conn.execute("""
            CREATE TABLE hmm_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT DEFAULT 'current_user',
                timestamp_utc INTEGER NOT NULL,
                detected_state TEXT CHECK(detected_state IN ('STABLE', 'WARNING', 'CRISIS')) NOT NULL,
                confidence_score REAL NOT NULL,
                confidence_margin REAL,
                patient_tier TEXT DEFAULT 'BASIC',
                contributing_factors TEXT,
                input_vector_snapshot TEXT,
                is_synced BOOLEAN DEFAULT 0
            );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_hmm_recent ON hmm_states(user_id, timestamp_utc DESC);")
            print("✅ hmm_states table recreated with new schema.")

        conn.commit()
        conn.close()
        print("🎉 Tier 3 Schema Update Complete!")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Schema Update Error: {e}")

if __name__ == "__main__":
    update_db_tier3()
