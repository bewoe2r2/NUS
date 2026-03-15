import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mock framer-motion — replace motion components with plain HTML so we can
// test without animation runtime
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...props }: any, ref: React.Ref<HTMLDivElement>) => {
        // Filter out framer-motion-specific props that cause React warnings
        const {
          initial, animate, exit, transition, whileHover, whileTap, whileFocus,
          whileDrag, whileInView, variants, layout, layoutId, onAnimationStart,
          onAnimationComplete, onUpdate, drag, dragConstraints, dragElastic,
          dragMomentum, dragTransition, dragControls, dragListener, dragSnapToOrigin,
          ...htmlProps
        } = props;
        return <div ref={ref} {...htmlProps}>{children}</div>;
      }
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons with simple spans
// ---------------------------------------------------------------------------

vi.mock("lucide-react", () =>
  new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === "string" && prop !== "__esModule") {
          return (props: any) => <span data-testid={`icon-${prop}`} />;
        }
        return undefined;
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Mock @/lib/utils (cn)
// ---------------------------------------------------------------------------

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

function mockFetchForVoucher(data: any) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockFetchFailure() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ detail: "error" }),
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ═══════════════════════════════════════════════════════════════════════════
// DailyInsightCard
// ═══════════════════════════════════════════════════════════════════════════

describe("DailyInsightCard", () => {
  // Lazy import so mocks are set up first
  async function importCard() {
    return (await import("@/components/patient/home/DailyInsightCard")).DailyInsightCard;
  }

  it("renders STABLE state with correct greeting and message", async () => {
    const Card = await importCard();
    render(<Card state="STABLE" riskScore={0.15} lastUpdated="2026-03-15" />);

    expect(screen.getByText("You are doing well")).toBeInTheDocument();
    expect(
      screen.getByText(/Your biomarkers indicate a stable metabolic state/)
    ).toBeInTheDocument();
  });

  it("renders WARNING state with caution message", async () => {
    const Card = await importCard();
    render(<Card state="WARNING" riskScore={0.55} lastUpdated="2026-03-15" />);

    expect(screen.getByText("Caution Advised")).toBeInTheDocument();
    expect(
      screen.getByText(/drift in your physiological patterns/)
    ).toBeInTheDocument();
  });

  it("renders CRISIS state with action required message", async () => {
    const Card = await importCard();
    render(<Card state="CRISIS" riskScore={0.92} lastUpdated="2026-03-15" />);

    expect(screen.getByText("Action Required")).toBeInTheDocument();
    expect(
      screen.getByText(/critically high/)
    ).toBeInTheDocument();
  });

  it("displays the risk score as a percentage", async () => {
    const Card = await importCard();
    render(<Card state="STABLE" riskScore={0.42} lastUpdated="2026-03-15" />);

    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("displays the risk score rounded correctly", async () => {
    const Card = await importCard();
    render(<Card state="WARNING" riskScore={0.678} lastUpdated="2026-03-15" />);

    expect(screen.getByText("68%")).toBeInTheDocument();
  });

  it("shows the state badge", async () => {
    const Card = await importCard();
    render(<Card state="CRISIS" riskScore={0.95} lastUpdated="2026-03-15" />);

    expect(screen.getByText("CRISIS")).toBeInTheDocument();
  });

  it("shows correct trend text for IMPROVING", async () => {
    const Card = await importCard();
    render(<Card state="STABLE" riskScore={0.1} lastUpdated="2026-03-15" trend="IMPROVING" />);

    expect(screen.getByText("improving")).toBeInTheDocument();
  });

  it("shows correct trend text for DECLINING", async () => {
    const Card = await importCard();
    render(<Card state="WARNING" riskScore={0.5} lastUpdated="2026-03-15" trend="DECLINING" />);

    expect(screen.getByText("declining")).toBeInTheDocument();
  });

  it("defaults trend to STABLE", async () => {
    const Card = await importCard();
    render(<Card state="STABLE" riskScore={0.1} lastUpdated="2026-03-15" />);

    expect(screen.getByText("stable")).toBeInTheDocument();
  });

  it("shows correct volatility for each state", async () => {
    const Card = await importCard();

    const { unmount: u1 } = render(<Card state="STABLE" riskScore={0.1} lastUpdated="" />);
    expect(screen.getByText("Low")).toBeInTheDocument();
    u1();

    const { unmount: u2 } = render(<Card state="WARNING" riskScore={0.5} lastUpdated="" />);
    expect(screen.getByText("Moderate")).toBeInTheDocument();
    u2();

    render(<Card state="CRISIS" riskScore={0.9} lastUpdated="" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows consistency message for STABLE state", async () => {
    const Card = await importCard();
    render(<Card state="STABLE" riskScore={0.1} lastUpdated="" />);

    expect(screen.getByText(/Consistency is key/)).toBeInTheDocument();
  });

  it("shows adjustment message for non-STABLE states", async () => {
    const Card = await importCard();
    render(<Card state="CRISIS" riskScore={0.9} lastUpdated="" />);

    expect(screen.getByText(/Small adjustments now/)).toBeInTheDocument();
  });

  it("handles unknown state with fallback config", async () => {
    const Card = await importCard();
    render(<Card state="UNKNOWN_STATE" riskScore={0} lastUpdated="" />);

    expect(screen.getByText("Health Monitor")).toBeInTheDocument();
    expect(screen.getByText(/Gathering data for analysis/)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VoucherCard
// ═══════════════════════════════════════════════════════════════════════════

describe("VoucherCard", () => {
  async function importCard() {
    // Need to reset module cache between tests since the component has internal state
    vi.resetModules();
    // Re-apply mocks after module reset
    vi.doMock("framer-motion", () => ({
      motion: {
        div: React.forwardRef(
          ({ children, ...props }: any, ref: React.Ref<HTMLDivElement>) => {
            const {
              initial, animate, exit, transition, whileHover, whileTap, whileFocus,
              whileDrag, whileInView, variants, layout, layoutId, onAnimationStart,
              onAnimationComplete, onUpdate, drag, dragConstraints, dragElastic,
              dragMomentum, dragTransition, dragControls, dragListener, dragSnapToOrigin,
              ...htmlProps
            } = props;
            return <div ref={ref} {...htmlProps}>{children}</div>;
          }
        ),
      },
      AnimatePresence: ({ children }: any) => <>{children}</>,
    }));
    vi.doMock("lucide-react", () =>
      new Proxy(
        {},
        {
          get: (_target, prop) => {
            if (typeof prop === "string" && prop !== "__esModule") {
              return (props: any) => <span data-testid={`icon-${prop}`} />;
            }
            return undefined;
          },
        }
      )
    );
    vi.doMock("@/lib/utils", () => ({
      cn: (...args: any[]) => args.filter(Boolean).join(" "),
    }));
    return (await import("@/components/patient/rewards/VoucherCard")).VoucherCard;
  }

  it("renders the voucher value formatted as currency", async () => {
    mockFetchForVoucher({ current_value: 4.5, max_value: 5, days_until_redemption: 3, can_redeem: false, streak_days: 7 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText("$4.50")).toBeInTheDocument();
    });
  });

  it("shows streak days", async () => {
    mockFetchForVoucher({ current_value: 5, max_value: 5, days_until_redemption: 1, can_redeem: false, streak_days: 12 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText(/12 Day Streak/)).toBeInTheDocument();
    });
  });

  it("shows days until redemption when cannot redeem", async () => {
    mockFetchForVoucher({ current_value: 5, max_value: 5, days_until_redemption: 4, can_redeem: false, streak_days: 3 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText("4 days until Sunday")).toBeInTheDocument();
    });
  });

  it("shows 'Ready to redeem!' when can_redeem is true", async () => {
    mockFetchForVoucher({ current_value: 5, max_value: 5, days_until_redemption: 0, can_redeem: true, streak_days: 7 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText("Ready to redeem!")).toBeInTheDocument();
    });
  });

  it("shows Redeem button when can_redeem is true", async () => {
    mockFetchForVoucher({ current_value: 5, max_value: 5, days_until_redemption: 0, can_redeem: true, streak_days: 7 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText("Redeem")).toBeInTheDocument();
    });
  });

  it("shows Locked button when can_redeem is false", async () => {
    mockFetchForVoucher({ current_value: 3, max_value: 5, days_until_redemption: 5, can_redeem: false, streak_days: 2 });
    const Card = await importCard();
    render(<Card />);

    await waitFor(() => {
      expect(screen.getByText("Locked")).toBeInTheDocument();
    });
  });

  it("renders nothing while loading", async () => {
    // Deliberately make fetch hang to test loading state
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const Card = await importCard();
    const { container } = render(<Card />);

    // Component returns null while loading
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing if fetch fails", async () => {
    // VoucherCard catches the error and sets loading=false but voucher stays null
    // The api.getVoucher returns a default on !res.ok, so we need a network error
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network"));
    const Card = await importCard();
    const { container } = render(<Card />);

    await waitFor(() => {
      // After error, component renders null (voucher is null)
      expect(container.innerHTML).toBe("");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PatientHeader
// ═══════════════════════════════════════════════════════════════════════════

describe("PatientHeader", () => {
  async function importHeader() {
    return (await import("@/components/nurse/PatientHeader")).PatientHeader;
  }

  it("renders patient name", async () => {
    const Header = await importHeader();
    render(<Header name="Mdm Lee" age={72} patientId="P002" status="STABLE" />);

    expect(screen.getByText("Mdm Lee")).toBeInTheDocument();
  });

  it("renders default patient name when no props given", async () => {
    const Header = await importHeader();
    render(<Header />);

    expect(screen.getByText("Tan Ah Kow")).toBeInTheDocument();
  });

  it("renders patient ID", async () => {
    const Header = await importHeader();
    render(<Header patientId="P042" />);

    expect(screen.getByText("ID: P042")).toBeInTheDocument();
  });

  it("renders age", async () => {
    const Header = await importHeader();
    render(<Header age={72} />);

    expect(screen.getByText("72 Y.O. Male")).toBeInTheDocument();
  });

  it("renders the status badge with STABLE", async () => {
    const Header = await importHeader();
    render(<Header status="STABLE" />);

    expect(screen.getByText("STABLE")).toBeInTheDocument();
  });

  it("renders the status badge with WARNING", async () => {
    const Header = await importHeader();
    render(<Header status="WARNING" />);

    expect(screen.getByText("WARNING")).toBeInTheDocument();
  });

  it("renders the status badge with CRISIS", async () => {
    const Header = await importHeader();
    render(<Header status="CRISIS" />);

    expect(screen.getByText("CRISIS")).toBeInTheDocument();
  });

  it("shows notification dot only in CRISIS state", async () => {
    const Header = await importHeader();
    const { container: crisisContainer } = render(<Header status="CRISIS" />);

    // In CRISIS, there should be a small red dot (span with bg-rose-500)
    const dots = crisisContainer.querySelectorAll(".bg-rose-500");
    expect(dots.length).toBe(1);
  });

  it("does not show notification dot in STABLE state", async () => {
    const Header = await importHeader();
    const { container } = render(<Header status="STABLE" />);

    const dots = container.querySelectorAll(".bg-rose-500");
    expect(dots.length).toBe(0);
  });

  it("renders search input", async () => {
    const Header = await importHeader();
    render(<Header />);

    expect(screen.getByPlaceholderText("Search records...")).toBeInTheDocument();
  });

  it("always shows Type 2 Diabetes label", async () => {
    const Header = await importHeader();
    render(<Header />);

    expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
  });

  it("renders the status badge with UNKNOWN", async () => {
    const Header = await importHeader();
    render(<Header status="UNKNOWN" />);

    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  it("applies pulse animation class only for CRISIS status badge", async () => {
    const Header = await importHeader();
    const { container } = render(<Header status="CRISIS" />);

    const badge = screen.getByText("CRISIS");
    expect(badge.className).toContain("animate-pulse");
  });

  it("does not apply pulse animation for STABLE status badge", async () => {
    const Header = await importHeader();
    render(<Header status="STABLE" />);

    const badge = screen.getByText("STABLE");
    expect(badge.className).not.toContain("animate-pulse");
  });
});
