'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/lib/api'
import { accent, riskClasses, textOpacity } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

interface BettingModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
  eventType: 'launch' | 'conjunction' | 'weather'
  userId: string
  onBetPlaced: () => void
}

export function BettingModal({ isOpen, onClose, eventId, eventName, eventType, userId, onBetPlaced }: BettingModalProps) {
  const { theme } = useTheme()
  const [amount, setAmount] = useState<number>(10)
  const [price, setPrice] = useState<number>(50)
  const [outcome, setOutcome] = useState<string>('YES')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBet = async () => {
    setLoading(true)
    setError(null)
    try {
      const safeOutcome = outcome === 'DELAY' ? 'NO' : (outcome as 'YES' | 'NO')
      await api.placeOrder(userId, eventId, safeOutcome, 'BUY', price, amount)
      onBetPlaced()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard className="w-80 p-6">
              <h2 className={`text-lg font-bold ${textOpacity[theme].primary} mb-4`}>Place Wager</h2>
              <p className={`text-sm ${textOpacity[theme].secondary} mb-4`}>Event: {eventName}</p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs ${textOpacity[theme].muted} mb-1`}>Outcome Prediction</label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className={`w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/10 rounded px-3 py-2 ${textOpacity[theme].primary} text-sm`}
                  >
                    {eventType === 'launch' ? (
                      <>
                        <option value="YES">SUCCESS (Nominal Insertion)</option>
                        <option value="NO">FAILURE (Anomaly)</option>
                        <option value="DELAY">DELAY (Scrubbed / Pushed)</option>
                      </>
                    ) : eventType === 'conjunction' ? (
                      <>
                        <option value="YES">COLLISION (Impact Confirmed)</option>
                        <option value="NO">MISS (Safe Passage)</option>
                      </>
                    ) : (
                      <>
                        <option value="YES">CRITICAL (Major Disruption)</option>
                        <option value="NO">SAFE (No Impact)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs ${textOpacity[theme].muted} mb-1`}>Limit Price (¢)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={`w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/10 rounded px-3 py-2 ${textOpacity[theme].primary} text-sm mb-3`}
                    min="1"
                    max="99"
                  />
                  <label className={`block text-xs ${textOpacity[theme].muted} mb-1`}>Contracts (Shares)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/10 rounded px-3 py-2 ${textOpacity[theme].primary} text-sm`}
                    min="1"
                  />
                </div>

                {error && (
                  <div className={`${riskClasses[theme].CRITICAL.text} text-xs`}>{error}</div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onClose}
                    className={`flex-1 py-2 text-xs ${textOpacity[theme].secondary} hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBet}
                    disabled={loading}
                    className={`flex-1 py-2 text-xs ${accent[theme].bg} ${accent[theme].bgHover} text-white rounded transition-colors disabled:opacity-50`}
                  >
                    {loading ? 'Placing...' : 'Confirm Bet'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
