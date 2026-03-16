# Implementation Plan - Passive Sensor Data Collection

## Goal Description
Implement the passive data collection modules for Bewo. These modules simulate the interaction with mobile hardware (Accelerometer, UsageStats, GPS) and store aggregated data into the SQLite database (`passive_metrics` table).

## 1. Step Counter (`step_counter.py`)
- **Algo**: Magnitude calculation -> Smoothing -> Peak Detection (> 1.2G threshold).
- **Filtering**: Min time between steps (0.3s) to avoid noise.
- **Storage**: Aggregates value in memory, writes to DB hourly.
- **Battery**: Process batches of 50 samples (1s), sleep otherwise.

## 2. Screen Time Tracker (`screen_time_tracker.py`)
- **Input**: Simulates `UsageStatsManager` (Android).
- **Logic**: Aggregates foreground time per hour.
- **Derivation**: `sleep_quality = 10 - (night_screen_hours * 2)`.

## 3. Location Tracker (`location_tracker.py`)
- **Input**: Simulates `LocationManager` (GPS).
- **Privacy**: Calculates distance to "Home" (0,0 for demo).
- **Storage**: Only stores `time_at_home` and `max_dist_from_home`. Never stores coordinates.

## Verification
- Run `step_counter.py` with mock accelerometer stream (sine wave) -> Check DB for step counts.
- Run `screen_time_tracker.py` -> Check sleep quality derivation.
