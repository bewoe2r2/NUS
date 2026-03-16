
import _path_setup
import sqlite3
import logging
import json
import os
import sys
import time

from clinical_engine import ClinicalEngine
from hmm_engine import HMMEngine
from inject_data import inject_tiered_scenario_to_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_test_db(db_path="test_clinical.db"):
    """Creates a fresh test database with current schema."""
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Initialize schema
    conn = sqlite3.connect(db_path)
    with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_schema.sql"), "r") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.close()
    return db_path

def test_clinical_pipeline():
    logger.info("=== Testing Clinical Engine Pipeline ===")
    
    # 1. Setup DB
    db_path = setup_test_db()
    
    # 2. Inject Demo Data (Observations)
    logger.info("Generating demo scenario...")
    hmm_engine = HMMEngine(db_path=db_path)
    obs = hmm_engine.generate_demo_scenario("stable_perfect", days=3)
    
    # Inject using a monkey-patched DB_PATH for the injector if needed?
    # inject_data.py hardcodes DB_PATH = "nexus_health.db".
    # We must temporarily override it or modify the function signature.
    # Since we can't easily override a global in another module without re-import tricks that might be flaky,
    # let's just implement a simplified injector here using the 'obs' we have.
    
    conn = sqlite3.connect(db_path)
    
    # Inject Observations (Simplified for test)
    logger.info("Injecting observations into test DB...")
    now = int(time.time())
    start_time = now - (3 * 24 * 3600)
    for i, o in enumerate(obs):
        t = start_time + i * 4 * 3600
        # Glucose
        if o.get('glucose_avg'):
            conn.execute("INSERT INTO glucose_readings (user_id, reading_value, reading_timestamp_utc, source_type) VALUES (?, ?, ?, ?)", 
                         ('test_user', o['glucose_avg'], t, 'MANUAL'))
        # Meds
        if o.get('meds_adherence', 0) > 0.5:
             conn.execute("INSERT INTO medication_logs (medication_name, taken_timestamp_utc) VALUES (?, ?)", 
                          ('Metformin', t))
    
    # 3. Inject Patient Profile (Crucial Step)
    logger.info("Injecting patient profile...")
    conn.execute("""
        INSERT INTO patients (user_id, name, age, conditions, medications, tier)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ('test_user', 'Test Patient', 65, json.dumps(['Diabetes T2']), json.dumps(['Metformin']), 'PREMIUM'))
    
    conn.commit()
    conn.close()
    
    # 4. Initialize Clinical Engine
    engine = ClinicalEngine(db_path=db_path)
    
    # 5. Execute Pipeline
    try:
        logger.info("Executing pipeline...")
        result = engine.execute_pipeline('test_user')
        
        logger.info(f"Pipeline Result State: {result['state']}")
        logger.info(f"SBAR Situation: {result['sbar'].get('Situation')}")
        logger.info(f"Metrics: {result['metrics']}")
        
        # Validation
        if result['state'] in ['STABLE', 'WARNING', 'CRISIS']:
            logger.info("✅ SUCCESS: Valid state detected.")
        else:
            logger.error("❌ FAILURE: Invalid state.")
            
        if 'glucose_avg' in result['metrics'] and result['metrics']['glucose_avg'] > 0:
             logger.info(f"✅ SUCCESS: Metrics computed ({result['metrics']['glucose_avg']})")
        else:
             logger.error("❌ FAILURE: Metrics computation failed or glucose is 0.")
             
        if 'Situation' in result['sbar'] and result['sbar']['Situation'].startswith("Offline"):
             logger.info("✅ SUCCESS: Offline SBAR generated (expected without API key).")
        elif result['sbar']:
             logger.info("✅ SUCCESS: SBAR generated.")
        
    except Exception as e:
        logger.error(f"❌ CRASH: {e}", exc_info=True)

if __name__ == "__main__":
    test_clinical_pipeline()
