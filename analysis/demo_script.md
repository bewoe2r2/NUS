# Functional Demonstration Script (3 Minutes)
## "The Agent That Prevents Crises"

**Audience:** Judges (Synapxe/MOH)
**Goal:** Prove "Business Value" (Prevention) and "Technical Soundness" (XAI).

---

### [0:00-0:45] The Hook: "The Invisible Gap"
*(Show "Home Page" - Status: STABLE)*
**Speaker:** "Hi, I'm [Name]. We all know AI is great at chatting. But can it *prevent* a heart attack?
Most apps today are reactive. They wait for you to fall.
We built **NEXUS**, the first **Neuro-Symbolic Health Agent** that predicts crises *before* they happen."

### [0:45-1:30] The Core Tech: "HMM Prediction"
*(Navigate to "14-Day Analysis" Dashboard)*
**Speaker:** "Here is the difference. A normal app sees 'Glucose 8.5' and says nothing.
Our **Hidden Markov Model (HMM)** sees a *trend*.
*(Point to the Transition Matrix visual)*
"Look at Day 12. The user feels fine. Glucose is okay. But the **Probability of Transition to Crisis** jumped to 40%."
**Why?**
*(Click "Explain Logic" / Evidence Table)*
"Because his HRV dropped (Stress) and he missed 2 meds. The AI knows these *combined* lead to a crash in 48 hours."

### [1:30-2:15] The Intervention: "Empathetic Action"
*(Show Gemini Chat / Voucher Popup)*
**Speaker:** "We don't just show a graph. The Agent acts.
Instead of a scary 'Medical Alert', it sends a **Hyper-Personalized Nudge**:
*'Hey, I noticed you're stressed. Here is a Healthy 365 Voucher for a Salad near your office. Let's get that glucose back on track.'*
It uses **Loss Aversion psychology** (the voucher) combined with clinically safe boundaries."

### [2:15-3:00] The Closing: "Safe Scalability"
*(Show "Data Safety" slide or simply hold up the phone)*
**Speaker:** "And the best part? This runs on **Edge AI**.
No patient data leaves this phone. It is privacy-compliant by design.
We are NEXUS: Moving healthcare from 'Reactive' to 'Predictive'. Thank you."

---

### Demo Prep Checklist
1.  **Reset DB:** Run `python init_db.py` before stage.
2.  **Inject Scenario:** Run `python inject_data.py --scenario crisis_prevention` (Make sure this specific scenario exists or use the general injection).
3.  **Local Server:** Ensure `streamlit run streamlit_app.py` is running and cached.
