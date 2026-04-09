import { SparklesIcon } from "./Icons";

interface DashboardProps {
  onNewRoom: () => void;
  recentRooms: string[];
  onSelectRoom: (roomId: string) => void;
  isDark: boolean;
}

export default function Dashboard({ onNewRoom, recentRooms, onSelectRoom, isDark }: DashboardProps) {
  return (
    <div className={`flex flex-grow items-center justify-center p-6 ${isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
      <div className="max-w-md w-full animate-in zoom-in-95 duration-700">
        {/* Hero Card */}
        <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-5xl text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-2xl rotate-3 group-hover:rotate-6 transition-transform duration-500">
            <SparklesIcon />
          </div>

          <h1 className={`text-4xl font-black mb-4 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Draw <span className="text-blue-500">Together.</span>
          </h1>
          <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">
            Collaborative, real-time whiteboarding for teams that move fast. No accounts, just creativity.
          </p>

          <button 
            onClick={onNewRoom}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
          >
            Create New Board
          </button>
        </div>

        {/* Recent Boards */}
        {recentRooms.length > 0 && (
          <div className="mt-12 px-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-4">
              Recent Activity
              <div className="flex-grow h-[1px] bg-white/5" />
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {recentRooms.map((r) => (
                <button 
                  key={r} 
                  onClick={() => onSelectRoom(r)}
                  className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all">
                      #
                    </div>
                    <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                      {r.replace("room-", "")}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
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
