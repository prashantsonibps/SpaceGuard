'use client'

import { useEffect, useState } from 'react'
import { api, apiEvents, OrderBook as OrderBookType } from '@/lib/api'
import { useTheme } from '@/lib/ThemeContext'
import { textOpacity, fontSize } from '@/lib/theme'

export function OrderBook({ marketId, defaultSide }: { marketId: string, defaultSide: 'YES' | 'NO' }) {
    const [book, setBook] = useState<OrderBookType | null>(null)
    const { theme } = useTheme()
    const tp = textOpacity[theme]

    useEffect(() => {
        let mounted = true
        const fetchBook = async () => {
            try {
                const data = await api.getOrderbook(marketId)
                if (mounted) setBook(data)
            } catch (e) { }
        }
        fetchBook()
        const int = setInterval(fetchBook, 3000)
        return () => {
            mounted = false
            clearInterval(int)
        }
    }, [marketId])

    useEffect(() => {
        const handleNewOrder = (e: Event) => {
            const customEvent = e as CustomEvent;
            const newOrder = customEvent.detail;
            if (newOrder.market_id !== marketId) return;

            setBook(prevBook => {
                if (!prevBook) return null;
                const updatedBook = JSON.parse(JSON.stringify(prevBook)); // Deep copy
                const key = `${newOrder.outcome}_${newOrder.action}`;
                updatedBook[key].push({
                    price_cents: newOrder.price_cents,
                    quantity: newOrder.quantity
                });
                return updatedBook;
            });
        };

        apiEvents.addEventListener('orderPlaced', handleNewOrder);
        return () => apiEvents.removeEventListener('orderPlaced', handleNewOrder);
    }, [marketId]);

    if (!book) return <div className={`text-center ${fontSize.small} font-mono opacity-50 p-4`}>Loading order book...</div>

    const bids: Record<number, number> = {}
    const asks: Record<number, number> = {}

    const add = (obj: Record<number, number>, p: number, q: number) => {
        if (p > 0 && p < 100) obj[p] = (obj[p] || 0) + q
    }

    if (defaultSide === 'YES') {
        book.YES_BUY.forEach(o => add(bids, o.price_cents, o.quantity))
        book.NO_SELL.forEach(o => add(bids, 100 - o.price_cents, o.quantity))

        book.YES_SELL.forEach(o => add(asks, o.price_cents, o.quantity))
        book.NO_BUY.forEach(o => add(asks, 100 - o.price_cents, o.quantity))
    } else {
        book.NO_BUY.forEach(o => add(bids, o.price_cents, o.quantity))
        book.YES_SELL.forEach(o => add(bids, 100 - o.price_cents, o.quantity))

        book.NO_SELL.forEach(o => add(asks, o.price_cents, o.quantity))
        book.YES_BUY.forEach(o => add(asks, 100 - o.price_cents, o.quantity))
    }

    const bidRows = Object.entries(bids).map(([p, q]) => ({ price: Number(p), qty: q })).sort((a, b) => b.price - a.price).slice(0, 5)
    const askRows = Object.entries(asks).map(([p, q]) => ({ price: Number(p), qty: q })).sort((a, b) => a.price - b.price).slice(0, 5)

    const displayAsks = [...askRows].reverse()

    // Add cumulative depth logic for background fill
    let askTotal = 0
    displayAsks.forEach(r => askTotal += r.qty)
    let curAskSum = 0
    const asksWithDepth = displayAsks.map(r => {
        curAskSum += r.qty
        return { ...r, depthPct: askTotal > 0 ? (curAskSum / askTotal) * 100 : 0 }
    })

    let curBidSum = 0
    let bidTotal = 0
    bidRows.forEach(r => bidTotal += r.qty)
    const bidsWithDepth = bidRows.map(r => {
        curBidSum += r.qty
        return { ...r, depthPct: bidTotal > 0 ? (curBidSum / bidTotal) * 100 : 0 }
    })

    const borderDim = theme === 'dark' ? 'border-white/10' : 'border-black/[0.1]'
    const cellStyle = `font-mono ${fontSize.small} flex-1 text-right pt-0.5 pb-0.5 relative z-10`

    // Spread calculation
    const spread = (askRows.length > 0 && bidRows.length > 0) ? (askRows[0].price - bidRows[0].price).toFixed(1) : '-'

    return (
        <div className={`border ${borderDim} rounded px-3 py-2 bg-black/5 dark:bg-white/5`}>
            <div className={`flex text-[10px] font-mono font-bold tracking-widest ${tp.muted} mb-1 border-b ${borderDim} pb-1`}>
                <div className="flex-1 opacity-60">QTY</div>
                <div className="flex-1 text-right">{defaultSide} PRICE (¢)</div>
            </div>

            <div className="flex flex-col">
                <div className="flex flex-col gap-0.5">
                    {asksWithDepth.length > 0 ? asksWithDepth.map((r, i) => (
                        <div key={`ask-${i}`} className="flex text-red-500 dark:text-red-400 relative group overflow-hidden">
                            <div
                                className="absolute top-0 right-0 bottom-0 bg-red-500/10 dark:bg-red-500/20 transition-all duration-300 ease-out"
                                style={{ width: `${r.depthPct}%` }}
                            />
                            <div className={cellStyle + " text-left opacity-70"}>{r.qty}</div>
                            <div className={cellStyle + " font-bold pr-1"}>{r.price}¢</div>
                        </div>
                    )) : <div className="text-center text-[10px] font-mono opacity-30 py-1">No resting asks</div>}

                    <div className={`text-center py-1 opacity-50 ${fontSize.small} font-mono tracking-widest`}>spread {spread}¢</div>

                    {bidsWithDepth.length > 0 ? bidsWithDepth.map((r, i) => (
                        <div key={`bid-${i}`} className="flex text-emerald-600 dark:text-emerald-400 relative group overflow-hidden">
                            <div
                                className="absolute top-0 right-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all duration-300 ease-out"
                                style={{ width: `${r.depthPct}%` }}
                            />
                            <div className={cellStyle + " text-left opacity-70"}>{r.qty}</div>
                            <div className={cellStyle + " font-bold pr-1"}>{r.price}¢</div>
                        </div>
                    )) : <div className="text-center text-[10px] font-mono opacity-30 py-1">No resting bids</div>}
                </div>
            </div>
        </div>
    )
}
