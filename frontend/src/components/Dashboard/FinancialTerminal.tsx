'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent } from '@/components/Dashboard/EventsPanel'

// 1. Initial State Definition
const STARTING_PORTFOLIO_VALUE = 10000000 // $10M Demo USD

interface HedgeRecord {
  id: string
  timestamp: string
  instrument: string
  notional: string
  status: 'EXECUTED' | 'PENDING' | 'MONITORING'
  pnl: string
  weaveId: string
  event?: string
}

// 2. Formatters
const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`
  return `$${val}`
}

const statusStyle: Record<string, string> = {
  EXECUTED: 'text-green-400',
  PENDING: 'text-yellow-400',
  MONITORING: 'text-sky-400',
}

function ExposureBar({ label, value, max, risk }: { label: string; value: number; max: number; risk: string }) {
  const pct = Math.max(1, Math.round((value / max) * 20))
  const percent = Math.round((value / max) * 100)
  const riskColor: Record<string, string> = {
    CRITICAL: 'text-red-400',
    HIGH: 'text-orange-400',
    MEDIUM: 'text-yellow-400',
    LOW: 'text-green-500',
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="text-white/45 text-[10px]">{label}</span>
          <span className={`text-[8px] font-bold tracking-wider ${riskColor[risk]}`}>{risk}</span>
        </div>
        <span className="text-white/45 text-[10px] tabular-nums">${value}M</span>
      </div>
      <div className={`text-[9px] font-mono leading-none ${riskColor[risk]} opacity-70`}>
        {'█'.repeat(pct)}{'░'.repeat(20 - pct)}
        <span className="text-white/20 ml-1.5 text-[8px]">{percent}%</span>
      </div>
    </div>
  )
}

// ── Collapsed strip (always visible) ─────────────────────────────────────────
function CollapsedBar({ 
  onExpand, 
  portfolioValue, 
  totalHedged, 
  activeLines 
}: { 
  onExpand: () => void; 
  portfolioValue: number;
  totalHedged: number;
  activeLines: string[] 
}) {
  return (
    <GlassCard className="absolute z-40 p-2" style={{ bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-white/50">
            PORTFOLIO
          </span>
          <span className="text-sm font-mono font-bold text-white">
            {formatCurrency(portfolioValue)}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono tracking-widest text-white/40">
            HEDGED
          </span>
          <span className="text-sm font-mono text-white/70">
            {formatCurrency(totalHedged)}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        {/* Latest agent line */}
        {activeLines.length > 0 && (
          <div className="flex-1 min-w-0 hidden lg:block">
            <span
              className={`text-[10px] font-mono truncate block ${
                activeLines[activeLines.length - 1].includes('✅') ? 'text-green-400' : 'text-sky-400'
              }`}
            >
              {activeLines[activeLines.length - 1]}
            </span>
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="shrink-0 px-2.5 py-1 rounded text-[9px] font-mono tracking-widest
            text-white/40 border border-white/10 hover:border-white/25 hover:text-white/60
            transition-colors"
        >
          EXPAND ↗
        </button>
      </div>
    </GlassCard>
  )
}

// ── Full-screen expanded overlay ──────────────────────────────────────────────
function ExpandedOverlay({ 
  onClose, 
  events, 
  hedgeHistory,
  portfolioValue,
  totalHedged,
  logLines
}: { 
  onClose: () => void; 
  events: ConjunctionEvent[];
  hedgeHistory: HedgeRecord[];
  portfolioValue: number;
  totalHedged: number;
  logLines: string[];
}) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  // Fake static var value for demo 
  const varValue = portfolioValue * 0.05

  return (
    <motion.div
      className="fixed inset-8 z-50 bg-[#020817]/95 backdrop-blur-sm flex flex-col rounded-lg border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-orbitron text-xs font-bold text-white/70 tracking-[0.25em]">
            FINANCIAL TERMINAL
          </span>
          <span className="text-[10px] font-mono text-white/25">Live USD Balance & Hedges</span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-mono text-white/35 border border-white/10 px-2.5 py-1 rounded
            hover:text-white/60 hover:border-white/25 transition-colors tracking-widest"
        >
          COLLAPSE ↙
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        {/* Key metrics row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'PORTFOLIO VALUE', value: formatCurrency(portfolioValue), color: 'text-orange-400' },
            { label: 'TOTAL HEDGED', value: formatCurrency(totalHedged), color: 'text-green-400' },
            { label: 'VAR (95% 1-DAY)', value: formatCurrency(varValue), color: 'text-yellow-400' },
            { label: 'ACTIVE POSITIONS', value: hedgeHistory.length.toString(), color: 'text-white/80' },
          ].map((m) => (
            <div key={m.label} className="border border-white/8 rounded px-4 py-3 bg-white/[0.01]">
              <div className="text-[9px] font-mono text-white/30 tracking-widest mb-1">{m.label}</div>
              <div className={`text-xl font-mono font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Exposure by event (ASCII bars) */}
          <div>
            <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
              Portfolio Exposure by Event
            </div>
            <div className="space-y-1.5 bg-black/20 p-4 rounded border border-white/5 h-48 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-white/30 text-xs font-mono">No active exposures.</div>
              ) : (
                events.map(e => (
                  <ExposureBar 
                    key={e.id}
                    label={e.asset_id} 
                    value={e.hedge_amount_usd || 100000} // Mock exposure based on hedge amount
                    max={500000} 
                    risk={e.risk_level} 
                  />
                ))
              )}
            </div>
          </div>

          {/* AI reasoning log */}
          <div>
            <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
              Mistral / Gemini AI Agent Log
            </div>
            <div
              ref={logRef}
              className="border border-white/8 bg-black/20 rounded px-3 py-3 h-48 overflow-y-auto space-y-1.5"
            >
              {logLines.map((line, i) => (
                <motion.div
                  key={i}
                  className={`text-[10px] font-mono ${
                    line.includes('✅') ? 'text-green-400' : 'text-sky-400'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Hedge history table */}
        <div>
          <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
            Hedge History
          </div>
          <div className="border border-white/8 rounded overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[5rem_6rem_1fr_5rem_5rem] gap-3 px-3 py-1.5 border-b border-white/8
              text-[9px] font-mono text-white/25 tracking-widest uppercase bg-white/[0.02]">
              <span>Time</span>
              <span>Asset</span>
              <span>Instrument</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {hedgeHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[5rem_6rem_1fr_5rem_5rem] gap-3 px-3 py-2
                  border-b border-white/5 last:border-0 text-[10px] font-mono
                  hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white/30 tabular-nums">{h.timestamp}</span>
                <span className="text-white/40 truncate">{h.event}</span>
                <span className="text-white/60 truncate">{h.instrument}</span>
                <span className="text-white/60 tabular-nums">{h.notional}</span>
                <span className={statusStyle[h.status]}>{h.status}</span>
              </div>
            ))}
            {hedgeHistory.length === 0 && (
              <div className="px-3 py-4 text-center text-xs font-mono text-white/30">
                No hedges executed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FinancialTerminal() {
  const [expanded, setExpanded] = useState(false)
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  
  // Financial State
  const [portfolioValue, setPortfolioValue] = useState(STARTING_PORTFOLIO_VALUE)
  const [hedgeHistory, setHedgeHistory] = useState<HedgeRecord[]>([])
  const [logLines, setLogLines] = useState<string[]>(['▶ Financial Terminal Initialized'])

  // Listen to Firestore events to build the terminal data
  useEffect(() => {
    const q = query(collection(db, 'conjunction_events'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: ConjunctionEvent[] = []
      let newLogLines: string[] = []
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as ConjunctionEvent
        newEvents.push(data)
        
        // Auto-generate log lines for AI Agent actions
        if (data.agent_assessment) {
          newLogLines.push(`▶ AI Assessment (${data.asset_name}): ${data.agent_assessment}`)
          if (data.hedge_status === 'HEDGE') {
            newLogLines.push(`▶ Recommended Action: Buy ${data.hedge_type} for ${formatCurrency(data.hedge_amount_usd || 0)}`)
          } else {
            newLogLines.push(`✅ Action: IGNORE (No hedge required)`)
          }
        }
      })
      
      // Update UI state
      setEvents(newEvents)
      if (newLogLines.length > 0) {
        setLogLines(prev => {
          // Keep last 50 lines to prevent memory leak
          const combined = [...prev, ...newLogLines]
          return Array.from(new Set(combined)).slice(-50)
        })
      }
    })
    return () => unsubscribe()
  }, [])

  // Calculate dynamic totals
  const totalHedged = hedgeHistory.reduce((sum, h) => {
    return sum + Number(h.notional.replace(/[^0-9.-]+/g,""))
  }, 0)

  const expandedH = 480
  const displayedLines = logLines

  return (
    <motion.div
      className="absolute z-40 rounded-xl overflow-hidden backdrop-blur-md border border-white/10 bg-neutral-900/50"
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
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-orbitron text-[11px] font-bold text-white/70 tracking-[0.25em]">FINANCIAL TERMINAL</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-[9px] font-mono text-white/25">W&B Weave · Live Audit</span>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-[9px] font-mono text-white/30 border border-white/[0.08] px-2 py-1 rounded
                  hover:text-white/55 hover:border-white/20 transition-colors tracking-widest"
              >
                COLLAPSE ↙
              </button>
            </div>

            {/* Metrics strip — horizontal band with vertical dividers */}
            <div className="flex items-stretch border-b border-white/[0.06] shrink-0">
              {[
                { label: 'PORTFOLIO VALUE', value: '$2.4B', sub: 'Space assets under mgmt', color: 'text-orange-400' },
                { label: 'TOTAL HEDGED', value: '$72.3M', sub: '3.0% coverage ratio', color: 'text-green-400' },
                { label: 'VALUE AT RISK 95%', value: '$124M', sub: '1-day horizon', color: 'text-yellow-400' },
                { label: 'OPEN POSITIONS', value: '7', sub: '2 critical · 1 pending', color: 'text-white/70' },
              ].map((m, i) => (
                <div key={m.label} className={`flex-1 px-5 py-3 ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}>
                  <div className="text-[8px] font-mono text-white/25 tracking-widest mb-1.5">{m.label}</div>
                  <div className={`text-xl font-mono font-bold tabular-nums ${m.color}`}>{m.value}</div>
                  <div className="text-[8px] font-mono text-white/20 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* 3-column main grid */}
            <div className="flex-1 overflow-hidden grid grid-cols-[16rem_1fr_22rem] gap-4 px-4 pb-4 pt-3">

              {/* Col 1 — Exposure bars */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-orange-500/50" />
                  <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Exposure by Event</span>
                </div>
                <div className="space-y-3">
                  <ExposureBar label="EVT-001" value={850} max={850} risk="CRITICAL" />
                  <ExposureBar label="EVT-002" value={320} max={850} risk="HIGH" />
                  <ExposureBar label="EVT-003" value={180} max={850} risk="MEDIUM" />
                  <ExposureBar label="EVT-004" value={45}  max={850} risk="LOW" />
                  <ExposureBar label="EVT-005" value={12}  max={850} risk="LOW" />
                </div>
                <div className="mt-auto pt-3 border-t border-white/[0.06] shrink-0">
                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-[8px] text-white/20 tracking-widest uppercase">Total Exposure</span>
                    <span className="text-[13px] text-orange-400 font-bold tabular-nums">$1,407M</span>
                  </div>
                </div>
              </div>

              {/* Col 2 — Hedge history table */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-sky-500/50" />
                  <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Hedge History · Weave Audit Trail</span>
                </div>
                <div className="border border-white/[0.08] rounded-lg overflow-hidden flex flex-col min-h-0 flex-1">
                  <div className="grid grid-cols-[3rem_4.5rem_1fr_5.5rem_4rem_6rem] gap-2 px-3 py-2 border-b border-white/[0.08]
                    text-[9px] font-mono text-white/20 tracking-widest uppercase bg-white/[0.02] shrink-0">
                    <span>ID</span><span>TIME</span><span>INSTRUMENT</span>
                    <span>NOTIONAL</span><span>P&L</span><span>STATUS</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {hedgeHistory.map((h) => (
                      <div
                        key={h.id}
                        className="grid grid-cols-[3rem_4.5rem_1fr_5.5rem_4rem_6rem] gap-2 px-3 py-2.5
                          border-b border-white/[0.06] last:border-0 text-[10px] font-mono hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-white/30 tabular-nums">{h.id}</span>
                        <span className="text-white/25 tabular-nums">{h.timestamp}</span>
                        <span className="text-white/60 truncate">{h.instrument}</span>
                        <span className="text-white/45 tabular-nums">{h.notional}</span>
                        <span className={h.pnl.startsWith('+') ? 'text-green-400 font-medium' : 'text-white/25'}>{h.pnl}</span>
                        <span className={`font-medium ${statusStyle[h.status]}`}>{h.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 3 — Agent reasoning log */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-0.5 h-3 rounded-full bg-purple-500/50" />
                  <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">AI Agent Reasoning</span>
                </div>
                <div
                  ref={logRef}
                  className="border border-white/[0.08] rounded-lg px-3 py-2.5 flex-1 overflow-y-auto space-y-2 bg-white/[0.02]"
                >
                  {displayedLines.map((line, i) => (
                    <motion.div
                      key={i}
                      className={`text-[10px] font-mono leading-relaxed ${
                        line.startsWith('✓') ? 'text-green-400'
                        : line.includes('Executing') || line.includes('executing') ? 'text-sky-400'
                        : 'text-white/35'
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
      <div className="absolute bottom-0 left-0 right-0 px-3 flex items-center justify-between gap-4 border-t border-white/[0.08]"
           style={{ height: 44 }}>
        <div className="flex items-center gap-5 font-mono text-[10px] min-w-0">
          <span className="text-white/35 shrink-0 font-orbitron tracking-widest text-[9px]">FINANCIAL</span>
          <span className="text-white/40">
            Portfolio <span className="text-orange-400 font-medium">$2.4B</span>
          </span>
          <span className="text-white/40">
            Hedged <span className="text-green-400">$72.3M</span>
          </span>
          <span className="text-white/40">
            VaR <span className="text-yellow-400">$124M</span>
          </span>
          <span className="text-white/40">
            Positions <span className="text-white/70">7</span>
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
              className="shrink-0 px-2.5 py-1 rounded text-[9px] font-mono tracking-widest
                text-white/40 border border-white/[0.08] hover:border-white/25 hover:text-white/60
                transition-colors"
            >
              EXPAND ↗
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
