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

## Architecture: Hybrid Neuro-Symbolic Pipeline

Deterministic clinical safety fused with generative empathy — each layer constrains and enriches the next:

| Layer | Function | Why It Matters |
|-------|----------|----------------|
| **HMM State Engine** | Viterbi decoding + Baum-Welch learning across 9 biomarkers → Stable / Warning / Crisis | Fully deterministic — every classification is mathematically auditable. Never hallucinates. |
| **48h Risk Forecast** | Monte Carlo (2,000 paths) with counterfactual projections: "what if you take your meds?" | Predicts crisis *before* symptoms. Patients see risk drop from 35% → 12%. |
| **Agentic ReAct Loop (18 Tools)** | Outcome-based tool selection with 14-day effectiveness decay. Appointment booking, SBAR escalation, drug interaction checks, loss-aversion vouchers (Prospect Theory). | Reasons over HMM context, executes interventions, learns what works per patient. |
| **6-Dimension Safety Filter** | Screens for medical overclaims, hallucination, emotional mismatch, scope violations | Hard overrides: glucose <3.0 or >20.0 mmol/L → forced Crisis regardless of model output. |
| **SEA-LION v4 27B** | AI Singapore's National LLM for Singlish cultural adaptation via official API | *"Uncle, sugar drop already lah — makan something sweet now!"* |

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

**43,000+ lines of production code.** FastAPI backend (53 endpoints), custom HMM + risk engines (11K lines Python), Next.js frontend — fully functional, not a mockup. Generalises to hypertension, COPD, and heart failure by retraining emission parameters.

---

*Team Bewo*
