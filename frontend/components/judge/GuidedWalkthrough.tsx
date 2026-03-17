"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
    ChevronRight,
    ChevronLeft,
    Play,
    Loader2,
    Sparkles,
    Brain,
    Shield,
    Heart,
    Stethoscope,
    Terminal,
    AlertTriangle,
    CheckCircle2,
    Eye,
    ArrowRight,
    Target,
    TrendingUp,
    Activity,
    Pill,
    MessageSquare,
    Award,
    FileText,
    Mic,
    Clock,
    DollarSign,
} from "lucide-react";

type TabId = "overview" | "patient" | "nurse" | "intelligence" | "tooldemo";
type CardPos = "center" | "below" | "right" | "left" | "bottom-left";

interface WalkthroughStep {
    id: string;
    phase: string;
    phaseColor: string;
    title: string;
    subtitle: string;
    body: string;
    insight: string;
    tab?: TabId;
    action?: () => Promise<void>;
    actionLabel?: string;
    icon: React.ReactNode;
    stat?: { value: string; label: string };
    visualHint?: string;
    highlight?: string;
    pos: CardPos;
    scrollTo?: string;
}

interface GuidedWalkthroughProps {
    onClose: () => void;
    onTabChange: (tab: TabId) => void;
    onRefresh: () => void;
    onStepChange?: (step: number) => void;
    initialStep?: number;
}

export function GuidedWalkthrough({ onClose, onTabChange, onRefresh, onStepChange, initialStep }: GuidedWalkthroughProps) {
    const [currentStep, setCurrentStep] = useState(initialStep ?? 0);
    const [actionRunning, setActionRunning] = useState(false);
    const [actionDone, setActionDone] = useState<Set<number>>(new Set());
    const [transitioning, setTransitioning] = useState(false);
    const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [mounted, setMounted] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [judgeName, setJudgeName] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    const [pipelineStage, setPipelineStage] = useState<string | null>(null);

    const runAction = useCallback(async (action: () => Promise<void>, stepIdx: number) => {
        setActionRunning(true);
        setActionError(null);
        setPipelineStage("Initializing...");

        const stageObserver = setInterval(() => {
            const consoleEl = document.querySelector('#sidebar-console .space-y-1');
            if (consoleEl) {
                const lastLine = consoleEl.lastElementChild?.textContent?.trim();
                if (lastLine && lastLine.length > 5) {
                    const short = lastLine.length > 45 ? lastLine.slice(0, 42) + '...' : lastLine;
                    setPipelineStage(short);
                }
            }
        }, 300);

        try {
            await action();
            setActionDone(prev => new Set(prev).add(stepIdx));
            onRefresh();
        } catch (e) {
            console.error("Walkthrough action failed:", e);
            setActionError("Pipeline encountered an issue. You can retry or skip to the next step.");
            setActionDone(prev => new Set(prev).add(stepIdx));
        } finally {
            clearInterval(stageObserver);
            setPipelineStage(null);
            setActionRunning(false);
        }
    }, [onRefresh]);

    const injectScenario = useCallback(async (scenario: string) => {
        const scenarioBtn = document.querySelector(`[data-scenario="${scenario}"]`) as HTMLButtonElement | null;
        if (scenarioBtn) {
            scenarioBtn.click();
            await new Promise(r => setTimeout(r, 150));
        }

        const runBtn = document.getElementById('btn-run-sim') as HTMLButtonElement;
        if (runBtn && !runBtn.disabled) {
            runBtn.click();
            await new Promise<void>(resolve => {
                const check = setInterval(() => {
                    const freshBtn = document.getElementById('btn-run-sim') as HTMLButtonElement;
                    if (freshBtn && !freshBtn.disabled && !freshBtn.textContent?.includes('Running')) {
                        clearInterval(check);
                        resolve();
                    }
                }, 500);
                setTimeout(() => { clearInterval(check); resolve(); }, 15000);
            });
        } else {
            await api.resetData();
            await api.injectScenario(scenario, 14);
            await api.runHMM();
            try { await api.trainHMM("P001"); } catch { /* ok */ }
        }
    }, []);

    const steps: WalkthroughStep[] = [
        // ===============================================
        // ACT 1: SETUP — Meet the characters (Steps 0-5)
        // ===============================================
        {
            id: "welcome",
            phase: "WELCOME",
            phaseColor: "from-blue-600 to-indigo-600",
            title: judgeName ? `Welcome, ${judgeName}` : "Welcome to Bewo",
            subtitle: "Chronic disease management that acts before crisis hits",
            body: "Singapore spends $2.5B/year on diabetes complications — 61% are preventable with early intervention. Bewo detects health crises 48 hours before they happen, then autonomously intervenes.\n\nThis is a live, working system. Every button fires real API calls — HMM inference, Monte Carlo simulation, agentic AI reasoning, and safety classification. Nothing is mocked.\n\nThis walkthrough takes ~7 minutes. You'll meet the patient, the nurse, trigger a real crisis, and watch the system save a life.",
            insight: "You control everything. The left sidebar lets you inject 7 different clinical scenarios and watch the entire system respond live. Most competition demos are pre-recorded — ours lets you drive.",
            icon: <Sparkles size={20} />,
            stat: { value: "$2.5B", label: "Annual Cost" },
            highlight: "#sidebar-brand",
            pos: "right",
        },
        {
            id: "meet_mr_tan",
            phase: "MEET MR. TAN",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "Meet Mr. Tan Ah Kow",
            subtitle: "67 years old. Type 2 Diabetes. Lives alone in Toa Payoh.",
            body: "This is the Patient View — what Mr. Tan sees on his phone every day.\n\nNotice what's NOT here: no HMM states, no probability curves, no clinical jargon. Instead, he sees:\n\n• A Daily Insight Card — simple risk indicator with a warm, encouraging message\n• His Merlion Risk Score — a single percentage he can understand\n• His biometrics — glucose, steps, heart rate in a clean layout\n\nThe clinical complexity is completely hidden. Mr. Tan sees a caring companion, not a medical dashboard.",
            insight: "Trust is the intervention. If Mr. Tan doesn't trust the app, no algorithm matters. The patient view uses warm language, Singlish when appropriate, and never shows alarming clinical jargon. UX is the treatment adherence strategy.",
            tab: "patient",
            icon: <Heart size={20} />,
            stat: { value: "67M", label: "Mr. Tan Ah Kow" },
            highlight: "#patient-insight",
            pos: "left",
        },
        {
            id: "voucher",
            phase: "MEET MR. TAN",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "NTUC Voucher Gamification",
            subtitle: "He fights to keep what he has — that's Prospect Theory",
            body: "Mr. Tan starts each week with S$5.00 in NTUC FairPrice vouchers. Every missed medication or check-in costs him S$0.25. He redeems on Sundays via QR code.\n\nThis is loss aversion (Kahneman & Tversky): losing $5 hurts 2–2.5× more than gaining $5. Mr. Tan fights harder to keep his voucher than he would to earn one.\n\nBelow: his Medication Schedule — swipe-to-confirm, grouped by morning/afternoon/evening, with visual streaks.",
            insight: "Why NTUC vouchers? Singapore's elderly want groceries, not points. Mr. Tan buys his kopi-o and bread. Mdm. Lee buys rice and vegetables. This is behavioral design for Singapore, not generic gamification.",
            tab: "patient",
            icon: <Award size={20} />,
            stat: { value: "$5", label: "Weekly Voucher" },
            highlight: "#patient-voucher",
            scrollTo: "#patient-voucher",
            pos: "left",
        },
        {
            id: "chat",
            phase: "MEET MR. TAN",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "AI Care Assistant",
            subtitle: "Singlish-aware, mood-detecting, tool-executing companion",
            body: "The Care Assistant is a real AI chat powered by Gemini + an 18-tool agentic runtime.\n\nType a message and it fires a real API call. Try: \"What should I eat for dinner?\" or \"My glucose high, how?\"\n\n• Speaks Singlish when appropriate (\"Wah, uncle, your glucose quite high leh\")\n• Detects mood from text and adjusts tone\n• Executes real tools: book appointments, check drug interactions, recommend food\n• Remembers previous conversations across sessions",
            insight: "This isn't ChatGPT with a healthcare prompt. It's a 5-turn ReAct agent that reasons over the patient's full clinical context — HMM state, medications, biometrics, conversation history — before choosing which of 18 tools to execute. Every response passes a 6-dimension safety classifier.",
            tab: "patient",
            icon: <MessageSquare size={20} />,
            stat: { value: "18", label: "Agent Tools" },
            highlight: "#patient-chat",
            scrollTo: "#patient-chat",
            pos: "left",
        },
        {
            id: "patient_input",
            phase: "MEET MR. TAN",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "Patient Input Modes",
            subtitle: "Three ways to feed data into the system",
            body: "Tap the floating + button (bottom-right) to see 3 input modes:\n\n1. Log Glucose — manual entry or camera OCR (photo of glucometer → Gemini Vision extracts the reading)\n\n2. Log Food — describe in natural language (\"chicken rice with teh c\"). AI understands local food and estimates nutritional impact.\n\n3. Voice Check-in — speech-to-text + sentiment analysis. Detects frustration, anxiety, or positive mood.\n\nAll inputs feed into the HMM's 9-biomarker observation vector. More data = earlier detection.",
            insight: "Voice check-in is a mental health signal. If Mr. Tan sounds frustrated 3 days in a row, the system detects declining engagement and proactively adjusts: shorter messages, more encouragement, maybe a voucher bonus. Emotional state is clinical data.",
            tab: "patient",
            icon: <Mic size={20} />,
            stat: { value: "3", label: "Input Modes" },
            highlight: "#patient-actions-area",
            pos: "left",
        },

        // ===============================================
        // ACT 2: THE NURSE — Clinical perspective (Steps 5-7)
        // ===============================================
        {
            id: "nurse_intro",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "Meet Nurse Sarah Chen",
            subtitle: "She manages 600+ patients at a polyclinic. This is her dashboard.",
            body: "The Nurse View is now active — this is what Sarah sees at the start of her shift.\n\nTop bar: Mr. Tan's profile with his current health status badge.\n\nBelow: the 14-Day Health Timeline — each day is color-coded by HMM state (green/amber/red) with confidence percentages. Click any day to drill into the detailed analysis.\n\nThis view is designed for speed: glance at the timeline, see the color, click the day, read the SBAR, act. Under 60 seconds from dashboard to clinical decision.",
            insight: "Singapore polyclinics assign 600+ patients per nurse. Manual chart review takes 20+ minutes each. Bewo's auto-triage means the nurse only reviews patients that need attention, in priority order. Zero chart-pulling.",
            tab: "nurse",
            icon: <Stethoscope size={20} />,
            stat: { value: "600+", label: "Patients Per Nurse" },
            highlight: "#nurse-header",
            pos: "below",
        },
        {
            id: "nurse_timeline",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "HMM Explainability",
            subtitle: "Click any day — see exactly why the AI made its decision",
            body: "The color-coded timeline:\n• Green = STABLE | Amber = WARNING | Red = CRISIS\n• Confidence % shown below each day\n\nClick a day to expand:\n• Gaussian probability curves — one per biomarker, showing fit to each state\n• Evidence table — which features pulled toward which state, and by how much\n• Log-likelihood breakdown — the raw probability matrix\n\nEvery clinical decision is explainable, auditable, and defensible. No black-box predictions.",
            insight: "Interpretability isn't optional in healthcare — it's legally required. Under Singapore's PDPA and AI governance framework, clinical AI must explain its reasoning. HMM gives us this by design: state emissions, transition probabilities, and feature contributions are all transparent.",
            tab: "nurse",
            icon: <Brain size={20} />,
            stat: { value: "9", label: "Biomarker Features" },
            visualHint: "Click any day on the timeline strip to see the detailed analysis",
            highlight: "#nurse-timeline",
            pos: "right",
        },
        {
            id: "nurse_intelligence",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "Predictive Intelligence",
            subtitle: "State distribution, transition dynamics, Monte Carlo forecast",
            body: "Three panels below the timeline:\n\n1. State Distribution (donut) — what % of 14 days were STABLE vs WARNING vs CRISIS\n\n2. Transition Heatmap (3×3 grid) — learned via Baum-Welch EM algorithm. Shows that crisis states are \"sticky\" — P(CRISIS→CRISIS) is high\n\n3. Monte Carlo Forecast (area chart) — 2,000 simulated trajectories showing crisis probability over 48 hours. Red area = danger zone\n\nBelow: 24h biometric trends, SBAR report, drug interactions, triage — all from the nurse's perspective.",
            insight: "The transition matrix is learned via Expectation-Maximization, not hardcoded. As data accumulates, the model personalizes to each patient. Mr. Tan's crisis-to-stable transition probability becomes unique to his biology and behavior.",
            tab: "nurse",
            icon: <TrendingUp size={20} />,
            stat: { value: "2K", label: "Monte Carlo Paths" },
            highlight: "#nurse-hmm-center",
            scrollTo: "#nurse-hmm-center",
            pos: "below",
        },

        // ===============================================
        // ACT 3: THE CRISIS — Tension builds (Steps 8-11)
        // ===============================================
        {
            id: "crisis_narrative",
            phase: "CRISIS",
            phaseColor: "from-rose-600 to-red-600",
            title: "It's Day 6.",
            subtitle: "Mr. Tan has been stable for 5 days. Then things start to change.",
            body: "Here's what happens over 14 days:\n\nDays 1–5: Mr. Tan is doing well. Glucose 5–7 mmol/L, taking his medications, walking daily, sleeping normally. The system shows green across the board.\n\nDays 6–10: Something shifts. Maybe stress, maybe he's skipping meals. Glucose starts creeping up. Steps drop. Heart rate variability falls. He misses a medication dose, then another.\n\nDays 11–14: Full crisis. Glucose above 15 mmol/L. Adherence collapsed to 30%. HRV crashed. Without intervention, the next stop is the ER — an $8,000–$15,000 admission.\n\nA traditional app catches this after he collapses. Bewo catches it 48 hours before symptoms become critical.",
            insight: "This isn't hypothetical. 61% of diabetes-related ER admissions in Singapore follow exactly this pattern — gradual decline over 1–2 weeks that goes unnoticed until it's too late. Bewo's HMM detects the trajectory change, not just the threshold breach.",
            tab: "overview",
            icon: <AlertTriangle size={20} />,
            stat: { value: "48h", label: "Early Warning" },
            pos: "center",
        },
        {
            id: "inject_crisis",
            phase: "CRISIS",
            phaseColor: "from-rose-600 to-red-600",
            title: "Trigger the Crisis",
            subtitle: "Inject 14 days of deteriorating data — watch the system respond live",
            body: "Click the button below to inject the Warning → Crisis scenario. Watch the console log on the left — it shows each pipeline stage in real-time:\n\n1. Data injection — 14 days × 9 biomarkers\n2. HMM Viterbi decoding — most likely hidden state sequence\n3. Baum-Welch learning — EM algorithm adapts to this patient\n4. Monte Carlo simulation — 2,000 forward trajectories\n\nAll computed in under 2 seconds.",
            insight: "Why HMM over deep learning? Explainability. A neural network says \"CRISIS\" with no reason. Our HMM shows exactly which biomarkers triggered the state change: glucose variability 35%, medication adherence 28%, HRV 15%. Every decision is traceable.",
            tab: "overview",
            action: () => injectScenario("warning_to_crisis"),
            actionLabel: "Inject Warning → Crisis Scenario",
            icon: <Play size={20} />,
            stat: { value: "<2s", label: "Detection Time" },
            highlight: "#sidebar-console",
            pos: "right",
        },
        {
            id: "system_detects",
            phase: "CRISIS",
            phaseColor: "from-rose-600 to-red-600",
            title: "The System's Verdict",
            subtitle: "Four metrics updated automatically — no nurse clicked anything",
            body: "Look at the 4 state cards at the top:\n\n1. HMM State: CRISIS (red) — Viterbi decoded 14 days of 9 biomarkers\n\n2. Risk Score: ~95% — composite risk weighted by clinical significance\n\n3. 48h Crisis Probability: ~95% — 2,000 Monte Carlo simulations; this fraction hit crisis\n\n4. Drug Interactions — medication pairs checked for contraindications\n\nMr. Tan went from healthy to crisis in 14 days. The system caught it automatically. No nurse reviewed a chart. No doctor opened a file.",
            insight: "A polyclinic nurse managing 600 patients cannot manually review each one. Without Bewo, Mr. Tan's decline goes unnoticed until he's in the ER. With Bewo, the nurse gets an alert with a full clinical summary before the patient even feels symptoms.",
            tab: "overview",
            icon: <Activity size={20} />,
            stat: { value: "95%", label: "Crisis Probability" },
            visualHint: "Look at the 4 colored state cards at the top of the dashboard",
            highlight: "#state-cards-grid",
            pos: "below",
        },
        {
            id: "sbar_triage",
            phase: "CRISIS",
            phaseColor: "from-rose-600 to-red-600",
            title: "Auto-SBAR & Nurse Triage",
            subtitle: "Clinical handoff + multi-patient priority ranking — zero effort",
            body: "Scroll down to see two panels:\n\nSBAR Clinical Report (auto-generated in 3 seconds):\n• S (Situation): Current state and what's happening\n• B (Background): 67M, T2DM + HTN + HLD, medications\n• A (Assessment): HMM + Monte Carlo + safety analysis\n• R (Recommendation): Actionable next steps by urgency\n\nNurse Triage (multi-patient):\n• Patients ranked by urgency 0–100%\n• IMMEDIATE (red) → SOON (amber) → MONITOR (blue) → STABLE (green)\n• Mr. Tan auto-surfaced to the top\n\nSBAR is the standard clinical handoff used in every Singapore hospital. Nurses spend 15–20 minutes writing these manually. Bewo does it in 3 seconds.",
            insight: "Drug interactions are checked continuously, not just at prescription time. What's safe at STABLE may be dangerous at CRISIS (e.g., Metformin + renal stress). This is contextual pharmacovigilance — 16 medication pairs monitored on every state transition.",
            tab: "overview",
            icon: <FileText size={20} />,
            stat: { value: "3s", label: "SBAR Generation" },
            highlight: "#sbar-section",
            scrollTo: "#sbar-section",
            pos: "right",
        },

        // ===============================================
        // ACT 4: THE RECOVERY — Resolution (Steps 12-14)
        // ===============================================
        {
            id: "recovery_narrative",
            phase: "RECOVERY",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Bewo Doesn't Just Detect — It Acts",
            subtitle: "6 autonomous interventions, zero human effort",
            body: "This is Bewo's key differentiator. Other systems alert. Bewo intervenes.\n\nWhen the crisis was detected, the agent autonomously:\n• Sent medication reminders at optimal times\n• Alerted Mrs. Tan Mei Ling (daughter) via caregiver notification\n• Booked a follow-up at NUH Diabetes Centre\n• Celebrated Mr. Tan's medication adherence streak\n• Adjusted nudge timing based on response patterns\n• Reduced caregiver alert frequency to prevent Mrs. Tan's burnout\n\nClick below to inject the Recovery scenario and watch Mr. Tan go from CRISIS → WARNING → STABLE over 14 days.",
            insight: "6 autonomous interventions, zero human effort. The agent booked a clinic appointment, alerted the caregiver, adjusted reminders, celebrated the streak — all without a nurse clicking anything. This is what \"agentic\" means: the AI doesn't suggest, it acts.",
            tab: "overview",
            action: () => injectScenario("recovery"),
            actionLabel: "Inject Recovery Scenario",
            icon: <CheckCircle2 size={20} />,
            stat: { value: "6", label: "Auto Interventions" },
            highlight: "#sidebar-console",
            pos: "right",
        },
        {
            id: "crisis_averted",
            phase: "RECOVERY",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Crisis Averted",
            subtitle: "Mr. Tan stays home. Not in the ER. Bewo paid for itself.",
            body: "The dashboard now shows:\n\n• HMM State: STABLE (green) — recovered\n• Risk Score: ~22% (down from 95%)\n• 48h Crisis Prob: Low — Monte Carlo shows safe trajectory\n• Triage: Mr. Tan moved from IMMEDIATE → STABLE\n\nCheck the other views:\n• Nurse View — timeline shows CRISIS → WARNING → STABLE with confidence per day\n• Patient View — Daily Insight Card is green: \"You are doing well!\"\n\nOne prevented ER visit saves $8,000–$15,000. Bewo costs $3/month. That's 2,900 patient-months funded per avoided admission.",
            insight: "At $3/patient/month and 100,000 target patients, Bewo's annual cost is $3.6M. Preventing just 450 ER visits covers that entirely. Singapore has 440,000 diabetics — the ROI is arithmetic, not theoretical.",
            tab: "overview",
            icon: <DollarSign size={20} />,
            stat: { value: "95→22%", label: "Risk Reduction" },
            visualHint: "State cards should now be green. Check the Nurse and Patient views too.",
            highlight: "#state-cards-grid",
            pos: "below",
        },
        {
            id: "three_stakeholders",
            phase: "RECOVERY",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Three Stakeholders, One Event",
            subtitle: "Same recovery — 3 completely different interfaces",
            body: "Click through the tabs to see how the same event looks different:\n\nOverview: Raw HMM states, risk scores, Monte Carlo, SBAR, triage — the technical truth\n\nNurse View: 14-day timeline with clickable daily analysis, transition heatmap, biometric trends returning to normal\n\nPatient View: Green insight card (\"You are doing well!\"), voucher balance intact, streak continuing, AI companion giving encouragement\n\nThe right information, at the right abstraction level, for the right person. The patient gets empathy. The nurse gets efficiency. The caregiver gets peace of mind.",
            insight: "Most health AI shows everyone the same dashboard. Bewo gives clinicians clinical data, patients emotional support, and caregivers actionable status updates. Same HMM, three completely different user experiences.",
            tab: "overview",
            icon: <Shield size={20} />,
            stat: { value: "3", label: "Stakeholder Views" },
            highlight: "#tab-bar-group",
            pos: "below",
        },

        // ===============================================
        // ACT 5: UNDER THE HOOD (Steps 15-16)
        // ===============================================
        {
            id: "tool_demo",
            phase: "UNDER THE HOOD",
            phaseColor: "from-cyan-600 to-blue-600",
            title: "18 Agentic AI Tools",
            subtitle: "Every tool fires against a real API endpoint",
            body: "The Tool Demo tab is now active. Try clicking individual tools:\n\n• Drug Interaction Check — queries real interaction database (16 pairs)\n• SBAR Report — generates clinical summary from current HMM state\n• Caregiver Alert — sends alert with intelligent burden scoring\n• Food Recommendation — culturally-aware (knows hawker food)\n\nThen click \"Run All 18 Tools\" to see the full 5-phase pipeline:\n\n1. Safety Pre-Check (drug interactions + 6-dimension safety classifier)\n2. Clinical Intelligence (SBAR + triage)\n3. Patient Engagement (food recs + streak celebration)\n4. Proactive Communication (appointments + caregiver alerts)\n5. Remaining Tools (medication, activity, escalation, nudge scheduling)\n\nWatch the terminal — exact function calls, arguments, real responses.",
            insight: "Safety comes FIRST — before any patient-facing action, the system checks drug interactions and runs the safety classifier. Every AI response is verified on 6 dimensions: medical accuracy, emotional appropriateness, hallucination detection, cultural sensitivity, scope boundaries, and dangerous advice prevention.",
            tab: "tooldemo",
            icon: <Terminal size={20} />,
            stat: { value: "6", label: "Safety Dimensions" },
            highlight: "#tool-grid",
            pos: "below",
        },
        {
            id: "intelligence",
            phase: "UNDER THE HOOD",
            phaseColor: "from-purple-600 to-violet-600",
            title: "The Learning Engine",
            subtitle: "Memory, effectiveness tracking, caregiver burden, proactive care",
            body: "The AI Intelligence tab shows the agent's internal state:\n\n• Agent Memory — 3 types: episodic (events), semantic (medical knowledge), preference (patient likes/dislikes). Persists across sessions.\n\n• Tool Effectiveness — per-tool, per-state success rates. Learns which interventions work for each patient.\n\n• Caregiver Burden — scores alert fatigue (0–100). If Mrs. Tan is overwhelmed, the system auto-switches to daily digest. No competitor monitors caregiver wellbeing.\n\n• Proactive Check-ins — 6 triggers: missed med, glucose anomaly, declining engagement, streak milestone, scheduled check-in, mood change.\n\n• Counterfactual Analysis — \"What if you had taken your medication?\" Shows risk would drop from 35% → 12%.",
            insight: "Most health AI chatbots are stateless — they forget between sessions. Bewo remembers that Mr. Tan prefers Hokkien, skips breakfast on Sundays, and responds better to gentle nudges than clinical warnings. 3 memory types working together make the AI feel like it actually knows the patient.",
            tab: "intelligence",
            icon: <Brain size={20} />,
            stat: { value: "3", label: "Memory Types" },
            highlight: "#intel-grid",
            pos: "right",
        },

        // ===============================================
        // CLOSING (Step 17)
        // ===============================================
        {
            id: "closing",
            phase: "SUMMARY",
            phaseColor: "from-zinc-800 to-zinc-900",
            title: "Before Crisis. Not After.",
            subtitle: judgeName ? `Thank you, ${judgeName}. Everything you saw is live.` : "A working system. Not a prototype. Not a pitch deck.",
            body: "What you just experienced:\n\n• 3-state HMM with Viterbi decoding + Baum-Welch learning\n• 9 biomarkers from CGM + Fitbit + App\n• 2,000-path Monte Carlo for 48h risk forecasting\n• 5-turn ReAct agent with 18 tools and cross-session memory\n• 6-dimension safety classifier on every AI response\n• Auto-SBAR, auto-triage, continuous drug interaction monitoring\n• Loss-aversion voucher gamification (Prospect Theory)\n• Caregiver burden scoring (prevents alert fatigue)\n• 3 stakeholder views: patient → nurse → caregiver\n\nYou can now explore freely — inject any scenario, chat with the AI, click every button. Everything is live.\n\n7 injectable scenarios. Each produces completely different system behavior across HMM, SBAR, triage, Monte Carlo, and all 18 agent tools.",
            insight: "Singapore's diabetic population will double by 2035. Bewo is culturally aware (Singlish, hawker food, NTUC vouchers), clinically rigorous (HMM, SBAR, pharmacovigilance), and designed to scale across polyclinics at S$3/patient/month. Built for Singapore. Designed for ASEAN.",
            icon: <Sparkles size={20} />,
            stat: { value: "S$3", label: "Per Patient/Month" },
            pos: "center",
        },
    ];

    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;
    const hasAction = !!step.action;
    const isDone = actionDone.has(currentStep);

    const canProceed = !hasAction || isDone;

    const animateTransition = (direction: "next" | "prev", callback: () => void) => {
        setTransitioning(true);
        setActionError(null);
        setTimeout(() => {
            callback();
            setTimeout(() => setTransitioning(false), 400);
        }, 350);
    };

    const goNext = () => {
        if (isLast) { onClose(); return; }
        animateTransition("next", () => {
            setCurrentStep(currentStep + 1);
        });
    };

    const goPrev = () => {
        if (isFirst) return;
        animateTransition("prev", () => {
            setCurrentStep(currentStep - 1);
        });
    };

    // Keyboard navigation
    const canProceedRef = useRef(canProceed);
    const actionRunningRef = useRef(actionRunning);
    const isFirstRef = useRef(isFirst);
    canProceedRef.current = canProceed;
    actionRunningRef.current = actionRunning;
    isFirstRef.current = isFirst;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            if (e.key === "ArrowRight" && canProceedRef.current && !actionRunningRef.current) goNext();
            if (e.key === "ArrowLeft" && !isFirstRef.current) goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Tab switching + step reporting
    useEffect(() => {
        if (step.tab) onTabChange(step.tab);
        onStepChange?.(currentStep);
    }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll card body to top on step change
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    // Detect sidebar width
    const getSidebarWidth = () => {
        const sidebar = document.querySelector('aside');
        return sidebar ? sidebar.getBoundingClientRect().width : 320;
    };

    // Reposition on window resize
    const [resizeTick, setResizeTick] = useState(0);
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const handler = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => setResizeTick(t => t + 1), 200);
        };
        window.addEventListener("resize", handler);
        return () => { window.removeEventListener("resize", handler); clearTimeout(timeout); };
    }, []);

    // Positioning logic
    useEffect(() => {
        const isIframeTab = step.tab === "nurse" || step.tab === "patient";
        const delay = isIframeTab ? 400 : 200;

        const timer = setTimeout(() => {
            const CARD_W = 370;
            const CARD_H = 440;
            const GAP = 16;
            const PAD = 8;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const sidebarW = getSidebarWidth();

            if (step.scrollTo) {
                const scrollTarget = document.querySelector(step.scrollTo);
                scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            if (step.pos === "bottom-left") {
                setHighlightRect(null);
                setCardPos({ top: 72, left: vw - CARD_W - GAP });
                return;
            }

            let el: Element | null = null;
            if (step.highlight) {
                el = document.querySelector(step.highlight);
            }

            if (step.pos === "center" || !el) {
                setHighlightRect(null);
                const contentW = vw - sidebarW;
                setCardPos({
                    top: Math.max(80, (vh - CARD_H) / 2),
                    left: sidebarW + Math.max(GAP, (contentW - CARD_W) / 2),
                });
                return;
            }

            const rect = el.getBoundingClientRect();
            const hlTop = Math.max(0, rect.top - PAD);
            const hlLeft = Math.max(0, rect.left - PAD);
            const hlWidth = Math.min(rect.width + PAD * 2, vw - hlLeft);
            const hlHeight = Math.min(rect.height + PAD * 2, vh - hlTop);
            setHighlightRect({
                top: hlTop,
                left: hlLeft,
                width: hlWidth,
                height: hlHeight,
            });

            const isSidebarEl = rect.right <= sidebarW + 20;

            let top: number, left: number;
            const TAB_H = 56;

            if (isSidebarEl) {
                const contentW = vw - sidebarW;
                left = sidebarW + (contentW - CARD_W) / 2;
                top = Math.max(TAB_H + GAP, rect.top);
            } else if (step.pos === "below") {
                left = rect.left + (rect.width - CARD_W) / 2;
                top = rect.bottom + GAP;
                if (top + CARD_H > vh - GAP) top = Math.max(TAB_H + GAP, rect.top - CARD_H - GAP);
            } else if (step.pos === "right") {
                left = rect.right + GAP;
                if (left + CARD_W > vw - GAP) left = Math.max(sidebarW + GAP, rect.left - CARD_W - GAP);
                top = rect.top;
            } else if (step.pos === "left") {
                left = rect.left - CARD_W - GAP;
                if (left < sidebarW + GAP) left = rect.right + GAP;
                top = rect.top;
            } else {
                left = rect.right + GAP;
                top = rect.top;
            }

            left = Math.max(sidebarW + GAP, Math.min(left, vw - CARD_W - GAP));
            top = Math.max(TAB_H + GAP, Math.min(top, vh - CARD_H - GAP));

            setCardPos({ top, left });
        }, delay);

        return () => clearTimeout(timer);
    }, [currentStep, step.highlight, step.pos, step.scrollTo, step.tab, resizeTick]); // eslint-disable-line react-hooks/exhaustive-deps

    // Group steps into phases for progress indicator
    const phases = [
        { name: "Welcome", steps: [0], color: "bg-blue-500" },
        { name: "Patient", steps: [1, 2, 3, 4], color: "bg-emerald-500" },
        { name: "Nurse", steps: [5, 6, 7], color: "bg-cyan-500" },
        { name: "Crisis", steps: [8, 9, 10, 11], color: "bg-rose-500" },
        { name: "Recovery", steps: [12, 13, 14], color: "bg-green-500" },
        { name: "Deep Dive", steps: [15, 16], color: "bg-purple-500" },
        { name: "Close", steps: [17], color: "bg-zinc-700" },
    ];

    const avgSecondsPerStep = 22;
    const remainingSteps = steps.length - currentStep - 1;
    const minutesLeft = Math.max(1, Math.ceil((remainingSteps * avgSecondsPerStep) / 60));

    return (
        <>
            {/* Scrim — blocks interaction but does NOT close on click */}
            <div
                className="fixed inset-0 z-[189]"
                role="presentation"
                aria-label="Walkthrough overlay"
            />
            <div
                className="fixed z-[190] rounded-2xl pointer-events-none"
                style={{
                    top: highlightRect?.top ?? 0,
                    left: highlightRect?.left ?? 0,
                    width: highlightRect?.width ?? (mounted ? window.innerWidth : 1920),
                    height: highlightRect?.height ?? (mounted ? window.innerHeight : 1080),
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.32)',
                    borderRadius: highlightRect ? '16px' : '0px',
                    transition: 'top 0.7s cubic-bezier(0.22,1,0.36,1), left 0.7s cubic-bezier(0.22,1,0.36,1), width 0.7s cubic-bezier(0.22,1,0.36,1), height 0.7s cubic-bezier(0.22,1,0.36,1), border-radius 0.4s ease',
                }}
            />

            {/* Highlight ring */}
            <div
                className="wt-highlight-ring"
                style={{
                    top: highlightRect?.top ?? -100,
                    left: highlightRect?.left ?? -100,
                    width: highlightRect?.width ?? 0,
                    height: highlightRect?.height ?? 0,
                    opacity: highlightRect ? 1 : 0,
                }}
            />

            {/* Floating tour card */}
            <div
                className={`fixed z-[195] w-[370px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden flex flex-col
                    ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
                role="dialog"
                aria-label={`Walkthrough step ${currentStep + 1} of ${steps.length}: ${step.title}`}
                aria-modal="true"
                style={{
                    top: cardPos.top,
                    left: cardPos.left,
                    maxHeight: "min(460px, calc(100vh - 80px))",
                    transition: "top 0.7s cubic-bezier(0.22,1,0.36,1), left 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, transform 0.5s ease",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)",
                }}
            >
                {/* Gradient header */}
                <div className={`bg-gradient-to-r ${step.phaseColor} px-5 pt-3.5 pb-3 shrink-0`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-white/80 text-[11px] font-bold uppercase tracking-[0.18em]">
                                {step.phase}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-white/50 text-[10px] flex items-center gap-1">
                                <Clock size={9} />
                                ~{minutesLeft}min left
                            </span>
                            <span className="text-white/70 text-[12px] font-mono font-semibold">
                                {currentStep + 1}/{steps.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                            {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[15px] font-bold text-white leading-tight">{step.title}</h1>
                            <p className="text-white/70 text-[11px] mt-0.5 leading-snug">{step.subtitle}</p>
                        </div>
                    </div>

                    {step.stat && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-md px-2.5 py-1">
                            <span className="text-sm font-black text-white">{step.stat.value}</span>
                            <span className="text-white/60 text-[9px] font-medium uppercase tracking-wider">{step.stat.label}</span>
                        </div>
                    )}

                    {/* Phase progress ticks */}
                    <div className="mt-2.5 flex items-center gap-0.5">
                        {phases.map((p, pi) => {
                            const phaseStart = p.steps[0];
                            const isPastPhase = p.steps[p.steps.length - 1] < currentStep;
                            return (
                                <button
                                    key={pi}
                                    onClick={() => {
                                        if (phaseStart !== currentStep) {
                                            animateTransition(phaseStart > currentStep ? "next" : "prev", () => {
                                                setCurrentStep(phaseStart);
                                            });
                                        }
                                    }}
                                    className="flex-1 flex gap-px group cursor-pointer"
                                    title={`Jump to ${p.name}`}
                                >
                                    {p.steps.map((si) => (
                                        <div
                                            key={si}
                                            className={`h-[3px] flex-1 rounded-full transition-all duration-300 group-hover:opacity-80 ${
                                                si === currentStep ? "bg-white" :
                                                si < currentStep ? "bg-white/50" : "bg-white/15"
                                            } ${isPastPhase ? "group-hover:bg-white/60" : "group-hover:bg-white/30"}`}
                                        />
                                    ))}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Body content */}
                <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-3">
                    <div className={`transition-all duration-500 ease-out ${transitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
                        <div className="text-[12px] text-zinc-600 leading-[1.65] whitespace-pre-line">
                            {step.body}
                        </div>

                        {/* Insight box */}
                        <div className="mt-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-lg p-3 border border-zinc-200">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <Target size={10} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mb-0.5">
                                        Why This Matters
                                    </div>
                                    <p className="text-[11px] text-zinc-700 leading-[1.55] font-medium">
                                        {step.insight}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {step.visualHint && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                <Eye size={13} className="shrink-0" />
                                {step.visualHint}
                            </div>
                        )}

                        {/* Judge name personalization — welcome step only */}
                        {step.id === 'welcome' && (
                            <div className="mt-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.12em]">
                                    Your name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={judgeName}
                                    onChange={(e) => setJudgeName(e.target.value)}
                                    placeholder="Enter your name to personalize"
                                    className="mt-1 w-full px-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                                    onKeyDown={(e) => { if (e.key === 'Enter') goNext(); }}
                                />
                            </div>
                        )}

                        {hasAction && (
                            <div className="mt-3">
                                <button
                                    onClick={() => runAction(step.action!, currentStep)}
                                    disabled={actionRunning || isDone}
                                    className={`w-full rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition-all
                                        ${actionRunning ? "h-14 py-2" : "h-10"}
                                        ${isDone
                                            ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                                            : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-zinc-900/20"
                                        }
                                        disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {actionRunning ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Running Pipeline...</span>
                                            </div>
                                            {pipelineStage && (
                                                <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[300px]">
                                                    {pipelineStage}
                                                </span>
                                            )}
                                        </div>
                                    ) : isDone ? (
                                        <>
                                            <CheckCircle2 size={14} />
                                            <span>Complete — Pipeline Executed Successfully</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} className="fill-current" />
                                            <span>{step.actionLabel}</span>
                                        </>
                                    )}
                                </button>
                                {actionError && (
                                    <p className="text-[11px] text-amber-600 text-center mt-1.5 font-medium">
                                        {actionError}
                                    </p>
                                )}
                                {!isDone && !actionRunning && !actionError && (
                                    <p className="text-[10px] text-zinc-400 text-center mt-1">
                                        Fires real API calls against the backend.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer navigation */}
                <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/80 shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-medium">
                            Arrow keys to navigate · Esc to close
                        </span>

                        <div className="flex items-center gap-1.5">
                            {!isFirst && (
                                <button
                                    onClick={goPrev}
                                    className="h-8 px-3 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center gap-0.5 transition-colors"
                                    aria-label="Previous step"
                                >
                                    <ChevronLeft size={13} /> Back
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                disabled={!canProceed}
                                className={`h-8 px-5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all
                                    ${isLast
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20"
                                    }
                                    disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none`}
                                aria-label={isLast ? "Close walkthrough and explore freely" : "Next step"}
                            >
                                {isLast ? (
                                    <>Explore Freely <ArrowRight size={13} /></>
                                ) : (
                                    <>Next <ChevronRight size={13} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
