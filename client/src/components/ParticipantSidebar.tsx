import { useState } from "react";
import { UserIcon, ShieldIcon, CrownIcon, CheckIcon, XIcon, LockOpenIcon, LockClosedIcon } from "./Icons";

interface UserPresence {
  id: string;
  userId?: string;
  username: string;
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
}: ParticipantSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const userList = Object.values(users);
  const hasWaiting = waitingRoom.length > 0;
  
  return (
    <div className={`fixed top-20 right-5 z-50 transition-all duration-500 ${isOpen ? "w-72" : "w-12 h-12"}`}>
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 glass-strong rounded-2xl flex items-center justify-center text-white/50 hover:text-white shadow-xl transition-all active:scale-95 relative"
          title="Collaboration Panel"
        >
          <UserIcon />
          {userList.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0a0e1a] animate-fade-in">
              {userList.length}
            </span>
          )}
          {/* Waiting room notification */}
          {hasWaiting && isOwner && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0a0e1a] animate-pulse">
              {waitingRoom.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-full glass-strong rounded-2xl shadow-2xl overflow-hidden animate-slide-right">
          <div className="p-4 flex items-center justify-between border-b border-white/6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">Collaborators</h3>
            <button onClick={() => setIsOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-white hover:bg-white/8 transition-all text-xs">✕</button>
          </div>

          {/* Waiting Room (Owner only) */}
          {isOwner && hasWaiting && (
            <div className="border-b border-white/6">
              <div className="px-4 pt-3 pb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-500/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for Approval ({waitingRoom.length})
                </span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {waitingRoom.map((user) => {
                  const userColor = hashColor(user.username);
                  return (
                    <div key={user.socketId} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0"
                        style={{ backgroundColor: `${userColor}20`, borderColor: `${userColor}40`, color: userColor }}
                      >
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-white/70 truncate flex-grow">{user.username}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => onApproveUser?.(user.socketId, user.userId)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 flex items-center justify-center transition-all"
                          title="Approve"
                        >
                          <CheckIcon size={14} className="text-emerald-400" />
                        </button>
                        <button
                          onClick={() => onRejectUser?.(user.socketId)}
                          className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center transition-all"
                          title="Reject"
                        >
                          <XIcon size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participant List */}
          <div className="p-2 flex flex-col gap-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {userList.length === 0 && !hasWaiting && (
              <div className="py-8 text-center">
                <p className="text-[10px] text-white/20 italic">No one else is here yet</p>
              </div>
            )}
            {userList.map((user) => {
              const userColor = hashColor(user.username);
              const isMe = user.userId === currentUserId;
              return (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${isMe ? "bg-white/5" : "hover:bg-white/4"}`}
                >
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border"
                      style={{ backgroundColor: `${userColor}20`, borderColor: `${userColor}40`, color: userColor }}
                    >
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e1a] ${user.pageId === currentPageId ? "bg-emerald-500" : "bg-amber-500"}`} />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/85 truncate">{user.username}</span>
                      {user.isOwner && <CrownIcon size={10} className="text-amber-500 flex-shrink-0" />}
                      {isMe && <span className="text-[8px] text-white/25 flex-shrink-0">(You)</span>}
                    </div>
                    <p className="text-[9px] text-white/25 truncate">
                      {user.pageId === currentPageId ? "Viewing this page" : "On another page"}
                    </p>
                  </div>

                  {/* Kick button (owner only, not self) */}
                  {isOwner && !isMe && !user.isOwner && (
                    <button
                      onClick={() => onKickUser?.(user.id)}
                      className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 flex items-center justify-center transition-all flex-shrink-0"
                      title="Remove from room"
                    >
                      <XIcon size={12} className="text-red-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Owner Controls */}
          {isOwner && (
            <div className="p-4 bg-white/3 border-t border-white/6 flex flex-col gap-3">
              {/* Access Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {accessMode === "approval" ? (
                    <LockClosedIcon size={14} className="text-amber-400" />
                  ) : (
                    <LockOpenIcon size={14} className="text-emerald-400" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-white/50 block">Room Access</span>
                    <span className="text-[8px] text-white/25">
                      {accessMode === "approval" ? "Approval required" : "Anyone with link"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onSetAccessMode?.(accessMode === "open" ? "approval" : "open")}
                  className={`w-10 h-5 rounded-full transition-all relative ${accessMode === "approval" ? "bg-amber-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${accessMode === "approval" ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {/* Edit Lock Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldIcon size={14} className={isLocked ? "text-red-400" : "text-emerald-400"} />
                  <div>
                    <span className="text-[10px] font-bold text-white/50 block">Edit Lock</span>
                    <span className="text-[8px] text-white/25">
                      {isLocked ? "Only you can edit" : "Everyone can edit"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onLockRoom?.(!isLocked)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isLocked ? "bg-red-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isLocked ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
