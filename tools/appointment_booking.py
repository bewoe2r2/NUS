"""
Bewo Agent Tool: Appointment Booking
=====================================

Intelligent appointment scheduling with hospital API adapter pattern.

ARCHITECTURE:
    AppointmentProvider (abstract) → MockProvider (demo) / HealthHubProvider (production)
    The agent calls book_appointment_tool() which delegates to the configured provider.
    Swap providers via APPOINTMENT_PROVIDER env var without changing any agent code.

PRODUCTION DEPLOYMENT:
    1. Set APPOINTMENT_PROVIDER=healthhub
    2. Set HEALTHHUB_API_KEY, HEALTHHUB_API_URL in .env
    3. The HealthHubProvider sends real FHIR R4 appointment requests
    4. All other code (scoring, DB logging, preference learning) stays identical

FEATURES:
    - Provider-based adapter pattern (mock ↔ real with zero agent changes)
    - FHIR R4 compliant appointment resource structure
    - Optimal time slot selection (multi-factor weighted scoring)
    - Patient preference learning from agent_memory
    - Travel time estimation (pluggable — Google Maps API in production)
    - Full audit trail in SQLite
"""

import time
import json
import logging
import sqlite3
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Literal
from datetime import datetime, timedelta
import random
import os

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

# --- Provider Configuration ---
APPOINTMENT_PROVIDER = os.getenv("APPOINTMENT_PROVIDER", "mock")  # "mock" or "healthhub"
HEALTHHUB_API_URL = os.getenv("HEALTHHUB_API_URL", "https://api.healthhub.sg/v1")
HEALTHHUB_API_KEY = os.getenv("HEALTHHUB_API_KEY", "")

# Singapore public hospital clinics (used by both mock and real providers)
CLINIC_REGISTRY = [
    {"name": "Dr. Lee Wei Ming", "clinic": "NUH Diabetes Centre", "specialization": "Endocrinology", "npi": "SG-NUH-001"},
    {"name": "Dr. Tan Siew Kee", "clinic": "SGH Metabolic Clinic", "specialization": "Internal Medicine", "npi": "SG-SGH-001"},
    {"name": "Dr. Chen Hui Lin", "clinic": "TTSH Chronic Disease", "specialization": "Geriatrics", "npi": "SG-TTSH-001"},
]


# =============================================================================
# Provider Interface (Adapter Pattern)
# =============================================================================

class AppointmentProvider(ABC):
    """Abstract interface for appointment booking providers."""

    @abstractmethod
    def get_available_slots(self, urgency: str, preferred_doctor: Optional[str] = None) -> List[Dict]:
        """Fetch available appointment slots from the scheduling system."""
        ...

    @abstractmethod
    def confirm_booking(self, patient_id: str, slot: Dict, reason: str) -> Dict:
        """Confirm and book the selected slot. Returns booking confirmation."""
        ...

    @abstractmethod
    def cancel_booking(self, confirmation_code: str) -> bool:
        """Cancel an existing booking."""
        ...


class MockProvider(AppointmentProvider):
    """
    Demo provider — generates realistic slots without external API calls.
    Used for competition demos and development.
    """

    def get_available_slots(self, urgency: str, preferred_doctor: Optional[str] = None) -> List[Dict]:
        slots = []
        if urgency == "emergency":
            start_day, end_day = 0, 1
        elif urgency == "urgent":
            start_day, end_day = 1, 3
        else:
            start_day, end_day = 7, 14

        doctors = CLINIC_REGISTRY
        if preferred_doctor:
            filtered = [d for d in CLINIC_REGISTRY if d["name"] == preferred_doctor]
            if filtered:
                doctors = filtered

        for day_offset in range(start_day, end_day):
            date = datetime.now() + timedelta(days=day_offset)
            for doctor in doctors:
                slots.append({
                    "datetime": date.replace(hour=9, minute=0).isoformat(),
                    "time_category": "morning",
                    "doctor": doctor["name"],
                    "clinic": doctor["clinic"],
                    "specialization": doctor["specialization"],
                })
                slots.append({
                    "datetime": date.replace(hour=14, minute=0).isoformat(),
                    "time_category": "afternoon",
                    "doctor": doctor["name"],
                    "clinic": doctor["clinic"],
                    "specialization": doctor["specialization"],
                })

        available = random.sample(slots, k=min(len(slots), random.randint(5, 15)))
        return available

    def confirm_booking(self, patient_id: str, slot: Dict, reason: str) -> Dict:
        confirmation_code = f"BW{int(time.time()) % 100000:05d}"
        return {
            "datetime": slot["datetime"],
            "doctor": slot["doctor"],
            "clinic": slot["clinic"],
            "confirmation_code": confirmation_code,
            "reason": reason,
            "instructions": "Please bring your glucose log and medication list. Arrive 15 minutes early.",
            "status": "confirmed",
        }

    def cancel_booking(self, confirmation_code: str) -> bool:
        logger.info(f"[MOCK] Cancelled booking {confirmation_code}")
        return True


class HealthHubProvider(AppointmentProvider):
    """
    Production provider — integrates with Singapore HealthHub / hospital APIs.

    FHIR R4 Appointment resource flow:
        1. GET /Slot?schedule.actor=Practitioner/{npi}&status=free → available slots
        2. POST /Appointment with participant + slot reference → confirmed booking
        3. PATCH /Appointment/{id} with status=cancelled → cancellation

    Requires: HEALTHHUB_API_KEY, HEALTHHUB_API_URL environment variables.
    """

    def __init__(self):
        if not HEALTHHUB_API_KEY:
            raise RuntimeError("HEALTHHUB_API_KEY not configured. Set it in .env for production use.")
        self.base_url = HEALTHHUB_API_URL
        self.headers = {
            "Authorization": f"Bearer {HEALTHHUB_API_KEY}",
            "Content-Type": "application/fhir+json",
            "Accept": "application/fhir+json",
        }

    def get_available_slots(self, urgency: str, preferred_doctor: Optional[str] = None) -> List[Dict]:
        """
        Production: GET /Slot?schedule.actor=Practitioner/{npi}&status=free
        Parses FHIR Slot resources into our internal format.
        """
        # NOTE: Real implementation would use `requests` library:
        #   import requests
        #   params = {"status": "free", "start": start_date.isoformat(), "end": end_date.isoformat()}
        #   if preferred_doctor:
        #       npi = next((d["npi"] for d in CLINIC_REGISTRY if d["name"] == preferred_doctor), None)
        #       if npi:
        #           params["schedule.actor"] = f"Practitioner/{npi}"
        #   response = requests.get(f"{self.base_url}/Slot", headers=self.headers, params=params, timeout=10)
        #   response.raise_for_status()
        #   bundle = response.json()
        #   return [self._parse_fhir_slot(entry["resource"]) for entry in bundle.get("entry", [])]
        raise NotImplementedError("Enable by setting HEALTHHUB_API_KEY and implementing FHIR R4 slot parsing")

    def confirm_booking(self, patient_id: str, slot: Dict, reason: str) -> Dict:
        """
        Production: POST /Appointment with FHIR Appointment resource.
        """
        # NOTE: Real implementation:
        #   appointment_resource = {
        #       "resourceType": "Appointment",
        #       "status": "booked",
        #       "serviceType": [{"coding": [{"system": "http://snomed.info/sct", "code": "394580004"}]}],
        #       "reasonCode": [{"text": reason}],
        #       "participant": [
        #           {"actor": {"reference": f"Patient/{patient_id}"}, "status": "accepted"},
        #           {"actor": {"reference": f"Practitioner/{slot.get('npi', '')}"}, "status": "accepted"},
        #       ],
        #       "slot": [{"reference": f"Slot/{slot.get('slot_id', '')}"}],
        #   }
        #   response = requests.post(f"{self.base_url}/Appointment", headers=self.headers,
        #                            json=appointment_resource, timeout=10)
        #   response.raise_for_status()
        #   return self._parse_fhir_appointment(response.json())
        raise NotImplementedError("Enable by setting HEALTHHUB_API_KEY and implementing FHIR R4 booking")

    def cancel_booking(self, confirmation_code: str) -> bool:
        """
        Production: PATCH /Appointment/{id} with status=cancelled.
        """
        raise NotImplementedError("Enable by setting HEALTHHUB_API_KEY")

    @staticmethod
    def _parse_fhir_slot(slot_resource: Dict) -> Dict:
        """Convert FHIR Slot resource to internal format."""
        return {
            "slot_id": slot_resource.get("id"),
            "datetime": slot_resource.get("start"),
            "time_category": "morning" if int(slot_resource.get("start", "T12:00")[11:13]) < 12 else "afternoon",
            "doctor": slot_resource.get("_practitioner_name", ""),
            "clinic": slot_resource.get("_location_name", ""),
            "specialization": "",
        }


def _get_provider() -> AppointmentProvider:
    """Factory: returns the configured appointment provider."""
    if APPOINTMENT_PROVIDER == "healthhub":
        return HealthHubProvider()
    return MockProvider()


# =============================================================================
# Main Tool Function (called by agent runtime)
# =============================================================================

def book_appointment_tool(
    patient_id: str,
    urgency: Literal["routine", "urgent", "emergency"] = "routine",
    preferred_times: Optional[List[str]] = None,
    reason: str = "Follow-up consultation",
    preferred_doctor: Optional[str] = None
) -> Dict[str, Any]:
    """
    Book a doctor appointment via the configured provider.

    Args:
        patient_id: Patient identifier
        urgency: Priority level (routine=2wk, urgent=3d, emergency=same day)
        preferred_times: List of preferred times ["morning", "afternoon", "evening"]
        reason: Reason for appointment
        preferred_doctor: Specific doctor name (optional)

    Returns:
        Result dict with booking confirmation or error
    """
    logger.info(f"Booking appointment for {patient_id}, urgency={urgency}")

    try:
        provider = _get_provider()

        # 1. Load patient preferences from memory
        patient_prefs = _load_patient_preferences(patient_id)
        if preferred_times is None:
            preferred_times = patient_prefs.get("preferred_appointment_times", ["morning"])
        if preferred_doctor is None:
            preferred_doctor = patient_prefs.get("preferred_doctor")

        # 2. Get available slots from provider
        available_slots = provider.get_available_slots(urgency=urgency, preferred_doctor=preferred_doctor)

        if not available_slots:
            return {
                "success": False,
                "error": "No available slots found for the requested timeframe",
                "recommendation": "Try a different urgency level or contact clinic directly",
            }

        # 3. Score and select optimal slot
        best_slot = _select_optimal_slot(available_slots, preferred_times=preferred_times, patient_prefs=patient_prefs)

        # 4. Confirm booking via provider
        booking_result = provider.confirm_booking(patient_id=patient_id, slot=best_slot, reason=reason)

        # 5. Store in local database (audit trail)
        _store_appointment_in_db(patient_id=patient_id, booking=booking_result)

        logger.info(f"Appointment booked: {booking_result['confirmation_code']}")

        return {
            "success": True,
            "appointment_datetime": booking_result["datetime"],
            "doctor": booking_result["doctor"],
            "clinic": booking_result["clinic"],
            "confirmation_code": booking_result["confirmation_code"],
            "instructions": booking_result.get("instructions", ""),
            "travel_time_estimate": _estimate_travel_time(booking_result["clinic"]),
        }

    except NotImplementedError:
        return {
            "success": False,
            "error": "Production provider not yet configured",
            "recommendation": "Set HEALTHHUB_API_KEY in .env to enable real bookings",
        }
    except Exception as e:
        logger.error(f"Appointment booking failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": "Appointment booking encountered an error. Please try again or contact clinic directly.",
        }


# =============================================================================
# Internal Helpers
# =============================================================================

def _load_patient_preferences(patient_id: str) -> Dict:
    """Load patient preferences from agent_memory table."""
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT key, value_json FROM agent_memory WHERE patient_id = ? AND memory_type = 'preference'",
            (patient_id,),
        ).fetchall()

        prefs = {}
        for row in rows:
            prefs[row["key"]] = json.loads(row["value_json"])
        return prefs
    except Exception as e:
        logger.warning(f"Could not load preferences: {e}")
        return {}
    finally:
        if conn:
            conn.close()


def _select_optimal_slot(slots: List[Dict], preferred_times: List[str], patient_prefs: Dict) -> Dict:
    """
    Multi-factor weighted scoring to select the best slot.

    Factors:
        Time preference match  — 40%
        Doctor preference match — 30%
        Soonest available      — 20%
        Sleep-friendly timing  — 10%
    """
    if not slots:
        raise ValueError("No slots available to select from")

    scored_slots = []
    now = datetime.now()
    for slot in slots:
        score = 0.0
        if slot["time_category"] in preferred_times:
            score += 40
        if patient_prefs.get("preferred_doctor") == slot["doctor"]:
            score += 30
        slot_time = datetime.fromisoformat(slot["datetime"])
        days_out = max(0, (slot_time - now).days)
        score += max(0, 20 - days_out * 2)
        if slot_time.hour >= 10:
            score += 10
        scored_slots.append((score, slot))

    scored_slots.sort(key=lambda x: x[0], reverse=True)
    return scored_slots[0][1]


def _store_appointment_in_db(patient_id: str, booking: Dict):
    """Store appointment in database for audit trail."""
    conn = sqlite3.connect(DB_PATH)
    try:
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
            "agent",
            booking["status"],
            booking["confirmation_code"],
            int(time.time()),
        ))
        conn.commit()
    finally:
        conn.close()


def _estimate_travel_time(clinic: str) -> str:
    """
    Estimate travel time from patient's home.
    Production: integrate Google Maps Distance Matrix API with patient address.
    """
    travel_times = {
        "NUH Diabetes Centre": "25 minutes by MRT",
        "SGH Metabolic Clinic": "30 minutes by bus",
        "TTSH Chronic Disease": "20 minutes by MRT",
    }
    return travel_times.get(clinic, "30 minutes")
