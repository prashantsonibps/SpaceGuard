'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'

interface HedgeRecord {
  id: string
  timestamp: string
  event: string
  instrument: string
  notional: string
  status: 'EXECUTED' | 'PENDING' | 'MONITORING'
  pnl: string
  weaveId: string
}

const hedgeHistory: HedgeRecord[] = [
  {
    id: 'H-0891',
    timestamp: '14:23:07',
    event: 'EVT-001',
    instrument: 'SpaceCraft liability put',
    notional: '$45.0M',
    status: 'EXECUTED',
    pnl: '+$2.1M',
    weaveId: 'weave://trace/a3f7b2',
  },
  {
    id: 'H-0890',
    timestamp: '11:45:32',
    event: 'EVT-002',
    instrument: 'Satellite insurance call',
    notional: '$18.2M',
    status: 'EXECUTED',
    pnl: '+$0.8M',
    weaveId: 'weave://trace/d9c4e1',
  },
  {
    id: 'H-0889',
    timestamp: '09:12:15',
    event: 'EVT-003',
    instrument: 'Navigation disruption hedge',
    notional: '$9.1M',
    status: 'PENDING',
    pnl: '—',
    weaveId: 'weave://trace/f1a8c3',
  },
  {
    id: 'H-0888',
    timestamp: '06:58:41',
    event: 'EVT-001',
    instrument: 'ISS adjacent contracts put',
    notional: '$120.0M',
    status: 'EXECUTED',
    pnl: '+$9.4M',
    weaveId: 'weave://trace/b2e7d9',
  },
  {
    id: 'H-0887',
    timestamp: '03:31:09',
    event: 'EVT-002',
    instrument: 'LEO constellation disruption',
    notional: '$32.5M',
    status: 'MONITORING',
    pnl: '—',
    weaveId: 'weave://trace/c9f1a4',
  },
]

const agentMessages = [
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

const statusStyle: Record<string, string> = {
  EXECUTED: 'text-green-400',
  PENDING: 'text-yellow-400',
  MONITORING: 'text-sky-400',
}

// Simple ASCII-style bar chart for exposure data
function ExposureBar({ label, value, max, risk }: { label: string; value: number; max: number; risk: string }) {
  const pct = Math.round((value / max) * 20)
  const riskColor: Record<string, string> = {
    CRITICAL: 'text-red-400',
    HIGH: 'text-orange-400',
    MEDIUM: 'text-yellow-400',
    LOW: 'text-green-500',
  }
  return (
    <div className="flex items-center gap-3 font-mono text-[10px]">
      <span className="text-white/30 w-16 shrink-0">{label}</span>
      <span className={`${riskColor[risk]} shrink-0`}>{'█'.repeat(pct)}{'░'.repeat(20 - pct)}</span>
      <span className="text-white/50 tabular-nums shrink-0">${value}M</span>
    </div>
  )
}

// ── Collapsed strip (always visible) ─────────────────────────────────────────
function CollapsedBar({ onExpand, lines }: { onExpand: () => void; lines: string[] }) {
  return (
    <GlassCard className="absolute bottom-4 left-4 right-[19rem] z-40">
      <div className="px-3 py-2 flex items-center justify-between gap-4">
        {/* Key metrics */}
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

        {/* Latest agent line */}
        {lines.length > 0 && (
          <div className="flex-1 min-w-0 hidden lg:block">
            <span
              className={`text-[10px] font-mono truncate block ${
                lines[lines.length - 1].startsWith('✓') ? 'text-green-400' : 'text-white/30'
              }`}
            >
              {lines[lines.length - 1]}
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
          EXPAND ↑
        </button>
      </div>
    </GlassCard>
  )
}

// ── Full-screen expanded overlay ──────────────────────────────────────────────
function ExpandedOverlay({ onClose, lines }: { onClose: () => void; lines: string[] }) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#020817]/95 backdrop-blur-sm flex flex-col"
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
          <span className="text-[10px] font-mono text-white/25">W&B Weave Audit · Live</span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-mono text-white/35 border border-white/10 px-2.5 py-1 rounded
            hover:text-white/60 hover:border-white/25 transition-colors tracking-widest"
        >
          COLLAPSE ↓
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        {/* Key metrics row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'PORTFOLIO AT RISK', value: '$2.4B', color: 'text-orange-400' },
            { label: 'TOTAL HEDGED', value: '$72.3M', color: 'text-green-400' },
            { label: 'VAR (95% 1-DAY)', value: '$124M', color: 'text-yellow-400' },
            { label: 'ACTIVE POSITIONS', value: '7', color: 'text-white/80' },
          ].map((m) => (
            <div key={m.label} className="border border-white/8 rounded px-4 py-3">
              <div className="text-[9px] font-mono text-white/30 tracking-widest mb-1">{m.label}</div>
              <div className={`text-xl font-mono font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Exposure by event (ASCII bars) */}
        <div>
          <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
            Portfolio Exposure by Event
          </div>
          <div className="space-y-1.5">
            <ExposureBar label="EVT-001" value={850} max={850} risk="CRITICAL" />
            <ExposureBar label="EVT-002" value={320} max={850} risk="HIGH" />
            <ExposureBar label="EVT-003" value={180} max={850} risk="MEDIUM" />
            <ExposureBar label="EVT-004" value={45}  max={850} risk="LOW" />
            <ExposureBar label="EVT-005" value={12}  max={850} risk="LOW" />
          </div>
        </div>

        {/* Hedge history table */}
        <div>
          <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
            Hedge History · Weave Audit Trail
          </div>
          <div className="border border-white/8 rounded overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[5rem_4rem_1fr_5rem_5rem_5rem] gap-3 px-3 py-1.5 border-b border-white/8
              text-[9px] font-mono text-white/25 tracking-widest uppercase bg-white/[0.02]">
              <span>Time</span>
              <span>Event</span>
              <span>Instrument</span>
              <span>Notional</span>
              <span>P&amp;L</span>
              <span>Status</span>
            </div>
            {hedgeHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[5rem_4rem_1fr_5rem_5rem_5rem] gap-3 px-3 py-2
                  border-b border-white/5 last:border-0 text-[10px] font-mono
                  hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white/30 tabular-nums">{h.timestamp}</span>
                <span className="text-white/40">{h.event}</span>
                <span className="text-white/60 truncate">{h.instrument}</span>
                <span className="text-white/60 tabular-nums">{h.notional}</span>
                <span className={h.pnl.startsWith('+') ? 'text-green-400' : 'text-white/30'}>
                  {h.pnl}
                </span>
                <span className={statusStyle[h.status]}>{h.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI reasoning log */}
        <div>
          <div className="text-[9px] font-mono text-white/25 tracking-widest mb-3 uppercase">
            AI Agent Reasoning Log
          </div>
          <div
            ref={logRef}
            className="border border-white/8 rounded px-3 py-3 max-h-48 overflow-y-auto space-y-1"
          >
            {lines.map((line, i) => (
              <motion.div
                key={i}
                className={`text-[10px] font-mono ${
                  line.startsWith('✓') ? 'text-green-400' : 'text-white/35'
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
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FinancialTerminal() {
  const [expanded, setExpanded] = useState(false)
  const [displayedLines, setDisplayedLines] = useState<string[]>([agentMessages[0]])

  useEffect(() => {
    let idx = 1
    const timer = setInterval(() => {
      if (idx < agentMessages.length) {
        setDisplayedLines((prev) => [...prev, agentMessages[idx]])
        idx++
      }
    }, 1800)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {!expanded && (
        <CollapsedBar onExpand={() => setExpanded(true)} lines={displayedLines} />
      )}
      <AnimatePresence>
        {expanded && (
          <ExpandedOverlay onClose={() => setExpanded(false)} lines={displayedLines} />
        )}
      </AnimatePresence>
    </>
  )
}
