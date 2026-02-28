'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { conjunctionEvents, type ConjunctionEvent } from '@/data/conjunctions'

function formatCountdown(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function EventRow({ event, index }: { event: ConjunctionEvent; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      className="border-b border-white/5 last:border-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.3 }}
    >
      <button
        className="w-full text-left p-3 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <RiskBadge level={event.riskLevel} />
          <span className="text-xs font-mono text-white/40">
            TCA {formatCountdown(event.tcaHours)}
          </span>
        </div>
        <div className="text-xs font-mono mt-1">
          <div className="text-white/80 truncate">{event.satAName}</div>
          <div className="text-white/40 text-[10px]">× {event.satBName}</div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/50">
          <span>{event.distanceKm} km</span>
          <span>·</span>
          <span>{event.probabilityPct}% prob</span>
          <span>·</span>
          <span>${event.portfolioExposureM}M</span>
        </div>
      </button>

      {expanded && (
        <motion.div
          className="px-3 pb-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-[10px] font-mono text-white/40 mb-2">
            Relative velocity: {event.relativeVelocityKms} km/s
          </div>
          <div className="text-[10px] font-mono text-sky-400/80 bg-sky-400/5 rounded px-2 py-1.5 mb-2">
            {event.hedgeStrategy}
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 py-1 rounded text-[10px] font-mono
              bg-sky-500/20 text-sky-400 border border-sky-500/30
              hover:bg-sky-500/30 transition-colors"
            >
              EXECUTE HEDGE
            </button>
            <button
              className="flex-1 py-1 rounded text-[10px] font-mono
              bg-white/5 text-white/50 border border-white/10
              hover:bg-white/10 transition-colors"
            >
              DETAILS
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function EventsPanel() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const alertCount = conjunctionEvents.filter(
    (e) => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH',
  ).length

  return (
    <GlassCard className="absolute right-4 top-16 bottom-36 w-72 flex flex-col z-40">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xs font-bold text-white tracking-widest">
            CONJUNCTION EVENTS
          </h2>
          <p className="text-[10px] font-mono text-white/40 mt-0.5">
            {time.toISOString().slice(11, 19)} UTC
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-mono text-red-400">{alertCount} ALERTS</span>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {conjunctionEvents.map((event, i) => (
          <EventRow key={event.id} event={event} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/10">
        <div className="text-[10px] font-mono text-white/30 text-center">
          Next update in 47s · Powered by SpaceGuard AI
        </div>
      </div>
    </GlassCard>
  )
}
