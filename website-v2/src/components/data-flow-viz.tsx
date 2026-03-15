"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const LAYERS = [
  { id: "input", label: "Data Sources", items: ["CGM Device", "Fitbit/Wearable", "Voice Input", "Meal Photo OCR", "Passive Sensors", "Manual Log"], color: "oklch(0.45 0.12 185)" },
  { id: "process", label: "HMM Engine", items: ["Viterbi Decode", "Monte Carlo (1K paths)", "Counterfactual Engine", "Gaussian Likelihood"], color: "oklch(0.52 0.14 160)" },
  { id: "reason", label: "Gemini AI", items: ["Context Assembly", "Tool Selection", "Mood Detection", "Tone Adaptation"], color: "oklch(0.50 0.12 280)" },
  { id: "act", label: "18 Agentic Tools", items: ["Book Appointment", "Alert Caregiver", "Award Voucher", "Recommend Food", "Set Reminder", "+13 more"], color: "oklch(0.62 0.14 80)" },
  { id: "audit", label: "Clinical Governance", items: ["Action Audit Log", "SBAR Reports", "Nurse Dashboard", "Weekly Reports"], color: "oklch(0.50 0.02 260)" },
];

export function DataFlowViz() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [activeLayer, setActiveLayer] = useState(-1);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    LAYERS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveLayer(i), 400 + i * 600));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <div ref={ref} className="bg-[oklch(0.10_0.03_260)] rounded-2xl border border-[oklch(0.22_0.04_260)] p-6 overflow-hidden">
      <div className="text-xs font-[family-name:var(--font-mono)] text-[oklch(0.50_0.02_260)] uppercase tracking-widest mb-5">
        End-to-End Data Pipeline
      </div>

      <div className="space-y-3">
        {LAYERS.map((layer, i) => {
          const isActive = activeLayer >= i;
          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
            >
              {i > 0 && (
                <div className="flex justify-center -mt-1 mb-1">
                  <div className="w-[2px] h-4 transition-colors duration-500" style={{ background: isActive ? LAYERS[i - 1].color : "oklch(0.25 0.03 260)" }} />
                </div>
              )}

              <div
                className="rounded-xl p-4 border transition-all duration-500"
                style={{
                  background: isActive ? `${layer.color}12` : "oklch(0.14 0.03 260)",
                  borderColor: isActive ? `${layer.color}40` : "oklch(0.22 0.03 260)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full transition-all duration-500" style={{ background: isActive ? layer.color : "oklch(0.30 0.03 260)", boxShadow: isActive ? `0 0 8px ${layer.color}60` : "none" }} />
                  <span className="text-xs font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider transition-colors duration-500" style={{ color: isActive ? layer.color : "oklch(0.45 0.02 260)" }}>
                    {layer.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 ml-5">
                  {layer.items.map((item, j) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={activeLayer >= i ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.3, delay: j * 0.08 }}
                      className="text-[11px] font-[family-name:var(--font-mono)] px-2.5 py-1 rounded-md transition-colors duration-300"
                      style={{
                        background: isActive ? `${layer.color}15` : "oklch(0.18 0.03 260)",
                        color: isActive ? "oklch(0.80 0.01 260)" : "oklch(0.40 0.02 260)",
                        border: `1px solid ${isActive ? `${layer.color}25` : "oklch(0.22 0.03 260)"}`,
                      }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
