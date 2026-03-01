/**
 * Single source of truth for all UI colors.
 * Structure: each export has `dark` and `light` keys.
 *
 * Full Tailwind class strings are used (not fragments) so JIT purging works.
 * Hex values are exported for Three.js materials that can't use Tailwind.
 */

// ── Risk levels ───────────────────────────────────────────────────────────────
export const riskClasses = {
  dark: {
    CRITICAL: {
      text: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      borderLeft: 'border-l-red-500/40',
      dot: 'bg-red-400',
      hex: '#f87171',
    },
    HIGH: {
      text: 'text-orange-400',
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/40',
      borderLeft: 'border-l-orange-500/40',
      dot: 'bg-orange-400',
      hex: '#fb923c',
    },
    MEDIUM: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/40',
      borderLeft: 'border-l-yellow-500/40',
      dot: 'bg-yellow-400',
      hex: '#facc15',
    },
    LOW: {
      text: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/40',
      borderLeft: 'border-l-green-500/40',
      dot: 'bg-green-400',
      hex: '#4ade80',
    },
  },
  light: {
    CRITICAL: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-300',
      borderLeft: 'border-l-red-300',
      dot: 'bg-red-600',
      hex: '#dc2626',
    },
    HIGH: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      borderLeft: 'border-l-orange-300',
      dot: 'bg-orange-600',
      hex: '#ea580c',
    },
    MEDIUM: {
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      borderLeft: 'border-l-yellow-300',
      dot: 'bg-yellow-600',
      hex: '#ca8a04',
    },
    LOW: {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-300',
      borderLeft: 'border-l-green-300',
      dot: 'bg-green-700',
      hex: '#15803d',
    },
  },
}

// ── Bet / hedge status ────────────────────────────────────────────────────────
export const statusClasses: { dark: Record<string, string>; light: Record<string, string> } = {
  dark: {
    EXECUTED: 'text-green-300',
    WON: 'text-green-300',
    LOST: 'text-red-300',
    PENDING: 'text-yellow-300',
    MONITORING: 'text-sky-300',
    CANCELLED: 'text-white/40',
  },
  light: {
    EXECUTED: 'text-green-600',
    WON: 'text-green-600',
    LOST: 'text-red-600',
    PENDING: 'text-yellow-600',
    MONITORING: 'text-sky-600',
    CANCELLED: 'text-slate-400',
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
  light: {
    text: 'text-sky-600',
    dot: 'bg-sky-600',
    border: 'border-sky-600',
    borderDim: 'border-sky-500/40',
    bg: 'bg-sky-600',
    bgHover: 'hover:bg-sky-700',
    bgDim: 'bg-sky-500/10',
    bgDimHover: 'hover:bg-sky-500/20',
    hex: '#0284c7',
    hexDim: 'rgba(2,132,199,0.25)',
    hexDimHover: 'rgba(2,132,199,0.4)',
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
    caption: 'text-white/45',
  },
  light: {
    primary: 'text-slate-900',
    secondary: 'text-slate-700',
    tertiary: 'text-slate-500',
    muted: 'text-slate-400',
    faint: 'text-slate-300',
    caption: 'text-slate-500',
  },
} as const

// ── Panel / canvas backgrounds ────────────────────────────────────────────────
export const bg = {
  dark: {
    panel: 'bg-neutral-900/50',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    canvas: '#000000',
  },
  light: {
    panel: 'bg-white/80',
    glass: 'bg-white/70 backdrop-blur-md border border-black/10',
    canvas: '#dce8f5',
  },
} as const

// ── Three.js hex + opacity values (Globe) ─────────────────────────────────────
export const globeColors = {
  dark: {
    stars: '#888888',
    bgSatOpacity: 0.55,
    earthLand: '#4b5563',
    earthOcean: '#1a1a1a',
    earthInner: '#000000',
    // Risk level markers (same hex as riskClasses for convenience)
    critical: '#f87171',
    high: '#fb923c',
    medium: '#facc15',
    low: '#4ade80',
    // Probability threshold coloring
    prob10: '#f87171',      // red-400   — ≥10%
    prob1: '#fb923c',       // orange-400 — ≥1%
    prob01: '#facc15',      // yellow-400 — ≥0.1%
    probDefault: '#4ade80', // green-400  — <0.1%
    canvas: '#000000',
  },
  light: {
    stars: '#94a3b8',
    bgSatOpacity: 0.45,
    earthLand: '#1e3a5f',
    earthOcean: '#93c5fd',
    earthInner: '#b8d4ea',
    // Risk level markers
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#15803d',
    // Probability threshold coloring
    prob10: '#dc2626',
    prob1: '#ea580c',
    prob01: '#ca8a04',
    probDefault: '#15803d',
    canvas: '#dce8f5',
  },
}

// ── Financial metric colors ───────────────────────────────────────────────────
export const financialColors = {
  dark: {
    balance: 'text-orange-300',
    wagered: 'text-green-300',
    var: 'text-yellow-300',
  },
  light: {
    balance: 'text-orange-600',
    wagered: 'text-green-700',
    var: 'text-amber-700',
  },
} as const
