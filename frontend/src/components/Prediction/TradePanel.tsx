'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { accent, textOpacity, fontSize, green } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import { api } from '@/lib/api'
import type { Market } from '@/data/markets'

interface TradePanelProps {
    market: Market
    userId: string | null
    defaultSide?: 'YES' | 'NO'
}

export function TradePanel({ market, userId, defaultSide }: TradePanelProps) {
    const { theme } = useTheme()
    const ac = accent[theme]
    const tp = textOpacity[theme]

    const [side, setSide] = useState<'YES' | 'NO'>(defaultSide ?? 'YES')
    const [action, setAction] = useState<'BUY' | 'SELL'>('BUY')
    const [contracts, setContracts] = useState(10)
    const [price, setPrice] = useState(side === 'YES' ? market.yesPrice : 100 - market.yesPrice)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (defaultSide) {
            setSide(defaultSide)
            setPrice(defaultSide === 'YES' ? market.yesPrice : 100 - market.yesPrice)
        }
    }, [defaultSide, market.yesPrice])

    const borderDim = theme === 'dark' ? 'border-white/10' : 'border-black/[0.2]'
    const bgInput = theme === 'dark' ? 'bg-white/5' : 'bg-black/[0.04]'
    const divider = theme === 'dark' ? 'border-white/10' : 'border-black/[0.18]'

    const isDisabled = market.status !== 'LIVE' || userId === null
    const totalCost = (contracts * price) / 100
    const potentialPayout = contracts

    // Mock user balance for the sliders (In prod, fetch from UserContext)
    const availableBalance = 10000.00

    // Max Loss / Max Profit dynamic readouts
    const maxLoss = action === 'BUY' ? totalCost : (contracts * (100 - price)) / 100
    const maxProfit = action === 'BUY' ? potentialPayout - totalCost : (contracts * price) / 100

    const handlePercentClick = (pct: number) => {
        if (action === 'BUY') {
            // How many contracts can we afford with X% of our cash?
            const targetCash = availableBalance * pct
            const maxAffordableContracts = Math.floor((targetCash * 100) / price)
            setContracts(maxAffordableContracts > 0 ? maxAffordableContracts : 1)
        } else {
            // For selling, we usually base it off existing shares, but for demo we just mock a max amount
            setContracts(Math.floor(100 * pct))
        }
    }

    async function handleConfirm() {
        if (isDisabled || status === 'loading') return
        setStatus('loading')
        setErrorMsg('')
        try {
            await api.placeOrder(
                userId!,
                market.linkedEventId ?? market.id,
                side,
                action,
                price,
                contracts
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
        ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
        : 'bg-sky-500/[0.07] border-sky-500/40 text-sky-600'
    const inactiveBtn = `bg-transparent ${borderDim} ${tp.muted}`

    return (
        <GlassCard animate={false} className="p-3 flex flex-col gap-3">
            <div className="flex gap-1.5">
                <button onClick={() => setSide('YES')} disabled={isDisabled} className={`${toggleBase} ${side === 'YES' ? activeYes : inactiveBtn}`}>
                    <span className="font-bold tracking-wider">YES</span>
                </button>
                <button onClick={() => setSide('NO')} disabled={isDisabled} className={`${toggleBase} ${side === 'NO' ? activeNo : inactiveBtn}`}>
                    <span className="font-bold tracking-wider">NO</span>
                </button>
            </div>

            <div className="flex gap-1.5">
                <button onClick={() => setAction('BUY')} disabled={isDisabled} className={`flex-1 py-1 ${fontSize.small} font-bold border rounded transition-colors ${action === 'BUY' ? 'bg-white/10 border-white/30 text-white' : inactiveBtn}`}>BUY</button>
                <button onClick={() => setAction('SELL')} disabled={isDisabled} className={`flex-1 py-1 ${fontSize.small} font-bold border rounded transition-colors ${action === 'SELL' ? 'bg-white/10 border-white/30 text-white' : inactiveBtn}`}>SELL</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <div className={`${fontSize.small} font-mono ${tp.muted} mb-1 tracking-wider`}>LIMIT PRICE (¢)</div>
                    <input type="number" min={1} max={99} value={price} onChange={e => setPrice(Number(e.target.value))} disabled={isDisabled} className={`w-full ${bgInput} border ${borderDim} rounded px-2 py-1.5 ${fontSize.base} font-mono text-center outline-none transition-colors focus:border-white/30`} />
                </div>
                <div>
                    <div className={`${fontSize.small} font-mono ${tp.muted} mb-1 tracking-wider`}>CONTRACTS</div>
                    <input type="number" min={1} value={contracts} onChange={e => setContracts(Number(e.target.value))} disabled={isDisabled} className={`w-full ${bgInput} border ${borderDim} rounded px-2 py-1.5 ${fontSize.base} font-mono text-center outline-none transition-colors focus:border-white/30`} />
                </div>
            </div>

            <div className="flex gap-1 mt-1 justify-between">
                {[0.25, 0.50, 0.75, 1.0].map(pct => (
                    <button
                        key={pct}
                        onClick={() => handlePercentClick(pct)}
                        className={`flex-1 py-1 text-[10px] font-mono border ${borderDim} rounded ${bgInput} hover:bg-white/10 transition-colors ${tp.secondary}`}
                    >
                        {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                    </button>
                ))}
            </div>

            <div className={`border-t ${divider} mt-1`} />

            {action === 'BUY' && (
                <div className="space-y-1">
                    <div className={`flex justify-between ${fontSize.small} font-mono`}>
                        <span className={tp.muted}>TOTAL COST (MAX LOSS)</span>
                        <span className={`${ac.text}`}>${maxLoss.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between ${fontSize.small} font-mono`}>
                        <span className={tp.muted}>MAX PROFIT</span>
                        <span className={`${green[theme].text}`}>${maxProfit.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {action === 'SELL' && (
                <div className="space-y-1">
                    <div className={`flex justify-between ${fontSize.small} font-mono`}>
                        <span className={tp.muted}>CREDIT RECEIVED</span>
                        <span className={`${green[theme].text}`}>${totalCost.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between text-[10px] font-mono leading-tight ${tp.faint}`}>
                        <span>Requires existing position or margin.</span>
                    </div>
                </div>
            )}

            <button onClick={handleConfirm} disabled={isDisabled || status === 'loading'} className={`w-full py-2 ${fontSize.small} font-mono font-bold tracking-widest rounded transition-colors border ${status === 'loading' ? 'opacity-50 border-transparent bg-white/5 text-white/50' : status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/50' : side === 'YES' ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30' : 'bg-sky-600/20 text-sky-400 border-sky-400/50 hover:bg-sky-500/30'}`}>
                {status === 'loading' ? 'SUBMITTING...' : status === 'success' ? '✓ SUBMITTED' : status === 'error' ? '✗ ERROR' : 'PLACE ORDER'}
            </button>

            {errorMsg && <div className={`text-red-400 text-center text-xs break-words px-2`}>{errorMsg}</div>}

            {userId === null && (
                <p className={`text-center ${fontSize.small} font-mono ${tp.muted}`}>Connect wallet to trade</p>
            )}
        </GlassCard>
    )
}
