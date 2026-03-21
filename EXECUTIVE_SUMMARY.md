# Bewo — Autonomous AI Health Companion for Type 2 Diabetes

**NUS-Synapxe-IMDA Healthcare AI Innovation Challenge 2026 | Problem Statement 1**

---

> Mr. Tan is 67, diabetic, lives alone in Toa Payoh. His next clinic visit is 3 months away. Yesterday, his glucose spiked after skipping medication. Nobody noticed — but **Bewo did.** It detected a dangerous trend in his data, predicted a 78% chance of crisis within 48 hours, messaged him in Singlish he actually understood, checked the message for safety, alerted his daughter via SMS, and sent his nurse a clinical report. He never pressed a button.

## The Problem

440,000 Singaporeans live with diabetes — one in nine adults. Between clinic visits (3–6 months apart), they manage alone. The most vulnerable — elderly patients who struggle with phones and forget their medication — are the least likely to seek help. The result: one preventable diabetic ER admission every 6 minutes in Singapore, costing ~$8,800 each (MOH 2024).

## What Bewo Does

Bewo monitors patients continuously between clinic visits, predicts health deterioration before it becomes an emergency, and acts — without waiting to be asked.

**For patients:** Bewo reaches out proactively in Singlish. It shows patients the impact of their choices — "If you take your Metformin, your crisis risk drops from 78% to 12%." It detects emotional distress through voice check-ins. No digital literacy needed.

**For nurses:** An urgency-ranked triage dashboard that surfaces who needs attention now. Clinical SBAR reports generated in 3 seconds (vs 15 minutes by hand). Drug interactions checked automatically across 16 known interaction pairs and 45 drug classes.

**For caregivers:** Three-tier alerts — stable events get a push notification, warnings get SMS, crisis gets a phone call. Caregiver fatigue is tracked, and alert frequency automatically reduces when burnout is detected.

## How It Works — The Diamond Architecture

Bewo uses a 5-layer pipeline where safety comes first and last — the AI cannot bypass safety at either end.

**Layer 1** checks hard clinical rules before anything else runs. If glucose drops below 3.0 or spikes above 20.0 mmol/L, the system forces a crisis classification — no AI involved. Drug interactions are screened, and all patient identifiers are stripped before any data reaches an AI model.

**Layer 2** is the statistical core — a Hidden Markov Model that classifies each patient as STABLE, WARNING, or CRISIS based on 9 health signals (glucose, medication adherence, activity, heart rate, HRV, sleep, diet, engagement, glucose variability). It runs in 12.7ms on a phone with no GPU. It cannot hallucinate — the output is pure math, fully traceable. A Monte Carlo simulator then runs 2,000 possible futures over 48 hours to predict crisis probability. The model personalises itself to each patient over time.

**Layer 3** is the reasoning layer — Gemini with 18 specialised healthcare tools decides what to do: send a medication reminder, alert a caregiver, generate a clinical report, suggest a dietary change, or escalate to a nurse. It remembers patient context across sessions and reaches out proactively based on 6 trigger conditions (rising glucose, sustained risk, missed logging, medication gaps, streak at risk, negative mood detected).

**Layer 4** checks every AI-generated message across 6 safety dimensions before it reaches the patient: medical accuracy, dosage safety, scope boundaries, emergency protocol, emotional tone, and cultural sensitivity. If the classifier fails or is unavailable, the message is blocked — never delivered unfiltered.

**Layer 5** translates everything into natural Singlish using SEA-LION v4 (AI Singapore), and detects emotional state from voice using MERaLiON (A*STAR) — so when Mr. Tan says "I'm fine" but sounds distressed, the system knows.

## Does It Work?

We validated on 10,000 synthetic patients (5,000 per round, 32 clinical archetypes including DKA-prone, steroid-induced, and pregnancy diabetes). Clean data: 99.3% accuracy, 100% crisis recall. Adversarial data with contradictory signals: 82.1% accuracy, 87.8% crisis recall. **In both rounds, zero patients in crisis were ever classified as safe.** The missed 12.2% in the hardened test were flagged as WARNING — still receiving attention, never told they were fine. 230 tests and 76 validation gates, all passing.

## Cost and Performance

The core pipeline runs in 186ms on consumer hardware — no GPU, no cloud dependency. Operating cost: $0.40 per patient per month. One prevented ER visit ($8,800) funds 22,000 patient-months of monitoring.

---

*Team Bewo*
