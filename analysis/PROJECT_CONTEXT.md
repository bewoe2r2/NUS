# NEXUS 2026 - Project Context & Documentation

> **IMPORTANT FOR AI ASSISTANTS**: This file contains the full context of the NEXUS 2026 project. When the user starts a new chat, READ THIS FILE FIRST to understand the project. UPDATE THIS FILE whenever significant changes are made.

---

## Project Overview

**NEXUS 2026** is an AI Health Companion system for elderly diabetic patients (specifically designed for Singapore's healthcare context). It uses a **Hidden Markov Model (HMM)** to detect health deterioration before it becomes critical.

**Target User**: Mr. Tan - a 67-year-old Type 2 Diabetic patient

**Key Innovation**: Explainable AI (XAI) dashboard that shows WHY the system made its decision, not just what the decision is.

---

## Project Structure

```
c:\Users\brigh\.gemini\antigravity\Healthcare\
│
├── streamlit_app.py          # Main Streamlit dashboard (1300+ lines)
├── hmm_engine.py             # HMM inference engine with Viterbi algorithm
├── gemini_integration.py     # Google Gemini 2.0 Flash API integration
├── voucher_system.py         # Loss aversion gamification ($5/week)
├── step_counter.py           # Accelerometer-based step detection
├── screen_time_tracker.py    # Screen usage → sleep quality proxy
├── location_tracker.py       # Privacy-preserving location zones
├── init_db.py                # Database initialization
├── inject_data.py            # Demo data injection script
├── nexus_schema.sql          # SQLite database schema (14 tables)
├── nexus_health.db           # SQLite database file
├── requirements.txt          # Python dependencies
├── .env                      # API keys (GEMINI_API_KEY)
├── XAI_EXPLANATION.md        # XAI dashboard explanation guide
├── PROJECT_CONTEXT.md        # THIS FILE - project documentation
├── system_architecture.md    # Architecture diagrams
├── task.md                   # Task tracking
└── hmm_strategy.md           # HMM design decisions
```

---

## Core Components

### 1. streamlit_app.py (Main Dashboard)

**Pages:**
- **Home**: Shows current health state (STABLE/WARNING/CRISIS) with Gemini-powered insights
- **14-Day Analysis**: XAI dashboard with:
  - Timeline of health states (clickable days)
  - Probability Gallery (Gaussian curves)
  - Internal Logic Heatmap
  - Evidence Table
- **Sensor Data**: Real-time metrics display
- **Log Glucose**: Photo OCR or manual entry
- **Daily Check-in**: Voice/text sentiment analysis
- **Log Medication**: Medication tracking
- **My Voucher**: Loss aversion gamification
- **Trends**: 7-day historical view
- **Admin Panel**: Demo scenario injection

**Key Imports:**
```python
from hmm_engine import HMMEngine, STATES, EMISSION_PARAMS, safe_log
from gemini_integration import GeminiIntegration
from plotly.subplots import make_subplots
```

### 2. hmm_engine.py (HMM Brain)

**States:** STABLE, WARNING, CRISIS

**12 Features Analyzed:**
| Feature | Weight | Description |
|---------|--------|-------------|
| glucose_avg | 25% | Average blood glucose |
| meds_adherence | 20% | Medication compliance |
| glucose_variance | 10% | Glucose stability |
| carbs_avg_24h | 8% | Carbohydrate intake |
| time_in_range | 8% | CGM time in target range |
| social_interactions | 6% | Social engagement proxy |
| sleep_quality | 5% | Sleep score |
| steps_avg | 5% | Daily steps |
| time_at_home | 5% | Isolation/mobility proxy |
| active_minutes | 3% | Exercise intensity |
| heart_rate_resting | 3% | Resting heart rate |
| heart_rate_avg | 2% | Average heart rate |

**Key Methods:**
- `run_inference(observations)` - Viterbi algorithm
- `fetch_observations(days=14)` - Get data from SQLite
- `generate_demo_scenario(scenario_type, days)` - Create test data
- `get_gaussian_plot_data(feature_name)` - For XAI visualization
- `gaussian_prob(x, mean, var)` - Probability calculation

**Demo Scenarios:**
- `stable_perfect` - 14 days excellent control
- `stable_noisy` - Good control with sensor noise
- `missing_data` - Random missing readings
- `warning_recovery` - STABLE → WARNING → STABLE
- `warning_to_crisis` - STABLE → WARNING → CRISIS
- `sudden_spike` - Acute event then recovery

### 3. gemini_integration.py (AI Features)

**Methods:**
- `extract_glucose_from_photo(image_path)` - OCR glucose meter photos
- `analyze_voice_sentiment(transcript)` - Sentiment scoring
- `generate_sbar_report(weekly_data)` - Clinical SBAR reports
- `generate_patient_insight(profile, hmm_result, observations)` - Personalized messages

**Model Hierarchy (with automatic fallback):**
1. `gemini-3-flash-preview` (Primary - Dec 2025, 3x faster than 2.5 Pro)
2. `gemini-2.5-flash` (Fallback 1 - stable)
3. `gemini-2.0-flash-exp` (Fallback 2 - legacy)

**Current Active Model:** `gemini-3-flash-preview` ✓

### 4. Database Schema (nexus_schema.sql)

**14 Tables:**
1. `glucose_readings` - Manual glucose entries
2. `cgm_readings` - Continuous glucose monitor (Premium tier)
3. `medication_logs` - Medication tracking
4. `passive_metrics` - Steps, screen time, location
5. `voice_checkins` - Voice transcript + sentiment
6. `hmm_states` - HMM inference results
7. `food_logs` - Carbohydrate tracking
8. `fitbit_activity` - Fitbit activity data
9. `fitbit_heart_rate` - Fitbit HR data
10. `fitbit_sleep` - Fitbit sleep data
11. `voucher_tracker` - Weekly voucher balance
12. `voucher_redemptions` - Redemption history
13. `interventions_log` - System interventions
14. `gemini_response_cache` - Offline fallback responses

**Privacy Tiers:**
- Tier 1: Ephemeral (RAM only, <24h)
- Tier 2: Local encrypted (6 months retention)
- Tier 3: Cloud sync (anonymized only)

---

## Patient Tiers

| Tier | Data Sources | Features Available |
|------|-------------|-------------------|
| BASIC | Phone only | 8/12 features |
| ENHANCED | Phone + Fitbit | 10/12 features |
| PREMIUM | Phone + Fitbit + CGM | 12/12 features |

---

## How to Run

```bash
cd "c:\Users\brigh\.gemini\antigravity\Healthcare"
streamlit run streamlit_app.py
```

**Dependencies:**
```
google-generativeai
python-dotenv
streamlit
plotly
qrcode[pil]
pillow
```

---

## Recent Changes Log

### Session: 2026-01-26 (Morning)

**Bugs Fixed:**
1. ✅ Added `from plotly.subplots import make_subplots` - was missing
2. ✅ Added `EMISSION_PARAMS` to imports from hmm_engine
3. ✅ Added `safe_log` to imports from hmm_engine
4. ✅ Fixed `engine.EMISSION_PARAMS` → `EMISSION_PARAMS` (module constant, not class attr)
5. ✅ Fixed `engine.safe_log()` → `safe_log()` (module function, not method)
6. ✅ Added missing Fitbit SQL queries:
   - `fitbit_activity_df`
   - `fitbit_hr_df`
   - `fitbit_sleep_df`
7. ✅ Moved `GeminiIntegration` and `tempfile` imports to top of file
8. ✅ Removed duplicate `import json`
9. ✅ Removed duplicate imports in middle of file

**Files Created:**
- `XAI_EXPLANATION.md` - Documentation for XAI dashboard interpretation
- `PROJECT_CONTEXT.md` - This file

### Session: 2026-01-26 (Afternoon - Gemini 3.0 Upgrade)

**Upgrades:**
1. ✅ Upgraded to **Gemini 3 Flash Preview** (latest model)
   - Primary: `gemini-3-flash-preview`
   - Fallback 1: `gemini-2.5-flash`
   - Fallback 2: `gemini-2.0-flash-exp`
2. ✅ Added automatic model detection and fallback system
3. ✅ Created `.gitignore` with security best practices
4. ✅ Fixed Windows Unicode emoji issues in console output
5. ✅ Tested and validated API connection with sentiment analysis

**Security Implemented:**
- API key stored in `.env` file (excluded from git)
- Created comprehensive `.gitignore` to prevent:
  - API key leaks
  - Database commits (patient data)
  - Sensitive uploads/photos

**Files Created:**
- `.gitignore` - Git security configuration

**Notes:**
- User has TWO copies of the project:
  - `Healthcare\` (MAIN - use this one)
  - `brain\2f60c22c-fd19-4f88-920b-5630c3e2ed3a\` (old copy - can delete)
- Always run from Healthcare folder
- Gemini API package (`google.generativeai`) has deprecation warning
  - Still works fine for now
  - Future migration: Switch to `google.genai` package
  - Not urgent - current package is stable

---

## Known Issues / TODO

- [ ] Gemini API using deprecated `google.generativeai` package
- [ ] Consider adding error handling for missing database tables
- [ ] The `brain\` folder copy should be deleted to avoid confusion

---

## Key Code Patterns

### Accessing HMM Constants
```python
# CORRECT:
from hmm_engine import EMISSION_PARAMS, safe_log, STATES
params = EMISSION_PARAMS['glucose_avg']
lp = safe_log(prob)

# WRONG:
params = engine.EMISSION_PARAMS  # Not a class attribute!
```

### Database Queries
```python
conn = sqlite3.connect("nexus_health.db")
df = pd.read_sql_query("SELECT * FROM glucose_readings", conn)
conn.close()
```

### Streamlit Session State
```python
if 'key' not in st.session_state:
    st.session_state.key = default_value
```

---

## Quick Reference

**Run the app:**
```bash
cd "c:\Users\brigh\.gemini\antigravity\Healthcare"
streamlit run streamlit_app.py
```

**Initialize database:**
```bash
python init_db.py
```

**Inject demo data:**
```bash
python inject_data.py
```

**Test HMM engine:**
```bash
python hmm_engine.py
```

---

## For AI Assistants

When helping with this project:

1. **Always read this file first** to understand context
2. **Update the "Recent Changes Log"** section when making changes
3. **The main files are in Healthcare folder**, not brain folder
4. **HMM constants** (EMISSION_PARAMS, STATES, safe_log, WEIGHTS) are module-level, not class attributes
5. **Run from Healthcare folder** with `streamlit run streamlit_app.py`
6. **Check imports** at top of streamlit_app.py if you get NameError

---

*Last Updated: 2026-01-26*
*Updated By: Claude Code (Opus 4.5)*
