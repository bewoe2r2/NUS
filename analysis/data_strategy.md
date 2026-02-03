# Data Strategy & Privacy Framework
## "Privacy by Design" for Singapore Healthcare

### 1. Data Classification & Handling
We classify user data into three tiers based on **IMDA / PDPA Guidelines**:

| Tier | Data Type | Examples | Storage Location | Protection |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **PII (Identifiable)** | Name, NRIC, Phone, Address | **Local Device ONLY** | AES-256 Encryption (Never Sent) |
| **Tier 2** | **Clinical Context** | "Glucose: 8.5", "Risk: High" | **Sent to Cloud (Transient)** | TLS 1.3 / Ephemeral Processing |
| **Tier 3** | **Anonymized Telemetry** | "User_123" transition probabilities | Cloud (Analytics) | Hash-salted IDs |

**Core Principle:** *Data Minimization.* We do not send raw sensor logs (GPS/Continuous CGM) to the LLM. We only send the **Derived Clinical State** needed for the conversation.

### 2. The "Safety Core" Architecture
1.  **Local Inference:** The HMM determines the "State" (e.g. Crisis) locally. This ensures alerts work even without internet.
2.  **Context Injection:** When generating advice, we send a **Sanitized JSON Payload** (State + Top 3 Factors) to Gemini.
3.  **No Long-Term Storage:** The LLM uses the data for *generation only* and does not train on patient data (Enterprise API policy).

### 3. Consent & Ethics (PDPA Compliance)
*   **Explicit Opt-In:** Users must actively enable "Crisis Sharing" to allow their Next-of-Kin to receive alerts.
*   **Right to Forget:** A visible "Wipe All Data" button in the Settings instantly deletes the local `.db` file (technically `nexus_health.db`).
*   **Algorithmic Transparency:** The "Evidence Table" (XAI) allows users to see exactly *why* the AI made a recommendation, preventing "black box" ethical issues.

### 4. Synthetic Data Strategy (For Competition)
Since we cannot access real patient records due to privacy laws:
*   **Generation:** We used a **Bio-Physiological Simulator** (based on standard medical curves) to generate 14 days of realistic heart rate/glucose data.
*   **Validation:** These curves effectively simulate "Hypoglycemic Events" to test the HMM's response time without endangering real humans.
