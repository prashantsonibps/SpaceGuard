'use client'

import type { RiskLevel } from '@/components/Dashboard/EventsPanel'
import { riskClasses } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const riskLabels: Record<RiskLevel, string> = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

export function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const { theme } = useTheme()
  const colors = riskClasses[theme][level]
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        rounded text-xs font-mono font-medium
        ${colors.bg} ${colors.text} border ${colors.border} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
      {riskLabels[level]}
    </span>
  )
}
