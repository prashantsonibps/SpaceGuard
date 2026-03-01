'use client'

import { motion } from 'framer-motion'
import { textOpacity, fontSize } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { TradePanel } from './TradePanel'
import { OrderBook } from './OrderBook'
import type { Market } from '@/data/markets'

interface MarketDetailProps {
  market: Market
  userId: string | null
  defaultSide?: 'YES' | 'NO'
}

export function MarketDetail({ market, userId, defaultSide }: MarketDetailProps) {
  const { theme } = useTheme()
  const tp = textOpacity[theme]
  const borderDim = theme === 'dark' ? 'border-white/5' : 'border-black/[0.06]'

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className={`grid gap-3 px-4 pb-4 pt-2 border-t ${borderDim}`} style={{ gridTemplateColumns: '1fr 280px' }}>
        {/* Left: details + chart */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Details text */}
          <p className={`${fontSize.small} font-mono ${tp.secondary} leading-relaxed`}>
            {market.details}
          </p>

        </div>

        {/* Right: buy panel & orderbook */}
        <div className="shrink-0 flex flex-col gap-3">
          <TradePanel market={market} userId={userId} defaultSide={defaultSide} />
          <OrderBook marketId={market.linkedEventId ?? market.id} defaultSide={defaultSide ?? 'YES'} />
        </div>
      </div>
    </motion.div>
  )
}
