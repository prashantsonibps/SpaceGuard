'use client'

import { motion } from 'framer-motion'
import { accent, fontSize, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

export type TabType = 'TRENDING' | 'SAT' | 'NEO' | 'WEATHER' | 'INDEX' | 'FIREBALL'

interface CategoryNavProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

const TABS: { id: TabType; label: string }[] = [
    { id: 'TRENDING', label: 'Trending' },
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
        bg-white/60 dark:bg-black/30 backdrop-blur-md border-b border-black/10 dark:border-white/5 overflow-x-auto no-scrollbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <div className="flex items-center gap-1 min-w-max">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-3 py-1 rounded-full font-mono ${fontSize.small} transition-all duration-200 whitespace-nowrap
                ${isActive
                                    ? `${accent[theme].text} ${accent[theme].bgDim} font-bold border ${accent[theme].borderDim}`
                                    : `${textOpacity[theme].faint} hover:${textOpacity[theme].primary} hover:bg-black/5 dark:hover:bg-white/5`
                                }`}
                        >
                            {tab.label.toUpperCase()}
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}
