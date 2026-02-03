import sqlite3
import os

DB_PATH = "nexus_health.db"

def update_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        
        # Drop old table to ensure schema match
        conn.execute("DROP TABLE IF EXISTS voucher_tracker")
        
        # Create table if missing (new schema)
        conn.execute("""
            CREATE TABLE voucher_tracker (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'user',
                week_start_utc INTEGER NOT NULL,
                current_value REAL NOT NULL DEFAULT 5.00,
                penalties_json TEXT DEFAULT '[]',
                created_at_utc INTEGER DEFAULT (strftime('%s', 'now'))
            )
        """)
        
        # Create Index
        conn.execute("CREATE INDEX IF NOT EXISTS idx_voucher_week ON voucher_tracker(user_id, week_start_utc)")
        
        conn.commit()
        conn.close()
        print("✅ voucher_tracker table created/verified!")
        
    except Exception as e:
        print(f"Schema Update Error: {e}")

if __name__ == "__main__":
    update_db()
