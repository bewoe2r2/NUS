import { motion } from 'framer-motion';
import { pageVariants, fadeInUp, staggerContainer } from '../utils/animations';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Clock, Users, DollarSign, ArrowRight, Globe, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const blueOceanData = [
  { factor: 'Crisis Prediction', bewo: 95, traditional: 10, healthApps: 20 },
  { factor: 'Agentic Actions', bewo: 90, traditional: 5, healthApps: 15 },
  { factor: 'Behavioral Science', bewo: 85, traditional: 15, healthApps: 40 },
  { factor: 'Caregiver Support', bewo: 80, traditional: 60, healthApps: 25 },
  { factor: 'Cultural Adaptation', bewo: 85, traditional: 30, healthApps: 35 },
  { factor: 'Clinical Integration', bewo: 75, traditional: 80, healthApps: 20 },
  { factor: 'Patient Engagement', bewo: 90, traditional: 25, healthApps: 50 },
  { factor: 'Cost Efficiency', bewo: 85, traditional: 30, healthApps: 60 },
];

const errcData = [
  {
    category: 'ELIMINATE',
    items: ['Manual glucose log reviews by nurses', 'Reactive-only crisis response', 'One-size-fits-all reminders', 'Alert fatigue from undifferentiated notifications'],
    accent: 'var(--color-loss)',
  },
  {
    category: 'REDUCE',
    items: ['Preventable hospital admissions (-40%)', 'Nurse workload per patient (-60%)', 'Patient disengagement rate (<15%)', 'Time-to-intervention after deterioration'],
    accent: 'var(--color-warning)',
  },
  {
    category: 'RAISE',
    items: ['Prediction accuracy (48h advance warning)', 'Personalization (mood, timing, culture)', 'Caregiver quality of life', 'Clinical audit transparency'],
    accent: 'var(--accent-primary)',
  },
  {
    category: 'CREATE',
    items: ['Counterfactual "what-if" motivation', 'Autonomous multi-tool workflows', 'Loss-aversion voucher gamification', 'AI-initiated proactive check-ins'],
    accent: 'var(--color-profit)',
  },
];

export const ImpactPage = () => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

    {/* === HERO === */}
    <section className="hero" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ position: 'relative', zIndex: 1 }}>
        <div className="badge badge--profit" style={{ marginBottom: 'var(--space-4)' }}>
          Blue Ocean Strategy
        </div>
        <h1 style={{ maxWidth: '640px', marginBottom: 'var(--space-4)' }}>
          Creating uncontested market space
        </h1>
        <p style={{
          maxWidth: '540px',
          fontSize: 'var(--text-lg)',
          lineHeight: 1.6,
        }}>
          Bewo doesn't compete with existing solutions. It combines capabilities
          that no other platform offers together, making competition irrelevant.
        </p>
      </motion.div>
    </section>

    {/* === IMPACT METRICS ===
        Using 2x2 grid, not 4-column.
        §1.5: ≤7 items. We have 4.
    */}
    <motion.div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-16)' }}
      variants={staggerContainer} initial="initial" animate="animate"
    >
      {[
        { icon: TrendingDown, value: '~40%', label: 'Fewer Admissions', sub: '48h advance crisis prediction', accent: 'var(--color-profit)' },
        { icon: Clock, value: '60%', label: 'Nurse Time Saved', sub: 'Autonomous triage + routing', accent: 'var(--accent-primary)' },
        { icon: Users, value: '85%', label: 'Patient Retention', sub: 'vs. 58% industry average', accent: 'var(--color-warning)' },
        { icon: DollarSign, value: '$1,200', label: 'Saved Per Patient/Year', sub: 'Avoided ER + readmissions', accent: 'var(--color-loss)' },
      ].map((m) => (
        <motion.div key={m.label} variants={fadeInUp} className="stat-block">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: `color-mix(in oklch, ${m.accent} 8%, transparent)`,
            color: m.accent,
            marginBottom: 'var(--space-3)',
          }}>
            <m.icon size={22} />
          </span>
          <div className="stat-block__value">{m.value}</div>
          <div className="stat-block__label">{m.label}</div>
          <div className="stat-block__sub">{m.sub}</div>
        </motion.div>
      ))}
    </motion.div>

    {/* === STRATEGY CANVAS (Radar Chart) === */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--space-3)' }}>Strategy Canvas</div>
        <h2>Value Curve Comparison</h2>
        <p style={{ maxWidth: '480px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Bewo vs. traditional clinic care vs. existing health apps across 8 factors.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="card" style={{ padding: 'var(--space-8)' }}>
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={blueOceanData}>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="factor"
              tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
            />
            <Radar
              name="Bewo"
              dataKey="bewo"
              stroke="oklch(0.42 0.14 265)"
              fill="oklch(0.42 0.14 265)"
              fillOpacity={0.2}
              strokeWidth={2.5}
            />
            <Radar
              name="Traditional Clinic Care"
              dataKey="traditional"
              stroke="oklch(0.52 0.12 25)"
              fill="oklch(0.52 0.12 25)"
              fillOpacity={0.06}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            <Radar
              name="Health Apps"
              dataKey="healthApps"
              stroke="oklch(0.58 0.01 265)"
              fill="oklch(0.58 0.01 265)"
              fillOpacity={0.04}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <Legend wrapperStyle={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              paddingTop: 'var(--space-4)',
            }} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </section>

    {/* === ERRC GRID — dark section === */}
    <section className="section-dark" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>ERRC Grid</h2>
        <p style={{ maxWidth: '440px', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Eliminate-Reduce-Raise-Create applied to chronic disease management.
        </p>

        <motion.div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}
          variants={staggerContainer} initial="initial" animate="animate"
        >
          {errcData.map((section) => (
            <motion.div key={section.category} variants={fadeInUp} style={{
              background: 'oklch(0.22 0.04 265)',
              border: '1px solid oklch(0.32 0.04 265)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              borderTop: `3px solid ${section.accent}`,
            }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: section.accent,
                marginBottom: 'var(--space-4)',
              }}>
                {section.category}
              </div>
              {section.items.map((item, i) => (
                <div key={i} style={{
                  fontSize: 'var(--text-sm)',
                  color: 'oklch(0.78 0.01 265)',
                  padding: 'var(--space-2) 0',
                  borderBottom: i < section.items.length - 1 ? '1px solid oklch(0.30 0.04 265)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <span style={{ color: section.accent, fontSize: 'var(--text-xs)' }}>&#9656;</span>
                  {item}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>

    {/* === COMPETITIVE BAR CHART === */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--space-3)' }}>Competitive Analysis</div>
        <h2>Feature-by-Feature Comparison</h2>
      </motion.div>

      <motion.div variants={fadeInUp} className="card" style={{ padding: 'var(--space-8)' }}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={blueOceanData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }}
            />
            <YAxis
              dataKey="factor"
              type="category"
              tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
              width={120}
            />
            <Tooltip contentStyle={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }} />
            <Bar dataKey="bewo" name="Bewo" fill="oklch(0.42 0.14 265)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="traditional" name="Traditional" fill="oklch(0.52 0.12 25)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="healthApps" name="Health Apps" fill="oklch(0.78 0.01 265)" radius={[0, 4, 4, 0]} />
            <Legend wrapperStyle={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              paddingTop: 'var(--space-4)',
            }} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </section>

    {/* === SCALABILITY ROADMAP === */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="badge badge--profit" style={{ marginBottom: 'var(--space-3)' }}>Growth Path</div>
        <h2>Scalability Roadmap</h2>
      </motion.div>

      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        variants={staggerContainer} initial="initial" animate="animate"
      >
        {[
          {
            icon: Users, phase: 'Phase 1', region: 'Singapore',
            patients: '900K', timeline: '2026-2027',
            desc: 'Diabetics over 60. HealthHub integration. Polyclinic pilot partnerships.',
            accent: 'var(--accent-primary)',
          },
          {
            icon: Globe, phase: 'Phase 2', region: 'ASEAN',
            patients: '50M', timeline: '2028-2029',
            desc: 'Malaysia, Thailand, Indonesia. HMM retraining for regional clinical patterns.',
            accent: 'var(--color-profit)',
          },
          {
            icon: Layers, phase: 'Phase 3', region: 'Multi-Chronic',
            patients: '4+ conditions', timeline: '2030+',
            desc: 'Hypertension, COPD, heart failure. Same agentic architecture, new emission models.',
            accent: 'var(--color-warning)',
          },
        ].map((p) => (
          <motion.div key={p.phase} variants={fadeInUp}
            className="card card--accent"
            style={{
              borderLeftColor: p.accent,
              display: 'grid',
              gridTemplateColumns: '48px 1fr',
              gap: 'var(--space-4)',
              alignItems: 'start',
            }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in oklch, ${p.accent} 8%, transparent)`,
              color: p.accent,
            }}>
              <p.icon size={24} />
            </span>
            <div>
              <div style={{
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: p.accent,
                marginBottom: 'var(--space-1)',
              }}>
                {p.phase} — {p.timeline}
              </div>
              <h3 style={{ marginBottom: 'var(--space-1)' }}>{p.region}</h3>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'var(--text-xl)',
                marginBottom: 'var(--space-2)',
              }}>
                {p.patients}
              </div>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* === CTA === */}
    <motion.div variants={fadeInUp} style={{
      textAlign: 'center',
      padding: 'var(--space-12) 0',
    }}>
      <h2 style={{ marginBottom: 'var(--space-4)' }}>See the Product</h2>
      <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
        Walk through a real patient interaction with Bewo's AI agent.
      </p>
      <Link to="/demo" className="btn btn--primary">
        Product Walkthrough <ArrowRight size={16} />
      </Link>
    </motion.div>
  </motion.div>
);
