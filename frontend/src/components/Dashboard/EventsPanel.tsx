'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { BettingModal } from './BettingModal'
import { riskClasses, accent, textOpacity, fontSize } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

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
  // For Space Weather
  type?: 'CME' | 'SOLAR_FLARE'
  start_time?: string
  note?: string
  class_type?: string
  // For NOAA Indices
  name?: string
  value?: number
  timestamp?: string
  description?: string
  // For Fireballs
  date?: string
  energy_kt?: number
  velocity_km_s?: number
  // For Launches
  status?: string
  window_start?: string
  provider?: string
  location?: string
  probability?: number
  delay_risk?: RiskLevel
  weather?: {
    temp_c: number
    wind_speed_ms: number
    conditions: string
  }
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

function EventRow({
  event,
  index,
  type,
  userId,
  isSelected,
  onSelect,
}: {
  event: ConjunctionEvent
  index: number
  type: 'SAT' | 'NEO' | 'WEATHER' | 'INDEX' | 'FIREBALL' | 'LAUNCH'
  userId: string
  isSelected: boolean
  onSelect: (id: string | null) => void
}) {
  const { theme } = useTheme()
  const rc = riskClasses[theme]
  const [isBettingOpen, setIsBettingOpen] = useState(false)

  const probPct = event.collision_probability ? (event.collision_probability * 100).toFixed(4) : '0.00'

  return (
    <>
      <motion.div
        className={`border-l-2 ${(rc[event.risk_level] ?? rc.LOW).borderLeft} border-b border-black/5 dark:border-white/5 last:border-b-0 ${isSelected ? 'bg-black/[0.06] dark:bg-white/[0.06]' : ''}`}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 + 0.2 }}
      >
        <button
          className="w-full text-left px-3 py-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
          onClick={() => onSelect(isSelected ? null : event.id)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(rc[event.risk_level] ?? rc.LOW).dot} ${event.risk_level === 'CRITICAL' ? 'animate-pulse' : ''}`} />
              <span className={`${fontSize.small} font-mono font-bold tracking-widest ${(rc[event.risk_level] ?? rc.LOW).text}`}>
                {event.risk_level || "UNKNOWN"}
              </span>
              <span className={`${fontSize.small} font-mono ${textOpacity[theme].faint} ml-1 truncate max-w-[80px]`}>
                {type === 'NEO' ? 'ASTEROID' : type === 'LAUNCH' ? 'LAUNCH' : event.asset_id}
              </span>
            </div>
            <span className={`${fontSize.small} font-mono ${textOpacity[theme].faint} tabular-nums`}>
              {type === 'WEATHER' ? (event.start_time?.slice(11, 16) || 'LIVE')
                : type === 'NEO' ? event.time_of_closest_approach
                  : type === 'INDEX' ? (event.timestamp?.slice(11, 16) || 'LIVE')
                    : type === 'FIREBALL' ? (event.date?.slice(0, 10))
                      : type === 'LAUNCH' && event.window_start ? `T−${formatCountdown(event.window_start)}`
                        : `T−${formatCountdown(event.time_of_closest_approach)}`}
            </span>
          </div>

          <div className={`font-mono ${fontSize.base} ${textOpacity[theme].secondary} leading-snug mb-2 truncate`}>
            {type === 'WEATHER' ? (
              <span className={textOpacity[theme].primary}>{event.type === 'CME' ? 'Coronal Mass Ejection' : 'Solar Flare'} <span className={`${textOpacity[theme].faint} ${fontSize.small}`}>({event.class_type || 'Active'})</span></span>
            ) : type === 'NEO' ? (
              <span className={textOpacity[theme].primary}>{event.asset_name} <span className={`${textOpacity[theme].faint} ${fontSize.small}`}>(NEO)</span></span>
            ) : type === 'INDEX' ? (
              <span className={textOpacity[theme].primary}>{event.name} <span className={`${textOpacity[theme].faint} ${fontSize.small}`}>(NOAA Index)</span></span>
            ) : type === 'FIREBALL' ? (
              <span className={textOpacity[theme].primary}>Fireball Event <span className={`${textOpacity[theme].faint} ${fontSize.small}`}>({event.date?.slice(0, 10)})</span></span>
            ) : type === 'LAUNCH' ? (
              <span className={textOpacity[theme].primary}>{event.name} <span className={`${textOpacity[theme].faint} ${fontSize.small}`}>({event.provider})</span></span>
            ) : (
              <>
                {event.asset_name}
                <span className={`${textOpacity[theme].faint} mx-1.5`}>×</span>
                <span className={textOpacity[theme].muted}>{event.secondary_name}</span>
              </>
            )}
          </div>

          <div className={`grid grid-cols-3 gap-1 ${fontSize.small} font-mono`}>
            <div>
              <div className={`${textOpacity[theme].faint} uppercase tracking-wider ${fontSize.small}`}>{type === 'WEATHER' ? 'Type' : type === 'INDEX' ? 'Value' : type === 'FIREBALL' ? 'Energy' : type === 'LAUNCH' ? 'Wind' : 'Dist'}</div>
              <div className={`${textOpacity[theme].secondary} tabular-nums`}>
                {type === 'WEATHER'
                  ? (event.type || 'SOLAR')
                  : type === 'INDEX'
                    ? (event.value || 0).toFixed(2)
                    : type === 'FIREBALL'
                      ? `${(event.energy_kt || 0).toFixed(1)} kt`
                      : type === 'NEO'
                        ? `${(event.miss_distance_km ? event.miss_distance_km / 1000000 : 0).toFixed(1)}M km`
                        : type === 'LAUNCH'
                          ? event.weather ? `${event.weather.wind_speed_ms}m/s` : 'N/A'
                          : `${event.closest_approach_km} km`
                }
              </div>
            </div>
            <div>
              <div className={`${textOpacity[theme].faint} uppercase tracking-wider ${fontSize.small}`}>{type === 'NEO' ? 'Size' : type === 'WEATHER' ? 'Class' : type === 'INDEX' ? 'Range' : type === 'FIREBALL' ? 'Vel' : type === 'LAUNCH' ? 'Weather' : 'Prob'}</div>
              <div className={`tabular-nums ${(rc[event.risk_level] ?? rc.LOW).text}`}>
                {type === 'NEO'
                  ? `${(event.estimated_diameter_max_km || 0).toFixed(2)} km`
                  : type === 'WEATHER'
                    ? (event.class_type || 'C-CLASS')
                    : type === 'INDEX'
                      ? (event.name === 'Kp-Index' ? '0-9' : 'SFU')
                      : type === 'FIREBALL'
                        ? `${(event.velocity_km_s || 0).toFixed(1)} km/s`
                        : type === 'LAUNCH'
                          ? event.weather ? event.weather.conditions : 'TBD'
                          : `${probPct}%`
                }
              </div>
            </div>
            <div>
              <div className={`${textOpacity[theme].faint} uppercase tracking-wider ${fontSize.small}`}>Status</div>
              <div className={`tabular-nums ${event.hedge_status === 'HEDGE' ? accent[theme].text : textOpacity[theme].secondary}`}>
                {type === 'WEATHER' || type === 'INDEX' || type === 'FIREBALL' ? 'MONITORING' : (event.hedge_status ? `$${(event.hedge_amount_usd || 0).toLocaleString()}` : 'PENDING')}
              </div>
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="px-3 pb-3 ml-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className={`${fontSize.small} font-mono ${textOpacity[theme].secondary} bg-black/[0.04] dark:bg-white/[0.04] border ${accent[theme].borderDim} rounded px-2 py-1.5 mb-2 leading-relaxed`}>
                <span className={`${accent[theme].text} font-bold block mb-1`}>🤖 Mistral AI Assessment:</span>
                {event.agent_assessment || "Awaiting AI evaluation..."}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  disabled={event.hedge_status !== 'HEDGE'}
                  className={`flex-1 py-1 rounded ${fontSize.small} font-mono border transition-colors
                    ${event.hedge_status === 'HEDGE' ? `${accent[theme].text} border-sky-300/30 ${accent[theme].bgDim} ${accent[theme].bgDimHover} cursor-pointer` : 'text-slate-400 dark:text-white/20 border-black/20 dark:border-white/10 bg-transparent cursor-not-allowed'}`}
                >
                  {event.hedge_status === 'HEDGE' ? 'APPROVE HEDGE' : 'NO ACTION REQ.'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBettingOpen(true);
                  }}
                  className={`flex-1 py-1 rounded ${fontSize.small} font-mono border border-purple-400/30 bg-purple-400/10 text-purple-500 dark:text-purple-400 hover:bg-purple-400/20 transition-colors`}
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
        eventName={type === 'WEATHER' ? (event.type || 'Solar Event') : type === 'NEO' ? event.asset_name : type === 'LAUNCH' ? event.name || 'Launch' : `${event.asset_name} vs ${event.secondary_name}`}
        eventType={type === 'LAUNCH' ? 'launch' : type === 'WEATHER' ? 'weather' : 'conjunction'}
        userId={userId}
        onBetPlaced={() => { }}
      />
    </>
  )
}

export function EventsPanel({
  userId,
  selectedEventId,
  onSelectEvent,
  activeTab,
}: {
  userId?: string
  selectedEventId: string | null
  onSelectEvent: (id: string | null) => void
  activeTab: 'TRENDING' | 'SAT' | 'NEO' | 'WEATHER' | 'INDEX' | 'FIREBALL' | 'LAUNCH'
}) {
  const { theme } = useTheme()
  const rc = riskClasses[theme]

  const [time, setTime] = useState<Date | null>(null)
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  const [neoEvents, setNeoEvents] = useState<ConjunctionEvent[]>([])
  const [weatherEvents, setWeatherEvents] = useState<ConjunctionEvent[]>([])
  const [noaaIndices, setNoaaIndices] = useState<ConjunctionEvent[]>([])
  const [fireballEvents, setFireballEvents] = useState<ConjunctionEvent[]>([])
  const [launchEvents, setLaunchEvents] = useState<ConjunctionEvent[]>([])
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
    const q3 = query(collection(db, 'space_weather_events'))
    const q4 = query(collection(db, 'noaa_indices'))
    const q5 = query(collection(db, 'fireball_events'))

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
          closest_approach_km: 0,
          collision_probability: 0,
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

    const unsubscribe3 = onSnapshot(q3, (snapshot) => {
      const newWeather: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newWeather.push({
          id: doc.id,
          type: data.type,
          start_time: data.start_time,
          note: data.note,
          class_type: data.class_type,
          risk_level: data.risk_level,
          agent_assessment: data.note // Use note as assessment for now
        } as ConjunctionEvent)
      })
      // Sort by start_time descending
      newWeather.sort((a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime())
      setWeatherEvents(newWeather)
    })

    const unsubscribe4 = onSnapshot(q4, (snapshot) => {
      const newIndices: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newIndices.push({
          id: doc.id,
          name: data.name,
          value: data.value,
          timestamp: data.timestamp,
          description: data.description,
          risk_level: data.risk_level,
          agent_assessment: data.description
        } as ConjunctionEvent)
      })
      setNoaaIndices(newIndices)
    })

    const unsubscribe5 = onSnapshot(q5, (snapshot) => {
      const newFireballs: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newFireballs.push({
          id: doc.id,
          date: data.date,
          energy_kt: data.energy_kt,
          velocity_km_s: data.velocity_km_s,
          risk_level: 'LOW', // Usually low unless high energy
          agent_assessment: `Energy: ${data.energy_kt} kt`
        } as ConjunctionEvent)
      })
      newFireballs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      setFireballEvents(newFireballs)
    })

    const q6 = query(collection(db, 'launches'))

    const unsubscribe6 = onSnapshot(q6, (snapshot) => {
      const newLaunches: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newLaunches.push({
          id: doc.id,
          name: data.name,
          risk_level: data.delay_risk,
          window_start: data.window_start,
          provider: data.provider,
          weather: data.weather,
          time_of_closest_approach: data.window_start // Reuse this field for countdown sorting
        } as ConjunctionEvent)
      })
      newLaunches.sort((a, b) => new Date(a.time_of_closest_approach || 0).getTime() - new Date(b.time_of_closest_approach || 0).getTime())
      setLaunchEvents(newLaunches)
      setLoading(false)
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
      unsubscribe3()
      unsubscribe4()
      unsubscribe5()
      unsubscribe6()
    }
  }, [])

  const getTrendingEvents = () => {
    const allEvents = [
      ...events.map(e => ({ ...e, _type: 'SAT' as const })),
      ...neoEvents.map(e => ({ ...e, _type: 'NEO' as const })),
      ...weatherEvents.map(e => ({ ...e, _type: 'WEATHER' as const })),
      ...noaaIndices.map(e => ({ ...e, _type: 'INDEX' as const })),
      ...fireballEvents.map(e => ({ ...e, _type: 'FIREBALL' as const })),
      ...launchEvents.map(e => ({ ...e, _type: 'LAUNCH' as const }))
    ]

    const riskWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'UNKNOWN': 0 }

    return allEvents
      .sort((a, b) => {
        const weightA = riskWeight[a.risk_level] || 0
        const weightB = riskWeight[b.risk_level] || 0
        if (weightA !== weightB) return weightB - weightA
        return 0
      })
      .slice(0, 20)
  }

  const currentList = activeTab === 'TRENDING' ? getTrendingEvents()
    : activeTab === 'SAT' ? events.map(e => ({ ...e, _type: 'SAT' as const }))
      : activeTab === 'NEO' ? neoEvents.map(e => ({ ...e, _type: 'NEO' as const }))
        : activeTab === 'WEATHER' ? weatherEvents.map(e => ({ ...e, _type: 'WEATHER' as const }))
          : activeTab === 'INDEX' ? noaaIndices.map(e => ({ ...e, _type: 'INDEX' as const }))
            : activeTab === 'LAUNCH' ? launchEvents.map(e => ({ ...e, _type: 'LAUNCH' as const }))
              : fireballEvents.map(e => ({ ...e, _type: 'FIREBALL' as const }))

  const criticalCount = currentList.filter((e) => e.risk_level === 'CRITICAL').length

  if (!userId) return null;

  return (
    <GlassCard className="absolute right-4 top-16 bottom-4 w-72 flex flex-col z-40 !bg-white/80 dark:!bg-neutral-900/50">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-black/20 dark:border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`font-orbitron ${fontSize.base} font-bold ${textOpacity[theme].primary} tracking-[0.2em]`}>
            RISK MONITOR
          </h2>
          <p className={`${fontSize.small} font-mono ${textOpacity[theme].faint} tabular-nums`}>
            {time ? time.toISOString().slice(11, 19) : '––:––:––'} UTC
          </p>
        </div>

        <div className="text-right h-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <div className={`w-1.5 h-1.5 rounded-full ${rc.CRITICAL.dot} animate-pulse`} />
              <span className={`${fontSize.small} font-mono ${rc.CRITICAL.text}`}>{criticalCount} CRITICAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-4 text-center text-xs font-mono ${textOpacity[theme].muted}`}>
            <div className={`w-4 h-4 rounded-full border-2 border-sky-300/30 border-t-sky-300 animate-spin mx-auto mb-2`} />
            Scanning Deep Space...
          </div>
        ) : currentList.length === 0 ? (
          <div className={`p-4 text-center text-xs font-mono ${textOpacity[theme].muted}`}>
            No active risks detected in this sector.
          </div>
        ) : (
          currentList.map((event, i) => (
            <EventRow
              key={event.id}
              event={event}
              index={i}
              type={(event as any)._type || activeTab}
              userId={userId}
              isSelected={selectedEventId === event.id}
              onSelect={onSelectEvent}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-black/20 dark:border-white/10 shrink-0">
        <div className={`${fontSize.small} font-mono ${accent[theme].text} opacity-80 text-center tracking-wider flex justify-center items-center gap-1.5`}>
          <div className={`w-1.5 h-1.5 rounded-full ${accent[theme].dot} animate-pulse`} />
          MISTRAL AI AGENT ACTIVE
        </div>
      </div>
    </GlassCard>
  )
}
