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
  const riskColor: Record<string, string> = {
    CRITICAL: 'text-red-400',
    HIGH: 'text-orange-400',
    MEDIUM: 'text-yellow-400',
    LOW: 'text-green-500',
  }
  return (
    <div className="flex items-center gap-3 font-mono text-[10px]">
      <span className="text-white/30 w-16 shrink-0 truncate">{label}</span>
      <span className={`${riskColor[risk]} shrink-0`}>{'█'.repeat(pct)}{'░'.repeat(20 - pct)}</span>
      <span className="text-white/50 tabular-nums shrink-0">{formatCurrency(value)}</span>
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

  return (
    <>
      {!expanded && (
        <CollapsedBar 
          onExpand={() => setExpanded(true)} 
          portfolioValue={portfolioValue}
          totalHedged={totalHedged}
          activeLines={logLines} 
        />
      )}
      <AnimatePresence>
        {expanded && (
          <ExpandedOverlay 
            onClose={() => setExpanded(false)} 
            events={events}
            hedgeHistory={hedgeHistory}
            portfolioValue={portfolioValue}
            totalHedged={totalHedged}
            logLines={logLines}
          />
        )}
      </AnimatePresence>
    </>
  )
}
