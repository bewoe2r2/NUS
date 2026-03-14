# Nexus Health: Strategic Analysis & Agentic Roadmap
> **For:** NUS Synapxe Challenge IMDA
> **Status:** AUDITED & VERIFIED (Deep Dive Complete)
> **Codebase State:** 85% Ready (Architecture is solid, "Agentic" loops are missing)

## 1. Executive Summary
The "Deep Dive" audit confirms you have a **Diamond Architecture**: HMM (Brain) + Gemini (Reasoning) + Merlion (Risk) + Sea-Lion (Culture).
**The Critical Finding:** You have the muscles (Schema supports alerts, Engine supports risk), but the *nerves* are cut.
*   **The Proactive Gap:** `nexus_schema.sql` has a `state_change_alerts` table, but `api.py` **never writes to it**. The system is deaf until asked.
*   **The Booking Gap:** `hmm_engine.py` calculates `top_factors`, but `chat` ignores them and gives generic advice.

This roadmap connects these severed nerves to create a "Level 100" Agent.

---

## 2. The "Agentic" Functions to Add (Technical Specs)

### Feature A: The "Sentinel" Loop (Proactive Triggers)
**The Problem:** Patients don't open the app when they are in crisis.
**The Fix:** Implement `scripts/alert_daemon.py`.
*   **Mechanism:** A background process (cron/loop) that:
    1.  Runs `HMMEngine.inference()` on all users every 15 mins.
    2.  Checks: `if current_state != prev_state AND current_state == 'WARNING'`.
    3.  **Action:** Writes a row to `state_change_alerts` (Database).
    4.  **Action:** Triggers `GeminiIntegration.draft_sbar()` (AI).
    5.  **Action:** Pushes a "Wake Up" notification to the Frontend.

### Feature B: The "Specialist Router" (Smart Booking)
**The Problem:** "Book an appointment" is generic.
**The Fix:** Wiring HMM Factors to the Referral Logic.
*   **Mechanism:**
    1.  In `api.py` `/chat` endpoint:
    2.  Read `hmm_result['top_factors']`.
    3.  **Inject System Instruction:** *"The patient's #1 failure factor is {top_factor}. If they ask for help, recommend {specialist_map[top_factor]}."*
    *   *Mapping:*
        *   `hrv_rmssd` -> "Cardiologist (National Heart Centre)"
        *   `glucose_variability` -> "Endocrinologist (TTSH)"
        *   `gait_asymmetry` -> "Fall Prevention Clinic"

### Feature C: The "Cultural Bridge" (Sea-Lion Activation)
**The Problem:** Generic AI tone.
**The Fix:** Force `SeaLionInterface` for all elderly interactions.
*   **Mechanism:**
    1.  Check `patients` table for `age > 65`.
    2.  If true, wrap the Gemini response in `sl.translate_message(msg, dialect='singlish_elder')`.
    3.  Result: "Please take metformin" -> "Uncle, medicine take already? Numbers creeping up ah."

---

## 3. Implementation Plan (Phased)

### Phase 1: The "Nerve Repair" (Connecting the Loops)
> **Goal:** Make the existing engine "Talk".
1.  **Backend:** Update `api.py` to write to `state_change_alerts` when HMM state changes (even during manual refresh).
2.  **Frontend:** Update `PatientHeader` to show a "Notification Bell" that reads from `state_change_alerts`.
3.  **Logic:** Create `specialist_directory.json` and wire it into the `chat` context.

### Phase 2: The "Sentinel" (Background Intelligence)
> **Goal:** Make the system work while sleeping.
1.  Create `scripts/alert_daemon.py`.
2.  Create `tests/test_proactive_alert.py` (Verify it catches a simulated glucose spike).

### Phase 3: The "Judge" Experience (Show Off)
> **Goal:** Prove it to the judges.
1.  Update `judge/page.tsx`: Add a button **"Simulate Night Crisis"**.
2.  Action: Inject bad glucose -> Daemon runs -> Phone Notification pops up (in UI) -> SBAR generated for Nurse.

## 4. Answering Your Questions (Final Verdict)

> "How would the agent know which thing to book?"
**Answer:** It uses the `top_factors` list from the HMM.
*   If `factor == 'steps_daily'`, it books **Physiotherapy**.
*   If `factor == 'social_engagement'`, it books **Community Events**.
*   We will code this mapping explicitly.

> "Have we maximised its use?"
**Answer:** Not yet. You have maximized its *Accuracy* (Level 90), but its *Utility* is low (Level 40) because it waits for the user.
*   **The Fix:** The **Sentinel Loop (Phase 2)** maximizes utility by acting *without* user input. This converts "Accuracy" into "Safety".

> "What else should we do?"
**Answer:** **Narrative SBAR.**
*   The Nurse shouldn't read charts. The AI should write: *"Patient stable, but nocturnal hypoglycemia detected. Recommend snacking before bed."* (We will add this in Phase 1).
