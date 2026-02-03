import sqlite3
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = "nexus_health.db"

def fix_schema_drift():
    """
    Safely adds missing columns to hmm_states table if they don't exist.
    Does NOT drop the table.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    logger.info(f"Checking schema for {DB_PATH}...")
    
    # Check hmm_states columns
    cursor.execute("PRAGMA table_info(hmm_states)")
    columns = [info[1] for info in cursor.fetchall()]
    
    cols_to_add = [
        ("confidence_margin", "REAL"),
        ("patient_tier", "TEXT DEFAULT 'BASIC'")
    ]
    
    for col_name, col_type in cols_to_add:
        if col_name not in columns:
            logger.info(f"Adding missing column: {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE hmm_states ADD COLUMN {col_name} {col_type}")
                logger.info(f"✅ Added {col_name}")
            except Exception as e:
                logger.error(f"Failed to add {col_name}: {e}")
        else:
            logger.info(f"ℹ️ Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    logger.info("Schema synchronization complete.")

if __name__ == "__main__":
    fix_schema_drift()
