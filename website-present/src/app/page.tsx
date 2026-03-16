"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Brain, Activity, Users,
  ChevronRight, ChevronLeft, Play,
  Zap, AlertTriangle, DollarSign,
  Stethoscope, MessageSquare,
  TrendingUp, Shield, Award,
  ShieldCheck, Eye, BarChart3,
  Check, CheckCircle,
  Footprints, Moon, Send, Gift,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function Counter({ value, suffix = "", prefix = "", delay = 0 }: { value: number; suffix?: string; prefix?: string; delay?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const step = 16;
      const increment = value / (duration / step);
      timer = setInterval(() => {
        start += increment;
        if (start >= value) { setCount(value); if (timer) clearInterval(timer); }
        else { setCount(Math.floor(start)); }
      }, step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (timer) clearInterval(timer);
    };
  }, [value, delay]);
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

function PulseRing({ color, size = 5 }: { color: string; size?: number }) {
  return (
    <span className="relative flex items-center justify-center" style={{ width: size * 2.5, height: size * 2.5 }}>
      <motion.span className={`absolute rounded-full ${color}`} style={{ width: size * 2.5, height: size * 2.5 }}
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
      <span className={`relative rounded-full ${color}`} style={{ width: size, height: size }} />
    </span>
  );
}

/* ── Ambient ECG heartbeat line — persists across all slides ── */
function HeartbeatLine() {
  /* Movie-style ECG sweep: bright cursor moves left→right revealing the line,
     with a fading tail behind it — like a hospital monitor. */
  return (
    <div className="absolute bottom-14 left-0 right-0 z-10 pointer-events-none overflow-hidden h-10">
      <style>{`
        @keyframes ecg-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <svg viewBox="0 0 1200 40" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <clipPath id="ecg-clip">
            <rect x="0" y="0" width="1200" height="40"
              style={{ animation: "ecg-sweep 4s linear infinite" }} />
          </clipPath>
          <linearGradient id="ecg-tail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0">
            <stop offset="0%" stopColor="rgba(45,212,191,0)" />
            <stop offset="85%" stopColor="rgba(45,212,191,0.7)" />
            <stop offset="100%" stopColor="rgba(45,212,191,1)" />
          </linearGradient>
          <filter id="ecg-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Dim base line — always visible, the "already drawn" trace */}
        <path
          d="M0,20 L150,20 L170,20 L180,8 L190,32 L200,4 L210,36 L220,20 L370,20 L390,20 L400,8 L410,32 L420,4 L430,36 L440,20 L590,20 L610,20 L620,8 L630,32 L640,4 L650,36 L660,20 L810,20 L830,20 L840,8 L850,32 L860,4 L870,36 L880,20 L1030,20 L1050,20 L1060,8 L1070,32 L1080,4 L1090,36 L1100,20 L1200,20"
          fill="none" stroke="rgba(45,212,191,0.1)" strokeWidth="1.5" />
        {/* Bright sweep with trailing fade + glow */}
        <path
          d="M0,20 L150,20 L170,20 L180,8 L190,32 L200,4 L210,36 L220,20 L370,20 L390,20 L400,8 L410,32 L420,4 L430,36 L440,20 L590,20 L610,20 L620,8 L630,32 L640,4 L650,36 L660,20 L810,20 L830,20 L840,8 L850,32 L860,4 L870,36 L880,20 L1030,20 L1050,20 L1060,8 L1070,32 L1080,4 L1090,36 L1100,20 L1200,20"
          fill="none" stroke="url(#ecg-tail)" strokeWidth="2.5"
          filter="url(#ecg-glow)" clipPath="url(#ecg-clip)" />
      </svg>
    </div>
  );
}

/* ── Ambient radial glow — shifts color per slide ── */
const SLIDE_GLOWS: Record<string, string> = {
  hook: "radial-gradient(ellipse 60% 50% at 30% 50%, rgba(248,113,113,0.06) 0%, transparent 70%)",
  solution: "radial-gradient(ellipse 50% 60% at 50% 40%, rgba(45,212,191,0.06) 0%, transparent 70%)",
  tech: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.05) 0%, transparent 70%)",
  nurse: "radial-gradient(ellipse 50% 60% at 65% 50%, rgba(96,165,250,0.06) 0%, transparent 70%)",
  impact: "radial-gradient(ellipse 50% 60% at 35% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)",
  close: "radial-gradient(ellipse 50% 50% at 50% 45%, rgba(45,212,191,0.08) 0%, transparent 70%)",
};

/* ── Connector line with flowing dot between two elements ── */
function FlowConnector({ delay = 0, color = "teal" }: { delay?: number; color?: string }) {
  const lineColor = color === "teal" ? "rgba(45,212,191,0.25)" : color === "amber" ? "rgba(251,191,36,0.25)" : "rgba(96,165,250,0.25)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      className="flex items-center mx-1 shrink-0">
      <svg width="36" height="20" viewBox="0 0 36 20" className="overflow-visible">
        <motion.line x1="0" y1="10" x2="36" y2="10" stroke={lineColor} strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.4 }} />
        {/* Arrowhead */}
        <motion.polygon points="30,6 36,10 30,14" fill={lineColor}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.4 }} />
      </svg>
    </motion.div>
  );
}

/* ── Glowing number text ── */
function GlowText({ children, color = "teal", className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  const glowColor = color === "teal" ? "0,180,170" : color === "red" ? "248,113,113" : color === "emerald" ? "52,211,153" : "251,191,36";
  return (
    <span className={`relative ${className}`}>
      <motion.span
        className="absolute inset-0 blur-lg"
        style={{ color: `rgba(${glowColor},0.4)` }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        {children}
      </motion.span>
      <span className="relative">{children}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   INLINE PRODUCT VISUALS
   ═══════════════════════════════════════════════════════════ */

/* ── Patient phone mock ── */
function PatientPhoneMock({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-[240px] h-[480px] rounded-[30px] bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative flex-shrink-0"
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />

      {/* Status bar */}
      <div className="px-4 pt-6 pb-2 flex justify-between items-center text-[8px] text-white/40">
        <span>9:41</span>
        <span className="font-semibold text-white/60 text-[9px]">Bewo</span>
        <span>85%</span>
      </div>

      {/* Daily insight card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }}
        className="mx-3 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-2.5 mb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <Heart size={8} className="text-emerald-400" />
          </div>
          <span className="text-[9px] text-white/50">Good morning!</span>
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[7px] font-bold">STABLE</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Risk", value: "12%", color: "text-emerald-300" },
            { label: "Trend", value: "↓ 48h", color: "text-emerald-300" },
            { label: "Vol", value: "Low", color: "text-emerald-300" },
          ].map((m) => (
            <div key={m.label} className="bg-black/20 rounded p-1.5 text-center">
              <div className={`text-[10px] font-bold font-mono ${m.color}`}>{m.value}</div>
              <div className="text-[7px] text-white/25">{m.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Glucose */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.45 }} className="mx-3 mb-2">
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
          <div className="flex items-end gap-2 mb-1.5">
            <span className="text-2xl font-bold text-white font-mono leading-none">5.2</span>
            <span className="text-[9px] text-white/25 mb-0.5">mmol/L</span>
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-[7px] font-bold">NORMAL</span>
          </div>
          <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-[52%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300" />
          </div>
        </div>
      </motion.div>

      {/* Metrics row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.55 }} className="mx-3 grid grid-cols-2 gap-1.5 mb-2">
        <div className="rounded-md bg-white/[0.04] border border-white/[0.06] p-2">
          <Footprints size={10} className="text-blue-400 mb-0.5" />
          <div className="text-sm font-bold text-white font-mono">3,200</div>
          <div className="text-[7px] text-white/25">steps</div>
        </div>
        <div className="rounded-md bg-white/[0.04] border border-white/[0.06] p-2">
          <Moon size={10} className="text-violet-400 mb-0.5" />
          <div className="text-sm font-bold text-white font-mono">6.1h</div>
          <div className="text-[7px] text-white/25">sleep</div>
        </div>
      </motion.div>

      {/* Meds */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.65 }} className="mx-3 mb-2">
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
          <div className="text-[8px] text-white/25 uppercase tracking-wider mb-1.5">Morning meds</div>
          {[
            { name: "Metformin 500mg", done: true },
            { name: "Lisinopril 10mg", done: true },
            { name: "Atorvastatin 20mg", done: false },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-1.5 py-0.5">
              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${m.done ? "bg-emerald-400/20 border-emerald-400/40" : "border-white/10"}`}>
                {m.done && <Check size={7} className="text-emerald-400" />}
              </div>
              <span className={`text-[9px] ${m.done ? "text-white/25 line-through" : "text-white/50"}`}>{m.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Voucher */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.75 }}
        className="mx-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 p-2.5 flex items-center gap-2">
        <Gift size={14} className="text-amber-400" />
        <div>
          <div className="text-[9px] text-white/50 font-semibold">$5.00 weekly voucher</div>
          <div className="text-[7px] text-amber-300/50">Miss a day = lose it</div>
        </div>
      </motion.div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex justify-around border-t border-white/[0.06] bg-black/40 backdrop-blur-sm">
        {[Heart, Activity, MessageSquare].map((Icon, i) => (
          <Icon key={i} size={14} className={i === 0 ? "text-teal-400" : "text-white/20"} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Nurse dashboard mock ── */
function NurseDashboardMock({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-[680px] h-[420px] rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden flex-shrink-0"
    >
      {/* Title bar */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <span className="text-[9px] text-white/25 ml-1 font-mono">Bewo Nurse Dashboard — Ward 3A</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PulseRing color="bg-emerald-400" size={3} />
          <span className="text-[8px] text-emerald-400/60">Live</span>
        </div>
      </div>

      <div className="flex h-[calc(100%-34px)]">
        {/* Sidebar: patient list */}
        <div className="w-[150px] border-r border-white/[0.06] p-2 space-y-1 overflow-hidden">
          <div className="text-[8px] text-white/20 uppercase tracking-wider mb-1">Patients (24)</div>
          {[
            { name: "Tan Ah Kow", state: "W", color: "bg-amber-400", urgent: true },
            { name: "Lim Mei Ling", state: "C", color: "bg-red-400", urgent: true },
            { name: "Chen Wei", state: "S", color: "bg-emerald-400", urgent: false },
            { name: "Siti Aminah", state: "S", color: "bg-emerald-400", urgent: false },
            { name: "Kumar Raj", state: "W", color: "bg-amber-400", urgent: false },
            { name: "Wong Siew", state: "S", color: "bg-emerald-400", urgent: false },
            { name: "Mdm Fatimah", state: "S", color: "bg-emerald-400", urgent: false },
          ].map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + 0.2 + i * 0.06 }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${i === 0 ? "bg-white/[0.06] border border-amber-500/20" : ""}`}>
              {p.urgent ? <PulseRing color={p.color} size={2.5} /> : <div className={`w-2 h-2 rounded-full ${p.color}`} />}
              <span className="text-[8px] text-white/40 truncate flex-1">{p.name}</span>
              <span className={`text-[7px] font-mono font-bold ${p.state === "C" ? "text-red-400" : p.state === "W" ? "text-amber-400" : "text-emerald-400/40"}`}>{p.state}</span>
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          {/* Patient header */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }}
            className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-[8px] text-amber-300 font-bold">TK</div>
            <div>
              <div className="text-[10px] text-white font-semibold">Tan Ah Kow</div>
              <div className="text-[7px] text-white/25">72y &bull; T2DM &bull; HTN &bull; P001</div>
            </div>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[7px] font-bold border border-amber-400/20">WARNING</span>
          </motion.div>

          {/* 14-day timeline */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.4 }}>
            <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1">14-day timeline</div>
            <div className="flex gap-[3px]">
              {["S","S","S","W","S","S","W","W","S","S","S","W","W","S"].map((s, i) => (
                <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: delay + 0.5 + i * 0.02 }}
                  className={`flex-1 h-4 rounded-sm origin-bottom ${s === "S" ? "bg-emerald-400/40" : "bg-amber-400/50"}`}
                  title={`Day ${i + 1}: ${s === "S" ? "STABLE" : "WARNING"}`} />
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            {/* SBAR */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.6 }}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
              <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1.5">SBAR Report</div>
              {[
                { l: "S", text: "WARNING — glucose rising", c: "text-amber-400" },
                { l: "B", text: "72yo, T2DM+HTN, Metformin", c: "text-blue-400" },
                { l: "A", text: "Velocity +0.5, adherence 60%", c: "text-cyan-400" },
                { l: "R", text: "Review meds, schedule appt", c: "text-emerald-400" },
              ].map((item) => (
                <div key={item.l} className="flex gap-1.5 mb-1">
                  <span className={`text-[8px] font-bold font-mono ${item.c} w-2.5 shrink-0`}>{item.l}</span>
                  <span className="text-[7px] text-white/30 leading-snug">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* HMM Matrix */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.7 }}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
              <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1.5">HMM Transitions</div>
              <div className="space-y-[3px]">
                <div className="flex gap-[3px] ml-7">
                  {["S", "W", "C"].map((h) => (
                    <div key={h} className="flex-1 text-center text-[7px] text-white/15 font-mono">{h}</div>
                  ))}
                </div>
                {[
                  { from: "S", values: [0.85, 0.12, 0.03], colors: ["bg-emerald-400/60", "bg-emerald-400/15", "bg-emerald-400/5"] },
                  { from: "W", values: [0.25, 0.55, 0.20], colors: ["bg-amber-400/20", "bg-amber-400/50", "bg-amber-400/20"] },
                  { from: "C", values: [0.05, 0.30, 0.65], colors: ["bg-red-400/5", "bg-red-400/25", "bg-red-400/60"] },
                ].map((row) => (
                  <div key={row.from} className="flex gap-[3px] items-center">
                    <span className="w-6 text-[7px] text-white/15 font-mono text-right pr-0.5">{row.from}</span>
                    {row.values.map((v, i) => (
                      <div key={i} className={`flex-1 h-6 rounded-sm ${row.colors[i]} flex items-center justify-center`}>
                        <span className="text-[7px] text-white/40 font-mono">{v.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Drug interactions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.8 }}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
              <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1.5">Drug Interactions</div>
              {[
                { sev: "MAJOR", pair: "Metformin + Alcohol", c: "bg-orange-400/80 text-orange-950" },
                { sev: "MOD", pair: "Lisinopril + NSAIDs", c: "bg-amber-400/80 text-amber-950" },
              ].map((d) => (
                <div key={d.pair} className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[6px] font-bold px-1.5 py-[2px] rounded ${d.c}`}>{d.sev}</span>
                  <span className="text-[7px] text-white/30">{d.pair}</span>
                </div>
              ))}
            </motion.div>

            {/* Triage */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.9 }}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
              <div className="text-[7px] text-white/20 uppercase tracking-wider mb-1.5">Patient Triage</div>
              {[
                { name: "Lim M.", urgency: 0.89, color: "bg-red-400" },
                { name: "Tan A.", urgency: 0.62, color: "bg-amber-400" },
                { name: "Kumar", urgency: 0.31, color: "bg-blue-400" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-[7px] text-white/35 flex-1">{p.name}</span>
                  <span className="text-[7px] text-white/25 font-mono">{p.urgency.toFixed(2)}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Singlish chat mock ── */
function ChatMock({ delay = 0 }: { delay?: number }) {
  return (
    <div className="space-y-1.5">
      {[
        { from: "user", text: "Eh my sugar how today?" },
        { from: "ai", text: "Uncle, your sugar 5.2 — quite good lah! But hor, you never take evening Atorvastatin. Can take tonight?" },
        { from: "user", text: "Ok ok I take later" },
        { from: "ai", text: "Shiok! I set reminder 8pm. Your 🔥 5-day streak still going — don't break ah!" },
      ].map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 + i * 0.25 }}
          className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[9px] leading-snug ${
            m.from === "user" ? "bg-teal-500/20 text-white/60 rounded-br-sm" : "bg-white/[0.06] text-white/50 rounded-bl-sm"
          }`}>
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Viterbi path ── */
function ViterbiPathViz({ delay = 0 }: { delay?: number }) {
  const states = ["S", "S", "S", "W", "S", "S", "W", "W", "C", "W", "W", "S"];
  const colors: Record<string, string> = { S: "bg-emerald-400", W: "bg-amber-400", C: "bg-red-400" };
  const opacities: Record<string, string> = { S: "opacity-60", W: "opacity-70", C: "opacity-90" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <div className="text-[9px] text-white/35 uppercase tracking-wider font-mono mb-2">Viterbi path (12 days)</div>
      <div className="flex items-end gap-1">
        {states.map((s, i) => (
          <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: delay + 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`flex-1 rounded-sm origin-bottom ${colors[s]} ${opacities[s]}`}
            style={{ height: s === "C" ? 48 : s === "W" ? 34 : 20 }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[7px] text-white/20 font-mono">day 1</span>
        <span className="text-[7px] text-white/20 font-mono">day 12</span>
      </div>
    </motion.div>
  );
}

/* ── Merlion ARIMA forecast ── */
function MerlionForecastViz({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      className="rounded-xl bg-white/[0.06] border border-white/[0.1] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-white/35 uppercase tracking-wider font-mono">Merlion ARIMA (48h)</div>
        <span className="text-[8px] text-amber-400/80 font-mono">Risk: 67%</span>
      </div>
      <div className="relative h-14">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ delay: delay + 0.2 }}
          className="absolute inset-x-0 top-1 bottom-1 bg-gradient-to-r from-emerald-400/30 via-amber-400/30 to-red-400/30 rounded" />
        <svg className="absolute inset-0" viewBox="0 0 200 48" preserveAspectRatio="none">
          <motion.path d="M0,36 Q20,34 40,30 T80,25 T120,20 T140,28" fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.3, duration: 1 }} />
          <motion.path d="M140,28 Q155,33 170,38 T200,44" fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="2" strokeDasharray="4,3"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1, duration: 0.6 }} />
          <motion.line x1="140" y1="0" x2="140" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2,2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.8 }} />
        </svg>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1 }}
          className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          <span className="text-[6px] text-white/20">-7d</span>
          <span className="text-[6px] text-white/40 font-bold">now</span>
          <span className="text-[6px] text-amber-400/50">+48h</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Gaussian emission curves ── */
function EmissionCurvesViz({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      className="rounded-xl bg-white/[0.06] border border-white/[0.1] p-3">
      <div className="text-[9px] text-white/35 uppercase tracking-wider font-mono mb-2">Emission P(glucose | state)</div>
      <div className="relative h-14">
        <svg className="absolute inset-0" viewBox="0 0 200 50" preserveAspectRatio="none">
          {/* Stable (green) — peaks at x=50, narrow spread */}
          <motion.path d="M5,48 C15,48 25,46 35,40 C42,35 47,18 50,6 C53,18 58,35 65,40 C75,46 85,48 95,48"
            fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.7)" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.15, duration: 0.8 }} />
          {/* Warning (amber) — peaks at x=105, medium spread */}
          <motion.path d="M55,48 C65,48 78,46 88,38 C95,32 100,16 105,5 C110,16 115,32 122,38 C132,46 145,48 155,48"
            fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.7)" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.3, duration: 0.8 }} />
          {/* Crisis (red) — peaks at x=155, wider spread */}
          <motion.path d="M110,48 C120,48 132,46 142,40 C148,35 152,20 155,8 C158,20 162,35 168,40 C178,46 188,48 198,48"
            fill="rgba(248,113,113,0.12)" stroke="rgba(248,113,113,0.7)" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.45, duration: 0.8 }} />
          {/* Observation line at 5.2 mmol/L (in Stable zone) */}
          <motion.line x1="72" y1="0" x2="72" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3,3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.8 }} />
        </svg>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.9 }}
          className="absolute top-0 text-[8px] text-white/55 font-mono font-bold" style={{ left: "34%" }}>5.2</motion.div>
      </div>
      <div className="flex justify-center gap-4 mt-1.5">
        {[{ l: "Stable", c: "bg-emerald-400" }, { l: "Warning", c: "bg-amber-400" }, { l: "Crisis", c: "bg-red-400" }].map((x) => (
          <div key={x.l} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${x.c}`} />
            <span className="text-[7px] text-white/35">{x.l}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Monte Carlo histogram ── */
function MonteCarloViz({ delay = 0 }: { delay?: number }) {
  const data = [12, 20, 32, 48, 60, 71, 68, 55, 40, 30, 20, 14, 9, 5, 3, 2, 1];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      className="rounded-xl bg-white/[0.06] border border-white/[0.1] p-3">
      <div className="text-[9px] text-white/35 uppercase tracking-wider font-mono mb-2">Monte Carlo Simulation</div>
      <div className="flex items-end gap-[3px] h-14">
        {data.map((v, i) => (
          <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: delay + 0.15 + i * 0.03 }}
            className={`flex-1 rounded-t-sm origin-bottom ${i < 5 ? "bg-emerald-400/50" : i < 10 ? "bg-amber-400/50" : "bg-red-400/50"}`}
            style={{ height: `${(v / 71) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[7px] text-white/20">Low</span>
        <span className="text-[8px] text-amber-400/60 font-mono">P(crisis) = 0.67</span>
        <span className="text-[7px] text-white/20">High</span>
      </div>
    </motion.div>
  );
}

/* ── Agent ReAct loop ── */
function AgentLoopViz({ delay = 0 }: { delay?: number }) {
  const steps = [
    { label: "Observe", detail: "glucose: 8.1, missed PM meds", color: "border-emerald-500/40 bg-emerald-500/8" },
    { label: "Think", detail: "High glucose + missed meds → risk rising", color: "border-amber-500/40 bg-amber-500/8" },
    { label: "Act", detail: "→ send_caregiver_alert(\"sugar high\")", color: "border-cyan-500/40 bg-cyan-500/8" },
    { label: "Verify", detail: "Alert sent ✓ Drug check: no conflicts", color: "border-violet-500/40 bg-violet-500/8" },
    { label: "Respond", detail: "\"Uncle, sugar a bit high lah.\"", color: "border-rose-500/40 bg-rose-500/8" },
  ];
  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.15 + i * 0.15 }}
          className={`flex items-start gap-2.5 rounded-lg border ${s.color} px-3 py-2`}>
          <span className="text-[9px] font-bold text-white/55 font-mono w-12 shrink-0">{s.label}</span>
          <span className="text-[9px] text-white/45 leading-snug">{s.detail}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SLIDE DEFINITIONS — 6 slides, 60 seconds
   ═══════════════════════════════════════════════════════════ */

interface Slide { id: string; duration: number; render: () => React.ReactNode; }

const slides: Slide[] = [

  /* ═══ SLIDE 1: HOOK (7s) ═══ */
  {
    id: "hook",
    duration: 7,
    render: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-16 max-w-5xl mx-auto px-12">
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="mb-4">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-red-400/80">Singapore&apos;s silent crisis</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[5rem] font-bold text-white leading-[0.95] tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
              <GlowText color="red"><Counter value={440} delay={300} />,000</GlowText><br />
              <span className="text-white/30">diabetics</span><br />
              <span className="text-red-400">zero</span> early warning.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="text-base text-white/40 max-w-sm leading-relaxed">
              40% of ER admissions were preventable — if someone had been watching between appointments.
            </motion.p>
          </div>
          <div className="w-[340px] shrink-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
              {[
                { label: "ER visit cost", value: "$8,800", bar: 88, color: "bg-red-500" },
                { label: "Annual spend", value: "$4.0B", bar: 100, color: "bg-red-400/80" },
                { label: "Preventable", value: "40%", bar: 40, color: "bg-amber-400" },
                { label: "Early detection", value: "0 hrs", bar: 3, color: "bg-white/15" },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.12 }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/40">{item.label}</span>
                    <span className="text-white font-mono font-bold">{item.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${item.color}`} initial={{ width: 0 }}
                      animate={{ width: `${item.bar}%` }} transition={{ delay: 0.9 + i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },

  /* ═══ SLIDE 2: SOLUTION — Phone + Chat + Differentiators (10s) ═══ */
  {
    id: "solution",
    duration: 10,
    render: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-8 max-w-6xl mx-auto px-10">
          {/* Left: headline + differentiators */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-teal-400/80">Our solution</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Bewo predicts crises<br /><span className="text-teal-300"><GlowText color="teal">48 hours early.</GlowText></span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="text-sm text-white/40 mb-4">
              HMM + 18 autonomous AI tools. Watches 9 biomarkers. Acts before the ER.
            </motion.p>

            {/* Why not ChatGPT */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div className="text-[9px] text-white/15 uppercase tracking-wider font-mono mb-2">Why not just ChatGPT?</div>
              <div className="space-y-2">
                {[
                  { icon: ShieldCheck, label: "Doctor-gated", desc: "AI suggests, doctors decide.", color: "text-emerald-400" },
                  { icon: Eye, label: "Continuous monitoring", desc: "9 biomarkers 24/7, proactive contact.", color: "text-amber-400" },
                  { icon: MessageSquare, label: "Singlish-native", desc: "SEA-LION: culturally appropriate.", color: "text-cyan-400" },
                  { icon: Shield, label: "Safety classifier", desc: "6-dimension check before patient.", color: "text-red-400" },
                  { icon: Gift, label: "Loss-aversion gamification", desc: "$5/week voucher — behavioral economics.", color: "text-amber-400" },
                ].map((d, i) => (
                  <motion.div key={d.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }} className="flex gap-2">
                    <d.icon size={13} className={`${d.color} mt-0.5 shrink-0`} />
                    <div>
                      <span className="text-white text-xs font-semibold">{d.label}</span>
                      <span className="text-[10px] text-white/25 ml-1.5">{d.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center: phone mock */}
          <div className="shrink-0">
            <PatientPhoneMock delay={0.2} />
          </div>

          {/* Right: chat demo */}
          <div className="w-[240px] shrink-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <div className="text-[9px] text-white/15 uppercase tracking-wider font-mono mb-2">Singlish AI Chat</div>
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
                <ChatMock delay={0.7} />
                <div className="mt-2 flex items-center gap-2 border-t border-white/[0.04] pt-2">
                  <div className="flex-1 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 flex items-center">
                    <span className="text-[7px] text-white/15">Type a message...</span>
                  </div>
                  <Send size={10} className="text-teal-400/30" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },

  /* ═══ SLIDE 3: TECHNOLOGY — HMM + Merlion + Agent (12s) ═══ */
  {
    id: "tech",
    duration: 12,
    render: () => (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="max-w-6xl w-full px-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-1">
          <span className="text-xs font-mono tracking-[0.2em] uppercase text-cyan-400/80">Under the hood</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-white mb-5 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Real AI. Not a wrapper.
        </motion.h1>

        {/* Data flow: 3 columns with animated connectors */}
        <div className="flex items-start gap-0">
          {/* Col 1: HMM */}
          <div className="flex-1 space-y-2.5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
              <Brain size={14} className="text-amber-400" />
              <span className="text-sm text-white font-semibold">HMM Engine</span>
              <span className="text-[7px] text-white/30 font-mono ml-auto">3-state Viterbi</span>
            </motion.div>
            <ViterbiPathViz delay={0.3} />
            <EmissionCurvesViz delay={0.7} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex flex-wrap gap-1">
              {["Baum-Welch EM", "9 biomarkers", "Per-patient params"].map((t) => (
                <span key={t} className="text-[7px] text-white/35 px-1.5 py-0.5 rounded-full border border-white/[0.1]">{t}</span>
              ))}
            </motion.div>
          </div>

          {/* Connector 1→2 */}
          <div className="flex items-center self-center pt-8">
            <FlowConnector delay={1.2} color="amber" />
          </div>

          {/* Col 2: Merlion + Monte Carlo */}
          <div className="flex-1 space-y-2.5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-400" />
              <span className="text-sm text-white font-semibold">Merlion (A*STAR)</span>
            </motion.div>
            <MerlionForecastViz delay={0.5} />
            <MonteCarloViz delay={1} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex flex-wrap gap-1">
              {["ARIMA forecast", "48h window", "A*STAR Singapore"].map((t) => (
                <span key={t} className="text-[7px] text-white/35 px-1.5 py-0.5 rounded-full border border-white/[0.1]">{t}</span>
              ))}
            </motion.div>
          </div>

          {/* Connector 2→3 */}
          <div className="flex items-center self-center pt-8">
            <FlowConnector delay={1.4} color="teal" />
          </div>

          {/* Col 3: Agent loop */}
          <div className="flex-1 space-y-2.5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-sm text-white font-semibold">5-Turn ReAct Agent</span>
            </motion.div>
            <AgentLoopViz delay={0.7} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="flex flex-wrap gap-1">
              {["18 tools", "Cross-session memory", "Safety filter"].map((t) => (
                <span key={t} className="text-[7px] text-white/35 px-1.5 py-0.5 rounded-full border border-white/[0.1]">{t}</span>
              ))}
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    ),
  },

  /* ═══ SLIDE 4: NURSE DASHBOARD — Full mock (10s) ═══ */
  {
    id: "nurse",
    duration: 10,
    render: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-10 max-w-6xl mx-auto px-10">
          <div className="w-[240px] shrink-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-blue-400/80">Clinical interface</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Nurse sees<br /><span className="text-blue-300">everything.</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2.5">
              {[
                { icon: Activity, label: "14-day HMM timeline", desc: "Color-coded state history" },
                { icon: Stethoscope, label: "Auto SBAR reports", desc: "Situation → Recommendation" },
                { icon: AlertTriangle, label: "Drug interaction alerts", desc: "16+ pairs, severity-ranked" },
                { icon: Users, label: "Multi-patient triage", desc: "1 nurse : 100+ patients" },
                { icon: Brain, label: "Transition matrices", desc: "Baum-Welch per-patient" },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }} className="flex gap-2">
                  <item.icon size={13} className="text-blue-400/40 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-white text-[11px] font-semibold">{item.label}</div>
                    <div className="text-[9px] text-white/20 leading-snug">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <NurseDashboardMock delay={0.15} />
          </div>
        </div>
      </div>
    ),
  },

  /* ═══ SLIDE 5: IMPACT + BUSINESS (12s) ═══ */
  {
    id: "impact",
    duration: 12,
    render: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-start gap-14 max-w-5xl mx-auto px-10">
        {/* Left */}
        <div className="flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-400/80">Projected impact</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-6 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Why it <span className="text-emerald-300">works</span>
          </motion.h1>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {[
              { value: "48h", label: "Advance warning", desc: "Predict before crisis" },
              { value: "10-16×", label: "Projected ROI", desc: "500-patient polyclinic" },
              { value: "1:100+", label: "Nurse ratio", desc: "vs current 1:20" },
              { value: "~40%", label: "ER reduction", desc: "Preventable avoided" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}>
                <div className="text-3xl font-bold text-emerald-300 mb-1 tracking-tight" style={{ fontFamily: "var(--font-display)" }}><GlowText color="emerald">{stat.value}</GlowText></div>
                <div className="text-white font-semibold text-sm">{stat.label}</div>
                <div className="text-white/30 text-xs mt-0.5">{stat.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="mt-6 flex items-center gap-2">
            <span className="text-[9px] text-white/15 mr-1">Aligned:</span>
            {["Healthier SG", "National AI 2.0", "CHAS", "MOH AIC"].map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded-full bg-white/5 text-white/25 text-[9px] border border-white/[0.04]">{tag}</span>
            ))}
          </motion.div>
        </div>

        {/* Right */}
        <div className="w-[340px] shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-2.5">
            <div className="text-xs font-mono tracking-[0.2em] uppercase text-white/20 mb-1">Business model</div>

            <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign size={15} className="text-emerald-400" />
                <span className="text-white font-bold text-sm">B2B2C SaaS — $15/patient/mo</span>
              </div>
              <div className="text-white/35 text-xs">Free for patients. Polyclinics pay per head.</div>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={15} className="text-cyan-400" />
                <span className="text-white font-bold text-sm">Unit economics</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-white/35">500 patients × $15</span><span className="text-white font-mono">$7,500/mo</span></div>
                <div className="flex justify-between"><span className="text-white/35">10 ER visits prevented</span><span className="text-emerald-400 font-mono">-$88,000</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between"><span className="text-white/45 font-semibold">Net savings</span><span className="text-emerald-300 font-mono font-bold">$80,500</span></div>
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1.5">
                <Award size={15} className="text-amber-400" />
                <span className="text-white font-bold text-sm">Market</span>
              </div>
              <div className="text-white/35 text-xs">SG: 23 polyclinics, 440K diabetics → ASEAN: 90M, 10 nations.</div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
              <div className="text-white font-bold text-sm mb-1.5">Moat</div>
              <div className="text-xs space-y-0.5">
                {[
                  "HMM + Baum-Welch: learns per-patient",
                  "Merlion: government-backed (A*STAR)",
                  "18 tools: acts, not just chats",
                  "Doctor-gated: clinical trust built-in",
                ].map((m) => (
                  <div key={m} className="flex items-start gap-1.5">
                    <CheckCircle size={9} className="text-emerald-400/40 mt-0.5 shrink-0" />
                    <span className="text-white/25">{m}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
        </div>
      </div>
    ),
  },

  /* ═══ SLIDE 6: CLOSE (9s) ═══ */
  {
    id: "close",
    duration: 9,
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }} className="mb-6 relative">
          {/* Radiating rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div key={ring}
              className="absolute inset-0 rounded-2xl border border-teal-400/20"
              animate={{ scale: [1, 1.4 + ring * 0.3], opacity: [0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: ring * 0.5, ease: "easeOut" }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/30 relative z-10"
          >
            <Heart size={40} className="text-white" />
          </motion.div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Bewo
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-xl text-white/50 mb-8 max-w-md">
          Predicting health crises <strong className="text-white">before</strong> they happen.<br />
          For Singapore&apos;s 440,000 diabetics.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-10 mb-8">
          {[
            { num: "18", label: "AI tools" },
            { num: "57", label: "API routes" },
            { num: "3", label: "live views" },
            { num: "39", label: "tests pass" },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 + i * 0.08 }} className="text-center">
              <div className="text-2xl font-bold text-teal-300 font-mono">{item.num}</div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider mt-1">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex items-center gap-2 mb-4">
          <PulseRing color="bg-emerald-400" size={5} />
          <span className="text-xs text-emerald-400/70 font-mono">Live prototype — not a mockup</span>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          className="text-base text-white/25 font-medium">
          Before crisis. Not after.
        </motion.p>
      </div>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════
   PRESENTATION SHELL
   ═══════════════════════════════════════════════════════════ */

export default function PresentationMode() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  }, [currentSlide]);

  const start = useCallback(() => setHasStarted(true), []);
  const reset = useCallback(() => { setCurrentSlide(0); setHasStarted(false); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); if (!hasStarted) start(); else goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "r" || e.key === "R") reset();
      else if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, start, reset, hasStarted]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none bg-[oklch(0.12_0.02_260)]">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      {/* Ambient slide glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${slides[currentSlide].id}`}
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ backgroundImage: SLIDE_GLOWS[slides[currentSlide].id] || "none" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      </AnimatePresence>

      {/* Heartbeat line */}
      <HeartbeatLine />

      {/* Content — cinematic transition */}
      <AnimatePresence mode="wait">
        <motion.div key={slides[currentSlide].id}
          initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0">
          {slides[currentSlide].render()}
        </motion.div>
      </AnimatePresence>

      {/* Nav arrows */}
      <div className="absolute bottom-6 right-8 z-50 flex items-center gap-2">
        <button onClick={goPrev} disabled={currentSlide === 0} className="p-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white disabled:opacity-20 transition-all">
          <ChevronLeft size={16} />
        </button>
        <button onClick={goNext} disabled={currentSlide === slides.length - 1} className="p-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white disabled:opacity-20 transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Start overlay */}
      {!hasStarted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-20 opacity-[0.12]">
            <svg viewBox="0 0 800 80" className="w-full h-full" preserveAspectRatio="none">
              <motion.path
                d="M0,40 L150,40 L170,40 L180,15 L190,65 L200,5 L210,75 L220,40 L240,40 L400,40 L420,40 L430,15 L440,65 L450,5 L460,75 L470,40 L490,40 L650,40 L670,40 L680,15 L690,65 L700,5 L710,75 L720,40 L740,40 L800,40"
                fill="none" stroke="rgba(45,212,191,0.7)" strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>

          <button onClick={start} className="group flex flex-col items-center gap-5 relative z-10">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-white/[0.06] border border-white/20 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 transition-colors"
            >
              <div className="absolute inset-0 rounded-full">
                <motion.div className="absolute inset-0 rounded-full border border-teal-400/20"
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }} />
              </div>
              <Play size={32} className="text-white ml-1 relative z-10" />
            </motion.div>
            <span className="text-white/80 font-medium text-lg">Start Presentation</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex items-center gap-6 text-[11px] text-white/20 font-mono relative z-10"
          >
            {[
              { key: "SPACE", action: "Next" },
              { key: "←", action: "Back" },
              { key: "R", action: "Reset" },
              { key: "ESC", action: "Exit" },
            ].map((k) => (
              <div key={k.key} className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/30 text-[10px] font-bold">{k.key}</span>
                <span>{k.action}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
