'use client'

import { motion } from 'framer-motion'
import { textOpacity, accent } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { PriceChart } from './PriceChart'
import { BuyPanel } from './BuyPanel'
import type { Market } from '@/data/markets'

interface MarketDetailProps {
  market: Market
  userId: string | null
  defaultSide?: 'YES' | 'NO'
}

export function MarketDetail({ market, userId, defaultSide }: MarketDetailProps) {
  const { theme } = useTheme()
  const tp = textOpacity[theme]
  const ac = accent[theme]
  const borderDim = theme === 'dark' ? 'border-white/5' : 'border-black/[0.06]'
  const bgDim = theme === 'dark' ? 'bg-white/[0.02]' : 'bg-black/[0.02]'

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
          <p className={`text-[10px] font-mono ${tp.secondary} leading-relaxed`}>
            {market.details}
          </p>

          {/* Chart header */}
          <div className="flex items-center justify-between">
            <span className={`text-[8px] font-mono tracking-widest ${tp.muted}`}>YES PRICE — 24H</span>
            <span className={`text-[9px] font-mono tabular-nums ${ac.text}`}>
              {market.yesPrice}¢ current
            </span>
          </div>

          {/* Price chart */}
          <div className={`rounded border ${borderDim} ${bgDim} p-1`}>
            <PriceChart market={market} height={96} />
          </div>
        </div>

        {/* Right: buy panel */}
        <div className="shrink-0">
          <BuyPanel market={market} userId={userId} defaultSide={defaultSide} />
        </div>
      </div>
    </motion.div>
  )
}
