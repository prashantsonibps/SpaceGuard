'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { conjunctionEvents, type ConjunctionEvent, type RiskLevel } from '@/data/conjunctions'

function formatCountdown(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

const riskBorder: Record<RiskLevel, string> = {
  CRITICAL: 'border-l-red-500/40',
  HIGH: 'border-l-orange-500/40',
  MEDIUM: 'border-l-yellow-500/40',
  LOW: 'border-l-green-600/40',
}

const riskText: Record<RiskLevel, string> = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-500',
}

const riskDot: Record<RiskLevel, string> = {
  CRITICAL: 'bg-red-400',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-green-500',
}

function EventRow({ event, index }: { event: ConjunctionEvent; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      className={`border-l-2 ${riskBorder[event.riskLevel]} border-b border-white/5 last:border-b-0`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 + 0.2 }}
    >
      <button
        className="w-full text-left px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Row 1: risk label + event id + countdown */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskDot[event.riskLevel]} ${event.riskLevel === 'CRITICAL' ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] font-mono font-bold tracking-widest ${riskText[event.riskLevel]}`}>
              {event.riskLevel}
            </span>
            <span className="text-[10px] font-mono text-white/25 ml-1">{event.id}</span>
          </div>
          <span className="text-[10px] font-mono text-white/35 tabular-nums">
            T−{formatCountdown(event.tcaHours)}
          </span>
        </div>

        {/* Row 2: satellite names */}
        <div className="font-mono text-[11px] text-white/75 leading-snug mb-2">
          {event.satAName}
          <span className="text-white/30 mx-1.5">×</span>
          <span className="text-white/45">{event.satBName}</span>
        </div>

        {/* Row 3: key stats */}
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
          <div>
            <div className="text-white/25 uppercase tracking-wider text-[9px]">Dist</div>
            <div className="text-white/60 tabular-nums">{event.distanceKm} km</div>
          </div>
          <div>
            <div className="text-white/25 uppercase tracking-wider text-[9px]">Prob</div>
            <div className={`tabular-nums ${riskText[event.riskLevel]}`}>{event.probabilityPct}%</div>
          </div>
          <div>
            <div className="text-white/25 uppercase tracking-wider text-[9px]">Exposure</div>
            <div className="text-white/60 tabular-nums">${event.portfolioExposureM}M</div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-3 pb-3 ml-0"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Velocity */}
            <div className="text-[10px] font-mono text-white/30 mb-2">
              rel. velocity <span className="text-white/50">{event.relativeVelocityKms} km/s</span>
            </div>

            {/* Hedge strategy */}
            <div className="text-[10px] font-mono text-white/50 bg-white/[0.04] border border-white/10 rounded px-2 py-1.5 mb-2 leading-relaxed">
              {event.hedgeStrategy}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className={`flex-1 py-1 rounded text-[10px] font-mono border transition-colors
                  ${riskText[event.riskLevel]} border-current/30 bg-current/5 hover:bg-current/10`}
                style={{ borderColor: 'currentColor' }}
              >
                EXECUTE HEDGE
              </button>
              <button
                className="px-3 py-1 rounded text-[10px] font-mono
                bg-white/5 text-white/35 border border-white/10
                hover:bg-white/10 transition-colors"
              >
                DETAILS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function EventsPanel() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const criticalCount = conjunctionEvents.filter((e) => e.riskLevel === 'CRITICAL').length
  const highCount = conjunctionEvents.filter((e) => e.riskLevel === 'HIGH').length

  return (
    <GlassCard className="absolute right-4 top-16 bottom-4 w-72 flex flex-col z-40 !bg-neutral-900/50">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-orbitron text-[11px] font-bold text-white/80 tracking-[0.2em]">
            CONJUNCTION EVENTS
          </h2>
          <p className="text-[9px] font-mono text-white/30 mt-0.5 tabular-nums">
            {time ? time.toISOString().slice(11, 19) : '––:––:––'} UTC
          </p>
        </div>
        <div className="text-right">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400">{criticalCount} CRITICAL</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-[9px] font-mono text-orange-400">{highCount} HIGH</span>
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {conjunctionEvents.map((event, i) => (
          <EventRow key={event.id} event={event} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/10 shrink-0">
        <div className="text-[9px] font-mono text-white/20 text-center tracking-wider">
          NEXT SCAN IN 47s · SPACEGUARD AI
        </div>
      </div>
    </GlassCard>
  )
}
