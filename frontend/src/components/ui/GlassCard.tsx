'use client'

import { ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { bg } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

interface GlassCardProps {
  children: ReactNode
  className?: string
  animate?: boolean
  style?: CSSProperties
}

export function GlassCard({ children, className = '', animate = true, style }: GlassCardProps) {
  const { theme } = useTheme()
  const base = `${bg[theme].glass} rounded-xl overflow-hidden`

  if (!animate) {
    return <div className={`${base} ${className}`} style={style}>{children}</div>
  }

  return (
    <motion.div
      className={`${base} ${className}`}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
