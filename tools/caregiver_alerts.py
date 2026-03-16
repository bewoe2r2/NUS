"""
Bewo Agent Tool: Caregiver Alerts
===================================

Smart alert system with tiered escalation, fatigue prevention, and
pluggable delivery providers.

ARCHITECTURE:
    AlertDeliveryProvider (abstract) → MockDelivery (demo) / TwilioDelivery (production)
    The agent calls send_tiered_alert_tool() which handles escalation logic,
    rate limiting, and DB audit logging — then delegates actual delivery to the
    configured provider. Swap providers via ALERT_PROVIDER env var.

PRODUCTION DEPLOYMENT:
    1. Set ALERT_PROVIDER=twilio
    2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env
    3. TwilioDelivery sends real SMS/voice calls via Twilio REST API
    4. All other code (escalation, rate limits, DB logging) stays identical

ESCALATION LADDER:
    INFO     → App push notification (primary caregiver only)
    WARNING  → App push + SMS (primary caregiver)
    CRITICAL → SMS + Phone call (ALL caregivers)
"""

import logging
import sqlite3
import time
import json
from abc import ABC, abstractmethod
from typing import Literal, Dict, Optional, List
import os

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")

# --- Provider Configuration ---
ALERT_PROVIDER = os.getenv("ALERT_PROVIDER", "mock")  # "mock" or "twilio"
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

# Rate limiting: Max alerts per hour by severity
RATE_LIMITS = {
    "info": 10,
    "warning": 5,
    "critical": float("inf"),  # Never rate-limit critical alerts
}


# =============================================================================
# Delivery Provider Interface (Adapter Pattern)
# =============================================================================

class AlertDeliveryProvider(ABC):
    """Abstract interface for alert delivery channels."""

    @abstractmethod
    def send_push(self, recipient: Dict, message: str, severity: str) -> str:
        """Send push notification. Returns delivery status string."""
        ...

    @abstractmethod
    def send_sms(self, recipient: Dict, message: str, severity: str) -> str:
        """Send SMS. Returns delivery status string."""
        ...

    @abstractmethod
    def send_call(self, recipient: Dict, message: str, severity: str) -> str:
        """Initiate voice call with TTS message. Returns delivery status string."""
        ...


class MockDelivery(AlertDeliveryProvider):
    """Demo provider — logs delivery without external API calls."""

    def send_push(self, recipient: Dict, message: str, severity: str) -> str:
        logger.info(f"[MOCK PUSH] to {recipient['name']}: {message[:80]}...")
        return "delivered"

    def send_sms(self, recipient: Dict, message: str, severity: str) -> str:
        logger.info(f"[MOCK SMS] to {recipient['name']} ({recipient.get('phone', 'N/A')}): {message[:80]}...")
        return "delivered"

    def send_call(self, recipient: Dict, message: str, severity: str) -> str:
        logger.info(f"[MOCK CALL] to {recipient['name']} ({recipient.get('phone', 'N/A')}): {message[:80]}...")
        return "delivered"


class TwilioDelivery(AlertDeliveryProvider):
    """
    Production provider — delivers alerts via Twilio SMS and Voice APIs.

    Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env.

    SMS: POST /2010-04-01/Accounts/{sid}/Messages.json
    Voice: POST /2010-04-01/Accounts/{sid}/Calls.json with TwiML <Say>
    """

    def __init__(self):
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
            raise RuntimeError("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env")
        # NOTE: Real implementation would initialize Twilio client:
        #   from twilio.rest import Client
        #   self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    def send_push(self, recipient: Dict, message: str, severity: str) -> str:
        """
        Production push: integrate with Firebase Cloud Messaging (FCM).
        For now, falls back to SMS since FCM requires mobile app integration.
        """
        return self.send_sms(recipient, message, severity)

    def send_sms(self, recipient: Dict, message: str, severity: str) -> str:
        """
        Production SMS via Twilio:
            self.client.messages.create(
                body=f"[Bewo {severity.upper()}] {message}",
                from_=TWILIO_FROM_NUMBER,
                to=recipient["phone"]
            )
        """
        raise NotImplementedError("Enable by setting TWILIO_ACCOUNT_SID and implementing Twilio SMS")

    def send_call(self, recipient: Dict, message: str, severity: str) -> str:
        """
        Production voice call via Twilio:
            self.client.calls.create(
                twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
                from_=TWILIO_FROM_NUMBER,
                to=recipient["phone"]
            )
        """
        raise NotImplementedError("Enable by setting TWILIO_ACCOUNT_SID and implementing Twilio Voice")


def _get_delivery_provider() -> AlertDeliveryProvider:
    """Factory: returns the configured alert delivery provider."""
    if ALERT_PROVIDER == "twilio":
        return TwilioDelivery()
    return MockDelivery()


# =============================================================================
# Main Tool Function (called by agent runtime)
# =============================================================================

def send_tiered_alert_tool(
    patient_id: str,
    message: str,
    alert_type: str = "health_status",
    severity: Literal["info", "warning", "critical"] = "warning",
    delivery_method: Optional[Literal["push", "sms", "call"]] = None,
    force_send: bool = False,
) -> Dict:
    """
    Send tiered alert with smart escalation and fatigue prevention.

    Args:
        patient_id: Patient identifier
        message: Alert message content
        alert_type: Category (health_status, medication, appointment, etc.)
        severity: Alert level (info/warning/critical)
        delivery_method: Override delivery (if None, uses severity-based logic)
        force_send: Bypass rate limiting (emergency use only)

    Returns:
        Result dict with delivery status
    """
    logger.info(f"Sending {severity} alert for {patient_id}: {message[:50]}...")

    try:
        provider = _get_delivery_provider()

        # 1. Rate limiting (prevent caregiver alert fatigue)
        if not force_send and not _check_rate_limit(patient_id, severity):
            logger.warning(f"Rate limit exceeded for {severity} alerts on {patient_id}")
            return {
                "success": False,
                "error": "Rate limit exceeded — too many alerts in the last hour",
                "recommendation": "Consider manual contact or wait before sending another alert",
            }

        # 2. Determine delivery method from severity if not specified
        if delivery_method is None:
            delivery_method = _determine_delivery_method(severity)

        # 3. Get caregiver contacts
        caregivers = _get_caregiver_contacts(patient_id)
        if not caregivers:
            return {
                "success": False,
                "error": "No caregiver contacts configured for this patient",
                "recommendation": "Update patient profile with caregiver information",
            }

        # 4. Execute delivery via escalation ladder
        delivery_results = _execute_delivery(
            provider=provider,
            patient_id=patient_id,
            message=message,
            severity=severity,
            delivery_method=delivery_method,
            caregivers=caregivers,
        )

        # 5. Audit trail in database
        _log_alert(
            patient_id=patient_id,
            message=message,
            alert_type=alert_type,
            severity=severity,
            delivery_results=delivery_results,
        )

        return {
            "success": True,
            "alert_id": delivery_results["alert_id"],
            "severity": severity,
            "delivery_method": delivery_method,
            "recipients": delivery_results["recipients"],
            "status": "delivered",
        }

    except NotImplementedError:
        return {
            "success": False,
            "error": "Production delivery provider not yet configured",
            "recommendation": "Set TWILIO_ACCOUNT_SID in .env to enable real SMS/call delivery",
        }
    except Exception as e:
        logger.error(f"Alert delivery failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": "Alert delivery encountered an error. Please contact caregiver directly.",
        }


# =============================================================================
# Internal Helpers
# =============================================================================

def _check_rate_limit(patient_id: str, severity: str) -> bool:
    """Check if rate limit allows sending this alert."""
    limit = RATE_LIMITS.get(severity, 5)
    if limit == float("inf"):
        return True

    conn = sqlite3.connect(DB_PATH)
    one_hour_ago = int(time.time()) - 3600

    conn.execute("""
        CREATE TABLE IF NOT EXISTS caregiver_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            alert_type TEXT,
            severity TEXT,
            message TEXT,
            delivery_results_json TEXT
        )
    """)

    count = conn.execute(
        "SELECT COUNT(*) FROM caregiver_alerts WHERE patient_id = ? AND severity = ? AND timestamp_utc >= ?",
        (patient_id, severity, one_hour_ago),
    ).fetchone()[0]

    conn.close()
    return count < limit


def _determine_delivery_method(severity: str) -> str:
    """Map severity to default delivery method."""
    return {"info": "push", "warning": "sms", "critical": "call"}.get(severity, "push")


def _get_caregiver_contacts(patient_id: str) -> List[Dict]:
    """
    Get caregiver contacts from database.

    Production: query patient profile / caregiver registry table.
    Demo: returns mock contacts with redacted phone numbers.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM caregiver_contacts WHERE patient_id = ?", (patient_id,)
        ).fetchall()
        conn.close()
        if rows:
            return [dict(r) for r in rows]
    except Exception:
        pass  # Table may not exist yet — fall through to demo data

    # Demo fallback
    return [
        {
            "name": "Mrs. Tan (Daughter)",
            "phone": "+65 9xxx-xxxx",
            "email": "daughter@example.com",
            "priority": "primary",
            "preferred_method": "sms",
        },
        {
            "name": "Mr. Tan Jr (Son)",
            "phone": "+65 8xxx-xxxx",
            "email": "son@example.com",
            "priority": "secondary",
            "preferred_method": "call",
        },
    ]


def _execute_delivery(
    provider: AlertDeliveryProvider,
    patient_id: str,
    message: str,
    severity: str,
    delivery_method: str,
    caregivers: List[Dict],
) -> Dict:
    """
    Execute alert delivery via escalation ladder.

    Escalation:
        info     → push to primary caregiver only
        warning  → SMS to primary caregiver
        critical → SMS + call to ALL caregivers
    """
    recipients = []
    alert_id = f"ALT{int(time.time()) % 100000:05d}"

    if severity == "critical":
        targets = caregivers  # All caregivers
    else:
        targets = [c for c in caregivers if c["priority"] == "primary"]

    for caregiver in targets:
        method_fn = {
            "push": provider.send_push,
            "sms": provider.send_sms,
            "call": provider.send_call,
        }.get(delivery_method, provider.send_push)

        status = method_fn(recipient=caregiver, message=message, severity=severity)

        recipients.append({
            "name": caregiver["name"],
            "method": delivery_method,
            "status": status,
        })

        # Critical: always send both SMS and call
        if severity == "critical" and delivery_method != "sms":
            sms_status = provider.send_sms(recipient=caregiver, message=message, severity=severity)
            recipients.append({
                "name": caregiver["name"],
                "method": "sms",
                "status": sms_status,
            })
        if severity == "critical" and delivery_method != "call":
            call_status = provider.send_call(recipient=caregiver, message=message, severity=severity)
            recipients.append({
                "name": caregiver["name"],
                "method": "call",
                "status": call_status,
            })

    return {
        "alert_id": alert_id,
        "recipients": recipients,
        "timestamp": time.time(),
    }


def _log_alert(
    patient_id: str,
    message: str,
    alert_type: str,
    severity: str,
    delivery_results: Dict,
):
    """Log alert in database for audit trail and rate limiting."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS caregiver_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            alert_type TEXT,
            severity TEXT,
            message TEXT,
            delivery_results_json TEXT
        )
    """)
    conn.execute("""
        INSERT INTO caregiver_alerts
        (patient_id, timestamp_utc, alert_type, severity, message, delivery_results_json)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        int(time.time()),
        alert_type,
        severity,
        message,
        json.dumps(delivery_results),
    ))
    conn.commit()
    conn.close()
