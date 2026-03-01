'use client'

import { textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { MarketRow } from './MarketRow'
import type { Market } from '@/data/markets'

interface MarketListProps {
  markets: Market[]
  selectedMarketId: string | null
  onSelectMarket: (id: string | null) => void
  userId: string | null
}

export function MarketList({ markets, selectedMarketId, onSelectMarket, userId }: MarketListProps) {
  const { theme } = useTheme()
  const tp = textOpacity[theme]

  if (markets.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-xs font-mono ${tp.muted}`}>
        No markets match the selected filter.
      </div>
    )
  }

  return (
    <div>
      {markets.map((market, i) => (
        <MarketRow
          key={market.id}
          market={market}
          index={i}
          isSelected={selectedMarketId === market.id}
          onSelect={onSelectMarket}
          userId={userId}
        />
      ))}
    </div>
  )
}
