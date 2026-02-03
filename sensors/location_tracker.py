"""
NEXUS 2026 - Passive Sensor: Location Tracker (Privacy Preserving)
file: location_tracker.py
author: Lead Architect
version: 1.0.0

Tracks user location zones without identifying specific coordinates.
Zones:
- HOME (Within 100m of base)
- CLINIC (Within 100m of hospital)
- OUTSIDE (Else)

Privacy Tier 1: Raw GPS discarded after classification.
"""

import time
import sqlite3
import math
import random

DB_PATH = "nexus_health.db"

# Mock Home Location (Singapore City Hall approx)
HOME_LAT = 1.2931
HOME_LON = 103.8517

class LocationTracker:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.time_at_home_seconds = 0
        self.max_dist_km = 0.0
        
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculates distance in km between two lat/lon points.
        """
        R = 6371 # Earth radius in km
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def process_location_update(self, lat, lon, duration_seconds=60):
        """
        Process a new GPS fix.
        Args:
            lat, lon: Coordinates
            duration_seconds: How long user was here (simulation)
        """
        dist_km = self.haversine_distance(lat, lon, HOME_LAT, HOME_LON)
        
        # Update Stats
        if dist_km > self.max_dist_km:
            self.max_dist_km = dist_km
            
        if dist_km < 0.1: # 100 meters
            self.time_at_home_seconds += duration_seconds
        
        # Privacy: We discard lat/lon here. Only stats kept.

    def save_stats(self):
        """Writes hourly aggregated stats to DB."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = int(time.time())
        hour_start = now - (now % 3600)
        
        # Upsert logic similar to others
        row = cursor.execute("""
            SELECT id, time_at_home_seconds, max_distance_from_home_km 
            FROM passive_metrics 
            WHERE window_start_utc = ? 
            ORDER BY id DESC LIMIT 1
        """, (hour_start,)).fetchone()
        
        if row:
            # Aggregate time, keep max dist
            new_time = row[1] + self.time_at_home_seconds
            new_max = max(row[2], self.max_dist_km)
            cursor.execute("""
                UPDATE passive_metrics 
                SET time_at_home_seconds = ?, max_distance_from_home_km = ? 
                WHERE id = ?
            """, (new_time, new_max, row[0]))
        else:
            cursor.execute("""
                INSERT INTO passive_metrics (window_start_utc, window_end_utc, time_at_home_seconds, max_distance_from_home_km)
                VALUES (?, ?, ?, ?)
            """, (hour_start, now, self.time_at_home_seconds, self.max_dist_km))
            
        conn.commit()
        conn.close()
        
        print(f"[Location] Saved: Home {self.time_at_home_seconds}s, Max Dist {self.max_dist_km:.3f}km")
        
        # Reset counters
        self.time_at_home_seconds = 0
        self.max_dist_km = 0.0

    def simulate_day_movement(self):
        print("Simulating movement...")
        # 1. Start at Home
        self.process_location_update(HOME_LAT, HOME_LON, 3600) # 1 hour
        
        # 2. Go to Coffee Shop (0.5km away)
        self.process_location_update(HOME_LAT + 0.005, HOME_LON, 1800) # 30 mins
        
        # 3. Go to Park (2km away)
        self.process_location_update(HOME_LAT + 0.02, HOME_LON + 0.01, 3600) 
        
        self.save_stats()

if __name__ == "__main__":
    lt = LocationTracker()
    lt.simulate_day_movement()
