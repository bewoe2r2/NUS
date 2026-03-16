# Features Added — 2026-02-21 (Session #5)

## 1. Agent Runtime Engine (`core/agent_runtime.py`) — NEW FILE

The missing orchestration brain. Connects Gemini AI reasoning to real tool execution with full HMM context.

### What it does:
- Extracts ALL HMM intelligence (state, confidence, Monte Carlo crisis prediction, counterfactuals, trend analysis, survival curves, data quality scores) and feeds it to Gemini
- Gemini reasons over the full patient picture and decides which tools to call
- Tools execute against real database, actions are logged, conversation is stored
- Fallback rule-based responses when Gemini is unavailable

### 18 Agentic Tools Wired:
1. **book_appointment** — Smart scheduling via mock HealthHub API with Lloyd's algorithm slot optimization, patient preference learning, sleep schedule preservation
2. **send_caregiver_alert** — Three-tier severity escalation (info→push, warning→SMS, critical→call) with rate limiting to prevent alert fatigue
3. **calculate_counterfactual** — "What if?" Bayesian simulation using HMM. E.g., "What if patient takes Metformin now?" → projects crisis risk reduction
4. **suggest_medication_adjustment** — Generates dose change recommendations for DOCTOR REVIEW (never auto-adjusts). Uses glucose trends + adherence patterns
5. **set_reminder** — Medication, exercise, and appointment reminders stored in DB with scheduling
6. **alert_nurse** — Direct nurse notification with priority levels, queued to nurse dashboard
7. **alert_family** — Family member notifications with configurable urgency
8. **award_voucher_bonus** — Loss-aversion gamification: $5 weekly voucher that DECREASES with missed actions (Prospect Theory)
9. **request_medication_video** — Triggers personalized medication education video generation
10. **suggest_activity** — Context-aware activity suggestions based on time of day, weather, patient mobility
11. **escalate_to_doctor** — Formal clinical escalation with full HMM context attached
12. **recommend_food** — Culturally appropriate Singapore food recommendations with glycemic impact estimates
13. **schedule_proactive_checkin** — AI-initiated check-ins (no user message needed) based on risk patterns

### Key Architecture:
- `build_full_hmm_context()` — Extracts 8 categories of HMM data (state, Monte Carlo, counterfactuals, trend, state change probability, survival curve, data quality, contributing factors)
- `build_agent_prompt()` — Constructs comprehensive prompt with patient profile, HMM results, behavioral science framework, conversation history, time-of-day awareness, and clinical decision rules
- `run_agent()` — Main orchestration: HMM analysis → context build → Gemini reasoning → tool execution → action logging → conversation storage
- `_generate_fallback_response()` — Rule-based responses keyed to HMM state when Gemini unavailable

---

## 2. New API Endpoints (in `backend/api.py`)

### `POST /agent/proactive-checkin/{patient_id}`
AI-initiated check-in with no user message. The agent reviews the patient's HMM state and proactively reaches out based on risk patterns.

### `GET /agent/status/{patient_id}`
Full agent intelligence dump: current HMM state, crisis risk, counterfactual scenarios, trend analysis, contributing factors. Powers the nurse dashboard's "AI Assessment" panel.

### `GET /agent/actions/{patient_id}`
Recent agent tool executions — what the AI decided to do and why. Audit trail for clinical governance.

### `GET /agent/conversation/{patient_id}`
Conversation history between patient and AI agent. Enables continuity across sessions.

### `POST /agent/counterfactual/{patient_id}`
Direct counterfactual scenario execution — nurse or doctor can ask "what if patient does X?" and get HMM-projected outcomes.

---

## 3. `/chat` Endpoint Rewired

Previously called a dumbed-down `generate_agentic_response()` that threw away 90% of HMM data. Now calls `run_agent()` which:
- Runs full HMM inference (Viterbi + Monte Carlo + counterfactuals)
- Builds comprehensive context with all patient data
- Lets Gemini reason and call tools
- Executes tools against real database
- Logs actions and stores conversation

---

## 4. Nurse Dashboard Rewrite (`/nurse/alerts`)

**Before:** Queried single table for single user. Usually returned empty.

**After:** Queries ALL 7 alert tables across ALL patients:
- `nurse_alerts` — direct nurse notifications
- `medication_videos` — video generation requests
- `appointment_requests` — booking requests needing approval
- `doctor_escalations` — clinical escalations
- `family_alerts` — family notification logs
- `caregiver_alerts` — caregiver alert logs
- `agent_actions_log` — all AI-initiated actions

Results sorted by priority (critical first) with unified format.

---

## 5. Database & Infrastructure Fixes

- **DB path fix** in `tools/appointment_booking.py` and `tools/caregiver_alerts.py` — was hardcoded `"nexus_health.db"`, now resolves correctly via `os.path`
- **reminders table schema** — added `reminder_type` column with ALTER TABLE fallback
- **voucher_tracker schema** — removed nonexistent `max_value` column from INSERT
- **Runtime tables** — `ensure_runtime_tables()` creates `agent_actions_log`, `conversation_history`, `proactive_checkins` on startup
- **Duplicate return/except blocks** removed from `api.py`

---

## 6. Full HMM Utilization

Every HMM output is now consumed by the agent:

| HMM Feature | How Agent Uses It |
|---|---|
| Viterbi state (STABLE/WARNING/CRISIS) | Determines conversation tone, urgency, tool selection |
| State confidence % | Modulates recommendation strength |
| Monte Carlo crisis probability | Triggers proactive alerts when >40% |
| Expected hours to crisis | Sets appointment urgency level |
| Counterfactual scenarios | Shows "what if" to motivate behavior change |
| Contributing factors (top 3) | Focuses conversation on most impactful actions |
| Trend direction | Detects improving/declining trajectories |
| State change probability | Predicts transitions before they happen |
| Survival curve | Estimates time window for intervention |
| Data quality score | Warns when readings are sparse/unreliable |

---

## 7. Streak & Engagement Tracking System (NEW)

### `get_patient_streaks(patient_id)` — in `agent_runtime.py`
Tracks 4 types of streaks: medication, glucose logging, exercise, app usage.
- Calculates current streak + all-time best streak for each category
- Drives retention via loss aversion: "Don't break your 7-day streak!"
- Engagement level labels: Starting / Growing / Strong / Champion

### `calculate_engagement_score(patient_id)` — in `agent_runtime.py`
Composite engagement score (0-100) with 5 weighted components:
- App usage frequency (25%)
- Glucose logging consistency (25%)
- Medication adherence (20%)
- Response rate to nudges (15%)
- Streak maintenance (15%)

Risk levels: `high_engagement` / `moderate` / `at_risk` / `disengaging`

Used to identify disengaging patients for proactive outreach before they churn.

### `celebrate_streak` Tool (NEW — Tool #14)
Agent can celebrate streak milestones (3/7/14/30 days) with voucher bonuses and encouraging messages. Logged as `streak_milestone` in actions.

### API Endpoints:
- `GET /agent/streaks/{patient_id}` — current streaks for all categories
- `GET /agent/engagement/{patient_id}` — engagement score with risk level

---

## 8. Adaptive Nudge Timing (NEW)

### `get_optimal_nudge_times(patient_id)` — in `agent_runtime.py`
Learns WHEN the patient is most responsive by analyzing conversation response patterns:
- Measures response delay by hour of day
- Scores each hour: faster response + more responses = higher score
- Returns best 3 hours and worst hours to avoid
- Falls back to sensible defaults (9 AM, 7 PM) if no data yet

### `adjust_nudge_schedule` Tool (NEW — Tool #16)
Agent can shift reminder schedules to optimal times based on learned patterns.

### API Endpoint:
- `GET /agent/nudge-times/{patient_id}` — optimal nudge windows

---

## 9. Weekly Health Report Generator (NEW)

### `generate_weekly_report(patient_id, patient_profile)` — in `agent_runtime.py`
Auto-generates comprehensive weekly summary:
- **Glucose**: average, min, max, reading count, in-range status
- **Activity**: average steps, best day, active days, goal met
- **Agent Actions**: total actions taken, success rate
- **Streaks**: all current streaks
- **Achievements**: milestone badges ("7-day medication streak!", "Met step goal!")
- **Overall Grade**: A/B/C/D based on weighted scoring

### `generate_weekly_report` Tool (NEW — Tool #15)
Agent can trigger report generation and optionally send summary to caregiver.

### API Endpoint:
- `GET /agent/weekly-report/{patient_id}` — full weekly report

---

## 10. Mood-Aware Response Adaptation (NEW)

### `detect_mood_from_message(message)` — in `agent_runtime.py`
Fast keyword-based sentiment detection (no API call needed):
- Detects 4 mood states: frustrated, positive, worried, sad
- Maps moods to tone adaptations: empathetic, celebratory, reassuring, warm
- Confidence scoring based on signal density
- Agent sees mood data in prompt and adapts tone accordingly

### Decision Rules Added:
- Patient frustrated → empathetic tone, don't push actions
- Patient sad → warm tone, suggest social activities
- Patient worried → reassuring tone, show counterfactual data to reduce anxiety

### API Endpoint:
- `POST /agent/detect-mood` — test mood detection on any message

---

## 11. Enhanced Agent Prompt (v5.0 → v6.0)

The agent prompt now includes 3 new data sections injected before every Gemini call:
1. **Streaks & Engagement** — all current streaks, engagement score, risk level
2. **Patient Mood** — detected mood + recommended tone adaptation
3. **Optimal Nudge Times** — learned response windows + avoid times

Plus 8 new decision rules for streaks, engagement, mood, and nudge timing.

Total tools: **13 → 18** (added celebrate_streak, generate_weekly_report, adjust_nudge_schedule)

---

## 12. Daily Health Challenge System (NEW)

### `generate_daily_challenge(patient_id, hmm_context)` — in `agent_runtime.py`
Personalized micro-challenges that scale with patient state:
- **CRISIS**: minimal goals (log glucose once, take next medication, rest 30 min)
- **WARNING**: maintenance goals (2 glucose logs, walk 80% of usual steps, all meds)
- **STABLE**: stretch goals (beat step count by 10%, call a friend, eat low-GI meal)

Challenge selection priorities weakest area first (low adherence → medication challenge, low steps → activity challenge, high glucose → logging challenge).

Each completed challenge awards $1-2 voucher bonus.

### API Endpoint:
- `GET /agent/daily-challenge/{patient_id}` — personalized challenge + all options

---

## 13. Caregiver Fatigue Detection (NEW)

### `detect_caregiver_fatigue(patient_id)` — in `agent_runtime.py`
Detects caregiver burnout from alert response patterns:
- Tracks alert volume trends (week-over-week)
- Monitors family alert response rate (% unanswered)
- Monitors nurse alert resolution rate
- Three fatigue levels: mild / moderate / high

Recommendations:
- Mild: review alert thresholds
- Moderate: consolidate into daily digest
- High: schedule caregiver support call, reduce frequency

### API Endpoint:
- `GET /agent/caregiver-fatigue/{patient_id}` — fatigue signals + level

---

## 14. Smart Glucose Prediction Narrative (NEW)

### `generate_glucose_narrative(patient_id, hmm_context)` — in `agent_runtime.py`
Translates HMM/Monte Carlo data into human-readable, actionable language:
- Current status ("Your glucose is 7.2 — looking good!")
- Trend narrative ("Readings improving over past few days")
- Factor-based insights ("Medication timing affecting glucose")
- Counterfactual motivation ("Taking medication consistently could reduce risk by 25%")
- Time-of-day predictions ("Afternoon is when glucose can spike after lunch")

### API Endpoint:
- `GET /agent/glucose-narrative/{patient_id}` — full narrative + actionable tip

---

## 15. Enhanced Agent Prompt (v6.0 — Final)

The agent prompt now includes **7 data sections** injected before every Gemini call:
1. Streaks & Engagement — all current streaks, engagement score, risk level
2. Patient Mood — detected mood + recommended tone adaptation
3. Optimal Nudge Times — learned response windows + avoid times
4. Today's Challenge — personalized daily challenge with reward
5. Glucose Narrative — human-readable glucose prediction + tip
6. Caregiver Status — fatigue detection signals + level
7. Conversation History — last 6 turns

Total tools: **18**
Total API endpoints added today: **14**
Total agent prompt data sections: **13** (7 new + 6 existing)
