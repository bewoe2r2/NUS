"""
NEXUS 2026 - Node 3A: Merlion Risk Engine
file: merlion_risk_engine.py
author: Lead Architect

Acts as the 'Quantitative Analyst' for the system.
Calculates 'Future Risk' (time-series forecasting) to complement HMM's 'Current Meaning'.

NOTE: This requires 'salesforce-merlion'. 
If not installed, it falls back to a 'Mock Engine' that uses 
standard numpy statistical heuristic to simulate the output for the DEMO.
"""

import numpy as np
import time
import json
import logging

# Try to import Merlion (if installed)
try:
    from merlion.models.ensemble.combine import ModelSelector
    from merlion.models.automl.autosarima import AutoSARIMA
    from merlion.utils import TimeSeries
    MERLION_AVAILABLE = True
except ImportError:
    MERLION_AVAILABLE = False
    print("WARNING: 'salesforce-merlion' not found. Running in MOCK mode.")

class MerlionRiskEngine:
    def __init__(self):
        self.lookback_window = 12 # 2 hours of 10-min data
        self.forecast_horizon = 6 # 1 hour ahead
        
    def calculate_risk(self, glucose_history):
        """
        Main API entry point.
        Args:
            glucose_history (list): List of float glucose values (most recent last)
            
        Returns:
            dict: {
                "prob_crisis_45min": 0.85,
                "volatility_index": 2.4,
                "forecast_curve": [5.5, 5.2, 4.8...]
            }
        """
        if not glucose_history or len(glucose_history) < 3:
            return self._get_empty_risk()
            
        if MERLION_AVAILABLE:
            return self._calculate_real_merlion_risk(glucose_history)
        else:
            return self._calculate_mock_risk(glucose_history)

    def _get_empty_risk(self):
        return {
            "prob_crisis_45min": 0.0,
            "volatility_index": 0.0,
            "forecast_curve": [],
            "status": "INSUFFICIENT_DATA"
        }

    def _calculate_mock_risk(self, history):
        """
        Simulates Merlion's 'Deep Point Process' using derivative calculus.
        This provides a mathematically defensible 'Edge' approximation for the demo.
        """
        data = np.array(history)
        current_val = data[-1]
        
        # 1. Calculate Velocity (1st Derivative)
        # Gradient over last 3 points
        velocity = np.gradient(data[-3:]).mean()
        
        # 2. Calculate Acceleration (2nd Derivative)
        # Are we crashing faster?
        acceleration = np.diff(data[-3:], n=2).mean() if len(data) >= 3 else 0
        
        # 3. Forecast next 6 points (Linear extrapolation + decay)
        # Formula: P_t = P_0 + v*t + 0.5*a*t^2
        forecast = []
        for t in range(1, self.forecast_horizon + 1):
            pred = current_val + (velocity * t) + (0.5 * acceleration * (t**2))
            forecast.append(round(float(pred), 2))
            
        # 4. Calculate Volatility (Standard Deviation of recent window)
        volatility = np.std(data) if len(data) > 1 else 0
        
        # 5. Determine Crisis Probability
        # If forecast hits critical threshold (<3.9 or >15)
        min_forecast = min(forecast)
        max_forecast = max(forecast)
        
        prob = 0.0
        if min_forecast < 4.0:
            # Hypo Risk uses sigmoid function based on how deep the crash is
            prob = min(1.0, max(0.0, (4.0 - min_forecast) * 0.8))
        elif max_forecast > 14.0:
            # Hyper Risk
            prob = min(1.0, max(0.0, (max_forecast - 14.0) * 0.2))
            
        # Heuristic boost if acceleration is dangerous
        if acceleration < -0.1 and current_val < 6.0:
            prob += 0.2 # "The Cliff Edge" bonus risk
            
        return {
            "prob_crisis_45min": round(min(1.0, prob), 2),
            "volatility_index": round(float(volatility), 2),
            "forecast_curve": forecast,
            "velocity": round(float(velocity), 2),
            "acceleration": round(float(acceleration), 3),
            "engine": "MOCK_MERLION_V1"
        }

    def _calculate_real_merlion_risk(self, history):
        # Placeholder for when library is installed
        # This would use TimeSeries.from_list() and ModelSelector
        return self._calculate_mock_risk(history) # Fallback

if __name__ == "__main__":
    # Test Bench
    engine = MerlionRiskEngine()
    
    print("--- Test 1: Stable Patient ---")
    stable_data = [5.5, 5.4, 5.6, 5.5, 5.4]
    print(engine.calculate_risk(stable_data))
    
    print("\n--- Test 2: CRASHING Patient (The 'Cliff Edge') ---")
    # Dropping fast: 6.0 -> 5.5 -> 4.8
    crash_data = [7.0, 6.5, 6.0, 5.5, 4.8] 
    print(engine.calculate_risk(crash_data))
