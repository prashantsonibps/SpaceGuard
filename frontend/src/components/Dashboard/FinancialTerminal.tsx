'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent } from '@/components/Dashboard/EventsPanel'
import { api, Bet } from '@/lib/api'
import { statusClasses, riskClasses, financialColors, accent, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

const STARTING_PORTFOLIO_VALUE = 10000

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`
  return `$${val.toFixed(2)}`
}

function ExposureBar({ label, value, max, risk }: { label: string; value: number; max: number; risk: string }) {
  const { theme } = useTheme()
  const pct = Math.max(1, Math.round((value / max) * 20))
  const percent = Math.round((value / max) * 100)
  const riskColor: Record<string, string> = {
    CRITICAL: riskClasses[theme].CRITICAL.text,
    HIGH: riskClasses[theme].HIGH.text,
    MEDIUM: riskClasses[theme].MEDIUM.text,
    LOW: riskClasses[theme].LOW.text,
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/45 text-[10px]">{label}</span>
          <span className={`text-[8px] font-bold tracking-wider ${riskColor[risk]}`}>{risk}</span>
        </div>
        <span className="text-slate-500 dark:text-white/45 text-[10px] tabular-nums">{formatCurrency(value)}</span>
      </div>
      <div className={`text-[9px] font-mono leading-none ${riskColor[risk]} opacity-70`}>
        {'█'.repeat(pct)}{'░'.repeat(20 - pct)}
        <span className="text-slate-300 dark:text-white/20 ml-1.5 text-[8px]">{percent}%</span>
      </div>
    </div>
  )
}

// Demo data shown when no userId / Firebase unavailable
const demoAgentMessages = [
  '▶ Analyzing conjunction event EVT-001: ISS × Debris-2847',
  '▶ Miss distance: 1.2 km — BELOW collision avoidance threshold (5 km)',
  '▶ Computing portfolio exposure: $850M in ISS-adjacent contracts',
  '▶ Hedge recommendation: SpaceCraft liability put at $45M notional',
  '▶ Executing hedge via W&B Weave trace a3f7b2...',
  '✓ Hedge executed. Audit trail logged to Weave.',
  '▶ Monitoring EVT-002: Starlink-1492 × COSMOS-2251 DEB',
  '▶ TCA in 8h 51m · probability 67.2% · $320M exposure',
  '▶ Evaluating hedge instruments for EVT-002...',
  '▶ Satellite insurance call selected · $18.2M notional · 1.5x leverage',
]

const demoBets: Bet[] = [
  { id: 'B-0891', user_id: 'demo', event_id: 'evt-001', event_type: 'Collision', outcome: 'Miss > 5km', amount: 250, status: 'WON', created_at: new Date(Date.now() - 3600000).toISOString(), payout: 450 },
  { id: 'B-0890', user_id: 'demo', event_id: 'evt-002', event_type: 'Debris', outcome: 'Impact prob > 50%', amount: 100, status: 'LOST', created_at: new Date(Date.now() - 7200000).toISOString(), payout: 0 },
  { id: 'B-0889', user_id: 'demo', event_id: 'evt-003', event_type: 'Conjunction', outcome: 'TCA within 2 hours', amount: 500, status: 'PENDING', created_at: new Date(Date.now() - 1800000).toISOString(), payout: 0 },
]

// ── Main export ───────────────────────────────────────────────────────────────
export function FinancialTerminal({ userId }: { userId?: string }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  const [portfolioValue, setPortfolioValue] = useState(STARTING_PORTFOLIO_VALUE)
  const [betHistory, setBetHistory] = useState<Bet[]>(demoBets)
  const [logLines, setLogLines] = useState<string[]>(['▶ Financial Terminal Initialized'])
  const [windowH, setWindowH] = useState<number>(0)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowH(window.innerHeight)
    const onResize = () => setWindowH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Typewriter demo log when no live userId
  useEffect(() => {
    if (userId) return
    let idx = 1
    const timer = setInterval(() => {
      if (idx < demoAgentMessages.length) {
        setLogLines(prev => [...prev, demoAgentMessages[idx]])
        idx++
      }
    }, 1800)
    return () => clearInterval(timer)
  }, [userId])

  // Live Firestore conjunction events
  useEffect(() => {
    const q = query(collection(db, 'conjunction_events'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: ConjunctionEvent[] = []
      const newLogLines: string[] = []
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as ConjunctionEvent
        newEvents.push(data)
        if (data.agent_assessment) {
          newLogLines.push(`▶ AI Assessment (${data.asset_name}): ${data.agent_assessment}`)
          if (data.hedge_status === 'HEDGE') {
            newLogLines.push(`▶ Recommended Action: Buy ${data.hedge_type} for ${formatCurrency(data.hedge_amount_usd || 0)}`)
          } else {
            newLogLines.push(`✓ Action: IGNORE (No hedge required)`)
          }
        }
      })
      if (newEvents.length > 0) setEvents(newEvents)
      if (newLogLines.length > 0) {
        setLogLines(prev => Array.from(new Set([...prev, ...newLogLines])).slice(-50))
      }
    }, () => { /* ignore firebase errors in demo mode */ })
    return () => unsubscribe()
  }, [])

  // Poll user balance + bet history
  useEffect(() => {
    if (!userId) return
    const fetchUserData = async () => {
      try {
        const user = await api.getUser(userId)
        setPortfolioValue(user.balance)
        const bets = await api.getUserBets(userId)
        setBetHistory(bets)
      } catch (e) {
        console.error('Failed to fetch user data', e)
      }
    }
    fetchUserData()
    const interval = setInterval(fetchUserData, 5000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  const totalWagered = betHistory.filter(b => b.status === 'PENDING').reduce((sum, h) => sum + h.amount, 0)
  const varValue = portfolioValue * 0.05
  const activeBets = betHistory.filter(b => b.status === 'PENDING').length
  const expandedH = windowH ? windowH - 80 : 600
  const statusStyle = statusClasses[theme]

  return (
    <motion.div
      className="absolute z-40 rounded-xl overflow-hidden backdrop-blur-md border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-neutral-900/50"
      style={{ bottom: '1rem', left: '1rem' }}
      initial={{ opacity: 0, y: 10, right: '20rem', height: 44 }}
      animate={
        expanded
          ? { opacity: 1, y: 0, right: '1rem', height: expandedH }
          : { opacity: 1, y: 0, right: '20rem', height: 44 }
      }
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        y: { duration: 0.4, ease: 'easeOut' },
        right: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
        height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {/* ── Expandable region — absolutely inset above the bar ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ bottom: 44 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <span className={`font-orbitron text-[11px] font-bold ${textOpacity[theme].secondary} tracking-[0.25em]`}>FINANCIAL TERMINAL</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${riskClasses[theme].LOW.dot} animate-pulse shrink-0`} />
                  <span className={`text-[9px] font-mono ${textOpacity[theme].caption}`}>W&B Weave · Live Audit</span>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className={`text-[9px] font-mono ${textOpacity[theme].caption} border border-black/[0.08] dark:border-white/[0.08] px-2 py-1 rounded
                  hover:${textOpacity[theme].secondary} hover:border-black/20 dark:hover:border-white/20 transition-colors tracking-widest`}
              >
                COLLAPSE ↙
              </button>
            </div>

            {/* Metrics strip — horizontal band with vertical dividers */}
            <div className="flex items-stretch border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              {[
                { label: 'USER BALANCE', value: formatCurrency(portfolioValue), sub: 'Demo USD wallet', color: financialColors[theme].balance },
                { label: 'TOTAL WAGERED', value: formatCurrency(totalWagered), sub: 'Active bets only', color: financialColors[theme].wagered },
                { label: 'VALUE AT RISK 95%', value: formatCurrency(varValue), sub: '1-day horizon', color: financialColors[theme].var },
                { label: 'ACTIVE BETS', value: activeBets.toString(), sub: `${betHistory.length} total placed`, color: textOpacity[theme].secondary },
              ].map((m, i) => (
                <div key={m.label} className={`flex-1 px-5 py-3 ${i > 0 ? 'border-l border-black/[0.06] dark:border-white/[0.06]' : ''}`}>
                  <div className={`text-[8px] font-mono ${textOpacity[theme].caption} tracking-widest mb-1.5`}>{m.label}</div>
                  <div className={`text-xl font-mono font-bold tabular-nums ${m.color}`}>{m.value}</div>
                  <div className={`text-[8px] font-mono ${textOpacity[theme].caption} mt-1`}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* 3-column main grid */}
            <div className="flex-1 overflow-hidden grid grid-cols-[16rem_1fr_22rem] gap-4 px-4 pb-4 pt-3">

              {/* Col 1 — Exposure bars */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-orange-400/50" />
                  <span className={`text-[9px] font-mono ${textOpacity[theme].caption} tracking-widest uppercase`}>Exposure by Event</span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className={`text-[10px] font-mono ${textOpacity[theme].faint}`}>No active events.</div>
                  ) : events.map(e => (
                    <ExposureBar
                      key={e.id}
                      label={e.asset_id}
                      value={betHistory.filter(b => b.event_id === e.id && b.status === 'PENDING').reduce((sum, b) => sum + b.amount, 0)}
                      max={Math.max(1000, totalWagered)}
                      risk={e.risk_level}
                    />
                  ))}
                </div>
                <div className="mt-auto pt-3 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
                  <div className="flex justify-between items-baseline font-mono">
                    <span className={`text-[8px] ${textOpacity[theme].caption} tracking-widest uppercase`}>Total Wagered</span>
                    <span className={`text-[13px] ${financialColors[theme].balance} font-bold tabular-nums`}>{formatCurrency(totalWagered)}</span>
                  </div>
                </div>
              </div>

              {/* Col 2 — Bet history table */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-sky-400/50" />
                  <span className={`text-[9px] font-mono ${textOpacity[theme].caption} tracking-widest uppercase`}>Bet History · Weave Audit Trail</span>
                </div>
                <div className="border border-black/[0.08] dark:border-white/[0.08] rounded-lg overflow-hidden flex flex-col min-h-0 flex-1">
                  <div className="grid grid-cols-[3rem_4.5rem_1fr_4.5rem_5rem] gap-2 px-3 py-2 border-b border-black/[0.08] dark:border-white/[0.08]
                    text-[9px] font-mono tracking-widest uppercase bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
                    <span className={textOpacity[theme].caption}>ID</span>
                    <span className={textOpacity[theme].caption}>TIME</span>
                    <span className={textOpacity[theme].caption}>PREDICTION</span>
                    <span className={textOpacity[theme].caption}>AMOUNT</span>
                    <span className={textOpacity[theme].caption}>STATUS</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {betHistory.length === 0 ? (
                      <div className={`px-3 py-4 text-center text-xs font-mono ${textOpacity[theme].caption}`}>No bets placed yet.</div>
                    ) : betHistory.map((h) => (
                      <div
                        key={h.id}
                        className="grid grid-cols-[3rem_4.5rem_1fr_4.5rem_5rem] gap-2 px-3 py-2.5
                          border-b border-black/[0.06] dark:border-white/[0.06] last:border-0 text-[10px] font-mono hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <span className={`${textOpacity[theme].faint} tabular-nums truncate`}>{h.id.slice(-4)}</span>
                        <span className={`${textOpacity[theme].caption} tabular-nums`}>{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`${textOpacity[theme].secondary} truncate`}>{h.outcome}</span>
                        <span className={`${textOpacity[theme].muted} tabular-nums`}>{formatCurrency(h.amount)}</span>
                        <span className={`font-medium ${statusStyle[h.status] ?? textOpacity[theme].primary}`}>{h.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 3 — Agent reasoning log */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-purple-500/50" />
                  <span className={`text-[9px] font-mono ${textOpacity[theme].caption} tracking-widest uppercase`}>AI Agent Reasoning</span>
                </div>
                <div
                  ref={logRef}
                  className="border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-2.5 flex-1 overflow-y-auto space-y-2 bg-black/[0.02] dark:bg-white/[0.02]"
                >
                  {logLines.map((line, i) => (
                    <motion.div
                      key={i}
                      className={`text-[10px] font-mono leading-relaxed ${
                        line.startsWith('✓') || line.includes('✅') ? riskClasses[theme].LOW.text
                        : line.startsWith('▶') || line.includes('Executing') || line.includes('executing') ? accent[theme].text
                        : textOpacity[theme].faint
                      }`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Always-visible bottom bar — pinned to bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 flex items-center justify-between gap-4 border-t border-black/[0.08] dark:border-white/[0.08]"
           style={{ height: 44 }}>
        <div className="flex items-center gap-5 font-mono text-[10px] min-w-0">
          <span className={`${textOpacity[theme].faint} shrink-0 font-orbitron tracking-widest text-[9px]`}>FINANCIAL</span>
          <span className={textOpacity[theme].muted}>
            Balance <span className={`${financialColors[theme].balance} font-medium`}>{formatCurrency(portfolioValue)}</span>
          </span>
          <span className={textOpacity[theme].muted}>
            Wagered <span className={financialColors[theme].wagered}>{formatCurrency(totalWagered)}</span>
          </span>
          <span className={textOpacity[theme].muted}>
            VaR <span className={financialColors[theme].var}>{formatCurrency(varValue)}</span>
          </span>
          <span className={textOpacity[theme].muted}>
            Bets <span className={textOpacity[theme].secondary}>{activeBets}</span>
          </span>
        </div>

        <AnimatePresence>
          {!expanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setExpanded(true)}
              className={`shrink-0 px-2.5 py-1 rounded text-[9px] font-mono tracking-widest
                ${textOpacity[theme].muted} border border-black/[0.08] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 hover:${textOpacity[theme].secondary}
                transition-colors`}
            >
              EXPAND ↗
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
