'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HedgeRecord {
  id: string
  timestamp: string
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
    instrument: 'SpaceCraft liability put',
    notional: '$45.0M',
    status: 'EXECUTED',
    pnl: '+$2.1M',
    weaveId: 'weave://trace/a3f7b2',
  },
  {
    id: 'H-0890',
    timestamp: '11:45:32',
    instrument: 'Satellite insurance call',
    notional: '$18.2M',
    status: 'EXECUTED',
    pnl: '+$0.8M',
    weaveId: 'weave://trace/d9c4e1',
  },
  {
    id: 'H-0889',
    timestamp: '09:12:15',
    instrument: 'Navigation disruption hedge',
    notional: '$9.1M',
    status: 'PENDING',
    pnl: '—',
    weaveId: 'weave://trace/f1a8c3',
  },
  {
    id: 'H-0888',
    timestamp: '06:58:41',
    instrument: 'ISS adjacent contracts put',
    notional: '$120.0M',
    status: 'EXECUTED',
    pnl: '+$9.4M',
    weaveId: 'weave://trace/b2e7d9',
  },
  {
    id: 'H-0887',
    timestamp: '03:31:09',
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

function ExposureBar({ label, value, max, risk }: { label: string; value: number; max: number; risk: string }) {
  const pct = Math.round((value / max) * 20)
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

// ── Main export ───────────────────────────────────────────────────────────────
export function FinancialTerminal() {
  const [expanded, setExpanded] = useState(false)
  const [displayedLines, setDisplayedLines] = useState<string[]>([agentMessages[0]])
  const [windowH, setWindowH] = useState<number>(0)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowH(window.innerHeight)
    const onResize = () => setWindowH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [displayedLines])

  // EventsPanel: top-16 (64px) + bottom-4 (16px) = windowH - 80
  const expandedH = windowH ? windowH - 80 : 600

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
