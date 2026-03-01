'use client'

import { motion } from 'framer-motion'
import { accent, riskClasses, financialColors } from '@/lib/theme'

export function TopBar() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-50 h-12 flex items-center px-6 gap-6
        bg-black/40 backdrop-blur-md border-b border-white/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${accent.dark.dot} animate-pulse`} />
        <span className={`font-orbitron text-sm font-bold tracking-widest ${accent.dark.text}`}>
          SPACEGUARD
        </span>
      </div>

      <div className="h-4 w-px bg-white/20" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-xs font-mono">LIVE</span>
      </div>

      <div className="h-4 w-px bg-white/20" />

      {/* Stats */}
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">TRACKING</span>
          <span className="text-white font-medium">847</span>
          <span className="text-white/40">SATELLITES</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${riskClasses.dark.CRITICAL.dot} animate-pulse`} />
          <span className={`${riskClasses.dark.CRITICAL.text} font-medium`}>3</span>
          <span className="text-white/40">CRITICAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">PORTFOLIO</span>
          <span className={`${financialColors.dark.balance} font-medium`}>$2.4B</span>
          <span className="text-white/40">AT RISK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">ACTIVE HEDGES</span>
          <span className={`${accent.dark.text} font-medium`}>7</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs font-mono text-white/40">
        <span>TLE UPDATED</span>
        <span className="text-white/60">2m ago</span>
      </div>
    </motion.div>
  )
}
