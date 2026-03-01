'use client'

import { motion } from 'framer-motion'
import type { Market, MarketCategory } from '@/data/markets'
import { useTheme } from '@/lib/ThemeContext'
import { textOpacity, fontSize, green } from '@/lib/theme'
import { Zap, Layers, Navigation, Shield, Globe } from 'lucide-react'

// ── Category meta ──────────────────────────────────────────────────────────────
export const CATEGORY_META: Record<
  MarketCategory,
  { bg: string; iconColor: string; Icon: React.ElementType }
> = {
  COLLISION: { bg: 'bg-red-500/20',     iconColor: 'text-red-400',     Icon: Zap        },
  DEBRIS:    { bg: 'bg-amber-500/20',   iconColor: 'text-amber-400',   Icon: Layers     },
  MANEUVER:  { bg: 'bg-blue-500/20',    iconColor: 'text-blue-400',    Icon: Navigation },
  HEDGE:     { bg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', Icon: Shield     },
  NEO:       { bg: 'bg-purple-500/20',  iconColor: 'text-purple-400',  Icon: Globe      },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
export function formatVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

export function formatTimeLeft(closeTime: number) {
  const ms = closeTime - Date.now()
  if (ms <= 0) return null
  const h = ms / 3_600_000
  if (h < 1)  return `${Math.round(h * 60)}m left`
  if (h < 48) return `${h.toFixed(1)}h left`
  return `${Math.floor(h / 24)}d left`
}

// ── Option row: label | full-width bar | multiplier | percentage button ────────
function OptionRow({
  label,
  pct,
  mult,
  color,
  onClick,
  disabled,
}: {
  label: string
  pct: number
  mult: string
  color: 'green' | 'sky'
  onClick?: () => void
  disabled?: boolean
}) {
  const { theme } = useTheme()
  const gr = green[theme]
  const barBg = color === 'green' ? gr.bgMuted : 'bg-sky-400/20'
  const barFill = color === 'green' ? gr.bg : 'bg-sky-400'
  const borderCls = color === 'green' ? gr.border : 'border-sky-400'
  const textCls = color === 'green' ? gr.text : 'text-sky-400'

  return (
    <div className="flex items-center gap-2 min-h-[28px]">
      <span className={`${fontSize.base} font-mono font-bold shrink-0 w-10 ${textCls}`}>
        {label}
      </span>
      <div className={`flex-1 min-w-0 h-1.5 rounded-full ${barBg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${barFill} transition-all`}
          style={{ width: `${Math.max(1, Math.min(100, pct))}%` }}
        />
      </div>
      <span className={`${fontSize.base} font-mono tabular-nums shrink-0 w-12 text-right opacity-70`}>
        {mult}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          shrink-0 px-3 py-1 rounded-full ${fontSize.base} font-mono font-bold tabular-nums
          border ${borderCls} ${textCls}
          transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {pct}%
      </button>
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function PredictionCard({ market }: { market: Market }) {
  const { theme } = useTheme()
  const tp = textOpacity[theme]
  const gr = green[theme]
  const { bg: catBg, iconColor, Icon } = CATEGORY_META[market.category]

  const borderClass = theme === 'dark' ? 'border-white/[0.07]' : 'border-black/[0.08]'
  const bgClass     = theme === 'dark' ? 'bg-neutral-900/60'   : 'bg-white/90'
  const hoverClass  = theme === 'dark' ? 'hover:bg-neutral-800/70' : 'hover:bg-white'

  const yesP    = market.yesPrice
  const noP     = 100 - yesP
  const yesMult = (100 / yesP).toFixed(2) + 'x'
  const noMult  = (100 / noP).toFixed(2) + 'x'

  const isResolved = market.status === 'RESOLVED_YES' || market.status === 'RESOLVED_NO'
  const isClosed   = market.status === 'CLOSED'
  const timeLeft   = formatTimeLeft(market.closeTime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-xl border ${borderClass} ${bgClass} ${hoverClass}
        transition-colors backdrop-blur-sm overflow-hidden
        ${isResolved || isClosed ? 'opacity-55' : ''}
      `}
    >
      {/* Header: icon + question */}
      <div className="p-3.5 pb-2.5">
        <div className="flex items-center gap-5">
          <div className={`w-7 h-7 rounded-lg ${catBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <p className={`${fontSize.base} font-mono leading-snug ${tp.secondary} flex-1`}>
            {market.question}
          </p>
        </div>
      </div>

      {/* YES / NO rows */}
      {isResolved ? (
        <div className="px-3.5 pb-3">
          <span
            className={`${fontSize.base} font-mono font-bold tracking-widest ${
              market.outcome === 'YES' ? gr.text : 'text-red-400'
            }`}
          >
            RESOLVED {market.outcome}
          </span>
        </div>
      ) : (
        <div className={`px-3.5 pb-3 space-y-3 ${isClosed ? 'pointer-events-none' : ''}`}>
          <OptionRow
            label="YES"
            pct={yesP}
            mult={yesMult}
            color="green"
            disabled={isClosed}
          />
          <OptionRow
            label="NO"
            pct={noP}
            mult={noMult}
            color="sky"
            disabled={isClosed}
          />
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-t ${borderClass}`}>
        <span className={`${fontSize.base} font-mono ${tp.faint}`}>
          {formatVol(market.totalVolume)} vol
        </span>
        {timeLeft ? (
          <span className={`${fontSize.base} font-mono ${tp.faint}`}>{timeLeft}</span>
        ) : isResolved ? (
          <span
            className={`${fontSize.base} font-mono font-bold tracking-widest ${
              market.outcome === 'YES' ? `${gr.text} opacity-70` : 'text-red-400/70'
            }`}
          >
            SETTLED
          </span>
        ) : (
          <span className={`${fontSize.base} font-mono ${tp.faint}`}>CLOSED</span>
        )}
      </div>
    </motion.div>
  )
}
