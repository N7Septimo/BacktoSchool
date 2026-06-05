import React from "react";
import { Users, Link, Copy, Check, ArrowRight, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface ShareRoomProps {
  roomId: string;
  activeMembers: string[];
  currentUser: string;
  onUpdateUser: (username: string) => void;
  onJoinRoom: (newRoomId: string) => void;
}

export const ShareRoomModal: React.FC<ShareRoomProps> = ({
  roomId,
  activeMembers,
  currentUser,
  onUpdateUser,
  onJoinRoom
}) => {
  const [copied, setCopied] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(currentUser);
  const [roomInput, setRoomInput] = React.useState(roomId);

  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUser(nameInput.trim());
    }
  };

  const handleJoinNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      onJoinRoom(roomInput.trim());
    }
  };

  React.useEffect(() => {
    setRoomInput(roomId);
  }, [roomId]);

  return (
    <div id="share-collaborators-panel" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Col 1: Live Sync & Collaboration Link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Link className="h-4 w-4 text-indigo-600" />
            Real-Time Collaboration Link
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Share this URL with family, spouses, or roommates to plan simultaneously!</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-250 p-2 rounded-xl">
          <input
            id="share-link-display"
            type="text"
            readOnly
            value={`${window.location.origin}/?room=${roomId}`}
            className="w-full text-xs text-slate-500 bg-transparent outline-none select-all overflow-ellipsis"
          />
          <button
            onClick={handleCopyLink}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              copied ? "bg-emerald-100 text-emerald-700" : "bg-indigo-650 hover:bg-slate-350 bg-indigo-50 text-indigo-700"
            }`}
            title="Copy shared URL"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Change room box */}
        <form onSubmit={handleJoinNewRoom} className="flex gap-2">
          <input
            type="text"
            placeholder="Go to room code..."
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-400 focus:bg-white text-slate-700 font-semibold"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            Go <ArrowRight className="h-3 w-3" />
          </button>
        </form>
      </div>

      {/* Col 2: Profile setup & Active Members */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-600" />
            Active Planners ({activeMembers.length})
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Your edits are credited instantly to your family nickname profile.</p>
        </div>

        {/* User Nickname Form */}
        <form onSubmit={handleSaveName} className="flex gap-2">
          <div className="relative w-full">
            <UserCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-indigo-400" />
            <input
              type="text"
              required
              placeholder="Your nickname (e.g. Dad, Mom, Maya)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white text-slate-700 font-semibold"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 font-semibold text-xs px-3 py-2 rounded-xl cursor-pointer transition-colors"
          >
            Save
          </button>
        </form>

        {/* Active Members tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeMembers.map((member) => (
            <span
              key={member}
              className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                member === currentUser
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${member === currentUser ? "bg-indigo-500" : "bg-emerald-500 animate-pulse"}`} />
              {member} {member === currentUser && "(You)"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
