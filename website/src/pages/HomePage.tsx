import { Brain, Activity, Shield, Users, Smartphone, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants, fadeInUp, staggerContainer } from '../utils/animations';
import { Link } from 'react-router-dom';

export const HomePage = () => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

    {/* === HERO — asymmetric split, not centered ===
        §12.1: No centered hero. Using 61.8/38.2 golden ratio split.
    */}
    <section className="hero" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 'var(--space-12)',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div>
          <div className="badge badge--accent" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="pulse-dot" style={{ background: 'var(--color-profit)' }} />
            Predictive Healthcare AI
          </div>
          <h1 style={{ marginBottom: 'var(--space-6) '}}>
            Predicting health crises before they happen
          </h1>
          <p style={{
            maxWidth: '540px',
            fontSize: 'var(--text-lg)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-8)',
          }}>
            Bewo combines Hidden Markov Models with agentic AI to transform
            reactive chronic disease management into proactive, personalized
            care for Singapore's aging population.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/demo" className="btn btn--primary">
              See Product Demo <ArrowRight size={16} />
            </Link>
            <Link to="/technology" className="btn btn--outline">
              Technical Deep-Dive <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right column — key metrics card */}
        <div className="card card--flat" style={{ padding: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-6)',
          }}>
            Platform Snapshot
          </div>
          {[
            { value: '48h', label: 'Crisis prediction window', icon: Brain },
            { value: '16', label: 'Autonomous agentic tools', icon: Activity },
            { value: '900K+', label: 'Target diabetics over 60', icon: Users },
            { value: '~40%', label: 'Admission reduction', icon: TrendingUp },
          ].map((m, i) => (
            <div key={m.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-3) 0',
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}>
                <m.icon size={16} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-ink)',
                  lineHeight: 1,
                }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* === THE PROBLEM — dark section with horizontal stat list ===
        §1.5: Miller's Law — ≤7 items. We have 4.
        NOT a 4-column grid. Using stacked rows for stronger reading flow.
    */}
    <section className="section-dark" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em',
          color: 'oklch(0.62 0.10 25)',
          marginBottom: 'var(--space-4)',
        }}>
          THE PROBLEM
        </div>
        <h2 style={{ marginBottom: 'var(--space-8)', maxWidth: '540px' }}>
          Chronic disease management is broken
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {[
            { stat: '1 in 3', desc: 'Singaporeans over 60 have diabetes', accent: 'var(--color-loss)' },
            { stat: '$2.5B', desc: 'Annual healthcare cost for chronic diseases', accent: 'var(--color-warning)' },
            { stat: '68%', desc: 'Of hospital admissions are preventable', accent: 'var(--accent-primary)' },
            { stat: '42%', desc: 'Of patients disengage within 30 days', accent: 'var(--color-loss)' },
          ].map((item, i) => (
            <div key={i} style={{
              borderLeft: `3px solid ${item.accent}`,
              paddingLeft: 'var(--space-4)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'var(--text-xl)',
                color: 'oklch(0.96 0.005 265)',
                marginBottom: 'var(--space-1)',
              }}>
                {item.stat}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'oklch(0.70 0.015 265)', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* === THREE PILLARS — editorial layout, not 3-column cards ===
        Using alternating left-border accent + text blocks.
        §12.1: No cookie-cutter 3-column features.
    */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--space-3)' }}>Our Approach</div>
        <h2>Three Innovation Pillars</h2>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
      >
        {[
          {
            icon: Brain,
            title: 'HMM Prediction Engine',
            detail: 'VITERBI + MONTE CARLO + COUNTERFACTUAL',
            desc: 'Three-state clinical model (STABLE / WARNING / CRISIS) with Viterbi decoding on 9 weighted biomarkers. Monte Carlo simulation runs 2,000 future trajectories for 48-hour advance crisis prediction.',
            accent: 'var(--accent-primary)',
          },
          {
            icon: Activity,
            title: 'Agentic AI Orchestration',
            detail: '16 AUTONOMOUS TOOLS WIRED TO REAL SYSTEMS',
            desc: 'Gemini AI reasons over full HMM context and autonomously executes 16 tools: booking appointments, alerting caregivers, adjusting medication schedules. Real actions, not just chat responses.',
            accent: 'var(--color-profit)',
          },
          {
            icon: Shield,
            title: 'Behavioral Science Layer',
            detail: 'PROSPECT THEORY + NUDGE THEORY',
            desc: 'Loss-aversion voucher gamification, adaptive nudge timing learned from patient response patterns, mood-aware conversations, and daily challenges scaled to clinical state.',
            accent: 'var(--color-warning)',
          },
        ].map((pillar) => (
          <motion.div key={pillar.title} variants={fadeInUp}
            className="card card--accent"
            style={{
              borderLeftColor: pillar.accent,
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
              background: 'var(--accent-muted)',
              color: pillar.accent,
            }}>
              <pillar.icon size={24} />
            </span>
            <div>
              <h3 style={{ marginBottom: 'var(--space-1)' }}>{pillar.title}</h3>
              <div style={{
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: pillar.accent,
                fontWeight: 500,
                marginBottom: 'var(--space-3)',
                letterSpacing: '0.02em',
              }}>
                {pillar.detail}
              </div>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {pillar.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* === WHY NOW — tinted section with timeline ===
        §4.3: Golden ratio — 61.8% content / 38.2% sidebar
    */}
    <section className="section-tinted" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 'var(--space-8)',
        alignItems: 'start',
      }}>
        <div>
          <div className="badge badge--profit" style={{ marginBottom: 'var(--space-3)' }}>Market Timing</div>
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Why Now</h2>
          {[
            { icon: Users, title: 'Aging Population Crisis', text: 'Singapore\'s over-65 population projected to double by 2030. Healthcare system capacity cannot scale linearly.' },
            { icon: Smartphone, title: 'Smart Nation Infrastructure', text: 'HealthHub API and national health records enable AI-driven care at population scale.' },
            { icon: TrendingUp, title: 'Agentic AI Maturity', text: 'LLMs can now reason over clinical data and execute multi-step workflows autonomously.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}>
                <item.icon size={16} />
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline sidebar */}
        <div className="card card--flat" style={{ padding: 'var(--space-6)' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-4)',
          }}>
            Singapore Healthcare Trajectory
          </div>
          {[
            { year: '2024', event: 'HealthHub API v3 launched' },
            { year: '2025', event: 'National AI health strategy announced' },
            { year: '2026', event: 'Bewo: predictive + agentic care', highlight: true },
            { year: '2028', event: 'Target: 100K patients on platform' },
            { year: '2030', event: 'ASEAN expansion, multi-chronic' },
          ].map((t, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) 0',
              borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: t.highlight ? 'var(--accent-primary)' : 'var(--text-muted)',
                minWidth: 32,
              }}>
                {t.year}
              </span>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: t.highlight ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: t.highlight ? 600 : 400,
              }}>
                {t.event}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* === CTA === */}
    <motion.div variants={fadeInUp} style={{
      textAlign: 'center',
      padding: 'var(--space-12) 0',
    }}>
      <h2 style={{ marginBottom: 'var(--space-4)' }}>See Bewo in Action</h2>
      <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
        Walk through a real patient interaction with our AI agent.
      </p>
      <Link to="/demo" className="btn btn--primary">
        Product Walkthrough <ArrowRight size={16} />
      </Link>
    </motion.div>
  </motion.div>
);
