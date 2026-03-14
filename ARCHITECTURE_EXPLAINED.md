# Bewo Architecture Explained

A plain-English explainer for the team. No jargon walls — just how each piece works and why it exists.

---

## The Big Picture: Diamond Architecture v7

Everything flows through a pipeline. Each layer does ONE job and passes its result to the next.

```
Patient Data
    |
    v
[1] HMM Engine  -----> "Patient is in WARNING state, 73% confidence"
    |
    v
[2] Merlion Risk -----> "Glucose will spike in 45 min, velocity +0.4 mmol/h"
    |
    v
[3] Gemini Agent -----> Thinks in a loop, picks tools, executes actions
    |
    v
[4] Safety Filter ----> Checks response for medical errors, tone mismatch
    |
    v
[5] SEA-LION ---------> Translates to Singlish: "Uncle ah, sugar going up leh"
    |
    v
Patient receives message
```

Why "Diamond"? Because data fans out (HMM calculates many things), converges into Gemini for reasoning, then fans out again through safety + translation. If you draw it, it looks like a diamond shape.

---

## Layer 1: The HMM Engine (The Brain)

**File:** `core/hmm_engine.py`

### What is an HMM?

HMM = Hidden Markov Model. Think of it like this:

- The patient has a **hidden health state**: STABLE, WARNING, or CRISIS
- We can't directly see this state — it's "hidden"
- What we CAN see are **observations**: glucose readings, step counts, medication adherence, sleep quality, etc.
- The HMM figures out the most likely hidden state based on the pattern of observations over time

It's called "Markov" because the next state depends only on the current state (not the entire history). Like how weather tomorrow mostly depends on weather today, not weather 3 weeks ago.

### The 9 Features (What We Observe)

Each observation has 9 measurements, chosen because they're **orthogonal** (each captures something the others don't):

| Feature | What it measures | Weight |
|---------|-----------------|--------|
| glucose_avg | Average blood glucose (mmol/L) | 25% |
| glucose_variability | How much glucose swings up/down (CV%) | 10% |
| meds_adherence | % of medications taken on time | 18% |
| carbs_intake | Daily carbohydrate intake (grams) | 7% |
| steps_daily | Daily step count | 8% |
| resting_hr | Resting heart rate (bpm) | 5% |
| hrv_rmssd | Heart rate variability (autonomic stress) | 7% |
| sleep_quality | Sleep quality score (0-10) | 10% |
| social_engagement | Daily social interactions | 10% |

**Why these weights?** Glucose and medication adherence matter most for diabetes management. But we also track physical, cardiac, sleep, and social factors because diabetes is a whole-body disease.

### Emission Parameters (How States Look)

Each state has a "profile" — what observations typically look like when someone is in that state. These are **Gaussian (bell curve) distributions**.

Example for glucose_avg:
- **STABLE:** centered at 6.5 mmol/L (normal diabetic range)
- **WARNING:** centered at 11.5 mmol/L (above target)
- **CRISIS:** centered at 18.0 mmol/L (dangerously high)

So if we see glucose at 12.0, the model says "this looks most like WARNING" because 12.0 is closest to the WARNING bell curve center.

### Transition Probabilities (How States Change)

The transition matrix says: "If you're in state X right now, what's the probability of being in state Y next?"

```
              To:
         STABLE  WARNING  CRISIS
From:
STABLE    85%     12%      3%
WARNING   30%     55%      15%
CRISIS    10%     35%      55%
```

Reading this: a STABLE patient has 85% chance of staying STABLE, 12% chance of moving to WARNING, 3% chance of jumping to CRISIS. A CRISIS patient has 55% chance of staying in CRISIS — it's "sticky" because crises don't resolve instantly.

### Viterbi Algorithm (The Decoder)

**What it does:** Given a sequence of observations over time, find the MOST LIKELY sequence of hidden states.

**How it works (simple version):**

1. Start with the first observation. Calculate: "How likely is this observation if the patient is STABLE? WARNING? CRISIS?"
2. For each next observation, calculate: "For each possible current state, what's the best previous state that could have led here?" (using transition probabilities + observation likelihood)
3. At the end, trace back through the best path

It's like finding the best route on Google Maps — at each intersection (time step), you only keep the best path to that point, and at the end you trace back.

**Why not just look at the latest reading?** Because a single high glucose reading might be a one-off (ate too much at a hawker center). Viterbi looks at the PATTERN over time. Three consecutive high readings → much more likely to be a real WARNING than one spike.

### Baum-Welch Algorithm (The Learner)

**What it does:** Learns PERSONALIZED transition and emission parameters for each patient from their historical data.

**The problem:** The default HMM parameters are population-level averages. But Uncle Tan's "normal" glucose might be 7.5, while Auntie Lee's is 5.8. One size doesn't fit all.

**How it works (EM = Expectation-Maximization):**

1. **E-step (Forward-Backward):** Run the Forward algorithm (calculate probability of seeing observations 1..t while being in state s at time t) and the Backward algorithm (calculate probability of seeing observations t+1..T given state s at time t). Combine them to get: "At each time step, what's the probability of being in each state?"

2. **M-step (Update parameters):** Using those probabilities as weights, recalculate:
   - New transition matrix: "How often did state X transition to state Y?"
   - New emission means: "What's the weighted average glucose when the patient is STABLE?"
   - New emission variances: "How spread out are readings in each state?"

3. **Repeat** until the log-likelihood stops improving (converges) or we hit 20 iterations.

**Result:** Uncle Tan gets his own personalized transition matrix and emission parameters. The HMM now "knows" that Uncle Tan's WARNING state looks different from the population average.

**Why log-space?** When you multiply many small probabilities together (hundreds of observations), the numbers get incredibly tiny — like 0.000000000000001. Computers can't handle that (underflow). So we work in log-space where multiplication becomes addition: log(a x b) = log(a) + log(b). The log-sum-exp trick handles addition in log-space without losing precision.

### Monte Carlo Simulation (The Predictor)

**What it does:** Answers "What's the probability of a CRISIS in the next 48 hours?"

**How it works:**

1. Take the current belief state (e.g., 20% STABLE, 65% WARNING, 15% CRISIS)
2. Run 2000 simulated futures:
   - At each hour, randomly pick the next state using the transition matrix
   - If the simulated state hits CRISIS, record the time
3. Count: out of 2000 simulations, how many hit CRISIS? That's your probability.
4. Calculate confidence intervals from the distribution of crisis times.

**Why Monte Carlo?** Because the math for "probability of ever reaching CRISIS within 48 hours" is hard to solve analytically with 3 states and 48 time steps. It's easier to just simulate 2000 futures and count.

### Counterfactual Analysis (The "What-If" Machine)

**What it does:** Shows the patient "What would happen if you took your medication / ate less carbs / walked more?"

**How it works:**

1. Run baseline projection: "Given current observations, here's your 24-hour outlook"
2. Modify the observation to reflect the intervention:
   - "take_medication" → set meds_adherence to 1.0
   - "adjust_carbs" → reduce carbs_intake by specified amount
   - "increase_activity" → add steps to steps_daily
3. Run projection again with the modified observation
4. Compare: "Baseline crisis risk: 45%. After taking medication: 18%. Risk reduction: 27%."

This is powerful because it's not hand-wavy — it runs through the actual HMM math. The risk reduction is calculated, not guessed.

---

## Layer 2: Merlion Risk Forecast

**Where:** Called in `agent_runtime.py` via `_get_merlion_forecast()`

Merlion is a time-series forecasting library built by A*STAR Singapore. It takes the last 12 glucose readings and predicts the next 45 minutes — giving velocity (how fast glucose is changing) and acceleration (is the change speeding up or slowing down).

**Current status:** We have an integration point that currently uses Gemini to simulate what Merlion would return. The actual Merlion library (`salesforce-merlion`) can be swapped in by changing one internal method. This is a deliberate design — the rest of the system doesn't care which forecasting engine is behind the interface.

**Why it matters:** The HMM tells you "patient IS in WARNING." Merlion tells you "glucose WILL spike in 30 minutes." Past vs. future. Both feed into the Gemini agent so it can make proactive decisions.

---

## Layer 3: Gemini Agent (The Reasoning Engine)

**File:** `core/agent_runtime.py`

### The ReAct Loop

ReAct = Reasoning + Acting. Instead of Gemini just generating a response, it runs in a loop:

```
Turn 0: Gemini sees EVERYTHING (HMM state, Merlion forecast, patient history,
        memories, conversation). Picks tool(s) to use.

Turn 1: Gemini sees tool results. Thinks: "Do I need more info?" If yes,
        picks more tools. If no, generates response.

Turn 2-3: Same — observe results, decide if more tools needed.

Turn 4 (final): MUST generate a response. No more tools allowed.
```

**Max 5 turns.** This prevents infinite loops. On the final turn, the prompt explicitly says "you MUST respond now."

### The 18 Tools

The agent can use any of these tools during its reasoning:

| Tool | What it does |
|------|-------------|
| book_appointment | Book polyclinic appointment (blind booking — no patient identity sent) |
| send_caregiver_alert | Alert family: info (push), warning (SMS), critical (SMS+call) |
| calculate_counterfactual | Run "what-if" scenario through HMM |
| suggest_medication_adjustment | Generate dose change recommendation FOR DOCTOR (never auto-adjusts) |
| set_reminder | Schedule medication/exercise/hydration reminders |
| alert_nurse | SBAR-formatted alert to assigned nurse |
| alert_family | Patient-approved health update to family |
| award_voucher_bonus | Give $1-5 voucher credit for good behavior |
| request_medication_video | Gently ask patient to video themselves taking meds |
| suggest_activity | Recommend walk/stretch/tai chi/rest based on current state |
| escalate_to_doctor | Flag for urgent doctor review (CRISIS only) |
| recommend_food | Culturally appropriate food suggestions (hawker center options) |
| schedule_proactive_checkin | AI-initiated check-in when risk is rising |
| celebrate_streak | Celebrate medication/logging/exercise streaks with voucher bonus |
| generate_weekly_report | Weekly health summary with grade |
| adjust_nudge_schedule | Shift reminder times to when patient is most responsive |
| generate_clinician_summary | Full SBAR + HMM + risk report for clinicians |
| check_drug_interactions | Check medication pair interactions before any med advice |

### How Tools Execute

When Gemini says "I want to use `check_drug_interactions`", the runtime:
1. Parses the tool name and arguments from Gemini's JSON response
2. Routes to the correct `_exec_*` function
3. Executes against the SQLite database
4. Returns the result to Gemini for the next turn
5. Logs the action in `agent_actions_log`

### The Prompt

The prompt sent to Gemini on Turn 0 includes:
- Patient profile (name, age, conditions, medications)
- Full HMM state (current state, confidence, state probabilities)
- Monte Carlo crisis prediction (48h crisis probability)
- Counterfactual results (what-if scenarios pre-calculated)
- Merlion glucose forecast (velocity, acceleration, 45-min prediction)
- Top contributing factors with weights
- Conversation history (last 6 turns)
- Agent memories (preferences, patterns, medical notes)
- All 18 tool definitions
- The user's message

It's a LOT of context — but that's the point. The agent has everything it needs to make an informed decision without asking follow-up questions.

---

## Layer 4: Safety Classifier

**What it does:** Every response from Gemini goes through a SEPARATE safety check before reaching the patient. This is an independent Gemini call — not part of the agent loop.

**6 dimensions checked:**

1. **MEDICAL_CLAIM:** Does the response make specific dosage/diagnosis claims? (Only doctors should do that)
2. **EMOTIONAL_MISMATCH:** Is the tone wrong? (Cheerful during CRISIS = bad)
3. **HALLUCINATION:** Does it mention medications the patient doesn't take?
4. **CULTURAL_ISSUE:** Inappropriate for elderly Singaporean patient?
5. **SCOPE_VIOLATION:** Goes beyond chronic disease management?
6. **DANGEROUS_ADVICE:** Could cause harm if followed? (e.g., "stop your medication")

**Verdicts:** SAFE (pass through), CAUTION (flag but send), BLOCKED (replace with safe fallback)

---

## Layer 5: SEA-LION (The Cultural Translator)

**File:** `core/sealion_interface.py`

SEA-LION v4 27B is a real language model built by AI Singapore. We call it through Cloudflare Workers AI.

**What it does:** Takes the clinical message from Gemini and rewrites it in authentic Singlish for elderly Singaporean patients.

**Before SEA-LION:**
> "Your glucose is dropping rapidly. You need to eat 15 grams of carbohydrates immediately to prevent hypoglycemia."

**After SEA-LION:**
> "Sugar down fast lah! Makan something sweet now! Fifteen grams, quickly! Or else faint leh. Don't play play hor."

**Why this matters:** Elderly Singaporeans don't respond well to "corporate medical English." Trust is built through familiar language — lah, leh, lor particles; kopitiam references; uncle/auntie framing. This isn't cosmetic — studies show communication style directly affects medication adherence.

**Backend priority:**
1. Cloudflare Workers AI → Real SEA-LION v4 27B (what we use now)
2. Gemini mock → Prompt-engineered Singlish (fallback if Cloudflare is down)
3. Offline mock → Basic string append (testing only)

---

## The 7 Ceiling Features

These are the advanced features that push the project beyond a basic chatbot.

### 1. Agent Memory (Cross-Session Learning)

The agent REMEMBERS things across conversations. Three memory types:

- **Episodic:** Specific events ("Patient complained about knee pain on Tuesday")
- **Semantic:** Patterns extracted from episodes ("Patient usually has high glucose on weekends")
- **Preference:** Patient preferences ("Prefers morning reminders, doesn't like calls after 9pm")

Gemini extracts memories from conversations automatically. During weekly reports, episodic memories get **consolidated** into semantic patterns (e.g., 5 separate "high glucose after lunch" episodes become one "patient has post-lunch glucose spikes" pattern).

### 2. Proactive Scheduler

The system doesn't wait for the patient to message first. It scans for 6 trigger conditions:

1. **glucose_rising** — Merlion velocity > 0.3 and accelerating
2. **sustained_risk** — WARNING/CRISIS for 2+ consecutive observations
3. **logging_gap** — No data for > 24 hours
4. **med_nudge** — Missed medication detected
5. **streak_save** — Patient about to lose a streak
6. **mood_followup** — Sadness detected in recent conversation

When triggered, the agent initiates a check-in without being asked.

### 3. Outcome-Based Tool Selection

Not all tools work equally well for every patient. The system tracks:
- How many times each tool was used for each patient
- Whether the patient's state improved after using that tool
- Recent effectiveness (14-day half-life — old data matters less)

This gets injected into the Gemini prompt so it prioritizes tools that actually WORK for this specific patient.

### 4. Response Safety Classifier

(Described in Layer 4 above — 6-dimension safety check on every response)

### 5. Multi-Patient Nurse Triage

For the nurse dashboard. Scores all patients by urgency:

```
urgency = crisis_weight x (1 - attention_score)
```

- **crisis_weight:** CRISIS=1.0, WARNING=0.6, STABLE=0.1
- **attention_score:** Decays over time — patients who haven't been checked on recently get higher urgency

Categories: IMMEDIATE (>0.7), SOON (>0.4), MONITOR (>0.2), STABLE

IMMEDIATE patients automatically get an SBAR report generated. SBAR = Situation, Background, Assessment, Recommendation — the standard clinical handoff format.

### 6. Caregiver Bidirectional Communication

Alerts aren't one-way anymore. Caregivers can respond:
- **acknowledged** — "I saw it"
- **on_the_way** — "Coming to check"
- **need_help** — "I don't know what to do"
- **escalate_to_nurse** — "This needs professional help"
- **note** — Free-text response

The system also tracks **caregiver burden** (0-100 score):
- Alert volume weighted by severity (0-30 pts)
- Response latency (0-25 pts)
- Missed acknowledgments (0-25 pts)
- Patient crisis frequency (0-20 pts)

If burden > 70, the system automatically switches to **digest mode** — batching alerts instead of sending each one individually. This prevents caregiver burnout.

### 7. Drug Interaction Checker

Before the agent gives ANY medication-related advice, it checks drug interactions.

- 16 known interaction pairs (e.g., metformin + alcohol, benzodiazepines + opioids)
- 39 drug-to-class mappings (e.g., morphine → opioids, lisinopril → ACE inhibitors)
- Severity levels: CONTRAINDICATED (never combine), MAJOR, MODERATE, MINOR
- CONTRAINDICATED interactions auto-block the medication suggestion

---

## The Database

SQLite with ~35 tables. Key ones:

| Table | What it stores |
|-------|---------------|
| patients | Demographics, conditions, medications |
| glucose_readings | CGM data (4032 readings for demo patients) |
| agent_actions_log | Every tool the agent has ever executed |
| agent_memory | Cross-session memories (episodic/semantic/preference) |
| caregiver_alerts | Alerts sent to family |
| caregiver_responses | Family responses to alerts |
| nurse_alerts | Alerts sent to nurses |
| appointments | Booked appointments |
| voucher_tracker | Gamification voucher balances |
| reminders | Scheduled patient reminders |

---

## API Routes (53 total)

The backend is **FastAPI** (not Flask). All routes are in `backend/api.py`.

Key route groups:
- **Patient state** (5 routes): HMM inference, history, trends
- **Agent** (16 routes): Chat, proactive check-ins, streaks, engagement, memories, tool effectiveness
- **Glucose** (3 routes): Logging, OCR, narratives
- **Medications** (2 routes): List, adherence logging
- **Drug interactions** (2 routes): Check current meds, check proposed new med
- **Nurse triage** (4 routes): Multi-patient triage dashboard
- **Caregiver** (3 routes): Respond to alerts, dashboard, burden score
- **HMM training** (2 routes): Baum-Welch training, view learned parameters
- **Impact metrics** (2 routes): KPIs, intervention effectiveness
- **Admin** (3 routes): Inject scenarios, manual HMM run, reset

---

## How a Request Actually Flows (End to End)

Let's trace what happens when a patient sends "How am I doing today?"

1. **POST /chat** hits `api.py`
2. `run_agent()` is called in `agent_runtime.py`
3. HMM engine fetches latest observations from SQLite, runs Viterbi → "WARNING, 73% confidence"
4. Monte Carlo runs 2000 simulations → "38% crisis risk in 48h"
5. Counterfactual pre-calculates → "Taking medication reduces risk by 22%"
6. Merlion forecasts glucose velocity → "+0.3 mmol/h, accelerating"
7. Agent memories loaded → "Patient prefers morning check-ins, has weekend glucose spikes"
8. Everything packed into a massive prompt → sent to Gemini
9. **Turn 0:** Gemini reasons: "Patient is WARNING with rising glucose. I should check drug interactions first, then recommend food."
   - Calls `check_drug_interactions` → no conflicts
   - Calls `recommend_food` → "Have fish soup instead of nasi lemak for dinner"
10. **Turn 1:** Gemini sees tool results, decides to also award a voucher for logging today
    - Calls `award_voucher_bonus` → $2 credited
11. **Turn 2:** Gemini generates final response with all context
12. Safety classifier checks the response → SAFE
13. SEA-LION translates → "Uncle ah, today not bad but sugar going up a bit leh. Tonight dinner, try fish soup instead of nasi lemak can? And wah, you log every day this week — steady lah! Got $2 voucher bonus for you!"
14. Response returned to patient

---

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| HMM Engine | `core/hmm_engine.py` | State inference (Viterbi), learning (Baum-Welch), prediction (Monte Carlo), what-if (counterfactual) |
| Agent Runtime | `core/agent_runtime.py` | ReAct loop, 18 tools, safety classifier, 7 ceiling features, prompt building |
| SEA-LION | `core/sealion_interface.py` | Singlish translation via real SEA-LION v4 27B on Cloudflare |
| API | `backend/api.py` | 53 FastAPI routes |
| Database | `database/nexus_health.db` | SQLite, ~35 tables, 3 demo patients |

**Tech stack:** Python, FastAPI, SQLite, Gemini AI, SEA-LION v4 27B (Cloudflare Workers AI), NumPy

**No external ML dependencies for HMM** — Viterbi, Baum-Welch, Monte Carlo, Forward-Backward all implemented from scratch. Only NumPy for matrix operations.
