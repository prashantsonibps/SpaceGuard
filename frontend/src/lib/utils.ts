/**
 * Shared utility helpers used across pages.
 */

/**
 * Format a millisecond duration into "Xh YYm" countdown string.
 * Used by both EventsPanel (via conversion) and the prediction market page.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'EXPIRED'
  const totalMinutes = Math.floor(ms / (1000 * 60))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

/**
 * Format a USD dollar amount with K/M suffix.
 */
export function formatVolume(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}k`
  return `$${usd.toFixed(0)}`
}
