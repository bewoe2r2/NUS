"""
NEXUS Agent Tool: Caregiver Alerts
===================================

Smart alert system with tiered escalation and fatigue prevention.

FEATURES:
- Three-tier severity system (info/warning/critical)
- Multi-channel delivery (push/SMS/call)
- Alert fatigue prevention with rate limiting
- Smart escalation ladder
- Delivery confirmation tracking

ESCALATION LADDER:
INFO     → App notification only
WARNING  → App + SMS to primary caregiver
CRITICAL → All above + Phone call + Secondary caregiver
"""

import logging
import sqlite3
import time
import json
from typing import Literal, Dict, Optional, List

logger = logging.getLogger(__name__)

DB_PATH = "nexus_health.db"

# Rate limiting: Max alerts per hour by severity
RATE_LIMITS = {
    "info": 10,
    "warning": 5,
    "critical": float('inf')  # No limit for critical
}


def send_tiered_alert_tool(
    patient_id: str,
    message: str,
    alert_type: str = "health_status",
    severity: Literal["info", "warning", "critical"] = "warning",
    delivery_method: Optional[Literal["push", "sms", "call"]] = None,
    force_send: bool = False
) -> Dict:
    """
    Send tiered alert with smart escalation.
    
    Args:
        patient_id: Patient identifier
        message: Alert message content
        alert_type: Category (health_status, medication, appointment, etc.)
        severity: Alert level (info/warning/critical)
        delivery_method: Override delivery (if None, uses severity-based logic)
        force_send: Bypass rate limiting (emergency use only)
    
    Returns:
        Result dict with delivery status
    
    Example:
        result = send_tiered_alert_tool(
            patient_id="P001",
            message="Glucose reading 16.2 mmol/L for 4+ hours",
            alert_type="health_status",
            severity="critical"
        )
    """
    logger.info(f"Sending {severity} alert for {patient_id}: {message[:50]}...")
    
    try:
        # 1. Check rate limiting (prevent alert fatigue)
        if not force_send and not _check_rate_limit(patient_id, severity):
            logger.warning(f"Rate limit exceeded for {severity} alerts")
            return {
                "success": False,
                "error": "Rate limit exceeded",
                "recommendation": "Too many alerts sent recently. Consider manual contact."
            }
        
        # 2. Determine delivery method based on severity
        if delivery_method is None:
            delivery_method = _determine_delivery_method(severity)
        
        # 3. Get caregiver contacts
        caregivers = _get_caregiver_contacts(patient_id)
        
        if not caregivers:
            logger.error(f"No caregivers found for patient {patient_id}")
            return {
                "success": False,
                "error": "No caregiver contacts configured",
                "recommendation": "Update patient profile with caregiver information"
            }
        
        # 4. Send alerts based on escalation ladder
        delivery_results = _execute_delivery(
            patient_id=patient_id,
            message=message,
            severity=severity,
            delivery_method=delivery_method,
            caregivers=caregivers
        )
        
        # 5. Log alert in database
        _log_alert(
            patient_id=patient_id,
            message=message,
            alert_type=alert_type,
            severity=severity,
            delivery_results=delivery_results
        )
        
        logger.info(f"Alert sent successfully: {delivery_results}")
        
        return {
            "success": True,
            "alert_id": delivery_results["alert_id"],
            "severity": severity,
            "delivery_method": delivery_method,
            "recipients": delivery_results["recipients"],
            "status": "delivered"
        }
        
    except Exception as e:
        logger.error(f"Alert sending failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def _check_rate_limit(patient_id: str, severity: str) -> bool:
    """Check if rate limit allows sending this alert"""
    limit = RATE_LIMITS.get(severity, 5)
    
    if limit == float('inf'):
        return True  # No limit for critical
    
    # Count alerts in last hour
    conn = sqlite3.connect(DB_PATH)
    one_hour_ago = int(time.time()) - 3600
    
    # Create table if doesn't exist
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
    
    count = conn.execute("""
        SELECT COUNT(*) FROM caregiver_alerts
        WHERE patient_id = ? AND severity = ? AND timestamp_utc >= ?
    """, (patient_id, severity, one_hour_ago)).fetchone()[0]
    
    conn.close()
    
    return count < limit


def _determine_delivery_method(severity: str) -> str:
    """Map severity to delivery method"""
    mapping = {
        "info": "push",
        "warning": "sms",
        "critical": "call"
    }
    return mapping.get(severity, "push")


def _get_caregiver_contacts(patient_id: str) -> List[Dict]:
    """Get caregiver contact information from database"""
    # Mock data for demo (in production, fetch from patient profile)
    return [
        {
            "name": "Mrs. Tan (Daughter)",
            "phone": "+65 9xxx-xxxx",
            "email": "daughter@example.com",
            "priority": "primary",
            "preferred_method": "sms"
        },
        {
            "name": "Mr. Tan Jr (Son)",
            "phone": "+65 8xxx-xxxx",
            "email": "son@example.com",
            "priority": "secondary",
            "preferred_method": "call"
        }
    ]


def _execute_delivery(
    patient_id: str,
    message: str,
    severity: str,
    delivery_method: str,
    caregivers: List[Dict]
) -> Dict:
    """
    Execute alert delivery via appropriate channels.
    
    ESCALATION LOGIC:
    - info: Primary caregiver, push notification
    - warning: Primary caregiver, SMS
    - critical: All caregivers, SMS + Call
    """
    recipients = []
    alert_id = f"ALT{int(time.time()) % 100000:05d}"
    
    # Determine who to notify based on severity
    if severity == "info":
        targets = [c for c in caregivers if c["priority"] == "primary"]
    elif severity == "warning":
        targets = [c for c in caregivers if c["priority"] == "primary"]
    else:  # critical
        targets = caregivers  # All caregivers
    
    for caregiver in targets:
        # Mock delivery (in production, integrate with Twilio, etc.)
        delivery_status = _send_notification_mock(
            recipient=caregiver,
            message=message,
            method=delivery_method,
            severity=severity
        )
        
        recipients.append({
            "name": caregiver["name"],
            "method": delivery_method,
            "status": delivery_status
        })
    
    return {
        "alert_id": alert_id,
        "recipients": recipients,
        "timestamp": time.time()
    }


def _send_notification_mock(
    recipient: Dict,
    message: str,
    method: str,
    severity: str
) -> str:
    """
    Mock notification sending (replace with real integrations in production).
    
    Production integrations:
    - Push: Firebase Cloud Messaging (FCM)
    - SMS: Twilio API
    - Call: Twilio Voice API with text-to-speech
    """
    logger.info(f"[MOCK {method.upper()}] to {recipient['name']}: {message[:50]}...")
    
    # Simulate delivery confirmation
    return "delivered"


def _log_alert(
    patient_id: str,
    message: str,
    alert_type: str,
    severity: str,
    delivery_results: Dict
):
    """Log alert in database for audit trail"""
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
        json.dumps(delivery_results)
    ))
    
    conn.commit()
    conn.close()


# Register with agent runtime
def register_with_runtime():
    """Register this tool with the AgentRuntime"""
    from agent_runtime import register_tool
    register_tool("send_tiered_alert")(send_tiered_alert_tool)
