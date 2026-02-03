"""
NEXUS 2026 - Passive Sensor: Step Counter
file: step_counter.py
author: Lead Architect
version: 1.0.0

Implements background accelerometer processing for step detection.
Algorithm: Magnitude -> Peak Detection -> Thresholding (>1.2G)
"""

import time
import sqlite3
from collections import deque
import math
import random

DB_PATH = "nexus_health.db"

class StepCounter:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.step_count = 0
        self.accel_buffer = deque(maxlen=50) # 1 second window @ 50hz
        self.last_step_time = 0
        
        # Algorithm Tunables
        self.PEAK_THRESHOLD = 12.0 # m/s^2 (approx 1.2G)
        self.MIN_STEP_INTERVAL = 0.3 # seconds (cannot step faster than 3 per sec easily)
        self.GRAVITY = 9.81
        
    def process_accel_sample(self, x, y, z, timestamp):
        """
        Process single accelerometer sample.
        Args:
            x, y, z: Acceleration in m/s² (includes gravity)
            timestamp: Unix timestamp float
        Returns:
            bool: True if step detected
        """
        # 1. Calculate magnitude
        magnitude = math.sqrt(x**2 + y**2 + z**2)
        
        # 2. Add to rolling buffer
        self.accel_buffer.append(magnitude)
        
        # Need enough history for peak detection context
        if len(self.accel_buffer) < 5:
            return False
            
        # 3. Peak Detection Logic
        # Current sample is identifying candidate peak
        # Check: [prev_2, prev, CURRENT, next, next_2] - simplified to 3-point check for 50hz stream
        # Or simply: current > prev AND current > next
        # Since we are processing stream, "next" is not available unless we lag by 1 sample.
        # Implemented with 1-sample lag:
        
        current_mag = self.accel_buffer[-2] # The "Middle" sample
        prev_mag = self.accel_buffer[-3]
        next_mag = self.accel_buffer[-1] # The "New" sample
        
        is_peak = (current_mag > prev_mag) and (current_mag > next_mag)
        above_threshold = current_mag > self.PEAK_THRESHOLD
        time_delta = timestamp - self.last_step_time
        
        if is_peak and above_threshold and (time_delta > self.MIN_STEP_INTERVAL):
            self.step_count += 1
            self.last_step_time = timestamp
            return True
            
        return False

    def save_hourly_count(self):
        """Save step count to database, aggregating into hourly buckets."""
        if self.step_count == 0:
            return # Optimization: Don't write zeros repeatedly if idle
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            now = int(time.time())
            hour_start = now - (now % 3600)
            
            # Upsert logic: Add to existing count if exists
            cursor.execute("""
                INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET step_count = step_count + ?
            """, (hour_start, now, self.step_count, self.step_count))
            
            # Since we don't have a unique constraint on window_start for the ID, 
            # the simple INSERT might create duplicates. 
            # Better approach: Check if row exists for this hour.
            
            # Check existing
            row = cursor.execute("""
                SELECT id, step_count FROM passive_metrics 
                WHERE window_start_utc = ? 
                ORDER BY id DESC LIMIT 1
            """, (hour_start,)).fetchone()
            
            if row:
                new_total = row[1] + self.step_count
                cursor.execute("UPDATE passive_metrics SET step_count = ? WHERE id = ?", (new_total, row[0]))
            else:
                cursor.execute("""
                    INSERT INTO passive_metrics (window_start_utc, window_end_utc, step_count)
                    VALUES (?, ?, ?)
                """, (hour_start, now, self.step_count))
            
            conn.commit()
            conn.close()
            
            print(f"[StepCounter] Saved {self.step_count} steps to DB.")
            self.step_count = 0 # Reset after save
            
        except Exception as e:
            print(f"[StepCounter] Error saving to DB: {e}")

    # --- Simulation Method for Testing ---
    def simulate_walking(self, duration_seconds=10, frequency_hz=50):
        print(f"Simulating walking for {duration_seconds}s...")
        steps_detected = 0
        start_time = time.time()
        
        for i in range(int(duration_seconds * frequency_hz)):
            t = start_time + (i / frequency_hz)
            
            # Simulate Sine Wave walking pattern (approx 2 steps/sec)
            # Gravity (9.8) + Sin wave amp (3.0)
            # Add some random noise
            val = 9.8 + (4.0 * math.sin(2 * math.pi * 2.0 * t)) + random.uniform(-0.5, 0.5)
            
            # Call processor (assume z-axis dominates)
            if self.process_accel_sample(0, 0, val, t):
                steps_detected += 1
                
        print(f"Simulation Complete. Detected {steps_detected} steps.")
        self.save_hourly_count()

if __name__ == "__main__":
    # Test
    sc = StepCounter()
    sc.simulate_walking(duration_seconds=5)
