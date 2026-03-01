'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { riskClasses, textOpacity, accent } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { MarketStatusBadge } from './MarketStatusBadge'
import { MarketDetail } from './MarketDetail'
import { formatCountdown, formatVolume } from '@/lib/utils'
import type { Market } from '@/data/markets'

interface MarketRowProps {
  market: Market
  index: number
  isSelected: boolean
  onSelect: (id: string | null) => void
  userId: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  COLLISION: 'COLLISION',
  DEBRIS: 'DEBRIS',
  MANEUVER: 'MANEUVER',
  HEDGE: 'HEDGE',
  NEO: 'NEO',
}

function AsciiBar({ yes }: { yes: number }) {
  const blocks = Math.round(yes / 10)
  return (
    <span className="text-[8px] font-mono text-sky-300/60 tracking-tighter">
      {'█'.repeat(blocks)}{'░'.repeat(10 - blocks)}
    </span>
  )
}

export function MarketRow({ market, index, isSelected, onSelect, userId }: MarketRowProps) {
  const { theme } = useTheme()
  const rc = riskClasses[theme]
  const tp = textOpacity[theme]
  const ac = accent[theme]

  const borderClass = isSelected
    ? `border-l-2 ${rc[market.riskLevel].borderLeft}`
    : 'border-l-2 border-l-transparent'

  const timeLeft = market.closeTime - Date.now()
  const countdown = market.status === 'LIVE' ? formatCountdown(timeLeft) : '—'

  return (
    <motion.div
      className={`${borderClass} border-b border-white/5 last:border-b-0 ${isSelected ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'} transition-colors`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      {/* Main row — 6-column layout */}
      <button
        className="w-full text-left px-4 py-3"
        onClick={() => onSelect(isSelected ? null : market.id)}
      >
        <div className="flex items-center gap-3">
          {/* Question + badges */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <RiskBadge level={market.riskLevel} />
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/10 ${tp.muted}`}>
                {CATEGORY_LABEL[market.category]}
              </span>
            </div>
            <p className={`text-[11px] font-mono ${tp.primary} leading-snug truncate`}>
              {market.question}
            </p>
          </div>

          {/* YES price */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[13px] font-mono font-bold ${ac.text} tabular-nums`}>
              {market.yesPrice}¢
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>YES</div>
          </div>

          {/* NO price */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[13px] font-mono font-bold text-white/50 tabular-nums`}>
              {100 - market.yesPrice}¢
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>NO</div>
          </div>

          {/* Volume */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[11px] font-mono ${tp.secondary} tabular-nums`}>
              {formatVolume(market.volume24h)}
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>24H VOL</div>
          </div>

          {/* Expiry */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[11px] font-mono ${tp.secondary} tabular-nums`}>
              {countdown}
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>EXPIRY</div>
          </div>

          {/* Status */}
          <div className="shrink-0 w-14 text-right">
            <MarketStatusBadge status={market.status} />
          </div>
        </div>

        {/* ASCII mini-bar */}
        <div className="mt-1.5 pl-0">
          <AsciiBar yes={market.yesPrice} />
        </div>
      </button>

      {/* Inline expanded detail */}
      <AnimatePresence>
        {isSelected && (
          <MarketDetail market={market} userId={userId} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
