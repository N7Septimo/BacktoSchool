import React from "react";
import { Wallet, CircleDollarSign, PiggyBank, Scale } from "lucide-react";
import { motion } from "motion/react";
import { BudgetRoom } from "../types";

interface BudgetSummaryProps {
  room: BudgetRoom;
  onUpdateBudget: (newBudget: number) => void;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ room, onUpdateBudget }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempBudget, setTempBudget] = React.useState(room.totalBudget.toString());

  // Calculates sums
  const totalEstimated = room.items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = room.items.reduce((sum, item) => sum + (item.purchased ? (item.actualCost || item.estimatedCost) : 0), 0);
  const remaining = room.totalBudget - totalEstimated;
  const isOverBudget = remaining < 0;

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(val);
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    setTempBudget(room.totalBudget.toString());
  }, [room.totalBudget]);

  // Overall progress calculation (Planned / Total budget)
  const spentPct = room.totalBudget > 0 ? (totalEstimated / room.totalBudget) * 100 : 0;
  const clampedPct = Math.min(Math.round(spentPct), 100);
  
  // Actual checkout progress (Actual spent checkout of purchased items / Total budget)
  const actualPct = room.totalBudget > 0 ? (totalActual / room.totalBudget) * 100 : 0;
  const clampedActualPct = Math.min(Math.round(actualPct), 100);

  // Budget color thresholds
  let progressColorClass = "bg-emerald-500";
  let healthLabel = "Under Budget & Healthy";
  let badgeStyle = "text-emerald-700 bg-emerald-50/80 border-emerald-200";

  if (spentPct > 100) {
    progressColorClass = "bg-rose-500 animate-pulse";
    healthLabel = "Budget Exceeded!";
    badgeStyle = "text-rose-700 bg-rose-50/80 border-rose-200";
  } else if (spentPct > 85) {
    progressColorClass = "bg-orange-500";
    healthLabel = "Nearing Budget Limit";
    badgeStyle = "text-orange-700 bg-orange-50/80 border-orange-200";
  } else if (spentPct > 60) {
    progressColorClass = "bg-amber-400";
    healthLabel = "Moderate Spending";
    badgeStyle = "text-amber-700 bg-amber-50/80 border-amber-200";
  }

  return (
    <div className="space-y-4 mb-6">
      <div id="budget-summary-dashboard" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Target Budget */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Target Budget</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            {isEditing ? (
              <form onSubmit={handleSubmitBudget} className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-700">$</span>
                <input
                  id="edit-budget-input"
                  autoFocus
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-full text-xl font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-indigo-200 outline-none"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 font-medium cursor-pointer"
                >
                  Set
                </button>
              </form>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">${room.totalBudget.toLocaleString()}</span>
                <button
                  id="edit-budget-btn"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Total budget allocated</p>
          </div>
        </motion.div>

        {/* Card 2: Estimated List Expense */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Planned Supplies Cost</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">${totalEstimated.toFixed(2)}</span>
            <p className="text-xs text-slate-400 mt-1">
              {room.items.length} supply {room.items.length === 1 ? "item" : "items"} cataloged
            </p>
          </div>
        </motion.div>

        {/* Card 3: Already Spent (Purchased) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Already Checkout/Spent</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-600">${totalActual.toFixed(2)}</span>
            <p className="text-xs text-slate-400 mt-1">
              {room.items.filter((i) => i.purchased).length} purchased / checkout
            </p>
          </div>
        </motion.div>

        {/* Card 4: Remaining Allocated */}
        <motion.div
          whileHover={{ y: -2 }}
          className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
            isOverBudget ? "border-rose-100 bg-rose-50/20" : "border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Remaining Balance</span>
            <div className={`p-2 rounded-xl ${isOverBudget ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-bold ${isOverBudget ? "text-rose-600" : "text-slate-950"}`}>
              {isOverBudget ? "-" : ""}${Math.abs(remaining).toFixed(2)}
            </span>
            <p className={`text-xs mt-1 ${isOverBudget ? "text-rose-500 font-medium" : "text-slate-400"}`}>
              {isOverBudget ? "Exceeds overall target limit!" : "Safe with budget headroom"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Global Visual Progress & Health Indicator Bar */}
      <div id="overall-budget-progress-bar" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Global Budget Health</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {healthLabel} ({Math.round(spentPct)}% planned)
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Planned & Reserved: <span className="font-bold text-slate-800">${totalEstimated.toFixed(2)}</span> of <span className="font-bold text-slate-800">${room.totalBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Track bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
          {/* Dual bar: actual purchased (solid) and estimated items (lighter overlay) */}
          <div
            className={`h-full absolute left-0 top-0 transition-all duration-500 opacity-30 ${progressColorClass}`}
            style={{ width: `${clampedPct}%` }}
          />
          <div
            className={`h-full absolute left-0 top-0 transition-all duration-500 ${progressColorClass}`}
            style={{ width: `${clampedActualPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${progressColorClass} opacity-40`} />
              <span>Total Planned Items</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${progressColorClass}`} />
              <span>Checked Out / Purchased</span>
            </div>
          </div>
          <div className="italic">
            {isOverBudget 
              ? `Reduce non-essential items to save $${Math.abs(remaining).toFixed(2)}` 
              : `You have $${remaining.toFixed(2)} remaining to budget`}
          </div>
        </div>
      </div>
    </div>
  );
};
