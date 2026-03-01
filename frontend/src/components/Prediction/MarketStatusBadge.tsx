'use client'

import type { MarketStatus } from '@/data/markets'

interface MarketStatusBadgeProps {
  status: MarketStatus
}

export function MarketStatusBadge({ status }: MarketStatusBadgeProps) {
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE
      </span>
    )
  }
  if (status === 'RESOLVED_YES') {
    return <span className="text-[9px] font-mono text-green-300">✓ YES</span>
  }
  if (status === 'RESOLVED_NO') {
    return <span className="text-[9px] font-mono text-red-300">✗ NO</span>
  }
  return <span className="text-[9px] font-mono text-white/40">CLOSED</span>
}
