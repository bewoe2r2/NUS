# BEWO — Agentic AI Health Companion

**Problem Statement 1: Agentic AI for Patient Empowerment | Team Bewo | NUS-SYNAPXE-IMDA AI Innovation Challenge 2026**

---

> Mr. Tan Ah Kow is 67, diabetic, lives alone in Toa Payoh. His next clinic visit is 3 months away. Yesterday his glucose spiked after skipping medication — nobody noticed. **Bewo did.** It predicted his risk 48 hours before symptoms appeared, nudged him in Singlish he trusts, alerted his daughter, and flagged his nurse with a clinical summary — without him pressing a single button.

---

## The Problem

Between clinic visits — often months apart — chronic disease patients self-manage alone. Elderly patients with limited digital literacy are especially vulnerable. Current tools are reactive chatbots that wait for patients to ask — the very population least likely to do so. The result: preventable ER admissions at ~$8,800 each, caregiver burnout, and overstretched nurses drowning in manual documentation.

## What Bewo Does

Bewo is an **agentic AI companion** that continuously monitors, predicts, and acts — filling the gap between clinical encounters. It doesn't wait to be asked.

- **Patients** get proactive check-ins, medication nudges, culturally resonant guidance in Singlish, and personalised "what-if" scenarios showing how their actions reduce personal risk — minimal digital literacy required.
- **Nurses** get an urgency-ranked triage dashboard with auto-generated SBAR summaries — who needs attention *now*, zero manual documentation.
- **Caregivers** get severity-tiered alerts with fatigue detection that auto-adjusts frequency to prevent burnout.

## Architecture: 5-Layer Diamond Architecture

Safety bookends the pipeline — deterministic clinical safety fused with generative empathy, each layer constrains and enriches the next:

| Layer | Name | Function | Why It Matters |
|-------|------|----------|----------------|
| **L1** | **Safety Foundation** | Deterministic rules: ADA 2024 guidelines, drug interaction checks (16 pairs), PII de-identification | Hard constraints *before* any inference. Glucose <3.0 or >20.0 mmol/L → forced Crisis regardless of model output. |
| **L2** | **Statistical Engine** | HMM Viterbi decoding + Baum-Welch learning across 9 biomarkers → Stable / Warning / Crisis. Monte Carlo (2,000 paths, 48h) with counterfactual projections. Merlion ARIMA forecasting. | Fully deterministic — every classification is mathematically auditable. Predicts crisis *before* symptoms. |
| **L3** | **Agentic Reasoning** | Gemini + 18 tools + ReAct loop + memory + proactive triggers. Outcome-based tool selection with 14-day effectiveness decay. | Reasons over HMM context, executes interventions, learns what works per patient. |
| **L4** | **Safety Classifier** | 6-dimension response filter (medical claims, hallucination, emotional mismatch, cultural sensitivity, scope boundaries, dangerous advice). Fail-closed. | Every AI response screened *after* generation — safety bookends the pipeline. |
| **L5** | **Cultural Intelligence** | SEA-LION v4 27B (AI Singapore) for Singlish adaptation + MERaLiON SER (A*STAR) for paralinguistic emotion recognition | *"Uncle, sugar drop already lah — makan something sweet now!"* Detects fatigue/distress in voice. |

## Privacy & Data

PDPA-compliant by design. HMM runs fully offline — no internet needed for state inference. All data sent to AI services is **de-identified** (names, NRIC, addresses stripped). Tiered retention: sensor data ephemeral, clinical data encrypted locally (6-month), only anonymised outcomes sync to cloud. Consent is explicit and revocable.

## Projected Impact

| Metric | Target |
|--------|--------|
| Medication adherence | **+30%** via loss-aversion nudges and streak tracking |
| Preventable ER admissions | 1 averted = $8,800 saved = 2,900 patient-months funded |
| Nurse documentation time | **60%+ reduction** via auto-SBAR |
| Cost to operate | **$0.40/patient/month** at scale |

## Prototype

**~32,400 lines of production code.** FastAPI backend (67 endpoints), custom HMM + risk engines (22K lines Python), Next.js frontend — fully functional, not a mockup. Generalises to hypertension, COPD, and heart failure by retraining emission parameters.

---

*Team Bewo*
