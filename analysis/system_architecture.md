# Bewo System Architecture

## 1. High-Level Data Flow (Offline-First)

```mermaid
graph TD
    subgraph "Tier 1: On-Device (Ephemeral)"
        Sensors[Phone Sensors] --> |Accel/GPS| RawData[Raw Metrics]
        Camera[Camera] --> |Photo| Vision[Gemini Vision Encrypted]
        Mic[Microphone] --> |Audio| AudioProc[Gemini Audio Encrypted]
        
        RawData --> |Process & Delete <24h| Aggregator[Local Aggregator]
        Vision --> |Extract Glucose| LocalDB[(SQLite Encrypted)]
        AudioProc --> |Extract Sentiment| LocalDB
    end

    subgraph "Tier 2: On-Device (Persisted - 6 Months)"
        LocalDB --> |Historical Data| HMM[HMM Inference Engine]
        HMM --> |State Change| AppLogic[App Controller]
        AppLogic --> |UI Update| UI[User Interface]
        AppLogic --> |Offline Fallback| GemCache[Gemini Cache]
    end

    subgraph "Tier 3: Cloud (Anonymized - Sync on WiFi Only)"
        AppLogic --> |Alerts/Stats| SyncMgr[Sync Manager]
        SyncMgr --> |Queued JSON| CloudAPI[Cloud Backend]
        CloudAPI --> |Doctor Dashboard| Dashboard[Clinical Portal]
    end

    %% Key Interactions
    HMM -- "Every 4h" --> LocalDB
    UI -- "Manual / Voice Input" --> LocalDB
    HMM -.-> |NO Cloud Dependency| CloudAPI
```

## 2. Privacy & Data Handling Tiers

| Tier | Scope | Storage Policy | Examples |
|------|-------|----------------|----------|
| **Tier 1** | **Ephemeral (RAM/Temp)** | **NEVER LEAVES DEVICE**. Auto-delete after processing (max 24h). | Raw Accelerometer, Raw GPS, Voice Audio, Photos. |
| **Tier 2** | **Private Persisted** | **NEVER LEAVES DEVICE**. Encrypted SQLite. Retain 6 months. | Glucose values, Med logs, Voice transcripts, HMM User States. |
| **Tier 3** | **Cloud Sync** | **SYNC ON WIFI ONLY**. Anonymized & Aggregated. Indefinite retention. | "Crisis Alert Event" (No values), Weekly Adherence %, Voucher Redemptions. |

### Cloud Sync Policy (CRITICAL)
**STRICTLY FORBIDDEN FROM CLOUD SYNC:**
*   Raw sensor data (accelerometer, GPS, audio, images).
*   Individual glucose readings (e.g., "5.4 mmol/L at 8:00 AM").
*   Full voice transcripts.
*   Precise location history.

**PERMITTED FOR CLOUD SYNC (WiFi Only):**
*   **Alert Events**: `{"user_id": "U123", "event": "CRISIS_STATE", "ts": 1709...}`
*   **Aggregated Stats**: `{"user_id": "U123", "week_avg_glucose": 6.5, "med_adherence": 0.9}`
*   **Interventions**: `{"intervention": "NUDGE", "response": "ACCEPTED"}`
*   **Vouchers**: `{"redeem": "VOUCHER_5_DOLLAR"}`

## 3. Offline Guarantees
**The System is designated as "Offline-First".**
1.  **HMM Inference**: Runs 100% locally on the Android device using Python (Chaquopy/PyDroid) and SQLite. **Zero cloud dependency** for health state detection.
2.  **App Functionality**: All core features (tracking, dashboards, local alerts) work without internet.
3.  **Sync**: All Tier 3 data is queued locally in `interventions_log` / `voucher_redemptions` and synced only when connection is restored.

## 4. The "Diamond" Agentic Architecture (Node 1-2-3)

To solve the "Deep Tech" challenge, we essentially split the brain into specialized lobes:

```mermaid
graph TD
    subgraph "Level 1: Ground Truth Analysis"
        Sensors --> HMM[Node 1: HMM Engine]
        Sensors --> Merlion[Node 3A: Merlion Quant Risk]
        
        HMM --> |Current State: WARNING| Gemini
        Merlion --> |Forecast: 85% Crisis Prob| Gemini
    end

    subgraph "Level 2: Strategic Synthesis"
        Gemini[Node 2: Gemini 2.0 Flash]
        Gemini --> |"Clinical Insight + Strategy"| SeaLion
    end

    subgraph "Level 3: Cultural Delivery"
        SeaLion[Node 3B: SEA-LION LLM]
        SeaLion --> |"Uncle, your sugar going up!"| User
        SeaLion --> |"Clinical SBAR"| Doctor
    end
```

### Component Roles
1.  **Node 1 (HMM)**: *The Guardian*. Deterministic state detection. Safety critical.
2.  **Node 3A (Merlion)**: *The Quant*. Statistical forecasting (CVaR). Calculates "Probability of Ruin" (Crisis).
3.  **Node 2 (Gemini)**: *The Doctor*. Synthesizes state + risk to form a strategy. (e.g., "High risk of hypoglycemia, so recommend fast-acting carbs").
4.  **Node 3B (Sea-Lion)**: *The Translator*. Converts the Doctor's strategy into the user's specific linguistic register (Singlish/Dialect).

### Fallback Hierarchy
1.  **Primary**: Diamond Flow (All Nodes Active).
2.  **Fallback 1 (No Cloud)**: HMM (Local) -> Simple Rule-Based Alerts -> UI.
3.  **Fallback 2 (No Merlion)**: HMM -> Gemini -> User (Standard English).

## 5. Demo Robustness ("God Mode")
A hidden administrative panel for judges to verify system capabilities instantly.

*   **Time Travel Simulation**:
    *   **Action**: "Inject 7 Days Data" button.
    *   **Effect**: Populates `glucose_readings`, `medication_logs`, `passive_metrics` with 7 days of realistic timestamps (t-7d to now).
*   **Scenario Injection**:
    *   **"Crisis Now"**: Sets HMM input params to critical threshold (High Glucose + Missed Meds) -> Triggers immediate CRISIS state.
    *   **"Healthy Now"**: Resets inputs to baseline.
*   **Reset**: Wipes all tables (`DELETE FROM ...`) to clean state.
*   **State Inspector**: Toggle to show raw HMM confidence scores and input vectors on the dashboard.
