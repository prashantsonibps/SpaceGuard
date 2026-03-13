'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TopBar } from '@/components/Dashboard/TopBar'
import { CategoryNav, type TabType } from '@/components/Dashboard/CategoryNav'
import { EventsPanel } from '@/components/Dashboard/EventsPanel'
import { FinancialTerminal } from '@/components/Dashboard/FinancialTerminal'
import { api } from '@/lib/api'

// R3F Canvas must not SSR
const GlobeScene = dynamic(
  () => import('@/components/Globe/GlobeScene').then((m) => m.GlobeScene),
  { ssr: false },
)

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('TRENDING')
  const [isRiskOpen, setIsRiskOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check if user ID exists in localStorage
    let storedUserId = localStorage.getItem('spaceguard_user_id')

    if (!storedUserId) {
      storedUserId = uuidv4()
      localStorage.setItem('spaceguard_user_id', storedUserId)
    }

    setUserId(storedUserId)

    // Initialize user in backend
    api.initUser(storedUserId).catch(() => {})
  }, [])

  // Track viewport size so the risk monitor is always open on desktop
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsDesktop(width >= 768)
      // Ensure risk monitor is open whenever we are on desktop-sized screens
      if (width >= 768) {
        setIsRiskOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-black">
      {/* Full-screen globe */}
      <div className="absolute inset-0">
        <GlobeScene selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
      </div>

      {/* Overlay UI */}
      <TopBar />
      <CategoryNav activeTab={activeTab} onTabChange={setActiveTab} />
      {userId && (
        <EventsPanel
          userId={userId}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          activeTab={activeTab}
          isOpen={isDesktop ? true : isRiskOpen}
        />
      )}
      {/* Right-side risk monitor toggle */}
      <button
        type="button"
        onClick={() => setIsRiskOpen((open) => !open)}
        className="absolute right-1 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-9 h-20 rounded-l-full bg-white/80 dark:bg-neutral-900/70 border border-r-0 border-black/20 dark:border-white/20 shadow-lg md:hidden"
      >
        <span className="font-mono text-xs tracking-[0.2em] text-slate-700 dark:text-slate-200 rotate-90">
          {isRiskOpen ? 'CLOSE' : 'RISK'}
        </span>
      </button>
      <FinancialTerminal userId={userId ?? undefined} />
    </div>
  )
}
