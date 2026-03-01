'use client'

import { useState } from 'react'
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

function ProbBar({ yes, theme }: { yes: number; theme: 'dark' | 'light' }) {
  const no = 100 - yes
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[9px] font-mono tabular-nums w-8 text-right shrink-0 ${
        theme === 'dark' ? 'text-sky-400' : 'text-sky-600'
      }`}>
        {yes}%
      </span>
      <div className="flex-1 flex h-1.5 rounded overflow-hidden">
        <div
          className={`h-full ${theme === 'dark' ? 'bg-sky-400/70' : 'bg-sky-500/60'} rounded-l`}
          style={{ width: `${yes}%` }}
        />
        <div className={`w-px shrink-0 ${theme === 'dark' ? 'bg-white/20' : 'bg-black/15'}`} />
        <div
          className={`h-full ${theme === 'dark' ? 'bg-red-400/50' : 'bg-red-400/40'} rounded-r`}
          style={{ width: `${no}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono tabular-nums w-8 shrink-0 ${
        theme === 'dark' ? 'text-red-400/70' : 'text-red-500/70'
      }`}>
        {no}%
      </span>
    </div>
  )
}

export function MarketRow({ market, index, isSelected, onSelect, userId }: MarketRowProps) {
  const { theme } = useTheme()
  const rc = riskClasses[theme]
  const tp = textOpacity[theme]
  const [buyDefaultSide, setBuyDefaultSide] = useState<'YES' | 'NO'>('YES')

  const borderClass = isSelected
    ? `border-l-2 ${rc[market.riskLevel].borderLeft}`
    : 'border-l-2 border-l-transparent'

  const borderB = theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.14]'
  const hoverBg = theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]'
  const selectedBg = theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.02]'
  const tagBorder = theme === 'dark' ? 'border-white/10' : 'border-black/[0.2]'

  const timeLeft = market.closeTime - Date.now()
  const countdown = market.status === 'LIVE' ? formatCountdown(timeLeft) : '—'

  function handleBuyClick(e: React.MouseEvent, side: 'YES' | 'NO') {
    e.stopPropagation()
    setBuyDefaultSide(side)
    if (!isSelected) onSelect(market.id)
  }

  return (
    <motion.div
      className={`${borderClass} border-b ${borderB} last:border-b-0 ${isSelected ? selectedBg : hoverBg} transition-colors`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      {/* Main clickable area */}
      <button
        className="w-full text-left px-4 pt-3 pb-1.5"
        onClick={() => onSelect(isSelected ? null : market.id)}
      >
        {/* Row A: badges + question + meta columns */}
        <div className="flex items-center gap-3">
          {/* Left: risk badge + category tag + question */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <RiskBadge level={market.riskLevel} />
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${tagBorder} ${tp.muted} shrink-0 leading-none`}>
              {CATEGORY_LABEL[market.category]}
            </span>
            <p className={`text-[12px] font-mono ${tp.primary} leading-snug truncate`}>
              {market.question}
            </p>
          </div>

          {/* VOL */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[11px] font-mono ${tp.secondary} tabular-nums`}>
              {formatVolume(market.volume24h)}
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>VOL</div>
          </div>

          {/* CLOSES */}
          <div className="shrink-0 text-right w-16">
            <div className={`text-[11px] font-mono ${tp.secondary} tabular-nums`}>
              {countdown}
            </div>
            <div className={`text-[8px] font-mono ${tp.faint}`}>CLOSES</div>
          </div>

          {/* STATUS */}
          <div className="shrink-0 w-16 text-right">
            <MarketStatusBadge status={market.status} />
          </div>
        </div>

        {/* Row B: probability bar */}
        <div className="mt-2.5">
          <ProbBar yes={market.yesPrice} theme={theme} />
        </div>
      </button>

      {/* Row C: inline buy buttons */}
      <div className="flex justify-end gap-2 px-4 pb-2.5 pt-0.5">
        <button
          onClick={(e) => handleBuyClick(e, 'YES')}
          className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-colors ${
            theme === 'dark'
              ? 'border-sky-300/30 bg-sky-300/[0.07] text-sky-300 hover:bg-sky-300/20'
              : 'border-sky-600/30 bg-sky-500/[0.07] text-sky-600 hover:bg-sky-500/20'
          }`}
        >
          BUY YES {market.yesPrice}¢
        </button>
        <button
          onClick={(e) => handleBuyClick(e, 'NO')}
          className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-colors ${
            theme === 'dark'
              ? 'border-red-400/30 bg-red-400/[0.07] text-red-400 hover:bg-red-400/20'
              : 'border-red-500/30 bg-red-400/[0.07] text-red-600 hover:bg-red-400/20'
          }`}
        >
          BUY NO {100 - market.yesPrice}¢
        </button>
      </div>

      {/* Inline expanded detail */}
      <AnimatePresence>
        {isSelected && (
          <MarketDetail market={market} userId={userId} defaultSide={buyDefaultSide} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
