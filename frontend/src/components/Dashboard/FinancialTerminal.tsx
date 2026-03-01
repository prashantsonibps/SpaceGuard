"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MARKETS } from "@/data/markets";
import { riskClasses, financialColors, textOpacity, fontSize } from "@/lib/theme";
import { useTheme } from "@/lib/ThemeContext";
import {
  PredictionCard,
  formatVol,
} from "@/components/Prediction/PredictionCard";

// ── Derived market data (module-level, stable) ─────────────────────────────────
const liveMarkets = MARKETS.filter((m) => m.status === "LIVE");
const totalVol24h = MARKETS.reduce((s, m) => s + m.volume24h, 0);
const avgYesPrice = Math.round(
  liveMarkets.reduce((s, m) => s + m.yesPrice, 0) /
    Math.max(1, liveMarkets.length),
);

// ── Main export ────────────────────────────────────────────────────────────────
export function FinancialTerminal({ userId: _userId }: { userId?: string }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [windowH, setWindowH] = useState<number>(0);

  useEffect(() => {
    setWindowH(window.innerHeight);
    const onResize = () => setWindowH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const expandedH = windowH ? windowH - 80 : 600;

  return (
    <motion.div
      className="absolute z-40 rounded-xl overflow-hidden backdrop-blur-md border border-black/[0.18] dark:border-white/10 bg-white/80 dark:bg-neutral-900/50"
      style={{ bottom: "1rem", left: "1rem" }}
      initial={{ opacity: 0, y: 10, right: "20rem", height: 44 }}
      animate={
        expanded
          ? { opacity: 1, y: 0, right: "1rem", height: expandedH }
          : { opacity: 1, y: 0, right: "20rem", height: 44 }
      }
      transition={{
        opacity: { duration: 0.4, ease: "easeOut" },
        y: { duration: 0.4, ease: "easeOut" },
        right: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
        height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {/* ── Expandable region — absolutely inset above the bar ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ bottom: 44 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.18] dark:border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <span
                  className={`font-orbitron text-[11px] font-bold ${textOpacity[theme].secondary} tracking-[0.25em]`}
                >
                  PREDICTION MARKETS
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${riskClasses[theme].LOW.dot} animate-pulse shrink-0`}
                  />
                  <span
                    className={`${fontSize.small} font-mono ${textOpacity[theme].caption}`}
                  >
                    {liveMarkets.length} live · {formatVol(totalVol24h)} 24h vol
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className={`${fontSize.small} font-mono ${textOpacity[theme].caption} border border-black/[0.18] dark:border-white/[0.08] px-2 py-1 rounded
                  hover:${textOpacity[theme].secondary} hover:border-black/30 dark:hover:border-white/20 transition-colors tracking-widest`}
              >
                COLLAPSE ↙
              </button>
            </div>

            {/* Market card grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4">
                {MARKETS.map((market) => (
                  <PredictionCard key={market.id} market={market} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Always-visible bottom bar — pinned to bottom ── */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 flex items-center justify-between gap-4 border-t border-black/[0.18] dark:border-white/[0.08]"
        style={{ height: 44 }}
      >
        <div className={`flex items-center gap-5 font-mono ${fontSize.small} min-w-0`}>
          <span
            className={`${textOpacity[theme].faint} shrink-0 font-orbitron tracking-widest`}
          >
            PREDICTIONS
          </span>
          <span className={textOpacity[theme].muted}>
            Live{" "}
            <span className={`${financialColors[theme].wagered} font-medium`}>
              {liveMarkets.length}
            </span>
          </span>
          <span className={textOpacity[theme].muted}>
            Vol{" "}
            <span className={financialColors[theme].balance}>
              {formatVol(totalVol24h)}
            </span>
          </span>
          <span className={textOpacity[theme].muted}>
            Avg YES{" "}
            <span className={financialColors[theme].var}>{avgYesPrice}¢</span>
          </span>
          <span className={textOpacity[theme].muted}>
            Markets{" "}
            <span className={textOpacity[theme].secondary}>
              {MARKETS.length}
            </span>
          </span>
        </div>

        <AnimatePresence>
          {!expanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setExpanded(true)}
              className={`shrink-0 px-2.5 py-1 rounded ${fontSize.small} font-mono tracking-widest
                ${textOpacity[theme].muted} border border-black/[0.18] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 hover:${textOpacity[theme].secondary}
                transition-colors`}
            >
              EXPAND ↗
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
