'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accent, riskClasses, fontSize, green } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

interface TopBarProps {
  variant?: 'overlay' | 'inline'
}

export function TopBar({ variant = 'overlay' }: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const positionClass = variant === 'overlay'
    ? 'absolute top-0 left-0 right-0 z-50'
    : 'relative w-full z-10'

  return (
    <motion.div
      className={`${positionClass} h-12 flex items-center px-6 gap-6
        bg-white/70 dark:bg-black/40 backdrop-blur-md border-b border-black/20 dark:border-white/10`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${accent[theme].dot} animate-pulse`} />
        <span className={`font-orbitron text-sm font-bold tracking-widest ${accent[theme].text}`}>
          SPACEGUARD
        </span>
      </div>

      <div className="h-4 w-px bg-black/20 dark:bg-white/20" />

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className={`${fontSize.small} font-mono px-2 py-0.5 rounded transition-colors ${pathname === '/'
            ? `${accent[theme].text} ${accent[theme].bgDim}`
            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
            }`}
        >
          GLOBE
        </Link>
        <Link
          href="/prediction"
          className={`${fontSize.small} font-mono px-2 py-0.5 rounded transition-colors ${pathname === '/prediction'
            ? `${accent[theme].text} ${accent[theme].bgDim}`
            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
            }`}
        >
          MARKETS
        </Link>
      </div>

      <div className="h-4 w-px bg-black/20 dark:bg-white/20" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${green[theme].bg} animate-pulse`} />
        <span className={`${green[theme].text} text-xs font-mono`}>LIVE</span>
      </div>

      <div className="h-4 w-px bg-black/20 dark:bg-white/20" />

      {/* Stats */}
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-white/40">TRACKING</span>
          <span className="text-slate-900 dark:text-white font-medium">847</span>
          <span className="text-slate-500 dark:text-white/40">SATELLITES</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${riskClasses[theme].CRITICAL.dot} animate-pulse`} />
          <span className={`${riskClasses[theme].CRITICAL.text} font-medium`}>3</span>
          <span className="text-slate-500 dark:text-white/40">CRITICAL</span>
        </div>
      </div>

      <div className="ml-auto" />

      {/* Light / Dark toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20
          text-slate-600 dark:text-white/70 transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </motion.div>
  )
}
