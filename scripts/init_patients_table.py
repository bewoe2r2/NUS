
import sqlite3
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "nexus_health.db"

def init_patients_table():
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Create Table (if not exists)
    logger.info("Ensuring 'patients' table exists...")
    conn.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        conditions TEXT, -- JSON array
        medications TEXT, -- JSON array
        tier TEXT DEFAULT 'BASIC',
        created_at_utc INTEGER DEFAULT (strftime('%s', 'now'))
    )
    """)
    
    # 2. Check for existing users
    row = conn.execute("SELECT count(*) FROM patients").fetchone()
    if row[0] == 0:
        logger.info("Patients table empty. Seeding default 'Uncle Tan'...")
        
        uncle_tan = {
            'user_id': 'user_123',
            'name': 'Uncle Tan',
            'age': 67,
            'conditions': json.dumps(['Type 2 Diabetes', 'Hypertension']),
            'medications': json.dumps(['Metformin 500mg', 'Lisinopril 10mg']),
            'tier': 'PREMIUM'
        }
        
        conn.execute("""
            INSERT INTO patients (user_id, name, age, conditions, medications, tier)
            VALUES (:user_id, :name, :age, :conditions, :medications, :tier)
        """, uncle_tan)
        
        # Also ensure 'current_user' exists for demo script compatibility
        current_user = {
            'user_id': 'current_user', # Default ID used exclusively in demo scripts
            'name': 'Demo User',
            'age': 45,
            'conditions': json.dumps(['Type 2 Diabetes']),
            'medications': json.dumps(['Metformin 500mg']),
            'tier': 'PREMIUM'
        }
        conn.execute("""
            INSERT INTO patients (user_id, name, age, conditions, medications, tier)
            VALUES (:user_id, :name, :age, :conditions, :medications, :tier)
        """, current_user)
        
        logger.info("Seeded 2 patients.")
    else:
        logger.info(f"Patients table has {row[0]} records. Skipping seed.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_patients_table()
