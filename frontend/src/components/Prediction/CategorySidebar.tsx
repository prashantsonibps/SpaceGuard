"use client";

import { accent, textOpacity, fontSize } from "@/lib/theme";
import { useTheme } from "@/lib/ThemeContext";
import type { Market, MarketCategory } from "@/data/markets";

type CategoryFilter = "ALL" | MarketCategory;

interface CategorySidebarProps {
  markets: Market[];
  selectedCategory: CategoryFilter;
  onSelectCategory: (c: CategoryFilter) => void;
  userId: string | null;
}

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "ALL", label: "ALL MARKETS" },
  { key: "COLLISION", label: "💥 COLLISION" },
  { key: "DEBRIS", label: "🪨 DEBRIS" },
  { key: "MANEUVER", label: "🛸 MANEUVER" },
  { key: "RISK", label: "⚠️ RISK" },
  { key: "NEO", label: "☄️ NEO" },
];


export function CategorySidebar({
  markets,
  selectedCategory,
  onSelectCategory,
  userId,
}: CategorySidebarProps) {
  const { theme } = useTheme();
  const ac = accent[theme];
  const tp = textOpacity[theme];

  function countForCategory(cat: CategoryFilter) {
    if (cat === "ALL") return markets.length;
    return markets.filter((m) => m.category === cat).length;
  }

  const borderR = theme === "dark" ? "border-white/10" : "border-black/[0.1]";
  const dividerClass =
    theme === "dark" ? "border-white/10" : "border-black/[0.08]";

  return (
    <div
      className={`h-full flex flex-col overflow-y-auto border-r ${borderR} py-3 px-2 gap-4`}
    >
      {/* Markets section */}
      <div>
        <p
          className={`${fontSize.small} font-mono tracking-widest ${tp.muted} mb-2 px-1`}
        >
          MARKETS
        </p>
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map(({ key, label }) => {
            const count = countForCategory(key);
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => onSelectCategory(key)}
                className={`
                  flex items-center justify-between px-2 py-1.5 rounded text-left
                  ${fontSize.small} font-mono transition-colors
                  ${
                    isActive
                      ? `${ac.bgDim} ${ac.text}`
                      : `${tp.muted} hover:${tp.secondary} hover:bg-white/5`
                  }
                `}
              >
                <span>{label}</span>
                <span
                  className={`${fontSize.small} ${isActive ? ac.text : tp.faint} tabular-nums`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Agent active indicator */}
      <div className="px-1 pb-1 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${ac.dot} animate-pulse`} />
        <span
          className={`${fontSize.small} font-mono ${ac.text} opacity-70 tracking-wider`}
        >
          AI AGENT ACTIVE
        </span>
      </div>
    </div>
  );
}
