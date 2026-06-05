import React from "react";
import { Sparkles, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { BudgetRoom } from "../types";

interface CategoryLimitsCardProps {
  room: BudgetRoom;
  onUpdateLimit: (category: string, newLimit: number) => void;
}

export const CategoryLimitsCard: React.FC<CategoryLimitsCardProps> = ({ room, onUpdateLimit }) => {
  const CATEGORIES = [
    "Technology & Devices",
    "Apparel & Uniforms",
    "Core Supplies",
    "Fees & Subscriptions",
    "Other / Misc"
  ];

  // Calculate sum of items in each category
  const getCategoryTotal = (category: string) => {
    return room.items
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.estimatedCost, 0);
  };

  return (
    <div id="category-limits-section" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
            Category Limits & Trackers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Maintain controls to prevent overspending</p>
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const totalSpent = getCategoryTotal(category);
          const limit = room.categoryLimits[category] || 100;
          const percentage = Math.min(Math.round((totalSpent / limit) * 100), 100) || 0;
          const isOverLimit = totalSpent > limit;

          return (
            <div key={category} className="space-y-2 pb-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">{category}</span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                  <span className={`font-bold ${isOverLimit ? "text-rose-600 font-semibold" : "text-slate-800"}`}>
                    ${totalSpent.toFixed(0)}
                  </span>
                  <span>/</span>
                  <span className="font-bold text-slate-600">${limit}</span>
                </div>
              </div>

              {/* Slider for limit adjustment */}
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={limit}
                  onChange={(e) => onUpdateLimit(category, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverLimit ? "bg-rose-500 animate-pulse" : percentage > 80 ? "bg-amber-400" : "bg-indigo-600"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Status or warning indicators */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Drag slider to adjust limits</span>
                <div className="flex items-center gap-1">
                  {isOverLimit ? (
                    <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Over Limit by ${(totalSpent - limit).toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                      {100 - percentage}% available
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
