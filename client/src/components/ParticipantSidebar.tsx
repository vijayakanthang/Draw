import { useState } from "react";
import { UserIcon, ShieldIcon, CrownIcon } from "./Icons";

interface UserPresence {
  id: string;
  username: string;
  pageId: string;
  isOwner?: boolean;
}

interface ParticipantSidebarProps {
  users: Record<string, UserPresence>;
  currentPageId: string;
  currentUserId: string;
  onLockRoom?: (locked: boolean) => void;
  isLocked?: boolean;
  isOwner?: boolean;
}

export default function ParticipantSidebar({ 
  users, 
  currentPageId, 
  currentUserId,
  onLockRoom,
  isLocked,
  isOwner
}: ParticipantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const userList = Object.values(users);
  
  return (
    <div className={`fixed top-24 right-6 z-50 transition-all duration-500 ${isOpen ? "w-64" : "w-12 h-12"}`}>
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-2xl flex items-center justify-center text-white/60 hover:text-white shadow-2xl transition-all active:scale-95"
          title="Collaboration Panel"
        >
          <UserIcon />
          {userList.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-in fade-in zoom-in duration-300">
              {userList.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-full bg-white/10 dark:bg-black/80 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-3xl shadow-4xl overflow-hidden animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Collaboration</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white text-xs">✕</button>
          </div>

          <div className="p-2 flex flex-col gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
            {userList.map((user) => (
              <div 
                key={user.id} 
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${user.userId === currentUserId ? "bg-white/5" : "hover:bg-white/5"}`}
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${user.isOwner ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-blue-600/20 border-blue-600/50 text-blue-400"}`}>
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${user.pageId === currentPageId ? "bg-green-500" : "bg-yellow-500"}`} />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/90 truncate">{user.username}</span>
                    {user.isOwner && <CrownIcon size={10} className="text-amber-500" />}
                    {user.userId === currentUserId && <span className="text-[8px] text-white/30">(You)</span>}
                  </div>
                  <p className="text-[9px] text-white/30 truncate">
                    {user.pageId === currentPageId ? "Viewing this page" : "On another page"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldIcon size={14} className={isLocked ? "text-red-400" : "text-green-400"} />
                  <span className="text-[10px] font-bold text-white/60">Lock Board</span>
                </div>
                <button 
                  onClick={() => onLockRoom?.(!isLocked)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isLocked ? "bg-red-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isLocked ? "left-6" : "left-1"}`} />
                </button>
              </div>
              <p className="text-[8px] text-white/20 mt-2 italic">When locked, only you can edit shapes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
