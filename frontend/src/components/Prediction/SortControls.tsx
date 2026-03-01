'use client'

import { accent, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'
import type { Market } from '@/data/markets'

export type SortKey = 'VOLUME' | 'EXPIRY' | 'PRICE' | 'RISK'

interface SortControlsProps {
  sortBy: SortKey
  onSort: (key: SortKey) => void
  markets: Market[]
}

const SORT_KEYS: SortKey[] = ['VOLUME', 'EXPIRY', 'PRICE', 'RISK']

export function SortControls({ sortBy, onSort, markets }: SortControlsProps) {
  const { theme } = useTheme()
  const ac = accent[theme]
  const tp = textOpacity[theme]
  const liveCount = markets.filter(m => m.status === 'LIVE').length

  return (
    <div className={`h-10 flex items-center px-4 gap-3 border-b border-white/10`}>
      <span className={`text-[9px] font-mono ${tp.muted} tracking-widest shrink-0`}>SORT:</span>
      <div className="flex items-center gap-1.5">
        {SORT_KEYS.map(key => (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`
              px-2 py-0.5 text-[9px] font-mono rounded border transition-colors
              ${sortBy === key
                ? `${ac.bgDim} border-sky-300/40 ${ac.text}`
                : `border-white/10 ${tp.muted} hover:${tp.secondary} hover:border-white/20`
              }
            `}
          >
            {key}{sortBy === key ? '▼' : ''}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className={`text-[9px] font-mono ${tp.muted}`}>
          {markets.length} MARKETS
        </span>
        <span className={`text-[9px] font-mono ${tp.faint}`}>·</span>
        <span className={`text-[9px] font-mono text-green-400`}>
          {liveCount} LIVE
        </span>
      </div>
    </div>
  )
}
