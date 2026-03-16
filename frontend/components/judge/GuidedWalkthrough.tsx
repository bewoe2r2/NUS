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
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    Eye,
    ArrowRight,
    Zap,
    Target,
    TrendingUp,
    Activity,
    Pill,
    MessageSquare,
    Award,
    Users,
    FileText,
    Mic,
    RefreshCw,
    Clock,
    DollarSign,
    Globe,
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
}

export function GuidedWalkthrough({ onClose, onTabChange, onRefresh }: GuidedWalkthroughProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [actionRunning, setActionRunning] = useState(false);
    const [actionDone, setActionDone] = useState<Set<number>>(new Set());
    const [transitioning, setTransitioning] = useState(false);
    const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [mounted, setMounted] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    const runAction = useCallback(async (action: () => Promise<void>, stepIdx: number) => {
        setActionRunning(true);
        setActionError(null);
        try {
            await action();
            setActionDone(prev => new Set(prev).add(stepIdx));
            onRefresh();
        } catch (e) {
            console.error("Walkthrough action failed:", e);
            setActionError("Pipeline encountered an issue. You can retry or skip to the next step.");
            setActionDone(prev => new Set(prev).add(stepIdx));
        } finally {
            setActionRunning(false);
        }
    }, [onRefresh]);

    const injectScenario = useCallback(async (scenario: string) => {
        // 1. Click the correct scenario button in the sidebar to select it via React state
        const scenarioBtn = document.querySelector(`[data-scenario="${scenario}"]`) as HTMLButtonElement | null;
        if (scenarioBtn) {
            scenarioBtn.click();
            // Small delay to let React re-render with the new selectedScenario
            await new Promise(r => setTimeout(r, 150));
        }

        // 2. Click the Run Full Simulation button — this triggers the real pipeline
        const runBtn = document.getElementById('btn-run-sim') as HTMLButtonElement;
        if (runBtn && !runBtn.disabled) {
            runBtn.click();
            // Wait for the simulation to finish (it's async, takes ~3-5s)
            await new Promise<void>(resolve => {
                const check = setInterval(() => {
                    const freshBtn = document.getElementById('btn-run-sim') as HTMLButtonElement;
                    if (freshBtn && !freshBtn.disabled && !freshBtn.textContent?.includes('Running')) {
                        clearInterval(check);
                        resolve();
                    }
                }, 500);
                // Safety timeout — don't hang forever
                setTimeout(() => { clearInterval(check); resolve(); }, 15000);
            });
        } else {
            // Fallback: run API calls directly if button not found
            await api.resetData();
            await api.injectScenario(scenario, 14);
            await api.runHMM();
            try { await api.trainHMM("P001"); } catch { /* ok */ }
        }
    }, []);

    const steps: WalkthroughStep[] = [
        // ===============================================
        // PHASE 1: INTRODUCTION (Steps 0-1)
        // ===============================================
        {
            id: "welcome",
            phase: "INTRODUCTION",
            phaseColor: "from-blue-600 to-indigo-600",
            title: "Welcome to Bewo",
            subtitle: "AI-Powered Chronic Disease Management for Singapore",
            body: "You're about to experience a live, working system \u2014 not a prototype, not a mockup.\n\nEvery button fires real API calls: HMM Viterbi inference, Baum-Welch learning, Monte Carlo simulation, agentic AI reasoning, and 6-dimension safety classification.\n\nBewo solves one problem: Singapore spends $2.5B/year on diabetes complications that are 61% preventable. We detect health crises 48 hours before they happen \u2014 from passive sensor data alone \u2014 then autonomously intervene.\n\nThis guided walkthrough takes ~8 minutes and covers everything.",
            insight: "43,000+ lines of production code. 53 API endpoints. 35 database tables. 7 injectable clinical scenarios. 3 stakeholder views (patient, nurse, caregiver). Everything you see is computed live.",
            icon: <Sparkles size={20} />,
            stat: { value: "43K+", label: "Lines of Code" },
            highlight: "#sidebar-brand",
            pos: "right",
        },
        {
            id: "layout_overview",
            phase: "INTRODUCTION",
            phaseColor: "from-blue-600 to-indigo-600",
            title: "Your Control Panel",
            subtitle: "You control the entire system from here",
            body: "Left sidebar \u2014 Admin Console:\n\u2022 System status indicator (green = backend connected)\n\u2022 7 injectable clinical scenarios (stable \u2192 crisis \u2192 recovery)\n\u2022 \"Run Full Simulation\" \u2014 triggers the complete AI pipeline\n\u2022 \"Reset Database\" \u2014 start fresh anytime\n\u2022 Live console log \u2014 every pipeline step in real-time\n\nTop tabs \u2014 5 views:\nOverview | Patient View | Nurse View | AI Intelligence | Tool Demo\n\nKey differentiator: most competition demos are pre-recorded. Ours lets you inject any scenario and watch the system respond live. You control what happens.",
            insight: "Try this after the walkthrough: inject different scenarios and switch between tabs. The same underlying data renders completely differently for each stakeholder. That's multi-stakeholder design in action.",
            tab: "overview",
            icon: <BarChart3 size={20} />,
            stat: { value: "7", label: "Scenarios" },
            visualHint: "Look at the Admin Console sidebar on the left",
            highlight: "#tab-bar-group",
            pos: "below",
        },

        // ===============================================
        // PHASE 2: CRISIS SCENARIO (Steps 2-5)
        // ===============================================
        {
            id: "inject_crisis",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "Triggering a Crisis",
            subtitle: "14 days of deteriorating patient data \u2014 injected live",
            body: "We'll inject the \"Warning \u2192 Crisis\" scenario for Mr. Tan Ah Kow (67M, Type 2 Diabetes + Hypertension + Hyperlipidemia):\n\n\u2022 Days 1\u20135: Stable baseline (glucose 5\u20137 mmol/L, 80%+ med adherence)\n\u2022 Days 6\u201310: Gradual decline (glucose rising, steps dropping, HRV falling)\n\u2022 Days 11\u201314: Full crisis (glucose 15+ mmol/L, adherence 30%, HRV collapsed)\n\nClick the button below and watch the console log on the left \u2014 it shows each pipeline stage:\n1. Data injection (14 days \u00d7 9 biomarkers)\n2. HMM Viterbi state decoding (most likely hidden state sequence)\n3. Baum-Welch parameter learning (EM algorithm adapts to this patient)\n4. Monte Carlo risk simulation (2,000 forward trajectories)",
            insight: "A traditional health app catches this after Mr. Tan collapses in the ER \u2014 costing $8,000\u2013$15,000. Bewo detects it 48 hours before symptoms become critical, from passive sensor data alone. That's the $2.5B opportunity.",
            tab: "overview",
            action: () => injectScenario("warning_to_crisis"),
            actionLabel: "Inject Warning \u2192 Crisis Scenario",
            icon: <AlertTriangle size={20} />,
            stat: { value: "48h", label: "Early Detection" },
            highlight: "#sidebar-console",
            pos: "right",
        },
        {
            id: "overview_state_cards",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "The System's Verdict",
            subtitle: "Four metrics that tell the whole story at a glance",
            body: "The 4 state cards updated automatically:\n\n1. HMM State: CRISIS (red) \u2014 Viterbi decoded the 14-day hidden state sequence across 9 biomarkers and classified current state\n\n2. Risk Score: ~95% \u2014 composite risk from all biomarkers, weighted by clinical significance\n\n3. 48h Crisis Probability: ~95% \u2014 Monte Carlo ran 2,000 stochastic simulations forward 48 hours; this is the fraction that hit crisis\n\n4. Drug Interactions \u2014 medication pairs checked for contraindications (Metformin + Lisinopril, Aspirin + Atorvastatin, etc.)\n\nAll four computed in under 2 seconds. No nurse clicked anything. No doctor reviewed a chart.",
            insight: "Why HMM over deep learning? Explainability. A neural network says 'CRISIS' with no reason. Our HMM shows exactly which biomarkers triggered the state change: e.g., glucose variability contributed 35%, medication adherence 28%, HRV 15%. Every decision is traceable.",
            tab: "overview",
            icon: <Activity size={20} />,
            stat: { value: "<2s", label: "Detection Time" },
            visualHint: "Look at the 4 colored state cards at the top of the dashboard",
            highlight: "#state-cards-grid",
            pos: "below",
        },
        {
            id: "overview_sbar",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "Auto-Generated SBAR Report",
            subtitle: "Clinical handoff format \u2014 zero nurse effort",
            body: "Scroll down to see the SBAR Clinical Report:\n\n\u2022 S (Situation): Current state, what's happening right now\n\u2022 B (Background): Patient profile \u2014 67M, T2DM + HTN + HLD, medications\n\u2022 A (Assessment): Clinical analysis from HMM + Monte Carlo + safety checks\n\u2022 R (Recommendation): Actionable next steps ranked by urgency\n\nSBAR is the standard clinical handoff format used in every Singapore hospital. Nurses spend 15\u201320 minutes writing these manually per patient.\n\nBewo generates them in under 3 seconds with full clinical context \u2014 HMM state, biometric trends, drug interactions, risk trajectory.",
            insight: "A polyclinic nurse manages 600+ patients. If each SBAR takes 15 minutes manually, that's 150 hours/day across the panel. Bewo does it in seconds. One nurse can now monitor 100+ patients without missing a single deterioration.",
            tab: "overview",
            icon: <FileText size={20} />,
            stat: { value: "3s", label: "SBAR Generation" },
            visualHint: "Scroll down to see the SBAR report below the state cards",
            highlight: "#sbar-section",
            scrollTo: "#sbar-section",
            pos: "right",
        },
        {
            id: "overview_triage_drugs",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "Triage & Drug Safety",
            subtitle: "Multi-patient priority ranking + continuous medication monitoring",
            body: "Two more panels below SBAR:\n\nNurse Triage:\n\u2022 All patients ranked by urgency score (0\u2013100%)\n\u2022 Categories: IMMEDIATE (red) \u2192 SOON (amber) \u2192 MONITOR (blue) \u2192 STABLE (green)\n\u2022 Mr. Tan auto-surfaced to top as IMMEDIATE\n\nDrug Interactions:\n\u2022 16 medication interaction pairs checked continuously\n\u2022 Severity levels: CONTRAINDICATED / MAJOR / MODERATE / MINOR\n\u2022 Shows mechanism of interaction + clinical recommendation\n\u2022 Runs on every state transition, not just at prescription time",
            insight: "Most apps check drug interactions once when prescribed. Bewo checks continuously because patient context changes \u2014 what's safe at STABLE may be dangerous at CRISIS (e.g., Metformin + renal stress). This is contextual pharmacovigilance.",
            tab: "overview",
            icon: <Pill size={20} />,
            stat: { value: "16", label: "Drug Pairs Checked" },
            highlight: "#triage-section",
            scrollTo: "#triage-section",
            pos: "right",
        },

        // ===============================================
        // PHASE 3: NURSE VIEW (Steps 6-8)
        // ===============================================
        {
            id: "nurse_intro",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "The Nurse's Perspective",
            subtitle: "What Sarah Chen, RN sees at the start of her shift",
            body: "You're now looking at the clinical dashboard \u2014 designed for polyclinic nurses, not patients.\n\nTop bar: Mr. Tan Ah Kow, 67M with CRISIS status badge (pulsing red = urgent attention needed).\n\nBelow: The 14-day Health Timeline \u2014 each day is color-coded by HMM state with confidence percentages. Click any day to drill into the detailed analysis.\n\nThis view is designed for speed: a nurse glances at the timeline, sees red, clicks the day, reads the SBAR, acts. Under 60 seconds from dashboard to decision.",
            insight: "Singapore polyclinics assign 600+ patients per nurse. Manual chart review takes 20+ minutes each. Bewo's auto-triage means the nurse only reviews patients that need attention, in priority order. Zero manual chart-pulling.",
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
            title: "14-Day Timeline & Daily Analysis",
            subtitle: "Click any day \u2014 see exactly why the HMM made its decision",
            body: "The color-coded timeline strip:\n\u2022 Green = STABLE | Amber = WARNING | Red = CRISIS\n\u2022 Confidence % shown below each day\n\nClick a day to expand the detail panel:\n\u2022 Gaussian probability curves \u2014 one per biomarker, showing fit to each state's emission distribution\n\u2022 Evidence table \u2014 which features pulled toward which state, and by how much\n\u2022 Log-likelihood breakdown \u2014 the raw probability matrix behind the decision\n\nThis is full HMM interpretability. Every clinical decision is explainable, auditable, and defensible. No black-box neural network predictions.",
            insight: "Interpretability isn't optional in healthcare \u2014 it's legally required. Under Singapore's PDPA and upcoming AI governance framework, clinical AI must explain its reasoning. HMM gives us this by design: state emissions, transition probabilities, and feature contributions are all transparent.",
            tab: "nurse",
            icon: <Brain size={20} />,
            stat: { value: "9", label: "Biomarker Features" },
            visualHint: "Click any day on the timeline strip to see the detailed analysis",
            highlight: "#nurse-timeline",
            pos: "right",
        },
        {
            id: "nurse_hmm_intelligence",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "HMM Intelligence Center",
            subtitle: "State distribution, transition dynamics, Monte Carlo forecast",
            body: "Three panels below the timeline:\n\n1. State Distribution (donut) \u2014 what % of the past 14 days were STABLE vs WARNING vs CRISIS\n\n2. Transition Heatmap (3\u00d73 grid) \u2014 learned transition probabilities via Baum-Welch EM algorithm. Shows P(CRISIS\u2192STABLE) is low, P(CRISIS\u2192CRISIS) is high \u2014 crisis states are \"sticky\"\n\n3. Monte Carlo Forecast (area chart) \u2014 2,000 simulated trajectories showing crisis probability over the next 48 hours. Red area = danger zone\n\nFurther down: 24h biometric trends, the SBAR report, drug interactions, triage, and active alerts \u2014 all from the nurse's perspective.",
            insight: "The transition matrix is learned via Baum-Welch (Expectation-Maximization), not hardcoded. As data accumulates, the model personalizes to each patient. Mr. Tan's crisis-to-stable transition probability becomes unique to his biology and behavior.",
            tab: "nurse",
            icon: <TrendingUp size={20} />,
            stat: { value: "2K", label: "Monte Carlo Paths" },
            highlight: "#nurse-hmm-center",
            scrollTo: "#nurse-hmm-center",
            pos: "below",
        },

        // ===============================================
        // PHASE 4: PATIENT VIEW (Steps 9-12)
        // ===============================================
        {
            id: "patient_intro",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "What Mr. Tan Sees",
            subtitle: "A caring companion, not a clinical dashboard",
            body: "This is the patient's mobile app \u2014 notice the stark difference from the nurse view.\n\nNo HMM states. No probability curves. No triage scores. Instead:\n\n\u2022 Daily Insight Card \u2014 a simple risk indicator with trend (Declining/Improving/Stable) and motivational, culturally-sensitive text\n\u2022 Merlion Risk Score \u2014 a percentage the patient can understand\n\u2022 Biometric overview \u2014 glucose, steps, heart rate in a clean bento grid\n\nThe clinical complexity is hidden. The patient sees a caring companion that speaks their language.",
            insight: "Trust is the intervention. If Mr. Tan doesn't trust the app, no algorithm will help him take his medication. That's why the patient view uses warm language, Singlish when appropriate, and never shows alarming clinical jargon. UX IS the treatment adherence strategy.",
            tab: "patient",
            icon: <Heart size={20} />,
            stat: { value: "67M", label: "Mr. Tan Ah Kow" },
            highlight: "#patient-insight",
            pos: "left",
        },
        {
            id: "patient_voucher",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "NTUC Voucher Gamification",
            subtitle: "Loss-aversion psychology \u2014 patients fight to keep what they have",
            body: "The NTUC Voucher Card:\n\n\u2022 Starts at S$5.00/week\n\u2022 Decays S$0.25 per missed medication or check-in\n\u2022 Shows current balance + streak days\n\u2022 Redeemable on Sundays via QR code at NTUC FairPrice\n\nThis uses Prospect Theory (Kahneman & Tversky, 1979): loss aversion is 2\u20132.5\u00d7 stronger than equivalent gains. Patients fight harder to keep $5 than to earn $5.\n\nBelow: Medication Schedule \u2014 swipe-to-confirm with visual feedback, grouped by morning/afternoon/evening.",
            insight: "Why NTUC vouchers specifically? Singapore's elderly don't want points or cash \u2014 they want groceries. Mr. Tan buys his kopi-o and bread. Mdm. Lee buys rice and vegetables. It's culturally meaningful, not generic gamification. This is behavioral design for Singapore.",
            tab: "patient",
            icon: <Award size={20} />,
            stat: { value: "$5", label: "Weekly Voucher" },
            highlight: "#patient-voucher",
            scrollTo: "#patient-voucher",
            pos: "left",
        },
        {
            id: "patient_chat",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "AI Care Assistant",
            subtitle: "Singlish-aware, mood-detecting, tool-executing companion",
            body: "The Care Assistant is a real AI chat powered by Gemini + our 18-tool agentic runtime:\n\n\u2022 Type a message \u2014 it fires a real API call to the agent\n\u2022 Speaks Singlish when appropriate (\"Wah, uncle, your glucose quite high leh\")\n\u2022 Detects mood from text and adjusts tone accordingly\n\u2022 Executes real tools: book appointments, check drug interactions, recommend food, celebrate streaks\n\u2022 Cross-session memory: remembers previous conversations and patient preferences\n\nTry: \"What should I eat for dinner?\" or \"My glucose is high, what should I do?\"",
            insight: "This isn't ChatGPT with a healthcare prompt. It's a 5-turn ReAct agent that reasons over full clinical context \u2014 HMM state, medication list, recent biometrics, conversation history \u2014 before choosing which of 18 tools to execute. Every response passes through a 6-dimension safety classifier.",
            tab: "patient",
            icon: <MessageSquare size={20} />,
            stat: { value: "18", label: "Agent Tools" },
            highlight: "#patient-chat",
            scrollTo: "#patient-chat",
            pos: "left",
        },
        {
            id: "patient_actions",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "Patient Input Modes",
            subtitle: "Glucose logging, food tracking, voice check-ins",
            body: "Tap the floating + button (bottom-right) to see 3 actions:\n\n1. Log Glucose \u2014 manual entry or camera OCR (photo of glucometer \u2192 Gemini Vision extracts the reading automatically)\n\n2. Log Food \u2014 describe what you ate in natural language (\"chicken rice with teh c\"). The AI understands local food and estimates nutritional impact.\n\n3. Voice Check-in \u2014 Web Speech API for speech-to-text, then sentiment analysis. Detects frustration, anxiety, or positive mood and adjusts the AI's response tone.\n\nAll inputs feed into the HMM's 9 biomarker observation vector. More data = better state estimation = earlier detection.",
            insight: "Voice check-in is a mental health signal. If Mr. Tan sounds frustrated 3 days in a row, the system detects declining engagement and proactively adjusts: shorter messages, more encouragement, maybe a voucher bonus. Emotional state is clinical data.",
            tab: "patient",
            icon: <Mic size={20} />,
            stat: { value: "3", label: "Input Modes" },
            highlight: "#patient-actions-area",
            pos: "left",
        },

        // ===============================================
        // PHASE 5: RECOVERY SCENARIO (Steps 13-15)
        // ===============================================
        {
            id: "inject_recovery",
            phase: "RECOVERY DEMO",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Now Watch Recovery",
            subtitle: "Bewo detects crisis \u2192 intervenes autonomously \u2192 patient recovers",
            body: "This is Bewo's key differentiator \u2014 we don't just detect, we act.\n\nClick below to inject the Recovery scenario:\n\u2022 Mr. Tan starts in CRISIS\n\u2022 Bewo's agent autonomously intervenes:\n  \u2013 Sends medication reminders at optimal times\n  \u2013 Alerts Mrs. Tan Mei Ling (daughter/caregiver) via WhatsApp\n  \u2013 Books a follow-up at NUH Diabetes Centre\n  \u2013 Celebrates medication adherence streak\n  \u2013 Adjusts nudge timing based on response patterns\n  \u2013 Reduces caregiver alert frequency to prevent burnout\n\u2022 Over 14 days: CRISIS \u2192 WARNING \u2192 STABLE\n\nWatch the state cards transition from red \u2192 green.",
            insight: "6 autonomous interventions, zero human effort. The agent booked a clinic appointment, alerted the caregiver, adjusted reminders, celebrated the streak \u2014 all without a nurse clicking anything. This is what \"agentic\" actually means: the AI doesn't suggest, it acts.",
            tab: "overview",
            action: () => injectScenario("recovery"),
            actionLabel: "Inject Recovery Scenario",
            icon: <CheckCircle2 size={20} />,
            stat: { value: "6", label: "Auto Interventions" },
            highlight: "#sidebar-console",
            pos: "right",
        },
        {
            id: "recovery_confirmed",
            phase: "RECOVERY DEMO",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Crisis Averted",
            subtitle: "Mr. Tan stays home. Not in the ER. Bewo paid for itself.",
            body: "The dashboard now shows:\n\n\u2022 HMM State: STABLE (green) \u2014 recovered\n\u2022 Risk Score: ~22% (down from 95%)\n\u2022 48h Crisis Prob: Low \u2014 Monte Carlo shows safe trajectory\n\u2022 SBAR: \"Metrics within acceptable range. Continue monitoring.\"\n\u2022 Triage: IMMEDIATE \u2192 STABLE\n\nNow check the other views:\n\u2022 Nurse View \u2014 timeline shows full CRISIS \u2192 WARNING \u2192 STABLE with confidence scores per day\n\u2022 Patient View \u2014 Daily Insight Card is green: \"You are doing well!\"\n\nOne prevented ER visit saves $8,000\u2013$15,000. Bewo costs $3/month. That's 2,900 patient-months funded per avoided admission.",
            insight: "Singapore spends $2.5B/year on diabetes complications. 61% are preventable with early intervention. At $3/patient/month and 100,000 target patients, Bewo's annual cost is $3.6M \u2014 preventing just 450 ER visits covers that entirely. The ROI is not theoretical, it's arithmetic.",
            tab: "overview",
            icon: <DollarSign size={20} />,
            stat: { value: "95\u219222%", label: "Risk Reduction" },
            visualHint: "State cards should now be green. Check Nurse and Patient views too.",
            highlight: "#state-cards-grid",
            pos: "below",
        },
        {
            id: "recovery_views",
            phase: "RECOVERY DEMO",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Three Stakeholders, One Event",
            subtitle: "Same recovery \u2014 3 completely different interfaces",
            body: "Click through the tabs to see how the same recovery looks different:\n\nOverview (Judge): Raw HMM states, risk scores, Monte Carlo, SBAR, triage \u2014 the technical truth\n\nNurse View: 14-day timeline with clickable day analysis, transition heatmap showing recovery trajectory, biometric trends returning to normal ranges\n\nPatient View: Green insight card (\"You are doing well!\"), voucher balance intact, medication streak continuing, AI companion giving encouragement\n\nThis is multi-stakeholder design: the right information, at the right abstraction level, for the right person. The patient gets empathy. The nurse gets efficiency. The caregiver gets peace of mind.",
            insight: "Most health AI shows everyone the same dashboard. Bewo gives clinicians clinical data, patients emotional support, and caregivers actionable status updates. Same underlying HMM, three completely different user experiences.",
            tab: "overview",
            icon: <Users size={20} />,
            stat: { value: "3", label: "Stakeholder Views" },
            highlight: "#tab-bar-group",
            pos: "below",
        },

        // ===============================================
        // PHASE 6: TOOL DEMO (Steps 16-17)
        // ===============================================
        {
            id: "tool_demo_intro",
            phase: "AGENTIC AI",
            phaseColor: "from-cyan-600 to-blue-600",
            title: "18 Agentic AI Tools",
            subtitle: "Every tool fires against a real API endpoint",
            body: "Click the \"Tool Demo\" tab. You'll see individual tool buttons plus \"Run All 18 Tools\".\n\nTry clicking individual tools:\n\u2022 Drug Interaction Check \u2014 queries real interaction database (16 pairs, 39 drug-to-class mappings)\n\u2022 SBAR Report \u2014 generates real clinical summary from current HMM state\n\u2022 Caregiver Alert \u2014 sends alert with intelligent burden scoring\n\u2022 Food Recommendation \u2014 culturally-aware meal suggestion (knows hawker food)\n\nThen click \"Run All 18 Tools\" to see the full pipeline.\n\nWatch the terminal \u2014 it shows exact function calls, arguments, and real API responses. Nothing is mocked.",
            insight: "Each tool tracks its effectiveness per-patient, per-state. The system learns that medication reminders work 85% of the time for Mr. Tan in WARNING state but only 40% in CRISIS. Over time, the agent preferentially selects tools that work for each individual.",
            tab: "tooldemo",
            icon: <Terminal size={20} />,
            stat: { value: "18", label: "AI Tools" },
            highlight: "#tool-grid",
            pos: "below",
        },
        {
            id: "tool_demo_pipeline",
            phase: "AGENTIC AI",
            phaseColor: "from-cyan-600 to-blue-600",
            title: "The 5-Phase Pipeline",
            subtitle: "Safety first. Clinical second. Engagement third.",
            body: "When \"Run All\" executes, watch the 5 phases:\n\nPhase 1 \u2014 Safety Pre-Check:\n\u2022 Drug interactions (16 pairs, severity-classified)\n\u2022 6-dimension safety classifier audit\n\nPhase 2 \u2014 Clinical Intelligence:\n\u2022 SBAR report generation\n\u2022 Multi-patient nurse triage ranking\n\nPhase 3 \u2014 Patient Engagement:\n\u2022 Culturally-aware food recommendation\n\u2022 Streak celebration + voucher management\n\nPhase 4 \u2014 Proactive Communication:\n\u2022 Appointment booking\n\u2022 Caregiver alert (with burden scoring)\n\nPhase 5 \u2014 Remaining Tools:\n\u2022 Medication adjustment, reminders, activity suggestions, escalation, weekly report, nudge scheduling",
            insight: "Safety comes FIRST \u2014 before any patient-facing action, the system checks drug interactions and runs the safety classifier. Every AI response is verified on 6 dimensions: medical accuracy, emotional appropriateness, hallucination detection, cultural sensitivity, scope boundaries, and dangerous advice prevention.",
            tab: "tooldemo",
            icon: <Shield size={20} />,
            stat: { value: "6", label: "Safety Dimensions" },
            highlight: "#tool-terminal",
            pos: "left",
        },

        // ===============================================
        // PHASE 7: AI INTELLIGENCE (Steps 18-19)
        // ===============================================
        {
            id: "intelligence_intro",
            phase: "UNDER THE HOOD",
            phaseColor: "from-purple-600 to-violet-600",
            title: "The Learning Engine",
            subtitle: "What makes Bewo truly agentic \u2014 it learns and remembers",
            body: "Click \"AI Intelligence\". You'll see 10 panels showing the agent's internal state:\n\n\u2022 Agent Memory \u2014 3 types: episodic (events), semantic (medical knowledge), preference (patient likes/dislikes). Persists across sessions.\n\n\u2022 Tool Effectiveness \u2014 per-tool, per-state success rates. Learns which interventions work for each patient.\n\n\u2022 Safety Classifier \u2014 audit trail of every AI response with verdict: SAFE / CAUTION / UNSAFE.\n\n\u2022 Baum-Welch Parameters \u2014 the learned HMM transition matrix via EM algorithm, showing how the model adapted to this specific patient's patterns.",
            insight: "Most health AI chatbots are stateless \u2014 they forget between sessions. Bewo remembers that Mr. Tan prefers Hokkien, skips breakfast on Sundays, and responds better to gentle nudges than clinical warnings. 3 memory types working together make the AI feel like it actually knows the patient.",
            tab: "intelligence",
            icon: <Brain size={20} />,
            stat: { value: "3", label: "Memory Types" },
            highlight: "#intel-grid",
            pos: "right",
        },
        {
            id: "intelligence_details",
            phase: "UNDER THE HOOD",
            phaseColor: "from-purple-600 to-violet-600",
            title: "Proactive Care & Caregiver Support",
            subtitle: "The agent reaches out first \u2014 it doesn't wait to be asked",
            body: "More Intelligence panels:\n\n\u2022 Streaks & Engagement \u2014 medication streaks (3/7/14/30-day milestones), challenge completion, engagement scoring\n\n\u2022 Caregiver Burden \u2014 scores alert fatigue (0\u2013100). If Mrs. Tan is overwhelmed, the system auto-switches to daily digest mode. Prevents caregiver burnout.\n\n\u2022 Proactive Check-ins \u2014 agent initiates conversations on 6 triggers: missed med, glucose anomaly, declining engagement, streak milestone, scheduled check-in, mood change\n\n\u2022 Counterfactual Analysis \u2014 \"What if you had taken your medication?\" Shows Mr. Tan his risk would have dropped from 35% \u2192 12%. Motivates compliance through evidence, not guilt.",
            insight: "Caregiver burden scoring is unique to Bewo. Mrs. Tan (the daughter) gets alerts \u2014 but if she's overwhelmed, the system reduces frequency automatically. No competitor monitors caregiver wellbeing. Bewo cares for the whole family, not just the patient.",
            tab: "intelligence",
            icon: <Heart size={20} />,
            stat: { value: "6", label: "Proactive Triggers" },
            highlight: "#intel-grid",
            scrollTo: "#intel-grid",
            pos: "right",
        },

        // ===============================================
        // PHASE 8: COMPETITIVE EDGE (Step 20) — NEW
        // ===============================================
        {
            id: "competitive_edge",
            phase: "WHY BEWO WINS",
            phaseColor: "from-amber-600 to-orange-600",
            title: "What No Competitor Does",
            subtitle: "5 advantages that are hard to replicate",
            body: "1. Explainable AI \u2014 HMM gives full interpretability (required by Singapore's AI governance). Deep learning competitors can't explain their predictions.\n\n2. Autonomous Action \u2014 18 tools that act, not just alert. Competitors notify; Bewo books appointments, adjusts reminders, and manages caregivers.\n\n3. Cultural Design \u2014 Singlish, hawker food understanding, NTUC vouchers. Not a US product localized for Asia \u2014 built for Singapore from day one.\n\n4. Caregiver Burden Scoring \u2014 no competitor monitors caregiver wellbeing. Alert fatigue is a real clinical problem.\n\n5. Cost Structure \u2014 $0.40/patient/month to operate. At $3/month subscription, 87% gross margin. Scales to B2G model across polyclinics.",
            insight: "Livongo (acquired by Teladoc for $18.5B) charges $75/month and only alerts \u2014 no autonomous action, no caregiver support, no cultural adaptation. Bewo delivers more capability at 1/25th the cost, purpose-built for ASEAN's 56M diabetics.",
            tab: "overview",
            icon: <Zap size={20} />,
            stat: { value: "S$3", label: "Per Patient/Month" },
            pos: "center",
        },

        // ===============================================
        // PHASE 9: EXPLORE (Step 21)
        // ===============================================
        {
            id: "other_scenarios",
            phase: "EXPLORE",
            phaseColor: "from-amber-600 to-orange-600",
            title: "Try Other Scenarios",
            subtitle: "7 scenarios \u2014 each produces completely different system behavior",
            body: "After this walkthrough, try the other scenarios from the sidebar:\n\n1. Stable Baseline \u2014 perfect adherence, everything green\n2. Realistic Stable \u2014 minor fluctuations, generally healthy\n3. Gradual Decline \u2014 slow 14-day deterioration (subtle but caught early)\n4. Warning \u2192 Recovery \u2014 early catch, successful intervention\n5. Warning \u2192 Crisis \u2014 progressive decline (you just saw this)\n6. Sudden Acute Event \u2014 stable baseline then immediate spike\n7. Crisis \u2192 Recovery \u2014 crisis detected, full autonomous intervention\n\nEach generates different HMM states, different SBAR reports, different triage scores, different Monte Carlo forecasts, different agent decisions. Try them all.",
            insight: "The fact that 7 different clinical scenarios produce completely different system behavior \u2014 across HMM, SBAR, triage, Monte Carlo, and all 18 agent tools \u2014 proves this isn't scripted or pre-loaded. It's a real inference engine responding to real data.",
            tab: "overview",
            icon: <RefreshCw size={20} />,
            stat: { value: "7", label: "Clinical Scenarios" },
            highlight: "#scenario-list",
            pos: "right",
        },

        // ===============================================
        // PHASE 10: CLOSING (Step 22)
        // ===============================================
        {
            id: "closing",
            phase: "SUMMARY",
            phaseColor: "from-zinc-800 to-zinc-900",
            title: "Before Crisis. Not After.",
            subtitle: "A working system. Not a prototype. Not a pitch deck.",
            body: "What you've just experienced is fully functional:\n\n\u2022 3-state HMM with Viterbi decoding + Baum-Welch learning\n\u2022 9 orthogonal biomarkers from CGM + Fitbit + App\n\u2022 2,000-path Monte Carlo simulation for 48h risk forecasting\n\u2022 5-turn ReAct agent with 18 tools and cross-session memory\n\u2022 6-dimension safety classifier on every AI response\n\u2022 Auto-SBAR, auto-triage, continuous drug interaction monitoring\n\u2022 Loss-aversion voucher gamification (Prospect Theory)\n\u2022 Caregiver burden scoring (prevents alert fatigue)\n\u2022 53 API routes, 35 database tables, 43,000+ lines of code\n\u2022 3 stakeholder views: patient \u2192 nurse \u2192 caregiver\n\nBuilt for Singapore. Designed to scale across ASEAN.\n\nYou can now explore freely. Inject any scenario. Chat with the AI. Click every button. Everything is live.",
            insight: "Singapore's diabetic population will double by 2035. Bewo is built for this reality \u2014 culturally aware (Singlish, hawker food, NTUC vouchers), clinically rigorous (HMM, SBAR, pharmacovigilance), and designed to scale across polyclinics at S$3/patient/month. The question isn't whether we need this \u2014 it's how fast we can deploy it.",
            icon: <Globe size={20} />,
            stat: { value: "53", label: "API Endpoints" },
            highlight: "#state-cards-grid",
            pos: "below",
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

    // Keyboard navigation: Escape to close, Arrow keys to navigate
    // Uses refs to avoid stale closures in the event handler
    const canProceedRef = useRef(canProceed);
    const actionRunningRef = useRef(actionRunning);
    const isFirstRef = useRef(isFirst);
    const isLastRef = useRef(isLast);
    canProceedRef.current = canProceed;
    actionRunningRef.current = actionRunning;
    isFirstRef.current = isFirst;
    isLastRef.current = isLast;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            if (e.key === "ArrowRight" && canProceedRef.current && !actionRunningRef.current) goNext();
            if (e.key === "ArrowLeft" && !isFirstRef.current) goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Single canonical place for tab switching — fires once per step change
    useEffect(() => {
        if (step.tab) onTabChange(step.tab);
    }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll card body to top on step change
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    // Detect sidebar width dynamically
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

    // Positioning logic: calculate card position + highlight ring rect (NO DOM mutation)
    useEffect(() => {
        // Use a longer delay for iframe tabs so content has time to mount
        const isIframeTab = step.tab === "nurse" || step.tab === "patient";
        const delay = isIframeTab ? 400 : 200;

        const timer = setTimeout(() => {
            const CARD_W = 340;
            const CARD_H = 420;
            const GAP = 16;
            const PAD = 8;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const sidebarW = getSidebarWidth();

            // Scroll to element if requested
            if (step.scrollTo) {
                const scrollTarget = document.querySelector(step.scrollTo);
                scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            // For iframe tabs, position card at top-right of content area, no highlight
            if (step.pos === "bottom-left") {
                setHighlightRect(null);
                setCardPos({ top: 72, left: vw - CARD_W - GAP });
                return;
            }

            // Find highlight target
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

            // Get element rect and set highlight ring (clamped to viewport)
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

            // Is the highlighted element inside the sidebar?
            const isSidebarEl = rect.right <= sidebarW + 20;

            // Position card relative to highlighted element
            let top: number, left: number;
            const TAB_H = 56;

            if (isSidebarEl) {
                // Sidebar element highlighted — card goes in center of main content
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

            // Final clamp — never offscreen
            left = Math.max(sidebarW + GAP, Math.min(left, vw - CARD_W - GAP));
            top = Math.max(TAB_H + GAP, Math.min(top, vh - CARD_H - GAP));

            setCardPos({ top, left });
        }, delay);

        return () => clearTimeout(timer);
    }, [currentStep, step.highlight, step.pos, step.scrollTo, step.tab, resizeTick]); // eslint-disable-line react-hooks/exhaustive-deps

    // Group steps into phases for the progress indicator
    const phases = [
        { name: "Intro", steps: [0, 1], color: "bg-blue-500" },
        { name: "Crisis", steps: [2, 3, 4, 5], color: "bg-rose-500" },
        { name: "Nurse", steps: [6, 7, 8], color: "bg-cyan-500" },
        { name: "Patient", steps: [9, 10, 11, 12], color: "bg-emerald-500" },
        { name: "Recovery", steps: [13, 14, 15], color: "bg-green-500" },
        { name: "Tools", steps: [16, 17], color: "bg-cyan-500" },
        { name: "AI", steps: [18, 19], color: "bg-purple-500" },
        { name: "Edge", steps: [20], color: "bg-amber-500" },
        { name: "Explore", steps: [21], color: "bg-amber-500" },
        { name: "Close", steps: [22], color: "bg-zinc-700" },
    ];

    // Estimated time remaining
    const avgSecondsPerStep = 25;
    const remainingSteps = steps.length - currentStep - 1;
    const minutesLeft = Math.max(1, Math.ceil((remainingSteps * avgSecondsPerStep) / 60));

    return (
        <>
            {/* Scrim with cutout hole */}
            <div
                className="fixed inset-0 z-[189]"
                onClick={onClose}
                role="presentation"
                aria-label="Close walkthrough"
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
                className="fixed z-[195] w-[340px] bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden flex flex-col"
                role="dialog"
                aria-label={`Walkthrough step ${currentStep + 1} of ${steps.length}: ${step.title}`}
                aria-modal="true"
                style={{
                    top: cardPos.top,
                    left: cardPos.left,
                    maxHeight: "min(420px, calc(100vh - 80px))",
                    transition: "top 0.7s cubic-bezier(0.22,1,0.36,1), left 0.7s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
                {/* Compact gradient header */}
                <div className={`bg-gradient-to-r ${step.phaseColor} px-4 pt-3 pb-2.5 shrink-0`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.18em]">
                                {step.phase}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/50 text-[9px] flex items-center gap-0.5">
                                <Clock size={8} />
                                ~{minutesLeft}min left
                            </span>
                            <span className="text-white/70 text-[11px] font-mono font-semibold">
                                {currentStep + 1}/{steps.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                            {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold text-white leading-tight">{step.title}</h1>
                            <p className="text-white/70 text-[11px] mt-0.5 leading-snug">{step.subtitle}</p>
                        </div>
                    </div>

                    {step.stat && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-md px-2 py-1">
                            <span className="text-sm font-black text-white">{step.stat.value}</span>
                            <span className="text-white/60 text-[8px] font-medium uppercase tracking-wider">{step.stat.label}</span>
                        </div>
                    )}

                    {/* Phase progress ticks */}
                    <div className="mt-2 flex items-center gap-px">
                        {phases.map((p, pi) => (
                            <div key={pi} className="flex-1 flex gap-px">
                                {p.steps.map((si) => (
                                    <div
                                        key={si}
                                        className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                                            si === currentStep ? "bg-white" :
                                            si < currentStep ? "bg-white/50" : "bg-white/15"
                                        }`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body content */}
                <div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-2.5">
                    <div className={`transition-all duration-500 ease-out ${transitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
                        <div className="text-[11px] text-zinc-600 leading-[1.6] whitespace-pre-line">
                            {step.body}
                        </div>

                        {/* Insight box */}
                        <div className="mt-2 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md p-2.5 border border-zinc-200">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <Target size={10} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mb-0.5">
                                        Why This Matters
                                    </div>
                                    <p className="text-[10px] text-zinc-700 leading-snug font-medium">
                                        {step.insight}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {step.visualHint && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-600 font-medium bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                <Eye size={12} className="shrink-0" />
                                {step.visualHint}
                            </div>
                        )}

                        {hasAction && (
                            <div className="mt-3">
                                <button
                                    onClick={() => runAction(step.action!, currentStep)}
                                    disabled={actionRunning || isDone}
                                    className={`w-full h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all
                                        ${isDone
                                            ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                                            : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-zinc-900/20"
                                        }
                                        disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {actionRunning ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Running Pipeline...</span>
                                        </>
                                    ) : isDone ? (
                                        <>
                                            <CheckCircle2 size={14} />
                                            <span>Complete \u2014 Data Injected</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} className="fill-current" />
                                            <span>{step.actionLabel}</span>
                                        </>
                                    )}
                                </button>
                                {actionError && (
                                    <p className="text-[10px] text-amber-600 text-center mt-1 font-medium">
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

                {/* Compact footer navigation */}
                <div className="px-3 py-2 border-t border-zinc-100 bg-zinc-50/80 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        i === currentStep
                                            ? "w-4 bg-zinc-900"
                                            : i < currentStep
                                                ? "w-1.5 bg-zinc-400"
                                                : "w-1 bg-zinc-200"
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {!isFirst && (
                                <button
                                    onClick={goPrev}
                                    className="h-7 px-3 rounded-lg border border-zinc-200 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center gap-0.5 transition-colors"
                                    aria-label="Previous step"
                                >
                                    <ChevronLeft size={12} /> Back
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                disabled={!canProceed}
                                className={`h-7 px-4 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all
                                    ${isLast
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20"
                                    }
                                    disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none`}
                                aria-label={isLast ? "Close walkthrough and explore freely" : "Next step"}
                            >
                                {isLast ? (
                                    <>Explore Freely <ArrowRight size={12} /></>
                                ) : (
                                    <>Next <ChevronRight size={12} /></>
                                )}
                            </button>
                        </div>
                    </div>
                    {/* Keyboard hint */}
                    <div className="text-[8px] text-zinc-300 text-center mt-1">
                        Use arrow keys to navigate \u00b7 Esc to close
                    </div>
                </div>
            </div>
        </>
    );
}
