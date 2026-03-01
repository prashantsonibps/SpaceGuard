'use client'

import { motion } from 'framer-motion'
import { accent, fontSize, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

export type TabType = 'TRENDING' | 'SAT' | 'NEO' | 'WEATHER' | 'INDEX' | 'FIREBALL' | 'LAUNCH'

interface CategoryNavProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

const TABS: { id: TabType; label: string }[] = [
    { id: 'TRENDING', label: 'Trending' },
    { id: 'LAUNCH', label: 'Launches' },
    { id: 'SAT', label: 'Satellites' },
    { id: 'NEO', label: 'Asteroids' },
    { id: 'WEATHER', label: 'Weather' },
    { id: 'INDEX', label: 'Indices' },
    { id: 'FIREBALL', label: 'Meteors' },
]

export function CategoryNav({ activeTab, onTabChange }: CategoryNavProps) {
    const { theme } = useTheme()

    return (
        <motion.div
            className="absolute top-12 left-0 right-0 z-40 h-10 flex items-center px-6 gap-2
        overflow-x-auto no-scrollbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <div className="flex items-center gap-1 min-w-max">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const activeColor = accent[theme].hex
                    const inactiveColor = theme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(161,161,170,1)'
                    const activeBg = accent[theme].hexDim
                    const activeBorder = theme === 'dark' ? 'rgba(125,211,252,0.3)' : 'rgba(113,113,122,0.4)'
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-3 py-1 rounded-full font-mono ${fontSize.small} whitespace-nowrap border`}
                            animate={{
                                color: isActive ? activeColor : inactiveColor,
                                backgroundColor: isActive ? activeBg : 'rgba(0,0,0,0)',
                                borderColor: isActive ? activeBorder : 'rgba(0,0,0,0)',
                                fontWeight: isActive ? 700 : 400,
                                opacity: isActive ? 1 : 0.7,
                            }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            whileHover={{ opacity: 1 }}
                        >
                            {tab.label.toUpperCase()}
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>
    )
}
