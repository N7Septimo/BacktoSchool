import React from "react";
import { Sparkles, CheckSquare, Coins, Loader2, Plus, Info } from "lucide-react";
import { AISuggestion, GradeLevel, AIRecResponse } from "../types";

interface GeminiAssistantProps {
  roomId: string;
  gradeLevel: GradeLevel;
  totalBudget: number;
  currentUser: string;
  onImportItems: (items: AISuggestion[]) => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({
  roomId,
  gradeLevel,
  totalBudget,
  currentUser,
  onImportItems
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recommendations, setRecommendations] = React.useState<AIRecResponse | null>(null);

  const fetchAISuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel, totalBudget })
      });
      if (!res.ok) {
        throw new Error("Failed to get intelligent guidelines from Gemini AI. Ensure GEMINI_API_KEY is configured.");
      }
      const data = await res.json();
      setRecommendations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = () => {
    if (recommendations && recommendations.suggestions) {
      onImportItems(recommendations.suggestions);
      // Show check or alert and clear suggestion widget
      setRecommendations(null);
    }
  };

  const handleImportOne = (item: AISuggestion) => {
    onImportItems([item]);
    if (recommendations) {
      // Remove item from recommendation list
      setRecommendations({
        ...recommendations,
        suggestions: recommendations.suggestions.filter((s) => s.name !== item.name)
      });
    }
  };

  return (
    <div id="gemini-ai-assistant-panel" className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-md p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-500 rounded-lg">
          <Sparkles className="h-5 w-5 text-indigo-100" />
        </div>
        <div>
          <h3 className="font-bold text-base">Gemini Budget Assistant</h3>
          <p className="text-xs text-indigo-200">AI supply list generator & savings tips</p>
        </div>
      </div>

      {!recommendations && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-indigo-100 leading-relaxed">
            Generate an automated school supply checklist designed for <span className="font-semibold text-amber-300 capitalize">{gradeLevel.replace("_", " ")}</span> grade levels, built strictly under your target budget of <span className="font-bold text-emerald-400">${totalBudget}</span>.
          </p>
          <button
            id="ask-gemini-btn"
            onClick={fetchAISuggestions}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Analyze Supply Checklist
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold">Gemini is planning...</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Categorizing items & calculating costs</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-200 mt-2">
          <p className="font-semibold mb-1">Configuration Note:</p>
          <p>{error}</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-4">
          {/* Suggestions List */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Intelligent Checklist</span>
              <button
                onClick={handleImportAll}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded cursor-pointer transition-colors"
              >
                Import All
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recommendations.suggestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs leading-none">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-indigo-100">{item.name}</span>
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-300" title={item.reason}>{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">${item.estimatedCost.toFixed(2)}</span>
                    <button
                      onClick={() => handleImportOne(item)}
                      className="p-1 bg-indigo-500/40 border border-indigo-400/20 rounded hover:bg-indigo-500 text-indigo-100 cursor-pointer"
                      title="Add to shared budget"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings tips */}
          <div className="border-t border-white/10 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 mb-2">
              <Coins className="h-4 w-4 text-amber-300" />
              Strategic Savings Tips
            </span>
            <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
              {recommendations.savingsTips.map((tip, idx) => (
                <li key={idx} className="flex gap-2 bg-white/5 p-2 rounded-lg">
                  <span className="text-amber-300 font-bold">#{idx + 1}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setRecommendations(null)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-1.5 rounded-lg font-medium cursor-pointer"
          >
            Reset Suggestions
          </button>
        </div>
      )}
    </div>
  );
};
