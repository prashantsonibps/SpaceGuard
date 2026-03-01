'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { BettingModal } from './BettingModal'

// Update the type to match our new Firestore schema
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ConjunctionEvent {
  id: string
  asset_id: string
  asset_name: string
  secondary_id: string
  secondary_name: string
  closest_approach_km: number
  collision_probability: number
  time_of_closest_approach: string
  risk_level: RiskLevel
  agent_assessment?: string
  hedge_status?: string
  hedge_amount_usd?: number
  hedge_type?: string
  // For NEOs
  miss_distance_km?: number
  estimated_diameter_max_km?: number
  is_hazardous?: boolean
}

function formatCountdown(tcaString: string): string {
  try {
    const tca = new Date(tcaString).getTime()
    const now = new Date().getTime()
    const diffHours = (tca - now) / (1000 * 60 * 60)
    
    if (diffHours < 0) return "PAST"
    
    const h = Math.floor(diffHours)
    const m = Math.floor((diffHours - h) * 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  } catch (e) {
    return "--h --m"
  }
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

function EventRow({ event, index, type, userId }: { event: ConjunctionEvent; index: number; type: 'SAT' | 'NEO'; userId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [isBettingOpen, setIsBettingOpen] = useState(false)

  const probPct = event.collision_probability ? (event.collision_probability * 100).toFixed(4) : '0.00'

  return (
    <>
      <motion.div
        className={`border-l-2 ${riskBorder[event.risk_level] || riskBorder.LOW} border-b border-white/5 last:border-b-0`}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 + 0.2 }}
      >
        <button
          className="w-full text-left px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskDot[event.risk_level] || riskDot.LOW} ${event.risk_level === 'CRITICAL' ? 'animate-pulse' : ''}`} />
              <span className={`text-[10px] font-mono font-bold tracking-widest ${riskText[event.risk_level] || riskText.LOW}`}>
                {event.risk_level || "UNKNOWN"}
              </span>
              <span className="text-[10px] font-mono text-white/25 ml-1 truncate max-w-[80px]">
                {type === 'NEO' ? 'ASTEROID' : event.asset_id}
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/35 tabular-nums">
              {type === 'NEO' ? event.time_of_closest_approach : `T−${formatCountdown(event.time_of_closest_approach)}`}
            </span>
          </div>

          <div className="font-mono text-[11px] text-white/75 leading-snug mb-2 truncate">
            {type === 'NEO' ? (
              <span className="text-white/80">{event.asset_name} <span className="text-white/30 text-[9px]">(NEO)</span></span>
            ) : (
              <>
                {event.asset_name}
                <span className="text-white/30 mx-1.5">×</span>
                <span className="text-white/45">{event.secondary_name}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
            <div>
              <div className="text-white/25 uppercase tracking-wider text-[9px]">Dist</div>
              <div className="text-white/60 tabular-nums">
                {type === 'NEO' 
                  ? `${(event.miss_distance_km ? event.miss_distance_km / 1000000 : 0).toFixed(1)}M km`
                  : `${event.closest_approach_km} km`
                }
              </div>
            </div>
            <div>
              <div className="text-white/25 uppercase tracking-wider text-[9px]">{type === 'NEO' ? 'Size' : 'Prob'}</div>
              <div className={`tabular-nums ${riskText[event.risk_level] || riskText.LOW}`}>
                {type === 'NEO' 
                  ? `${(event.estimated_diameter_max_km || 0).toFixed(2)} km`
                  : `${probPct}%`
                }
              </div>
            </div>
            <div>
              <div className="text-white/25 uppercase tracking-wider text-[9px]">Agent Hedge</div>
              <div className={`tabular-nums ${event.hedge_status === 'HEDGE' ? 'text-sky-400' : 'text-white/60'}`}>
                {event.hedge_status ? `$${(event.hedge_amount_usd || 0).toLocaleString()}` : 'PENDING'}
              </div>
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
              <div className="text-[10px] font-mono text-white/60 bg-white/[0.04] border border-sky-500/30 rounded px-2 py-1.5 mb-2 leading-relaxed">
                <span className="text-sky-400 font-bold block mb-1">🤖 Gemini AI Assessment:</span>
                {event.agent_assessment || "Awaiting AI evaluation..."}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  disabled={event.hedge_status !== 'HEDGE'}
                  className={`flex-1 py-1 rounded text-[10px] font-mono border transition-colors
                    ${event.hedge_status === 'HEDGE' ? 'text-sky-400 border-sky-400/30 bg-sky-400/10 hover:bg-sky-400/20 cursor-pointer' : 'text-white/20 border-white/10 bg-transparent cursor-not-allowed'}`}
                >
                  {event.hedge_status === 'HEDGE' ? 'APPROVE HEDGE' : 'NO ACTION REQ.'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBettingOpen(true);
                  }}
                  className="flex-1 py-1 rounded text-[10px] font-mono border border-purple-400/30 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors"
                >
                  PLACE WAGER
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <BettingModal 
        isOpen={isBettingOpen} 
        onClose={() => setIsBettingOpen(false)}
        eventId={event.id}
        eventName={type === 'NEO' ? event.asset_name : `${event.asset_name} vs ${event.secondary_name}`}
        eventType="conjunction"
        userId={userId}
        onBetPlaced={() => {}}
      />
    </>
  )
}

export function EventsPanel({ userId }: { userId?: string }) {
  const [time, setTime] = useState<Date | null>(null)
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  const [neoEvents, setNeoEvents] = useState<ConjunctionEvent[]>([])
  const [activeTab, setActiveTab] = useState<'SAT' | 'NEO'>('SAT')
  const [loading, setLoading] = useState(true)

  // Clock timer
  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Firebase Real-time Listener
  useEffect(() => {
    const q1 = query(collection(db, 'conjunction_events'))
    const q2 = query(collection(db, 'neo_events'))
    
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newEvents: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        newEvents.push({ id: doc.id, ...doc.data() } as ConjunctionEvent)
      })
      newEvents.sort((a, b) => a.closest_approach_km - b.closest_approach_km)
      setEvents(newEvents)
      setLoading(false)
    })

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newNeos: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newNeos.push({ 
          id: doc.id, 
          asset_id: String(data.id),
          asset_name: data.name,
          secondary_id: 'EARTH',
          secondary_name: 'Earth',
          closest_approach_km: 0, // Not used for display in NEO mode
          collision_probability: 0, // Not used
          time_of_closest_approach: data.close_approach_date,
          risk_level: data.risk_level,
          miss_distance_km: data.miss_distance_km,
          estimated_diameter_max_km: data.estimated_diameter_max_km,
          is_hazardous: data.is_hazardous,
          agent_assessment: data.agent_assessment,
          hedge_status: data.hedge_status,
          hedge_amount_usd: data.hedge_amount_usd,
          hedge_type: data.hedge_type
        } as ConjunctionEvent)
      })
      newNeos.sort((a, b) => (a.miss_distance_km || 0) - (b.miss_distance_km || 0))
      setNeoEvents(newNeos)
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }, [])

  const currentList = activeTab === 'SAT' ? events : neoEvents
  const criticalCount = currentList.filter((e) => e.risk_level === 'CRITICAL').length
  const highCount = currentList.filter((e) => e.risk_level === 'HIGH').length

  if (!userId) return null; // Or some loading state

  return (
    <GlassCard className="absolute right-4 top-16 bottom-4 w-72 flex flex-col z-40 !bg-neutral-900/50">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-orbitron text-[11px] font-bold text-white/80 tracking-[0.2em]">
            RISK MONITOR
          </h2>
          <p className="text-[9px] font-mono text-white/30 tabular-nums">
            {time ? time.toISOString().slice(11, 19) : '––:––:––'} UTC
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-0.5 rounded text-[10px] font-mono mb-2">
          <button 
            onClick={() => setActiveTab('SAT')}
            className={`flex-1 py-1 rounded text-center transition-all ${activeTab === 'SAT' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
          >
            SATELLITES
          </button>
          <button 
            onClick={() => setActiveTab('NEO')}
            className={`flex-1 py-1 rounded text-center transition-all ${activeTab === 'NEO' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
          >
            ASTEROIDS
          </button>
        </div>

        <div className="text-right h-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400">{criticalCount} CRITICAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs font-mono text-white/40">
            <div className="w-4 h-4 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin mx-auto mb-2" />
            Scanning Deep Space...
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-white/40">
            No active risks detected in this sector.
          </div>
        ) : (
          currentList.map((event, i) => (
            <EventRow key={event.id} event={event} index={i} type={activeTab} userId={userId} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/10 shrink-0">
        <div className="text-[9px] font-mono text-sky-400/80 text-center tracking-wider flex justify-center items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          GEMINI AI AGENT ACTIVE
        </div>
      </div>
    </GlassCard>
  )
}
