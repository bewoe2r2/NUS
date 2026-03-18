"use client";

import { useEffect, useState } from "react";
import { DailyInsightCard } from "@/components/patient/home/DailyInsightCard";
import { DailyChallengeCard } from "@/components/patient/home/DailyChallengeCard";
import { StreakDisplay } from "@/components/patient/home/StreakDisplay";
import { WeeklySummaryCard } from "@/components/patient/home/WeeklySummaryCard";
import { BentoGrid } from "@/components/patient/metrics/BentoGrid";
import { MedicationList } from "@/components/patient/medication/MedicationList";
import { ChatContainer } from "@/components/patient/chat/ChatContainer";
import { ActionMenu } from "@/components/patient/actions/ActionMenu";
import { GlucoseModal } from "@/components/patient/actions/GlucoseModal";
import { FoodModal } from "@/components/patient/actions/FoodModal";
import { VoiceModal } from "@/components/patient/actions/VoiceModal";
import { api, type PatientState } from "@/lib/api";
import { VoucherCard } from "@/components/patient/rewards/VoucherCard";
import { EmergencyBar } from "@/components/patient/home/EmergencyBar";
import { CaregiverIndicator } from "@/components/patient/home/CaregiverIndicator";
import { WifiOff, Loader2 } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<PatientState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal States
  const [showGlucose, setShowGlucose] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  useEffect(() => {
    let stopped = false;

    async function fetchData() {
      if (stopped) return;
      try {
        const stateRes = await api.getPatientState("P001");
        setData(stateRes);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(() => {
      if (!stopped) fetchData();
    }, 15000);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="text-error-500 mb-4">
          <WifiOff size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-neutral-900">Connection Lost</h1>
        <p className="text-lg text-neutral-500">
          Cannot connect to Bewo Health Engine. <br />Ensure the backend API is running on port 8000.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 bg-neutral-900 text-white rounded-full font-medium text-lg active:scale-95 transition-transform min-h-[48px]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 relative bg-neutral-50">
      {/* 1. GLASS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="font-semibold text-lg tracking-tight select-none">
          Bewo <span className="text-accent-500">Health</span>
        </div>
        <div className="h-11 w-11 bg-accent-100 rounded-full flex items-center justify-center text-accent-500 font-bold text-lg border border-accent-200">
          T
        </div>
      </header>

      {/* 1b. EMERGENCY BAR — amber for WARNING, red for CRISIS, hidden for STABLE */}
      <div className="fixed top-[60px] left-0 right-0 z-40">
        <EmergencyBar state={data.current_state} />
      </div>

      {/* 2. BODY CONTENT */}
      <div className="pt-24 px-6 max-w-md mx-auto space-y-6">

        {/* STATUS — Daily Insight */}
        <section id="patient-insight" className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:50ms] fill-mode-backwards">
          <DailyInsightCard
            state={data.current_state}
            riskScore={data.risk_score}
            lastUpdated={data.last_updated}
            trend={(data.trend as "IMPROVING" | "DECLINING" | "STABLE") || "STABLE"}
          />
        </section>

        {/* STREAKS — inline badges */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:80ms] fill-mode-backwards">
          <StreakDisplay />
        </section>

        {/* DAILY CHALLENGE */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:100ms] fill-mode-backwards">
          <DailyChallengeCard />
        </section>

        {/* REWARDS */}
        <section id="patient-voucher" className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:120ms] fill-mode-backwards">
          <VoucherCard />
        </section>

        {/* METRICS — with embedded glucose sparkline */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms] fill-mode-backwards">
          <h2 className="text-h4 mb-3 px-1 text-neutral-800">Overview</h2>
          <BentoGrid
            biometrics={data.biometrics}
          />
        </section>

        {/* WEEKLY SUMMARY — collapsible */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:250ms] fill-mode-backwards">
          <WeeklySummaryCard />
        </section>

        {/* MEDICATION */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:300ms] fill-mode-backwards">
          <h2 className="text-h4 mb-3 px-1 text-neutral-800">Schedule</h2>
          <MedicationList />
        </section>

        {/* CAREGIVER INDICATOR */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:380ms] fill-mode-backwards">
          <CaregiverIndicator />
        </section>

        {/* CHAT */}
        <section id="patient-chat" className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms] fill-mode-backwards">
          <h2 className="text-h4 mb-3 px-1 text-neutral-800">Care Assistant</h2>
          <ChatContainer />
        </section>
      </div>

      {/* 3. INTERACTION LAYERS */}
      <div id="patient-actions-area">
      <ActionMenu
        onLogGlucose={() => setShowGlucose(true)}
        onLogFood={() => setShowFood(true)}
        onVoiceCheckIn={() => setShowVoice(true)}
      />
      </div>

      <GlucoseModal isOpen={showGlucose} onClose={() => setShowGlucose(false)} />
      <FoodModal isOpen={showFood} onClose={() => setShowFood(false)} />
      <VoiceModal isOpen={showVoice} onClose={() => setShowVoice(false)} />

    </main>
  );
}
