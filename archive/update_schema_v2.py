"""
update_schema_v2.py
===================

Database migration script for the Smart SBAR System.
Adds the following tables to 'nexus_health.db':
1. patients: Persistent clinical profile (Conditions, Meds).
2. clinical_notes_history: Audit trail for AI-generated SBARs.

Includes mock data injection for 'current_user' (Mr. Tan).
"""

import sqlite3
import logging
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "nexus_health.db"

def update_schema():
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        
        # 1. Create 'patients' table
        logger.info("Creating 'patients' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                user_id TEXT PRIMARY KEY,
                display_name TEXT,
                conditions TEXT,
                medications TEXT,
                last_hba1c REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 2. Create 'clinical_notes_history' table
        logger.info("Creating 'clinical_notes_history' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS clinical_notes_history (
                note_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sbar_json TEXT,  -- JSON blob of the report
                FOREIGN KEY(user_id) REFERENCES patients(user_id)
            )
        """)
        
        # 3. Inject Mock Data for Mr. Tan
        logger.info("Injecting mock profile for 'current_user'...")
        cur.execute("""
            INSERT OR REPLACE INTO patients (user_id, display_name, conditions, medications, last_hba1c)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "current_user", 
            "Mr. Tan (72M)", 
            "Type 2 Diabetes, Hypertension, Hyperlipidemia", 
            "Metformin 1000mg BD, Amlodipine 5mg OD, Atorvastatin 20mg ON", 
            8.1
        ))
        
        # 4. Inject Mock Data for 'Patient B' (Critical Carl) and 'Patient C' (Stable Sarah)
        cur.execute("""
            INSERT OR REPLACE INTO patients (user_id, display_name, conditions, medications, last_hba1c)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "critical_carl", 
            "Mr. Carl (65M)", 
            "T2DM, Heart Failure (NYHA II)", 
            "Insulin Glargine 20U, Furosemide 40mg OD", 
            9.5
        ))
        
        cur.execute("""
            INSERT OR REPLACE INTO patients (user_id, display_name, conditions, medications, last_hba1c)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "stable_sarah", 
            "Mdm. Sarah (58F)", 
            "Pre-Diabetes, Obesity", 
            "Metformin 500mg OD, Lifestyle Intervention", 
            6.2
        ))

        conn.commit()
        logger.info("✅ Schema Update & Data Injection Complete.")
        
    except Exception as e:
        logger.error(f"Schema update failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
