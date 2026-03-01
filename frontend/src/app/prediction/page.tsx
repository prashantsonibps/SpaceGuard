"use client";

import { TopBar } from "@/components/Dashboard/TopBar";
import { MARKETS } from "@/data/markets";
import { useTheme } from "@/lib/ThemeContext";
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
