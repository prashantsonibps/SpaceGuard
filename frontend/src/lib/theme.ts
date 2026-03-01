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
      text: "text-red-400",
      bg: "bg-red-500/20",
      border: "border-red-500/40",
      borderLeft: "border-l-red-500/40",
      dot: "bg-red-400",
      hex: "#f87171",
    },
    HIGH: {
      text: "text-orange-400",
      bg: "bg-orange-500/20",
      border: "border-orange-500/40",
      borderLeft: "border-l-orange-500/40",
      dot: "bg-orange-400",
      hex: "#fb923c",
    },
    MEDIUM: {
      text: "text-yellow-400",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/40",
      borderLeft: "border-l-yellow-500/40",
      dot: "bg-yellow-400",
      hex: "#facc15",
    },
    LOW: {
      text: "text-green-400",
      bg: "bg-green-500/20",
      border: "border-green-500/40",
      borderLeft: "border-l-green-500/40",
      dot: "bg-green-400",
      hex: "#4ade80",
    },
  },
  light: {
    CRITICAL: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-400",
      borderLeft: "border-l-red-400",
      dot: "bg-red-600",
      hex: "#dc2626",
    },
    HIGH: {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-400",
      borderLeft: "border-l-orange-400",
      dot: "bg-orange-600",
      hex: "#ea580c",
    },
    MEDIUM: {
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      borderLeft: "border-l-yellow-400",
      dot: "bg-yellow-600",
      hex: "#ca8a04",
    },
    LOW: {
      text: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-400",
      borderLeft: "border-l-green-400",
      dot: "bg-green-700",
      hex: "#15803d",
    },
  },
};

// ── Bet / hedge status ────────────────────────────────────────────────────────
export const statusClasses: {
  dark: Record<string, string>;
  light: Record<string, string>;
} = {
  dark: {
    EXECUTED: "text-green-300",
    WON: "text-green-300",
    LOST: "text-red-300",
    PENDING: "text-yellow-300",
    MONITORING: "text-sky-300",
    CANCELLED: "text-white/40",
  },
  light: {
    EXECUTED: "text-green-600",
    WON: "text-green-600",
    LOST: "text-red-600",
    PENDING: "text-yellow-600",
    MONITORING: "text-zinc-500",
    CANCELLED: "text-zinc-400",
  },
};

// ── Primary interactive accent ────────────────────────────────────────────────
// dark:  sky-300 (cyan glow on dark bg)
// light: zinc-800 (near-black — keeps B&W, no blue tint)
export const accent = {
  dark: {
    text: "text-sky-300",
    dot: "bg-sky-300",
    border: "border-sky-300",
    borderDim: "border-sky-300/30",
    bg: "bg-sky-400",
    bgHover: "hover:bg-sky-300",
    bgDim: "bg-sky-300/10",
    bgDimHover: "hover:bg-sky-300/20",
    hex: "#7dd3fc",
    hexDim: "rgba(125, 211, 252, 0.3)",
    hexDimHover: "rgba(125, 211, 252, 0.5)",
  },
  light: {
    text: "text-zinc-800",
    dot: "bg-zinc-800",
    border: "border-zinc-700",
    borderDim: "border-zinc-400",
    bg: "bg-zinc-800",
    bgHover: "hover:bg-zinc-900",
    bgDim: "bg-zinc-900/[0.06]",
    bgDimHover: "hover:bg-zinc-900/[0.10]",
    hex: "#27272a",
    hexDim: "rgba(39,39,42,0.06)",
    hexDimHover: "rgba(39,39,42,0.10)",
  },
} as const;

// ── Text hierarchy ─────────────────────────────────────────────────────────────
// dark:  white with opacity
// light: zinc-* (pure neutral gray — slate-* carried a blue tint)
export const textOpacity = {
  dark: {
    primary: "text-white/90",
    secondary: "text-white/70",
    tertiary: "text-white/55",
    muted: "text-white/45",
    faint: "text-white/35",
    caption: "text-white/45",
  },
  light: {
    primary: "text-zinc-900",
    secondary: "text-zinc-700",
    tertiary: "text-zinc-500",
    muted: "text-zinc-500",
    faint: "text-zinc-400",
    caption: "text-zinc-500",
  },
} as const;

// ── Font size hierarchy ──────────────────────────────────────────────────────
// Minimum readable size is 11px; bumped up for better legibility
export const fontSize = {
  small: 'text-[11px]',   // 11px - labels, secondary info
  base: 'text-xs',        // 12px - base content
  medium: 'text-sm',      // 14px - important text, body
  large: 'text-base',     // 16px - headings, emphasis
  xlarge: 'text-lg',      // 18px - major headings
} as const

// ── Container / card borders (darker, for panels and cards) ────────────────────
export const border = {
  dark: "border-white/[0.08]",
  light: "border-black/[0.18]",
} as const;

// ── Panel / canvas backgrounds ────────────────────────────────────────────────
export const bg = {
  dark: {
    panel: "bg-neutral-900/50",
    glass: "bg-white/5 backdrop-blur-md border border-white/10",
    canvas: "#000000",
  },
  light: {
    panel: "bg-white/80",
    glass: "bg-white/70 backdrop-blur-md border border-black/20",
    canvas: "#fafafa",
  },
} as const;

// ── Three.js hex + opacity values (Globe) ─────────────────────────────────────
export const globeColors = {
  dark: {
    stars: "#888888",
    bgSatOpacity: 0.55,
    bgSatColor: "#ffffff",
    earthLand: "#4b5563",
    earthOcean: "#1a1a1a",
    earthInner: "#000000",
    critical: "#f87171",
    high: "#fb923c",
    medium: "#facc15",
    low: "#4ade80",
    prob10: "#f87171",
    prob1: "#fb923c",
    prob01: "#facc15",
    probDefault: "#4ade80",
    canvas: "#000000",
  },
  light: {
    stars: "#94a3b8",
    bgSatOpacity: 1.0,
    bgSatColor: "#0f172a",
    earthLand: "#6b7b92",
    earthOcean: "#cbd5e1",
    earthInner: "#e2e8f0",
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#ca8a04",
    low: "#15803d",
    prob10: "#dc2626",
    prob1: "#ea580c",
    prob01: "#ca8a04",
    probDefault: "#15803d",
    canvas: "#fafafa",
  },
};

// ── Green (YES, live, success) — slightly darker in light mode for readability ─
export const green = {
  dark: {
    text: 'text-green-400',
    textMuted: 'text-green-400/80',
    bg: 'bg-green-400',
    border: 'border-green-400',
    borderButton: 'border-2 border-green-400/60',
    bgMuted: 'bg-green-400/20',
  },
  light: {
    text: 'text-[#49dd7f]',   // barely darker than green-400 (#4ade80)
    textMuted: 'text-[#49dd7f]/80',
    bg: 'bg-[#49dd7f]',
    border: 'border-[#49dd7f]',
    borderButton: 'border-2 border-[#49dd7f]/60',
    bgMuted: 'bg-[#49dd7f]/20',
  },
} as const

// ── Financial metric colors ───────────────────────────────────────────────────
export const financialColors = {
  dark: {
    balance: "text-orange-300",
    wagered: "text-green-300",
    var: "text-yellow-300",
  },
  light: {
    balance: "text-orange-600",
    wagered: "text-green-700",
    var: "text-amber-700",
  },
} as const;
