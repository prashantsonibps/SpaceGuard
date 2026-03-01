'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { accent, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { api } from '@/lib/api'
import type { Market } from '@/data/markets'

interface BuyPanelProps {
  market: Market
  userId: string | null
}

const QUICK_AMOUNTS = [25, 50, 100, 250]

export function BuyPanel({ market, userId }: BuyPanelProps) {
  const { theme } = useTheme()
  const ac = accent[theme]
  const tp = textOpacity[theme]

  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState(100)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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

  const toggleBase = `flex-1 py-1.5 text-[10px] font-mono border rounded transition-colors flex flex-col items-center gap-0.5`
  const activeStyle = `${ac.bgDim} border-sky-300/40 ${ac.text}`
  const inactiveStyle = `bg-transparent border-white/10 ${tp.muted} hover:${tp.secondary}`

  return (
    <GlassCard animate={false} className="p-3 flex flex-col gap-2">
      {/* Side toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setSide('YES')}
          disabled={isDisabled}
          className={`${toggleBase} ${side === 'YES' ? activeStyle : inactiveStyle} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span className="font-bold">YES</span>
          <span className="text-[8px] opacity-70">{market.yesPrice}¢</span>
        </button>
        <button
          onClick={() => setSide('NO')}
          disabled={isDisabled}
          className={`${toggleBase} ${side === 'NO' ? 'bg-red-400/10 border-red-400/40 text-red-400' : inactiveStyle} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span className="font-bold">NO</span>
          <span className="text-[8px] opacity-70">{100 - market.yesPrice}¢</span>
        </button>
      </div>

      {/* Amount input */}
      <div>
        <div className={`text-[8px] font-mono ${tp.muted} tracking-widest mb-1`}>AMOUNT (USD)</div>
        <div className={`flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1 ${isDisabled ? 'opacity-30' : ''}`}>
          <span className={`text-[10px] font-mono ${tp.tertiary}`}>$</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            disabled={isDisabled}
            className="flex-1 bg-transparent text-[11px] font-mono text-white/90 outline-none w-0 tabular-nums"
          />
        </div>

        {/* Quick-fill buttons */}
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              disabled={isDisabled}
              className={`flex-1 py-0.5 text-[9px] font-mono rounded border border-white/10 ${tp.muted} hover:${tp.secondary} hover:border-white/20 transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {a}
            </button>
          ))}
          <button
            onClick={() => setAmount(1000)}
            disabled={isDisabled}
            className={`flex-1 py-0.5 text-[9px] font-mono rounded border border-white/10 ${tp.muted} hover:${tp.secondary} hover:border-white/20 transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Metrics */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-mono">
          <span className={tp.muted}>POTENTIAL RETURN</span>
          <span className={`${ac.text} tabular-nums`}>
            ${potentialReturn.toFixed(2)} <span className={tp.faint}>{multiplier}x</span>
          </span>
        </div>
        <div className="flex justify-between text-[9px] font-mono">
          <span className={tp.muted}>SHARES</span>
          <span className={`${tp.secondary} tabular-nums`}>{shares}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isDisabled || status === 'loading'}
        className={`
          w-full py-2 text-[10px] font-mono font-bold tracking-widest rounded border
          transition-colors
          ${isDisabled
            ? 'opacity-30 cursor-not-allowed border-white/10 text-white/40'
            : status === 'success'
            ? 'border-green-400/40 bg-green-400/10 text-green-400'
            : status === 'error'
            ? 'border-red-400/40 bg-red-400/10 text-red-400'
            : `border-sky-300/40 ${ac.bgDim} ${ac.text} hover:bg-sky-300/20`
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
        <p className={`text-center text-[8px] font-mono ${tp.muted}`}>
          Connect wallet to trade
        </p>
      )}
    </GlassCard>
  )
}
