'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'

interface HedgeRecord {
  id: string
  timestamp: string
  action: string
  amount: string
  status: 'EXECUTED' | 'PENDING' | 'MONITORING'
  weaveId: string
}

const hedgeHistory: HedgeRecord[] = [
  {
    id: 'H-0891',
    timestamp: '14:23:07',
    action: 'SpaceCraft liability put · ISS × DEB-2847',
    amount: '$45.0M',
    status: 'EXECUTED',
    weaveId: 'weave://trace/a3f7b2',
  },
  {
    id: 'H-0890',
    timestamp: '11:45:32',
    action: 'Satellite insurance call · SL-1492 × COSMOS',
    amount: '$18.2M',
    status: 'EXECUTED',
    weaveId: 'weave://trace/d9c4e1',
  },
  {
    id: 'H-0889',
    timestamp: '09:12:15',
    action: 'Navigation disruption hedge · GPS-IIF-3',
    amount: '$9.1M',
    status: 'PENDING',
    weaveId: 'weave://trace/f1a8c3',
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
]

export function FinancialTerminal() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([agentMessages[0]])
  const logRef = useRef<HTMLDivElement>(null)

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
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [displayedLines])

  return (
    <GlassCard className="absolute bottom-4 left-4 right-[19rem] z-40">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-xs font-bold text-sky-400 tracking-widest">
              FINANCIAL TERMINAL
            </span>
            <span className="text-[10px] font-mono text-white/30">·</span>
            <span className="text-[10px] font-mono text-white/50">
              Portfolio:{' '}
              <span className="text-orange-400 font-medium">$2.4B</span> at risk
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="text-white/40">
              Hedged: <span className="text-green-400">$72.3M</span>
            </span>
            <span className="text-white/40">
              VaR (95%): <span className="text-yellow-400">$124M</span>
            </span>
            <span className="text-white/40">
              Active positions: <span className="text-sky-400">7</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Hedge history */}
          <div>
            <div className="text-[10px] font-mono text-white/30 mb-1.5 uppercase tracking-wider">
              Recent Hedges · W&B Weave Audit
            </div>
            <div className="space-y-1">
              {hedgeHistory.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-white/30 shrink-0">{h.timestamp}</span>
                  <span
                    className={`px-1 rounded text-[9px] shrink-0 ${
                      h.status === 'EXECUTED'
                        ? 'bg-green-500/20 text-green-400'
                        : h.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {h.status}
                  </span>
                  <span className="text-white/60 truncate flex-1">{h.action}</span>
                  <span className="text-sky-400 shrink-0">{h.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent reasoning log */}
          <div>
            <div className="text-[10px] font-mono text-white/30 mb-1.5 uppercase tracking-wider">
              AI Agent Reasoning
            </div>
            <div ref={logRef} className="h-16 overflow-y-auto space-y-0.5">
              {displayedLines.map((line, i) => (
                <motion.div
                  key={i}
                  className={`text-[10px] font-mono ${
                    line.startsWith('✓')
                      ? 'text-green-400'
                      : line.startsWith('▶')
                        ? 'text-sky-400/70'
                        : 'text-white/50'
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
      </div>
    </GlassCard>
  )
}
