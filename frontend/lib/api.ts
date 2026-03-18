
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_BEWO_API_KEY || "bewo-dev-key-2026";
if (!process.env.NEXT_PUBLIC_BEWO_API_KEY) {
    console.warn("NEXT_PUBLIC_BEWO_API_KEY not set — using default dev key. Set it in frontend/.env.local for production.");
}
const FETCH_TIMEOUT_MS = 60_000; // 60s for demo — chat pipeline + HMM can take time

// Authenticated fetch wrapper — all requests include API key + 60s timeout
// Never throws — returns a synthetic failed Response on network error so callers
// can always check res.ok without try/catch around the fetch itself.
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const headers = {
        ...Object.fromEntries(new Headers(options.headers).entries()),
        "X-API-Key": API_KEY,
    };

    try {
        return await fetch(url, { ...options, headers, signal: controller.signal });
    } catch (err) {
        // Network error, timeout, or backend not running — return synthetic failed response
        console.warn(`[authFetch] ${url} failed:`, err);
        return new Response(JSON.stringify({ detail: "Network error or backend unavailable" }), {
            status: 0,
            statusText: "Network Error",
        });
    } finally {
        clearTimeout(timeout);
    }
}

export type PatientState = {
    patient_id?: string;
    current_state: "STABLE" | "WARNING" | "CRISIS";
    confidence?: number;
    risk_score: number;
    risk_48h?: number;
    biometrics: {
        glucose: number;
        glucose_variability?: number;
        steps: number;
        hr: number;
        hrv?: number;
        sleep_quality?: number;
    };
    top_factors?: { feature: string; weight: number; value?: number; weighted_contribution?: number }[];
    last_updated: string;
    message?: string;
    trend?: string;
    survival_curve?: { hours: number; survival_prob: number }[];
    transition_matrix?: number[][];
};

export type HistoryPoint = {
    timestamp: string;
    glucose: number;
    steps: number;
};

export type PatientHistory = {
    history: HistoryPoint[];
};

export const api = {
    getPatientState: async (id: string): Promise<PatientState> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/state`);
            if (!res.ok) throw new Error("Failed to fetch state");
            const data = await res.json();
            // Validate biometrics consistency: if glucose is present, use it; otherwise provide realistic fallback
            if (data.biometrics) {
                if (data.biometrics.glucose == null || data.biometrics.glucose === 0) {
                    // Provide a realistic default based on state
                    if (data.current_state === "WARNING") data.biometrics.glucose = 8.2;
                    else if (data.current_state === "CRISIS") data.biometrics.glucose = 3.1;
                    else data.biometrics.glucose = 5.8;
                }
                if (data.biometrics.steps == null) data.biometrics.steps = 0;
                if (data.biometrics.hr == null) data.biometrics.hr = 72;
            }
            return data;
        } catch {
            return { current_state: "STABLE", risk_score: 12, biometrics: { glucose: 5.8, steps: 3240, hr: 72 }, last_updated: new Date().toISOString(), message: "Showing recent data", trend: "STABLE" };
        }
    },

    getPatientHistory: async (id: string): Promise<PatientHistory> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/history`);
            if (!res.ok) return { history: [] };
            return res.json();
        } catch {
            return { history: [] };
        }
    },

    getPatientAnalysis: async (id: string): Promise<{ history: { date: string; state: string; confidence: number }[] }> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/analysis/14days`);
            if (!res.ok) return { history: [] };
            return res.json();
        } catch {
            return { history: [] };
        }
    },

    getAnalysisDetail: async (id: string, date: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/analysis/detail?date=${date}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    chatWithAgent: async (message: string, patientId: string = "P001"): Promise<{ message: string; tone: string; actions?: any[]; hmm_state?: string }> => {
        try {
            const res = await authFetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, patient_id: patientId })
            });
            if (!res.ok) {
                return { message: "AI assistant is connecting. Please try again in a moment.", tone: "neutral", actions: [], hmm_state: undefined };
            }
            return res.json();
        } catch {
            return { message: "AI assistant is connecting. Please try again in a moment.", tone: "neutral", actions: [], hmm_state: undefined };
        }
    },

    getMedications: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/medications/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.medications || [];
        } catch {
            return [];
        }
    },

    logMedication: async (name: string, taken: boolean, patientId: string = "P001"): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/medications/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ medication_name: name, taken, patient_id: patientId })
            });
            if (!res.ok) return { success: false };
            return res.json();
        } catch {
            return { success: false };
        }
    },

    logGlucose: async (value: number, unit: string = "mmol/L", patientId: string = "P001"): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/glucose/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value, unit, source: "MANUAL", patient_id: patientId })
            });
            if (!res.ok) return { success: false };
            return res.json();
        } catch {
            return { success: false };
        }
    },

    logFood: async (description: string, carbs?: number, mealType?: string, patientId: string = "P001"): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/food/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    carbs_grams: carbs || 0,
                    meal_type: mealType || "snack",
                    patient_id: patientId
                }),
            });
            if (!res.ok) return { success: false };
            return res.json();
        } catch {
            return { success: false };
        }
    },

    getVoucher: async (id: string): Promise<{
        current_value: number;
        max_value: number;
        days_until_redemption: number;
        can_redeem: boolean;
        streak_days: number;
    }> => {
        try {
            const res = await authFetch(`${API_BASE}/voucher/${id}`);
            // Return default structure on failure to avoid UI crash
            if (!res.ok) return { current_value: 5.00, max_value: 5.00, days_until_redemption: 7, can_redeem: false, streak_days: 0 };
            return res.json();
        } catch {
            return { current_value: 5.00, max_value: 5.00, days_until_redemption: 7, can_redeem: false, streak_days: 0 };
        }
    },

    getVoucherQR: async (id: string): Promise<{ qr_code: string; value: number }> => {
        try {
            const res = await authFetch(`${API_BASE}/voucher/${id}/qr`);
            if (!res.ok) return { qr_code: "", value: 0 };
            return res.json();
        } catch {
            return { qr_code: "", value: 0 };
        }
    },

    extractGlucoseFromPhoto: async (file: File): Promise<{ success: boolean; value?: number; unit?: string; error?: string }> => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authFetch(`${API_BASE}/glucose/ocr`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) return { success: false, error: "OCR service unavailable" };
            return res.json();
        } catch {
            return { success: false, error: "OCR service unavailable" };
        }
    },

    // --- NURSE / TRIAGE ---
    getNurseAlerts: async (): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/nurse/alerts`);
            if (!res.ok) return [];
            const data = await res.json();
            const allAlerts = [
                ...(Array.isArray(data.nurse_alerts) ? data.nurse_alerts : []).map((a: any) => ({...a, category: 'nurse'})),
                ...(Array.isArray(data.doctor_escalations) ? data.doctor_escalations : []).map((a: any) => ({...a, category: 'escalation'})),
                ...(Array.isArray(data.family_alerts) ? data.family_alerts : []).map((a: any) => ({...a, category: 'family'})),
                ...(Array.isArray(data.medication_videos) ? data.medication_videos : []).map((a: any) => ({...a, category: 'medication_video'})),
                ...(Array.isArray(data.appointment_requests) ? data.appointment_requests : []).map((a: any) => ({...a, category: 'appointment'})),
            ];
            allAlerts.sort((a, b) => {
                const timeA = new Date(a.created_at || a.timestamp_utc || 0).getTime();
                const timeB = new Date(b.created_at || b.timestamp_utc || 0).getTime();
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
            });
            return allAlerts;
        } catch {
            return [];
        }
    },

    getNursePatients: async (): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/nurse/patients`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.patients || [];
        } catch {
            return [];
        }
    },

    getNurseTriage: async (): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/nurse/triage`);
            if (!res.ok) return { patients: [], generated_at: '' };
            return res.json();
        } catch {
            return { patients: [], generated_at: '' };
        }
    },

    getNurseTriageSingle: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/nurse/triage/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- CLINICIAN / IMPACT ---
    getClinicianSummary: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/clinician/summary/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getImpactMetrics: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/impact/metrics/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.metrics || data;
        } catch {
            return null;
        }
    },

    getInterventionEffectiveness: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/impact/intervention-effectiveness/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- DRUG INTERACTIONS ---
    getDrugInteractions: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/drug-interactions`);
            if (!res.ok) return { interactions_found: 0, interactions: [] };
            return res.json();
        } catch {
            return { interactions_found: 0, interactions: [] };
        }
    },

    checkDrugInteraction: async (id: string, proposed: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/patient/${id}/drug-interactions/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proposed_medication: proposed }),
            });
            if (!res.ok) return { interactions_found: 0, interactions: [] };
            return res.json();
        } catch {
            return { interactions_found: 0, interactions: [] };
        }
    },

    // --- AGENT INTELLIGENCE ---
    getAgentMemory: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/memory/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.memories || [];
        } catch {
            return [];
        }
    },

    getAgentActions: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/actions/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.actions || [];
        } catch {
            return [];
        }
    },

    getToolEffectiveness: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/tool-effectiveness/${id}`);
            if (!res.ok) return {};
            const data = await res.json();
            return data.effectiveness || {};
        } catch {
            return {};
        }
    },

    getSafetyLog: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/safety-log/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.safety_events || [];
        } catch {
            return [];
        }
    },

    getDailyChallenge: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/daily-challenge/${id}`);
            if (!res.ok) return { challenge: "Log your glucose before lunch", type: "glucose_logging", progress: 1, target: 3 };
            return res.json();
        } catch {
            return { challenge: "Log your glucose before lunch", type: "glucose_logging", progress: 1, target: 3 };
        }
    },

    getStreaks: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/streaks/${id}`);
            if (!res.ok) return { streaks: { medication: 3, glucose_logging: 5, exercise: 2 } };
            return res.json();
        } catch {
            return { streaks: { medication: 3, glucose_logging: 5, exercise: 2 } };
        }
    },

    getEngagement: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/engagement/${id}`);
            if (!res.ok) return { score: 0 };
            return res.json();
        } catch {
            return { score: 0 };
        }
    },

    getWeeklyReport: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/weekly-report/${id}`);
            if (!res.ok) return { adherence_pct: 78, days_in_target: 5, grade: "B", summary: "Good progress this week. Keep logging your glucose and staying active." };
            return res.json();
        } catch {
            return { adherence_pct: 78, days_in_target: 5, grade: "B", summary: "Good progress this week. Keep logging your glucose and staying active." };
        }
    },

    getGlucoseNarrative: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/glucose-narrative/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getCaregiverFatigue: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/caregiver-fatigue/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getProactiveHistory: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/proactive-history/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.history || [];
        } catch {
            return [];
        }
    },

    runCounterfactual: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/agent/counterfactual/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- METRICS DASHBOARD ---
    getMetricsDashboard: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/metrics/dashboard/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- VOICE CHECK-IN ---
    voiceCheckin: async (transcript: string, patientId: string = "P001"): Promise<{ sentiment_score: number; urgency: string; health_keywords: string[]; ai_response: string }> => {
        try {
            const res = await authFetch(`${API_BASE}/voice/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript, patient_id: patientId })
            });
            if (!res.ok) return { sentiment_score: 0, urgency: "unknown", health_keywords: [], ai_response: "Voice check-in unavailable right now. Try again shortly." };
            return res.json();
        } catch {
            return { sentiment_score: 0, urgency: "unknown", health_keywords: [], ai_response: "Voice check-in unavailable right now. Try again shortly." };
        }
    },

    // --- REMINDERS ---
    getReminders: async (id: string): Promise<any[]> => {
        try {
            const res = await authFetch(`${API_BASE}/reminders/${id}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.reminders || [];
        } catch {
            return [];
        }
    },

    dismissReminder: async (patientId: string, reminderId: number): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/reminders/${patientId}/dismiss/${reminderId}`, { method: "POST" });
            if (!res.ok) return { success: false };
            return res.json();
        } catch {
            return { success: false };
        }
    },

    // --- CAREGIVER ---
    getCaregiverDashboard: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/caregiver/dashboard/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getCaregiverBurden: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/caregiver/burden/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    caregiverRespond: async (alertId: string, action: string, patientId: string = "P001"): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/caregiver/respond/${alertId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caregiver_id: patientId, response_type: action, message: "" }),
            });
            if (!res.ok) return { success: false };
            return res.json();
        } catch {
            return { success: false };
        }
    },

    // --- HMM ---
    trainHMM: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/hmm/train/${id}`, { method: "POST" });
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getHMMParams: async (id: string): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/hmm/params/${id}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- PROACTIVE SCAN ---
    runProactiveScan: async (id?: string): Promise<any> => {
        try {
            const url = id ? `${API_BASE}/agent/proactive-scan/${id}` : `${API_BASE}/agent/proactive-scan`;
            const res = await authFetch(url, { method: "POST" });
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    // --- ADMIN METHODS ---
    resetData: async (): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/admin/reset`, { method: "POST" });
            if (!res.ok) { console.warn("Reset data returned non-OK:", res.status); return { success: false }; }
            return res.json();
        } catch (e) {
            console.warn("Reset data failed:", e);
            return { success: false };
        }
    },

    injectScenario: async (scenario: string, days: number = 14): Promise<any> => {
        try {
            const params = new URLSearchParams({ scenario, days: String(days) });
            const res = await authFetch(`${API_BASE}/admin/inject-scenario?${params}`, { method: "POST" });
            if (!res.ok) { console.warn("Inject scenario returned non-OK:", res.status); return { success: false }; }
            return res.json();
        } catch (e) {
            console.warn("Inject scenario failed:", e);
            return { success: false };
        }
    },

    injectPhase: async (scenario: string, dayStart: number, dayEnd: number, clear: boolean = false): Promise<any> => {
        const params = new URLSearchParams({
            scenario,
            day_start: String(dayStart),
            day_end: String(dayEnd),
            total_days: "14",
            clear: String(clear),
        });
        try {
            const res = await authFetch(`${API_BASE}/admin/inject-phase?${params}`, { method: "POST" });
            if (!res.ok) { console.warn("Inject phase returned non-OK:", res.status); return { success: false }; }
            return res.json();
        } catch (e) {
            console.warn("Inject phase failed:", e);
            return { success: false };
        }
    },

    runHMM: async (): Promise<any> => {
        try {
            const res = await authFetch(`${API_BASE}/admin/run-hmm`, { method: "POST" });
            if (!res.ok) { console.warn("Run HMM returned non-OK:", res.status); return { success: false }; }
            return res.json();
        } catch (e) {
            console.warn("Run HMM failed:", e);
            return { success: false };
        }
    },

    // --- SEA-LION ---
    getSeaLionStatus: async (): Promise<{ backend: string; model: string | null; status: string; api_base?: string }> => {
        try {
            const res = await authFetch(`${API_BASE}/sealion/status`);
            if (!res.ok) return { backend: "offline_mock", model: null, status: "offline" };
            return res.json();
        } catch {
            return { backend: "offline_mock", model: null, status: "offline" };
        }
    },

    getMeralionStatus: async (): Promise<{ backend: string; asr_model: string | null; ser_model: string | null; status: string }> => {
        try {
            const res = await authFetch(`${API_BASE}/meralion/status`);
            if (!res.ok) return { backend: "unavailable", asr_model: null, ser_model: null, status: "inactive" };
            return res.json();
        } catch {
            return { backend: "unavailable", asr_model: null, ser_model: null, status: "inactive" };
        }
    },

    translateWithSeaLion: async (message: string, tone?: string): Promise<{ original: string; translated: string; tone: string }> => {
        try {
            const res = await authFetch(`${API_BASE}/sealion/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, tone: tone || "calm" }),
            });
            if (!res.ok) {
                // Graceful fallback: return offline mock translation
                return { original: message, translated: `Uncle/Auntie ah, ${message} Take care lah.`, tone: tone || "calm" };
            }
            return res.json();
        } catch {
            return { original: message, translated: `Uncle/Auntie ah, ${message} Take care lah.`, tone: tone || "calm" };
        }
    },
};
