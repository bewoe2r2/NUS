BEWO HEALTH — COMPETITION SLIDE DECK CONTENT
NUS-Synapxe-IMDA AI Innovation Challenge 2026
10 minutes. 15 slides. ~40 seconds each.

================================================================
NARRATIVE ARC
================================================================

ACT I — THE STAKES (Slides 1-2)
ACT II — THE BREAKTHROUGH (Slides 3-4)
ACT III — THE ENGINE (Slides 5-7)
ACT IV — THE PROOF (Slides 8-9)
ACT V — THE PEOPLE (Slides 10-12)
ACT VI — THE CASE (Slides 13-15)

================================================================


————————————————————————————————————————
SLIDE 1 — HOOK
————————————————————————————————————————

LABEL: Every 6 Minutes

TITLE: One preventable admission.

HERO: 6 minutes
[Giant number. Single unit beside it.]

SUPPORTING TEXT:
- That is how often a diabetic ER admission happens in Singapore.
- Most were predictable. None were predicted.

CONNECTOR: "Who are these patients?"

NOTES:
"Every six minutes, somewhere in Singapore, a diabetic patient arrives at the emergency department. Not because of a sudden accident — because of a slow, silent deterioration that nobody was watching. Most of these admissions were predictable days in advance. But nobody predicted them. Let me show you who we are talking about."


————————————————————————————————————————
SLIDE 2 — THE PROBLEM
————————————————————————————————————————

LABEL: The Problem

TITLE: Between visits, nobody is watching.

HERO: Mr. Tan Ah Kow
[Persona card: 67, lives alone, Toa Payoh HDB]

SUPPORTING TEXT (left column, stacked stats):
- 440K diabetics in Singapore — one in nine adults
- 3-6 months between clinic visits — that is 180 days alone
- $8,800 per preventable ER visit — paid by the system, suffered by the patient

SUPPORTING TEXT (persona card, right column):
- Type 2 Diabetes + Hypertension
- HbA1c 8.1% (target: 7.0%)
- Speaks Singlish and Hokkien
- Can barely use a phone
- Misses meds 2-3x per week
- He represents 440,000 Singaporeans.

CONNECTOR: "Current tools expect Mr. Tan to ask for help. He never will. So we asked a different question."

NOTES:
"Mr. Tan is 67. He lives alone in Toa Payoh. He has Type 2 Diabetes and hypertension, and his HbA1c is 8.1 — above target. He speaks Singlish, can barely use a smartphone, and misses his medication two to three times a week. His next clinic visit is three months away. Every app on the market expects him to open it and ask for help. He will not. He represents 440,000 Singaporeans in this exact gap — between visits, monitored by nobody. So we asked: what if the system reached out first?"


————————————————————————————————————————
SLIDE 3 — THE INSIGHT
————————————————————————————————————————

LABEL: The Insight

TITLE: LLMs hallucinate. In healthcare, that kills.

HERO: Two-column contrast
[Left, red: "The Problem" / Right, cyan: "Our Answer"]

SUPPORTING TEXT (left):
- LLMs are black boxes
- Cannot explain why
- Cannot guarantee safety

SUPPORTING TEXT (right):
- The math decides
- The AI communicates
- Safety is deterministic

BOTTOM LINE:
You cannot wrap GPT around a chatbot and deploy it for clinical decisions.

CONNECTOR: "So we built something fundamentally different. A four-layer architecture where each layer constrains the next."

NOTES:
"Every competitor in this space takes a large language model, wraps it in a chatbot, and calls it a health companion. The problem is LLMs hallucinate. On a customer support ticket, that is a minor inconvenience. In healthcare, 'take double your insulin' can kill someone. Our core insight: the clinical decision must never come from a language model. The math decides — deterministically, explainably. The AI communicates that decision in language the patient trusts. These are separate systems. That distinction is the foundation of everything we built."


————————————————————————————————————————
SLIDE 4 — SYSTEM DESIGN
————————————————————————————————————————

LABEL: System Design

TITLE: The Diamond Architecture.

HERO: Four-layer stack diagram
[L4 top to L1 bottom, each labelled with partner alignment]

SUPPORTING TEXT (each layer, one line):
- L4 — Cultural Intelligence: SEA-LION + MERaLiON for Singlish voice [IMDA]
- L3 — Agentic Reasoning: 18 tools + ReAct planning loop [NUS]
- L2 — Statistical Engine: HMM Viterbi + 2,000 Monte Carlo simulations [Core]
- L1 — Safety Foundation: ADA 2024 hardcoded, drug interactions, PII de-identification [Synapxe]

BOTTOM LINE:
The math decides. The AI communicates. Safety never bends.

CONNECTOR: "Let me zoom into the core — the statistical engine that makes the clinical decision."

NOTES:
"We call this the Diamond Architecture. Four layers, each constraining the next. At the foundation: hardcoded clinical safety rules from the ADA 2024 guidelines. These fire before anything else and cannot be overridden by AI. Above that: a statistical inference engine — Hidden Markov Models and Monte Carlo simulations. This is where the actual clinical state classification happens. Deterministic. Explainable. Above that: an agentic reasoning layer with 18 tools that decides what to do about the classification. At the top: Singapore's national AI models for cultural communication. Each layer talks to every other. No single layer acts alone."


————————————————————————————————————————
SLIDE 5 — TECHNICAL DEPTH: HMM
————————————————————————————————————————

LABEL: Core Innovation

TITLE: Why HMM, not neural nets.

HERO: 12.7 ms
[Giant number, right side]

SUPPORTING TEXT (comparison table, left side):
Dimension / HMM / LSTM / LLM
- Explainability: Full trace / Black box / "I think..."
- Hallucination: Impossible / Low / High
- On-device: <1ms / GPU needed / Cloud only
- Cold-start: 7 days / 10K+ samples / N/A
- Safety: 0 unsafe / No guarantee / Hallucination risk

BOTTOM TEXT:
"Can you explain WHY to a doctor, a patient, and a regulator?"

CONNECTOR: "But classification is not enough. You need to see the crisis before it arrives."

NOTES:
"Why Hidden Markov Models? Three reasons. First: HMMs cannot hallucinate. The output is a mathematically determined state — Stable, Warning, or Crisis — derived from transition probabilities across nine biomarkers. Every single classification can be traced back to its inputs. Second: they run in 12.7 milliseconds on a phone. No GPU, no cloud. Third: they work with just seven days of data. We do not need ten thousand training samples. We asked ourselves: can you explain every decision to a doctor, to the patient, and to a regulator? With HMMs, the answer is yes. With neural nets, it is not."


————————————————————————————————————————
SLIDE 6 — PREDICTION ENGINE
————————————————————————————————————————

LABEL: Prediction Engine

TITLE: See the crisis before it happens.

HERO: 48 hours
[Giant number, right side]

SUPPORTING TEXT (left column, stacked):
- Monte Carlo Simulation: 2,000 paths over a 48-hour horizon. A probability distribution of futures — not a single guess.
- Counterfactual Reasoning: "What if you take your meds?" Risk drops 35% to 12%. The patient sees the math behind the nudge.
- Merlion Time Series: ARIMA glucose velocity forecasting. 45-minute hypo/hyperglycemia lookahead.

CONNECTOR: "Prediction alone is not enough. Someone has to act on it. That is where the agent comes in."

NOTES:
"The HMM tells us where the patient is now. The prediction engine tells us where they will be in 48 hours. We run 2,000 Monte Carlo simulations — each one a plausible trajectory of the patient's nine biomarkers over the next two days. This gives us a probability distribution, not a point estimate. And then we do something powerful: counterfactual reasoning. We show the patient: if you take your medication, your crisis risk drops from 35 percent to 12 percent. This is not a motivational poster. This is their personal math. It is why nudges actually work."


————————————————————————————————————————
SLIDE 7 — AGENT ARCHITECTURE
————————————————————————————————————————

LABEL: Agentic AI

TITLE: Not a chatbot. A background agent.

HERO: 6 agent cards in 2x3 grid
[Planning / Check-in / Caregiver / Clinician / Behavior Coach / Cultural]

SUPPORTING TEXT (per card, one line each):
- Planning Agent — Orchestrates the daily care plan
- Check-in Agent — Proactive outreach, mood sensing
- Caregiver Agent — Family alerts, burden management
- Clinician Agent — SBAR reports, drug interaction checks
- Behavior Coach — Nudges, challenges, loss-aversion streaks
- Cultural Agent — Singlish translation, local dietary context

BOTTOM LINE:
18 tools. ReAct reasoning. Cross-session memory. Reaches out without being asked.

CONNECTOR: "Bold claims require hard proof. Let me show you the validation."

NOTES:
"This is what makes Bewo agentic — not a chatbot that waits for input, but a background agent that reasons, plans, and acts. Six specialized sub-agents, each with access to 18 tools. The Planning Agent orchestrates the daily care plan based on HMM state. The Check-in Agent initiates contact — the patient never has to open an app. The Caregiver Agent manages family alerts with fatigue detection so we do not burn out Mr. Tan's daughter. The Clinician Agent generates SBAR reports for the nurse. Every action is grounded in the statistical engine. The agent never freelances."


————————————————————————————————————————
SLIDE 8 — VALIDATION
————————————————————————————————————————

LABEL: Validation

TITLE: Zero unsafe misclassifications.

HERO: 0
[Giant green number, center stage]

SUPPORTING TEXT:
- No patient in danger was ever told they were safe.
- 5,000 hardened patients. 32 clinical archetypes. 230 tests passing.

BOTTOM STATS (three columns):
- 99.3% — accuracy on clean clinical data
- 100% — crisis recall (every true crisis detected)
- 82.1% — accuracy on hardened validation: patients with contradictory signals, the cases where other systems fail

CONNECTOR: "This engine speaks English. But Mr. Tan does not think in English."

NOTES:
"Here is the number that matters most. Zero. Zero cases where a patient in crisis was classified as stable. We tested against 5,000 hardened synthetic patients — deliberately designed with contradictory signals, borderline readings, and adversarial patterns. These are the hard cases. Our accuracy on those hard cases: 82.1 percent. On clean clinical data: 99.3 percent. That 82.1 is not a weakness — it is a 25.3 percent improvement over a glucose-only baseline. And we achieve it across 9 orthogonal biomarkers. 230 tests pass. 76 validation gates pass. Zero CRISIS-as-STABLE misclassifications."


————————————————————————————————————————
SLIDE 9 — NATIONAL AI MODELS
————————————————————————————————————————

LABEL: National AI Models

TITLE: Built on Singapore's own AI.

HERO: Split layout — SEA-LION left, MERaLiON right

SUPPORTING TEXT (SEA-LION, left):
- AI Singapore / 27B parameters
- Before: "Your blood glucose level of 15.2 mmol/L is significantly elevated..."
- After: "Uncle, your sugar a bit high lah. After makan, better take your medicine first, ok?"

SUPPORTING TEXT (MERaLiON, right):
- I2R / Paralinguistic Analysis
- Speech emotion recognition from voice
- Detects distress, fatigue, confusion — even when their words say "I'm fine"

HERO (right): 2 national LLMs integrated

CONNECTOR: "Now let me show you what this means for the three people who matter most."

NOTES:
"We deliberately built on Singapore's national AI stack. SEA-LION v4 from AI Singapore handles cultural adaptation. The difference is not cosmetic — Mr. Tan ignores clinical English. He responds to Singlish. The before-and-after speaks for itself. MERaLiON from I2R does something no text-based system can: it listens to how Mr. Tan sounds, not just what he says. When he says 'I'm fine lah' but his voice carries fatigue markers, MERaLiON flags it. We are one of the first applications to integrate both national models in a production healthcare pipeline."


————————————————————————————————————————
SLIDE 10 — FOR THE PATIENT
————————————————————————————————————————

LABEL: For the Patient

TITLE: Zero effort. The system does the work.

HERO: "Works for Mr. Tan who can barely use a phone."

SUPPORTING TEXT (stacked features, left):
- Singlish Chat — Talks like a friend, not a doctor. SEA-LION translates clinical language.
- Voice Check-ins — MERaLiON detects emotional state from tone. No typing required.
- Glucose OCR — Point camera at meter. Reading captured automatically.
- Loss-aversion Vouchers — Losses motivate 2x more than gains (Kahneman's Prospect Theory).

RIGHT SIDE:
Voice-first. Proactive outreach. The patient never has to initiate.

CONNECTOR: "Mr. Tan is covered. But his daughter checks her phone during lunch, worried. What does she see?"

NOTES:
"For the patient, the design principle is zero friction. Mr. Tan does not open an app. Bewo calls him. It speaks Singlish. If he does not pick up, it tries again later. When he does answer, MERaLiON reads his emotional state from his voice. For glucose readings, he points his phone camera at his meter — OCR captures it. No typing, no menus. And for motivation, we use Prospect Theory: Mr. Tan has earned a $2 hawker voucher, but he loses it if he skips medication. Losses hurt twice as much as gains. That is behavioral science, not gamification."


————————————————————————————————————————
SLIDE 11 — FOR THE CAREGIVER
————————————————————————————————————————

LABEL: For the Caregiver

TITLE: "Your father is safe."

HERO: The title IS the hero — a quote that every caregiver wants to hear.

SUPPORTING TEXT (four cards, 2x2):
- One-glance Dashboard: Green / yellow / red. Answered in under one second.
- 3-Tier Escalation: Info = push notification. Warning = SMS. Critical = phone call.
- One-tap Response: Acknowledge, call, or escalate. No app-switching.
- Burden Scoring: Detects caregiver fatigue. Auto-switches to digest mode.

BOTTOM LINE:
Designed for a working daughter checking her phone during lunch.

CONNECTOR: "The patient is monitored. The family is informed. But the nurse still has 100 patients. How does she cope?"

NOTES:
"Four words every caregiver wants to hear: your father is safe. The caregiver dashboard answers that question in under one second — green, yellow, or red. No graphs to interpret, no clinical jargon. Escalation is automatic and tiered: routine updates push silently, warnings send an SMS, critical alerts trigger a phone call. And here is what nobody else builds: burden scoring. If Mr. Tan's daughter is getting too many alerts, the system detects caregiver fatigue and auto-switches to digest mode — one daily summary instead of twelve individual pings. We protect the caregiver too."


————————————————————————————————————————
SLIDE 12 — FOR THE NURSE
————————————————————————————————————————

LABEL: For the Nurse

TITLE: The system surfaces. The human decides.

HERO: 1:100
[Giant number — nurse-to-patient ratio]

SUPPORTING TEXT (left column):
- Auto-SBAR Reports: Generated in 3 seconds. Manual takes 15 minutes.
- Urgency-ranked Triage: Patients sorted by risk. Highest urgency surfaces first.
- Drug Interaction Engine: 16 interaction pairs, 39 drug classes. Checked before every suggestion.

BELOW HERO:
nurse-to-patient ratio (from 1:20 today)

CONNECTOR: "The system works. But can we trust it? Let me address safety directly."

NOTES:
"Today, a community nurse manages about 20 patients. With Bewo handling continuous monitoring, triage, and documentation, that ratio can scale to 1:100. Not by replacing the nurse — by surfacing the right patient at the right time. Auto-SBAR reports are generated in 3 seconds. That is 15 minutes of documentation eliminated per patient encounter. The drug interaction engine checks 16 interaction pairs across 39 drug classes before any suggestion reaches the patient. The nurse still decides. Bewo makes sure she is deciding about the right patient, with the right information, at the right time."


————————————————————————————————————————
SLIDE 13 — SAFETY AND GOVERNANCE
————————————————————————————————————————

LABEL: Safety and Governance

TITLE: Safety is never probabilistic.

HERO: Three-column card layout

SUPPORTING TEXT (card 1 — Data Protection, red label):
- PDPA compliant by design
- Data never leaves Singapore
- PII de-identified before every LLM call
- Prompt injection sanitization

SUPPORTING TEXT (card 2 — Clinical Safety, amber label):
- 6-dimension safety classifier
- Drug interaction engine pre-screens every output
- ADA 2024 guidelines hardcoded
- Fail-closed: system crash = safe fallback, never dangerous silence

SUPPORTING TEXT (card 3 — Audit and Compliance):
- Full decision audit trail
- Every HMM state transition logged
- Deterministic rules override AI — always
- Constant-time API key comparison (timing attack prevention)

BOTTOM LINE:
"Take double insulin" is impossible to generate. Safety rules are deterministic. They fire before the AI ever speaks.

CONNECTOR: "Trust established. Now: can it scale?"

NOTES:
"If you remember one thing from this talk, remember this: 'take double insulin' is impossible to generate. Not unlikely. Impossible. Our 6-dimension safety classifier screens every output for medical overclaims, hallucination, emotional mismatch, and scope violations. ADA 2024 guidelines are hardcoded — glucose below 3.0 or above 20.0 forces a Crisis state regardless of what any model says. The system is fail-closed: if it crashes, patients get a safe fallback message and the nurse is alerted. We never fail silently. Every state transition, every tool call, every LLM prompt is logged in a full audit trail. This is designed for regulators."


————————————————————————————————————————
SLIDE 14 — IMPACT NUMBERS
————————————————————————————————————————

LABEL: The Numbers

TITLE: Built to deploy, not to demo.

HERO: Six metric cards in 3x2 grid

SUPPORTING TEXT (card by card):
- $0.40 per patient per month — cheaper than a single blood test
- $8,800 saved per prevented ER visit — one save funds the system for years
- 22,000 patient-months funded by a single ER save — the economics are overwhelming
- 186ms total core pipeline — real-time on a phone, no server dependency
- 230/230 tests, 76/76 gates — every validation gate green
- 32,400 lines of production code — this is not a prototype

CONNECTOR: "Let me leave you with where this goes."

NOTES:
"Let me make the business case in one sentence. At 40 cents per patient per month, preventing a single ER admission — which saves $8,800 — funds 22,000 patient-months of Bewo. The economics are not marginal; they are overwhelming. The entire core pipeline runs in 186 milliseconds on a phone. This is 32,400 lines of production code with 230 tests and 76 validation gates all passing. We are not showing you a Figma mockup. We are not showing you a demo. We are showing you a system that is engineered to deploy into Singapore's healthcare infrastructure."


————————————————————————————————————————
SLIDE 15 — CLOSE
————————————————————————————————————————

LABEL: [none]

TITLE:
Bewo does not wait for crisis.
It predicts. It prevents. It protects.

HERO: The title IS the hero.

SUPPORTING TEXT:
From diabetes to all chronic disease.
From Singapore to ASEAN.

BRANDING:
Bewo Health
NUS-Synapxe-IMDA AI Innovation Challenge 2026

CONNECTOR: [final slide — no connector needed]

NOTES:
"440,000 diabetics in Singapore. Months between clinic visits. A healthcare system stretched to its limit. Bewo fills that gap — not as a chatbot that waits, but as an agent that watches, predicts, and acts. Built on Singapore's national AI models. Validated on 5,000 hardened patients. Zero unsafe misclassifications. 40 cents per patient per month. We started with diabetes. The architecture generalizes to hypertension, COPD, heart failure — any condition with longitudinal biomarker data. From Singapore to ASEAN. Bewo does not wait for crisis. It predicts. It prevents. It protects. Thank you."


================================================================
APPENDIX: STAT USAGE TRACKER
================================================================

All required stats and where they appear:

440K diabetics ................ Slide 2 (problem), Slide 15 (close)
$8,800/ER visit .............. Slide 2 (problem), Slide 14 (numbers)
82.1% hardened accuracy ....... Slide 8 (validation)
99.3% clean accuracy .......... Slide 8 (validation)
Zero CRISIS-as-STABLE ......... Slide 8 (validation) — THE hero number
+25.3% vs baseline ............ Slide 8 (notes)
12.7ms HMM inference .......... Slide 5 (HMM depth)
186ms total pipeline ........... Slide 14 (numbers)
2,000 Monte Carlo sims ........ Slide 4 (architecture), Slide 6 (prediction)
48-hour prediction window ...... Slide 6 (prediction) — hero number
18 agentic tools .............. Slide 7 (agent)
9 orthogonal biomarkers ....... Slide 8 (notes)
$0.40/patient/month ........... Slide 14 (numbers)
1:100 nurse ratio ............. Slide 12 (nurse) — hero number
230/230 tests, 76/76 gates .... Slide 8 (notes), Slide 14 (numbers)
32,400 lines of code .......... Slide 14 (numbers)
SEA-LION + MERaLiON ........... Slide 4 (architecture), Slide 9 (national AI)


================================================================
APPENDIX: PROBLEM STATEMENT ALIGNMENT
================================================================

PS1 Proactive Patient Engagement:
  Slides 7 (agent reaches out), 10 (zero effort), 6 (prediction)

PS2 Hyper-Personalization:
  Slides 5 (9 biomarkers), 6 (counterfactual "what-if"), 9 (Singlish)

PS3 Bridge Patient-Clinician Gap:
  Slides 12 (auto-SBAR), 11 (caregiver dashboard), 7 (clinician agent)

PS4 Measuring Real-World Impact:
  Slides 8 (validation), 14 (numbers), 13 (audit trail)


================================================================
APPENDIX: CONNECTOR MAP
================================================================

Slide 1 -> 2: "Who are these patients?"
Slide 2 -> 3: "Current tools expect him to ask. He never will."
Slide 3 -> 4: "So we built something fundamentally different."
Slide 4 -> 5: "Let me zoom into the core."
Slide 5 -> 6: "Classification is not enough. You need to see ahead."
Slide 6 -> 7: "Prediction alone is not enough. Someone has to act."
Slide 7 -> 8: "Bold claims require hard proof."
Slide 8 -> 9: "The engine speaks English. Mr. Tan does not."
Slide 9 -> 10: "What does this mean for the three people who matter?"
Slide 10 -> 11: "Mr. Tan is covered. What about his daughter?"
Slide 11 -> 12: "Family is informed. But the nurse has 100 patients."
Slide 12 -> 13: "It works. But can we trust it?"
Slide 13 -> 14: "Trust established. Can it scale?"
Slide 14 -> 15: "Where this goes."

Each connector answers the question the judge is forming and directs
attention to the next logical beat. No dead air. No "why am I seeing this?"


================================================================
APPENDIX: TIMING GUIDE
================================================================

Slide  1: 0:00 - 0:30  (30s — short, punchy hook)
Slide  2: 0:30 - 1:15  (45s — emotional anchor, persona)
Slide  3: 1:15 - 1:55  (40s — insight, fast)
Slide  4: 1:55 - 2:40  (45s — architecture overview)
Slide  5: 2:40 - 3:25  (45s — HMM justification)
Slide  6: 3:25 - 4:05  (40s — prediction engine)
Slide  7: 4:05 - 4:50  (45s — agent architecture)
Slide  8: 4:50 - 5:40  (50s — validation, linger here)
Slide  9: 5:40 - 6:20  (40s — national AI)
Slide 10: 6:20 - 7:00  (40s — patient)
Slide 11: 7:00 - 7:35  (35s — caregiver)
Slide 12: 7:35 - 8:15  (40s — nurse)
Slide 13: 8:15 - 8:55  (40s — safety)
Slide 14: 8:55 - 9:30  (35s — numbers, punchy)
Slide 15: 9:30 - 10:00 (30s — close, land it)

Total: 10:00
