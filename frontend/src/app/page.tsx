'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TopBar } from '@/components/Dashboard/TopBar'
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

  useEffect(() => {
    // Check if user ID exists in localStorage
    let storedUserId = localStorage.getItem('spaceguard_user_id')

    if (!storedUserId) {
      storedUserId = uuidv4()
      localStorage.setItem('spaceguard_user_id', storedUserId)
    }

    setUserId(storedUserId)

    // Initialize user in backend
    api.initUser(storedUserId).catch(console.error)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full-screen globe */}
      <div className="absolute inset-0">
        <GlobeScene selectedEventId={selectedEventId} />
      </div>

      {/* Overlay UI */}
      <TopBar />
      {userId && (
        <EventsPanel
          userId={userId}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      )}
      <FinancialTerminal userId={userId ?? undefined} />
    </div>
  )
}
