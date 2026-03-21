import sqlite3
import logging
import os

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_schema.sql")

def init_db():
    if not os.path.exists(SCHEMA_PATH):
        logger.error(f"{SCHEMA_PATH} not found.")
        return

    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        cursor.executescript(sql_script)

        # Add missing columns to hmm_states if they don't exist
        try:
            cursor.execute("ALTER TABLE hmm_states ADD COLUMN confidence_margin REAL")
        except Exception as e:
            logger.debug(f"Column may already exist: {e}")

        try:
            cursor.execute("ALTER TABLE hmm_states ADD COLUMN patient_tier TEXT DEFAULT 'BASIC'")
        except Exception as e:
            logger.debug(f"Column may already exist: {e}")

        # Add retention_until to all relevant tables if missing
        tables_with_retention = ['glucose_readings', 'medication_logs', 'passive_metrics', 'voice_checkins', 'hmm_states']
        for table in tables_with_retention:
            try:
                # Default to +6 months (15552000 seconds) from now
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000)")
                logger.info(f"Added retention_until to {table}")
            except Exception as e:
                logger.debug(f"Skipping {table} (might exist or error): {e}")

        # Add social_interactions to passive_metrics
        try:
            cursor.execute("ALTER TABLE passive_metrics ADD COLUMN social_interactions INTEGER DEFAULT 0")
            logger.info("Added social_interactions to passive_metrics")
        except Exception as e:
            logger.debug(f"Column may already exist: {e}")

        # Add HRV columns to fitbit_heart_rate (critical for diabetic autonomic neuropathy detection)
        try:
            cursor.execute("ALTER TABLE fitbit_heart_rate ADD COLUMN hrv_rmssd REAL")
            logger.info("Added hrv_rmssd to fitbit_heart_rate")
        except Exception as e:
            logger.debug(f"Column may already exist: {e}")

        try:
            cursor.execute("ALTER TABLE fitbit_heart_rate ADD COLUMN hrv_sdnn REAL")
            logger.info("Added hrv_sdnn to fitbit_heart_rate")
        except Exception as e:
            logger.debug(f"Column may already exist: {e}")

        conn.commit()
        logger.info(f"Successfully initialized {DB_PATH}")

    except Exception as e:
        logger.error(f"Database Initialization Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
