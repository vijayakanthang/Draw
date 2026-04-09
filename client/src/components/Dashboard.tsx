import { useState } from "react";
import { SparklesIcon, LinkIcon } from "./Icons";

interface DashboardProps {
  onNewRoom: () => void;
  recentRooms: string[];
  onSelectRoom: (roomId: string) => void;
}

export default function Dashboard({ onNewRoom, recentRooms, onSelectRoom }: DashboardProps) {
  const [joinLink, setJoinLink] = useState("");

  const handleJoinByLink = () => {
    if (!joinLink.trim()) return;
    // Extract room id from URL or use as-is
    let roomId = joinLink.trim();
    try {
      const url = new URL(roomId);
      roomId = url.hash.replace("#", "") || roomId;
    } catch {
      // Not a valid URL, treat as room ID directly
      roomId = roomId.replace("#", "");
    }
    if (roomId) {
      onSelectRoom(roomId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4 md:p-6 bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Hero Card */}
        <div className="p-6 md:p-10 glass-strong rounded-[2rem] shadow-2xl text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 rotate-3 group-hover:rotate-6 transition-transform duration-500">
              <SparklesIcon />
            </div>

            <h1 className="text-4xl font-black mb-3 tracking-tight text-white">
              Draw <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Together.</span>
            </h1>
            <p className="text-white/35 text-sm mb-10 leading-relaxed font-medium max-w-[280px] mx-auto">
              Collaborative, real-time whiteboarding for teams that move fast. No accounts, just creativity.
            </p>

            <button 
              onClick={onNewRoom}
              className="w-full py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] hover:shadow-2xl hover:shadow-blue-600/30"
            >
              Create New Board
            </button>

            {/* Join by Link */}
            <div className="mt-6 flex gap-2">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={joinLink}
                  onChange={(e) => setJoinLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinByLink()}
                  placeholder="Paste invite link or room ID..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-sm text-white/80 placeholder-white/20 outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <button
                onClick={handleJoinByLink}
                disabled={!joinLink.trim()}
                className="px-4 py-3 bg-white/8 hover:bg-white/12 border border-white/8 rounded-xl text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Join Room"
              >
                <LinkIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Boards */}
        {recentRooms.length > 0 && (
          <div className="mt-10 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-5 flex items-center gap-4">
              Recent Boards
              <div className="flex-grow h-[1px] bg-white/5" />
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {recentRooms.map((r) => (
                <button 
                  key={r} 
                  onClick={() => onSelectRoom(r)}
                  className="group flex items-center justify-between p-4 glass rounded-2xl transition-all duration-300 hover:bg-white/8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/30 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all">
                      #
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors block">
                        {r.replace("room-", "").slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-white/20">Click to rejoin</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 text-lg">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
