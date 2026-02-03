# Fix missing columns in state_change_alerts table
import sqlite3

def fix_schema():
    conn = sqlite3.connect('nexus_health.db')
    cursor = conn.cursor()
    
    # Check existing columns
    existing = [row[1] for row in cursor.execute("PRAGMA table_info(state_change_alerts)").fetchall()]
    
    columns_to_add = [
        ("alert_sent", "BOOLEAN DEFAULT 0"),
        ("user_id", "TEXT DEFAULT 'current_user'"),
        ("notes", "TEXT"),
    ]
    
    for col_name, col_def in columns_to_add:
        if col_name not in existing:
            try:
                cursor.execute(f"ALTER TABLE state_change_alerts ADD COLUMN {col_name} {col_def}")
                print(f"  [PASS] Added column: {col_name}")
            except Exception as e:
                print(f"  [FAIL] {col_name}: {e}")
        else:
            print(f"  [OK] Column exists: {col_name}")
    
    conn.commit()
    conn.close()
    print("Schema fix complete.")

if __name__ == "__main__":
    fix_schema()
