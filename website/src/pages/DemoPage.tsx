import { motion } from 'framer-motion';
import { pageVariants, fadeInUp, staggerContainer } from '../utils/animations';
import {
  Activity, TrendingUp, Heart,
  Gift, BarChart3, Smile, Clock, AlertCircle, Award,
} from 'lucide-react';

interface ChatBubbleProps {
  from: 'patient' | 'bewo';
  message: string;
  time: string;
  mood?: string;
}

const ChatBubble = ({ from, message, time, mood }: ChatBubbleProps) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: from === 'patient' ? 'flex-end' : 'flex-start',
    marginBottom: 'var(--space-3)',
  }}>
    {from === 'bewo' && (
      <div style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--accent-primary)',
        marginBottom: 'var(--space-1)',
        fontFamily: 'var(--font-mono)',
      }}>
        BEWO AI
      </div>
    )}
    <div style={{
      background: from === 'patient'
        ? 'var(--accent-primary)'
        : 'var(--bg-raised)',
      color: from === 'patient' ? 'oklch(0.99 0 0)' : 'var(--text-ink)',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: from === 'patient' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      maxWidth: '85%',
      fontSize: 'var(--text-sm)',
      lineHeight: 1.5,
    }}>
      {message}
    </div>
    <div style={{
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 'var(--space-1)',
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'center',
    }}>
      <span>{time}</span>
      {mood && (
        <span className="badge badge--warning" style={{
          fontSize: '9px',
          padding: '1px var(--space-2)',
        }}>
          mood: {mood}
        </span>
      )}
    </div>
  </div>
);

interface ActionLogProps {
  icon: React.ComponentType<{ size: number }>;
  action: string;
  detail: string;
  accent?: string;
}

const ActionLog = ({ icon: Icon, action, detail, accent = 'var(--accent-primary)' }: ActionLogProps) => (
  <div style={{
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      background: `color-mix(in oklch, ${accent} 10%, transparent)`,
      color: accent,
    }}>
      <Icon size={14} />
    </span>
    <div>
      <div style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-ink)',
      }}>
        {action}
      </div>
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {detail}
      </div>
    </div>
  </div>
);

export const DemoPage = () => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">

    {/* === HERO === */}
    <section className="hero" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ position: 'relative', zIndex: 1 }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--space-4)' }}>
          <span className="pulse-dot" style={{ background: 'var(--color-profit)' }} />
          Live Product Demo
        </div>
        <h1 style={{ maxWidth: '640px', marginBottom: 'var(--space-4)' }}>
          A day in the life of Mdm. Tan
        </h1>
        <p style={{
          maxWidth: '540px',
          fontSize: 'var(--text-lg)',
          lineHeight: 1.6,
        }}>
          68 years old, managing Type 2 Diabetes. Watch how Bewo's AI agent
          proactively manages her health throughout the day.
        </p>
      </motion.div>
    </section>

    {/* === PATIENT VIEW: Phone + Actions ===
        §4.3: Golden ratio split ~61.8/38.2
    */}
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <div className="badge badge--warning" style={{ marginBottom: 'var(--space-3)' }}>
          8:30 AM — Morning Check-in
        </div>
        <h2>Patient Conversation</h2>
        <p style={{
          maxWidth: '480px',
          fontSize: 'var(--text-sm)',
          marginTop: 'var(--space-2)',
        }}>
          AI-initiated proactive check-in. No user trigger needed.
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 'var(--space-8)',
        alignItems: 'start',
      }}>
        {/* Phone Mockup */}
        <motion.div variants={fadeInUp}>
          <div className="phone-frame">
            <div className="phone-screen">
              {/* Chat header */}
              <div style={{
                background: 'var(--accent-primary)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'oklch(1 0 0 / 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Heart size={16} color="white" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    Bewo Health
                  </div>
                  <div style={{ color: 'oklch(1 0 0 / 0.6)', fontSize: 'var(--text-xs)' }}>
                    AI Health Companion
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className="pulse-dot" style={{ background: 'oklch(0.70 0.15 160)' }} />
                </div>
              </div>

              {/* Chat body */}
              <div style={{ padding: 'var(--space-4)', minHeight: 440 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-raised)',
                    padding: '2px var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    Proactive Check-in
                  </span>
                </div>
                <ChatBubble from="bewo" message="Good morning, Mdm. Tan! I noticed your glucose was a bit high yesterday evening at 9.8 mmol/L. How are you feeling today?" time="8:30 AM" />
                <ChatBubble from="patient" message="aiya still tired lah, forgot my medicine last night" time="8:32 AM" mood="frustrated" />
                <ChatBubble from="bewo" message="I understand, it happens. Taking your Metformin now would reduce your crisis risk from 35% to 12%. That's a big difference! I've set a reminder for tonight at 7 PM." time="8:33 AM" />
                <ChatBubble from="patient" message="ok ok i take now. what should i eat?" time="8:35 AM" />
                <ChatBubble from="bewo" message="Great choice! Try congee with fish and vegetables — low glycemic impact (GI: 4.2). Your 6-day medication streak stays alive!" time="8:36 AM" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions + Data Panel */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
        >
          {/* Agent Actions */}
          <motion.div variants={fadeInUp} className="card card--flat" style={{ padding: 'var(--space-6)' }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-4)',
            }}>
              Agent Actions Executed
            </div>
            <ActionLog icon={Activity} action="run_hmm_inference" detail="State: WARNING (72% confidence). Crisis risk: 35% within 24h." accent="var(--color-warning)" />
            <ActionLog icon={TrendingUp} action="calculate_counterfactual" detail="Metformin now: risk drops 35% to 12%. STRONGLY RECOMMENDED." accent="var(--color-profit)" />
            <ActionLog icon={Smile} action="detect_mood" detail="Detected: frustrated (confidence: 0.7). Tone adapted: empathetic." accent="var(--accent-primary)" />
            <ActionLog icon={Clock} action="set_reminder" detail="Medication reminder set for 7:00 PM tonight." accent="var(--accent-primary)" />
            <ActionLog icon={Heart} action="recommend_food" detail="Congee with fish (GI: 4.2). Kaya toast avoided." accent="var(--color-profit)" />
            <ActionLog icon={Gift} action="award_voucher_bonus" detail="$0.50 bonus for taking medication. Weekly balance: $4.50." accent="var(--color-profit)" />
          </motion.div>

          {/* Glucose Readings */}
          <motion.div variants={fadeInUp} className="card card--flat" style={{ padding: 'var(--space-6)' }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-4)',
            }}>
              Today's Glucose Readings
            </div>
            {[
              { time: '6:00 AM', value: 8.1, accent: 'var(--color-warning)' },
              { time: '8:00 AM', value: 7.4, accent: 'var(--color-warning)' },
              { time: '10:30 AM', value: 6.8, accent: 'var(--color-profit)' },
            ].map((r) => (
              <div key={r.time} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-2) 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}>
                  {r.time}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}>
                  <div style={{
                    width: 64,
                    height: 4,
                    background: 'var(--bg-raised)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min((r.value / 12) * 100, 100)}%`,
                      height: '100%',
                      background: r.accent,
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: r.accent,
                    minWidth: 64,
                    textAlign: 'right',
                  }}>
                    {r.value} mmol/L
                  </span>
                </div>
              </div>
            ))}
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-profit)',
              marginTop: 'var(--space-3)',
              fontStyle: 'italic',
            }}>
              Trend: improving. Expected in target range by afternoon.
            </div>
          </motion.div>

          {/* Streaks */}
          <motion.div variants={fadeInUp} className="card card--flat" style={{ padding: 'var(--space-6)' }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-4)',
            }}>
              Active Streaks
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
              {[
                { label: 'Medication', days: 6, best: 12 },
                { label: 'Glucose Log', days: 14, best: 14 },
                { label: 'App Login', days: 9, best: 21 },
              ].map((s) => (
                <div key={s.label} style={{
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-raised)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    fontSize: 'var(--text-xl)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}>
                    {s.days}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>best: {s.best}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* === NURSE DASHBOARD — dark section === */}
    <section className="section-dark" style={{ marginBottom: 'var(--space-16)' }}>
      <motion.div variants={fadeInUp}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            color: 'oklch(0.62 0.08 265)',
            marginBottom: 'var(--space-3)',
          }}>
            NURSE DASHBOARD
          </div>
          <h2>Clinical Oversight View</h2>
          <p style={{ maxWidth: '440px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            All patients. All alerts. Priority-sorted. AI-triaged.
          </p>
        </div>

        {/* Alert Queue */}
        <div style={{
          background: 'oklch(0.22 0.04 265)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid oklch(0.30 0.04 265)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'oklch(0.55 0.04 265)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--space-4)',
          }}>
            Priority Alert Queue
          </div>
          {[
            { priority: 'CRITICAL', patient: 'Mr. Lim (P003)', message: 'Glucose > 15 mmol/L for 6 hours. 3 missed medications. Family auto-alerted.', time: '2 min ago', accent: 'var(--color-loss)', icon: AlertCircle },
            { priority: 'WARNING', patient: 'Mdm. Tan (P001)', message: 'WARNING state. Missed evening med. Counterfactual shown, patient complied.', time: '15 min ago', accent: 'var(--color-warning)', icon: Activity },
            { priority: 'INFO', patient: 'Mr. Goh (P007)', message: 'Weekly report generated. Grade: A. 14-day medication streak achieved.', time: '1 hr ago', accent: 'var(--color-profit)', icon: Award },
          ].map((alert, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) 0',
              borderBottom: i < 2 ? '1px solid oklch(0.30 0.04 265)' : 'none',
              alignItems: 'flex-start',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
                background: `color-mix(in oklch, ${alert.accent} 16%, transparent)`,
                color: alert.accent,
              }}>
                <alert.icon size={14} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-1)',
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'oklch(0.96 0.005 265)' }}>
                    {alert.patient}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: alert.accent,
                    fontWeight: 700,
                  }}>
                    {alert.priority}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'oklch(0.68 0.01 265)', lineHeight: 1.4 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'oklch(0.48 0.01 265)', marginTop: 'var(--space-1)' }}>
                  {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Patient Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
          {[
            { name: 'Mdm. Tan', age: 68, state: 'WARNING', risk: '35%', streak: '6 days', engagement: 78, engLabel: 'Strong', accent: 'var(--color-warning)' },
            { name: 'Mr. Lim', age: 72, state: 'CRISIS', risk: '78%', streak: '0 days', engagement: 22, engLabel: 'Disengaging', accent: 'var(--color-loss)' },
            { name: 'Mr. Goh', age: 65, state: 'STABLE', risk: '5%', streak: '14 days', engagement: 94, engLabel: 'Champion', accent: 'var(--color-profit)' },
          ].map((p) => (
            <div key={p.name} style={{
              background: 'oklch(0.22 0.04 265)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid oklch(0.30 0.04 265)',
              padding: 'var(--space-6)',
              borderTop: `3px solid ${p.accent}`,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-3)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'oklch(0.96 0.005 265)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'oklch(0.52 0.01 265)' }}>
                    Age {p.age}, T2DM
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className="pulse-dot" style={{ background: p.accent }} />
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: p.accent,
                    fontWeight: 700,
                  }}>
                    {p.state}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'oklch(0.68 0.01 265)' }}>
                {[
                  { label: 'Crisis Risk', value: p.risk },
                  { label: 'Med Streak', value: p.streak },
                  { label: 'Engagement', value: p.engLabel },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--space-1) 0',
                    borderBottom: '1px solid oklch(0.28 0.03 265)',
                  }}>
                    <span>{row.label}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                      color: 'oklch(0.82 0.01 265)',
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Engagement bar */}
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 'var(--space-1)',
                }}>
                  <span style={{ color: 'oklch(0.48 0.01 265)' }}>Engagement</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: p.accent }}>{p.engagement}/100</span>
                </div>
                <div style={{
                  height: 4,
                  background: 'oklch(0.28 0.03 265)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${p.engagement}%`,
                    height: '100%',
                    background: p.accent,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>

    {/* === WEEKLY REPORT === */}
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <motion.div variants={fadeInUp} style={{ marginBottom: 'var(--space-8)' }}>
        <span style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 'var(--space-2)' }}>
          <BarChart3 size={24} />
        </span>
        <h2>Auto-Generated Weekly Report</h2>
        <p style={{ maxWidth: '440px', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
          Comprehensive health summary generated automatically every week.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="card" style={{ padding: 'var(--space-8)', maxWidth: 860 }}>
        {/* Report header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}>
              Mdm. Tan — Weekly Health Summary
            </div>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              Week of Feb 14, 2026 — Auto-generated by Bewo Agent
            </div>
          </div>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'oklch(0.52 0.12 160 / 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-profit)',
            }}>
              B+
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          {[
            { label: 'Avg Glucose', value: '7.8 mmol/L', status: 'In range', accent: 'var(--color-profit)' },
            { label: 'Avg Steps', value: '4,200', status: '84% of goal', accent: 'var(--accent-primary)' },
            { label: 'Med Adherence', value: '86%', status: '6-day streak', accent: 'var(--color-profit)' },
            { label: 'Agent Actions', value: '23', status: '91% success', accent: 'var(--accent-primary)' },
          ].map((m) => (
            <div key={m.label} style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-raised)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${m.accent}`,
            }}>
              <div style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-1)',
                letterSpacing: '0.04em',
              }}>
                {m.label}
              </div>
              <div style={{
                fontSize: 'var(--text-lg)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}>
                {m.value}
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: m.accent,
                marginTop: 'var(--space-1)',
                fontWeight: 500,
              }}>
                {m.status}
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div>
          <div style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-2)',
          }}>
            Achievements This Week
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {[
              '6-day medication streak!',
              'Met step goal 5/7 days',
              'Glucose in range 6/7 days',
              'Completed 4 daily challenges',
            ].map((badge) => (
              <span key={badge} className="badge badge--profit">{badge}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  </motion.div>
);
