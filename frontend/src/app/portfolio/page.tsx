'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/Dashboard/TopBar'
import { GlassCard } from '@/components/ui/GlassCard'
import { api, Portfolio as PortfolioType } from '@/lib/api'
import { useTheme } from '@/lib/ThemeContext'
import { textOpacity, fontSize, accent } from '@/lib/theme'

export default function PortfolioPage() {
    const { theme } = useTheme()
    const tp = textOpacity[theme]
    const borderDim = theme === 'dark' ? 'border-white/10' : 'border-black/[0.1]'

    const [portfolio, setPortfolio] = useState<PortfolioType | null>(null)

    // Use a hardcoded user ID for demo purposes.
    // In a real app this would come from an auth provider.
    const USER_ID = "trader_1"

    useEffect(() => {
        let mounted = true
        const init = async () => {
            try {
                await api.initUser(USER_ID)
                const data = await api.getUserPortfolio(USER_ID)
                if (mounted) setPortfolio(data)
            } catch {
                // Failed to load portfolio
            }
        }
        init()
        const int = setInterval(async () => {
            try {
                const data = await api.getUserPortfolio(USER_ID)
                if (mounted) setPortfolio(data)
            } catch (e) { }
        }, 2000)
        return () => {
            mounted = false
            clearInterval(int)
        }
    }, [])

    return (
        <div className={`w-screen h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-zinc-50 text-slate-900'}`}>
            <TopBar variant="inline" />

            <main className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full flex flex-col gap-6">
                <h1 className={`font-orbitron font-bold text-2xl tracking-widest ${accent[theme].text}`}>PORTFOLIO</h1>

                {!portfolio ? (
                    <div className="animate-pulse flex gap-4 text-sm font-mono opacity-50">Loading profile data...</div>
                ) : (
                    <>
                        {/* Account Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <GlassCard className="p-4 flex flex-col gap-1">
                                <span className={`${fontSize.small} font-mono ${tp.muted}`}>AVAILABLE CASH (DEMO USD)</span>
                                <span className={`text-3xl font-mono font-bold ${accent[theme].text}`}>
                                    ${portfolio.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </GlassCard>

                            <GlassCard className="p-4 flex flex-col gap-1">
                                <span className={`${fontSize.small} font-mono ${tp.muted}`}>TOTAL POSITIONS</span>
                                <span className={`text-3xl font-mono font-bold ${tp.primary}`}>
                                    {portfolio.positions.reduce((acc, p) => acc + p.yes_shares + p.no_shares, 0)} SHARES
                                </span>
                            </GlassCard>

                            <GlassCard className="p-4 flex flex-col gap-1">
                                <span className={`${fontSize.small} font-mono ${tp.muted}`}>WORKING ORDERS</span>
                                <span className={`text-3xl font-mono font-bold ${tp.primary}`}>
                                    {portfolio.open_orders.length}
                                </span>
                            </GlassCard>
                        </div>

                        {/* Positions Table */}
                        <GlassCard className="flex flex-col overflow-hidden">
                            <div className={`px-4 py-3 border-b ${borderDim} bg-black/5 dark:bg-white/5`}>
                                <h2 className={`font-orbitron font-bold tracking-widest ${tp.secondary}`}>YOUR POSITIONS</h2>
                            </div>
                            <div className="p-0">
                                {portfolio.positions.length === 0 ? (
                                    <div className={`p-8 text-center font-mono ${fontSize.small} ${tp.muted}`}>No active positions</div>
                                ) : (
                                    <table className="w-full text-left font-mono text-sm">
                                        <thead className={`text-[10px] tracking-widest ${tp.muted} border-b ${borderDim}`}>
                                            <tr>
                                                <th className="px-4 py-3 font-normal">MARKET</th>
                                                <th className="px-4 py-3 font-normal text-right">YES SHARES</th>
                                                <th className="px-4 py-3 font-normal text-right">NO SHARES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                            {portfolio.positions.map((p, i) => (
                                                <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <td className={`px-4 py-3 ${tp.primary}`}>{p.market_id}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{p.yes_shares > 0 ? p.yes_shares : '-'}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-red-500 dark:text-red-400">{p.no_shares > 0 ? p.no_shares : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </GlassCard>

                        {/* Open Orders Table */}
                        <GlassCard className="flex flex-col overflow-hidden">
                            <div className={`px-4 py-3 border-b ${borderDim} bg-black/5 dark:bg-white/5`}>
                                <h2 className={`font-orbitron font-bold tracking-widest ${tp.secondary}`}>WORKING ORDERS</h2>
                            </div>
                            <div className="p-0">
                                {portfolio.open_orders.length === 0 ? (
                                    <div className={`p-8 text-center font-mono ${fontSize.small} ${tp.muted}`}>No working orders</div>
                                ) : (
                                    <table className="w-full text-left font-mono text-sm">
                                        <thead className={`text-[10px] tracking-widest ${tp.muted} border-b ${borderDim}`}>
                                            <tr>
                                                <th className="px-4 py-3 font-normal">MARKET</th>
                                                <th className="px-4 py-3 font-normal">SIDE</th>
                                                <th className="px-4 py-3 font-normal text-right">LIMIT PRICE</th>
                                                <th className="px-4 py-3 font-normal text-right">FILLED / QTY</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                            {portfolio.open_orders.map(o => (
                                                <tr key={o.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <td className={`px-4 py-3 ${tp.primary}`}>{o.market_id}</td>
                                                    <td className={`px-4 py-3 font-bold ${o.outcome === 'YES' && o.action === 'BUY' ? 'text-emerald-600 dark:text-emerald-400' : o.outcome === 'NO' && o.action === 'BUY' ? 'text-sky-600 dark:text-sky-400' : 'text-red-500 dark:text-red-400'}`}>
                                                        {o.action} {o.outcome}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right tabular-nums ${tp.primary}`}>{o.price_cents}¢</td>
                                                    <td className={`px-4 py-3 text-right tabular-nums ${tp.secondary}`}>{o.filled} / {o.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </GlassCard>

                    </>
                )}
            </main>
        </div>
    )
}
