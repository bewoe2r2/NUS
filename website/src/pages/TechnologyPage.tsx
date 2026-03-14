import { motion } from 'framer-motion';
import { pageVariants, fadeInUp, staggerContainer } from '../utils/animations';
import {
  Brain, Activity, Bell, Calculator, Pill,
  Clock, Users, Gift, Video, Dumbbell, AlertTriangle,
  Utensils, CalendarCheck, Award, FileText, Settings,
  ArrowDown, Zap, Eye, BarChart3, Waves, Stethoscope,
} from 'lucide-react';

interface ToolCardProps {
  icon: React.ComponentType<{ size: number }>;
  name: string;
  description: string;
}

const ToolCard = ({ icon: Icon, name, description }: ToolCardProps) => (
  <motion.div variants={fadeInUp} className="card card--flat" style={{
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
  }}>
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      background: 'var(--accent-muted)',
      color: 'var(--accent-primary)',
    }}>
      <Icon size={16} />
    </span>
    <div>
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        marginBottom: 'var(--space-1)',
        color: 'var(--text-ink)',
      }}>
        {name}
      </div>
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {description}
      </div>
    </div>
  </motion.div>
);

export const TechnologyPage = () => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

    {/* === HERO — asymmetric, not centered gradient === */}
    <section className="hero" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ position: 'relative', zIndex: 1 }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--space-4)' }}>
          Technical Architecture
        </div>
        <h1 style={{ maxWidth: '640px', marginBottom: 'var(--space-4)' }}>
          How Bewo actually works
        </h1>
        <p style={{
          maxWidth: '560px',
          fontSize: 'var(--text-lg)',
          lineHeight: 1.6,
        }}>
          A clinically-grounded prediction engine paired with autonomous AI agents
          that take real-world action. Every component is evidence-based.
        </p>
      </motion.div>
    </section>

    {/* === HMM THREE STATES ===
        Using left-aligned header, not centered.
        State cards use border-left accent, not gradient backgrounds.
    */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <span style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          <Brain size={24} />
        </span>
        <h2>Hidden Markov Model</h2>
        <p style={{ maxWidth: '480px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Three clinical states. Nine biomarkers. Real-time state inference.
        </p>
      </motion.div>

      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}
        variants={staggerContainer} initial="initial" animate="animate"
      >
        {[
          {
            state: 'STABLE',
            accent: 'var(--color-profit)',
            desc: 'Patient vitals within target range. Proactive wellness maintenance.',
            indicators: ['Glucose 4.0-7.0 mmol/L', 'Adherence > 80%', 'Steps > 5,000/day', 'HRV > 30ms'],
          },
          {
            state: 'WARNING',
            accent: 'var(--color-warning)',
            desc: 'Early deterioration detected. Preventive intervention triggered.',
            indicators: ['Glucose 7.0-11.0 mmol/L', 'Declining adherence', 'Reduced activity', 'Sleep disrupted'],
          },
          {
            state: 'CRISIS',
            accent: 'var(--color-loss)',
            desc: 'Immediate clinical attention required. Full escalation activated.',
            indicators: ['Glucose > 11.0 mmol/L', 'Multiple missed meds', 'HRV below threshold', 'BP elevated'],
          },
        ].map((s) => (
          <motion.div key={s.state} variants={fadeInUp}
            className="card card--accent"
            style={{ borderLeftColor: s.accent }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
            }}>
              <span className="pulse-dot" style={{ background: s.accent }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                color: s.accent,
              }}>
                {s.state}
              </span>
            </div>
            <p style={{
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              lineHeight: 1.5,
            }}>
              {s.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
              {s.indicators.map((ind) => (
                <span key={ind} style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-inset)',
                  color: 'var(--text-muted)',
                }}>
                  {ind}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 9 Biomarker weights */}
      <motion.div variants={fadeInUp} className="card" style={{ padding: 'var(--space-8)' }}>
        <h3 style={{ marginBottom: 'var(--space-6)' }}>9 Clinically-Weighted Input Features</h3>
        {[
          { label: 'Glucose Average', weight: 0.25, accent: 'var(--color-loss)' },
          { label: 'Medication Adherence', weight: 0.20, accent: 'var(--accent-primary)' },
          { label: 'Glucose Variability', weight: 0.15, accent: 'var(--color-warning)' },
          { label: 'HRV RMSSD', weight: 0.10, accent: 'var(--color-profit)' },
          { label: 'Heart Rate', weight: 0.08, accent: 'var(--text-secondary)' },
          { label: 'Steps Daily', weight: 0.08, accent: 'var(--text-secondary)' },
          { label: 'Sleep Hours', weight: 0.05, accent: 'var(--text-muted)' },
          { label: 'Systolic BP', weight: 0.05, accent: 'var(--text-muted)' },
          { label: 'Carb Intake', weight: 0.04, accent: 'var(--text-muted)' },
        ].map((f) => (
          <div key={f.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-2)',
          }}>
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              width: 160,
              flexShrink: 0,
            }}>
              {f.label}
            </span>
            <div style={{
              flex: 1,
              height: 16,
              background: 'var(--bg-raised)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${f.weight * 400}%` }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: f.accent, borderRadius: 'var(--radius-sm)' }}
              />
            </div>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              width: 32,
              textAlign: 'right',
            }}>
              {(f.weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </motion.div>
    </section>

    {/* === THREE PREDICTION ENGINES — dark section === */}
    <section className="section-dark" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Three Prediction Engines</h2>
        <p style={{ maxWidth: '480px', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Layered analysis for maximum clinical accuracy.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
          {[
            {
              icon: Eye, title: 'Viterbi Decoding',
              desc: 'Finds the most likely sequence of hidden states given observed biomarkers. Current state classification with confidence score.',
              badge: 'STATE INFERENCE',
            },
            {
              icon: Waves, title: 'Monte Carlo Simulation',
              desc: '2,000 stochastic future trajectories over 48h horizon. Quantifies crisis probability and expected time-to-crisis.',
              badge: '2,000 PATHS',
            },
            {
              icon: BarChart3, title: 'Counterfactual Engine',
              desc: '"What if?" Bayesian simulation. Projects how medication, diet, or exercise would alter the crisis trajectory.',
              badge: 'WHAT-IF ANALYSIS',
            },
          ].map((m) => (
            <div key={m.title} style={{
              background: 'oklch(0.22 0.04 265)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid oklch(0.32 0.04 265)',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'oklch(0.42 0.14 265 / 0.12)',
                color: 'oklch(0.68 0.10 265)',
                marginBottom: 'var(--space-4)',
              }}>
                <m.icon size={22} />
              </span>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>{m.title}</h4>
              <p style={{
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5,
                marginBottom: 'var(--space-3)',
              }}>
                {m.desc}
              </p>
              <span className="badge badge--profit" style={{
                background: 'oklch(0.52 0.12 160 / 0.12)',
                color: 'oklch(0.68 0.10 160)',
              }}>
                {m.badge}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* === AGENT DECISION FLOW ===
        Sequential flow, not centered icon header.
    */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <span style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          <Zap size={24} />
        </span>
        <h2>Agent Decision Flow</h2>
        <p style={{ maxWidth: '440px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          What happens every time a patient interacts with Bewo.
        </p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        style={{ maxWidth: '640px' }}
      >
        {[
          { step: '01', label: 'Fetch Biomarkers', desc: 'Glucose, steps, medication, HRV, blood pressure, sleep' },
          { step: '02', label: 'HMM Inference', desc: 'Viterbi state classification + confidence score' },
          { step: '03', label: 'Monte Carlo', desc: '2,000 future trajectories, 48-hour crisis probability' },
          { step: '04', label: 'Context Assembly', desc: 'HMM + streaks + mood + engagement + nudge timing + history' },
          { step: '05', label: 'Gemini Reasoning', desc: 'AI analyzes full context, selects optimal tool combination' },
          { step: '06', label: 'Tool Execution', desc: 'Real actions: appointments, alerts, vouchers, reminders' },
          { step: '07', label: 'Audit & Store', desc: 'All actions logged for clinical governance' },
        ].map((s, i) => (
          <motion.div key={s.step} variants={fadeInUp}>
            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              alignItems: 'flex-start',
              padding: 'var(--space-4) var(--space-6)',
              background: i % 2 === 0 ? 'var(--bg-raised)' : 'transparent',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'var(--text-lg)',
                color: 'var(--accent-primary)',
                minWidth: 32,
                lineHeight: 1,
                paddingTop: 2,
              }}>
                {s.step}
              </div>
              <div>
                <div style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {s.desc}
                </div>
              </div>
            </div>
            {i < 6 && (
              <div style={{ paddingLeft: 'var(--space-6)', padding: '2px 0 2px var(--space-8)' }}>
                <ArrowDown size={14} style={{ color: 'var(--border-default)' }} />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* === 16 AGENTIC TOOLS === */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <span style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          <Activity size={24} />
        </span>
        <h2>16 Agentic Tools</h2>
        <p style={{ maxWidth: '480px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Not just chat responses. Real tools that execute real actions against real systems.
        </p>
      </motion.div>

      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}
        variants={staggerContainer} initial="initial" animate="animate"
      >
        <ToolCard icon={CalendarCheck} name="book_appointment" description="Smart scheduling via HealthHub API with optimization" />
        <ToolCard icon={Bell} name="send_caregiver_alert" description="Three-tier severity escalation with rate limiting" />
        <ToolCard icon={Calculator} name="calculate_counterfactual" description="'What if?' Bayesian simulation using HMM projections" />
        <ToolCard icon={Pill} name="suggest_medication_adjustment" description="Dose recommendations for doctor review (never auto-adjusts)" />
        <ToolCard icon={Clock} name="set_reminder" description="Medication, exercise, appointment reminders with optimal timing" />
        <ToolCard icon={Stethoscope} name="alert_nurse" description="Direct nurse notification with priority levels to dashboard" />
        <ToolCard icon={Users} name="alert_family" description="Family member notifications with configurable urgency tiers" />
        <ToolCard icon={Gift} name="award_voucher_bonus" description="Loss-aversion gamification: $5 weekly voucher with decay" />
        <ToolCard icon={Video} name="request_medication_video" description="Personalized medication education video generation" />
        <ToolCard icon={Dumbbell} name="suggest_activity" description="Context-aware suggestions based on time, weather, mobility" />
        <ToolCard icon={AlertTriangle} name="escalate_to_doctor" description="Formal clinical escalation with full HMM context attached" />
        <ToolCard icon={Utensils} name="recommend_food" description="Culturally appropriate Singapore food with glycemic impact" />
        <ToolCard icon={Brain} name="schedule_proactive_checkin" description="AI-initiated check-ins based on risk patterns" />
        <ToolCard icon={Award} name="celebrate_streak" description="Streak milestone celebrations with voucher bonuses" />
        <ToolCard icon={FileText} name="generate_weekly_report" description="Weekly health summary with letter grade" />
        <ToolCard icon={Settings} name="adjust_nudge_schedule" description="Shift reminders to learned optimal times" />
      </motion.div>
    </section>
  </motion.div>
);
