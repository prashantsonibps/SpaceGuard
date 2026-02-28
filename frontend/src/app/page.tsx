'use client'

import dynamic from 'next/dynamic'
import { TopBar } from '@/components/Dashboard/TopBar'
import { EventsPanel } from '@/components/Dashboard/EventsPanel'
import { FinancialTerminal } from '@/components/Dashboard/FinancialTerminal'

// R3F Canvas must not SSR
const GlobeScene = dynamic(
  () => import('@/components/Globe/GlobeScene').then((m) => m.GlobeScene),
  { ssr: false },
)

export default function HomePage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full-screen globe */}
      <div className="absolute inset-0">
        <GlobeScene />
      </div>

      {/* Overlay UI */}
      <TopBar />
      <EventsPanel />
      <FinancialTerminal />
    </div>
  )
}
