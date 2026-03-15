import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

function mockFetchSuccess(body: any, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockFetchFailure(status = 500) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ detail: "server error" }),
  } as Response);
}

function mockFetchNetworkError() {
  globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
}

function lastFetchCall() {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
}

function lastFetchUrl(): string {
  return lastFetchCall()[0];
}

function lastFetchOptions(): RequestInit {
  return lastFetchCall()[1] ?? {};
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// 1. API surface — every public method exists and is callable
// ---------------------------------------------------------------------------

describe("api surface", () => {
  const expectedMethods = [
    "getPatientState",
    "getPatientHistory",
    "getPatientAnalysis",
    "getAnalysisDetail",
    "chatWithAgent",
    "getMedications",
    "logMedication",
    "logGlucose",
    "logFood",
    "getVoucher",
    "getVoucherQR",
    "extractGlucoseFromPhoto",
    "getNurseAlerts",
    "getNursePatients",
    "getNurseTriage",
    "getNurseTriageSingle",
    "getClinicianSummary",
    "getImpactMetrics",
    "getInterventionEffectiveness",
    "getDrugInteractions",
    "checkDrugInteraction",
    "getAgentMemory",
    "getAgentActions",
    "getToolEffectiveness",
    "getSafetyLog",
    "getStreaks",
    "getEngagement",
    "getWeeklyReport",
    "getGlucoseNarrative",
    "getCaregiverFatigue",
    "getProactiveHistory",
    "runCounterfactual",
    "voiceCheckin",
    "getReminders",
    "dismissReminder",
    "getCaregiverDashboard",
    "getCaregiverBurden",
    "trainHMM",
    "getHMMParams",
    "runProactiveScan",
    "resetData",
    "injectScenario",
    "runHMM",
  ];

  it("exports all expected methods", () => {
    for (const name of expectedMethods) {
      expect(api).toHaveProperty(name);
      expect(typeof (api as any)[name]).toBe("function");
    }
  });

  it("does not have unexpected extra methods (guards against silent API drift)", () => {
    const actualKeys = Object.keys(api).sort();
    const expectedKeys = [...expectedMethods].sort();
    expect(actualKeys).toEqual(expectedKeys);
  });
});

// ---------------------------------------------------------------------------
// 2. URL construction — every endpoint hits the right path
// ---------------------------------------------------------------------------

describe("URL construction", () => {
  it("getPatientState builds /patient/:id/state", async () => {
    mockFetchSuccess({ current_state: "STABLE", risk_score: 0.1, biometrics: {}, last_updated: "" });
    await api.getPatientState("P042");
    expect(lastFetchUrl()).toBe("http://localhost:8000/patient/P042/state");
  });

  it("getPatientHistory builds /patient/:id/history", async () => {
    mockFetchSuccess({ history: [] });
    await api.getPatientHistory("P042");
    expect(lastFetchUrl()).toBe("http://localhost:8000/patient/P042/history");
  });

  it("getPatientAnalysis builds /patient/:id/analysis/14days", async () => {
    mockFetchSuccess({ history: [] });
    await api.getPatientAnalysis("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/patient/P001/analysis/14days");
  });

  it("getAnalysisDetail builds /patient/:id/analysis/detail?date=...", async () => {
    mockFetchSuccess({});
    await api.getAnalysisDetail("P001", "2026-03-14");
    expect(lastFetchUrl()).toBe("http://localhost:8000/patient/P001/analysis/detail?date=2026-03-14");
  });

  it("chatWithAgent POSTs to /chat with correct body", async () => {
    mockFetchSuccess({ message: "hi", tone: "neutral" });
    await api.chatWithAgent("Hello", "P007");
    expect(lastFetchUrl()).toBe("http://localhost:8000/chat");
    expect(lastFetchOptions().method).toBe("POST");
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body).toEqual({ message: "Hello", patient_id: "P007" });
  });

  it("chatWithAgent defaults patientId to P001", async () => {
    mockFetchSuccess({ message: "hi", tone: "neutral" });
    await api.chatWithAgent("Hello");
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body.patient_id).toBe("P001");
  });

  it("getMedications builds /medications/:id", async () => {
    mockFetchSuccess({ medications: [] });
    await api.getMedications("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/medications/P001");
  });

  it("logMedication POSTs to /medications/log", async () => {
    mockFetchSuccess({ ok: true });
    await api.logMedication("Metformin", true);
    expect(lastFetchUrl()).toBe("http://localhost:8000/medications/log");
    expect(lastFetchOptions().method).toBe("POST");
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body).toEqual({ medication_name: "Metformin", taken: true, patient_id: "P001" });
  });

  it("logGlucose POSTs to /glucose/log with correct payload", async () => {
    mockFetchSuccess({ ok: true });
    await api.logGlucose(7.2, "mg/dL");
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body).toEqual({ value: 7.2, unit: "mg/dL", source: "MANUAL", patient_id: "P001" });
  });

  it("logGlucose defaults unit to mmol/L", async () => {
    mockFetchSuccess({ ok: true });
    await api.logGlucose(5.5);
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body.unit).toBe("mmol/L");
  });

  it("getVoucher builds /voucher/:id", async () => {
    mockFetchSuccess({ current_value: 5, max_value: 5, days_until_redemption: 3, can_redeem: false, streak_days: 5 });
    await api.getVoucher("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/voucher/P001");
  });

  it("getVoucherQR builds /voucher/:id/qr", async () => {
    mockFetchSuccess({ qr_code: "abc", value: 5 });
    await api.getVoucherQR("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/voucher/P001/qr");
  });

  it("getNurseAlerts builds /nurse/alerts", async () => {
    mockFetchSuccess({ nurse_alerts: [] });
    await api.getNurseAlerts();
    expect(lastFetchUrl()).toBe("http://localhost:8000/nurse/alerts");
  });

  it("getNursePatients builds /nurse/patients", async () => {
    mockFetchSuccess({ patients: [] });
    await api.getNursePatients();
    expect(lastFetchUrl()).toBe("http://localhost:8000/nurse/patients");
  });

  it("getNurseTriage builds /nurse/triage", async () => {
    mockFetchSuccess({ patients: [], generated_at: "" });
    await api.getNurseTriage();
    expect(lastFetchUrl()).toBe("http://localhost:8000/nurse/triage");
  });

  it("getNurseTriageSingle builds /nurse/triage/:id", async () => {
    mockFetchSuccess({});
    await api.getNurseTriageSingle("P003");
    expect(lastFetchUrl()).toBe("http://localhost:8000/nurse/triage/P003");
  });

  it("getDrugInteractions builds /patient/:id/drug-interactions", async () => {
    mockFetchSuccess({ interactions_found: 0, interactions: [] });
    await api.getDrugInteractions("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/patient/P001/drug-interactions");
  });

  it("checkDrugInteraction URL-encodes the proposed medication", async () => {
    mockFetchSuccess({ interactions_found: 0, interactions: [] });
    await api.checkDrugInteraction("P001", "Aspirin 100mg");
    expect(lastFetchUrl()).toBe(
      "http://localhost:8000/patient/P001/drug-interactions/check?proposed_medication=Aspirin%20100mg"
    );
    expect(lastFetchOptions().method).toBe("POST");
  });

  it("injectScenario builds correct URL with query params", async () => {
    mockFetchSuccess({ ok: true });
    await api.injectScenario("recovery", 7);
    expect(lastFetchUrl()).toBe("http://localhost:8000/admin/inject-scenario?scenario=recovery&days=7");
    expect(lastFetchOptions().method).toBe("POST");
  });

  it("runProactiveScan with ID targets /agent/proactive-scan/:id", async () => {
    mockFetchSuccess({});
    await api.runProactiveScan("P001");
    expect(lastFetchUrl()).toBe("http://localhost:8000/agent/proactive-scan/P001");
  });

  it("runProactiveScan without ID targets /agent/proactive-scan", async () => {
    mockFetchSuccess({});
    await api.runProactiveScan();
    expect(lastFetchUrl()).toBe("http://localhost:8000/agent/proactive-scan");
  });

  it("dismissReminder POSTs to /reminders/:patientId/dismiss/:reminderId", async () => {
    mockFetchSuccess({ ok: true });
    await api.dismissReminder("P001", 42);
    expect(lastFetchUrl()).toBe("http://localhost:8000/reminders/P001/dismiss/42");
    expect(lastFetchOptions().method).toBe("POST");
  });

  it("voiceCheckin POSTs to /voice/checkin", async () => {
    mockFetchSuccess({ sentiment_score: 0.8, urgency: "low", health_keywords: [], ai_response: "ok" });
    await api.voiceCheckin("I feel fine", "P002");
    const body = JSON.parse(lastFetchOptions().body as string);
    expect(body).toEqual({ transcript: "I feel fine", patient_id: "P002" });
  });
});

// ---------------------------------------------------------------------------
// 3. Auth header — every request includes X-API-Key
// ---------------------------------------------------------------------------

describe("authentication", () => {
  it("includes X-API-Key header on GET requests", async () => {
    mockFetchSuccess({ current_state: "STABLE", risk_score: 0.1, biometrics: {}, last_updated: "" });
    await api.getPatientState("P001");
    const headers = lastFetchOptions().headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBeDefined();
    expect(headers["X-API-Key"].length).toBeGreaterThan(0);
  });

  it("includes X-API-Key header on POST requests", async () => {
    mockFetchSuccess({ message: "ok", tone: "neutral" });
    await api.chatWithAgent("Hello");
    const headers = lastFetchOptions().headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBeDefined();
  });

  it("preserves Content-Type when merging auth headers", async () => {
    mockFetchSuccess({ ok: true });
    await api.logGlucose(5.5);
    const headers = lastFetchOptions().headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["X-API-Key"]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Error handling — methods that throw vs methods that return defaults
// ---------------------------------------------------------------------------

describe("error handling — throwing methods", () => {
  const throwingMethods: Array<{ name: string; call: () => Promise<any> }> = [
    { name: "getPatientState", call: () => api.getPatientState("P001") },
    { name: "getPatientHistory", call: () => api.getPatientHistory("P001") },
    { name: "getPatientAnalysis", call: () => api.getPatientAnalysis("P001") },
    { name: "getAnalysisDetail", call: () => api.getAnalysisDetail("P001", "2026-01-01") },
    { name: "chatWithAgent", call: () => api.chatWithAgent("hi") },
    { name: "getVoucherQR", call: () => api.getVoucherQR("P001") },
    { name: "voiceCheckin", call: () => api.voiceCheckin("hi") },
    { name: "dismissReminder", call: () => api.dismissReminder("P001", 1) },
  ];

  for (const { name, call } of throwingMethods) {
    it(`${name} throws on non-ok response`, async () => {
      mockFetchFailure(500);
      await expect(call()).rejects.toThrow();
    });
  }
});

describe("error handling — graceful-default methods", () => {
  it("getVoucher returns fallback on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getVoucher("P001");
    expect(result).toEqual({
      current_value: 5.0,
      max_value: 5.0,
      days_until_redemption: 7,
      can_redeem: false,
      streak_days: 0,
    });
  });

  it("getNurseAlerts returns [] on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getNurseAlerts();
    expect(result).toEqual([]);
  });

  it("getNursePatients returns [] on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getNursePatients();
    expect(result).toEqual([]);
  });

  it("getNurseTriage returns default object on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getNurseTriage();
    expect(result).toEqual({ patients: [], generated_at: "" });
  });

  it("getNurseTriageSingle returns null on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getNurseTriageSingle("P001");
    expect(result).toBeNull();
  });

  it("getClinicianSummary returns null on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getClinicianSummary("P001");
    expect(result).toBeNull();
  });

  it("getDrugInteractions returns empty result on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getDrugInteractions("P001");
    expect(result).toEqual({ interactions_found: 0, interactions: [] });
  });

  it("getAgentMemory returns [] on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getAgentMemory("P001");
    expect(result).toEqual([]);
  });

  it("getToolEffectiveness returns {} on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getToolEffectiveness("P001");
    expect(result).toEqual({});
  });

  it("getSafetyLog returns [] on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getSafetyLog("P001");
    expect(result).toEqual([]);
  });

  it("getStreaks returns default on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getStreaks("P001");
    expect(result).toEqual({ streaks: {} });
  });

  it("getEngagement returns default on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getEngagement("P001");
    expect(result).toEqual({ score: 0 });
  });

  it("getProactiveHistory returns [] on failure", async () => {
    mockFetchFailure(500);
    const result = await api.getProactiveHistory("P001");
    expect(result).toEqual([]);
  });

  it("runCounterfactual returns null on failure", async () => {
    mockFetchFailure(500);
    const result = await api.runCounterfactual("P001");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Response parsing — methods that unwrap nested data
// ---------------------------------------------------------------------------

describe("response parsing", () => {
  it("getMedications extracts .medications array from response", async () => {
    mockFetchSuccess({ medications: [{ name: "Metformin", dose: "500mg" }] });
    const result = await api.getMedications("P001");
    expect(result).toEqual([{ name: "Metformin", dose: "500mg" }]);
  });

  it("getMedications returns [] when .medications is missing", async () => {
    mockFetchSuccess({});
    const result = await api.getMedications("P001");
    expect(result).toEqual([]);
  });

  it("getAgentMemory extracts .memories from response", async () => {
    mockFetchSuccess({ memories: [{ type: "episodic", content: "took meds" }] });
    const result = await api.getAgentMemory("P001");
    expect(result).toEqual([{ type: "episodic", content: "took meds" }]);
  });

  it("getAgentActions extracts .actions from response", async () => {
    mockFetchSuccess({ actions: [{ tool: "remind", result: "sent" }] });
    const result = await api.getAgentActions("P001");
    expect(result).toEqual([{ tool: "remind", result: "sent" }]);
  });

  it("getToolEffectiveness extracts .effectiveness from response", async () => {
    mockFetchSuccess({ effectiveness: { remind: 0.85 } });
    const result = await api.getToolEffectiveness("P001");
    expect(result).toEqual({ remind: 0.85 });
  });

  it("getSafetyLog extracts .safety_events from response", async () => {
    mockFetchSuccess({ safety_events: [{ type: "flag", message: "caution" }] });
    const result = await api.getSafetyLog("P001");
    expect(result).toEqual([{ type: "flag", message: "caution" }]);
  });

  it("getImpactMetrics falls back to full response if .metrics is missing", async () => {
    const payload = { some_metric: 42 };
    mockFetchSuccess(payload);
    const result = await api.getImpactMetrics("P001");
    expect(result).toEqual(payload);
  });

  it("getImpactMetrics extracts .metrics when present", async () => {
    mockFetchSuccess({ metrics: { saved: 100 } });
    const result = await api.getImpactMetrics("P001");
    expect(result).toEqual({ saved: 100 });
  });

  it("getReminders extracts .reminders from response", async () => {
    mockFetchSuccess({ reminders: [{ id: 1, text: "Take meds" }] });
    const result = await api.getReminders("P001");
    expect(result).toEqual([{ id: 1, text: "Take meds" }]);
  });

  it("getProactiveHistory extracts .history from response", async () => {
    mockFetchSuccess({ history: [{ trigger: "missed_med" }] });
    const result = await api.getProactiveHistory("P001");
    expect(result).toEqual([{ trigger: "missed_med" }]);
  });
});

// ---------------------------------------------------------------------------
// 6. Network errors (fetch itself rejects)
// ---------------------------------------------------------------------------

describe("network errors", () => {
  it("getPatientState propagates network error", async () => {
    mockFetchNetworkError();
    await expect(api.getPatientState("P001")).rejects.toThrow("Failed to fetch");
  });

  it("graceful methods also throw on network-level failure (fetch rejection)", async () => {
    // Even graceful-default methods cannot catch a fetch rejection because the
    // error happens before .ok is checked
    mockFetchNetworkError();
    await expect(api.getNurseAlerts()).rejects.toThrow("Failed to fetch");
  });
});
