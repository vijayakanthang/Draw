import { useState } from "react";
import { UserIcon, ShieldIcon, CrownIcon, CheckIcon, XIcon, LockOpenIcon, LockClosedIcon } from "./Icons";

interface UserPresence {
  id: string;
  userId?: string;
  username: string;
  userNumber?: number;
  pageId: string;
  isOwner?: boolean;
}

interface WaitingUser {
  socketId: string;
  userId: string;
  username: string;
}

interface ParticipantSidebarProps {
  users: Record<string, UserPresence>;
  currentPageId: string;
  currentUserId: string;
  onLockRoom?: (locked: boolean) => void;
  isLocked?: boolean;
  isOwner?: boolean;
  accessMode?: "open" | "approval";
  onSetAccessMode?: (mode: "open" | "approval") => void;
  waitingRoom?: WaitingUser[];
  onApproveUser?: (socketId: string, userId: string) => void;
  onRejectUser?: (socketId: string) => void;
  onKickUser?: (socketId: string) => void;
  onToggle?: (isOpen: boolean) => void;
}

// Deterministic color from username
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export default function ParticipantSidebar({ 
  users, 
  currentPageId, 
  currentUserId,
  onLockRoom,
  isLocked,
  isOwner,
  accessMode = "open",
  onSetAccessMode,
  waitingRoom = [],
  onApproveUser,
  onRejectUser,
  onKickUser,
  onToggle,
}: ParticipantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = (open: boolean) => {
    setIsOpen(open);
    onToggle?.(open);
  };

  const userList = Object.values(users);
  const hasWaiting = waitingRoom.length > 0;
  
  return (
    <div className={`fixed z-50 transition-all duration-500 ${
      isOpen 
        ? "top-0 right-0 w-full h-full md:top-20 md:right-5 md:w-72 md:h-auto" 
        : "top-20 right-5 w-12 h-12"
    }`}>
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => toggleSidebar(true)}
          className="w-12 h-12 glass-strong rounded-2xl flex items-center justify-center text-white/50 hover:text-white shadow-xl transition-all active:scale-95 relative"
        >
          <UserIcon />
          {userList.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0a0e1a]">
              {userList.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-full h-full md:h-auto glass-strong md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-right">
          <div className="p-6 md:p-4 flex items-center justify-between border-b border-white/6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">Collaborators</h3>
            <button 
              onClick={() => toggleSidebar(false)} 
              className="w-12 h-12 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-lg text-white/20 hover:text-white hover:bg-white/8 transition-all text-lg md:text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {/* Waiting Room (Owner only) */}
            {isOwner && hasWaiting && (
              <div className="border-b border-white/6">
                <div className="px-6 md:px-4 pt-4 md:pt-3 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-500/60 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Waiting for Approval ({waitingRoom.length})
                  </span>
                </div>
                <div className="p-3 md:p-2 flex flex-col gap-1.5 md:gap-1">
                  {waitingRoom.map((user) => {
                    const userColor = hashColor(user.username);
                    return (
                      <div key={user.socketId} className="flex items-center gap-3 p-3 md:p-2.5 rounded-2xl md:rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div 
                          className="w-9 h-9 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-[10px] font-bold border flex-shrink-0"
                          style={{ backgroundColor: `${userColor}20`, borderColor: `${userColor}40`, color: userColor }}
                        >
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-xs md:text-[11px] font-bold text-white/70 truncate flex-grow">{user.username}</span>
                        <div className="flex gap-2 md:gap-1 flex-shrink-0">
                          <button
                            onClick={() => onApproveUser?.(user.socketId, user.userId)}
                            className="w-9 h-9 md:w-7 md:h-7 rounded-xl md:rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center transition-all"
                          >
                            <CheckIcon size={16} />
                          </button>
                          <button
                            onClick={() => onRejectUser?.(user.socketId)}
                            className="w-9 h-9 md:w-7 md:h-7 rounded-xl md:rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center transition-all"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Participant List */}
            <div className="p-3 md:p-2 flex flex-col gap-1 md:gap-0.5">
              {userList.length === 0 && !hasWaiting && (
                <div className="py-12 md:py-8 text-center">
                  <p className="text-xs md:text-[10px] text-white/20 italic">No one else is here yet</p>
                </div>
              )}
              {userList.map((user) => {
                const userColor = hashColor(user.username);
                const isMe = user.userId === currentUserId;
                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-4 md:gap-3 p-4 md:p-3 rounded-2xl md:rounded-xl transition-all group ${isMe ? "bg-white/5" : "hover:bg-white/4"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-[10px] font-bold border"
                        style={{ backgroundColor: `${userColor}20`, borderColor: `${userColor}40`, color: userColor }}
                      >
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-2.5 md:h-2.5 rounded-full border-2 border-[#0a0e1a] ${user.pageId === currentPageId ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 md:gap-1.5">
                        <span className="text-sm md:text-[11px] font-bold text-white/85 truncate">{user.username} <span className="opacity-40 font-mono text-[0.8em]">(#{user.userNumber || "?"})</span></span>
                        {user.isOwner && <CrownIcon size={12} className="text-amber-500 flex-shrink-0" />}
                        {isMe && <span className="text-[10px] md:text-[8px] text-white/25 flex-shrink-0">(You)</span>}
                      </div>
                      <p className="text-[10px] md:text-[9px] text-white/25 truncate">
                        {user.pageId === currentPageId ? "Viewing this page" : "On another page"}
                      </p>
                    </div>

                    {isOwner && !isMe && !user.isOwner && (
                      <button
                        onClick={() => onKickUser?.(user.id)}
                        className="w-8 h-8 md:w-7 md:h-7 rounded-xl md:rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 md:hover:bg-red-500/10 text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <XIcon size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Owner Controls */}
          {isOwner && (
            <div className="p-6 md:p-4 bg-white/3 border-t border-white/6 flex flex-col gap-4 md:gap-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-2">
                  {accessMode === "approval" ? <LockClosedIcon size={16} className="text-amber-400" /> : <LockOpenIcon size={16} className="text-emerald-400" />}
                  <div>
                    <span className="text-xs md:text-[10px] font-bold text-white/60 block">Room Access</span>
                    <span className="text-[10px] md:text-[8px] text-white/25">{accessMode === "approval" ? "Approval required" : "Anyone with link"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onSetAccessMode?.(accessMode === "open" ? "approval" : "open")}
                  className={`w-12 h-6 md:w-10 md:h-5 rounded-full transition-all relative ${accessMode === "approval" ? "bg-amber-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 md:w-3 md:h-3 rounded-full bg-white transition-all ${accessMode === "approval" ? "left-7 md:left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-2">
                  <ShieldIcon size={16} className={isLocked ? "text-red-400" : "text-emerald-400"} />
                  <div>
                    <span className="text-xs md:text-[10px] font-bold text-white/60 block">Edit Lock</span>
                    <span className="text-[10px] md:text-[8px] text-white/25">{isLocked ? "Only you can edit" : "Everyone can edit"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onLockRoom?.(!isLocked)}
                  className={`w-12 h-6 md:w-10 md:h-5 rounded-full transition-all relative ${isLocked ? "bg-red-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 md:w-3 md:h-3 rounded-full bg-white transition-all ${isLocked ? "left-7 md:left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
