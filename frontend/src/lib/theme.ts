/**
 * Single source of truth for all UI colors.
 * Structure: each export has a `dark` key.
 * To add light mode, add a parallel `light` key with the same shape.
 *
 * Full Tailwind class strings are used (not fragments) so JIT purging works.
 * Hex values are exported for Three.js materials that can't use Tailwind.
 */

// ── Risk levels ───────────────────────────────────────────────────────────────
export const riskClasses = {
  dark: {
    CRITICAL: {
      text: 'text-red-300',
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      borderLeft: 'border-l-red-500/40',
      dot: 'bg-red-300',
      hex: '#fb7185',
    },
    HIGH: {
      text: 'text-orange-300',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/40',
      borderLeft: 'border-l-orange-500/40',
      dot: 'bg-orange-300',
      hex: '#fdba74',
    },
    MEDIUM: {
      text: 'text-yellow-300',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/40',
      borderLeft: 'border-l-yellow-500/40',
      dot: 'bg-yellow-300',
      hex: '#fde047',
    },
    LOW: {
      text: 'text-green-300',
      bg: 'bg-green-500/20',
      border: 'border-green-500/40',
      borderLeft: 'border-l-green-500/40',
      dot: 'bg-green-300',
      hex: '#86efac',
    },
  },
} as const

// ── Bet / hedge status ────────────────────────────────────────────────────────
export const statusClasses: { dark: Record<string, string> } = {
  dark: {
    EXECUTED: 'text-green-300',
    WON: 'text-green-300',
    LOST: 'text-red-300',
    PENDING: 'text-yellow-300',
    MONITORING: 'text-sky-300',
    CANCELLED: 'text-white/40',
  },
}

// ── Primary interactive accent (sky/cyan) ─────────────────────────────────────
export const accent = {
  dark: {
    text: 'text-sky-300',
    dot: 'bg-sky-300',
    border: 'border-sky-300',
    borderDim: 'border-sky-300/30',
    bg: 'bg-sky-400',
    bgHover: 'hover:bg-sky-300',
    bgDim: 'bg-sky-300/10',
    bgDimHover: 'hover:bg-sky-300/20',
    hex: '#7dd3fc',                       // sky-300
    hexDim: 'rgba(125, 211, 252, 0.3)',
    hexDimHover: 'rgba(125, 211, 252, 0.5)',
  },
} as const

// ── White-opacity text hierarchy ──────────────────────────────────────────────
export const textOpacity = {
  dark: {
    primary: 'text-white/90',
    secondary: 'text-white/70',
    tertiary: 'text-white/55',
    muted: 'text-white/45',
    faint: 'text-white/35',
  },
} as const

// ── Panel / canvas backgrounds ────────────────────────────────────────────────
export const bg = {
  dark: {
    panel: 'bg-neutral-900/50',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    canvas: '#000000',
  },
} as const

// ── Three.js hex + opacity values (Globe) ─────────────────────────────────────
export const globeColors = {
  dark: {
    stars: '#888888',
    bgSatOpacity: 0.55,
    // Risk level markers (same hex as riskClasses for convenience)
    critical: '#fb7185',
    high: '#fdba74',
    medium: '#fde047',
    low: '#86efac',
    // Probability threshold coloring
    prob10: '#fca5a5',    // red-300   — ≥10%
    prob1: '#fdba74',     // orange-300 — ≥1%
    prob01: '#fde047',    // yellow-300 — ≥0.1%
    probDefault: '#86efac', // green-300 — <0.1%
  },
} as const

// ── Financial metric colors ───────────────────────────────────────────────────
export const financialColors = {
  dark: {
    balance: 'text-orange-300',
    wagered: 'text-green-300',
    var: 'text-yellow-300',
  },
} as const
