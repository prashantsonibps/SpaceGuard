'use client'

import type { RiskLevel } from '@/data/conjunctions'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const riskConfig: Record<RiskLevel, { label: string; classes: string; dot: string }> = {
  CRITICAL: {
    label: 'CRITICAL',
    classes: 'bg-red-500/20 text-red-400 border border-red-500/40',
    dot: 'bg-red-400',
  },
  HIGH: {
    label: 'HIGH',
    classes: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
    dot: 'bg-orange-400',
  },
  MEDIUM: {
    label: 'MEDIUM',
    classes: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
    dot: 'bg-yellow-400',
  },
  LOW: {
    label: 'LOW',
    classes: 'bg-green-500/20 text-green-400 border border-green-500/40',
    dot: 'bg-green-400',
  },
}

export function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const config = riskConfig[level]
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        rounded text-xs font-mono font-medium
        ${config.classes} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  )
}
