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
    Smartphone,
    RefreshCw,
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
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    const runAction = useCallback(async (action: () => Promise<void>, stepIdx: number) => {
        setActionRunning(true);
        try {
            await action();
            setActionDone(prev => new Set(prev).add(stepIdx));
            onRefresh();
        } catch (e) {
            console.error("Walkthrough action failed:", e);
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
        // AND writes to the console log (which the user should be watching)
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
                // Safety timeout
                setTimeout(() => { clearInterval(check); resolve(); }, 15000);
            });
        } else {
            // Fallback: run API calls directly
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
            body: "You're about to experience a live, working system — not a prototype, not a mockup.\n\nEvery button fires real API calls against our FastAPI backend: HMM Viterbi inference, Monte Carlo simulation, agentic AI reasoning, 6-dimension safety classification, and automated nurse triage.\n\nThis walkthrough guides you through the exact journey that makes Bewo different from every other team: we don't just predict — we act.",
            insight: "20,000+ lines of production code. 53 API endpoints. 35 database tables. 7 injectable scenarios. 3 stakeholder views. Everything you'll see is live.",
            icon: <Sparkles size={20} />,
            stat: { value: "20K+", label: "Lines of Code" },
            highlight: "#sidebar-brand",
            pos: "right",
        },
        {
            id: "layout_overview",
            phase: "INTRODUCTION",
            phaseColor: "from-blue-600 to-indigo-600",
            title: "Your Control Panel",
            subtitle: "The Judge Console — you control everything from here",
            body: "Look at the left sidebar — that's your Admin Console. It has:\n\n• System status indicator (green = backend running)\n• 7 injectable clinical scenarios (from stable to sudden crisis)\n• Run Full Simulation button — triggers the entire pipeline\n• Reset Database — start fresh anytime\n• Live console log — shows every pipeline step in real-time\n\nAbove you, the 5 tabs let you switch between:\nOverview | Patient View | Nurse View | AI Intelligence | Tool Demo\n\nWe'll walk through each one.",
            insight: "Most competition demos are pre-recorded or pre-loaded. Yours lets judges inject any scenario and watch the entire system respond in real-time. That's a massive differentiator.",
            tab: "overview",
            icon: <BarChart3 size={20} />,
            stat: { value: "7", label: "Scenarios" },
            visualHint: "Look at the Admin Console sidebar on the left",
            highlight: "#tab-bar-group",
            pos: "below",
        },

        // ===============================================
        // PHASE 2: CRISIS SCENARIO (Steps 2-6)
        // ===============================================
        {
            id: "inject_crisis",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "Triggering a Crisis",
            subtitle: "Injecting 14 days of deteriorating patient data",
            body: "We're about to inject the \"Warning → Crisis\" scenario:\n\n• Days 1-5: Stable baseline (glucose 5-7 mmol/L, 80%+ adherence)\n• Days 6-10: Gradual decline (glucose rising, steps dropping)\n• Days 11-14: Full crisis (glucose 15+ mmol/L, adherence 30%, HRV collapsed)\n\nClick the button below. Watch the console log on the left — it will show each pipeline stage firing:\n1. Data injection (14 days of biometrics)\n2. HMM Viterbi state decoding\n3. Baum-Welch parameter learning (EM algorithm)\n4. Monte Carlo risk simulation (2,000 trajectories)",
            insight: "A traditional health app would only catch this after the patient collapses and ends up in the ER. Bewo detects it 48 hours before symptoms become critical — from passive sensor data alone.",
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
            title: "State Cards — The System's Verdict",
            subtitle: "Four metrics that tell the whole story at a glance",
            body: "Look at the 4 cards at the top of the Overview:\n\n1. HMM State: CRISIS (red) — Viterbi decoded the 14-day hidden state sequence and classified the current state\n\n2. Risk Score: ~95% — the overall composite risk from all 9 biomarkers\n\n3. 48h Crisis Prob: ~95% — Monte Carlo ran 2,000 stochastic simulations forward 48 hours and measured how many paths hit crisis\n\n4. Drug Interactions: the number of medication interaction pairs detected (Metformin + Lisinopril, etc.)",
            insight: "All four of these updated in under 2 seconds. No nurse clicked anything. No doctor reviewed a chart. The system detected, analyzed, classified, and scored — autonomously.",
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
            subtitle: "Clinical handoff summary — zero nurse effort",
            body: "Scroll down on the Overview. You'll see the SBAR Clinical Report:\n\n• S (Situation): Current state, what's happening right now\n• B (Background): Patient profile — 67M, T2DM + HTN + HLD, medications\n• A (Assessment): Clinical analysis from HMM + Monte Carlo\n• R (Recommendation): Actionable next steps for the nurse\n\nThis is the standard clinical handoff format used in every hospital in Singapore. Nurses spend 15-20 minutes writing these manually.",
            insight: "This SBAR report was auto-generated in under 3 seconds. A nurse manually writing this takes 15-20 minutes per patient. Bewo lets one nurse monitor 100+ patients without missing a single deterioration.",
            tab: "overview",
            icon: <FileText size={20} />,
            stat: { value: "3s", label: "SBAR Generation" },
            visualHint: "Scroll down to see the SBAR report, Triage, and Drug Interactions",
            highlight: "#sbar-section",
            scrollTo: "#sbar-section",
            pos: "right",
        },
        {
            id: "overview_triage_drugs",
            phase: "CRISIS SCENARIO",
            phaseColor: "from-rose-600 to-red-600",
            title: "Triage & Drug Safety",
            subtitle: "Multi-patient urgency ranking + medication interaction checks",
            body: "Below the SBAR, you'll see two more panels:\n\nNurse Triage:\n• Patients ranked by urgency score (0-100%)\n• Categories: IMMEDIATE (red) → SOON (amber) → MONITOR (blue) → STABLE (green)\n• P001 is flagged IMMEDIATE — auto-surfaced to the top of the queue\n\nDrug Interactions:\n• 16 medication interaction pairs checked\n• Severity: CONTRAINDICATED / MAJOR / MODERATE / MINOR\n• Shows mechanism of interaction and clinical recommendation\n• Metformin + Lisinopril, Aspirin + Atorvastatin, etc.",
            insight: "Drug interaction checking runs on every state transition. Most apps check once at prescription time. Bewo checks continuously because patient context changes — what's safe at STABLE may be dangerous at CRISIS.",
            tab: "overview",
            icon: <Pill size={20} />,
            stat: { value: "16", label: "Drug Pairs Checked" },
            highlight: "#triage-section",
            scrollTo: "#triage-section",
            pos: "right",
        },

        // ===============================================
        // PHASE 3: NURSE VIEW (Steps 7-9)
        // ===============================================
        {
            id: "nurse_intro",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "The Nurse's Perspective",
            subtitle: "What Sarah Chen, RN sees at the start of her shift",
            body: "Click the \"Nurse View\" tab above. You're now looking at the clinical dashboard.\n\nTop bar: Patient header showing Mr. Tan Ah Kow, 67M, with CRISIS status badge (pulsing red — urgent attention needed).\n\nBelow that: The 14-day Health Timeline — click any day to see the detailed HMM analysis for that date, including Gaussian probability curves for each of the 9 biomarkers.",
            insight: "A polyclinic nurse manages 600+ patients. Manual chart review for each takes 20+ minutes. Bewo gives them a priority-sorted dashboard where the most critical patients surface automatically. Zero manual review needed.",
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
            title: "14-Day Timeline & HMM Analysis",
            subtitle: "Click any day to see exactly why the HMM made its decision",
            body: "The color-coded timeline strip shows the HMM state for each of the past 14 days:\n• Green = STABLE\n• Amber = WARNING  \n• Red = CRISIS\n• Confidence % shown below each day\n\nClick a day to expand the detail panel:\n• Gaussian probability curves — one per biomarker, showing the fit to each state\n• Evidence table — which features pulled toward which state, and by how much\n• Log-likelihood heatmap — the raw probability matrix behind the decision\n\nThis is full HMM interpretability — every decision is explainable.",
            insight: "This is why we chose HMM over deep learning. A neural network would say 'CRISIS' with no explanation. Our HMM shows exactly which biomarkers triggered the state change: glucose variability contributed 35%, medication adherence 28%, HRV 15%...",
            tab: "nurse",
            icon: <Brain size={20} />,
            stat: { value: "9", label: "Biomarker Features" },
            visualHint: "Click any day on the timeline strip to see the analysis detail",
            highlight: "#nurse-timeline",
            pos: "right",
        },
        {
            id: "nurse_hmm_intelligence",
            phase: "NURSE DASHBOARD",
            phaseColor: "from-blue-600 to-cyan-600",
            title: "HMM Intelligence Center",
            subtitle: "State distribution, transition dynamics, Monte Carlo forecast",
            body: "Below the timeline, you'll see 3 panels side-by-side:\n\n1. State Distribution (donut chart) — what % of the past 14 days were STABLE vs WARNING vs CRISIS\n\n2. Transition Heatmap (3×3 grid) — learned transition probabilities. Shows P(CRISIS→STABLE) = low, P(CRISIS→CRISIS) = high — the system understands that crisis states are sticky\n\n3. Monte Carlo Forecast (area chart) — 2,000 simulated trajectories showing crisis probability over the next 48 hours. The red area shows the danger zone.\n\nFurther down: 24h biometric trends (glucose line + steps bar chart), SBAR report, drug interactions, triage, and active alerts.",
            insight: "The transition matrix is learned via Baum-Welch (Expectation-Maximization), not hardcoded. As more data comes in, the model adapts to this specific patient's patterns. Mr. Tan's crisis-to-stable transition probability is different from Mdm. Lee's.",
            tab: "nurse",
            icon: <TrendingUp size={20} />,
            stat: { value: "2K", label: "Monte Carlo Paths" },
            highlight: "#nurse-hmm-center",
            scrollTo: "#nurse-hmm-center",
            pos: "below",
        },

        // ===============================================
        // PHASE 4: PATIENT VIEW (Steps 10-13)
        // ===============================================
        {
            id: "patient_intro",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "What Mr. Tan Sees",
            subtitle: "A caring companion, not a clinical dashboard",
            body: "Click \"Patient View\" above. You'll see a mobile-sized app — this is what the patient actually uses.\n\nNotice the difference: no HMM states, no probability curves, no triage scores. Instead:\n\n• Daily Insight Card — a risk indicator with trend (Declining/Improving/Stable) and motivational text\n• Merlion Risk Score — a simple percentage the patient can understand\n• Biometric overview — glucose, steps, heart rate in a clean bento grid",
            insight: "The patient never sees 'CRISIS' or 'HMM state probability'. They see a caring companion. Trust is the intervention — if patients don't trust the app, no algorithm in the world will help them take their medication.",
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
            title: "Voucher Gamification",
            subtitle: "Loss-aversion psychology — patients work to keep what they have",
            body: "Below the health status, you'll see the NTUC Voucher Card:\n\n• Starts at S$5.00/week\n• Decays S$0.25 per missed medication or check-in\n• Shows current balance + streak days\n• Redeemable on Sundays via QR code at NTUC FairPrice\n\nThis uses Prospect Theory (Kahneman & Tversky 1979): loss aversion is 2-2.5x stronger than equivalent gains. Patients fight harder to keep $5 than to earn $5.\n\nBelow that: Medication Schedule — swipe-to-confirm with haptic feedback, grouped by morning/afternoon/evening.",
            insight: "We chose NTUC vouchers specifically for Singapore's elderly. Not cash, not points — grocery vouchers. Mr. Tan can buy his kopi-o and bread. Mdm. Lee can buy rice and vegetables. It's culturally meaningful, not just gamification.",
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
            body: "Scroll down to the Care Assistant section. This is a real AI chat powered by Gemini + our 18-tool agent:\n\n• Type a message — it fires a real API call to our agentic runtime\n• The AI speaks Singlish when appropriate (\"Wah, uncle, your glucose quite high leh\")\n• It detects mood from text and adjusts tone\n• It can execute real tools: book appointments, check drug interactions, recommend food, celebrate streaks\n• Cross-session memory: remembers previous conversations\n\nTry typing: \"What should I eat for dinner?\" or \"My glucose is high, what should I do?\"",
            insight: "This isn't ChatGPT with a healthcare prompt. It's a 5-turn ReAct agent that reasons over full clinical context — HMM state, medication list, recent biometrics, conversation history — before choosing which of 18 tools to execute.",
            tab: "patient",
            icon: <MessageSquare size={20} />,
            stat: { value: "5", label: "ReAct Turns" },
            highlight: "#patient-chat",
            scrollTo: "#patient-chat",
            pos: "left",
        },
        {
            id: "patient_actions",
            phase: "PATIENT EXPERIENCE",
            phaseColor: "from-emerald-600 to-teal-600",
            title: "Patient Actions",
            subtitle: "Glucose logging, food tracking, voice check-ins",
            body: "In the bottom-right corner, there's a floating + button. Tap it to see 3 action options:\n\n1. Log Glucose — manual entry or camera OCR (photo of glucometer → Gemini Vision extracts the reading)\n\n2. Log Food — describe what you ate in natural language (\"chicken rice with teh c\"). The AI understands local food.\n\n3. Voice Check-in — uses Web Speech API for speech-to-text, then runs sentiment analysis. Detects frustration, anxiety, or positive mood and adjusts the AI's response tone.\n\nAll of these feed into the HMM's 9 biomarker features.",
            insight: "Voice check-in isn't just convenience — it's a mental health signal. If Mr. Tan sounds frustrated 3 days in a row, the system detects declining engagement and proactively adjusts: shorter messages, more encouragement, maybe a voucher bonus.",
            tab: "patient",
            icon: <Mic size={20} />,
            stat: { value: "3", label: "Input Modes" },
            highlight: "#patient-actions-area",
            pos: "left",
        },

        // ===============================================
        // PHASE 5: RECOVERY SCENARIO (Steps 14-16)
        // ===============================================
        {
            id: "inject_recovery",
            phase: "RECOVERY DEMO",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Now Watch Recovery",
            subtitle: "Bewo detects crisis, intervenes autonomously, patient recovers",
            body: "This is Bewo's key differentiator — we don't just detect, we act.\n\nClick the button below to inject the Recovery scenario:\n• Patient starts in CRISIS\n• Bewo's agent autonomously intervenes:\n  - Sends medication reminders at optimal times\n  - Alerts the caregiver (Mrs. Tan Mei Ling) via WhatsApp\n  - Books a follow-up at NUH Diabetes Centre\n  - Celebrates the patient's adherence streak\n  - Adjusts nudge timing based on response patterns\n• Over 14 days: CRISIS → WARNING → STABLE\n\nWatch the state cards transition from red → amber → green.",
            insight: "The agent autonomously booked a clinic appointment, alerted the caregiver, adjusted medication reminders, and celebrated the patient's streak — all without a single nurse clicking anything. 6 interventions, zero human effort.",
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
            title: "Crisis Prevented",
            subtitle: "STABLE state restored — the patient stays home, not the ER",
            body: "Look at the dashboard now:\n\n• HMM State: STABLE (green) — patient recovered\n• Risk Score: ~22% (down from 95%)\n• 48h Crisis Prob: Low — Monte Carlo shows safe trajectory\n• SBAR: \"Metrics within acceptable range. Continue monitoring.\"\n• Triage: Patient moved from IMMEDIATE → STABLE\n\nNow click \"Nurse View\" — the timeline shows the full CRISIS → WARNING → STABLE progression with confidence scores for each day.\n\nThen click \"Patient View\" — the Daily Insight Card now shows green with \"You are doing well\" instead of red.",
            insight: "Singapore spends $2.5B/year on diabetes. Each prevented ER admission saves $8,000-$15,000. One Bewo subscription costs $3/month. Scale this to 100,000 patients and the ROI writes itself.",
            tab: "overview",
            icon: <TrendingUp size={20} />,
            stat: { value: "95\u219222%", label: "Risk Reduction" },
            visualHint: "State cards should now be green. Check Nurse View timeline too",
            highlight: "#state-cards-grid",
            pos: "below",
        },
        {
            id: "recovery_views",
            phase: "RECOVERY DEMO",
            phaseColor: "from-emerald-600 to-green-600",
            title: "Three Stakeholders, One Event",
            subtitle: "Same recovery — 3 completely different experiences",
            body: "Click through the tabs and see how the same recovery event looks different for each stakeholder:\n\nOverview (Judge): Raw HMM states, risk scores, SBAR report, triage rankings — the technical truth\n\nNurse View: 14-day timeline with clickable analysis, transition heatmap showing recovery trajectory, biometric trends returning to normal\n\nPatient View: Green insight card saying \"You are doing well\", voucher balance intact, streak continuing, AI companion saying encouraging things\n\nThis is multi-stakeholder design: the right information for the right person at the right abstraction level.",
            insight: "Most health AI shows everyone the same dashboard. Bewo gives the patient empathy, the nurse efficiency, and the caregiver peace of mind. Same underlying data, three completely different interfaces.",
            tab: "overview",
            icon: <Users size={20} />,
            stat: { value: "3", label: "Stakeholder Views" },
            highlight: "#tab-bar-group",
            pos: "below",
        },

        // ===============================================
        // PHASE 6: TOOL DEMO (Steps 17-18)
        // ===============================================
        {
            id: "tool_demo_intro",
            phase: "AGENTIC AI",
            phaseColor: "from-cyan-600 to-blue-600",
            title: "18 Agentic AI Tools",
            subtitle: "Every tool fires against a real API endpoint",
            body: "Click the \"Tool Demo\" tab. You'll see 8 individual tool buttons plus \"Run All 18 Tools\".\n\nTry clicking individual tools first:\n• Drug Interaction Check — queries the real drug interaction database\n• SBAR Report — generates a real clinical summary\n• Caregiver Alert — sends a real alert with burden scoring\n• Food Recommendation — asks the AI for a culturally-aware meal suggestion\n\nThen click \"Run All 18 Tools\" to see the full pipeline execute in sequence.\n\nWatch the terminal output — it shows the exact function calls with arguments and real API responses.",
            insight: "Each of these 18 tools learns which interventions work best per individual patient. Mr. Tan responds to voucher nudges. Mdm. Lee responds to caregiver involvement. The system adapts — tool effectiveness scores are tracked per-patient, per-state.",
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
            subtitle: "Safety first, clinical second, engagement third",
            body: "When \"Run All\" executes, watch the 5 phases in the terminal:\n\nPhase 1 — Safety Pre-Check:\n• Drug interactions checked (16 pairs)\n• Safety classifier audit (6 dimensions)\n\nPhase 2 — Clinical Intelligence:\n• SBAR report generated\n• Multi-patient nurse triage\n\nPhase 3 — Patient Engagement:\n• Food recommendation (culturally-aware)\n• Streak celebration + voucher check\n\nPhase 4 — Proactive Communication:\n• Appointment booking\n• Caregiver alert (with burden scoring)\n\nPhase 5 — Remaining Tools:\n• Medication adjustment, reminders, activity suggestion, escalation, weekly report, nudge scheduling",
            insight: "Safety comes FIRST — before any patient-facing action, the system checks drug interactions and runs the safety classifier. Every response is verified on 6 dimensions: medical claims, emotional mismatch, hallucination, cultural sensitivity, scope, and dangerous advice.",
            tab: "tooldemo",
            icon: <Shield size={20} />,
            stat: { value: "6", label: "Safety Dimensions" },
            highlight: "#tool-terminal",
            pos: "left",
        },

        // ===============================================
        // PHASE 7: AI INTELLIGENCE (Steps 19-20)
        // ===============================================
        {
            id: "intelligence_intro",
            phase: "UNDER THE HOOD",
            phaseColor: "from-purple-600 to-violet-600",
            title: "The Learning Engine",
            subtitle: "This is what makes Bewo truly agentic — it learns and remembers",
            body: "Click \"AI Intelligence\" tab. You'll see 10 panels showing the agent's internal state:\n\n• Agent Memory — episodic (what happened), semantic (medical facts), preference (patient likes/dislikes). Cross-session: remembers between conversations.\n\n• Tool Effectiveness — per-tool, per-state success rates. The system learns that medication reminders work 85% of the time for Mr. Tan in WARNING state but only 40% in CRISIS.\n\n• Safety Classifier — audit trail of every response. Verdict: SAFE/CAUTION/UNSAFE. Flags any issues.\n\n• Baum-Welch Parameters — the learned HMM transition matrix (via EM algorithm). Shows how the model has adapted to this patient.",
            insight: "Most health AI chatbots are stateless — they forget you between sessions. Bewo remembers that Mr. Tan prefers Hokkien, skips breakfast on Sundays, and responds better to gentle nudges than clinical warnings. That's 3 types of memory working together.",
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
            subtitle: "The agent reaches out first — it doesn't wait to be asked",
            body: "The remaining Intelligence panels show:\n\n• Streaks & Engagement — medication streaks (3/7/14/30-day milestones), daily challenge completion, overall engagement score\n\n• Caregiver Burden — scores alert fatigue (0-100). If Mrs. Tan is getting too many alerts, the system auto-switches to daily digest mode. Prevents caregiver burnout.\n\n• Proactive Check-ins — the agent initiates conversations based on 6 trigger types: missed medication, glucose anomaly, declining engagement, streak milestone, scheduled check-in, mood change\n\n• Counterfactual Analysis — \"what if you had taken your medication?\" Shows the patient their risk would have dropped from 35% to 12%. Motivates compliance through evidence, not guilt.",
            insight: "Caregiver burden scoring is something no competitor does. Mrs. Tan (the daughter) gets alerts, but if she's overwhelmed, the system automatically reduces frequency. Bewo cares for the caregivers too.",
            tab: "intelligence",
            icon: <Heart size={20} />,
            stat: { value: "6", label: "Proactive Triggers" },
            highlight: "#intel-grid",
            scrollTo: "#intel-grid",
            pos: "right",
        },

        // ===============================================
        // PHASE 8: MORE SCENARIOS (Step 21)
        // ===============================================
        {
            id: "other_scenarios",
            phase: "EXPLORE",
            phaseColor: "from-amber-600 to-orange-600",
            title: "Try Other Scenarios",
            subtitle: "7 scenarios — each shows a different clinical trajectory",
            body: "After this walkthrough ends, try the other scenarios from the sidebar:\n\n1. Stable Baseline — perfect adherence, everything green\n2. Realistic Stable — minor fluctuations, generally healthy\n3. Gradual Decline — slow 14-day deterioration (subtle but caught)\n4. Warning → Recovery — Bewo catches a warning, intervenes, succeeds\n5. Warning → Crisis — progressive decline to crisis (you just saw this)\n6. Sudden Acute Event — stable baseline then immediate spike\n7. Crisis → Recovery — crisis detected, Bewo intervenes (you just saw this)\n\nEach scenario generates different HMM states, different SBAR reports, different triage scores, different Monte Carlo forecasts. Try them all.",
            insight: "The fact that you can inject 7 different clinical scenarios and see the entire system respond differently each time — HMM, SBAR, triage, Monte Carlo, agent tools — proves this isn't scripted. It's a real inference engine.",
            tab: "overview",
            icon: <RefreshCw size={20} />,
            stat: { value: "7", label: "Clinical Scenarios" },
            highlight: "#scenario-list",
            pos: "right",
        },

        // ===============================================
        // PHASE 9: CLOSING (Step 22)
        // ===============================================
        {
            id: "closing",
            phase: "SUMMARY",
            phaseColor: "from-zinc-800 to-zinc-900",
            title: "Before Crisis. Not After.",
            subtitle: "A working system. Not a prototype. Not a pitch deck.",
            body: "What you've just seen is fully functional:\n\n• 3-state HMM with Viterbi decoding + Baum-Welch learning\n• 9 orthogonal biomarkers from CGM + Fitbit + App\n• 2,000-path Monte Carlo simulation for 48h forecasting\n• 5-turn ReAct agent with 18 tools and cross-session memory\n• 6-dimension safety classifier on every response\n• Auto-SBAR, auto-triage, auto-drug-interaction checking\n• Loss-aversion voucher gamification (Prospect Theory)\n• Caregiver burden scoring (prevents alert fatigue)\n• 53 API routes, 35 database tables, 7 injectable scenarios\n• 3 stakeholder views: patient companion + nurse triage + caregiver alerts\n\nYou can now explore freely. Try any scenario. Chat with the AI. Click every button.",
            insight: "Singapore's aging population means diabetes cases will double by 2035. Bewo is built for this reality — culturally aware (Singlish, hawker food, NTUC vouchers), clinically rigorous (HMM, SBAR, drug interactions), and designed to scale across polyclinics at S$3/patient/month.",
            icon: <Shield size={20} />,
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

    const animateTransition = (direction: "next" | "prev", callback: () => void) => {
        setTransitioning(true);
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
    }, [currentStep, step.highlight, step.pos, step.scrollTo, step.tab]); // eslint-disable-line react-hooks/exhaustive-deps

    const canProceed = !hasAction || isDone;

    // Group steps into phases for the progress indicator
    const phases = [
        { name: "Intro", steps: [0, 1], color: "bg-blue-500" },
        { name: "Crisis", steps: [2, 3, 4, 5], color: "bg-rose-500" },
        { name: "Nurse", steps: [6, 7, 8], color: "bg-cyan-500" },
        { name: "Patient", steps: [9, 10, 11, 12], color: "bg-emerald-500" },
        { name: "Recovery", steps: [13, 14, 15], color: "bg-green-500" },
        { name: "Tools", steps: [16, 17], color: "bg-blue-500" },
        { name: "AI", steps: [18, 19], color: "bg-purple-500" },
        { name: "Explore", steps: [20], color: "bg-amber-500" },
        { name: "Close", steps: [21], color: "bg-zinc-700" },
    ];

    return (
        <>
            {/* ── Scrim with cutout hole (always rendered, transitions smoothly) ── */}
            <div className="fixed inset-0 z-[189]" onClick={onClose} />
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

            {/* ── Highlight ring (always rendered, opacity-controlled for smooth transitions) ── */}
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

            {/* ── Floating tour card ── */}
            <div
                className="fixed z-[195] w-[340px] bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden flex flex-col"
                style={{
                    top: cardPos.top,
                    left: cardPos.left,
                    maxHeight: "min(420px, calc(100vh - 80px))",
                    transition: "top 0.7s cubic-bezier(0.22,1,0.36,1), left 0.7s cubic-bezier(0.22,1,0.36,1)",
                }}
            >
                {/* ── Compact gradient header ── */}
                <div className={`bg-gradient-to-r ${step.phaseColor} px-4 pt-3 pb-2.5 shrink-0`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.18em]">
                                {step.phase}
                            </span>
                        </div>
                        <span className="text-white/70 text-[11px] font-mono font-semibold">
                            {currentStep + 1}/{steps.length}
                        </span>
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

                {/* ── Body content ── */}
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
                                            <span>Complete — Data Injected</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} className="fill-current" />
                                            <span>{step.actionLabel}</span>
                                        </>
                                    )}
                                </button>
                                {!isDone && !actionRunning && (
                                    <p className="text-[10px] text-zinc-400 text-center mt-1">
                                        Fires real API calls against the backend.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Compact footer navigation ── */}
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
                            >
                                {isLast ? (
                                    <>Explore Freely <ArrowRight size={12} /></>
                                ) : (
                                    <>Next <ChevronRight size={12} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
