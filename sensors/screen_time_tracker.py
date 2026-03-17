"""
Bewo 2026 - Passive Sensor: Screen Time Tracker
file: screen_time_tracker.py
author: Lead Architect
version: 1.0.0

Mocks OS Interaction to track screen usage and derive sleep quality.
"""

import time
import sqlite3
import logging
import os
import random

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

class ScreenTimeTracker:
    def __init__(self, db_path=DB_PATH, user_id=None):
        self.db_path = db_path
        self.user_id = user_id
        
    def _mock_os_usage_stats(self):
        """
        Simulates querying Android `UsageStatsManager` for today's foreground time.
        In real app: `uss.queryUsageStats(...)`
        Here: Returns random realistic value (2 - 8 hours)
        """
        # Return random seconds between 2h and 8h
        return random.randint(7200, 28800)

    def track_hourly_usage(self):
        """
        Called hourly to fetch stats and update DB.
        """
        current_total = self._mock_os_usage_stats()

        # Calculate delta since last check (simplified: just store the snapshot in a real hourly aggregate way)
        # For this logic, we'll store the Accumulating Daily Total in the DB
        # or store the 'Usage in this hour'.
        # Let's simply write the sleep derivation logic which runs once per day usually.
        # But per requirements: "Calculate hourly screen time".

        # Simulating "Usage this hour":
        # In real life, we diff total_time_visible.
        # Mock: derive a realistic hourly fraction from the daily total (varies per hour)
        hourly_fraction = random.uniform(0.05, 0.15)
        usage_this_hour = min(int(current_total * hourly_fraction), 3600)

        self._save_to_db(usage_this_hour)
        
    def calculate_sleep_quality(self):
        """
        Derives sleep quality (0-10) based on screen usage.
        Logic: High nighttime usage = Bad sleep.
        """
        # Try to use stored screen time data from DB
        night_usage_seconds = 0
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=10)
            now = int(time.time())
            # Look for screen time in the 10pm-6am window (last night) in SGT (UTC+8)
            sgt_now = now + 28800  # UTC+8
            day_start_sgt = now - (sgt_now % 86400)
            night_start = day_start_sgt - 2 * 3600   # Yesterday 10pm SGT
            night_end = day_start_sgt + 6 * 3600      # Today 6am SGT
            row = conn.execute(
                "SELECT SUM(screen_time_seconds) FROM passive_metrics WHERE window_start_utc >= ? AND window_start_utc < ? AND user_id = ?",
                (night_start, night_end, self.user_id)
            ).fetchone()
            if row and row[0] is not None:
                night_usage_seconds = row[0]
            else:
                return None  # No data available, don't fabricate
        except Exception:
            return None  # No data available, don't fabricate
        finally:
            if conn:
                conn.close()

        night_hours = night_usage_seconds / 3600.0
        score = max(0, 10.0 - (night_hours * 2.0))
        return round(score, 1)

    def _save_to_db(self, screen_seconds):
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=10)
            cursor = conn.cursor()

            now = int(time.time())
            hour_start = now - (now % 3600)

            # Store screen time in passive_metrics
            # Note: We append to the row created by step_counter or create new
            # Check existing
            row = cursor.execute("""
                SELECT id, screen_time_seconds FROM passive_metrics
                WHERE window_start_utc = ? AND user_id = ?
                ORDER BY id DESC LIMIT 1
            """, (hour_start, self.user_id)).fetchone()

            if row:
                new_val = (row[1] or 0) + screen_seconds
                cursor.execute("UPDATE passive_metrics SET screen_time_seconds = ?, window_end_utc = ? WHERE id = ?", (new_val, now, row[0]))
            elif self.user_id:
                cursor.execute("""
                    INSERT INTO passive_metrics (user_id, window_start_utc, window_end_utc, screen_time_seconds)
                    VALUES (?, ?, ?, ?)
                """, (self.user_id, hour_start, now, screen_seconds))
            else:
                logger.warning("No user_id set, skipping DB insert")
                return

            conn.commit()
            logger.info(f"Logged {screen_seconds}s usage.")
        except Exception as e:
            logger.error(f"DB error: {e}")
        finally:
            if conn:
                conn.close()

if __name__ == "__main__":
    st = ScreenTimeTracker()
    st.track_hourly_usage()
    print(f"Derived Sleep Quality: {st.calculate_sleep_quality()}/10")
