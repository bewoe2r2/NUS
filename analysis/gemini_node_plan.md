# Node 2: Gemini Integration Plan
## "The Empathetic Communicator"

### 1. The Core Philosophy: "Cognitive Division of Labor"
To ensure **Zero Hallucination Risk**, we divide the brain into two parts:
*   **The Left Brain (HMM - Node 1):** Performs the *Diagnosis*. Deterministic, Mathematical, Safe.
*   **The Right Brain (Gemini - Node 2):** Performs the *Communication*. Creative, Empathetic, Persuasive.

**Crucial Rule:** Gemini NEVER calculates the health state. It only *receives* the state and decides how to explain it.

---

### 2. Data Payload (The "Privacy Firewall")
We practice **Data Minimization**. We do not send raw sensor logs. We send a "Clinical Snapshot."

#### Input to Gemini (JSON Payload):
```json
{
  "patient_profile": {
    "name": "Uncle Tan",
    "language_preference": "English/Singlish Mixed",
    "persona_trigger": "Responds well to family-based motivation"
  },
  "clinical_context": {
    "current_state": "WARNING",  // Determined by HMM
    "confidence_score": 0.89,    // HMM Confidence
    "primary_driver": "Missed Medication (2 doses)",
    "secondary_driver": "Rising Glucose Trend (+15%)"
  },
  "specific_evidence": {
    "glucose_avg_24h": "8.5 mmol/L",
    "sleep_duration": "5.2 hours"
  }
}
```

#### Why this is Flawless:
1.  **Privacy:** No GPS coordinates, no raw timestamps. Just high-level summaries.
2.  **Context:** Enough data for Gemini to be specific ("I see you slept only 5 hours") but not enough to re-identify the home address.

---

### 3. Prompt Engineering (The "SBAR" Architecture)
We use a structured prompts to ensure medical relevance.

**Prompt Strategy:**
> "You are NEXUS, a medical companion.
> **Observation:** The HMM engine has detected a {WARNING} state.
> **Reason:** {Missed Medication} and {Rising Glucose}.
> **Goal:** Persuade the user to take medication using {Family-Based Motivation}.
> **Constraint:** Do not give medical dosage advice. Refer to the doctor's prescription."

**Output (The Nudge):**
> "Uncle Tan, I notice your sugar is going up a bit (8.5). Did you forget your white pill this morning? Your daughter will be worried if we have to go to the clinic later. Let's take it now, okay?"

---

### 4. Pros, Cons & Mitigations

| Feature | Pros | Cons (Risks) | **Mitigation Strategy** |
| :--- | :--- | :--- | :--- |
| **Cloud Inference** | High quality, 2M context window | Latency (2-3s), API Cost | **HMM runs locally first.** Gemini is only called *after* HMM detects a change, not every second. |
| **Generative Text** | High Empathy, infinite variety | Hallucination Risk | **Strict System Prompt:** "Never invent numbers. Use only provided JSON." |
| **Personalization** | tailored motivation (Singlish) | Cultural Mismatch | Use **SEA-LION (Node 3)** for specific local dialects if Gemini struggles. |

---

### 5. Judge Presentation Script ("The Powerful Explanation")
*"Judges, we solved the 'Black Box' problem by separating **Reasoning** from **Eloquence**."*

*"We use the HMM (Node 1) as the **Ground Truth**. It validates the medical safety mathematically."*
*"We use Gemini (Node 2) purely as the **Interface Layer**. It takes the cold, hard facts from the HMM and translates them into a warm, 'Sayang' message that actually changes behavior."*

*"This architecture gives us the **Safety of a Medical Device** with the **Usability of ChatGPT**."*
