'use client'

import { useTheme } from '@/lib/ThemeContext'
import type { MarketStatus } from '@/data/markets'

interface MarketStatusBadgeProps {
  status: MarketStatus
}

export function MarketStatusBadge({ status }: MarketStatusBadgeProps) {
  const { theme } = useTheme()
  if (status === 'LIVE') {
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-green-600'} animate-pulse`} />
        LIVE
      </span>
    )
  }
  if (status === 'RESOLVED_YES') {
    return <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>✓ YES</span>
  }
  if (status === 'RESOLVED_NO') {
    return <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>✗ NO</span>
  }
  return <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-white/40' : 'text-zinc-400'}`}>CLOSED</span>
}
