"use client";

import { accent, textOpacity, fontSize, green } from "@/lib/theme";
import { useTheme } from "@/lib/ThemeContext";
import type { Market } from "@/data/markets";

export type SortKey = "VOLUME" | "EXPIRY" | "PRICE" | "RISK";

interface SortControlsProps {
  sortBy: SortKey;
  onSort: (key: SortKey) => void;
  markets: Market[];
}

const SORT_KEYS: SortKey[] = ["VOLUME", "EXPIRY", "PRICE", "RISK"];

export function SortControls({ sortBy, onSort, markets }: SortControlsProps) {
  const { theme } = useTheme();
  const ac = accent[theme];
  const tp = textOpacity[theme];
  const gr = green[theme];
  const liveCount = markets.filter((m) => m.status === "LIVE").length;
  const borderB = theme === "dark" ? "border-white/10" : "border-black/[0.2]";
  const borderFaint =
    theme === "dark" ? "border-white/5" : "border-black/[0.12]";
  const sortBtnInactive =
    theme === "dark"
      ? `border-white/10 ${tp.muted} hover:border-white/20`
      : `border-black/[0.2] ${tp.muted} hover:border-black/30`;

  return (
    <div className={`border-b ${borderB}`}>
      {/* Sort controls row */}
      <div
        className={`h-10 flex items-center px-4 gap-3 border-b ${borderFaint}`}
      >
        <span
          className={`${fontSize.small} font-mono ${tp.muted} tracking-widest shrink-0`}
        >
          SORT:
        </span>
        <div className="flex items-center gap-1.5">
          {SORT_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`
                px-2 py-0.5 ${fontSize.small} font-mono rounded border transition-colors
                ${
                  sortBy === key
                    ? `${ac.bgDim} ${ac.borderDim} ${ac.text}`
                    : sortBtnInactive
                }
              `}
            >
              {key}
              {sortBy === key ? "▼" : ""}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={`${fontSize.small} font-mono ${tp.muted}`}>
            {markets.length} MARKETS
          </span>
          <span className={`${fontSize.small} font-mono ${tp.faint}`}>·</span>
          <span className={`${fontSize.small} font-mono ${gr.text}`}>
            {liveCount} LIVE
          </span>
        </div>
      </div>

      {/* Column headers row */}
      <div className="flex items-center px-4 py-1.5 gap-3">
        <span
          className={`flex-1 ${fontSize.small} font-mono tracking-widest ${tp.faint}`}
        >
          MARKET
        </span>
        <span
          className={`w-44 text-center ${fontSize.small} font-mono tracking-widest ${tp.faint}`}
        >
          PROBABILITY
        </span>
        <span
          className={`w-16 text-right ${fontSize.small} font-mono tracking-widest ${tp.faint}`}
        >
          VOL
        </span>
        <span
          className={`w-16 text-right ${fontSize.small} font-mono tracking-widest ${tp.faint}`}
        >
          CLOSES
        </span>
        <span
          className={`w-16 text-right ${fontSize.small} font-mono tracking-widest ${tp.faint}`}
        >
          STATUS
        </span>
      </div>
    </div>
  );
}
