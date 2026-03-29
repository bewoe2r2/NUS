# Bewo - AI-Powered Chronic Disease Management for Singapore's Aging Population

**An agentic healthcare companion for Type 2 Diabetes management, built with multi-turn AI reasoning, Hidden Markov Models, and culturally-aware communication.**

Bewo bridges the gap between clinic visits for Singapore's 440,000+ diabetic patients by providing continuous, intelligent health monitoring through a five-layer Diamond Architecture: Safety Foundation, Statistical Engine (HMM), Agentic Reasoning (Gemini + 18 tools), Safety Classifier (6-dimension filter), and Cultural Intelligence (SEA-LION + MERaLiON).

---

## Submission Contents

| File | Description |
|------|-------------|
| `EXECUTIVE_SUMMARY.md` | One-page A4 executive summary (also available as `EXECUTIVE_SUMMARY.html` — open in browser and print to PDF for formatted A4 output) |
| `slides/nusslides.html` | Interactive presentation slides (open in browser, navigate with arrow keys) |
| `Bewo_Demo_Video.mp4` | 6-minute product demonstration video |
| `README.md` | This file — setup instructions, architecture, API documentation |
| `backend/` | FastAPI backend (68 endpoints) |
| `core/` | HMM engine, agent runtime, Gemini/SEA-LION/MERaLiON integrations |
| `frontend/` | Next.js frontend (patient, nurse, caregiver, judge views) |
| `tests/` | 230 unit tests |
| `validation/` | Independent validation suite (10,000 synthetic patients) |
| `Dockerfile` + `docker-compose.yml` | One-command deployment |

---

## Architecture

```
                    Diamond Architecture v7 — 5 Layers

    Patient Data ──> L1: Safety Foundation (ADA 2024, drug interactions, PII)
                         │
                         ▼
                    L2: Statistical Engine (HMM Viterbi + Monte Carlo + Merlion ARIMA + Baum-Welch)
                         │
                         ▼
                    L3: Agentic Reasoning (Gemini + 18 tools + ReAct loop + memory)
                         │
                         ▼
                    L4: Safety Classifier (6-dimension response filter, fail-closed)
                         │
                         ▼
                    L5: Cultural Intelligence (SEA-LION + MERaLiON)
                         │
                         ▼
                    Patient / Nurse / Caregiver
```

**How it works — 5 layers, safety bookends the pipeline:**
1. **Safety Foundation** (L1) applies deterministic rules first: ADA 2024 guidelines, drug interaction checks (16 pairs), PII de-identification. Hard constraints before any inference.
2. **Statistical Engine** (L2) classifies patient state (STABLE / WARNING / CRISIS) using HMM Viterbi decoding across 9 features. Baum-Welch personalizes parameters. Monte Carlo (2,000 paths, 48h) predicts crisis probability. Merlion ARIMA forecasts trends.
3. **Agentic Reasoning** (L3) reasons in a multi-turn ReAct loop (up to 5 turns) with Gemini and 18 specialized healthcare tools, memory, and proactive triggers.
4. **Safety Classifier** (L4) screens every AI response across 6 dimensions before delivery: medical claims, emotional mismatch, hallucination, cultural sensitivity, scope boundaries, dangerous advice. Fail-closed.
5. **Cultural Intelligence** (L5) adapts responses via SEA-LION for Singlish cultural adaptation and MERaLiON (A*STAR) for paralinguistic emotion detection from voice check-ins.

---

## Key Capabilities

### Clinical Intelligence
- **Hidden Markov Model** with 9 features (glucose, medication adherence, activity, heart rate, HRV, sleep, diet, social engagement, glucose variability)
- **Baum-Welch algorithm** for per-patient parameter learning (personalized transition + emission matrices)
- **Viterbi decoding** for optimal state sequence estimation
- **Monte Carlo crisis prediction** (2,000 simulation paths, 48h horizon)
- **SBAR clinical reporting** auto-generated for nurse escalations

### Agentic AI (18 Tools)
The agent autonomously decides which tools to use based on patient context:

| Tool | Purpose |
|------|---------|
| `book_appointment` | Schedule polyclinic visits |
| `send_caregiver_alert` | Notify family members |
| `calculate_counterfactual` | "What if you had taken medication?" scenarios |
| `suggest_medication_adjustment` | Evidence-based dosage suggestions |
| `set_reminder` | Medication/appointment reminders |
| `alert_nurse` / `alert_family` | Escalation pathways |
| `award_voucher_bonus` | Gamification rewards |
| `request_medication_video` | Educational content |
| `suggest_activity` / `recommend_food` | Lifestyle interventions |
| `escalate_to_doctor` | Critical case escalation |
| `schedule_proactive_checkin` | Preventive engagement |
| `celebrate_streak` | Behavioral reinforcement |
| `generate_weekly_report` | Progress summaries |
| `adjust_nudge_schedule` | Adaptive timing optimization |
| `generate_clinician_summary` | SBAR report for nurse-to-doctor handoff |
| `check_drug_interactions` | Pharmacological safety check |

### Safety Systems
- **Response Safety Classifier**: 6-dimension check on every AI response (medical claims, emotional mismatch, hallucination, cultural sensitivity, scope boundaries, dangerous advice)
- **Drug Interaction Engine**: 16 interaction pairs, 45 drug-class mappings, auto-blocks CONTRAINDICATED combinations
- **Agent Memory**: Cross-session episodic + semantic + preference learning with Gemini-powered extraction
- **Proactive Scheduler**: 6 trigger conditions (glucose_rising, sustained_risk, logging_gap, medication_nudge, streak_save, mood_followup)

### Multi-Stakeholder
- **Patient**: Chat companion, glucose logging (manual + OCR), medication tracking, voucher rewards, voice check-ins
- **Nurse**: Multi-patient triage dashboard with urgency scoring, attention decay, auto-SBAR for IMMEDIATE cases
- **Caregiver**: Bidirectional communication (5 response types), burden scoring (4-factor, 0-100), auto-digest mode
- **Clinician (via Nurse)**: Auto-generated SBAR reports for nurse-to-doctor handoff, impact metrics, intervention tracking

---

## Project Structure

```
Healthcare/
├── backend/
│   └── api.py                  # FastAPI server (68 API routes)
├── core/
│   ├── hmm_engine.py           # HMM + Viterbi + Baum-Welch
│   ├── agent_runtime.py        # Agentic orchestration, 18 tools
│   ├── gemini_integration.py   # Gemini AI + SBAR generation
│   ├── clinical_engine.py      # Clinical decision support
│   ├── merlion_risk_engine.py  # Monte Carlo risk forecasting
│   ├── sealion_interface.py    # Cultural/language adaptation
│   ├── meralion_interface.py   # MERaLiON speech emotion recognition
│   ├── voucher_system.py       # Gamification engine
│   └── demo_controller.py      # Demo scenario injection
├── tools/
│   ├── appointment_booking.py  # Appointment management
│   ├── caregiver_alerts.py     # Alert system
│   └── clinical_interventions.py # Medical interventions
├── sensors/
│   ├── location_tracker.py     # Location-based context
│   ├── screen_time_tracker.py  # Screen time monitoring
│   └── step_counter.py         # Activity tracking
├── frontend/                   # Next.js React app
│   ├── app/                    # Patient (/), Nurse (/nurse), Caregiver (/caregiver), Judge (/judge)
│   ├── components/             # React components
│   └── tests/                  # Frontend tests (API client, components, walkthrough)
├── database/
│   ├── nexus_schema.sql        # Full database schema
│   └── nexus_health.db         # SQLite database (pre-seeded)
├── scripts/
│   ├── init_db.py              # Database initialization
│   └── inject_data.py          # Demo data seeding
├── tests/                      # Backend tests: HMM, API, pipeline, validation
├── validation/                 # HMM validation suite
├── slides/
│   └── nusslides.html          # Competition presentation slides
├── EXECUTIVE_SUMMARY.md        # One-page project overview
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # One-command deployment
└── requirements.txt            # Python dependencies
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend)
- Optional: Google Gemini API key for live AI chat (demo works without it)

### Option A: Docker (Recommended)

```bash
cp .env.example .env
# Optional: add GEMINI_API_KEY for live AI chat
# The demo runs fully without API keys — all scenarios use pre-computed data

docker compose up --build
```

Frontend: `http://localhost:3000` | API: `http://localhost:8000` | Swagger: `http://localhost:8000/docs`

### Option B: Manual Setup

```bash
# 1. Backend
pip install -r backend/requirements.txt
cp .env.example .env
python scripts/init_db.py  # Initialize database (first time only)
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (in a separate terminal)
cd frontend && npm install && npm run dev
```

### For Judges

**No API keys required.** The demo runs fully offline — HMM inference, scenario injection, SBAR reports, agent intelligence, and all stakeholder views work without any external API keys.

Open `http://localhost:3000/judge` for the full demo console:

1. **Slides tab** — presentation slides embedded for easy viewing
2. **Overview tab** — inject scenarios from the sidebar, see real-time HMM state
3. **Patient View** — what Mr. Tan sees on his phone (proactive Singlish messages, emergency alerts)
4. **Nurse View** — triage dashboard, auto-SBAR reports, drug interaction checks
5. **Caregiver** — alert history, burden scoring, escalation tiers
6. **AI Intelligence** — agent memory, tool execution logs, safety audit trail, proactive history

Select a scenario (e.g. "Warning → Crisis") from the left sidebar and click "Run Full Simulation" to see the full pipeline in action across all views.

| View | URL | Description |
|------|-----|-------------|
| Judge Console | `/judge` | Full control panel with guided walkthrough |
| Patient App | `/` | Mobile companion (what Mr. Tan sees) |
| Nurse Dashboard | `/nurse` | Clinical triage interface |
| Caregiver View | `/caregiver` | Family caregiver dashboard with alerts and burden score |

---

## API Overview (68 Routes)

### Patient
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patient/{id}/state` | Current HMM state + confidence |
| GET | `/patient/{id}/history` | Glucose history timeline |
| GET | `/patient/{id}/analysis/14days` | 14-day trend analysis |
| GET | `/patient/{id}/analysis/detail` | Deep feature-by-feature analysis |
| GET | `/patient/{id}/drug-interactions` | Current medication interactions |
| POST | `/patient/{id}/drug-interactions/check` | Check proposed new medication |

### Chat & Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Main conversation (runs full Diamond v7 ReAct loop) |
| GET | `/agent/status/{id}` | Agent state + recent actions |
| GET | `/agent/actions/{id}` | Action history log |
| GET | `/agent/conversation/{id}` | Conversation history |
| POST | `/agent/counterfactual/{id}` | "What if?" scenario analysis |
| GET | `/agent/memory/{id}` | Cross-session learned memories |
| POST | `/agent/memory/consolidate/{id}` | Trigger memory consolidation |
| GET | `/agent/tool-effectiveness/{id}` | Per-tool outcome scores |
| GET | `/agent/safety-log/{id}` | Safety classifier audit trail |
| POST | `/agent/proactive-scan` | Scan all patients for triggers |
| POST | `/agent/proactive-scan/{id}` | Scan single patient |

### Nurse
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nurse/alerts` | Active alert dashboard |
| GET | `/nurse/patients` | All patients overview |
| GET | `/nurse/triage` | Multi-patient urgency-ranked triage + SBAR |
| GET | `/nurse/triage/{id}` | Single patient triage detail |

### Caregiver
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/caregiver/respond/{alert_id}` | Submit response (5 types) |
| GET | `/caregiver/dashboard/{id}` | Caregiver view of patient |
| GET | `/caregiver/burden/{id}` | Burden score (0-100) |

### Clinical (Nurse → Doctor Handoff)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clinician/summary/{id}` | Auto-generated SBAR for nurse-to-doctor handoff |
| GET | `/impact/metrics/{id}` | Outcome measurement metrics |
| GET | `/impact/intervention-effectiveness/{id}` | Intervention ROI analysis |

### Health Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/glucose/log` | Log glucose reading |
| POST | `/glucose/ocr` | OCR from glucometer photo |
| GET | `/medications/{id}` | Medication list |
| POST | `/medications/log` | Log medication taken |
| GET | `/voucher/{id}` | Voucher balance + history |
| POST | `/voice/checkin` | Voice-based check-in |
| GET | `/reminders/{id}` | Active reminders |

### Behavioral
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/streaks/{id}` | Logging streak data |
| GET | `/agent/engagement/{id}` | Engagement score |
| GET | `/agent/weekly-report/{id}` | Weekly progress report |
| GET | `/agent/nudge-times/{id}` | Optimal nudge timing |
| POST | `/agent/detect-mood` | Mood detection from text |
| GET | `/agent/daily-challenge/{id}` | Today's health challenge |
| GET | `/agent/caregiver-fatigue/{id}` | Caregiver fatigue detection |
| GET | `/agent/glucose-narrative/{id}` | Human-readable glucose story |

---

## Testing & Validation

**230/230 tests passed, 76/76 validation gates passed. Zero safety-critical misclassifications.**

```bash
# Core unit tests (metrics, proactive triggers, counterfactuals, baselines)
pytest tests/test_metrics_system.py tests/test_proactive_oracle.py tests/test_counterfactual_engine.py tests/test_personalized_baselines.py -v

# Enforced validation gates (accuracy >=90%, AUC >=0.85, CRISIS recall >=0.80)
pytest tests/test_validation_runner.py -v

# Full pipeline (HMM + Monte Carlo + safety + drug interactions + 100 patients)
pytest tests/test_full_pipeline.py -v

# Exhaustive HMM (numerical stability, edge cases, all scenarios)
pytest tests/test_exhaustive.py -v

# Independent validation (5,000 clinically-sourced patients per suite)
PYTHONPATH=. python validation/hmm_validation_suite/code/01_easy_independent_validation.py
PYTHONPATH=. python validation/hmm_validation_suite/code/02_hardened_independent_validation.py

# API integration tests (requires running server + BEWO_API_KEY)
pytest tests/test_api_live.py -v
```

### Key Results

| Suite | Accuracy | CRISIS Recall | AUC | Patients |
|-------|----------|---------------|-----|----------|
| Easy (clean boundaries) | 99.3% | 100% | 1.000 | 5,000 |
| Hardened (overlapping, contradictory) | 82.1% | 87.8% | 0.967 | 5,000 |

- HMM outperforms glucose-only baseline by **+25.3%** (p<0.0001)
- **Zero** CRISIS-as-STABLE misclassifications across both suites
- 32 clinical archetypes (DKA, sepsis, steroid-induced, hypoglycemia-unaware, etc.)
- 16 validation sections with McNemar, ROC-AUC, ECE calibration, bootstrap cross-validation

### Where to Find Everything

| File | What |
|------|------|
| `tests/TEST_REPORT.md` | Full test coverage matrix and competition metrics mapping |
| `tests/results/RESULTS_SUMMARY.md` | Latest test run results with all metrics |
| `tests/results/*.txt` | Raw output from each test suite |
| `validation/hmm_validation_suite/` | Independent validation code (16 sections, 5,000 patients each) |
| `tests/test_metrics_system.py` | Technical metrics system tests (grounding, cost, latency) |
| `tests/test_proactive_oracle.py` | All 6 proactive trigger conditions + scheduling |

The CI pipeline (`.github/workflows/ci.yml`) runs backend tests, frontend lint, frontend tests, and build verification on every push.

---

## Technical Highlights

### HMM Engine
- 9 orthogonal features with Gaussian emission distributions
- Weighted log-space Viterbi decoding (numerically stable)
- Baum-Welch (EM) for personalized parameter learning
- Time-aware emission scaling (dawn phenomenon, post-prandial peaks)
- Safety rule fusion (hard overrides for critical thresholds)
- Per-patient calibrated baselines with MLE

### Agent Runtime
- Multi-turn ReAct reasoning loop (5 turns max)
- 18 tool definitions with structured execution
- Outcome-based tool selection (exponential decay, 14-day half-life)
- Cross-session memory (episodic + semantic + preference)
- 6-dimension response safety classifier
- Proactive scheduling with 6 trigger conditions
- Drug interaction engine (16 pairs, 45 class mappings)
- SBAR auto-generation for nurse escalations

---

## Pre-Seeded Demo Data

The database ships with 3 realistic Singapore T2DM patient profiles:

| Patient | Profile | HbA1c | Medications | Scenario |
|---------|---------|-------|-------------|----------|
| Mr. Tan Ah Kow (67M) | T2DM + Hypertension + Hyperlipidemia | 8.1% | Metformin 1000mg BD, Amlodipine 5mg, Atorvastatin 20mg | Typical poorly-controlled elderly |
| Mdm. Lim Siew Eng (72F) | T2DM + Chronic Kidney Disease Stage 2 | 9.5% | Metformin 500mg, Gliclazide 80mg | Complex comorbidity |
| Mr. Ahmad bin Ismail (58M) | T2DM | 6.2% | Metformin 1000mg | Early-stage management |

Plus: 4,032 CGM readings, 14 days of Fitbit data (activity, heart rate, sleep), 42 food logs, appointments, caregiver alerts, and nurse escalations.

---

## Performance

Measured latency benchmarks (14-day patient window, 9 features):

| Component | Latency | Notes |
|-----------|---------|-------|
| HMM Viterbi inference | 12.7ms | 14 days, 9 orthogonal features |
| Monte Carlo simulation | 173.6ms | 2,000 paths, 48h horizon |
| Counterfactual simulation | 0.1ms | Single intervention scenario |
| **HMM core pipeline total** | **186.3ms** | **Fast enough for real-time on-device inference** |
| Merlion ARIMA forecast | ~8.4s | Trains ARIMA model from scratch per call |
| Full /chat pipeline | ~10-15s | HMM + Merlion + Gemini reasoning + SEA-LION translation |

**Key insight:** The HMM core (inference + Monte Carlo + counterfactual) runs in under 200ms -- fast enough for real-time on-device inference without network dependency. The full conversational pipeline takes ~10-15s due to external API calls (Gemini multi-turn reasoning + SEA-LION cultural translation), which is acceptable for a conversational health companion where users expect a thoughtful, personalized response.

---

## Security & Privacy

### Data Protection (PDPA Compliance)
- **PII De-identification**: All patient data (name, NRIC, address, phone, email, emergency contacts) is stripped by `_deidentify_profile_for_llm()` before any data reaches Gemini, SEA-LION, or any external AI service. Only anonymised clinical context (age, conditions, medications, patient_id) is sent.
- **HMM Runs Offline**: The core statistical engine (Viterbi, Monte Carlo, Baum-Welch) executes entirely locally. No patient data is transmitted for state classification.
- **Tiered Data Retention**: Sensor data is ephemeral. Clinical data encrypted locally with 6-month retention. Only anonymised outcome metrics sync externally.

### API Security
- **Constant-Time Authentication**: API key comparison uses `secrets.compare_digest()` to prevent timing attacks.
- **Rate Limiting**: 60 req/min general, 30 req/min for `/chat` (Gemini cost control). Per-IP in-memory store.
- **Input Sanitisation**: All user input capped at 2,000 characters, stripped of control characters and prompt injection patterns before processing.
- **SQL Injection Prevention**: All database queries use parameterised statements. Table names in admin endpoints use hardcoded allowlists only.

### Clinical Safety
- **Fail-Closed Safety Classifier**: If the 6-dimension safety classifier is unavailable (API down, error, timeout), the AI response is blocked — never delivered unfiltered.
- **Drug Interaction Engine**: 16 interaction pairs, 45 drug-class mappings. CONTRAINDICATED combinations are hard-blocked. The system cannot suggest a dangerous drug combination.
- **Deterministic Overrides**: L1 safety rules fire before any AI inference. Glucose <3.0 or >20.0 mmol/L forces CRISIS regardless of model output. These rules are hardcoded and cannot be overridden by the AI.
- **No Dosage Modification**: The system can never autonomously change medication dosages. All dosage suggestions are flagged for clinician review only.

### Prompt Injection Defence
- User messages are sanitised before being included in LLM prompts. Control characters, XML/HTML injection patterns, and known prompt injection techniques are stripped.
- The safety classifier independently evaluates every response — even if a prompt injection caused the reasoning layer to generate something unsafe, the classifier catches it before delivery.

---

## References

- ADA Standards of Care 2024
- UKPDS (Lancet 1998)
- ARIC Study (Diabetes Care 2019)
- Danne et al. (Diabetes Care 2017)
- MOH Singapore Emergency Department Statistics 2024
- AI Singapore SEA-LION v4 27B
- A*STAR MERaLiON (I²R)

---

## License

Built by Team Bewo for the NUS-Synapxe-IMDA Healthcare AI Innovation Challenge 2026.
