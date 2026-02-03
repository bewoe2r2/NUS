import sqlite3
import time

def fix_database():
    db_path = 'nexus_health.db'
    print(f"Connecting to {db_path}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Check fitbit_heart_rate schema
        print("Checking fitbit_heart_rate schema...")
        cursor.execute("PRAGMA table_info(fitbit_heart_rate)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'hrv_rmssd' not in columns:
            print("Adding missing column 'hrv_rmssd'...")
            try:
                cursor.execute("ALTER TABLE fitbit_heart_rate ADD COLUMN hrv_rmssd REAL")
                conn.commit()
                print("Column added successfully.")
            except sqlite3.OperationalError as e:
                print(f"Error adding column: {e}")
        else:
            print("Column 'hrv_rmssd' already exists.")
            
        # 2. Check glucose_readings schema (just in case)
        print("\nChecking glucose_readings schema...")
        cursor.execute("PRAGMA table_info(glucose_readings)")
        g_columns = [info[1] for info in cursor.fetchall()]
        print(f"Current columns: {g_columns}")

        conn.close()
        print("\nDatabase verification complete.")
        
    except Exception as e:
        print(f"CRITICAL DATABASE ERROR: {e}")

if __name__ == "__main__":
    fix_database()
