"""
BEWO Agent Runtime v1.0
========================
The orchestration brain that connects Gemini AI to real tool execution.

Architecture:
  Patient data → HMM Engine (full state) → Agent Runtime → Gemini (function calling)
                                                         → Tool Execution
                                                         → Action Persistence

Every decision uses ALL available HMM intelligence:
  - Current state + confidence + state probabilities
  - Monte Carlo crisis prediction (2000 paths, 48h)
  - Counterfactual "what-if" scenarios (4 interventions)
  - Top contributing factors with weights
  - State change detection + trend analysis
  - Survival curve projections
  - Full contextual data (10 data sources)

Privacy: Blind booking sends only urgency level + clinical category
         to external APIs. Patient identity revealed only at check-in.
"""

import json
import time
import logging
import sqlite3
import os
import concurrent.futures
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger("AgentRuntime")

# DB path relative to project root
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "nexus_health.db")


def _get_db():
    """Get database connection with WAL mode, foreign keys, and row_factory."""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


# ============================================================================
# PDPA-COMPLIANT DATA DE-IDENTIFICATION
# ============================================================================
# Patient PII is NEVER sent to external AI APIs (Gemini, SEA-LION).
# Only de-identified clinical data is transmitted. Names, NRIC, addresses,
# phone numbers are stripped and replaced with anonymous identifiers.

def _deidentify_profile_for_llm(patient_profile: Dict) -> Dict:
    """
    Create a de-identified copy of patient profile for LLM prompts.
    Strips: name, NRIC, address, phone, email, emergency contacts.
    Keeps: age, conditions, medications (clinically necessary for reasoning).
    PDPA Singapore compliant — no personal identifiers leave the system.
    """
    safe_profile = {
        "id": patient_profile.get("id", "UNKNOWN"),
        "age": patient_profile.get("age", 67),
        "conditions": patient_profile.get("conditions", "Type 2 Diabetes"),
        "medications": patient_profile.get("medications", "Metformin"),
    }
    # Explicitly exclude PII fields
    # name, display_name, nric, address, phone, email, emergency_contact
    # are NEVER included in LLM-bound data
    return safe_profile

def _get_safe_patient_label(patient_profile: Dict) -> str:
    """Return a non-identifying label for LLM context. e.g. 'Patient P001 (72yo)'"""
    pid = patient_profile.get("id", "UNKNOWN")
    age = patient_profile.get("age", 67)
    return f"Patient {pid} ({age}yo)"


# ============================================================================
# TOOL REGISTRY
# ============================================================================

TOOL_DEFINITIONS = [
    {
        "name": "book_appointment",
        "description": "Book a medical appointment at a Singapore polyclinic or hospital. Uses blind booking — only sends urgency and clinical category, never patient identity. Patient identity revealed only at check-in.",
        "parameters": {
            "urgency": "routine | urgent | emergency",
            "reason": "Clinical reason for the visit",
            "preferred_times": "List of preferred slots: morning, afternoon, evening",
            "preferred_doctor": "Optional doctor name"
        }
    },
    {
        "name": "send_caregiver_alert",
        "description": "Send alert to patient's family caregivers via push/SMS/call. Three-tier escalation: info (push only), warning (SMS to primary), critical (SMS+call to all caregivers). Rate-limited to prevent alert fatigue.",
        "parameters": {
            "message": "Alert message content",
            "severity": "info | warning | critical",
            "alert_type": "health_status | medication | appointment | fall_risk | emergency"
        }
    },
    {
        "name": "calculate_counterfactual",
        "description": "Run HMM-powered 'what-if' simulation. Shows patient what happens if they take a specific action (take medication, reduce carbs, increase steps). Uses Bayesian updates on the Hidden Markov Model.",
        "parameters": {
            "intervention": "take_medication | adjust_carbs | increase_activity",
            "intervention_params": "Dict with intervention-specific params (e.g., {medication: 'Metformin', dose: '500mg'} or {carb_reduction: 30} or {additional_steps: 3000})",
            "horizon_hours": "How far to project (default 24)"
        }
    },
    {
        "name": "suggest_medication_adjustment",
        "description": "Generate medication adjustment recommendation for DOCTOR REVIEW. Never auto-adjusts medications. Analyzes glucose patterns + adherence to suggest dose changes or behavioral interventions.",
        "parameters": {
            "current_state": "Current HMM state",
            "hmm_factors": "Contributing factors from HMM inference"
        }
    },
    {
        "name": "set_reminder",
        "description": "Schedule a reminder for the patient. Medication reminders, glucose checks, exercise prompts, hydration, or appointment reminders.",
        "parameters": {
            "reminder_time": "HH:MM format",
            "message": "Reminder message",
            "reminder_type": "medication | glucose_check | exercise | hydration | appointment | general",
            "repeat_type": "once | daily | weekly"
        }
    },
    {
        "name": "alert_nurse",
        "description": "Send SBAR-formatted alert to assigned nurse. Includes anonymized clinical context. Use for state changes, deterioration, or when patient needs clinical review.",
        "parameters": {
            "priority": "low | medium | high | critical",
            "reason": "Clinical reason for alert",
            "include_sbar": "Whether to generate and attach SBAR report (default true)"
        }
    },
    {
        "name": "alert_family",
        "description": "Notify family caregiver with patient-approved health update. Can include or exclude specific metrics.",
        "parameters": {
            "message": "Message to family member",
            "include_metrics": "Whether to include health numbers (default false)"
        }
    },
    {
        "name": "award_voucher_bonus",
        "description": "Give bonus voucher credit for positive health behavior. Reinforces good habits through loss-aversion gamification. Max $5 bonus per award.",
        "parameters": {
            "amount": "Dollar amount (1-5)",
            "reason": "What the patient did well"
        }
    },
    {
        "name": "request_medication_video",
        "description": "Ask patient to record a short video of taking their medication. Gentle verification for low-adherence patients. Video sent to nurse for verification.",
        "parameters": {
            "medication": "Medication name",
            "gentle": "Whether to use gentle/encouraging framing (default true)"
        }
    },
    {
        "name": "suggest_activity",
        "description": "Recommend a specific physical or wellness activity based on current health state, time of day, and patient capabilities.",
        "parameters": {
            "activity": "walk | stretch | tai_chi | rest | hydrate | breathing | social_call",
            "duration_minutes": "Suggested duration",
            "reason": "Why this activity helps right now"
        }
    },
    {
        "name": "escalate_to_doctor",
        "description": "Flag case for URGENT doctor review. Use only for crisis states, safety concerns, or when clinical intervention is clearly needed. Includes full metrics snapshot.",
        "parameters": {
            "reason": "Clinical reason for escalation",
            "metrics_snapshot": "Current health metrics dict"
        }
    },
    {
        "name": "recommend_food",
        "description": "Suggest specific food choices based on current glucose, time of day, and detected food-glucose patterns. Culturally appropriate for Singapore elderly (hawker center options, kopitiam choices).",
        "parameters": {
            "meal_type": "breakfast | lunch | dinner | snack",
            "current_glucose": "Current glucose in mmol/L",
            "recommendation": "Specific food suggestion with portion guidance",
            "avoid": "Foods to avoid based on detected patterns"
        }
    },
    {
        "name": "schedule_proactive_checkin",
        "description": "Schedule an AI-initiated check-in with the patient. Proactive outreach when risk is rising or patient hasn't logged data recently.",
        "parameters": {
            "checkin_time": "HH:MM format",
            "reason": "Why this check-in is needed",
            "checkin_type": "wellness | medication_reminder | risk_rising | inactivity | mood"
        }
    },
    {
        "name": "celebrate_streak",
        "description": "Celebrate a patient's streak milestone (3-day, 7-day, 14-day, 30-day). Gives voucher bonus + encouraging message. Use when streak reaches a milestone.",
        "parameters": {
            "streak_type": "medication | glucose_logging | exercise | app_login",
            "streak_days": "Number of consecutive days",
            "bonus_amount": "Voucher bonus to award (1-5)"
        }
    },
    {
        "name": "generate_weekly_report",
        "description": "Generate and send the patient's weekly health summary. Includes glucose trends, activity, streaks, achievements, and overall grade. Can also send to caregiver.",
        "parameters": {
            "send_to_caregiver": "Whether to also send summary to caregiver (default true)",
            "include_details": "Whether to include detailed metrics (default true)"
        }
    },
    {
        "name": "adjust_nudge_schedule",
        "description": "Adjust when nudges are sent based on patient's response patterns. Shifts reminders to times when patient is most responsive.",
        "parameters": {
            "new_times": "List of optimal hours [9, 14, 19]",
            "reason": "Why schedule is being adjusted"
        }
    },
    {
        "name": "generate_clinician_summary",
        "description": "Generate structured clinician intelligence briefing with SBAR report, HMM state trajectory, Merlion glucose forecast, ranked risk factors, recent agent interventions and their outcomes, and recommended clinical actions. Use when clinician needs a comprehensive patient update.",
        "parameters": {
            "period_days": "Number of days to cover (default 7)"
        }
    },
    {
        "name": "check_drug_interactions",
        "description": "Check drug interactions between patient's current medications and an optional proposed new medication. Returns severity-ranked interaction list (CONTRAINDICATED/MAJOR/MODERATE/MINOR) with pharmacological mechanisms and clinical recommendations. MUST be called before any medication-related advice.",
        "parameters": {
            "proposed_medication": "Optional: name of medication to check against current meds",
            "check_all": "Whether to check all current medication pairs (default true)"
        }
    }
]


def _get_tool_descriptions_for_prompt() -> str:
    """Format tool definitions for the Gemini system prompt."""
    lines = []
    for i, tool in enumerate(TOOL_DEFINITIONS, 1):
        params_str = json.dumps(tool["parameters"], indent=6)
        lines.append(f"""  {i}. {tool["name"]}
     Description: {tool["description"]}
     Parameters: {params_str}""")
    return "\n\n".join(lines)


# ============================================================================
# TOOL EXECUTION
# ============================================================================

def execute_tool(tool_name: str, tool_args: Dict, patient_id: str, patient_profile: Dict) -> Dict:
    """
    Execute a tool by name with given arguments.
    Returns result dict with success/failure status.
    """
    conn = _get_db()
    now = int(time.time())

    try:
        if tool_name == "book_appointment":
            return _exec_book_appointment(tool_args, patient_id, conn, now)

        elif tool_name == "send_caregiver_alert":
            return _exec_caregiver_alert(tool_args, patient_id, conn, now)

        elif tool_name == "calculate_counterfactual":
            return _exec_counterfactual(tool_args, patient_id)

        elif tool_name == "suggest_medication_adjustment":
            return _exec_medication_suggestion(tool_args, patient_id)

        elif tool_name == "set_reminder":
            return _exec_set_reminder(tool_args, patient_id, conn, now)

        elif tool_name == "alert_nurse":
            return _exec_alert_nurse(tool_args, patient_id, conn, now)

        elif tool_name == "alert_family":
            return _exec_alert_family(tool_args, patient_id, conn, now)

        elif tool_name == "award_voucher_bonus":
            return _exec_award_voucher(tool_args, patient_id, conn, now)

        elif tool_name == "request_medication_video":
            return _exec_request_med_video(tool_args, patient_id, conn, now)

        elif tool_name == "suggest_activity":
            return _exec_suggest_activity(tool_args, patient_id, conn, now)

        elif tool_name == "escalate_to_doctor":
            return _exec_escalate_doctor(tool_args, patient_id, conn, now)

        elif tool_name == "recommend_food":
            return _exec_recommend_food(tool_args, patient_id, conn, now)

        elif tool_name == "schedule_proactive_checkin":
            return _exec_schedule_checkin(tool_args, patient_id, conn, now)

        elif tool_name == "celebrate_streak":
            return _exec_celebrate_streak(tool_args, patient_id, conn, now)

        elif tool_name == "generate_weekly_report":
            return _exec_weekly_report(tool_args, patient_id, patient_profile, conn, now)

        elif tool_name == "adjust_nudge_schedule":
            return _exec_adjust_nudge_schedule(tool_args, patient_id, conn, now)

        elif tool_name == "generate_clinician_summary":
            return _exec_clinician_summary(tool_args, patient_id, conn, now)

        elif tool_name == "check_drug_interactions":
            return _exec_check_drug_interactions(tool_args, patient_id, patient_profile, conn, now)

        else:
            return {"success": False, "error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        logger.error(f"Tool execution failed [{tool_name}]: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


def _exec_book_appointment(args, patient_id, conn, now):
    """Blind booking: sends only urgency + clinical category, never patient ID."""
    try:
        from appointment_booking import book_appointment_tool
    except ModuleNotFoundError:
        from tools.appointment_booking import book_appointment_tool
    result = book_appointment_tool(
        patient_id=patient_id,
        urgency=args.get("urgency", "routine"),
        preferred_times=args.get("preferred_times", ["morning"]),
        reason=args.get("reason", "Follow-up consultation"),
        preferred_doctor=args.get("preferred_doctor")
    )
    # Also store in appointment_requests table for nurse dashboard
    conn.execute("""
        INSERT INTO appointment_requests
        (user_id, timestamp_utc, appointment_type, urgency, reason, status)
        VALUES (?, ?, 'clinic', ?, ?, ?)
    """, (patient_id, now, args.get("urgency", "routine"),
          args.get("reason", ""), "booked" if result.get("success") else "failed"))
    conn.commit()
    return result


def _exec_caregiver_alert(args, patient_id, conn, now):
    """Three-tier alert with rate limiting and escalation."""
    try:
        from caregiver_alerts import send_tiered_alert_tool
    except ModuleNotFoundError:
        from tools.caregiver_alerts import send_tiered_alert_tool
    result = send_tiered_alert_tool(
        patient_id=patient_id,
        message=args.get("message", "Health update"),
        alert_type=args.get("alert_type", "health_status"),
        severity=args.get("severity", "warning")
    )
    return result


def _exec_counterfactual(args, patient_id):
    """Run HMM what-if simulation."""
    try:
        from clinical_interventions import calculate_counterfactual_tool
    except ModuleNotFoundError:
        from tools.clinical_interventions import calculate_counterfactual_tool
    params = args.get("intervention_params", {})
    if isinstance(params, str):
        try:
            params = json.loads(params)
        except json.JSONDecodeError:
            params = {}
    return calculate_counterfactual_tool(
        patient_id=patient_id,
        intervention=args.get("intervention", "take_medication"),
        intervention_params=params,
        horizon_hours=args.get("horizon_hours", 24)
    )


def _exec_medication_suggestion(args, patient_id):
    """Generate medication recommendation for doctor review."""
    try:
        from clinical_interventions import suggest_medication_adjustment_tool
    except ModuleNotFoundError:
        from tools.clinical_interventions import suggest_medication_adjustment_tool
    factors = args.get("hmm_factors", {})
    if isinstance(factors, str):
        try:
            factors = json.loads(factors)
        except json.JSONDecodeError:
            factors = {}
    return suggest_medication_adjustment_tool(
        patient_id=patient_id,
        current_state=args.get("current_state", "STABLE"),
        hmm_factors=factors
    )


def _exec_set_reminder(args, patient_id, conn, now):
    # Try with reminder_type column first, fall back to without it
    try:
        conn.execute("""
            INSERT INTO reminders (user_id, reminder_time, message, reminder_type, repeat_type, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        """, (patient_id, args.get("reminder_time", "08:00"),
              args.get("message", "Health reminder"),
              args.get("reminder_type", "general"),
              args.get("repeat_type", "once"), now))
    except sqlite3.OperationalError:
        # Older schema without reminder_type — add column then retry
        try:
            conn.execute("ALTER TABLE reminders ADD COLUMN reminder_type TEXT DEFAULT 'general'")
            conn.commit()
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("""
                INSERT INTO reminders (user_id, reminder_time, message, reminder_type, repeat_type, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            """, (patient_id, args.get("reminder_time", "08:00"),
                  args.get("message", "Health reminder"),
                  args.get("reminder_type", "general"),
                  args.get("repeat_type", "once"), now))
        except sqlite3.OperationalError:
            # Fallback: insert without reminder_type column
            conn.execute("""
                INSERT INTO reminders (user_id, reminder_time, message, repeat_type, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (patient_id, args.get("reminder_time", "08:00"),
                  args.get("message", "Health reminder"),
                  args.get("repeat_type", "once"), now))
    conn.commit()
    return {"success": True, "reminder_time": args.get("reminder_time"),
            "message": args.get("message")}


def _exec_alert_nurse(args, patient_id, conn, now):
    priority = args.get("priority", "medium")

    # Auto-generate SBAR for medium/high/critical alerts
    sbar_json = None
    if priority in ("medium", "high", "critical"):
        try:
            try:
                from clinical_engine import ClinicalEngine
            except ModuleNotFoundError:
                from core.clinical_engine import ClinicalEngine
            ce = ClinicalEngine(db_path=DB_PATH)
            pipeline_result = ce.execute_pipeline(patient_id)
            if pipeline_result and pipeline_result.get("sbar"):
                sbar_json = json.dumps(pipeline_result["sbar"])
        except Exception as e:
            logger.error(f"SBAR generation failed for nurse alert (patient {patient_id}): {e}")

    # Insert with sbar_json column (ALTER TABLE fallback if column missing)
    try:
        conn.execute("""
            INSERT INTO nurse_alerts (user_id, timestamp_utc, priority, reason, status, sbar_json)
            VALUES (?, ?, ?, ?, 'pending', ?)
        """, (patient_id, now, priority, args.get("reason", ""), sbar_json))
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE nurse_alerts ADD COLUMN sbar_json TEXT")
        except sqlite3.OperationalError:
            pass
        conn.execute("""
            INSERT INTO nurse_alerts (user_id, timestamp_utc, priority, reason, status, sbar_json)
            VALUES (?, ?, ?, ?, 'pending', ?)
        """, (patient_id, now, priority, args.get("reason", ""), sbar_json))

    conn.commit()
    result = {"success": True, "priority": priority, "reason": args.get("reason")}
    if sbar_json:
        result["sbar_attached"] = True
    return result


def _exec_alert_family(args, patient_id, conn, now):
    conn.execute("""
        INSERT INTO family_alerts (user_id, timestamp_utc, message, include_metrics, status)
        VALUES (?, ?, ?, ?, 'pending')
    """, (patient_id, now, args.get("message", ""),
          1 if args.get("include_metrics", False) else 0))
    conn.commit()
    return {"success": True, "message": args.get("message")}


def _exec_award_voucher(args, patient_id, conn, now):
    try:
        amount = min(float(args.get("amount", 1)), 5.0)
    except (ValueError, TypeError):
        amount = 1.0
    cursor = conn.execute("""
        UPDATE voucher_tracker
        SET current_value = CASE WHEN COALESCE(current_value, 0) + ? > 10.0 THEN 10.0
                                 ELSE COALESCE(current_value, 0) + ? END,
            bonus_earned = COALESCE(bonus_earned, 0) + ?
        WHERE user_id = ?
    """, (amount, amount, amount, patient_id))
    if cursor.rowcount == 0:
        # No voucher row exists — insert one
        conn.execute("""
            INSERT INTO voucher_tracker (user_id, week_start_utc, current_value, bonus_earned)
            VALUES (?, ?, ?, ?)
        """, (patient_id, now, min(5.0 + amount, 10.0), amount))
    conn.commit()
    return {"success": True, "amount": amount, "reason": args.get("reason")}


def _exec_request_med_video(args, patient_id, conn, now):
    conn.execute("""
        INSERT INTO medication_video_requests
        (user_id, timestamp_utc, medication_name, status)
        VALUES (?, ?, ?, 'pending')
    """, (patient_id, now, args.get("medication", "medication")))
    conn.commit()
    return {"success": True, "medication": args.get("medication")}


def _exec_suggest_activity(args, patient_id, conn, now):
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'suggest_activity', ?, 'delivered')
    """, (patient_id, now, json.dumps(args)))
    conn.commit()
    return {"success": True, "activity": args.get("activity"),
            "duration": args.get("duration_minutes"),
            "reason": args.get("reason")}


def _exec_escalate_doctor(args, patient_id, conn, now):
    metrics = args.get("metrics_snapshot", {})
    if isinstance(metrics, str):
        try:
            metrics = json.loads(metrics)
        except json.JSONDecodeError:
            pass

    # Auto-generate SBAR for doctor escalations
    sbar_json = None
    try:
        try:
            from clinical_engine import ClinicalEngine
        except ModuleNotFoundError:
            from core.clinical_engine import ClinicalEngine
        ce = ClinicalEngine(db_path=DB_PATH)
        pipeline_result = ce.execute_pipeline(patient_id)
        if pipeline_result and pipeline_result.get("sbar"):
            sbar_json = json.dumps(pipeline_result["sbar"])
    except Exception as e:
        logger.error(f"SBAR generation for doctor escalation failed (patient {patient_id}): {e}")

    try:
        conn.execute("""
            INSERT INTO doctor_escalations
            (user_id, timestamp_utc, reason, metrics_snapshot, status, sbar_json)
            VALUES (?, ?, ?, ?, 'pending', ?)
        """, (patient_id, now, args.get("reason", ""),
              json.dumps(metrics) if isinstance(metrics, dict) else str(metrics),
              sbar_json))
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE doctor_escalations ADD COLUMN sbar_json TEXT")
        except sqlite3.OperationalError:
            pass
        conn.execute("""
            INSERT INTO doctor_escalations
            (user_id, timestamp_utc, reason, metrics_snapshot, status, sbar_json)
            VALUES (?, ?, ?, ?, 'pending', ?)
        """, (patient_id, now, args.get("reason", ""),
              json.dumps(metrics) if isinstance(metrics, dict) else str(metrics),
              sbar_json))

    conn.commit()
    result = {"success": True, "escalated": True, "reason": args.get("reason")}
    if sbar_json:
        result["sbar_attached"] = True
    return result


def _exec_recommend_food(args, patient_id, conn, now):
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'recommend_food', ?, 'delivered')
    """, (patient_id, now, json.dumps(args)))
    conn.commit()
    return {"success": True, "meal_type": args.get("meal_type"),
            "recommendation": args.get("recommendation"),
            "avoid": args.get("avoid")}


def _exec_schedule_checkin(args, patient_id, conn, now):
    checkin_time = args.get("checkin_time", "10:00")
    # Validate time format — accept HH:MM or full ISO datetime, fallback to default
    if checkin_time:
        try:
            if "T" in str(checkin_time) or "-" in str(checkin_time):
                datetime.fromisoformat(str(checkin_time))
            else:
                parts = str(checkin_time).split(":")
                h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    raise ValueError(f"Invalid time: {checkin_time}")
        except (ValueError, IndexError, TypeError):
            logger.warning(f"Invalid checkin_time '{checkin_time}' for {patient_id}, defaulting to 10:00")
            checkin_time = "10:00"
    else:
        checkin_time = "10:00"
    conn.execute("""
        INSERT INTO proactive_checkins
        (patient_id, scheduled_time, checkin_type, reason, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
    """, (patient_id, checkin_time,
          args.get("checkin_type", "wellness"),
          args.get("reason", "Scheduled check-in"), now))
    conn.commit()
    return {"success": True, "checkin_time": checkin_time,
            "checkin_type": args.get("checkin_type")}


def _exec_celebrate_streak(args, patient_id, conn, now):
    """Award bonus for streak milestone and log it."""
    streak_type = args.get("streak_type", "medication")
    streak_days = args.get("streak_days", 3)
    try:
        bonus = min(float(args.get("bonus_amount", 2)), 5.0)
    except (ValueError, TypeError):
        bonus = 2.0

    # Award voucher bonus
    cursor = conn.execute("""
        UPDATE voucher_tracker
        SET current_value = CASE WHEN COALESCE(current_value, 0) + ? > 10.0 THEN 10.0
                                 ELSE COALESCE(current_value, 0) + ? END,
            bonus_earned = COALESCE(bonus_earned, 0) + ?
        WHERE user_id = ?
    """, (bonus, bonus, bonus, patient_id))
    if cursor.rowcount == 0:
        conn.execute("""
            INSERT INTO voucher_tracker (user_id, week_start_utc, current_value, bonus_earned)
            VALUES (?, ?, ?, ?)
        """, (patient_id, now, min(5.0 + bonus, 10.0), bonus))

    # Log the streak milestone
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'streak_milestone', ?, 'delivered')
    """, (patient_id, now, json.dumps({
        "streak_type": streak_type, "days": streak_days, "bonus": bonus
    })))
    conn.commit()
    return {"success": True, "streak_type": streak_type,
            "streak_days": streak_days, "bonus_awarded": bonus}


def _exec_weekly_report(args, patient_id, patient_profile, conn, now):
    """Generate and optionally send weekly report."""
    report = generate_weekly_report(patient_id, patient_profile)

    # Log report generation
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'weekly_report', ?, 'delivered')
    """, (patient_id, now, json.dumps(report)))

    # Send to caregiver if requested
    if args.get("send_to_caregiver", True):
        grade = report.get("overall_grade", "?")
        achievements = report.get("achievements", [])
        summary = f"Weekly Report: Grade {grade}. "
        if achievements:
            summary += "Achievements: " + ", ".join(achievements[:3])
        conn.execute("""
            INSERT INTO family_alerts (user_id, timestamp_utc, message, include_metrics, status)
            VALUES (?, ?, ?, 1, 'pending')
        """, (patient_id, now, summary))

    conn.commit()
    return {"success": True, "report": report}


def _exec_adjust_nudge_schedule(args, patient_id, conn, now):
    """Adjust nudge schedule to optimal times."""
    new_times = args.get("new_times", [9, 14, 19])
    reason = args.get("reason", "")
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'nudge_schedule_adjust', ?, 'delivered')
    """, (patient_id, now, json.dumps({
        "new_times": new_times, "reason": reason
    })))
    # Persist the schedule to agent_memory so it actually takes effect
    try:
        conn.execute("""
            INSERT OR REPLACE INTO agent_memory (patient_id, memory_type, key, value_json, confidence, created_at, updated_at, source)
            VALUES (?, 'preference', 'nudge_schedule', ?, 0.9, ?, ?, 'agent')
        """, (patient_id, json.dumps({"times": new_times, "reason": reason}), now, now))
    except Exception:
        pass
    conn.commit()
    return {"success": True, "new_times": new_times, "reason": reason}


def _exec_clinician_summary(args, patient_id, conn, now):
    """
    Generate structured clinician intelligence briefing.
    Combines SBAR + HMM trajectory + Merlion forecast + recent interventions.
    """
    try:
        period_days = int(args.get("period_days", 7))
    except (ValueError, TypeError):
        period_days = 7
    period_start = now - (period_days * 86400)

    summary = {
        "patient_id": patient_id,
        "period_days": period_days,
        "generated_at": datetime.now().isoformat(),
    }

    # 1. SBAR via ClinicalEngine
    try:
        try:
            from clinical_engine import ClinicalEngine
        except ModuleNotFoundError:
            from core.clinical_engine import ClinicalEngine
        ce = ClinicalEngine(db_path=DB_PATH)
        pipeline_result = ce.execute_pipeline(patient_id)
        if pipeline_result:
            summary["sbar"] = pipeline_result.get("sbar", {})
            summary["clinical_metrics"] = pipeline_result.get("metrics", {})
        else:
            summary["sbar"] = {"error": "Pipeline returned None"}
            summary["clinical_metrics"] = {}
    except Exception as e:
        logger.warning(f"SBAR generation failed: {e}")
        summary["sbar"] = {"error": str(e)}

    # 2. Merlion 45-min forecast
    try:
        try:
            from hmm_engine import HMMEngine
        except ModuleNotFoundError:
            from core.hmm_engine import HMMEngine
        engine = HMMEngine()
        obs = engine.fetch_observations(days=period_days, patient_id=patient_id)
        if obs:
            merlion = _get_merlion_forecast(obs)
            summary["merlion_forecast"] = merlion
        else:
            summary["merlion_forecast"] = {"status": "INSUFFICIENT_DATA"}
    except Exception as e:
        summary["merlion_forecast"] = {"error": str(e)}

    # 3. HMM state trajectory over period
    try:
        rows = conn.execute("""
            SELECT hmm_state, timestamp_utc, risk_48h
            FROM agent_actions_log
            WHERE patient_id = ? AND timestamp_utc >= ?
            AND hmm_state IS NOT NULL
            ORDER BY timestamp_utc ASC
        """, (patient_id, period_start)).fetchall()
        trajectory = []
        for r in rows:
            trajectory.append({
                "state": r[0],
                "timestamp": r[1],
                "risk": r[2],
            })
        # Deduplicate consecutive same states
        deduped = []
        for t in trajectory:
            if not deduped or deduped[-1]["state"] != t["state"]:
                deduped.append(t)
        summary["state_trajectory"] = deduped
    except Exception:
        summary["state_trajectory"] = []

    # 4. Recent interventions and outcomes
    try:
        rows = conn.execute("""
            SELECT tool_name, tool_args, tool_result, status, timestamp_utc, hmm_state
            FROM agent_actions_log
            WHERE patient_id = ? AND timestamp_utc >= ?
            AND action_type = 'tool_execution'
            ORDER BY timestamp_utc DESC
            LIMIT 50
        """, (patient_id, period_start)).fetchall()
        interventions = []
        for r in rows:
            interventions.append({
                "tool": r[0],
                "args": r[1],
                "status": r[3],
                "timestamp": r[4],
                "hmm_state_at_time": r[5],
            })
        summary["recent_interventions"] = interventions
        summary["intervention_count"] = len(interventions)
    except Exception:
        summary["recent_interventions"] = []

    # 5. Risk factor ranking (current)
    try:
        try:
            from hmm_engine import HMMEngine
        except ModuleNotFoundError:
            from core.hmm_engine import HMMEngine
        engine = HMMEngine()
        obs = engine.fetch_observations(days=3, patient_id=patient_id)
        if obs:
            hmm_result = engine.run_inference(obs, patient_id=patient_id)
            summary["current_state"] = hmm_result.get("current_state")
            summary["confidence"] = hmm_result.get("confidence")
            summary["top_risk_factors"] = hmm_result.get("top_factors", [])[:5]
    except Exception:
        pass

    # Log the summary generation
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'clinician_summary', ?, 'delivered')
    """, (patient_id, now, json.dumps({"period_days": period_days})))
    conn.commit()

    return {"success": True, "summary": summary}


# ============================================================================
# ADDITIONAL DB TABLES
# ============================================================================

def ensure_runtime_tables():
    """Create tables needed by the agent runtime."""
    conn = _get_db()
    try:
        _ensure_runtime_tables_inner(conn)
    finally:
        conn.close()


def _ensure_runtime_tables_inner(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_actions_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            action_type TEXT,
            action_data TEXT,
            tool_name TEXT,
            tool_args TEXT,
            tool_result TEXT,
            status TEXT DEFAULT 'pending',
            hmm_state TEXT,
            risk_48h REAL,
            reasoning TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            role TEXT,
            message TEXT,
            hmm_state TEXT,
            actions_taken TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS proactive_checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            scheduled_time TEXT,
            checkin_type TEXT,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            created_at INTEGER,
            completed_at INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS impact_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            metric_type TEXT,
            metric_value REAL,
            period_start INTEGER,
            period_end INTEGER,
            details TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            memory_type TEXT NOT NULL,
            key TEXT NOT NULL,
            value_json TEXT NOT NULL,
            confidence REAL DEFAULT 0.5,
            created_at INTEGER,
            updated_at INTEGER,
            source TEXT DEFAULT 'conversation',
            consolidated INTEGER DEFAULT 0,
            UNIQUE(patient_id, memory_type, key)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS caregiver_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER NOT NULL,
            caregiver_id TEXT NOT NULL,
            response_type TEXT NOT NULL,
            message TEXT,
            timestamp_utc INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            reminder_time TEXT,
            message TEXT,
            reminder_type TEXT DEFAULT 'general',
            repeat_type TEXT DEFAULT 'once',
            created_at INTEGER,
            status TEXT DEFAULT 'pending'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS family_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp_utc INTEGER,
            message TEXT,
            include_metrics INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS nurse_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp_utc INTEGER,
            priority TEXT,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            sbar_json TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS doctor_escalations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp_utc INTEGER,
            reason TEXT,
            metrics_snapshot TEXT,
            status TEXT DEFAULT 'pending',
            sbar_json TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS appointment_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp_utc INTEGER,
            appointment_type TEXT,
            urgency TEXT,
            reason TEXT,
            status TEXT DEFAULT 'pending'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS medication_video_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp_utc INTEGER,
            medication_name TEXT,
            status TEXT DEFAULT 'pending'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS clinical_notes_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp_utc INTEGER,
            note_type TEXT,
            content TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS medication_adherence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            medication_name TEXT NOT NULL,
            scheduled_time TEXT,
            taken INTEGER DEFAULT 0,
            logged_at INTEGER,
            date TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS voucher_tracker (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            week_start_utc INTEGER NOT NULL,
            initial_value REAL DEFAULT 5.0,
            current_value REAL DEFAULT 5.0,
            penalties_json TEXT DEFAULT '[]',
            bonus_earned REAL DEFAULT 0.0,
            redeemed INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS caregiver_contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            caregiver_name TEXT NOT NULL,
            relationship TEXT,
            phone TEXT,
            email TEXT,
            is_primary INTEGER DEFAULT 0
        )
    """)
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
    # Ensure patients table exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            age INTEGER,
            conditions TEXT,
            medications TEXT,
            tier TEXT DEFAULT 'BASIC',
            last_hba1c REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Seed P001 (Tan Ah Kow) with full medication list for drug interaction demo
    conn.execute("""
        INSERT OR IGNORE INTO patients (user_id, name, conditions, medications)
        VALUES ('P001', 'Mr. Tan Ah Kow (67M)', 'Type 2 Diabetes, Hypertension, Hyperlipidemia',
                'Metformin 500mg BD, Lisinopril 10mg OD, Atorvastatin 20mg ON, Aspirin 100mg OD')
    """)

    # Ensure daily_insights table exists (used by gemini_integration caching)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'current_user',
            date INTEGER NOT NULL,
            insight_json TEXT,
            generated_at_utc INTEGER NOT NULL,
            hmm_state_at_generation TEXT,
            trigger_reason TEXT,
            pattern_detected TEXT
        )
    """)
    # Ensure voice_checkins has user_id column
    try:
        conn.execute("SELECT user_id FROM voice_checkins LIMIT 1")
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE voice_checkins ADD COLUMN user_id TEXT DEFAULT 'P001'")
        except sqlite3.OperationalError:
            pass
    # Ensure medication_logs has user_id column
    try:
        conn.execute("SELECT user_id FROM medication_logs LIMIT 1")
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE medication_logs ADD COLUMN user_id TEXT DEFAULT 'P001'")
        except sqlite3.OperationalError:
            pass
    # Ensure patients has age column (may have been created without it)
    try:
        conn.execute("SELECT age FROM patients LIMIT 1")
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE patients ADD COLUMN age INTEGER")
        except sqlite3.OperationalError:
            pass
    # Ensure patients has tier column (may have been created without it)
    try:
        conn.execute("SELECT tier FROM patients LIMIT 1")
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE patients ADD COLUMN tier TEXT DEFAULT 'BASIC'")
        except sqlite3.OperationalError:
            pass

    # Migrate voucher_tracker: add bonus_earned if missing
    try:
        conn.execute("SELECT bonus_earned FROM voucher_tracker LIMIT 1")
    except sqlite3.OperationalError:
        try:
            conn.execute("ALTER TABLE voucher_tracker ADD COLUMN bonus_earned REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass

    # Migrate stale agent_memory tables missing columns
    for col, typedef in [
        ("confidence", "REAL DEFAULT 0.5"),
        ("created_at", "INTEGER"),
        ("updated_at", "INTEGER"),
        ("source", "TEXT DEFAULT 'conversation'"),
        ("consolidated", "INTEGER DEFAULT 0"),
    ]:
        try:
            conn.execute(f"SELECT {col} FROM agent_memory LIMIT 1")
        except sqlite3.OperationalError:
            try:
                conn.execute(f"ALTER TABLE agent_memory ADD COLUMN {col} {typedef}")
            except sqlite3.OperationalError:
                pass
    conn.commit()


def compute_impact_metrics(patient_id: str, period_days: int = 30) -> Dict:
    """
    Compute impact measurement framework metrics.
    Covers all 4 competition-required dimensions:
      1. Medication adherence rate (weekly trend)
      2. Glucose time-in-range % (4.0-10.0 mmol/L)
      3. Engagement trend (weekly scores)
      4. Intervention effectiveness (tool -> state improvement correlation)
    """
    conn = _get_db()
    try:
        return _compute_impact_metrics_inner(patient_id, period_days, conn)
    finally:
        conn.close()


def _compute_impact_metrics_inner(patient_id: str, period_days: int, conn) -> Dict:
    now = int(time.time())
    period_start = now - (period_days * 86400)

    metrics = {
        "patient_id": patient_id,
        "period_days": period_days,
        "computed_at": datetime.now().isoformat(),
    }

    # 1. Medication adherence rate (weekly averages)
    try:
        weekly_adherence = []
        for week in range(period_days // 7):
            w_start = period_start + (week * 7 * 86400)
            w_end = w_start + (7 * 86400)
            row = conn.execute("""
                SELECT AVG(taken) as avg_adh
                FROM medication_adherence
                WHERE patient_id = ? AND logged_at >= ? AND logged_at < ?
            """, (patient_id, w_start, w_end)).fetchone()
            adh = row["avg_adh"] if row and row["avg_adh"] else None
            weekly_adherence.append({
                "week": week + 1,
                "adherence": round(adh * 100, 1) if adh else None,
            })
        metrics["medication_adherence"] = {
            "weekly_trend": weekly_adherence,
            "current": weekly_adherence[-1]["adherence"] if weekly_adherence and weekly_adherence[-1]["adherence"] else None,
            "improving": (
                len(weekly_adherence) >= 2
                and weekly_adherence[-1]["adherence"] is not None
                and weekly_adherence[-2]["adherence"] is not None
                and weekly_adherence[-1]["adherence"] > weekly_adherence[-2]["adherence"]
            ),
        }
    except Exception:
        metrics["medication_adherence"] = {"weekly_trend": [], "current": None}

    # 2. Glucose time-in-range (4.0-10.0 mmol/L)
    try:
        row = conn.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN reading_value >= 4.0 AND reading_value <= 10.0 THEN 1 ELSE 0 END) as in_range
            FROM glucose_readings
            WHERE user_id = ? AND reading_timestamp_utc >= ?
        """, (patient_id, period_start)).fetchone()
        total = row["total"] if row else 0
        in_range = row["in_range"] if row else 0
        tir = round((in_range / total * 100), 1) if total > 0 else None
        metrics["glucose_time_in_range"] = {
            "percentage": tir,
            "total_readings": total,
            "in_range_readings": in_range,
            "target": "70%+ (ADA 2024 recommendation)",
            "meets_target": tir >= 70 if tir else False,
        }
    except Exception:
        metrics["glucose_time_in_range"] = {"percentage": None, "total_readings": 0}

    # 3. Engagement trend (weekly scores)
    try:
        weekly_engagement = []
        for week in range(period_days // 7):
            w_start = period_start + (week * 7 * 86400)
            w_end = w_start + (7 * 86400)

            # Count app interactions this week
            row = conn.execute("""
                SELECT COUNT(DISTINCT date(timestamp_utc, 'unixepoch')) as active_days,
                       COUNT(*) as interactions
                FROM conversation_history
                WHERE patient_id = ? AND timestamp_utc >= ? AND timestamp_utc < ?
                AND role = 'user'
            """, (patient_id, w_start, w_end)).fetchone()
            active_days = row["active_days"] if row else 0
            interactions = row["interactions"] if row else 0
            weekly_engagement.append({
                "week": week + 1,
                "active_days": active_days,
                "interactions": interactions,
                "score": min(100, active_days * 14 + interactions * 2),
            })
        metrics["engagement_trend"] = {
            "weekly": weekly_engagement,
            "current_score": weekly_engagement[-1]["score"] if weekly_engagement else 0,
            "trend": (
                "improving" if len(weekly_engagement) >= 2 and weekly_engagement[-1]["score"] > weekly_engagement[-2]["score"]
                else "declining" if len(weekly_engagement) >= 2 and weekly_engagement[-1]["score"] < weekly_engagement[-2]["score"]
                else "stable"
            ),
        }
    except Exception:
        metrics["engagement_trend"] = {"weekly": [], "current_score": 0}

    # 4. Intervention effectiveness (tool execution -> state improvement within 24h)
    try:
        rows = conn.execute("""
            SELECT id, tool_name, hmm_state, risk_48h, timestamp_utc
            FROM agent_actions_log
            WHERE patient_id = ? AND timestamp_utc >= ?
            AND action_type = 'tool_execution' AND status = 'success'
            ORDER BY timestamp_utc ASC
        """, (patient_id, period_start)).fetchall()

        tool_effectiveness = {}
        state_order = {"STABLE": 0, "WARNING": 1, "CRISIS": 2}

        for r in rows:
            tool = r["tool_name"]
            state_at = r["hmm_state"]
            ts = r["timestamp_utc"]

            if tool not in tool_effectiveness:
                tool_effectiveness[tool] = {"total": 0, "improved": 0, "unchanged": 0, "worsened": 0}
            tool_effectiveness[tool]["total"] += 1

            # Find next state within 24h
            next_state_row = conn.execute("""
                SELECT hmm_state FROM agent_actions_log
                WHERE patient_id = ? AND timestamp_utc > ? AND timestamp_utc <= ?
                AND hmm_state IS NOT NULL
                ORDER BY timestamp_utc ASC LIMIT 1
            """, (patient_id, ts, ts + 86400)).fetchone()

            if next_state_row and state_at:
                before = state_order.get(state_at, 1)
                after = state_order.get(next_state_row["hmm_state"], 1)
                if after < before:
                    tool_effectiveness[tool]["improved"] += 1
                elif after > before:
                    tool_effectiveness[tool]["worsened"] += 1
                else:
                    tool_effectiveness[tool]["unchanged"] += 1

        # Compute effectiveness rates
        for tool, data in tool_effectiveness.items():
            total = data["total"]
            data["effectiveness_rate"] = round(data["improved"] / total * 100, 1) if total > 0 else 0

        metrics["intervention_effectiveness"] = tool_effectiveness
    except Exception:
        metrics["intervention_effectiveness"] = {}

    # Store computed metrics
    try:
        for metric_type in ["medication_adherence", "glucose_time_in_range", "engagement_trend", "intervention_effectiveness"]:
            value = None
            if metric_type == "medication_adherence":
                value = metrics.get("medication_adherence", {}).get("current")
            elif metric_type == "glucose_time_in_range":
                value = metrics.get("glucose_time_in_range", {}).get("percentage")
            elif metric_type == "engagement_trend":
                value = metrics.get("engagement_trend", {}).get("current_score")

            if value is not None:
                conn.execute("""
                    INSERT INTO impact_metrics
                    (patient_id, timestamp_utc, metric_type, metric_value, period_start, period_end, details)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (patient_id, now, metric_type, value, period_start, now,
                      json.dumps(metrics.get(metric_type, {}))))
    except Exception as e:
        logger.warning(f"Failed to store impact metrics: {e}")

    conn.commit()
    return metrics


# ============================================================================
# AGENT MEMORY — Cross-Session Preference Learning
# ============================================================================

def _extract_memories_from_conversation(patient_id, user_message, agent_response, hmm_state, gemini_integration):
    """Extract learnable facts from a patient interaction and store in agent_memory."""
    if not gemini_integration or not user_message:
        return
    prompt = f"""Extract learnable facts from this patient interaction.
Patient message: {user_message[:500]}
Agent response: {agent_response[:500]}
Current health state: {hmm_state}

Return a JSON array of objects. Each object: {{"memory_type": "preference|episodic|semantic|medical_note", "key": "short_descriptive_key", "value": "the concrete fact", "confidence": 0.0-1.0}}
Only extract CONCRETE, actionable facts. Examples:
- preference: "prefers morning appointments", "dislikes exercise reminders"
- episodic: "reported nausea after metformin on this date"
- medical_note: "mentioned skipping dinner frequently"
Skip generic observations. Return empty array [] if nothing concrete.
Return ONLY the JSON array, no other text."""
    try:
        parsed = _call_gemini(gemini_integration, prompt)
        if not parsed or not isinstance(parsed, list):
            return
        conn = _get_db()
        try:
            now = int(time.time())
            for mem in parsed[:5]:
                if not isinstance(mem, dict) or "key" not in mem:
                    continue
                conn.execute("""
                    INSERT OR REPLACE INTO agent_memory
                    (patient_id, memory_type, key, value_json, confidence, created_at, updated_at, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'conversation')
                """, (patient_id, mem.get("memory_type", "episodic"),
                      mem.get("key", "unknown")[:100],
                      json.dumps({"value": mem.get("value", ""), "hmm_state": hmm_state}),
                      mem.get("confidence", 0.5), now, now))
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Memory extraction failed (non-critical): {e}")


def _consolidate_memories(patient_id, gemini_integration):
    """Merge episodic memories into semantic patterns. Called during weekly reports."""
    conn = _get_db()
    try:
        episodic = conn.execute("""
            SELECT id, key, value_json FROM agent_memory
            WHERE patient_id = ? AND memory_type = 'episodic' AND consolidated = 0
            ORDER BY created_at DESC LIMIT 50
        """, (patient_id,)).fetchall()
        if len(episodic) < 3:
            return
        facts = [f"- {r['key']}: {r['value_json']}" for r in episodic]
        prompt = f"""Given these episodic patient memories, identify repeating PATTERNS and consolidate into semantic memories.

Episodic memories:
{chr(10).join(facts[:30])}

Return JSON array of semantic patterns:
[{{"key": "pattern_name", "value": "the consolidated pattern description", "confidence": 0.5-1.0}}]
Only return patterns that appear 2+ times. Return ONLY the JSON array."""
        parsed = _call_gemini(gemini_integration, prompt)
        if not parsed or not isinstance(parsed, list):
            return
        now = int(time.time())
        for pattern in parsed[:10]:
            if not isinstance(pattern, dict):
                continue
            pattern_key = pattern.get("key") or "pattern"
            pattern_key = str(pattern_key)[:100]
            try:
                confidence = float(pattern.get("confidence", 0.7))
                confidence = max(0.0, min(1.0, confidence))
            except (ValueError, TypeError):
                confidence = 0.7
            conn.execute("""
                INSERT OR REPLACE INTO agent_memory
                (patient_id, memory_type, key, value_json, confidence, created_at, updated_at, source)
                VALUES (?, 'semantic', ?, ?, ?, ?, ?, 'consolidation')
            """, (patient_id, pattern_key,
                  json.dumps({"value": pattern.get("value", ""), "source_count": len(episodic)}),
                  confidence, now, now))
        for r in episodic:
            conn.execute("UPDATE agent_memory SET consolidated = 1 WHERE id = ?", (r["id"],))
        conn.commit()
    except Exception as e:
        logger.warning(f"Memory consolidation failed: {e}")
    finally:
        conn.close()


def _load_agent_memory(patient_id):
    """Load top memories for injection into agent prompt. Returns formatted string."""
    try:
        conn = _get_db()
        try:
            rows = conn.execute("""
                SELECT memory_type, key, value_json, confidence
                FROM agent_memory
                WHERE patient_id = ?
                ORDER BY updated_at DESC, confidence DESC
                LIMIT 20
            """, (patient_id,)).fetchall()
        finally:
            conn.close()
        if not rows:
            return "  No memories yet — this is a new patient relationship."
        grouped = {}
        for r in rows:
            mt = r["memory_type"]
            if mt not in grouped:
                grouped[mt] = []
            try:
                val = json.loads(r["value_json"]).get("value", r["value_json"])
            except (json.JSONDecodeError, AttributeError):
                val = r["value_json"]
            grouped[mt].append(f"    - {r['key']}: {val} (confidence: {(r['confidence'] or 0):.0%})")
        lines = []
        for mt in ["preference", "semantic", "medical_note", "episodic"]:
            if mt in grouped:
                lines.append(f"  [{mt.upper()}]")
                lines.extend(grouped[mt][:5])
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"Memory load failed: {e}")
        return "  Memory system unavailable."


def _update_tool_preferences(patient_id):
    """Compute which tools have worked best for this patient. Returns formatted string."""
    try:
        conn = _get_db()
        try:
            now = int(time.time())
            state_order = {"STABLE": 0, "WARNING": 1, "CRISIS": 2}
            rows = conn.execute("""
                SELECT tool_name, hmm_state, timestamp_utc
                FROM agent_actions_log
                WHERE patient_id = ? AND action_type = 'tool_execution' AND tool_name IS NOT NULL
                ORDER BY timestamp_utc ASC
            """, (patient_id,)).fetchall()
            if not rows:
                return "  No tool history yet."
            import math
            scores = {}
            for r in rows:
                tool = r["tool_name"]
                state = r["hmm_state"] or "UNKNOWN"
                ts = r["timestamp_utc"]
                age_days = max(0, (now - ts) / 86400)
                weight = math.exp(-0.693 * age_days / 14)
                key = f"{tool}|{state}"
                if key not in scores:
                    scores[key] = {"total_w": 0, "improved_w": 0, "uses": 0, "tool": tool, "state": state}
                scores[key]["total_w"] += weight
                scores[key]["uses"] += 1
                next_row = conn.execute("""
                    SELECT hmm_state FROM agent_actions_log
                    WHERE patient_id = ? AND timestamp_utc > ? AND timestamp_utc <= ?
                    AND hmm_state IS NOT NULL
                    ORDER BY timestamp_utc ASC LIMIT 1
                """, (patient_id, ts, ts + 86400)).fetchone()
                if next_row and state in state_order and next_row["hmm_state"] in state_order:
                    if state_order[next_row["hmm_state"]] < state_order[state]:
                        scores[key]["improved_w"] += weight
        finally:
            conn.close()
        lines = []
        for data in sorted(scores.values(), key=lambda x: x["uses"], reverse=True)[:10]:
            if data["total_w"] > 0:
                eff = data["improved_w"] / data["total_w"] * 100
                label = "EFFECTIVE" if eff >= 50 else "MODERATE" if eff >= 25 else "AVOID"
                lines.append(f"  {data['tool']}: {eff:.0f}% effective in {data['state']} ({data['uses']} uses) -- {label}")
        return "\n".join(lines) if lines else "  Insufficient data for effectiveness scoring."
    except Exception as e:
        logger.warning(f"Tool preference computation failed: {e}")
        return "  Tool preference data unavailable."


# ============================================================================
# MAIN AGENT RUNTIME
# ============================================================================

def build_full_hmm_context(hmm_engine, observations: List[Dict], patient_id: str) -> Dict:
    """
    Extract EVERY piece of HMM intelligence for agent decision-making.
    This is the key function — nothing is left behind.
    """
    try:
        from hmm_engine import STATES
    except ModuleNotFoundError:
        from core.hmm_engine import STATES

    if not observations:
        return {
            "error": "No observations",
            "current_state": "NO_DATA",
            "confidence": 0,
            "state_probabilities": {"STABLE": 0, "WARNING": 0, "CRISIS": 0},
            "top_factors": [],
            "path_states": [],
            "latest_obs": {},
            "monte_carlo": {"prob_crisis_percent": 0, "risk_level": "UNKNOWN"},
            "counterfactuals": {},
            "state_change": {},
            "trend": "STABLE",
            "survival_curve": [],
            "data_quality": {},
            "risk_48h": 0,
            "risk_level": "UNKNOWN",
            "expected_hours_to_crisis": None,
        }

    # 1. Core HMM inference
    hmm_result = hmm_engine.run_inference(observations, patient_id=patient_id)
    current_state = hmm_result.get("current_state", "UNKNOWN")
    confidence = hmm_result.get("confidence", 0)
    state_probs = hmm_result.get("state_probabilities", {})
    top_factors = hmm_result.get("top_factors", [])
    path_states = hmm_result.get("path_states", [])
    latest_obs = observations[-1]

    # 2. Monte Carlo crisis prediction
    monte_carlo = {"prob_crisis_percent": 0, "risk_level": "LOW"}
    try:
        monte_carlo = hmm_engine.predict_time_to_crisis(
            latest_obs, horizon_hours=48, num_simulations=2000
        )
    except Exception as e:
        logger.warning(f"Monte Carlo failed: {e}")

    # 3. Counterfactual "what-if" scenarios
    counterfactuals = {}
    current_probs = [state_probs.get(s, 0) for s in STATES]
    scenarios = {
        "perfect_medication": {"meds_adherence": 0.95},
        "good_exercise": {"steps_daily": 6000},
        "better_sleep": {"sleep_quality": 8.0},
        "lower_carbs": {"carbs_intake": 130},
    }
    for name, intervention in scenarios.items():
        try:
            result = hmm_engine.simulate_intervention(current_probs, intervention)
            if result.get("validity") == "VALID":
                counterfactuals[name] = {
                    "intervention": intervention,
                    "risk_reduction_pct": round(result.get("improvement_pct", 0), 1),
                    "new_crisis_risk": round(result.get("new_risk", 0) * 100, 1),
                    "message": result.get("message", ""),
                }
        except Exception:
            pass

    # 4. State change detection
    state_change = hmm_engine.detect_state_change(current_state, patient_id)

    # 5. Trend analysis
    trend = "STABLE"
    if len(path_states) >= 6:
        sv = {"STABLE": 0, "WARNING": 1, "CRISIS": 2}
        mid = len(path_states) // 2
        first_avg = sum(sv.get(s, 0) for s in path_states[:mid]) / max(mid, 1)
        second_avg = sum(sv.get(s, 0) for s in path_states[mid:]) / max(len(path_states) - mid, 1)
        if second_avg < first_avg - 0.3:
            trend = "IMPROVING"
        elif second_avg > first_avg + 0.3:
            trend = "DECLINING"

    # 6. Survival curve
    survival_curve = monte_carlo.get("survival_curve", [])

    # 7. Data quality
    data_quality = hmm_result.get("data_quality", {})

    return {
        "current_state": current_state,
        "confidence": confidence,
        "state_probabilities": state_probs,
        "top_factors": top_factors[:5],
        "path_states": path_states[-12:],  # last 48h of states
        "latest_obs": latest_obs,
        "monte_carlo": monte_carlo,
        "counterfactuals": counterfactuals,
        "state_change": state_change,
        "trend": trend,
        "survival_curve": survival_curve[:10],
        "data_quality": data_quality,
        "risk_48h": monte_carlo.get("prob_crisis_percent", 0),
        "risk_level": monte_carlo.get("risk_level", "UNKNOWN"),
        "expected_hours_to_crisis": monte_carlo.get("expected_hours_to_crisis"),
    }


def build_agent_prompt(
    patient_profile: Dict,
    hmm_context: Dict,
    full_context: Dict,
    conversation_history: List[Dict],
    user_message: Optional[str] = None,
) -> str:
    """
    Build the comprehensive agent prompt with ALL HMM data.
    """
    patient_id = patient_profile.get("id", "UNKNOWN")
    latest_obs = hmm_context.get("latest_obs", {})

    # Format top factors
    factors_text = "\n".join(
        f"  {i}. {f.get('feature', 'unknown')}: {f.get('value', 0):.2f} (weight: {f.get('weight', 0):.2f}, "
        f"state impact: {f.get('log_prob_ratio', 'N/A')})"
        for i, f in enumerate(hmm_context.get("top_factors", []), 1)
    ) or "  No factor data"

    # Format counterfactuals
    cf_text = "\n".join(
        f"  - If {name}: risk drops {cf.get('risk_reduction_pct', 0)}% → new crisis risk {cf.get('new_crisis_risk', 0)}%"
        for name, cf in hmm_context.get("counterfactuals", {}).items()
    ) or "  No counterfactual data"

    # Format conversation history
    conv_text = ""
    if conversation_history:
        conv_lines = []
        for turn in conversation_history[-6:]:  # last 6 turns
            role = turn.get("role", "user")
            msg = turn.get("message", "")[:200]
            conv_lines.append(f"  [{role.upper()}]: {msg}")
        conv_text = "\n".join(conv_lines)

    # Format voice check-ins
    voice_text = ""
    if full_context.get("voice_checkins"):
        voice_lines = []
        for v in full_context["voice_checkins"][:3]:
            if v.get("transcript"):
                sentiment = v.get("sentiment", 0)
                emoji = "positive" if sentiment > 0.3 else "negative" if sentiment < -0.3 else "neutral"
                voice_lines.append(f'  "{v["transcript"][:100]}" (sentiment: {emoji}, {sentiment:.2f})')
        voice_text = "\n".join(voice_lines)

    # Food patterns
    food_text = ""
    if full_context.get("recent_meals"):
        meal_lines = [
            f"  - {m.get('meal', 'Meal')}: {m.get('description', 'Unknown')} ({m.get('carbs', '?')}g carbs)"
            for m in full_context["recent_meals"][:5]
        ]
        food_text = "\n".join(meal_lines)

    # Voucher balance
    voucher_balance = 5.00
    try:
        conn = _get_db()
        try:
            row = conn.execute(
                "SELECT current_value FROM voucher_tracker WHERE user_id = ? ORDER BY week_start_utc DESC LIMIT 1",
                (patient_id,)
            ).fetchone()
            if row:
                voucher_balance = row["current_value"]
        finally:
            conn.close()
    except Exception:
        pass

    # State change info
    sc = hmm_context.get("state_change", {})
    state_change_text = (
        f"  Transition: {sc.get('previous_state', 'N/A')} → {hmm_context['current_state']} "
        f"({sc.get('transition_type', 'none')})"
    )

    mc = hmm_context.get("monte_carlo", {})

    # Current time context
    now = datetime.now()
    time_context = f"{now.strftime('%A, %d %B %Y %I:%M %p')} SGT"
    hour = now.hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    # Streaks
    streaks = get_patient_streaks(patient_id)
    streak_text = "\n".join(
        f"  {k}: {v['current']} days (best: {v['best']})"
        for k, v in streaks.items()
        if isinstance(v, dict) and "current" in v
    )

    # Engagement score
    engagement = calculate_engagement_score(patient_id)

    # Mood detection from user message
    mood_info = detect_mood_from_message(user_message) if user_message else {"mood": "neutral", "adapt_tone": "calm"}

    # Nudge timing
    nudge_times = get_optimal_nudge_times(patient_id)

    # Daily challenge
    daily_challenge = generate_daily_challenge(patient_id, hmm_context)

    # Glucose narrative
    glucose_narrative = generate_glucose_narrative(patient_id, hmm_context)

    # Caregiver fatigue
    caregiver_fatigue = detect_caregiver_fatigue(patient_id)

    # Agent memory (cross-session learning)
    memory_text = _load_agent_memory(patient_id)
    tool_pref_text = _update_tool_preferences(patient_id)

    # Drug interaction pre-check
    meds_str = patient_profile.get('medications', '')
    current_meds = [m.strip() for m in meds_str.split(',')] if isinstance(meds_str, str) and meds_str else []
    drug_interactions = check_drug_interactions(current_meds) if current_meds else {"interactions_found": 0, "interactions": []}
    drug_safety_lines = []
    for ix in drug_interactions.get("interactions", []):
        drug_safety_lines.append(f"  [{ix.get('severity', 'unknown')}] {' + '.join(ix.get('drugs', []))}: {ix.get('mechanism', '')}")
    drug_safety_text = "\n".join(drug_safety_lines) if drug_safety_lines else "  No known interactions in current medication list."

    prompt = f"""
BEWO AGENTIC AI — SYSTEM INSTRUCTIONS v7.0
============================================================================

You are BEWO, an AI Health Companion for elderly chronic disease patients in
Singapore. You have access to comprehensive health intelligence from the HMM
(Hidden Markov Model) engine and can take REAL ACTIONS on behalf of the patient.

CURRENT TIME: {time_context} ({time_of_day})

============================================================================
CORE PRINCIPLES
============================================================================
1. SAFETY FIRST
   - Never recommend stopping medications
   - Never diagnose — you support, not replace doctors
   - Escalate to nurse/doctor for: chest pain, severe hypo (<3.0), confusion,
     sustained glucose >16.7, HR >120 or <45
   - Always err on the side of caution

2. ELDERLY-APPROPRIATE COMMUNICATION
   - Short sentences (max 15 words each)
   - Use Singlish naturally (lah, lor, can, cannot, aiyo, wah, shiok)
   - Never use medical jargon without explanation
   - Be warm like a family member, not clinical

3. BEHAVIORAL PSYCHOLOGY (Apply at least 2 per response)
   - LOSS AVERSION: "Don't lose your $5" > "Keep your $5"
   - IMPLEMENTATION INTENTIONS: "After breakfast, take the blue pill with water"
   - SOCIAL PROOF: "Other uncles your age find morning walks help"
   - AUTONOMY: Give choices, not commands
   - TEMPORAL BRIDGING: Connect today's action to future benefit

4. PROACTIVE, NOT REACTIVE
   - Use predictive data to PREVENT crises, not just respond
   - If risk is rising, intervene BEFORE the crisis
   - Celebrate improvements to reinforce good behavior
   - Schedule proactive check-ins when risk trends upward

5. USE ALL HMM DATA IN YOUR REASONING
   - Reference specific numbers from the data below
   - Use counterfactual results to motivate ("if you take medicine, risk drops X%")
   - Factor in the trend direction (improving/declining/stable)
   - Consider top contributing factors when prioritizing advice

============================================================================
PATIENT PROFILE (De-identified — PDPA compliant, no PII sent to AI)
============================================================================
Patient ID: {patient_profile.get('id', 'UNKNOWN')}
Age: {patient_profile.get('age', 67)}
Conditions: {patient_profile.get('conditions', 'Type 2 Diabetes')}
Medications: {patient_profile.get('medications', 'Metformin')}
NOTE: Use "uncle"/"aunty" or "you" when addressing the patient. Never use real names.

============================================================================
AGENT MEMORY (What you remember about this patient across sessions)
============================================================================
{memory_text}

TOOL EFFECTIVENESS (learned from past outcomes for this patient):
{tool_pref_text}

============================================================================
DRUG SAFETY CONSTRAINTS (Auto-checked against current medications)
============================================================================
{drug_safety_text}
RULE: Before suggesting ANY medication change, you MUST call check_drug_interactions first.

============================================================================
HMM INFERENCE RESULTS
============================================================================
Current State: {hmm_context['current_state']}
Confidence: {hmm_context['confidence']:.1%}
State Probabilities: STABLE={hmm_context['state_probabilities'].get('STABLE', 0):.1%}, WARNING={hmm_context['state_probabilities'].get('WARNING', 0):.1%}, CRISIS={hmm_context['state_probabilities'].get('CRISIS', 0):.1%}
{state_change_text}
Overall Trend: {hmm_context['trend']}

============================================================================
PREDICTIVE RISK (Monte Carlo — {mc.get('simulations_run', 'N/A')} paths)
============================================================================
Crisis probability (48h): {mc.get('prob_crisis_percent', 'N/A')}%
Risk Level: {mc.get('risk_level', 'UNKNOWN')}
Expected hours to crisis: {mc.get('expected_hours_to_crisis', 'N/A')}
Median hours to crisis: {mc.get('median_hours_to_crisis', 'N/A')}

============================================================================
COUNTERFACTUAL ANALYSIS ("What If" Scenarios)
============================================================================
{cf_text}

============================================================================
TOP CONTRIBUTING FACTORS (Why this state?)
============================================================================
{factors_text}

============================================================================
CURRENT METRICS (Latest 4-hour window)
============================================================================
Glucose: {latest_obs.get('glucose_avg', 'N/A')} mmol/L
Glucose Variability: {latest_obs.get('glucose_variability', 'N/A')}% CV
Medication Adherence: {((latest_obs.get('meds_adherence') or 0) * 100):.0f}%
Steps: {latest_obs.get('steps_daily', 'N/A')}
Resting HR: {latest_obs.get('resting_hr', 'N/A')} bpm
HRV: {latest_obs.get('hrv_rmssd', 'N/A')} ms
Sleep Quality: {latest_obs.get('sleep_quality', 'N/A')}/10
Carbs Intake: {latest_obs.get('carbs_intake', 'N/A')}g
Social Engagement: {latest_obs.get('social_engagement', 'N/A')} interactions

============================================================================
BEHAVIORAL CONTEXT
============================================================================
Voucher Balance: ${voucher_balance:.2f} (started at $5, loses $1 per missed action)
Recent Voice Check-ins:
{voice_text if voice_text else "  No recent voice check-ins"}
Recent Meals:
{food_text if food_text else "  No recent meal data"}
Activity Pattern (7-day): Avg {full_context.get('activity_pattern', {}).get('avg_steps', 'N/A')} steps/day
Sleep Pattern: Avg {full_context.get('sleep_details', {}).get('avg_hours', 'N/A')} hours/night

============================================================================
STREAKS & ENGAGEMENT
============================================================================
{streak_text if streak_text else "  No streak data"}
Engagement Score: {engagement['total_score']}/100 ({engagement['risk_level']})
Engagement Note: {engagement['recommendation']}

============================================================================
PATIENT MOOD (detected from current message)
============================================================================
Mood: {mood_info['mood']} (confidence: {mood_info.get('confidence', 0):.0%})
Adapt tone to: {mood_info['adapt_tone']}
{"Signals: " + str(mood_info.get('signals', {})) if mood_info.get('signals') else ""}

============================================================================
OPTIMAL NUDGE TIMES (learned from response patterns)
============================================================================
Best hours: {nudge_times['best_hours']}
Avoid hours: {nudge_times['avoid_hours']}
{nudge_times.get('recommendation', '')}

============================================================================
TODAY'S CHALLENGE
============================================================================
Challenge: {daily_challenge['challenge']['goal']}
Type: {daily_challenge['challenge']['type']}
Reward: ${daily_challenge['challenge']['reward']:.2f} voucher bonus on completion
Difficulty: {daily_challenge['difficulty']}

============================================================================
GLUCOSE NARRATIVE
============================================================================
{glucose_narrative.get('narrative', 'No narrative available')}
Actionable tip: {glucose_narrative.get('actionable_tip', '')}

============================================================================
CAREGIVER STATUS
============================================================================
Fatigue detected: {caregiver_fatigue.get('fatigue_detected', False)}
Level: {caregiver_fatigue.get('fatigue_level', 'none')}
{"Signals: " + ", ".join(caregiver_fatigue.get('signals', [])) if caregiver_fatigue.get('signals') else "No fatigue signals"}
{caregiver_fatigue.get('recommendation', '')}

============================================================================
CONVERSATION HISTORY
============================================================================
{conv_text if conv_text else "  No previous conversation"}

============================================================================
AVAILABLE TOOLS (You can call these)
============================================================================
{_get_tool_descriptions_for_prompt()}

============================================================================
{"USER MESSAGE: " + user_message if user_message else "PROACTIVE CHECK-IN (no user message — you are initiating contact)"}
============================================================================

YOUR TASK:
1. Analyze ALL the data above
2. Craft a warm, personalized response in Singlish
3. Decide which tools to call (if any) based on the patient's state
4. Identify the #1 priority for the patient right now
5. If state is WARNING/CRISIS or risk >30%, you MUST take at least one action

DECISION RULES:
- CRISIS state → MUST call alert_nurse (critical) + send_caregiver_alert (critical) + escalate_to_doctor
- WARNING + risk >50% → MUST call book_appointment (urgent) + alert_nurse (high)
- WARNING + risk 30-50% → call set_reminder + send_caregiver_alert (warning)
- Declining trend → call schedule_proactive_checkin
- Low adherence (<70%) → call request_medication_video (gentle) + set_reminder
- Low activity (<3000 steps) → call suggest_activity
- Good behavior → call award_voucher_bonus
- Meal time → call recommend_food with culturally appropriate suggestions
- Patient asks "what if" question → call calculate_counterfactual
- Streak milestone (3/7/14/30 days) → call celebrate_streak with bonus
- Engagement score < 40 → call schedule_proactive_checkin + adjust_nudge_schedule
- Sunday or end of week → call generate_weekly_report
- Patient mood = frustrated → use empathetic tone, don't push actions
- Patient mood = sad → use warm tone, suggest social_call activity
- Patient mood = worried → use reassuring tone, show counterfactual data to reduce anxiety
- Schedule reminders at optimal nudge times, not arbitrary hours

Return valid JSON:
{{
    "message_to_patient": "Your warm Singlish message",
    "internal_reasoning": "Your medical reasoning (not shown to patient)",
    "tone": "celebratory | encouraging | concerned | urgent | calm",
    "tool_calls": [
        {{"tool": "tool_name", "args": {{...}} }},
        {{"tool": "another_tool", "args": {{...}} }}
    ],
    "priority_factor": "The #1 thing patient should focus on",
    "follow_up_needed": true/false,
    "escalation_needed": true/false,
    "behavioral_techniques_used": ["loss_aversion", "implementation_intention"]
}}
"""
    return prompt


def build_agent_prompt_v2(
    patient_profile: Dict,
    hmm_context: Dict,
    full_context: Dict,
    merlion_risk: Dict,
    conversation_history: List[Dict],
    user_message: Optional[str],
    tool_trace: List[Dict],
    turn: int,
    max_turns: int,
) -> str:
    """
    Multi-turn prompt builder. Turn 0 sends full context + Merlion.
    Turn 1+ sends only tool results + brief state reminder.
    Final turn forces text response (no more tool calls).
    """
    is_final_turn = (turn >= max_turns - 1)

    # --- TURN 1+: Condensed follow-up prompt ---
    if turn > 0 and tool_trace:
        trace_lines = []
        for entry in tool_trace:
            t = entry.get("turn", "?")
            name = entry.get("tool", "?")
            args_str = json.dumps(entry.get("args", {}))[:200]
            result_str = json.dumps(entry.get("result", {}))[:300]
            trace_lines.append(f"  Turn {t}: {name}({args_str}) -> {result_str}")
        trace_text = "\n".join(trace_lines)

        final_flag = ""
        if is_final_turn:
            final_flag = """
*** FINAL TURN — You MUST return your message_to_patient now. No more tool_calls allowed. ***
"""

        return f"""BEWO AGENT — TURN {turn} OF {max_turns}
{final_flag}
CURRENT STATE REMINDER:
  Patient ID: {patient_profile.get('id', 'UNKNOWN')} ({patient_profile.get('age', 67)}yo)
  HMM State: {hmm_context['current_state']} (confidence: {hmm_context['confidence']:.1%})
  Risk 48h: {hmm_context.get('risk_48h', 0):.0f}%
  Trend: {hmm_context.get('trend', 'STABLE')}

TOOL RESULTS FROM THIS SESSION:
{trace_text}

Based on these tool results, decide your next action.
- If a tool failed, consider retrying with different args or trying an alternative.
- If all needed actions are done, set "reasoning_complete": true.
- You can call additional tools if the results suggest further action is needed.

Return valid JSON:
{{
    "message_to_patient": "Your warm Singlish message (REQUIRED on final turn or when done)",
    "internal_reasoning": "Your step-by-step medical reasoning for this turn",
    "tone": "celebratory | encouraging | concerned | urgent | calm",
    "tool_calls": [{{"tool": "name", "args": {{...}}}}],
    "reasoning_complete": true/false,
    "priority_factor": "The #1 thing patient should focus on",
    "follow_up_needed": true/false,
    "escalation_needed": true/false,
    "behavioral_techniques_used": ["loss_aversion", "implementation_intention"]
}}
"""

    # --- TURN 0: Full context prompt (builds on existing v1 structure + Merlion) ---

    # Reuse all the formatting logic from build_agent_prompt
    latest_obs = hmm_context.get("latest_obs", {})
    patient_id = patient_profile.get("id", "P001")

    factors_text = "\n".join(
        f"  {i}. {f.get('feature', 'unknown')}: {f.get('value', 0):.2f} (weight: {f.get('weight', 0):.2f})"
        for i, f in enumerate(hmm_context.get("top_factors", []), 1)
    ) or "  No factor data"

    cf_text = "\n".join(
        f"  - If {name}: risk drops {cf.get('risk_reduction_pct', 0)}% -> new crisis risk {cf.get('new_crisis_risk', 0)}%"
        for name, cf in hmm_context.get("counterfactuals", {}).items()
    ) or "  No counterfactual data"

    conv_text = ""
    if conversation_history:
        conv_lines = []
        for t in conversation_history[-6:]:
            role = t.get("role", "user")
            msg = t.get("message", "")[:200]
            conv_lines.append(f"  [{role.upper()}]: {msg}")
        conv_text = "\n".join(conv_lines)

    voice_text = ""
    if full_context.get("voice_checkins"):
        for v in full_context["voice_checkins"][:3]:
            if v.get("transcript"):
                sentiment = v.get("sentiment", 0)
                tag = "positive" if sentiment > 0.3 else "negative" if sentiment < -0.3 else "neutral"
                voice_text += f'  "{v["transcript"][:100]}" (sentiment: {tag}, {sentiment:.2f})\n'

    food_text = ""
    if full_context.get("recent_meals"):
        food_text = "\n".join(
            f"  - {m.get('meal', 'Meal')}: {m.get('description', 'Unknown')} ({m.get('carbs', '?')}g carbs)"
            for m in full_context["recent_meals"][:5]
        )

    voucher_balance = 5.00
    try:
        conn = _get_db()
        try:
            row = conn.execute(
                "SELECT current_value FROM voucher_tracker WHERE user_id = ? ORDER BY week_start_utc DESC LIMIT 1",
                (patient_id,)
            ).fetchone()
            if row:
                voucher_balance = row["current_value"]
        finally:
            conn.close()
    except Exception:
        pass

    sc = hmm_context.get("state_change", {})
    state_change_text = (
        f"  Transition: {sc.get('previous_state', 'N/A')} -> {hmm_context['current_state']} "
        f"({sc.get('transition_type', 'none')})"
    )

    mc = hmm_context.get("monte_carlo", {})

    now = datetime.now()
    time_context = f"{now.strftime('%A, %d %B %Y %I:%M %p')} SGT"
    hour = now.hour
    time_of_day = "morning" if hour < 12 else "afternoon" if hour < 17 else "evening"

    streaks = get_patient_streaks(patient_id)
    streak_text = "\n".join(
        f"  {k}: {v['current']} days (best: {v['best']})"
        for k, v in streaks.items()
        if isinstance(v, dict) and "current" in v
    )

    engagement = calculate_engagement_score(patient_id)

    # Agent memory (cross-session learning) — BUG FIX: was never injected into v2 prompt
    memory_text = _load_agent_memory(patient_id)
    tool_pref_text = _update_tool_preferences(patient_id)
    mood_info = detect_mood_from_message(user_message) if user_message else {"mood": "neutral", "adapt_tone": "calm", "confidence": 0.5}
    nudge_times = get_optimal_nudge_times(patient_id)
    daily_challenge = generate_daily_challenge(patient_id, hmm_context)
    glucose_narrative = generate_glucose_narrative(patient_id, hmm_context)
    caregiver_fatigue = detect_caregiver_fatigue(patient_id)

    # Merlion section
    merlion_section = f"""============================================================================
MERLION 45-MIN GLUCOSE FORECAST (Real-time predictive engine)
============================================================================
Crisis probability (45min): {merlion_risk.get('prob_crisis_45min', 0):.1f}%
Volatility index: {merlion_risk.get('volatility_index', 0):.2f}
Glucose velocity: {merlion_risk.get('velocity', 0):.2f} mmol/L per window
Glucose acceleration: {merlion_risk.get('acceleration', 0):.3f} mmol/L per window^2
Forecast engine: {merlion_risk.get('engine', 'unknown')}
"""
    forecast_curve = merlion_risk.get("forecast_curve", [])
    if forecast_curve:
        curve_str = " -> ".join(f"{v:.1f}" for v in forecast_curve[:6] if v is not None)
        merlion_section += f"Forecast curve (next 6 windows): {curve_str}\n"

    # Loop control instructions
    loop_instructions = f"""
============================================================================
MULTI-TURN REASONING INSTRUCTIONS (Turn {turn} of {max_turns})
============================================================================
You are in a REASONING LOOP. You can:
1. Call tools and see their results on the next turn
2. Reason about results and call more tools
3. Finish by setting "reasoning_complete": true

RULES:
- If you call tools, you WILL see their results on the next turn
- Call multiple tools per turn if they're independent
- Set "reasoning_complete": true when you've taken all needed actions
- ALWAYS include "message_to_patient" when reasoning_complete is true
- On the FINAL turn, you MUST return message_to_patient (no more tool calls)
"""

    prompt = f"""
BEWO AGENTIC AI v7.0 — MULTI-TURN REASONING ENGINE
============================================================================

You are BEWO, an AI Health Companion for elderly chronic disease patients in
Singapore. You have access to comprehensive health intelligence and can take
REAL ACTIONS. You OBSERVE tool results, THINK about what else is needed,
and ACT accordingly across multiple reasoning turns.

CURRENT TIME: {time_context} ({time_of_day})

============================================================================
CORE PRINCIPLES
============================================================================
1. SAFETY FIRST
   - Never recommend stopping medications
   - Never diagnose — you support, not replace doctors
   - Escalate to nurse/doctor for: chest pain, severe hypo (<3.0), confusion,
     sustained glucose >16.7, HR >120 or <45
   - Always err on the side of caution

2. ELDERLY-APPROPRIATE COMMUNICATION
   - Short sentences (max 15 words each)
   - Use Singlish naturally (lah, lor, can, cannot, aiyo, wah, shiok)
   - Never use medical jargon without explanation
   - Be warm like a family member, not clinical

3. BEHAVIORAL PSYCHOLOGY (Apply at least 2 per response)
   - LOSS AVERSION: "Don't lose your $5" > "Keep your $5"
   - IMPLEMENTATION INTENTIONS: "After breakfast, take the blue pill with water"
   - SOCIAL PROOF: "Other uncles your age find morning walks help"
   - AUTONOMY: Give choices, not commands
   - TEMPORAL BRIDGING: Connect today's action to future benefit

4. PROACTIVE, NOT REACTIVE
   - Use Merlion 45-min forecast + Monte Carlo 48h prediction to PREVENT crises
   - If Merlion shows rising velocity, intervene BEFORE glucose spikes
   - Celebrate improvements to reinforce good behavior

5. USE ALL DATA IN YOUR REASONING
   - Reference specific numbers from HMM, Merlion, and Monte Carlo
   - Use counterfactual results to motivate patients
   - Factor in trend direction and top contributing factors

============================================================================
PATIENT PROFILE (De-identified — PDPA compliant, no PII sent to AI)
============================================================================
Patient ID: {patient_profile.get('id', 'UNKNOWN')}
Age: {patient_profile.get('age', 67)}
Conditions: {patient_profile.get('conditions', 'Type 2 Diabetes')}
Medications: {patient_profile.get('medications', 'Metformin')}
NOTE: Use "uncle"/"aunty" or "you" when addressing the patient. Never use real names.

============================================================================
AGENT MEMORY (What you remember about this patient across sessions)
============================================================================
{memory_text}

TOOL EFFECTIVENESS (learned from past outcomes for this patient):
{tool_pref_text}

============================================================================
HMM INFERENCE RESULTS
============================================================================
Current State: {hmm_context['current_state']}
Confidence: {hmm_context['confidence']:.1%}
State Probabilities: STABLE={hmm_context['state_probabilities'].get('STABLE', 0):.1%}, WARNING={hmm_context['state_probabilities'].get('WARNING', 0):.1%}, CRISIS={hmm_context['state_probabilities'].get('CRISIS', 0):.1%}
{state_change_text}
Overall Trend: {hmm_context['trend']}

{merlion_section}

============================================================================
PREDICTIVE RISK (Monte Carlo — {mc.get('simulations_run', 'N/A')} paths)
============================================================================
Crisis probability (48h): {mc.get('prob_crisis_percent', 'N/A')}%
Risk Level: {mc.get('risk_level', 'UNKNOWN')}
Expected hours to crisis: {mc.get('expected_hours_to_crisis', 'N/A')}
Median hours to crisis: {mc.get('median_hours_to_crisis', 'N/A')}

============================================================================
COUNTERFACTUAL ANALYSIS ("What If" Scenarios)
============================================================================
{cf_text}

============================================================================
TOP CONTRIBUTING FACTORS (Why this state?)
============================================================================
{factors_text}

============================================================================
CURRENT METRICS (Latest 4-hour window)
============================================================================
Glucose: {latest_obs.get('glucose_avg', 'N/A')} mmol/L
Glucose Variability: {latest_obs.get('glucose_variability', 'N/A')}% CV
Medication Adherence: {((latest_obs.get('meds_adherence') or 0) * 100):.0f}%
Steps: {latest_obs.get('steps_daily', 'N/A')}
Resting HR: {latest_obs.get('resting_hr', 'N/A')} bpm
HRV: {latest_obs.get('hrv_rmssd', 'N/A')} ms
Sleep Quality: {latest_obs.get('sleep_quality', 'N/A')}/10
Carbs Intake: {latest_obs.get('carbs_intake', 'N/A')}g
Social Engagement: {latest_obs.get('social_engagement', 'N/A')} interactions

============================================================================
BEHAVIORAL CONTEXT
============================================================================
Voucher Balance: ${voucher_balance:.2f} (started at $5, loses $1 per missed action)
Recent Voice Check-ins:
{voice_text if voice_text else "  No recent voice check-ins"}
Recent Meals:
{food_text if food_text else "  No recent meal data"}

============================================================================
STREAKS & ENGAGEMENT
============================================================================
{streak_text if streak_text else "  No streak data"}
Engagement Score: {engagement['total_score']}/100 ({engagement['risk_level']})

============================================================================
PATIENT MOOD (detected from current message)
============================================================================
Mood: {mood_info['mood']} (confidence: {mood_info.get('confidence', 0):.0%})
Adapt tone to: {mood_info['adapt_tone']}

============================================================================
OPTIMAL NUDGE TIMES
============================================================================
Best hours: {nudge_times['best_hours']}
Avoid hours: {nudge_times['avoid_hours']}

============================================================================
TODAY'S CHALLENGE
============================================================================
Challenge: {daily_challenge['challenge']['goal']}
Reward: ${daily_challenge['challenge']['reward']:.2f} voucher bonus

============================================================================
GLUCOSE NARRATIVE
============================================================================
{glucose_narrative.get('narrative', 'No narrative available')}

============================================================================
CAREGIVER STATUS
============================================================================
Fatigue detected: {caregiver_fatigue.get('fatigue_detected', False)}
Level: {caregiver_fatigue.get('fatigue_level', 'none')}
{caregiver_fatigue.get('recommendation', '')}

============================================================================
CONVERSATION HISTORY
============================================================================
{conv_text if conv_text else "  No previous conversation"}

============================================================================
AVAILABLE TOOLS (You can call these — results visible next turn)
============================================================================
{_get_tool_descriptions_for_prompt()}

============================================================================
{"USER MESSAGE: " + user_message if user_message else "PROACTIVE CHECK-IN (no user message — you are initiating contact)"}
============================================================================

{loop_instructions}

DECISION RULES:
- CRISIS state -> MUST call alert_nurse (critical) + send_caregiver_alert (critical) + escalate_to_doctor
- WARNING + risk >50% -> MUST call book_appointment (urgent) + alert_nurse (high)
- WARNING + risk 30-50% -> call set_reminder + send_caregiver_alert (warning)
- Merlion velocity > 0.5 mmol/L/window -> proactive intervention even if HMM says STABLE
- Declining trend -> call schedule_proactive_checkin
- Low adherence (<70%) -> call request_medication_video (gentle) + set_reminder
- Low activity (<3000 steps) -> call suggest_activity
- Good behavior -> call award_voucher_bonus
- Meal time -> call recommend_food with culturally appropriate suggestions
- Patient asks "what if" -> call calculate_counterfactual
- Streak milestone (3/7/14/30 days) -> call celebrate_streak
- Engagement score < 40 -> schedule_proactive_checkin + adjust_nudge_schedule
- Sunday or end of week -> call generate_weekly_report
- Clinician needs update -> call generate_clinician_summary
- Patient mood = frustrated -> empathetic tone, don't push actions
- Patient mood = sad -> warm tone, suggest social_call activity
- Patient mood = worried -> reassuring tone, show counterfactual data
- Schedule reminders at optimal nudge times, not arbitrary hours

Return valid JSON:
{{
    "message_to_patient": "Your warm Singlish message (REQUIRED when reasoning_complete is true)",
    "internal_reasoning": "Your step-by-step medical reasoning",
    "tone": "celebratory | encouraging | concerned | urgent | calm",
    "tool_calls": [
        {{"tool": "tool_name", "args": {{...}} }},
        {{"tool": "another_tool", "args": {{...}} }}
    ],
    "reasoning_complete": true/false,
    "priority_factor": "The #1 thing patient should focus on",
    "follow_up_needed": true/false,
    "escalation_needed": true/false,
    "behavioral_techniques_used": ["loss_aversion", "implementation_intention"]
}}
"""
    return prompt


def run_agent_loop(
    patient_profile: Dict,
    hmm_context: Dict,
    full_context: Dict,
    merlion_risk: Dict,
    conversation_history: List[Dict],
    user_message: Optional[str],
    patient_id: str,
    gemini_integration,
    max_turns: int = 5,
) -> Dict:
    """
    Multi-turn agentic reasoning loop (Observe -> Think -> Act -> Observe).

    Turn 0: Full context prompt + Merlion. Gemini picks tools.
    Turn 1+: Gemini sees tool results, reasons further, picks more tools or finishes.
    Final turn: Forces text response.

    Returns complete result dict with _tool_trace metadata.
    """
    tool_trace = []
    result = None
    start_time = time.time()
    MAX_AGENT_SECONDS = 55  # 55 second timeout for entire loop
    turn = 0

    for turn in range(max_turns):
        # Check overall timeout before each Gemini call
        if time.time() - start_time > MAX_AGENT_SECONDS:
            logger.warning(f"Agent loop timeout after {time.time() - start_time:.1f}s on turn {turn}")
            break

        # Build prompt (full on turn 0, condensed on turn 1+)
        prompt = build_agent_prompt_v2(
            patient_profile, hmm_context, full_context, merlion_risk,
            conversation_history, user_message, tool_trace, turn, max_turns,
        )

        # Call Gemini (max 2 retries per turn to stay within 45s loop budget)
        parsed = _call_gemini(gemini_integration, prompt, max_retries=2)

        if parsed is None:
            # Gemini failed — use fallback with safety tool execution
            logger.warning(f"Gemini failed on turn {turn}, using fallback")
            result = _generate_fallback_response(hmm_context, patient_profile)
            # Execute fallback tool_calls (e.g., nurse alert in CRISIS)
            for fb_tool in result.get("tool_calls", []):
                fb_name = fb_tool.get("tool")
                fb_args = fb_tool.get("args", {})
                if fb_name:
                    fb_result = execute_tool(fb_name, fb_args, patient_id, patient_profile)
                    tool_trace.append({"turn": turn, "tool": fb_name, "args": fb_args, "result": fb_result})
            break

        result = parsed

        # Check if Gemini says it's done reasoning
        if parsed.get("reasoning_complete", False):
            logger.info(f"Agent reasoning complete on turn {turn}")
            break

        # Check if there are tool calls to execute
        tool_calls = parsed.get("tool_calls", [])
        if not tool_calls:
            # No tools and not explicitly done — treat as done
            logger.info(f"No tool calls on turn {turn}, treating as complete")
            break

        # Execute tools and record results
        for tool_call in tool_calls:
            tool_name = tool_call.get("tool")
            tool_args = tool_call.get("args", {})
            if not tool_name:
                continue

            tool_result = execute_tool(tool_name, tool_args, patient_id, patient_profile)
            trace_entry = {
                "turn": turn,
                "tool": tool_name,
                "args": tool_args,
                "result": tool_result,
            }
            tool_trace.append(trace_entry)

            # Log each tool execution
            try:
                conn = _get_db()
                try:
                    conn.execute("""
                        INSERT INTO agent_actions_log
                        (patient_id, timestamp_utc, action_type, tool_name, tool_args,
                         tool_result, status, hmm_state, risk_48h, reasoning)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        patient_id, int(time.time()), "tool_execution",
                        tool_name, json.dumps(tool_args), json.dumps(tool_result),
                        "success" if tool_result.get("success") else "failed",
                        hmm_context.get("current_state"),
                        hmm_context.get("risk_48h", 0),
                        parsed.get("internal_reasoning", "")[:500],
                    ))
                    conn.commit()
                finally:
                    conn.close()
            except Exception as e:
                logger.warning(f"Failed to log action: {e}")

        logger.info(f"Turn {turn}: executed {len(tool_calls)} tools, continuing loop")

    # Ensure we have a result
    if result is None:
        result = _generate_fallback_response(hmm_context, patient_profile)

    # Attach tool trace metadata
    result["_tool_trace"] = tool_trace
    result["_turns_used"] = min(turn + 1, max_turns)
    result["_merlion_45min"] = merlion_risk

    return result


def get_conversation_history(patient_id: str, limit: int = 10) -> List[Dict]:
    """Fetch recent conversation turns."""
    try:
        conn = _get_db()
        try:
            rows = conn.execute("""
                SELECT role, message, hmm_state, timestamp_utc
                FROM conversation_history
                WHERE patient_id = ?
                ORDER BY timestamp_utc DESC
                LIMIT ?
            """, (patient_id, limit)).fetchall()
        finally:
            conn.close()
        return [dict(r) for r in reversed(rows)]
    except Exception:
        return []


def store_conversation_turn(patient_id: str, role: str, message: str,
                            hmm_state: str = None, actions_taken: str = None):
    """Store a conversation turn."""
    try:
        conn = _get_db()
        try:
            conn.execute("""
                INSERT INTO conversation_history
                (patient_id, timestamp_utc, role, message, hmm_state, actions_taken)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (patient_id, int(time.time()), role, message, hmm_state, actions_taken))
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Failed to store conversation: {e}")


def run_agent(
    patient_profile: Dict,
    hmm_engine,
    observations: List[Dict],
    patient_id: str,
    user_message: Optional[str] = None,
    gemini_integration=None,
) -> Dict:
    """
    Main entry point for the agent runtime.

    Orchestrates the full Diamond Architecture pipeline:
      HMM → Merlion forecast → Multi-turn Gemini reasoning loop → SEA-LION translation

    The agent OBSERVES tool results, THINKS about what else is needed,
    and ACTS accordingly across up to 5 reasoning turns.

    Args:
        patient_profile: Patient demographics dict
        hmm_engine: Initialized HMMEngine instance
        observations: List of observation dicts
        patient_id: Patient identifier
        user_message: Optional user message (None = proactive check-in)
        gemini_integration: GeminiIntegration instance

    Returns:
        Complete response dict with message, executed actions, and metadata
    """
    # Ensure tables exist
    ensure_runtime_tables()

    # 1. Build full HMM context (extracts EVERYTHING)
    hmm_context = build_full_hmm_context(hmm_engine, observations, patient_id)

    # 2. Get Merlion 45-min glucose forecast
    merlion_risk = _get_merlion_forecast(observations)

    # 3. Fetch additional contextual data (10 data sources)
    full_context = {}
    if gemini_integration:
        try:
            full_context = gemini_integration.fetch_full_context(days=7, patient_id=patient_id)
        except Exception as e:
            logger.warning(f"Context fetch failed: {e}")

    # 4. Get conversation history
    conversation_history = get_conversation_history(patient_id, limit=10)

    # Store user message if provided
    if user_message:
        store_conversation_turn(patient_id, "user", user_message,
                                hmm_state=hmm_context.get("current_state"))

    # 5. De-identify patient profile before any LLM calls (PDPA compliance)
    safe_profile = _deidentify_profile_for_llm(patient_profile)

    # Run multi-turn agentic reasoning loop
    result = run_agent_loop(
        patient_profile=safe_profile,
        hmm_context=hmm_context,
        full_context=full_context,
        merlion_risk=merlion_risk,
        conversation_history=conversation_history,
        user_message=user_message,
        patient_id=patient_id,
        gemini_integration=gemini_integration,
        max_turns=3,
    )

    # 6. Save original message for safety check BEFORE translation
    original_for_safety = result.get("message_to_patient", "")

    # 6a. Apply SEA-LION cultural translation to final message
    msg = result.get("message_to_patient", "")
    if msg:
        try:
            try:
                from sealion_interface import SeaLionInterface
            except ModuleNotFoundError:
                from core.sealion_interface import SeaLionInterface
            sealion = SeaLionInterface()
            tone = result.get("tone", "calm")
            translated = sealion.translate_message(msg, "singlish_elder", tone)
            if translated:
                result["_original_message"] = msg
                result["message_to_patient"] = translated
        except Exception as e:
            logger.warning(f"SEA-LION translation failed (non-critical): {e}")

    # 6b. Apply safety classifier on ORIGINAL (pre-translation) message
    #     Safety rules are designed for English, not Singlish-translated text
    try:
        safety = classify_response_safety(original_for_safety, safe_profile, hmm_context, gemini_integration)
        verdict = safety.get("verdict", "SAFE")
        if verdict == "UNSAFE":
            corrected = safety.get("corrected_message")
            result["_original_unsafe_message"] = result.get("message_to_patient", "")
            result["message_to_patient"] = corrected if corrected else "I want to help you lah, but let me check with your doctor first before giving advice on this. Stay safe!"
            _log_safety_event(patient_id, "UNSAFE", safety.get("flags", []), original_for_safety)
        elif verdict == "CAUTION":
            result["message_to_patient"] = result.get("message_to_patient", "") + "\n\n(Please always consult your doctor for medical decisions.)"
            _log_safety_event(patient_id, "CAUTION", safety.get("flags", []), original_for_safety)
        result["_safety_verdict"] = verdict
        result["_safety_flags"] = safety.get("flags", [])
    except Exception as e:
        logger.error(f"Safety classifier failed — original message passed through unfiltered: {e}")

    # 7. Store assistant response
    assistant_message = result.get("message_to_patient", result.get("message", ""))
    tool_trace = result.get("_tool_trace", [])
    actions_summary = json.dumps([t["tool"] for t in tool_trace]) if tool_trace else None
    store_conversation_turn(
        patient_id, "assistant", assistant_message,
        hmm_state=hmm_context.get("current_state"),
        actions_taken=actions_summary,
    )

    # 7b. Extract memories from this conversation (cross-session learning)
    try:
        _extract_memories_from_conversation(
            patient_id, user_message, assistant_message,
            hmm_context.get("current_state"), gemini_integration
        )
    except Exception as e:
        logger.warning(f"Memory extraction failed (non-critical): {e}")

    # 8. Add metadata
    result["_metadata"] = {
        "hmm_state": hmm_context.get("current_state"),
        "confidence": hmm_context.get("confidence"),
        "risk_48h": hmm_context.get("risk_48h"),
        "trend": hmm_context.get("trend"),
        "executed_tools": tool_trace,
        "tools_called": len(tool_trace),
        "turns_used": result.get("_turns_used", 1),
        "merlion_45min": merlion_risk,
        "timestamp": time.time(),
        "state_change": hmm_context.get("state_change", {}),
        "architecture": "diamond_v7_multiturn",
    }

    # Preserve backward compat keys
    if "message_to_patient" not in result and "message" in result:
        result["message_to_patient"] = result["message"]

    return result


# ============================================================================
# STREAK & ENGAGEMENT TRACKING
# ============================================================================

def get_patient_streaks(patient_id: str) -> Dict:
    """
    Calculate current streaks for medication, glucose logging, exercise, and app usage.
    Drives retention through visible progress + loss aversion ("Don't break your streak!").
    """
    conn = _get_db()
    try:
        streaks = {
            "medication": {"current": 0, "best": 0, "last_action": None},
            "glucose_logging": {"current": 0, "best": 0, "last_action": None},
            "exercise": {"current": 0, "best": 0, "last_action": None},
            "app_login": {"current": 0, "best": 0, "last_action": None},
        }

        # Medication streak — from actual medication intake logs
        try:
            rows = conn.execute("""
                SELECT DISTINCT date(taken_timestamp_utc, 'unixepoch') as day
                FROM medication_logs
                WHERE user_id = ?
                ORDER BY day DESC
            """, (patient_id,)).fetchall()
            streaks["medication"] = _calc_streak([r["day"] for r in rows])
        except Exception:
            pass

        # Glucose logging streak — from sensor readings
        try:
            rows = conn.execute("""
                SELECT DISTINCT date(reading_timestamp_utc, 'unixepoch') as day
                FROM glucose_readings
                WHERE user_id = ?
                ORDER BY day DESC
            """, (patient_id,)).fetchall()
            streaks["glucose_logging"] = _calc_streak([r["day"] for r in rows])
        except Exception:
            pass

        # Exercise streak — from step data
        try:
            rows = conn.execute("""
                SELECT DISTINCT date(date, 'unixepoch') as day
                FROM fitbit_activity
                WHERE user_id = ? AND steps > 2000
                ORDER BY day DESC
            """, (patient_id,)).fetchall()
            streaks["exercise"] = _calc_streak([r["day"] for r in rows])
        except Exception:
            pass

        # App usage streak — from conversation history
        try:
            rows = conn.execute("""
                SELECT DISTINCT date(timestamp_utc, 'unixepoch') as day
                FROM conversation_history
                WHERE patient_id = ? AND role = 'user'
                ORDER BY day DESC
            """, (patient_id,)).fetchall()
            streaks["app_login"] = _calc_streak([r["day"] for r in rows])
        except Exception:
            pass
    finally:
        conn.close()

    # Overall engagement score (0-100)
    total_current = sum(s["current"] for s in streaks.values())
    streaks["engagement_score"] = min(100, total_current * 5)
    streaks["engagement_level"] = (
        "Champion" if total_current >= 20 else
        "Strong" if total_current >= 12 else
        "Growing" if total_current >= 6 else
        "Starting"
    )

    return streaks


def _calc_streak(days: List[str]) -> Dict:
    """Calculate current and best streak from a sorted list of date strings."""
    if not days:
        return {"current": 0, "best": 0, "last_action": None}

    from datetime import date as dt_date
    today = datetime.now().strftime("%Y-%m-%d")
    parsed = []
    for d in days:
        try:
            parsed.append(datetime.strptime(d, "%Y-%m-%d").date())
        except (ValueError, TypeError):
            continue

    if not parsed:
        return {"current": 0, "best": 0, "last_action": None}

    parsed.sort(reverse=True)

    # Current streak (must include today or yesterday)
    current = 0
    today_date = datetime.now().date()
    if parsed[0] >= today_date - timedelta(days=1):
        current = 1
        for i in range(1, len(parsed)):
            if parsed[i] == parsed[i-1] - timedelta(days=1):
                current += 1
            else:
                break

    # Best streak
    best = 1
    run = 1
    for i in range(1, len(parsed)):
        if parsed[i] == parsed[i-1] - timedelta(days=1):
            run += 1
            best = max(best, run)
        else:
            run = 1

    return {"current": current, "best": max(best, current), "last_action": str(parsed[0])}


# ============================================================================
# ADAPTIVE NUDGE TIMING
# ============================================================================

def get_optimal_nudge_times(patient_id: str) -> Dict:
    """
    Learn WHEN the patient is most responsive to messages.
    Analyzes conversation response patterns to find optimal nudge windows.
    """
    conn = _get_db()

    response_by_hour = {}

    try:
        # Get assistant messages followed by user responses
        rows = conn.execute("""
            SELECT timestamp_utc, role
            FROM conversation_history
            WHERE patient_id = ?
            ORDER BY timestamp_utc ASC
        """, (patient_id,)).fetchall()

        for i in range(len(rows) - 1):
            if rows[i]["role"] == "assistant" and rows[i+1]["role"] == "user":
                sent_time = rows[i]["timestamp_utc"]
                response_time = rows[i+1]["timestamp_utc"]
                response_delay = response_time - sent_time
                if response_delay <= 0:
                    continue

                hour = datetime.fromtimestamp(sent_time).hour
                if hour not in response_by_hour:
                    response_by_hour[hour] = []
                response_by_hour[hour].append(response_delay)
    except Exception as e:
        logger.debug(f"Nudge time calculation error: {e}")
    finally:
        conn.close()

    if not response_by_hour:
        # Default: morning and evening for elderly
        return {
            "best_hours": [9, 19],
            "avoid_hours": [0, 1, 2, 3, 4, 5, 22, 23],
            "data_available": False,
            "recommendation": "Default schedule: 9 AM and 7 PM"
        }

    # Score each hour: faster response = better score
    scored_hours = {}
    for hour, delays in response_by_hour.items():
        avg_delay = sum(delays) / len(delays)
        response_rate = len(delays)
        # Lower delay = higher score, more responses = higher score
        scored_hours[hour] = response_rate / max(avg_delay / 60, 1)

    # Sort by score
    ranked = sorted(scored_hours.items(), key=lambda x: x[1], reverse=True)
    best_hours = [h for h, _ in ranked[:3]]
    worst_hours = [h for h, _ in ranked[-3:]] if len(ranked) > 3 else []

    return {
        "best_hours": best_hours,
        "avoid_hours": worst_hours + [0, 1, 2, 3, 4, 5],
        "response_data": {h: {"avg_delay_min": sum(d)/max(len(d), 1)/60, "count": len(d)}
                          for h, d in response_by_hour.items()},
        "data_available": True,
        "recommendation": f"Best response times: {', '.join(f'{h}:00' for h in best_hours)}"
    }


# ============================================================================
# WEEKLY HEALTH REPORT
# ============================================================================

def generate_weekly_report(patient_id: str, patient_profile: Dict) -> Dict:
    """
    Auto-generate weekly health summary for patient AND caregiver.
    Covers: glucose trends, adherence, activity, streaks, HMM state history, achievements.
    """
    conn = _get_db()
    try:
        return _generate_weekly_report_inner(patient_id, patient_profile, conn)
    finally:
        conn.close()


def _generate_weekly_report_inner(patient_id: str, patient_profile: Dict, conn) -> Dict:
    now = int(time.time())
    week_ago = now - (7 * 86400)

    report = {
        "patient_id": patient_id,
        "patient_name": patient_profile.get("name", patient_profile.get("display_name", _get_safe_patient_label(patient_profile))),
        "period": f"{datetime.fromtimestamp(week_ago).strftime('%d %b')} - {datetime.fromtimestamp(now).strftime('%d %b %Y')}",
        "generated_at": datetime.now().isoformat(),
    }

    # Glucose summary
    try:
        row = conn.execute("""
            SELECT AVG(reading_value) as avg, MIN(reading_value) as min_g,
                   MAX(reading_value) as max_g, COUNT(*) as readings
            FROM glucose_readings
            WHERE user_id = ? AND reading_timestamp_utc >= ?
        """, (patient_id, week_ago)).fetchone()
        if row and row["readings"]:
            report["glucose"] = {
                "average": round(row["avg"], 1),
                "min": round(row["min_g"], 1),
                "max": round(row["max_g"], 1),
                "readings_count": row["readings"],
                "in_range_text": "Good" if 4.0 <= row["avg"] <= 10.0 else "Needs attention"
            }
    except Exception:
        report["glucose"] = {"average": None, "note": "No glucose data this week"}

    # Activity summary
    try:
        row = conn.execute("""
            SELECT AVG(steps) as avg_steps, MAX(steps) as best_day,
                   COUNT(DISTINCT date(date, 'unixepoch')) as active_days
            FROM fitbit_activity
            WHERE user_id = ? AND date >= ?
        """, (patient_id, week_ago)).fetchone()
        if row and row["active_days"]:
            report["activity"] = {
                "avg_steps": int(row["avg_steps"] or 0),
                "best_day_steps": int(row["best_day"] or 0),
                "active_days": row["active_days"],
                "goal_met": (row["avg_steps"] or 0) >= 4000
            }
    except Exception:
        report["activity"] = {"avg_steps": 0, "note": "No activity data"}

    # Agent actions this week
    try:
        row = conn.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful
            FROM agent_actions_log
            WHERE patient_id = ? AND timestamp_utc >= ?
        """, (patient_id, week_ago)).fetchone()
        report["agent_actions"] = {
            "total": row["total"] or 0,
            "successful": row["successful"] or 0
        }
    except Exception:
        report["agent_actions"] = {"total": 0, "successful": 0}

    # Streaks
    report["streaks"] = get_patient_streaks(patient_id)

    # Achievements this week
    achievements = []
    streaks = report["streaks"]
    if streaks.get("medication", {}).get("current", 0) >= 7:
        achievements.append("7-day medication streak!")
    if streaks.get("glucose_logging", {}).get("current", 0) >= 5:
        achievements.append("5+ days of glucose logging!")
    if report.get("activity", {}).get("goal_met"):
        achievements.append("Met daily step goal this week!")
    if report.get("glucose", {}).get("in_range_text") == "Good":
        achievements.append("Glucose in healthy range!")
    report["achievements"] = achievements

    # Overall grade
    score = 0
    if report.get("glucose", {}).get("in_range_text") == "Good":
        score += 30
    if report.get("activity", {}).get("goal_met"):
        score += 25
    score += min(25, streaks.get("medication", {}).get("current", 0) * 3)
    score += min(20, len(achievements) * 5)
    report["overall_grade"] = (
        "A" if score >= 80 else
        "B" if score >= 60 else
        "C" if score >= 40 else
        "D"
    )
    report["overall_score"] = score

    return report


# ============================================================================
# MOOD-AWARE RESPONSE ADAPTATION
# ============================================================================

def detect_mood_from_message(message: str) -> Dict:
    """
    Quick sentiment/mood detection from user message text.
    Adapts agent tone based on detected emotional state.
    Uses keyword matching (fast, no API needed) + pattern analysis.
    """
    if not message:
        return {"mood": "neutral", "confidence": 0.5, "adapt_tone": "calm"}

    msg_lower = message.lower()

    # Frustration signals
    frustration_words = ["cannot", "don't want", "tired", "sian", "annoying", "hate",
                         "stop", "leave me alone", "useless", "why", "pain", "difficult",
                         "hard", "give up", "no point", "waste time"]
    # Positive signals
    positive_words = ["ok", "can", "good", "better", "happy", "nice", "thanks",
                      "thank", "great", "shiok", "not bad", "improve", "well",
                      "steady", "yes", "sure"]
    # Worry/anxiety signals
    worry_words = ["scared", "worry", "afraid", "nervous", "what if", "will i",
                   "am i going", "dangerous", "serious", "die", "hospital"]
    # Sadness signals
    sad_words = ["lonely", "alone", "miss", "sad", "nobody", "no one", "depressed",
                 "down", "cry", "burden"]

    frustration_count = sum(1 for w in frustration_words if w in msg_lower)
    positive_count = sum(1 for w in positive_words if w in msg_lower)
    worry_count = sum(1 for w in worry_words if w in msg_lower)
    sad_count = sum(1 for w in sad_words if w in msg_lower)

    total = frustration_count + positive_count + worry_count + sad_count
    if total == 0:
        return {"mood": "neutral", "confidence": 0.3, "adapt_tone": "calm"}

    scores = {
        "frustrated": frustration_count,
        "positive": positive_count,
        "worried": worry_count,
        "sad": sad_count,
    }
    dominant = max(scores, key=scores.get)
    confidence = min(0.9, scores[dominant] / max(total, 1))

    tone_map = {
        "frustrated": "empathetic",
        "positive": "celebratory",
        "worried": "reassuring",
        "sad": "warm",
    }

    return {
        "mood": dominant,
        "confidence": round(confidence, 2),
        "adapt_tone": tone_map.get(dominant, "calm"),
        "signals": {k: v for k, v in scores.items() if v > 0},
    }


# ============================================================================
# PATIENT ENGAGEMENT SCORING
# ============================================================================

def calculate_engagement_score(patient_id: str) -> Dict:
    """
    Composite engagement score (0-100) based on multiple factors.
    Used to identify disengaging patients for proactive outreach.

    Factors (weighted):
    - App usage frequency (25%)
    - Glucose logging consistency (25%)
    - Medication adherence (20%)
    - Response rate to nudges (15%)
    - Streak maintenance (15%)
    """
    conn = _get_db()
    try:
        return _calculate_engagement_inner(patient_id, conn)
    finally:
        conn.close()


def _calculate_engagement_inner(patient_id: str, conn) -> Dict:
    now = int(time.time())
    week_ago = now - (7 * 86400)

    scores = {}

    # App usage (25 points) — days used in last 7
    try:
        row = conn.execute("""
            SELECT COUNT(DISTINCT date(timestamp_utc, 'unixepoch')) as days
            FROM conversation_history
            WHERE patient_id = ? AND timestamp_utc >= ? AND role = 'user'
        """, (patient_id, week_ago)).fetchone()
        days = row["days"] if row else 0
        scores["app_usage"] = min(25, round(days / 7 * 25))
    except Exception:
        scores["app_usage"] = 0

    # Glucose logging (25 points) — readings in last 7 days
    try:
        row = conn.execute("""
            SELECT COUNT(*) as readings
            FROM glucose_readings
            WHERE user_id = ? AND reading_timestamp_utc >= ?
        """, (patient_id, week_ago)).fetchone()
        readings = row["readings"] if row else 0
        # Target: 3 readings/day = 21/week
        scores["glucose_logging"] = min(25, round(readings / 21 * 25))
    except Exception:
        scores["glucose_logging"] = 0

    # Medication adherence (20 points) — from actual medication logs
    try:
        row = conn.execute("""
            SELECT COUNT(*) as logs_count
            FROM medication_logs
            WHERE user_id = ? AND taken_timestamp_utc >= ?
        """, (patient_id, week_ago)).fetchone()
        logs_count = row["logs_count"] if row else 0
        # Query actual prescribed medication count for expected doses
        try:
            med_row = conn.execute(
                "SELECT COUNT(*) as med_count FROM medications WHERE user_id = ?",
                (patient_id,)
            ).fetchone()
            daily_doses = (med_row["med_count"] if med_row else 2) or 2
        except Exception:
            daily_doses = 2
        expected_doses = daily_doses * 7
        adh = min(1.0, logs_count / expected_doses) if expected_doses > 0 else 0.5
        scores["medication"] = round(adh * 20)
    except Exception:
        scores["medication"] = 10  # assume 50% if no data

    # Response rate (15 points) — how often user responds to agent messages
    try:
        rows = conn.execute("""
            SELECT role FROM conversation_history
            WHERE patient_id = ? AND timestamp_utc >= ?
            ORDER BY timestamp_utc
        """, (patient_id, week_ago)).fetchall()
        agent_msgs = sum(1 for r in rows if r["role"] == "assistant")
        user_msgs = sum(1 for r in rows if r["role"] == "user")
        rate = user_msgs / max(agent_msgs, 1)
        scores["response_rate"] = min(15, round(rate * 15))
    except Exception:
        scores["response_rate"] = 0

    # Streaks (15 points)
    streaks = get_patient_streaks(patient_id)
    streak_total = sum(s.get("current", 0) for k, s in streaks.items()
                       if isinstance(s, dict) and "current" in s)
    scores["streaks"] = min(15, streak_total * 2)

    total = sum(scores.values())
    risk_level = (
        "high_engagement" if total >= 70 else
        "moderate" if total >= 40 else
        "at_risk" if total >= 20 else
        "disengaging"
    )

    return {
        "total_score": total,
        "max_score": 100,
        "risk_level": risk_level,
        "components": scores,
        "recommendation": (
            "Patient is highly engaged - reinforce with rewards" if total >= 70 else
            "Moderate engagement - increase nudge frequency" if total >= 40 else
            "At risk of disengagement - schedule proactive check-in" if total >= 20 else
            "Disengaging - alert caregiver, try different approach"
        )
    }


# ============================================================================
# DAILY HEALTH CHALLENGES
# ============================================================================

def generate_daily_challenge(patient_id: str, hmm_context: Dict) -> Dict:
    """
    Generate a personalized micro-challenge based on HMM state and patient history.
    Drives engagement through achievable daily goals with voucher rewards.

    Challenge difficulty scales with patient state:
    - STABLE: stretch goals (push toward improvement)
    - WARNING: maintenance goals (keep current level)
    - CRISIS: minimal goals (any action counts)
    """
    state = hmm_context.get("current_state", "STABLE")
    latest = hmm_context.get("latest_obs", {})
    glucose = latest.get("glucose_avg") or 7.0
    steps = latest.get("steps_daily") or 3000
    adherence = latest.get("meds_adherence") or 0.7
    streaks = get_patient_streaks(patient_id)

    challenges = []

    if state == "CRISIS":
        # Minimal — any action helps
        challenges = [
            {"type": "glucose", "goal": "Log glucose once today",
             "metric": "glucose_readings", "target": 1, "reward": 2},
            {"type": "medication", "goal": "Take your next medication on time",
             "metric": "meds_adherence", "target": 0.5, "reward": 2},
            {"type": "rest", "goal": "Rest for 30 minutes this afternoon",
             "metric": "rest_period", "target": 1, "reward": 1},
        ]
    elif state == "WARNING":
        # Maintenance
        challenges = [
            {"type": "glucose", "goal": "Log glucose 2 times today",
             "metric": "glucose_readings", "target": 2, "reward": 1.5},
            {"type": "activity", "goal": f"Walk {max(2000, int(steps * 0.8))} steps today",
             "metric": "steps", "target": max(2000, int(steps * 0.8)), "reward": 1.5},
            {"type": "medication", "goal": "Take all medications today",
             "metric": "meds_adherence", "target": 0.9, "reward": 2},
            {"type": "hydration", "goal": "Drink 6 glasses of water today",
             "metric": "hydration", "target": 6, "reward": 1},
        ]
    else:
        # Stretch goals
        step_goal = max(4000, int(steps * 1.1))
        challenges = [
            {"type": "activity", "goal": f"Walk {step_goal} steps today",
             "metric": "steps", "target": step_goal, "reward": 2},
            {"type": "glucose", "goal": "Log glucose 3 times today",
             "metric": "glucose_readings", "target": 3, "reward": 1},
            {"type": "social", "goal": "Call a friend or family member today",
             "metric": "social_call", "target": 1, "reward": 1.5},
            {"type": "nutrition", "goal": "Eat a low-GI meal for lunch",
             "metric": "low_gi_meal", "target": 1, "reward": 1},
            {"type": "streak", "goal": "Keep your medication streak going!",
             "metric": "streak_maintain", "target": 1, "reward": 1},
        ]

    # Pick best challenge based on what patient needs most
    # Priority: weakest area first
    if adherence < 0.7:
        selected = next((c for c in challenges if c["type"] == "medication"), challenges[0])
    elif steps < 3000:
        selected = next((c for c in challenges if c["type"] == "activity"), challenges[0])
    elif glucose > 10:
        selected = next((c for c in challenges if c["type"] == "glucose"), challenges[0])
    else:
        # Rotate through remaining challenges
        import random
        selected = random.choice(challenges)

    return {
        "challenge": selected,
        "all_challenges": challenges,
        "difficulty": "easy" if state == "CRISIS" else "moderate" if state == "WARNING" else "stretch",
        "state_based": True,
    }


# ============================================================================
# CAREGIVER FATIGUE DETECTION
# ============================================================================

def detect_caregiver_fatigue(patient_id: str) -> Dict:
    """
    Detect caregiver burnout by analyzing response patterns to alerts.
    If caregiver stops responding or response times increase, flag potential fatigue.

    Signals:
    - Declining response rate to alerts
    - Increasing response delay
    - Missed critical alerts
    - No app check-ins from caregiver
    """
    conn = _get_db()
    try:
        now = int(time.time())
        week_ago = now - (7 * 86400)
        two_weeks_ago = now - (14 * 86400)

        result = {
            "fatigue_detected": False,
            "fatigue_level": "none",
            "signals": [],
            "recommendation": "",
        }

        # Count alerts sent this week vs last week
        try:
            this_week = conn.execute("""
                SELECT COUNT(*) as cnt FROM caregiver_alerts
                WHERE patient_id = ? AND timestamp_utc >= ?
            """, (patient_id, week_ago)).fetchone()

            last_week = conn.execute("""
                SELECT COUNT(*) as cnt FROM caregiver_alerts
                WHERE patient_id = ? AND timestamp_utc >= ? AND timestamp_utc < ?
            """, (patient_id, two_weeks_ago, week_ago)).fetchone()

            alerts_this_week = this_week["cnt"] if this_week else 0
            alerts_last_week = last_week["cnt"] if last_week else 0

            if alerts_this_week > 15:
                result["signals"].append("High alert volume this week (>15 alerts)")
            if alerts_last_week > 0 and alerts_this_week > alerts_last_week * 1.5:
                result["signals"].append("Alert volume increasing (50%+ over last week)")
        except Exception:
            pass

        # Check family alert response patterns
        try:
            family_alerts = conn.execute("""
                SELECT status, COUNT(*) as cnt FROM family_alerts
                WHERE user_id = ? AND timestamp_utc >= ?
                GROUP BY status
            """, (patient_id, week_ago)).fetchall()

            pending = sum(r["cnt"] for r in family_alerts if r["status"] == "pending")
            total = sum(r["cnt"] for r in family_alerts)
            if total > 0 and pending / total > 0.5:
                result["signals"].append(f"Family alerts unanswered: {pending}/{total}")
        except Exception:
            pass

        # Check nurse alert response patterns
        try:
            nurse_alerts = conn.execute("""
                SELECT status, COUNT(*) as cnt FROM nurse_alerts
                WHERE user_id = ? AND timestamp_utc >= ?
                GROUP BY status
            """, (patient_id, week_ago)).fetchall()

            pending = sum(r["cnt"] for r in nurse_alerts if r["status"] == "pending")
            total = sum(r["cnt"] for r in nurse_alerts)
            if total > 3 and pending / total > 0.6:
                result["signals"].append(f"Nurse alerts unresolved: {pending}/{total}")
        except Exception:
            pass

        # Score fatigue level
        signal_count = len(result["signals"])
        if signal_count >= 3:
            result["fatigue_detected"] = True
            result["fatigue_level"] = "high"
            result["recommendation"] = "Consider reducing alert frequency, scheduling caregiver support call"
        elif signal_count >= 2:
            result["fatigue_detected"] = True
            result["fatigue_level"] = "moderate"
            result["recommendation"] = "Monitor closely, consider consolidating alerts into daily digest"
        elif signal_count >= 1:
            result["fatigue_level"] = "mild"
            result["recommendation"] = "Some signs of alert overload, review alert thresholds"

        return result
    finally:
        conn.close()


# ============================================================================
# SMART GLUCOSE PREDICTION NARRATIVE
# ============================================================================

def generate_glucose_narrative(patient_id: str, hmm_context: Dict) -> Dict:
    """
    Generate a human-readable narrative about glucose patterns and predictions.
    Translates HMM/Monte Carlo outputs into actionable patient-facing language.

    Examples:
    - "Your glucose tends to spike after dinner. A 15-minute walk after eating could help."
    - "Mornings are your best time! Your readings are usually in range before 10am."
    - "Based on your pattern, today's glucose may rise in the afternoon. Consider a lighter lunch."
    """
    latest = hmm_context.get("latest_obs", {})
    glucose = latest.get("glucose_avg") or 7.0
    trend = hmm_context.get("trend", "STABLE")
    risk = hmm_context.get("risk_48h") or 0
    factors = hmm_context.get("top_factors", [])
    state = hmm_context.get("current_state", "STABLE")
    counterfactuals = hmm_context.get("counterfactuals", {})

    narratives = []

    # Current state narrative
    if glucose > 10:
        narratives.append(f"Your glucose is at {glucose:.1f} mmol/L, which is above the target range (4-10).")
    elif glucose < 4:
        narratives.append(f"Your glucose is low at {glucose:.1f} mmol/L. Please eat something with sugar soon.")
    else:
        narratives.append(f"Your glucose is at {glucose:.1f} mmol/L - looking good, within healthy range!")

    # Trend narrative
    if trend == "IMPROVING":
        narratives.append("Your readings have been improving over the past few days. Keep up the good work!")
    elif trend == "DECLINING":
        narratives.append("Your readings have been trending higher recently. Small changes now can help.")

    # Factor-based insights
    for factor in factors[:2]:
        feature = factor.get("feature", "")
        if "glucose" in feature and factor.get("value", 0) > 10:
            narratives.append("High glucose is the main concern right now.")
        elif "meds_adherence" in feature and factor.get("value", 0) < 0.7:
            narratives.append("Medication timing seems to be affecting your glucose. Setting a reminder may help.")
        elif "steps" in feature and factor.get("value", 0) < 3000:
            narratives.append("More movement could help stabilize your glucose levels.")

    # Counterfactual-based prediction
    if counterfactuals.get("perfect_medication"):
        cf = counterfactuals["perfect_medication"]
        if cf.get("risk_reduction_pct", 0) > 10:
            narratives.append(
                f"Taking medication consistently could reduce your risk by {cf['risk_reduction_pct']:.0f}%."
            )

    # Time-based prediction
    now_hour = datetime.now().hour
    if now_hour < 12:
        if glucose < 7:
            narratives.append("Morning readings look steady. A good start to the day!")
        else:
            narratives.append("Morning glucose is a bit high. Were carbs higher at dinner last night?")
    elif now_hour < 17:
        narratives.append("Afternoon is when glucose can spike after lunch. A walk after eating helps.")
    else:
        narratives.append("Evening time - try to keep dinner carbs moderate for better morning readings.")

    return {
        "narrative": " ".join(narratives[:4]),  # Keep it concise
        "glucose_current": glucose,
        "trend": trend,
        "risk_level": hmm_context.get("risk_level", "UNKNOWN"),
        "actionable_tip": narratives[-1] if narratives else "Keep logging your readings!",
    }


def _call_gemini(gemini_integration, prompt: str, max_retries: int = 3) -> Optional[Dict]:
    """
    Call Gemini and parse JSON response with retry + exponential backoff.
    Returns None on failure. Reusable across single-shot and multi-turn agent loops.
    """
    if not gemini_integration or not getattr(gemini_integration, 'api_key', None):
        return None

    for attempt in range(max_retries):
        try:
            model = gemini_integration._get_model()
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(model.generate_content, prompt)
                response = future.result(timeout=40)  # 40 second timeout per Gemini call
            text = (response.text or '').strip()
            if not text:
                logger.warning(f"Gemini returned empty response on attempt {attempt + 1}")
                continue

            # Clean markdown fences
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Gemini returned non-JSON (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
        except Exception as e:
            logger.error(f"Gemini call failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    return None


def _get_merlion_forecast(observations: List[Dict]) -> Dict:
    """
    Get 45-min glucose forecast from Merlion risk engine.
    Currently uses Gemini under the hood — swappable to real Merlion API
    by changing only MerlionRiskEngine._calculate_real_merlion_risk().
    """
    try:
        try:
            from merlion_risk_engine import MerlionRiskEngine
        except ModuleNotFoundError:
            from core.merlion_risk_engine import MerlionRiskEngine
        engine = MerlionRiskEngine()
        glucose_history = [obs.get("glucose_avg") for obs in observations[-12:] if obs.get("glucose_avg") is not None]
        if len(glucose_history) < 3:
            return {"risk_level": "unknown", "message": "Insufficient glucose data for forecast"}
        return engine.calculate_risk(glucose_history)
    except Exception as e:
        logger.warning(f"Merlion forecast failed: {e}")
        return {
            "prob_crisis_45min": 0,
            "volatility_index": 0,
            "forecast_curve": [],
            "velocity": 0,
            "acceleration": 0,
            "engine": "failed",
        }


def _generate_fallback_response(hmm_context: Dict, patient_profile: Dict) -> Dict:
    """Safe fallback when Gemini is unavailable. Uses HMM data for rule-based response."""
    state = hmm_context.get("current_state", "STABLE")
    risk = hmm_context.get("risk_48h", 0)
    latest = hmm_context.get("latest_obs", {})
    glucose = latest.get("glucose_avg")

    tool_calls = []

    if state == "CRISIS":
        message = (
            "Your health readings need attention right now. "
            "Please rest and drink water. A nurse will contact you soon."
        )
        tone = "urgent"
        tool_calls = [
            {"tool": "alert_nurse", "args": {"priority": "critical", "reason": f"Crisis state — glucose {glucose}"}},
            {"tool": "send_caregiver_alert", "args": {"message": f"Patient in crisis state. Glucose: {glucose}", "severity": "critical"}},
        ]
    elif state == "WARNING":
        message = (
            "I notice some changes in your health lah. "
            "Remember to take medicine and check glucose ok?"
        )
        tone = "concerned"
        tool_calls = [
            {"tool": "set_reminder", "args": {"reminder_time": "20:00", "message": "Time to take medicine!", "reminder_type": "medication"}},
            {"tool": "alert_nurse", "args": {"priority": "medium", "reason": f"Warning state — risk {risk:.0f}%"}},
        ]
    else:
        message = (
            "Your health looking stable lah. Keep it up! "
            "Remember to stay active today."
        )
        tone = "celebratory"

    return {
        "message_to_patient": message,
        "internal_reasoning": f"Fallback response — API unavailable. State={state}, Risk={risk}%",
        "tone": tone,
        "tool_calls": tool_calls,
        "priority_factor": "medication_adherence" if state != "STABLE" else "maintain_routine",
        "follow_up_needed": state != "STABLE",
        "escalation_needed": state == "CRISIS",
    }


# ============================================================================
# FEATURE 7: Drug Interaction Checking
# ============================================================================

DRUG_INTERACTIONS = {
    ("metformin", "alcohol"): {
        "severity": "MAJOR", "mechanism": "Lactic acidosis risk",
        "recommendation": "Avoid concurrent use. Monitor lactate levels.",
        "evidence": "Well-established"
    },
    ("metformin", "contrast dye"): {
        "severity": "MAJOR", "mechanism": "Acute kidney injury risk",
        "recommendation": "Hold metformin 48h before and after contrast procedures.",
        "evidence": "Clinical guideline (ACR 2024)"
    },
    ("insulin", "sulfonylureas"): {
        "severity": "MAJOR", "mechanism": "Additive hypoglycemia — both lower glucose independently",
        "recommendation": "Reduce sulfonylurea dose by 50%. Monitor glucose q4h.",
        "evidence": "Well-established"
    },
    ("insulin", "beta-blockers"): {
        "severity": "MAJOR", "mechanism": "Beta-blockers mask hypoglycemia symptoms (tremor, tachycardia)",
        "recommendation": "Use cardioselective beta-blocker (bisoprolol). Educate on atypical hypo signs.",
        "evidence": "Well-established"
    },
    ("ace inhibitors", "potassium supplements"): {
        "severity": "MAJOR", "mechanism": "Hyperkalemia risk — ACE inhibitors retain potassium",
        "recommendation": "Monitor serum potassium. Avoid K+ supplements unless documented hypokalemia.",
        "evidence": "Well-established"
    },
    ("ace inhibitors", "nsaids"): {
        "severity": "MODERATE", "mechanism": "NSAIDs reduce antihypertensive effect and increase renal risk",
        "recommendation": "Use paracetamol instead. If NSAID required, monitor renal function and BP.",
        "evidence": "Well-established"
    },
    ("statins", "grapefruit"): {
        "severity": "MODERATE", "mechanism": "CYP3A4 inhibition increases statin plasma levels",
        "recommendation": "Avoid large amounts of grapefruit. Consider pravastatin (not CYP3A4 metabolized).",
        "evidence": "Moderate"
    },
    ("metformin", "cimetidine"): {
        "severity": "MODERATE", "mechanism": "Cimetidine reduces renal clearance of metformin by 50%",
        "recommendation": "Monitor metformin levels. Consider ranitidine or famotidine instead.",
        "evidence": "Moderate"
    },
    ("metformin", "corticosteroids"): {
        "severity": "MODERATE", "mechanism": "Corticosteroids raise blood glucose, opposing metformin",
        "recommendation": "Monitor glucose more frequently. May need temporary dose increase.",
        "evidence": "Well-established"
    },
    ("sulfonylureas", "alcohol"): {
        "severity": "MAJOR", "mechanism": "Disulfiram-like reaction + severe hypoglycemia",
        "recommendation": "Avoid alcohol. If unavoidable, minimal amounts with food.",
        "evidence": "Well-established"
    },
    ("amlodipine", "simvastatin"): {
        "severity": "MODERATE", "mechanism": "Amlodipine increases simvastatin exposure via CYP3A4",
        "recommendation": "Limit simvastatin to 20mg daily. Consider atorvastatin as alternative.",
        "evidence": "FDA recommendation"
    },
    ("warfarin", "metformin"): {
        "severity": "MINOR", "mechanism": "Possible mild increase in anticoagulant effect",
        "recommendation": "Monitor INR when starting or changing metformin dose.",
        "evidence": "Limited"
    },
    ("benzodiazepines", "opioids"): {
        "severity": "CONTRAINDICATED", "mechanism": "Respiratory depression — HIGH MORTALITY RISK in elderly",
        "recommendation": "AVOID concurrent use. If unavoidable, lowest doses with continuous monitoring.",
        "evidence": "FDA Black Box Warning"
    },
    ("digoxin", "amiodarone"): {
        "severity": "MAJOR", "mechanism": "Amiodarone increases digoxin levels 70-100%",
        "recommendation": "Reduce digoxin dose by 50%. Monitor digoxin levels weekly.",
        "evidence": "Well-established"
    },
    ("metformin", "dapagliflozin"): {
        "severity": "MINOR", "mechanism": "Additive glucose-lowering (generally beneficial)",
        "recommendation": "Monitor for hypoglycemia. Well-tolerated combination in most patients.",
        "evidence": "DECLARE-TIMI 58 trial"
    },
    ("ace inhibitors", "arbs"): {
        "severity": "MAJOR", "mechanism": "Dual RAAS blockade — hyperkalemia + renal failure risk",
        "recommendation": "Do NOT combine. Use one or the other.",
        "evidence": "ONTARGET trial"
    },
}

DRUG_CLASS_MAP = {
    "metformin": ["metformin", "biguanides"],
    "lisinopril": ["lisinopril", "ace inhibitors", "acei"],
    "enalapril": ["enalapril", "ace inhibitors", "acei"],
    "ramipril": ["ramipril", "ace inhibitors", "acei"],
    "perindopril": ["perindopril", "ace inhibitors", "acei"],
    "atorvastatin": ["atorvastatin", "statins"],
    "simvastatin": ["simvastatin", "statins"],
    "rosuvastatin": ["rosuvastatin", "statins"],
    "pravastatin": ["pravastatin", "statins"],
    "glipizide": ["glipizide", "sulfonylureas"],
    "glyburide": ["glyburide", "sulfonylureas"],
    "glimepiride": ["glimepiride", "sulfonylureas"],
    "gliclazide": ["gliclazide", "sulfonylureas"],
    "amlodipine": ["amlodipine", "calcium channel blockers"],
    "nifedipine": ["nifedipine", "calcium channel blockers"],
    "insulin": ["insulin"],
    "lorazepam": ["lorazepam", "benzodiazepines"],
    "diazepam": ["diazepam", "benzodiazepines"],
    "alprazolam": ["alprazolam", "benzodiazepines"],
    "ibuprofen": ["ibuprofen", "nsaids"],
    "naproxen": ["naproxen", "nsaids"],
    "aspirin": ["aspirin", "nsaids"],
    "losartan": ["losartan", "arbs"],
    "valsartan": ["valsartan", "arbs"],
    "telmisartan": ["telmisartan", "arbs"],
    "dapagliflozin": ["dapagliflozin", "sglt2 inhibitors"],
    "empagliflozin": ["empagliflozin", "sglt2 inhibitors"],
    # Opioids
    "morphine": ["morphine", "opioids"],
    "codeine": ["codeine", "opioids"],
    "tramadol": ["tramadol", "opioids"],
    "oxycodone": ["oxycodone", "opioids"],
    "fentanyl": ["fentanyl", "opioids"],
    "hydrocodone": ["hydrocodone", "opioids"],
    # Additional geriatric medications
    "warfarin": ["warfarin", "anticoagulants"],
    "digoxin": ["digoxin", "cardiac glycosides"],
    "furosemide": ["furosemide", "loop diuretics"],
    "hydrochlorothiazide": ["hydrochlorothiazide", "thiazide diuretics"],
    "prednisone": ["prednisone", "corticosteroids"],
    "prednisolone": ["prednisolone", "corticosteroids"],
    "dexamethasone": ["dexamethasone", "corticosteroids"],
    "omeprazole": ["omeprazole", "proton pump inhibitors", "ppis"],
    "pantoprazole": ["pantoprazole", "proton pump inhibitors", "ppis"],
    "sitagliptin": ["sitagliptin", "dpp-4 inhibitors"],
    "linagliptin": ["linagliptin", "dpp-4 inhibitors"],
    "pioglitazone": ["pioglitazone", "thiazolidinediones"],
}


def _drug_matches_class(drug_name: str, class_or_drug: str) -> bool:
    """Check if a specific drug matches a drug class or name."""
    drug_lower = drug_name.lower().strip()
    class_lower = class_or_drug.lower().strip()
    if drug_lower == class_lower:
        return True
    classes = DRUG_CLASS_MAP.get(drug_lower, [drug_lower])
    return class_lower in classes


def check_drug_interactions(current_medications: List[str], proposed_medication: str = None) -> Dict:
    """
    Check drug interactions. Swappable to DrugBank/OpenFDA API.
    Returns severity-ranked interactions with mechanisms and recommendations.
    """
    all_meds = [m.lower().strip().split()[0] for m in current_medications if m and m.strip()]
    if proposed_medication and proposed_medication.strip():
        proposed_normalized = proposed_medication.lower().strip().split()[0]
        check_pairs = [(proposed_normalized, m) for m in all_meds]
    elif proposed_medication and not proposed_medication.strip():
        check_pairs = []
    else:
        check_pairs = [(all_meds[i], all_meds[j])
                       for i in range(len(all_meds))
                       for j in range(i + 1, len(all_meds))]

    interactions = []
    seen = set()
    for med_a, med_b in check_pairs:
        pair_key = tuple(sorted([med_a, med_b]))
        if pair_key in seen:
            continue
        for (class_a, class_b), data in DRUG_INTERACTIONS.items():
            if (_drug_matches_class(med_a, class_a) and _drug_matches_class(med_b, class_b)) or \
               (_drug_matches_class(med_a, class_b) and _drug_matches_class(med_b, class_a)):
                interaction = data.copy()
                interaction["drugs"] = [med_a, med_b]
                interactions.append(interaction)
                seen.add(pair_key)
                break

    severity_order = {"CONTRAINDICATED": 0, "MAJOR": 1, "MODERATE": 2, "MINOR": 3}
    interactions.sort(key=lambda x: severity_order.get(x["severity"], 99))

    return {
        "interactions_found": len(interactions),
        "has_contraindicated": any(i["severity"] == "CONTRAINDICATED" for i in interactions),
        "has_major": any(i["severity"] == "MAJOR" for i in interactions),
        "interactions": interactions,
    }


def _exec_check_drug_interactions(args, patient_id, patient_profile, conn, now):
    """Tool execution wrapper for drug interaction checking."""
    meds_str = patient_profile.get("medications", "")
    if isinstance(meds_str, str):
        current_meds = [m.strip() for m in meds_str.split(",") if m.strip()]
    else:
        current_meds = meds_str or []
    proposed = args.get("proposed_medication")
    result = check_drug_interactions(current_meds, proposed)
    conn.execute("""
        INSERT INTO agent_actions_log
        (patient_id, timestamp_utc, action_type, action_data, status)
        VALUES (?, ?, 'drug_interaction_check', ?, 'delivered')
    """, (patient_id, now, json.dumps(result)))
    conn.commit()
    return {"success": True, **result}


# ============================================================================
# FEATURE 4: Response Safety Classifier
# ============================================================================

SAFETY_FALLBACK_MESSAGE = "I want to help you, but let me check with your doctor first before giving advice on this. Please consult your healthcare provider for guidance."

def classify_response_safety(message: str, patient_profile: Dict, hmm_context: Dict, gemini_integration) -> Dict:
    """
    Healthcare safety classifier. Checks 6 dimensions before response reaches patient.
    Separate Gemini call — independent from the agent reasoning loop.

    FAIL-CLOSED: If the classifier cannot run (API down, error, etc.), the response
    is blocked and replaced with a safe fallback. Healthcare AI must never fail-open.
    """
    if not message:
        return {"verdict": "SAFE", "flags": []}

    # If Gemini is unavailable, FAIL CLOSED — block the response
    if not gemini_integration:
        logger.warning("Safety classifier: Gemini unavailable — BLOCKING response (fail-closed)")
        return {"verdict": "UNSAFE", "flags": ["SYSTEM: Safety classifier unavailable, response blocked per fail-closed policy"],
                "corrected_message": SAFETY_FALLBACK_MESSAGE}

    # De-identified patient context for safety check (no PII sent)
    medications = patient_profile.get("medications", "unknown")
    state = hmm_context.get("current_state", "STABLE")
    age = patient_profile.get("age", 67)
    prompt = f"""SAFETY CLASSIFIER — Review this healthcare AI response for safety.

PATIENT CONTEXT (de-identified): {age}yo elderly Singaporean, State: {state}, Medications: {medications}

AI RESPONSE TO CHECK:
"{message[:800]}"

Check these 6 dimensions:
1. MEDICAL_CLAIM: Specific dosage/diagnosis claims that should come from a doctor?
2. EMOTIONAL_MISMATCH: Tone inappropriate for {state} state? (e.g., cheerful during CRISIS)
3. HALLUCINATION: References medications patient doesn't take? Known: {medications}
4. CULTURAL_ISSUE: Inappropriate for elderly Singaporean?
5. SCOPE_VIOLATION: Goes beyond chronic disease management?
6. DANGEROUS_ADVICE: Could cause harm if followed? (stop meds, ignore symptoms)

Return ONLY JSON:
{{"verdict": "SAFE", "flags": [], "corrected_message": null}}
OR
{{"verdict": "CAUTION", "flags": ["flag_type: brief description"], "corrected_message": null}}
OR
{{"verdict": "UNSAFE", "flags": ["flag_type: brief description"], "corrected_message": "safe version of the message"}}"""
    try:
        result = _call_gemini(gemini_integration, prompt)
        if result and isinstance(result, dict) and "verdict" in result:
            return result
        # Gemini returned something unexpected — fail closed
        logger.warning("Safety classifier: unexpected response format — BLOCKING (fail-closed)")
        return {"verdict": "UNSAFE", "flags": ["SYSTEM: Classifier returned invalid format"],
                "corrected_message": SAFETY_FALLBACK_MESSAGE}
    except Exception as e:
        # Any error = fail closed. Healthcare AI must never let unvetted responses through.
        logger.error(f"Safety classifier FAILED — BLOCKING response (fail-closed): {e}")
        return {"verdict": "UNSAFE", "flags": [f"SYSTEM: Classifier error — {str(e)[:100]}"],
                "corrected_message": SAFETY_FALLBACK_MESSAGE}


def _apply_safety_filter(result: Dict, patient_profile: Dict, hmm_context: Dict, gemini_integration) -> Dict:
    """Apply safety classification to agent response. Modifies result if unsafe."""
    msg = result.get("message_to_patient", "")
    if not msg:
        return result
    safety = classify_response_safety(msg, patient_profile, hmm_context, gemini_integration)
    verdict = safety.get("verdict", "SAFE")
    if verdict == "UNSAFE":
        corrected = safety.get("corrected_message")
        result["_original_unsafe_message"] = msg
        result["message_to_patient"] = corrected if corrected else "I want to help you lah, but let me check with your doctor first before giving advice on this. Stay safe!"
        _log_safety_event(patient_profile.get("id", "P001"), "UNSAFE", safety.get("flags", []), msg)
    elif verdict == "CAUTION":
        result["message_to_patient"] = msg + "\n\n(Please always consult your doctor for medical decisions.)"
        _log_safety_event(patient_profile.get("id", "P001"), "CAUTION", safety.get("flags", []), msg)
    result["_safety_verdict"] = verdict
    result["_safety_flags"] = safety.get("flags", [])
    return result


def _log_safety_event(patient_id, verdict, flags, original_message):
    """Log safety classifier events for audit."""
    try:
        conn = _get_db()
        try:
            conn.execute("""
                INSERT INTO agent_actions_log
                (patient_id, timestamp_utc, action_type, action_data, tool_name, status)
                VALUES (?, ?, 'safety_flag', ?, 'safety_classifier', ?)
            """, (patient_id, int(time.time()),
                  json.dumps({"verdict": verdict, "flags": flags, "message_preview": original_message[:200]}),
                  verdict.lower()))
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Safety event logging failed: {e}")


# ============================================================================
# FEATURE 3: Outcome-Based Tool Selection
# ============================================================================

def compute_tool_effectiveness_scores(patient_id: str) -> Dict:
    """
    Reinforcement learning from clinical outcomes.
    For each (tool, HMM state) pair: compute effectiveness with exponential decay.
    Half-life 14 days — recent outcomes weighted more than old ones.
    """
    import math
    try:
        conn = _get_db()
        try:
            now = int(time.time())
            state_order = {"STABLE": 0, "WARNING": 1, "CRISIS": 2}
            rows = conn.execute("""
                SELECT tool_name, hmm_state, timestamp_utc
                FROM agent_actions_log
                WHERE patient_id = ? AND action_type = 'tool_execution' AND tool_name IS NOT NULL
                ORDER BY timestamp_utc ASC
            """, (patient_id,)).fetchall()
            if not rows:
                return {}
            scores = {}
            for r in rows:
                tool = r["tool_name"]
                state = r["hmm_state"] or "UNKNOWN"
                ts = r["timestamp_utc"]
                age_days = max(0, (now - ts) / 86400)
                weight = math.exp(-0.693 * age_days / 14)
                key = f"{tool}|{state}"
                if key not in scores:
                    scores[key] = {"total_w": 0, "improved_w": 0, "uses": 0, "tool": tool, "state": state}
                scores[key]["total_w"] += weight
                scores[key]["uses"] += 1
                next_row = conn.execute("""
                    SELECT hmm_state FROM agent_actions_log
                    WHERE patient_id = ? AND timestamp_utc > ? AND timestamp_utc <= ?
                    AND hmm_state IS NOT NULL
                    ORDER BY timestamp_utc ASC LIMIT 1
                """, (patient_id, ts, ts + 86400)).fetchone()
                if next_row and state in state_order and next_row["hmm_state"] in state_order:
                    if state_order[next_row["hmm_state"]] < state_order[state]:
                        scores[key]["improved_w"] += weight
        finally:
            conn.close()
        result = {}
        for data in scores.values():
            tool, state = data["tool"], data["state"]
            if tool not in result:
                result[tool] = {}
            eff = round(data["improved_w"] / max(data["total_w"], 0.001) * 100, 1)
            result[tool][state] = {
                "effectiveness_pct": eff,
                "uses": data["uses"],
                "recommendation": "EFFECTIVE" if eff >= 50 else "MODERATE" if eff >= 25 else "AVOID",
            }
        return result
    except Exception as e:
        logger.warning(f"Tool effectiveness computation failed: {e}")
        return {}


# ============================================================================
# FEATURE 2: Proactive Scheduler
# ============================================================================

def _get_all_patient_ids() -> List[str]:
    """Get all patient IDs from database."""
    try:
        conn = _get_db()
        try:
            rows = conn.execute("SELECT user_id FROM patients").fetchall()
        finally:
            conn.close()
        return [r[0] for r in rows] if rows else ["P001"]
    except Exception:
        return ["P001"]


def _get_patient_profile_from_db(patient_id: str) -> Dict:
    """Fetch patient profile from DB. Uses explicit column list (no SELECT *)."""
    default_profile = {
        "id": patient_id, "name": "Patient", "age": 67,
        "conditions": ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
        "medications": ["Metformin 500mg", "Lisinopril 10mg", "Atorvastatin 20mg", "Aspirin 100mg"]
    }
    try:
        conn = _get_db()
        try:
            # Explicit columns — never SELECT *, prevents accidental PII leakage
            row = conn.execute(
                "SELECT user_id, name, age, conditions, medications FROM patients WHERE user_id = ?",
                (patient_id,)
            ).fetchone()
        finally:
            conn.close()
        if row:
            profile = dict(row)
            profile["id"] = patient_id
            for field in ["conditions", "medications"]:
                if field in profile and isinstance(profile[field], str):
                    try:
                        profile[field] = json.loads(profile[field])
                    except (json.JSONDecodeError, TypeError):
                        profile[field] = [m.strip() for m in profile[field].split(",") if m.strip()]
            return profile
    except Exception as e:
        logger.warning(f"Profile fetch failed for {patient_id}: {e}")
    return default_profile


def _check_proactive_triggers(patient_id: str) -> List[Dict]:
    """Check 6 proactive trigger conditions for a patient."""
    triggers = []
    conn = _get_db()
    try:
        now = int(time.time())

        # 1. Glucose rising (Merlion velocity)
        try:
            try:
                from hmm_engine import HMMEngine
            except ModuleNotFoundError:
                from core.hmm_engine import HMMEngine
            engine = HMMEngine()
            obs = engine.fetch_observations(days=3, patient_id=patient_id)
            if obs:
                merlion = _get_merlion_forecast(obs)
                if merlion.get("velocity", 0) > 0.3 and merlion.get("acceleration", 0) > 0:
                    triggers.append({"type": "glucose_rising", "reason": f"Glucose rising: velocity={merlion['velocity']:.2f}, acceleration={merlion['acceleration']:.2f}"})
        except Exception as e:
            logger.error(f"Proactive trigger 'glucose_rising' failed for {patient_id}: {e}")

        # 2. Sustained WARNING/CRISIS
        try:
            recent = conn.execute("""
                SELECT hmm_state FROM agent_actions_log
                WHERE patient_id = ? AND hmm_state IS NOT NULL
                ORDER BY timestamp_utc DESC LIMIT 3
            """, (patient_id,)).fetchall()
            if len(recent) >= 2 and all(r["hmm_state"] in ("WARNING", "CRISIS") for r in recent):
                triggers.append({"type": "sustained_risk", "reason": f"Sustained {recent[0]['hmm_state']} state for last {len(recent)} observations"})
        except Exception as e:
            logger.error(f"Proactive trigger 'sustained_risk' failed for {patient_id}: {e}")

        # 3. Logging gap (no glucose reading in 6+ hours)
        try:
            last_reading = conn.execute("""
                SELECT MAX(reading_timestamp_utc) as last_ts FROM glucose_readings WHERE user_id = ?
            """, (patient_id,)).fetchone()
            if last_reading and last_reading["last_ts"]:
                hours_gap = (now - last_reading["last_ts"]) / 3600
                if hours_gap > 6:
                    triggers.append({"type": "logging_gap", "reason": f"No glucose reading for {hours_gap:.0f} hours"})
        except Exception as e:
            logger.error(f"Proactive trigger 'logging_gap' failed for {patient_id}: {e}")

        # 4. Medication nudge (optimal time + not logged today)
        try:
            nudge_times = get_optimal_nudge_times(patient_id)
            current_hour = datetime.now().hour
            best_hours = nudge_times.get("best_hours", [8, 14, 20])
            if current_hour in best_hours:
                today_start = int(datetime.now().replace(hour=0, minute=0, second=0).timestamp())
                med_today = conn.execute("""
                    SELECT COUNT(*) as cnt FROM medication_logs WHERE taken_timestamp_utc >= ? AND user_id = ?
                """, (today_start, patient_id)).fetchone()
                if med_today and med_today["cnt"] == 0:
                    triggers.append({"type": "medication_nudge", "reason": "Optimal nudge time and no medication logged today"})
        except Exception as e:
            logger.error(f"Proactive trigger 'medication_nudge' failed for {patient_id}: {e}")

        # 5. Streak about to break
        try:
            streaks = get_patient_streaks(patient_id)
            for streak_type, data in streaks.items():
                if isinstance(data, dict) and data.get("current", 0) >= 3:
                    last_action = data.get("last_action", "")
                    if last_action and last_action != datetime.now().strftime("%Y-%m-%d"):
                        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
                        if last_action == yesterday:
                            triggers.append({"type": "streak_save", "reason": f"{streak_type} streak ({data.get('current', 0)} days) at risk — no action today"})
                            break
        except Exception as e:
            logger.error(f"Proactive trigger 'streak_save' failed for {patient_id}: {e}")

        # 6. Mood follow-up
        try:
            last_msg = conn.execute("""
                SELECT message FROM conversation_history
                WHERE patient_id = ? AND role = 'user'
                ORDER BY timestamp_utc DESC LIMIT 1
            """, (patient_id,)).fetchone()
            if last_msg and last_msg["message"]:
                mood = detect_mood_from_message(last_msg["message"])
                if mood.get("mood") in ("frustrated", "sad", "worried"):
                    triggers.append({"type": "mood_followup", "reason": f"Previous mood: {mood['mood']} — follow-up needed"})
        except Exception as e:
            logger.error(f"Proactive trigger 'mood_followup' failed for {patient_id}: {e}")
    finally:
        conn.close()

    return triggers


def run_proactive_scan(patient_ids: List[str] = None) -> List[Dict]:
    """
    Proactive scheduler: scan patients and initiate contact for triggered conditions.
    Called by cron/scheduler or API endpoint.
    """
    ensure_runtime_tables()
    if patient_ids is None:
        patient_ids = _get_all_patient_ids()
    results = []
    for pid in patient_ids:
        triggers = _check_proactive_triggers(pid)
        for trigger in triggers[:2]:  # max 2 triggers per patient per scan
            try:
                try:
                    from hmm_engine import HMMEngine
                except ModuleNotFoundError:
                    from core.hmm_engine import HMMEngine
                engine = HMMEngine()
                obs = engine.fetch_observations(days=7, patient_id=pid)
                profile = _get_patient_profile_from_db(pid)
                gi = None
                try:
                    try:
                        from gemini_integration import GeminiIntegration
                    except ModuleNotFoundError:
                        from core.gemini_integration import GeminiIntegration
                    gi = GeminiIntegration()
                except Exception:
                    pass
                result = run_agent(
                    patient_profile=profile, hmm_engine=engine, observations=obs,
                    patient_id=pid, user_message=None, gemini_integration=gi,
                )
                # Store in proactive_checkins
                conn = _get_db()
                try:
                    conn.execute("""
                        INSERT INTO proactive_checkins
                        (patient_id, scheduled_time, checkin_type, reason, status, created_at, completed_at)
                        VALUES (?, ?, ?, ?, 'completed', ?, ?)
                    """, (pid, datetime.now().isoformat(), trigger["type"],
                          trigger["reason"], int(time.time()), int(time.time())))
                    conn.commit()
                finally:
                    conn.close()
                results.append({"patient_id": pid, "trigger": trigger,
                                "message": result.get("message_to_patient", "")})
            except Exception as e:
                logger.error(f"Proactive scan failed for {pid}/{trigger['type']}: {e}")
    return results


# ============================================================================
# FEATURE 6: Caregiver Bidirectional Communication
# ============================================================================

def process_caregiver_response(alert_id: int, caregiver_id: str, response_type: str, message: str = "") -> Dict:
    """
    Handle incoming caregiver responses to alerts.
    Closes the communication loop: alert -> acknowledgment/escalation/note.
    """
    conn = _get_db()
    try:
        now = int(time.time())
        conn.execute("""
            INSERT INTO caregiver_responses (alert_id, caregiver_id, response_type, message, timestamp_utc)
            VALUES (?, ?, ?, ?, ?)
        """, (alert_id, caregiver_id, response_type, message, now))
        alert = None
        try:
            alert = conn.execute("SELECT * FROM caregiver_alerts WHERE id = ?", (alert_id,)).fetchone()
        except Exception:
            pass
        result = {"success": True, "response_type": response_type, "alert_id": alert_id}
        if alert:
            patient_id = alert["patient_id"]
            if response_type == "acknowledged":
                try:
                    conn.execute("UPDATE caregiver_alerts SET delivery_results_json = json_set(COALESCE(delivery_results_json, '{}'), '$.caregiver_status', 'acknowledged') WHERE id = ?", (alert_id,))
                except Exception:
                    pass
                result["status"] = "Alert acknowledged"
            elif response_type == "on_the_way":
                result["status"] = "Caregiver en route"
            elif response_type == "need_help":
                conn.execute("""
                    INSERT INTO nurse_alerts (user_id, timestamp_utc, priority, reason, status)
                    VALUES (?, ?, 'high', ?, 'pending')
                """, (patient_id, now, f"Caregiver needs help: {message[:200]}"))
                result["status"] = "Escalated to nurse"
            elif response_type == "escalate":
                conn.execute("""
                    INSERT INTO nurse_alerts (user_id, timestamp_utc, priority, reason, status)
                    VALUES (?, ?, 'critical', ?, 'pending')
                """, (patient_id, now, f"Caregiver escalation: {message[:200]}"))
                result["status"] = "Critical escalation created"
            elif response_type == "note":
                conn.execute("""
                    INSERT OR REPLACE INTO agent_memory
                    (patient_id, memory_type, key, value_json, confidence, created_at, updated_at, source)
                    VALUES (?, 'episodic', ?, ?, 0.8, ?, ?, 'caregiver')
                """, (patient_id, f"caregiver_note_{now}",
                      json.dumps({"value": message, "caregiver_id": caregiver_id}), now, now))
                result["status"] = "Note stored in patient memory"
        conn.commit()
    finally:
        conn.close()
    return result


def compute_caregiver_burden_score(patient_id: str) -> Dict:
    """
    Enhanced caregiver burden scoring: 0-100 with 4 weighted factors.
    Auto-enables digest mode at score > 70 to prevent caregiver burnout.
    """
    conn = _get_db()
    try:
        now = int(time.time())
        week_ago = now - (7 * 86400)
        score = 0
        signals = []

        # Factor 1: Alert volume weighted by severity (0-30 pts)
        try:
            rows = conn.execute("""
                SELECT severity, COUNT(*) as cnt FROM caregiver_alerts
                WHERE patient_id = ? AND timestamp_utc >= ? GROUP BY severity
            """, (patient_id, week_ago)).fetchall()
            severity_weights = {"critical": 5, "warning": 2, "info": 1}
            weighted_vol = sum(r["cnt"] * severity_weights.get(r["severity"], 1) for r in rows)
            vol_score = min(30, weighted_vol * 2)
            score += vol_score
            if vol_score > 20:
                signals.append(f"High alert volume ({weighted_vol} weighted)")
        except Exception:
            pass

        # Factor 2: Response latency trend (0-25 pts)
        try:
            responses = conn.execute("""
                SELECT cr.timestamp_utc - ca.timestamp_utc as latency
                FROM caregiver_responses cr JOIN caregiver_alerts ca ON cr.alert_id = ca.id
                WHERE ca.patient_id = ? AND cr.timestamp_utc >= ?
                ORDER BY cr.timestamp_utc ASC
            """, (patient_id, week_ago)).fetchall()
            if len(responses) >= 4:
                latencies = [r["latency"] for r in responses if r["latency"] and r["latency"] > 0]
                if len(latencies) >= 4:
                    mid = len(latencies) // 2
                    early_avg = sum(latencies[:mid]) / mid
                    late_avg = sum(latencies[mid:]) / (len(latencies) - mid)
                    if early_avg > 0 and late_avg > early_avg * 1.5:
                        lat_score = min(25, int((late_avg / early_avg - 1) * 25))
                        score += lat_score
                        signals.append("Response times increasing (possible burnout)")
        except Exception:
            pass

        # Factor 3: Unresolved alert ratio (0-25 pts)
        try:
            total = conn.execute("""
                SELECT COUNT(*) as cnt FROM caregiver_alerts
                WHERE patient_id = ? AND timestamp_utc >= ?
            """, (patient_id, week_ago)).fetchone()["cnt"]
            responded = conn.execute("""
                SELECT COUNT(DISTINCT ca.id) as cnt FROM caregiver_alerts ca
                JOIN caregiver_responses cr ON cr.alert_id = ca.id
                WHERE ca.patient_id = ? AND ca.timestamp_utc >= ?
            """, (patient_id, week_ago)).fetchone()["cnt"]
            if total > 0:
                unresolved = 1 - (responded / total)
                ratio_score = int(unresolved * 25)
                score += ratio_score
                if unresolved > 0.5:
                    signals.append(f"{int(unresolved * 100)}% alerts unresolved")
        except Exception:
            pass

        # Factor 4: Continuous alerting > 48h (0-20 pts)
        try:
            first_recent = conn.execute("""
                SELECT MIN(timestamp_utc) as first_ts FROM caregiver_alerts
                WHERE patient_id = ? AND timestamp_utc >= ? AND severity IN ('critical', 'warning')
            """, (patient_id, week_ago)).fetchone()
            last_alert = conn.execute("""
                SELECT MAX(timestamp_utc) as last_ts FROM caregiver_alerts
                WHERE patient_id = ? AND severity IN ('critical', 'warning')
            """, (patient_id,)).fetchone()
            if first_recent and last_alert and first_recent["first_ts"] and last_alert["last_ts"]:
                continuous_h = (last_alert["last_ts"] - first_recent["first_ts"]) / 3600
                if continuous_h > 48:
                    dur_score = min(20, int((continuous_h - 48) / 24 * 10))
                    score += dur_score
                    signals.append(f"Continuous alerting for {int(continuous_h)}h")
        except Exception:
            pass
    finally:
        conn.close()

    score = min(100, score)
    return {
        "burden_score": score,
        "level": "critical" if score > 70 else "high" if score > 50 else "moderate" if score > 30 else "low",
        "signals": signals,
        "recommendation": (
            "Switch to daily digest mode — caregiver needs a break" if score > 70 else
            "Consider reducing alert frequency" if score > 50 else
            "Monitor caregiver response patterns" if score > 30 else
            "Caregiver burden is manageable"
        ),
        "auto_digest_mode": score > 70,
    }


# ============================================================================
# FEATURE 5: Multi-Patient Clinical Triage Dashboard
# ============================================================================

def compute_attention_score(patient_id: str) -> Dict:
    """How much clinical attention has this patient received recently?"""
    try:
        conn = _get_db()
        try:
            now = int(time.time())
            week_ago = now - (7 * 86400)
            nurse_count, last_nurse = 0, 0
            try:
                row = conn.execute("""
                    SELECT COUNT(*) as cnt, MAX(timestamp_utc) as last_ts FROM nurse_alerts
                    WHERE user_id = ? AND timestamp_utc >= ?
                """, (patient_id, week_ago)).fetchone()
                nurse_count = row["cnt"] or 0
                last_nurse = row["last_ts"] or 0
            except Exception:
                pass
            conv_count, last_conv = 0, 0
            try:
                row = conn.execute("""
                    SELECT COUNT(*) as cnt, MAX(timestamp_utc) as last_ts FROM conversation_history
                    WHERE patient_id = ? AND timestamp_utc >= ?
                """, (patient_id, week_ago)).fetchone()
                conv_count = row["cnt"] or 0
                last_conv = row["last_ts"] or 0
            except Exception:
                pass
        finally:
            conn.close()
        last_any = max(last_nurse, last_conv)
        days_since = (now - last_any) / 86400 if last_any > 0 else 999
        total = nurse_count + conv_count
        score = min(1.0, total / 20)
        if days_since > 3:
            score *= 0.5
        if days_since > 7:
            score *= 0.3
        return {"score": round(score, 2), "days_since_last": round(days_since, 1), "interactions": total}
    except Exception:
        return {"score": 0, "days_since_last": 999, "interactions": 0}


def _generate_one_line_sbar(patient_id, state, risk, hmm_result):
    """One-line SBAR for triage dashboard."""
    profile = _get_patient_profile_from_db(patient_id)
    factors = hmm_result.get("top_factors", [])
    top_factor = factors[0].get("feature", "unknown") if factors else "unknown"
    top_value = f"{factors[0]['value']:.1f}" if factors and "value" in factors[0] else "?"
    return (
        f"S: {state} | "
        f"B: {profile.get('age', '?')}yo, {profile.get('conditions', 'T2DM')} | "
        f"A: {top_factor}={top_value}, risk {risk:.0f}% | "
        f"R: {'Urgent review' if state == 'CRISIS' else 'Schedule follow-up' if state == 'WARNING' else 'Continue monitoring'}"
    )


def generate_nurse_triage(patient_ids: List[str] = None) -> Dict:
    """
    Multi-patient clinical triage: urgency scoring + population-level intelligence.
    Transforms nurse dashboard from alert list to intelligent triage system.
    """
    if patient_ids is None:
        patient_ids = _get_all_patient_ids()
    patients = []
    for pid in patient_ids:
        try:
            try:
                from hmm_engine import HMMEngine
            except ModuleNotFoundError:
                from core.hmm_engine import HMMEngine
            engine = HMMEngine()
            obs = engine.fetch_observations(days=7, patient_id=pid)
            if not obs:
                continue
            hmm_result = engine.run_inference(obs, patient_id=pid)
            state = hmm_result.get("current_state", "STABLE")
            confidence = hmm_result.get("confidence", 0.5)
            risk = hmm_result.get("predictions", {}).get("risk_48h", 0)
            attention = compute_attention_score(pid)
            crisis_weight = {"CRISIS": 1.0, "WARNING": 0.6, "STABLE": 0.1}.get(state, 0.3)
            urgency = crisis_weight * (1 - attention["score"])
            sbar_line = None
            if urgency > 0.4:
                sbar_line = _generate_one_line_sbar(pid, state, risk, hmm_result)
            category = (
                "IMMEDIATE" if urgency > 0.7 else
                "SOON" if urgency > 0.4 else
                "MONITOR" if urgency > 0.2 else
                "STABLE"
            )
            profile = _get_patient_profile_from_db(pid)
            patients.append({
                "patient_id": pid, "name": profile.get("name", pid),
                "state": state, "confidence": round(confidence, 2),
                "risk_48h": round(risk, 1), "urgency_score": round(urgency, 3),
                "triage_category": category,
                "attention_score": attention["score"],
                "days_since_attention": attention["days_since_last"],
                "sbar_line": sbar_line,
            })
        except Exception as e:
            logger.warning(f"Triage failed for {pid}: {e}")
    patients.sort(key=lambda x: x["urgency_score"], reverse=True)
    return {
        "generated_at": datetime.now().isoformat(),
        "total_patients": len(patients),
        "immediate_count": sum(1 for p in patients if p["triage_category"] == "IMMEDIATE"),
        "soon_count": sum(1 for p in patients if p["triage_category"] == "SOON"),
        "patients": patients,
    }
