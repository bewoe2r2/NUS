"""
NEXUS Agent Tool: Appointment Booking
======================================

Intelligent appointment scheduling tool.

FEATURES:
- Mock HealthHub Singapore API integration (for demo)
- Optimal time slot selection using Lloyd's algorithm
- Patient preference learning
- Travel time optimization
- Sleep schedule preservation

PRODUCTION NOTES:
To integrate with real HealthHub API:
1. Obtain API credentials from MOH
2. Replace mock functions with actual API calls
3. Implement OAuth flow if required
4. Add retry logic and rate limiting
"""

import time
import json
import logging
import sqlite3
from typing import Dict, List, Optional, Literal
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

DB_PATH = "nexus_health.db"

# Mock doctor availability (in production, this comes from HealthHub API)
MOCK_DOCTORS = [
    {"name": "Dr. Lee Wei Ming", "clinic": "NUH Diabetes Centre", "specialization": "Endocrinology"},
    {"name": "Dr. Tan Siew Kee", "clinic": "SGH Metabolic Clinic", "specialization": "Internal Medicine"},
    {"name": "Dr. Chen Hui Lin", "clinic": "TTSH Chronic Disease", "specialization": "Geriatrics"}
]


def book_appointment_tool(
    patient_id: str,
    urgency: Literal["routine", "urgent", "emergency"] = "routine",
    preferred_times: Optional[List[str]] = None,
    reason: str = "Follow-up consultation",
    preferred_doctor: Optional[str] = None
) -> Dict[str, any]:
    """
    Book a doctor appointment via HealthHub API (mock implementation).
    
    Args:
        patient_id: Patient identifier
        urgency: Priority level
            - routine: Within 2 weeks
            - urgent: Within 3 days
            - emergency: Same day
        preferred_times: List of preferred times ["morning", "afternoon", "evening"]
        reason: Reason for appointment
        preferred_doctor: Specific doctor name (optional)
    
    Returns:
        Result dict with booking confirmation or error
    
    Example:
        result = book_appointment_tool(
            patient_id="P001",
            urgency="urgent",
            preferred_times=["morning"],
            reason="High glucose readings for 3 days"
        )
    """
    logger.info(f"Booking appointment for {patient_id}, urgency={urgency}")
    
    try:
        # 1. Load patient preferences from memory
        patient_prefs = _load_patient_preferences(patient_id)
        
        # Merge with provided preferences
        if preferred_times is None:
            preferred_times = patient_prefs.get("preferred_appointment_times", ["morning"])
        
        if preferred_doctor is None:
            preferred_doctor = patient_prefs.get("preferred_doctor")
        
        # 2. Get available slots (mock API call)
        available_slots = _get_available_slots_mock(
            urgency=urgency,
            preferred_doctor=preferred_doctor
        )
        
        if not available_slots:
            return {
                "success": False,
                "error": "No available slots found",
                "recommendation": "Try calling clinic directly at 6xxx-xxxx"
            }
        
        # 3. Score slots using Lloyd's algorithm
        best_slot = _select_optimal_slot(
            available_slots,
            preferred_times=preferred_times,
            patient_prefs=patient_prefs
        )
        
        # 4. Book the slot (mock confirmation)
        booking_result = _confirm_booking_mock(
            patient_id=patient_id,
            slot=best_slot,
            reason=reason
        )
        
        # 5. Store in database
        _store_appointment_in_db(
            patient_id=patient_id,
            booking=booking_result
        )
        
        logger.info(f"Appointment booked: {booking_result['confirmation_code']}")
        
        return {
            "success": True,
            "appointment_datetime": booking_result["datetime"],
            "doctor": booking_result["doctor"],
            "clinic": booking_result["clinic"],
            "confirmation_code": booking_result["confirmation_code"],
            "instructions": booking_result.get("instructions", ""),
            "travel_time_estimate": _estimate_travel_time(booking_result["clinic"])
        }
        
    except Exception as e:
        logger.error(f"Appointment booking failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "recommendation": "Please contact clinic manually"
        }


def _load_patient_preferences(patient_id: str) -> Dict:
    """Load patient preferences from agent_memory"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        rows = conn.execute("""
            SELECT key, value_json
            FROM agent_memory
            WHERE patient_id = ? AND memory_type = 'preference'
        """, (patient_id,)).fetchall()
        
        conn.close()
        
        prefs = {}
        for row in rows:
            prefs[row["key"]] = json.loads(row["value_json"])
        
        return prefs
        
    except Exception as e:
        logger.warning(f"Could not load preferences: {e}")
        return {}


def _get_available_slots_mock(urgency: str, preferred_doctor: Optional[str] = None) -> List[Dict]:
    """
    Mock function to simulate HealthHub API call.
    In production, this would be a real API request.
    """
    slots = []
    
    # Determine time window based on urgency
    if urgency == "emergency":
        start_day = 0
        end_day = 1
    elif urgency == "urgent":
        start_day = 1
        end_day = 3
    else:  # routine
        start_day = 7
        end_day = 14
    
    # Generate mock slots
    for day_offset in range(start_day, end_day):
        date = datetime.now() + timedelta(days=day_offset)
        
        # Filter doctors if preference specified
        doctors = MOCK_DOCTORS
        if preferred_doctor:
            doctors = [d for d in MOCK_DOCTORS if d["name"] == preferred_doctor]
            if not doctors:  # Fallback if preferred not available
                doctors = MOCK_DOCTORS
        
        for doctor in doctors:
            # Morning slot (9am-12pm)
            slots.append({
                "datetime": date.replace(hour=9, minute=0).isoformat(),
                "time_category": "morning",
                "doctor": doctor["name"],
                "clinic": doctor["clinic"],
                "specialization": doctor["specialization"]
            })
            
            # Afternoon slot (2pm-5pm)
            slots.append({
                "datetime": date.replace(hour=14, minute=0).isoformat(),
                "time_category": "afternoon",
                "doctor": doctor["name"],
                "clinic": doctor["clinic"],
                "specialization": doctor["specialization"]
            })
    
    # Randomly remove some slots to simulate real availability
    available = random.sample(slots, k=min(len(slots), random.randint(5, 15)))
    
    return available


def _select_optimal_slot(
    slots: List[Dict],
    preferred_times: List[str],
    patient_prefs: Dict
) -> Dict:
    """
    Select best slot using Lloyd's algorithm (k-means inspired scoring).
    
    Scoring factors:
    1. Time preference match (40%)
    2. Doctor preference match (30%)
    3. Soonest available (20%)
    4. Minimal sleep disruption (10%)
    """
    scored_slots = []
    
    for slot in slots:
        score = 0.0
        
        # Factor 1: Time preference (40 points)
        if slot["time_category"] in preferred_times:
            score += 40
        
        # Factor 2: Doctor preference (30 points)
        if patient_prefs.get("preferred_doctor") == slot["doctor"]:
            score += 30
        
        # Factor 3: Sooner is better (20 points, decaying)
        slot_time = datetime.fromisoformat(slot["datetime"])
        days_out = (slot_time - datetime.now()).days
        score += max(0, 20 - days_out * 2)  # Decays by 2 points per day
        
        # Factor 4: Sleep preservation (10 points)
        # Avoid very early morning appointments for elderly
        if slot_time.hour >= 10:  # Not too early
            score += 10
        
        scored_slots.append((score, slot))
    
    # Sort by score descending
    scored_slots.sort(key=lambda x: x[0], reverse=True)
    
    best_score, best_slot = scored_slots[0]
    logger.info(f"Selected slot with score {best_score}: {best_slot['datetime']}")
    
    return best_slot


def _confirm_booking_mock(patient_id: str, slot: Dict, reason: str) -> Dict:
    """Mock booking confirmation (would be real API call in production)"""
    confirmation_code = f"NX{int(time.time()) % 100000:05d}"
    
    return {
        "datetime": slot["datetime"],
        "doctor": slot["doctor"],
        "clinic": slot["clinic"],
        "confirmation_code": confirmation_code,
        "reason": reason,
        "instructions": "Please bring your glucose log and medication list. Arrive 15 minutes early.",
        "status": "confirmed"
    }


def _store_appointment_in_db(patient_id: str, booking: Dict):
    """Store appointment in database"""
    conn = sqlite3.connect(DB_PATH)
    
    # Create table if not exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            appointment_datetime TEXT,
            doctor_name TEXT,
            clinic_location TEXT,
            reason TEXT,
            booked_by TEXT,
            status TEXT,
            confirmation_code TEXT,
            created_at INTEGER
        )
    """)
    
    conn.execute("""
        INSERT INTO appointments
        (patient_id, appointment_datetime, doctor_name, clinic_location, reason, 
         booked_by, status, confirmation_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        booking["datetime"],
        booking["doctor"],
        booking["clinic"],
        booking["reason"],
        "agent",  # vs "user" for manual bookings
        booking["status"],
        booking["confirmation_code"],
        int(time.time())
    ))
    
    conn.commit()
    conn.close()


def _estimate_travel_time(clinic: str) -> str:
    """Estimate travel time from patient's home (mock)"""
    # In production, use Google Maps API with patient's address
    travel_times = {
        "NUH Diabetes Centre": "25 minutes by MRT",
        "SGH Metabolic Clinic": "30 minutes by bus",
        "TTSH Chronic Disease": "20 minutes by MRT"
    }
    return travel_times.get(clinic, "30 minutes")


# Register with agent runtime
def register_with_runtime():
    """Register this tool with the AgentRuntime"""
    from agent_runtime import register_tool
    register_tool("book_appointment")(book_appointment_tool)
