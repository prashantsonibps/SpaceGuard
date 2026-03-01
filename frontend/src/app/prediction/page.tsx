"use client";

import { TopBar } from "@/components/Dashboard/TopBar";
import { MARKETS } from "@/data/markets";
import { useTheme } from "@/lib/ThemeContext";
import { fontSize, green } from "@/lib/theme";
import { PredictionCard } from "@/components/Prediction/PredictionCard";

export default function PredictionPage() {
  const { theme } = useTheme();

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden ${
        theme === "dark" ? "bg-black" : "bg-zinc-50"
      }`}
    >
      {/* Top bar */}
      <TopBar variant="inline" />

      {/* Stats banner */}
      <div
        className={`flex items-center gap-3 px-4 py-1.5 border-b ${fontSize.small} font-mono tracking-widest shrink-0 ${
          theme === "dark"
            ? "border-white/10 text-white/40"
            : "border-black/20 text-slate-500"
        }`}
      >
        <span>847 TRACKED</span>
        <span className="opacity-40">·</span>
        <span>12 MARKETS</span>
        <span className="opacity-40">·</span>
        <span>$1.2M 24H VOL</span>
        <span className="opacity-40">·</span>
        <span className={green[theme].textMuted}>9 LIVE</span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {MARKETS.map((market) => (
            <PredictionCard key={market.id} market={market} />
          ))}
        </div>
      </div>
    </div>
  );
}
