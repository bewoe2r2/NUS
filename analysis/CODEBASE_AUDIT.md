# Nexus Health: System Architecture & Codebase Audit
> **Status:** DEEP DIVE COMPLETE
> **Scope:** 3 Web Apps (Patient, Nurse, Judge), Core Engines, Database

## 1. System Architecture: The "Diamond" Model
The codebase implements a sophisticated "Diamond Architecture":
*   **Node 1 (The Brain):** `HMMEngine` (Deterministic/Probabilistic State) at `core/hmm_engine.py`.
*   **Node 2 (The Strategist):** `GeminiIntegration` (Reasoning/SBAR) at `core/gemini_integration.py`.
*   **Node 3A (The Quant):** `MerlionRiskEngine` (Future Risk/Calculus) at `core/merlion_risk_engine.py`.
*   **Node 3B (The Diplomat):** `SeaLionInterface` (Cultural/Linguistic) at `core/sealion_interface.py`.

**Assessment:** The architecture is structurally sound and "Competition Ready". It is modular, separating "Math" (HMM) from "Language" (Gemini).

## 2. Component Analysis

### A. The Frontends (Three Next.js Apps)
| App | File | Key Features | State |
| :--- | :--- | :--- | :--- |
| **Patient** | `frontend/app/page.tsx` | Bento Grid, Daily Insight, Meds, Chat, Action Menu. | **SOLID.** Good component breakdown. |
| **Nurse** | `frontend/app/nurse/page.tsx` | HMM Intelligence Center, Survival Chart, Heatmap. | **EXCELLENT.** High-density visualization. |
| **Judge** | `frontend/app/judge/page.tsx` | Wrapper around Nurse Dash + `AdminSidebar`. | **FUNCTIONAL.** Simple verification tool. |

*Note:* The `archive/` folder contains legacy Streamlit apps (`streamlit_judge.py` etc.). These are effectively deprecated but contain useful "Forensic" code (Probability Matrix visualizations) that haven't fully migrated to Next.js yet.

### B. Core Logic & Math
*   **HMM Engine:** Uses 9 *Orthogonal Features* (avoiding correlation). `Gaussian HMM` with clinically derived `EMISSION_PARAMS`.
*   **Merlion:** Implements a fallback "Derivative Calculus" model (Velocity/Acceleration) to detect "Cliff Edge" drops when the full library is missing. Smart engineering.
*   **Voucher:** Implements "Loss Aversion" ($5 start, deduction logic).
*   **Sea-Lion:** Uses a dedicated System Prompt for "Singlish Elder" dialect.

### C. The Database (The "Memory")
*   **Schema:** `nexus_schema.sql` is advanced.
    *   **Privacy:** `retention_until` columns for auto-deletion (Tier 2 data).
    *   **Offline AI:** `gemini_response_cache` table exists but is seemingly unused in the current `api.py`.
    *   ***CRITICAL GAP:* `state_change_alerts` table exists but is NOT populated by `api.py`. Logic for writing to this table is missing.**

## 3. The "Missing Links" (Agentic Gaps)

Despite the strong foundation, the "Agentic" behaviors are currently **Potential, not Kinetic**.

### 1. The Proactive Gap (The "Empty Table")
*   **Evidence:** `nexus_schema.sql` has `state_change_alerts` (ID 16).
*   **Reality:** `api.py`/`hmm_engine.py` reads state but never *writes* a new alert row.
*   **Result:** The "Sentinel" loop is missing. The system cannot "wake up" the nurse.

### 2. The Booking Gap (The "Generic Advice")
*   **Evidence:** `hmm_engine.py` produces rich `top_factors` (Reasons for failure).
*   **Reality:** `chat` (Gemini) genericizes this. It doesn't use the specific factor (e.g., "Gait Asymmetry") to trigger a specific tool (e.g., "Book Physio").

### 3. The Logic Gap (Merlion Integration)
*   **Evidence:** `GeminiIntegration.generate_patient_insight` imports `MerlionRiskEngine`.
*   **Reality:** It calculates risk but currently just "passes it" to the prompt. There is no Hard Logic Gate (e.g., "If Risk > 80%, TRIGGER EMERGENCY CALL").

## 4. Recommendations for Strategic Roadmap

Based on this deep dive, the previously proposed Roadmap is **CONFIRMED** but needs specific technical tasks:

1.  **Implement `alert_daemon.py`:** A background script that runs `hm_engine.run_inference()` every 15 minutes, checks for state changes, and WRITES to `state_change_alerts`.
2.  **Migrate Forensic Tools:** Move the "Probability Matrix" visualization from `archive/streamlit_judge.py` to `frontend/app/judge/page.tsx` to give judges better visibility.
3.  **Activate Offline Cache:** Update `api.py` to check `gemini_response_cache` before calling Google, to improve speed/reliability during the demo.

**Verdict:** The project is 85% complete. The final 15% is "closing the loops" (Proactive alerting, Specific Booking, Logical Gates).
