"""
NEXUS 2026 - Passive Sensor: Screen Time Tracker
file: screen_time_tracker.py
author: Lead Architect
version: 1.0.0

Mocks OS Interaction to track screen usage and derive sleep quality.
"""

import time
import sqlite3
import random

DB_PATH = "nexus_health.db"

class ScreenTimeTracker:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.daily_screen_seconds = 0
        
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
        usage_this_hour = random.randint(0, 3600) # Max 1 hour
        
        self._save_to_db(usage_this_hour)
        
    def calculate_sleep_quality(self):
        """
        Derives sleep quality (0-10) based on screen usage.
        Logic: High nighttime usage = Bad sleep.
        """
        # Mocking "Night Time" usage (10pm - 6am)
        night_usage_seconds = random.randint(0, 7200) # up to 2 hours
        night_hours = night_usage_seconds / 3600.0
        
        # Base score 10
        # Deduct 2 points per hour of night use
        score = max(0, 10.0 - (night_hours * 2.0))
        return round(score, 1)

    def _save_to_db(self, screen_seconds):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = int(time.time())
        hour_start = now - (now % 3600)
        
        # Store screen time in passive_metrics
        # Note: We append to the row created by step_counter or create new
        # Check existing
        row = cursor.execute("""
            SELECT id, screen_time_seconds FROM passive_metrics 
            WHERE window_start_utc = ? 
            ORDER BY id DESC LIMIT 1
        """, (hour_start,)).fetchone()
        
        if row:
            new_val = row[1] + screen_seconds
            cursor.execute("UPDATE passive_metrics SET screen_time_seconds = ? WHERE id = ?", (new_val, row[0]))
        else:
             cursor.execute("""
                INSERT INTO passive_metrics (window_start_utc, window_end_utc, screen_time_seconds)
                VALUES (?, ?, ?)
            """, (hour_start, now, screen_seconds))
            
        conn.commit()
        conn.close()
        print(f"[ScreenTime] Logged {screen_seconds}s usage.")

if __name__ == "__main__":
    st = ScreenTimeTracker()
    st.track_hourly_usage()
    print(f"Derived Sleep Quality: {st.calculate_sleep_quality()}/10")
