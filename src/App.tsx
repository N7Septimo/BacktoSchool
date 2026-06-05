import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Backpack, HelpCircle, GraduationCap, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { BudgetSummary } from "./components/BudgetSummary";
import { CategoryLimitsCard } from "./components/CategoryLimitsCard";
import { SupplyItemTable } from "./components/SupplyItemTable";
import { GeminiAssistant } from "./components/GeminiAssistant";
import { ShareRoomModal } from "./components/ShareRoomModal";
import { BudgetRoom, GradeLevel, AISuggestion, SupplyItem } from "./types";

export default function App() {
  // 1. Initialize Room ID from URL query parameters (e.g., ?room=family-supplies), or fallback to localStorage, or randomized.
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      localStorage.setItem("bts_room_id", roomParam);
      return roomParam;
    }
    const local = localStorage.getItem("bts_room_id");
    if (local) return local;
    
    // Generate a default user-friendly ID
    const defaultId = `evelyn-supplies-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("bts_room_id", defaultId);
    return defaultId;
  });

  // 2. Nickname state
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem("bts_nickname") || `Planner-${Math.floor(10 + Math.random() * 90)}`;
  });

  // 3. Main Budget Room State
  const [room, setRoom] = useState<BudgetRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync URL query when roomId changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("room") !== roomId) {
      params.set("room", roomId);
      const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, [roomId]);

  // Fetch Room Data
  const fetchRoomData = async (showSyncIndicator = false) => {
    if (showSyncIndicator) setSyncing(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error("Could not find or launch room");
      const data = await res.json();
      setRoom(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Network sync offline. Retrying...");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // Setup Heartbeat and Regular Polling (Every 3 seconds for active sync)
  useEffect(() => {
    fetchRoomData(true);

    const interval = setInterval(() => {
      fetchRoomData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId]);

  // Presence Pulse (Every 6 seconds)
  useEffect(() => {
    const reportPresence = async () => {
      try {
        await fetch(`/api/rooms/${roomId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser })
        });
      } catch (err) {
        console.error("Presence status beat offline", err);
      }
    };
    
    reportPresence();
    const interval = setInterval(reportPresence, 6000);
    return () => clearInterval(interval);
  }, [roomId, currentUser]);

  // Action: Update overall budget
  const handleUpdateBudget = async (newBudget: number) => {
    if (!room) return;
    // Optimistic Update
    setRoom({ ...room, totalBudget: newBudget });
    try {
      await fetch(`/api/rooms/${roomId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: newBudget })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Update specific category budget limits
  const handleUpdateLimit = async (category: string, newLimit: number) => {
    if (!room) return;
    const updatedLimits = { ...room.categoryLimits, [category]: newLimit };
    // Optimistic Update
    setRoom({ ...room, categoryLimits: updatedLimits });
    try {
      await fetch(`/api/rooms/${roomId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryLimits: updatedLimits })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Change grade level selection
  const handleUpdateGrade = async (grade: GradeLevel) => {
    if (!room) return;
    // Optimistic Update
    setRoom({ ...room, gradeLevel: grade });
    try {
      await fetch(`/api/rooms/${roomId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel: grade })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Add single customized item
  const handleAddItem = async (item: { name: string; category: string; estimatedCost: number; actualCost: number; addedBy: string }) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", item: { ...item, addedBy: currentUser } })
      });
      if (res.ok) {
        fetchRoomData(false);
      }
    } catch (err) {
      console.error("Failed to append item", err);
    }
  };

  // Action: Modify existing item (Toggle bought, update costs, etc.)
  const handleUpdateItem = async (updatedItem: SupplyItem) => {
    if (!room) return;
    
    // Optimistic Update
    const updatedItems = room.items.map((it) => (it.id === updatedItem.id ? updatedItem : it));
    setRoom({ ...room, items: updatedItems });

    try {
      await fetch(`/api/rooms/${roomId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", item: updatedItem })
      });
    } catch (err) {
      console.error("Failed to update item state", err);
    }
  };

  // Action: Delete item
  const handleDeleteItem = async (id: string) => {
    if (!room) return;
    // Optimistic Update
    setRoom({ ...room, items: room.items.filter((it) => it.id !== id) });

    try {
      await fetch(`/api/rooms/${roomId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", item: { id } })
      });
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  // Action: Import a whole set of checklist suggestions from Gemini
  const handleImportAISuggestions = async (suggestions: AISuggestion[]) => {
    try {
      setSyncing(true);
      // Sequentially load recommendations into database items to avoid race locks
      for (const item of suggestions) {
        await fetch(`/api/rooms/${roomId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            item: {
              name: item.name,
              category: item.category,
              estimatedCost: item.estimatedCost,
              actualCost: item.estimatedCost,
              addedBy: `Gemini AI (${currentUser})`
            }
          })
        });
      }
      fetchRoomData(false);
    } catch (err) {
      console.error("Failed to batch import suggested checklists", err);
    } finally {
      setSyncing(false);
    }
  };

  // Action: User Nickname change
  const handleUpdateNickname = (newNickname: string) => {
    setCurrentUser(newNickname);
    localStorage.setItem("bts_nickname", newNickname);
  };

  // Action: Jump/Join new Room
  const handleJoinNewRoom = (newRoomId: string) => {
    const sanitized = newRoomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (sanitized) {
      setRoomId(sanitized);
      localStorage.setItem("bts_room_id", sanitized);
      setLoading(true);
    }
  };

  return (
    <div id="school-budget-root-layout" className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-100 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100">
              <Backpack className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Evelyn's Back to School Budget Planner
              </h1>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                Room ID: <span className="text-indigo-600 font-mono lower-case">{roomId}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sync connection details */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-xs text-slate-500 font-medium font-mono">
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin text-indigo-500" : "text-emerald-500"}`} />
              <span>{syncing ? "synced" : "live-sync"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Collaborative notice bar */}
        <div className="bg-indigo-50/50 border border-indigo-105 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5 sm:mt-0">
              <HelpCircle className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              <strong className="text-indigo-950">Real-Time Sync Activated:</strong> You can open this same URL in another browser tab, private window, or send it to family members. Any addition, checklist checkmark, or limit slide change synced in 3-sec intervals automatically!
            </p>
          </div>
          
          {/* Grade configuration picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <GraduationCap className="h-4 w-4 text-indigo-500" /> Grade:
            </span>
            <select
              value={room?.gradeLevel || "general"}
              onChange={(e) => handleUpdateGrade(e.target.value as GradeLevel)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-slate-700 font-bold"
            >
              <option value="kindergarten">Kindergarten</option>
              <option value="elementary">Elementary School</option>
              <option value="middle_school">Middle School</option>
              <option value="high_school">High School</option>
              <option value="college">College Student</option>
              <option value="general">General Supplies</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-semibold text-sm mt-3 animate-pulse">Initializing school planning workspace...</p>
          </div>
        ) : error && !room ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <p className="text-rose-500 font-semibold text-base mb-2">{error}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Ensure your development backend server is running correctly and binded cleanly to Port 3000.
            </p>
          </div>
        ) : room ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* 3. Key Metrics Boxes */}
            <BudgetSummary room={room} onUpdateBudget={handleUpdateBudget} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left sidebar: Limits + Gemini assistant */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Category limits configuration */}
                <CategoryLimitsCard room={room} onUpdateLimit={handleUpdateLimit} />

                {/* Intelligent AI advice with Gemini */}
                <GeminiAssistant
                  roomId={roomId}
                  gradeLevel={room.gradeLevel as GradeLevel}
                  totalBudget={room.totalBudget}
                  currentUser={currentUser}
                  onImportItems={handleImportAISuggestions}
                />
              </div>

              {/* Right panel: Active Register + User settings */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* School supply elements table */}
                <SupplyItemTable
                  items={room.items}
                  currentUser={currentUser}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />

                {/* Profile settings & online presence indicator */}
                <ShareRoomModal
                  roomId={roomId}
                  activeMembers={room.members || []}
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateNickname}
                  onJoinRoom={handleJoinNewRoom}
                />
              </div>

            </div>
          </motion.div>
        ) : null}

      </main>
    </div>
  );
}
