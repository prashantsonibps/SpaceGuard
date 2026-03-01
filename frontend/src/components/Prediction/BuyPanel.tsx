'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { accent, textOpacity, fontSize, green } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { api } from '@/lib/api'
import type { Market } from '@/data/markets'

interface BuyPanelProps {
  market: Market
  userId: string | null
  defaultSide?: 'YES' | 'NO'
}

const QUICK_AMOUNTS = [25, 50, 100, 250]

export function BuyPanel({ market, userId, defaultSide }: BuyPanelProps) {
  const { theme } = useTheme()
  const ac = accent[theme]
  const tp = textOpacity[theme]

  const [side, setSide] = useState<'YES' | 'NO'>(defaultSide ?? 'YES')
  const [amount, setAmount] = useState(100)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (defaultSide) setSide(defaultSide)
  }, [defaultSide])

  const borderDim = theme === 'dark' ? 'border-white/10' : 'border-black/[0.2]'
  const bgInput = theme === 'dark' ? 'bg-white/5' : 'bg-black/[0.04]'
  const divider = theme === 'dark' ? 'border-white/10' : 'border-black/[0.18]'

  const isDisabled = market.status !== 'LIVE' || userId === null
  const price = side === 'YES' ? market.yesPrice : 100 - market.yesPrice
  const shares = price > 0 ? Math.floor((amount / price) * 100) : 0
  const potentialReturn = price > 0 ? (amount / price) * 100 : 0
  const multiplier = price > 0 ? (100 / price).toFixed(2) : '0.00'

  async function handleConfirm() {
    if (isDisabled || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      await api.placeBet(
        userId!,
        market.linkedEventId ?? market.id,
        'conjunction',
        amount,
        side,
      )
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Trade failed')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const toggleBase = `flex-1 py-1.5 ${fontSize.small} font-mono border rounded transition-colors flex flex-col items-center gap-0.5`
  const activeYes = theme === 'dark'
    ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400'
    : 'bg-emerald-600/[0.07] border-emerald-600/40 text-emerald-700'
  const activeNo = theme === 'dark'
    ? 'bg-red-400/10 border-red-400/40 text-red-400'
    : 'bg-red-500/[0.07] border-red-500/40 text-red-600'
  const inactive = `bg-transparent ${borderDim} ${tp.muted}`

  return (
    <GlassCard animate={false} className="p-3 flex flex-col gap-2">
      {/* Side toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setSide('YES')}
          disabled={isDisabled}
          className={`${toggleBase} ${side === 'YES' ? activeYes : inactive} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span className="font-bold">YES</span>
          <span className={`${fontSize.small} opacity-70`}>{market.yesPrice}¢</span>
        </button>
        <button
          onClick={() => setSide('NO')}
          disabled={isDisabled}
          className={`${toggleBase} ${side === 'NO' ? activeNo : inactive} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span className="font-bold">NO</span>
          <span className={`${fontSize.small} opacity-70`}>{100 - market.yesPrice}¢</span>
        </button>
      </div>

      {/* Amount input */}
      <div>
        <div className={`${fontSize.small} font-mono ${tp.muted} tracking-widest mb-1`}>AMOUNT (USD)</div>
        <div className={`flex items-center gap-1 ${bgInput} border ${borderDim} rounded px-2 py-1 ${isDisabled ? 'opacity-30' : ''}`}>
          <span className={`${fontSize.small} font-mono ${tp.tertiary}`}>$</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            disabled={isDisabled}
            className={`flex-1 bg-transparent ${fontSize.base} font-mono ${tp.primary} outline-none w-0 tabular-nums`}
          />
        </div>

        {/* Quick-fill buttons */}
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              disabled={isDisabled}
              className={`flex-1 py-0.5 ${fontSize.small} font-mono rounded border ${borderDim} ${tp.muted} transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {a}
            </button>
          ))}
          <button
            onClick={() => setAmount(1000)}
            disabled={isDisabled}
            className={`flex-1 py-0.5 ${fontSize.small} font-mono rounded border ${borderDim} ${tp.muted} transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t ${divider}`} />

      {/* Metrics */}
      <div className="space-y-1">
        <div className={`flex justify-between ${fontSize.small} font-mono`}>
          <span className={tp.muted}>POTENTIAL RETURN</span>
          <span className={`${ac.text} tabular-nums`}>
            ${potentialReturn.toFixed(2)} <span className={tp.faint}>{multiplier}x</span>
          </span>
        </div>
        <div className={`flex justify-between ${fontSize.small} font-mono`}>
          <span className={tp.muted}>SHARES</span>
          <span className={`${tp.secondary} tabular-nums`}>{shares}</span>
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t ${divider}`} />

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isDisabled || status === 'loading'}
        className={`
          w-full py-2 ${fontSize.small} font-mono font-bold tracking-widest rounded border
          transition-colors
          ${isDisabled
            ? `opacity-30 cursor-not-allowed ${borderDim} ${tp.faint}`
            : status === 'success'
            ? `${green[theme].border}/40 ${green[theme].bgMuted} ${green[theme].text}`
            : status === 'error'
            ? 'border-red-400/40 bg-red-400/10 text-red-400'
            : side === 'YES'
            ? (theme === 'dark' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-600/40 bg-emerald-600/[0.07] text-emerald-700 hover:bg-emerald-600/15')
            : (theme === 'dark' ? 'border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/20' : 'border-red-500/40 bg-red-500/[0.07] text-red-600 hover:bg-red-500/15')
          }
        `}
      >
        {status === 'loading'
          ? '...'
          : status === 'success'
          ? '✓ ORDER PLACED'
          : status === 'error'
          ? `✗ ${errorMsg.slice(0, 24)}`
          : `CONFIRM BUY ${side}`
        }
      </button>

      {/* No user warning */}
      {userId === null && (
        <p className={`text-center ${fontSize.small} font-mono ${tp.muted}`}>
          Connect wallet to trade
        </p>
      )}
    </GlassCard>
  )
}
