"""
Bewo Agent Tool: Clinical Interventions
=========================================

Advanced clinical decision support tools.

FEATURES:
- Counterfactual simulation (INNOVATION #5 from competition brief)
- Medication adjustment recommendations
- Clinical guideline compliance checking
- HMM-powered "what-if" scenarios

COUNTERFACTUAL EXAMPLES:
"What if patient took medication now vs. in 2 hours?"
"What if patient ate 30g carbs instead of 60g?"
"What if patient walked 5000 steps instead of 2000?"
"""

import logging
import json
import os
import sys
from typing import Dict, Any, Optional
import copy

# Ensure core/ is on path for HMMEngine import
_core_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core")
if _core_path not in sys.path:
    sys.path.insert(0, _core_path)

logger = logging.getLogger(__name__)


def calculate_counterfactual_tool(
    patient_id: str,
    intervention: str,
    intervention_params: Dict[str, Any],
    horizon_hours: int = 24
) -> Dict:
    """
    Calculate counterfactual scenario: "What if we intervene?"
    
    Uses HMM to project forward with modified observations.
    This is INNOVATION #5 from the competition brief.
    
    Args:
        patient_id: Patient identifier
        intervention: Type of intervention
            - "take_medication": Simulate taking missed medication
            - "adjust_carbs": Simulate different carb intake
            - "increase_activity": Simulate more physical activity
        intervention_params: Dict with intervention-specific params
        horizon_hours: How far to project (default 24h)
    
    Returns:
        Comparison of baseline vs. intervention trajectories
    
    Example:
        result = calculate_counterfactual_tool(
            patient_id="P001",
            intervention="take_medication",
            intervention_params={"medication": "Metformin", "dose": "500mg"},
            horizon_hours=24
        )
        
        # Result:
        {
            "baseline": {
                "current_state": "WARNING",
                "predicted_state_24h": "CRISIS",
                "crisis_probability": 0.65
            },
            "intervention": {
                "modified_state": "WARNING",
                "predicted_state_24h": "STABLE",
                "crisis_probability": 0.15
            },
            "benefit": {
                "crisis_risk_reduction": 0.50,  # 50% risk reduction
                "recommendation": "STRONGLY RECOMMENDED"
            }
        }
    """
    logger.info(f"Calculating counterfactual: {intervention} for {patient_id}")
    
    try:
        from hmm_engine import HMMEngine
        
        engine = HMMEngine()
        
        # 1. Get current observations
        observations = engine.fetch_observations(days=7, patient_id=patient_id)
        if not observations:
            return {
                "success": False,
                "error": "No observation data available"
            }

        current_obs = copy.deepcopy(observations[-1])
        
        # 2. Run baseline projection (no intervention)
        baseline_result = engine.run_inference(observations, patient_id=patient_id)
        baseline_forecast = engine.predict_time_to_crisis(
            current_obs, 
            horizon_hours=horizon_hours
        )
        
        # 3. Modify observation based on intervention
        modified_obs = _apply_intervention(current_obs, intervention, intervention_params)
        
        # 4. Run intervention projection
        # Create modified observation sequence
        modified_sequence = observations[:-1] + [modified_obs]
        intervention_result = engine.run_inference(modified_sequence, patient_id=patient_id)
        intervention_forecast = engine.predict_time_to_crisis(
            modified_obs,
            horizon_hours=horizon_hours
        )
        
        # 5. Calculate benefit
        baseline_risk = baseline_forecast.get("prob_crisis_percent", 0) / 100.0
        intervention_risk = intervention_forecast.get("prob_crisis_percent", 0) / 100.0
        risk_reduction = baseline_risk - intervention_risk
        
        # Recommendation logic
        if risk_reduction > 0.30:
            recommendation = "STRONGLY RECOMMENDED"
        elif risk_reduction > 0.15:
            recommendation = "RECOMMENDED"
        elif risk_reduction > 0.05:
            recommendation = "SLIGHTLY BENEFICIAL"
        else:
            recommendation = "MINIMAL BENEFIT"
        
        result = {
            "success": True,
            "patient_id": patient_id,
            "intervention": intervention,
            "baseline": {
                "current_state": baseline_result.get("current_state"),
                "crisis_risk_24h": baseline_risk,
                "expected_time_to_crisis": baseline_forecast.get("expected_hours_to_crisis")
            },
            "intervention_scenario": {
                "modified_state": intervention_result.get("current_state"),
                "crisis_risk_24h": intervention_risk,
                "expected_time_to_crisis": intervention_forecast.get("expected_hours_to_crisis")
            },
            "benefit": {
                "crisis_risk_reduction": round(risk_reduction, 3),
                "risk_reduction_percent": round(risk_reduction * 100, 1),
                "recommendation": recommendation
            },
            "explanation": _generate_explanation(
                intervention, 
                intervention_params, 
                risk_reduction,
                baseline_risk,
                intervention_risk
            )
        }
        
        logger.info(f"Counterfactual complete: {recommendation}, risk reduction = {risk_reduction:.2%}")
        
        return result
        
    except Exception as e:
        logger.error(f"Counterfactual calculation failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def _apply_intervention(
    observation: Dict[str, Any],
    intervention: str,
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Modify observation to simulate intervention effect.
    
    CLINICAL ASSUMPTIONS (evidence-based):
    - Taking Metformin: Reduces glucose by ~2 mmol/L over 4h
    - Reducing carbs by 30g: Reduces glucose by ~1.5 mmol/L
    - Adding 3000 steps: Reduces glucose by ~0.8 mmol/L, improves HRV
    """
    modified = copy.deepcopy(observation)
    
    if intervention == "take_medication":
        med_name = params.get("medication", "").lower()

        if "metformin" in med_name:
            # Metformin effect: -2 mmol/L on average
            if modified.get("glucose_avg") is not None:
                modified["glucose_avg"] = max(4.0, modified["glucose_avg"] - 2.0)
            # Also improves adherence
            modified["meds_adherence"] = min(1.0, (modified.get("meds_adherence") or 0.5) + 0.2)

        elif "insulin" in med_name:
            # Insulin effect: stronger, -3 to -4 mmol/L
            if modified.get("glucose_avg") is not None:
                modified["glucose_avg"] = max(4.0, modified["glucose_avg"] - 3.5)

    elif intervention == "adjust_carbs":
        carb_change = params.get("carb_reduction", 0)  # in grams

        if modified.get("glucose_avg") is not None and carb_change > 0:
            # ~30g carbs = ~1.5 mmol/L glucose increase
            glucose_change = -(carb_change / 30.0) * 1.5
            modified["glucose_avg"] = max(4.0, modified["glucose_avg"] + glucose_change)

        if modified.get("carbs_intake") is not None:
            modified["carbs_intake"] = max(0, modified["carbs_intake"] - carb_change)
    
    elif intervention == "increase_activity":
        step_increase = params.get("additional_steps", 0)

        if modified.get("steps_daily") is not None:
            modified["steps_daily"] = modified["steps_daily"] + step_increase

        if modified.get("glucose_avg") is not None and step_increase > 0:
            # Every 3000 steps reduces glucose by ~0.8 mmol/L
            glucose_change = -(step_increase / 3000.0) * 0.8
            modified["glucose_avg"] = max(4.0, modified["glucose_avg"] + glucose_change)

        # Activity also improves HRV
        if modified.get("hrv_rmssd") is not None and step_increase > 0:
            modified["hrv_rmssd"] = min(100, modified["hrv_rmssd"] + 3)
    
    return modified


def _generate_explanation(
    intervention: str,
    params: Dict,
    risk_reduction: float,
    baseline_risk: float,
    intervention_risk: float
) -> str:
    """Generate human-readable explanation of counterfactual"""
    
    explanations = {
        "take_medication": f"Taking your {params.get('medication', 'medication')} now would reduce your crisis risk from {baseline_risk:.1%} to {intervention_risk:.1%} (a reduction of {risk_reduction:.1%}).",
        
        "adjust_carbs": f"Reducing carb intake by {params.get('carb_reduction', 0)}g would reduce crisis risk from {baseline_risk:.1%} to {intervention_risk:.1%}.",
        
        "increase_activity": f"Adding {params.get('additional_steps', 0)} steps would reduce crisis risk from {baseline_risk:.1%} to {intervention_risk:.1%}."
    }
    
    return explanations.get(intervention, f"This intervention would reduce crisis risk by {risk_reduction:.1%}.")


def suggest_medication_adjustment_tool(
    patient_id: str,
    current_state: str,
    hmm_factors: Dict[str, Any]
) -> Dict:
    """
    Generate medication adjustment recommendation.
    
    IMPORTANT: This generates a suggestion for DOCTOR REVIEW.
    It does NOT automatically adjust medications.
    
    Args:
        patient_id: Patient identifier
        current_state: Current HMM state
        hmm_factors: Contributing factors from HMM
    
    Returns:
        Recommendation dict for doctor review
    """
    logger.info(f"Generating medication suggestion for {patient_id} in {current_state}")
    
    try:
        glucose_avg = hmm_factors.get("glucose_avg", 7.0)
        adherence = hmm_factors.get("meds_adherence", 0.8)
        
        suggestions = []
        
        # High glucose + good adherence = may need dose increase
        if glucose_avg > 10.0 and adherence > 0.8:
            suggestions.append({
                "type": "dose_increase",
                "medication": "Metformin",
                "current_dose": "500mg BID",
                "suggested_dose": "1000mg BID",
                "rationale": "Persistent hyperglycemia despite good adherence suggests need for dose escalation",
                "urgency": "routine",
                "approval_required": True
            })
        
        # High glucose + poor adherence = behavioral intervention first
        elif glucose_avg > 10.0 and adherence < 0.6:
            suggestions.append({
                "type": "behavioral_intervention",
                "recommendation": "Improve medication adherence before dose adjustment",
                "proposed_actions": [
                    "Set up automated reminders",
                    "Simplify medication schedule",
                    "Caregiver notification"
                ],
                "rationale": "Poor adherence is likely contributing to hyperglycemia",
                "approval_required": False
            })
        
        return {
            "success": True,
            "patient_id": patient_id,
            "suggestions": suggestions,
            "disclaimer": "FOR DOCTOR REVIEW ONLY - NOT AUTOMATICALLY APPLIED"
        }
        
    except Exception as e:
        logger.error(f"Medication suggestion failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
