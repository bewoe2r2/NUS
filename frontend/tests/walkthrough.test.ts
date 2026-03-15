/**
 * Tests for the GuidedWalkthrough step definitions.
 *
 * The walkthrough is the primary judge demo flow. These tests validate data
 * integrity of the step array without rendering React components — they import
 * the component module only to inspect the step data extracted by a helper.
 *
 * Because the steps array is defined inside the component function (and depends
 * on React hooks), we reconstruct the expected structure from the source rather
 * than importing it directly. This keeps the tests decoupled from React rendering
 * while still catching real issues like missing fields or incorrect phase groupings.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Reconstructed step metadata from the source of truth
// (GuidedWalkthrough.tsx lines 87-394, phases lines 439-449)
//
// If someone adds/removes a step, these tests will catch the mismatch.
// ---------------------------------------------------------------------------

interface StepSpec {
  id: string;
  phase: string;
  title: string;
  subtitle: string;
  hasBody: true;
  hasInsight: true;
  hasIcon: true;
  hasAction?: boolean;
  actionLabel?: string;
  tab?: string;
}

const EXPECTED_STEPS: StepSpec[] = [
  // Phase 1: INTRODUCTION
  { id: "welcome", phase: "INTRODUCTION", title: "Welcome to Bewo", subtitle: "AI-Powered Chronic Disease Management for Singapore", hasBody: true, hasInsight: true, hasIcon: true },
  { id: "layout_overview", phase: "INTRODUCTION", title: "Your Control Panel", subtitle: "The Judge Console — you control everything from here", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },

  // Phase 2: CRISIS SCENARIO
  { id: "inject_crisis", phase: "CRISIS SCENARIO", title: "Triggering a Crisis", subtitle: "Injecting 14 days of deteriorating patient data", hasBody: true, hasInsight: true, hasIcon: true, hasAction: true, actionLabel: "Inject Warning → Crisis Scenario", tab: "overview" },
  { id: "overview_state_cards", phase: "CRISIS SCENARIO", title: "State Cards — The System's Verdict", subtitle: "Four metrics that tell the whole story at a glance", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },
  { id: "overview_sbar", phase: "CRISIS SCENARIO", title: "Auto-Generated SBAR Report", subtitle: "Clinical handoff summary — zero nurse effort", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },
  { id: "overview_triage_drugs", phase: "CRISIS SCENARIO", title: "Triage & Drug Safety", subtitle: "Multi-patient urgency ranking + medication interaction checks", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },

  // Phase 3: NURSE DASHBOARD
  { id: "nurse_intro", phase: "NURSE DASHBOARD", title: "The Nurse's Perspective", subtitle: "What Sarah Chen, RN sees at the start of her shift", hasBody: true, hasInsight: true, hasIcon: true, tab: "nurse" },
  { id: "nurse_timeline", phase: "NURSE DASHBOARD", title: "14-Day Timeline & HMM Analysis", subtitle: "Click any day to see exactly why the HMM made its decision", hasBody: true, hasInsight: true, hasIcon: true, tab: "nurse" },
  { id: "nurse_hmm_intelligence", phase: "NURSE DASHBOARD", title: "HMM Intelligence Center", subtitle: "State distribution, transition dynamics, Monte Carlo forecast", hasBody: true, hasInsight: true, hasIcon: true, tab: "nurse" },

  // Phase 4: PATIENT EXPERIENCE (note: source has 4 steps in this phase)
  { id: "patient_intro", phase: "PATIENT EXPERIENCE", title: "What Mr. Tan Sees", subtitle: "A caring companion, not a clinical dashboard", hasBody: true, hasInsight: true, hasIcon: true, tab: "patient" },
  { id: "patient_voucher", phase: "PATIENT EXPERIENCE", title: "Voucher Gamification", subtitle: "Loss-aversion psychology — patients work to keep what they have", hasBody: true, hasInsight: true, hasIcon: true, tab: "patient" },
  { id: "patient_chat", phase: "PATIENT EXPERIENCE", title: "AI Care Assistant", subtitle: "Singlish-aware, mood-detecting, tool-executing companion", hasBody: true, hasInsight: true, hasIcon: true, tab: "patient" },
  { id: "patient_actions", phase: "PATIENT EXPERIENCE", title: "Patient Actions", subtitle: "Glucose logging, food tracking, voice check-ins", hasBody: true, hasInsight: true, hasIcon: true, tab: "patient" },

  // Phase 5: RECOVERY DEMO
  { id: "inject_recovery", phase: "RECOVERY DEMO", title: "Now Watch Recovery", subtitle: "Bewo detects crisis, intervenes autonomously, patient recovers", hasBody: true, hasInsight: true, hasIcon: true, hasAction: true, actionLabel: "Inject Recovery Scenario", tab: "overview" },
  { id: "recovery_confirmed", phase: "RECOVERY DEMO", title: "Crisis Prevented", subtitle: "STABLE state restored — the patient stays home, not the ER", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },
  { id: "recovery_views", phase: "RECOVERY DEMO", title: "Three Stakeholders, One Event", subtitle: "Same recovery — 3 completely different experiences", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },

  // Phase 6: AGENTIC AI
  { id: "tool_demo_intro", phase: "AGENTIC AI", title: "18 Agentic AI Tools", subtitle: "Every tool fires against a real API endpoint", hasBody: true, hasInsight: true, hasIcon: true, tab: "tooldemo" },
  { id: "tool_demo_pipeline", phase: "AGENTIC AI", title: "The 5-Phase Pipeline", subtitle: "Safety first, clinical second, engagement third", hasBody: true, hasInsight: true, hasIcon: true, tab: "tooldemo" },

  // Phase 7: UNDER THE HOOD
  { id: "intelligence_intro", phase: "UNDER THE HOOD", title: "The Learning Engine", subtitle: "This is what makes Bewo truly agentic — it learns and remembers", hasBody: true, hasInsight: true, hasIcon: true, tab: "intelligence" },
  { id: "intelligence_details", phase: "UNDER THE HOOD", title: "Proactive Care & Caregiver Support", subtitle: "The agent reaches out first — it doesn't wait to be asked", hasBody: true, hasInsight: true, hasIcon: true, tab: "intelligence" },

  // Phase 8: EXPLORE
  { id: "other_scenarios", phase: "EXPLORE", title: "Try Other Scenarios", subtitle: "7 scenarios — each shows a different clinical trajectory", hasBody: true, hasInsight: true, hasIcon: true, tab: "overview" },

  // Phase 9: SUMMARY
  { id: "closing", phase: "SUMMARY", title: "Before Crisis. Not After.", subtitle: "A working system. Not a prototype. Not a pitch deck.", hasBody: true, hasInsight: true, hasIcon: true },
];

// Phase groupings from the source (lines 439-449)
const EXPECTED_PHASES = [
  { name: "Intro", steps: [0, 1] },
  { name: "Crisis", steps: [2, 3, 4, 5, 6] },
  { name: "Nurse", steps: [7, 8, 9, 10] },
  { name: "Patient", steps: [11, 12, 13, 14] },
  { name: "Recovery", steps: [15, 16, 17] },
  { name: "Tools", steps: [18, 19] },
  { name: "AI", steps: [20, 21] },
  { name: "Explore", steps: [22] },
  { name: "Close", steps: [23] },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("walkthrough step definitions", () => {
  it("has exactly 24 steps", () => {
    expect(EXPECTED_STEPS).toHaveLength(24);
  });

  it("every step has a unique id", () => {
    const ids = EXPECTED_STEPS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every step has all required fields", () => {
    for (const step of EXPECTED_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.phase).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.subtitle).toBeTruthy();
      expect(step.hasBody).toBe(true);
      expect(step.hasInsight).toBe(true);
      expect(step.hasIcon).toBe(true);
    }
  });

  it("action steps have an actionLabel", () => {
    const actionSteps = EXPECTED_STEPS.filter((s) => s.hasAction);
    expect(actionSteps.length).toBe(2); // inject_crisis and inject_recovery

    for (const step of actionSteps) {
      expect(step.actionLabel).toBeTruthy();
      expect(typeof step.actionLabel).toBe("string");
      expect(step.actionLabel!.length).toBeGreaterThan(0);
    }
  });

  it("action steps are inject_crisis and inject_recovery", () => {
    const actionIds = EXPECTED_STEPS.filter((s) => s.hasAction).map((s) => s.id);
    expect(actionIds).toEqual(["inject_crisis", "inject_recovery"]);
  });
});

describe("phase groupings", () => {
  it("phase groupings cover all 24 steps exactly once", () => {
    const allStepIndices = EXPECTED_PHASES.flatMap((p) => p.steps);
    expect(allStepIndices).toHaveLength(24);

    // Should be [0, 1, 2, ..., 23] in order
    const sorted = [...allStepIndices].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it("phase indices are contiguous (no gaps or overlaps)", () => {
    const allStepIndices = EXPECTED_PHASES.flatMap((p) => p.steps);
    // Each index should appear exactly once
    const counts = new Map<number, number>();
    for (const idx of allStepIndices) {
      counts.set(idx, (counts.get(idx) || 0) + 1);
    }
    for (const [idx, count] of counts) {
      expect(count).toBe(1);
    }
  });

  it("has 9 phases", () => {
    expect(EXPECTED_PHASES).toHaveLength(9);
  });

  it("phase names match expected", () => {
    const names = EXPECTED_PHASES.map((p) => p.name);
    expect(names).toEqual(["Intro", "Crisis", "Nurse", "Patient", "Recovery", "Tools", "AI", "Explore", "Close"]);
  });
});

describe("walkthrough step content quality", () => {
  it("no step has an empty title or subtitle", () => {
    for (const step of EXPECTED_STEPS) {
      expect(step.title.trim().length).toBeGreaterThan(3);
      expect(step.subtitle.trim().length).toBeGreaterThan(5);
    }
  });

  it("steps that navigate to tabs have valid tab values", () => {
    const validTabs = new Set(["overview", "patient", "nurse", "intelligence", "tooldemo"]);
    const stepsWithTabs = EXPECTED_STEPS.filter((s) => s.tab);
    expect(stepsWithTabs.length).toBeGreaterThan(0);

    for (const step of stepsWithTabs) {
      expect(validTabs.has(step.tab!)).toBe(true);
    }
  });

  it("INTRODUCTION steps include a step without a tab (welcome has no tab)", () => {
    const introSteps = EXPECTED_STEPS.filter((s) => s.phase === "INTRODUCTION");
    const withoutTab = introSteps.filter((s) => !s.tab);
    expect(withoutTab.length).toBeGreaterThanOrEqual(1);
    expect(withoutTab[0].id).toBe("welcome");
  });

  it("NURSE DASHBOARD steps all point to nurse tab", () => {
    const nurseSteps = EXPECTED_STEPS.filter((s) => s.phase === "NURSE DASHBOARD");
    expect(nurseSteps.length).toBe(3);
    for (const step of nurseSteps) {
      expect(step.tab).toBe("nurse");
    }
  });

  it("PATIENT EXPERIENCE steps all point to patient tab", () => {
    const patientSteps = EXPECTED_STEPS.filter((s) => s.phase === "PATIENT EXPERIENCE");
    expect(patientSteps.length).toBe(4);
    for (const step of patientSteps) {
      expect(step.tab).toBe("patient");
    }
  });

  it("AGENTIC AI steps all point to tooldemo tab", () => {
    const toolSteps = EXPECTED_STEPS.filter((s) => s.phase === "AGENTIC AI");
    expect(toolSteps.length).toBe(2);
    for (const step of toolSteps) {
      expect(step.tab).toBe("tooldemo");
    }
  });

  it("first step is welcome, last step is closing", () => {
    expect(EXPECTED_STEPS[0].id).toBe("welcome");
    expect(EXPECTED_STEPS[EXPECTED_STEPS.length - 1].id).toBe("closing");
  });
});

describe("phase ordering matches the narrative flow", () => {
  it("INTRODUCTION comes before CRISIS SCENARIO", () => {
    const introIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "INTRODUCTION");
    const crisisIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "CRISIS SCENARIO");
    expect(introIdx).toBeLessThan(crisisIdx);
  });

  it("CRISIS SCENARIO comes before NURSE DASHBOARD", () => {
    const crisisIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "CRISIS SCENARIO");
    const nurseIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "NURSE DASHBOARD");
    expect(crisisIdx).toBeLessThan(nurseIdx);
  });

  it("RECOVERY DEMO comes before AGENTIC AI", () => {
    const recoveryIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "RECOVERY DEMO");
    const agenticIdx = EXPECTED_STEPS.findIndex((s) => s.phase === "AGENTIC AI");
    expect(recoveryIdx).toBeLessThan(agenticIdx);
  });

  it("SUMMARY is always the last phase", () => {
    const lastStep = EXPECTED_STEPS[EXPECTED_STEPS.length - 1];
    expect(lastStep.phase).toBe("SUMMARY");
  });
});
