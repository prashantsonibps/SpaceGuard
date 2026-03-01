'use client'

import { ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  animate?: boolean
  style?: CSSProperties
}

export function GlassCard({ children, className = '', animate = true, style }: GlassCardProps) {
  const base = `
    bg-white/5 backdrop-blur-md border border-white/10
    rounded-xl overflow-hidden
  `

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
