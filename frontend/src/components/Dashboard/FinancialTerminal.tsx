'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent } from '@/components/Dashboard/EventsPanel'
import { api, Bet } from '@/lib/api'

// 1. Initial State Definition
const STARTING_PORTFOLIO_VALUE = 10000 // $10k Demo USD for new users

// 2. Formatters
const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`
  return `$${val.toFixed(2)}`
}

const statusStyle: Record<string, string> = {
  EXECUTED: 'text-green-400',
  WON: 'text-green-400',
  LOST: 'text-red-400',
  PENDING: 'text-yellow-400',
  MONITORING: 'text-sky-400',
  CANCELLED: 'text-white/40',
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
        <span className="text-white/45 text-[10px] tabular-nums">{formatCurrency(value)}</span>
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
  totalWagered, 
  activeLines 
}: { 
  onExpand: () => void; 
  portfolioValue: number;
  totalWagered: number;
  activeLines: string[] 
}) {
  return (
    <GlassCard className="absolute z-40 p-2" style={{ bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-white/50">
            BALANCE
          </span>
          <span className="text-sm font-mono font-bold text-white">
            {formatCurrency(portfolioValue)}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono tracking-widest text-white/40">
            WAGERED
          </span>
          <span className="text-sm font-mono text-white/70">
            {formatCurrency(totalWagered)}
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
  betHistory,
  portfolioValue,
  totalWagered,
  logLines
}: { 
  onClose: () => void; 
  events: ConjunctionEvent[];
  betHistory: Bet[];
  portfolioValue: number;
  totalWagered: number;
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
          <span className="text-[10px] font-mono text-white/25">Live USD Balance & Wagers</span>
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
            { label: 'USER BALANCE', value: formatCurrency(portfolioValue), color: 'text-orange-400' },
            { label: 'TOTAL WAGERED', value: formatCurrency(totalWagered), color: 'text-green-400' },
            { label: 'VAR (95% 1-DAY)', value: formatCurrency(varValue), color: 'text-yellow-400' },
            { label: 'ACTIVE BETS', value: betHistory.filter(b => b.status === 'PENDING').length.toString(), color: 'text-white/80' },
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
                    value={betHistory.filter(b => b.event_id === e.id && b.status === 'PENDING').reduce((sum, b) => sum + b.amount, 0)} 
                    max={1000} 
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

        {/* Bet history table */}
        <div>
          <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
            User Bet History
          </div>
          <div className="border border-white/8 rounded overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[8rem_8rem_1fr_5rem_5rem] gap-3 px-3 py-1.5 border-b border-white/8
              text-[9px] font-mono text-white/25 tracking-widest uppercase bg-white/[0.02]">
              <span>Time</span>
              <span>Event Type</span>
              <span>Prediction</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {betHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[8rem_8rem_1fr_5rem_5rem] gap-3 px-3 py-2
                  border-b border-white/5 last:border-0 text-[10px] font-mono
                  hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white/30 tabular-nums">{new Date(h.created_at).toLocaleString()}</span>
                <span className="text-white/40 truncate">{h.event_type}</span>
                <span className="text-white/60 truncate">{h.outcome}</span>
                <span className="text-white/60 tabular-nums">{formatCurrency(h.amount)}</span>
                <span className={statusStyle[h.status] || 'text-white'}>{h.status}</span>
              </div>
            ))}
            {betHistory.length === 0 && (
              <div className="px-3 py-4 text-center text-xs font-mono text-white/30">
                No bets placed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FinancialTerminal({ userId }: { userId?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  
  // Financial State
  const [portfolioValue, setPortfolioValue] = useState(STARTING_PORTFOLIO_VALUE)
  const [betHistory, setBetHistory] = useState<Bet[]>([])
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

  // Poll for user data
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
        try {
            const user = await api.getUser(userId);
            setPortfolioValue(user.balance);
            
            const bets = await api.getUserBets(userId);
            setBetHistory(bets);
        } catch (e) {
            console.error("Failed to fetch user data", e);
        }
    }

    fetchUserData();
    const interval = setInterval(fetchUserData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  // Calculate dynamic totals
  const totalWagered = betHistory.filter(b => b.status === 'PENDING').reduce((sum, h) => {
    return sum + h.amount
  }, 0)

  if (!userId) return null;

  return (
    <>
      {!expanded && (
        <CollapsedBar 
          onExpand={() => setExpanded(true)} 
          portfolioValue={portfolioValue}
          totalWagered={totalWagered}
          activeLines={logLines} 
        />
      )}
      <AnimatePresence>
        {expanded && (
          <ExpandedOverlay 
            onClose={() => setExpanded(false)} 
            events={events}
            betHistory={betHistory}
            portfolioValue={portfolioValue}
            totalWagered={totalWagered}
            logLines={logLines}
          />
        )}
      </AnimatePresence>
    </>
  )
}
