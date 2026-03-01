'use client'

import { useState, useMemo, useEffect } from 'react'
import { TopBar } from '@/components/Dashboard/TopBar'
import { CategorySidebar } from '@/components/Prediction/CategorySidebar'
import { SortControls, type SortKey } from '@/components/Prediction/SortControls'
import { MarketList } from '@/components/Prediction/MarketList'
import { MARKETS } from '@/data/markets'
import type { MarketCategory } from '@/data/markets'
import { bg } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

type CategoryFilter = 'ALL' | MarketCategory

const RISK_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function PredictionPage() {
  const { theme } = useTheme()
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL')
  const [sortBy, setSortBy] = useState<SortKey>('VOLUME')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('spaceguard_user_id')
    if (stored) setUserId(stored)
  }, [])

  const filteredMarkets = useMemo(() => {
    if (selectedCategory === 'ALL') return MARKETS
    return MARKETS.filter(m => m.category === selectedCategory)
  }, [selectedCategory])

  const sortedMarkets = useMemo(() => {
    return [...filteredMarkets].sort((a, b) => {
      switch (sortBy) {
        case 'VOLUME':
          return b.volume24h - a.volume24h
        case 'EXPIRY':
          return a.closeTime - b.closeTime
        case 'PRICE':
          return b.yesPrice - a.yesPrice
        case 'RISK':
          return RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
        default:
          return 0
      }
    })
  }, [filteredMarkets, sortBy])

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden ${
        theme === 'dark' ? 'bg-[#020817]' : 'bg-slate-100'
      }`}
    >
      {/* Top bar — inline (not overlay) */}
      <TopBar variant="inline" />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[200px] shrink-0">
          <CategorySidebar
            markets={MARKETS}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            userId={userId}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Sort controls */}
          <SortControls
            sortBy={sortBy}
            onSort={setSortBy}
            markets={sortedMarkets}
          />

          {/* Scrollable market list */}
          <div className="flex-1 overflow-y-auto">
            <MarketList
              markets={sortedMarkets}
              selectedMarketId={selectedMarketId}
              onSelectMarket={setSelectedMarketId}
              userId={userId}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
