# BEWO — Your AI Health Companion

**Problem Statement 1: Agentic AI for Patient Empowerment | Team Bewo**

---

> Mr. Tan is 72, diabetic, and lives alone in Toa Payoh. His next clinic visit is 3 months away. Yesterday his glucose spiked after skipping medication — but nobody noticed. Bewo did. It predicted his risk of a hypoglycaemic crisis 48 hours before symptoms appeared, nudged him in Singlish he trusts, alerted his daughter, and flagged his nurse with a clinical summary — all without him pressing a single button.

---

## The Gap

Over 440,000 Singaporeans live with Type 2 Diabetes, and one in four residents aged 40+ has at least one chronic condition. Between clinic visits — often months apart — patients self-manage complex medication regimens, dietary restrictions and lifestyle changes with little support. Elderly patients who speak Singlish or dialects and have limited digital literacy are especially vulnerable. The consequences are measurable: preventable emergency admissions at ~$8,800 each, rising caregiver burnout, and overstretched nursing staff documenting cases manually. Current digital health tools are reactive chatbots that wait for patients to ask — the very population least likely to do so.

## What Bewo Does

Bewo is an **agentic AI health companion** that continuously monitors, predicts and acts for chronic disease patients — filling the critical gap between clinical encounters. It doesn't wait to be asked. It **anticipates needs, takes action autonomously, and speaks the patient's language**.

- **Patients** receive proactive check-ins, medication nudges, culturally resonant health guidance and personalised "what-if" scenarios showing exactly how their actions reduce personal risk — requiring minimal digital literacy.
- **Nurses** access an urgency-ranked triage dashboard with auto-generated SBAR clinical summaries, surfacing who needs attention now while eliminating hours of manual documentation.
- **Caregivers** receive severity-tiered alerts with built-in fatigue detection that automatically adjusts communication frequency to prevent burnout.

## Architecture: AI That Can't Hallucinate on Clinical Decisions

Bewo's core innovation is a **hybrid neuro-symbolic pipeline** — deterministic clinical safety fused with generative empathy. No single layer operates alone; each constrains and enriches the next:

| Layer | What It Does | Why It Matters |
|-------|-------------|----------------|
| **HMM State Engine** | Custom Hidden Markov Model using Viterbi decoding and Baum-Welch (EM) learning across 9 weighted biomarkers (glucose, medication adherence, HRV, sleep, activity, etc.) to classify patients into Stable / Warning / Crisis | Fully deterministic and explainable — every state classification is mathematically auditable with feature-level attribution. Never hallucinates. |
| **48-Hour Risk Forecast** | Monte Carlo simulation (2,000 paths, 48h horizon) powered by A*STAR's Merlion time-series library, with counterfactual projections ("what if you take your medication?") | Predicts crisis *before* symptoms manifest. Patients see their personal risk drop from 35% to 12% — motivation grounded in math, not platitudes. |
| **Agentic Reasoning (18 Tools)** | Multi-turn ReAct loop with outcome-based tool selection (14-day effectiveness decay per patient). Tools include appointment booking, SBAR nurse escalation, caregiver alerts, drug interaction checks (16 known pairs, 39 class mappings), loss-aversion vouchers (Prospect Theory) and adaptive nudge scheduling. | The system reasons over HMM context, selects the right intervention, executes it, and learns what works for each individual. No two patients receive identical care sequences. |
| **6-Dimension Safety Classifier** | Every AI response screened for medical overclaims, hallucination, emotional mismatch, cultural insensitivity, scope violations and dangerous advice | Clinical-grade guardrails — hard overrides force Crisis state for glucose <3.0 or >20.0 mmol/L regardless of model output. |
| **SEA-LION & MERaLiON** | Singapore's National LLMs (SEA-LION v4 27B for Singlish text adaptation, MERaLiON for speech with paralinguistic cues) with code-switching and dialect-aware framing | "Uncle, sugar drop already lah — makan something sweet now!" Trust through authentic communication that Western-trained models cannot replicate. |

## Data Strategy, Privacy & Ethics

Bewo is architected for **PDPA compliance from the ground up**. The HMM engine runs entirely offline — no internet required for state inference. All data sent to external AI services (Gemini, SEA-LION) is **de-identified**; patient names, NRIC and addresses are stripped before any API call. Appointment booking uses a **blind-booking protocol** where patient identity is revealed only at physical check-in. Data is tiered: raw sensor streams stay ephemeral in memory, clinical data is encrypted locally with 6-month retention, and only anonymised intervention outcomes sync to cloud. Patient consent is explicit and revocable at every tier.

## Evaluation Framework & Projected Impact

| Metric | Measurement Approach | Target |
|--------|---------------------|--------|
| Medication adherence | Streak tracking + logging frequency vs. baseline | +30% via loss-aversion nudges |
| Glucose time-in-range | 14-day HMM trend analysis (% time in Stable) | +20% improvement |
| ER admissions prevented | Crisis predictions acted on vs. historical admission rates | 1 saved ($8,800) = 2,900 patient-months funded |
| Nurse efficiency | Documentation time before/after auto-SBAR | 60%+ reduction in triage prep |
| Caregiver burden | 4-factor score (alert volume, response latency, missed acks, crisis frequency) | Sustained score <40/100 |
| Cost to operate | Infrastructure + API costs per active patient | $0.40/patient/month — 87% gross margin |

## Built for Singapore, Designed to Scale

**20,000+ lines of production code** across a FastAPI backend (54 endpoints), custom ML engines, and a Next.js frontend — fully functional, not a mockup. The HMM architecture generalises to any chronic condition by retraining emission parameters: hypertension, COPD, heart failure. Starting with 3 Singapore polyclinics (20,000 patients), scalable across ASEAN's 56 million diabetics.

---

*Team Bewo | NUS-SYNAPXE-IMDA AI Innovation Challenge 2026*
