# Bewo - AI-Powered Chronic Disease Management for Singapore's Aging Population

**An agentic healthcare companion for Type 2 Diabetes management, built with multi-turn AI reasoning, Hidden Markov Models, and culturally-aware communication.**

Bewo bridges the gap between clinic visits for Singapore's 440,000+ diabetic patients by providing continuous, intelligent health monitoring through a three-layer Diamond Architecture that combines statistical modeling (HMM), predictive AI (Gemini), and clinical safety systems.

---

## Architecture

```
                    Diamond Architecture v7

    Patient Data ──> HMM Engine (Viterbi + Baum-Welch)
                         │
                         ▼
                    Merlion Risk Engine (Monte Carlo 48h forecast)
                         │
                         ▼
                    Gemini Agent (Multi-turn ReAct, 18 tools)
                         │
                         ▼
                    SEA-LION (Singlish/cultural adaptation)
                         │
                         ▼
                    Safety Classifier (6-dimension filter)
                         │
                         ▼
                    Patient / Nurse / Caregiver
```

**How it works:**
1. **HMM Engine** classifies patient state (STABLE / WARNING / CRISIS) using 9 orthogonal health features with Viterbi decoding. Baum-Welch trains personalized transition and emission parameters per patient.
2. **Merlion Risk Engine** runs Monte Carlo simulation (2,000 paths, 48h horizon) to predict crisis probability.
3. **Gemini Agent** reasons in a multi-turn ReAct loop (Observe → Think → Act → Observe, up to 5 turns) with access to 18 specialized healthcare tools.
4. **SEA-LION** adapts responses for Singapore's multilingual elderly population (Singlish, cultural norms).
5. **Safety Classifier** screens every AI response across 6 dimensions before delivery.

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
| `generate_clinician_summary` | SBAR clinical notes |
| `check_drug_interactions` | Pharmacological safety check |

### Safety Systems
- **Response Safety Classifier**: 6-dimension check on every AI response (medical claims, emotional mismatch, hallucination, cultural sensitivity, scope boundaries, dangerous advice)
- **Drug Interaction Engine**: 16 interaction pairs, 39 drug-class mappings, auto-blocks CONTRAINDICATED combinations
- **Agent Memory**: Cross-session episodic + semantic + preference learning with Gemini-powered extraction
- **Proactive Scheduler**: 6 trigger conditions (glucose_rising, sustained_risk, logging_gap, medication_nudge, streak_save, mood_followup)

### Multi-Stakeholder
- **Patient**: Chat companion, glucose logging (manual + OCR), medication tracking, voucher rewards, voice check-ins
- **Nurse**: Multi-patient triage dashboard with urgency scoring, attention decay, auto-SBAR for IMMEDIATE cases
- **Caregiver**: Bidirectional communication (5 response types), burden scoring (4-factor, 0-100), auto-digest mode
- **Clinician**: SBAR summaries, impact metrics, intervention effectiveness tracking

---

## Project Structure

```
Healthcare/
├── backend/
│   └── api.py                  # FastAPI server (54 API routes)
├── core/
│   ├── hmm_engine.py           # HMM + Viterbi + Baum-Welch
│   ├── agent_runtime.py        # Agentic orchestration, 18 tools
│   ├── gemini_integration.py   # Gemini AI + SBAR generation
│   ├── clinical_engine.py      # Clinical decision support
│   ├── merlion_risk_engine.py  # Monte Carlo risk forecasting
│   ├── sealion_interface.py    # Cultural/language adaptation
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
│   ├── app/                    # Patient (/), Nurse (/nurse), Judge (/judge)
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
- Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### Option A: Docker (Recommended)

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

docker compose up --build
```

Frontend: `http://localhost:3000` | API: `http://localhost:8000` | Swagger: `http://localhost:8000/docs`

### Option B: Manual Setup

```bash
# 1. Backend
pip install -r backend/requirements.txt
cp .env.example .env       # Add your GEMINI_API_KEY
python scripts/init_db.py  # Initialize database (first time only)
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (in a separate terminal)
cd frontend && npm install && npm run dev
```

### For Judges

Open `http://localhost:3000/judge` — the **Guided Walkthrough** launches automatically and walks you through every feature, view, and scenario in 24 steps. Just follow the prompts.

| View | URL | Description |
|------|-----|-------------|
| Judge Console | `/judge` | Full control panel with guided walkthrough |
| Patient App | `/` | Mobile companion (what Mr. Tan sees) |
| Nurse Dashboard | `/nurse` | Clinical triage interface |

---

## API Overview (54 Routes)

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

### Clinical
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clinician/summary/{id}` | SBAR clinical summary |
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
- Drug interaction engine (16 pairs, 39 class mappings)
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

## Competition Context

Built for the **NUS-Synapxe-IMDA Healthcare AI Innovation Challenge**, targeting Singapore's aging population with Type 2 Diabetes. The system integrates with Singapore's national healthcare infrastructure through:

- **Merlion** (A*STAR): Time-series risk forecasting
- **SEA-LION** (AI Singapore): Singlish/multilingual cultural adaptation
- **SBAR**: Standardized clinical reporting used in Singapore hospitals
- **CDC Voucher Integration**: Aligned with Singapore's Community Development Council voucher system for gamified health engagement

---

## License

Built by Team Antigravity for the NUS-Synapxe-IMDA Healthcare AI Innovation Challenge 2026.
