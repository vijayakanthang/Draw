import { useState } from "react";
import { UserIcon, ShieldIcon, LockOpenIcon, LockClosedIcon } from "./Icons";

interface ShareModalProps {
  roomId: string;
  isVisible: boolean;
  onClose: () => void;
  isLocked: boolean;
  onToggleLock?: (locked: boolean) => void;
  isOwner?: boolean;
  accessMode?: "open" | "approval";
  onSetAccessMode?: (mode: "open" | "approval") => void;
}

export default function ShareModal({ 
  roomId, 
  isVisible, 
  onClose,
  isLocked,
  onToggleLock,
  isOwner,
  accessMode = "open",
  onSetAccessMode,
}: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isVisible) return null;

  const getShareUrl = (mode?: "readonly") => {
    const base = `${window.location.origin}${window.location.pathname}`;
    if (mode === "readonly") {
      return `${base}?mode=readonly#${roomId}`;
    }
    return `${base}#${roomId}`;
  };

  const handleCopy = (mode: "edit" | "readonly") => {
    const url = getShareUrl(mode === "readonly" ? "readonly" : undefined);
    navigator.clipboard.writeText(url);
    setCopied(mode);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md glass-strong rounded-3xl shadow-2xl overflow-hidden animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 flex items-center justify-center text-blue-400">
              <UserIcon />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Invite Collaborators</h2>
              <p className="text-[10px] text-white/25 truncate max-w-[200px]">Room: {roomId}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-white hover:bg-white/8 transition-all">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Access Mode Banner */}
          {isOwner && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              accessMode === "approval" 
                ? "bg-amber-500/5 border-amber-500/15" 
                : "bg-emerald-500/5 border-emerald-500/15"
            }`}>
              <div className="flex items-center gap-3">
                {accessMode === "approval" ? (
                  <LockClosedIcon size={18} className="text-amber-400" />
                ) : (
                  <LockOpenIcon size={18} className="text-emerald-400" />
                )}
                <div>
                  <h4 className={`text-[11px] font-bold ${accessMode === "approval" ? "text-amber-400" : "text-emerald-400"}`}>
                    {accessMode === "approval" ? "Approval Required" : "Open Access"}
                  </h4>
                  <p className="text-[9px] text-white/30">
                    {accessMode === "approval" 
                      ? "You must approve each person before they can join" 
                      : "Anyone with the link can join instantly"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onSetAccessMode?.(accessMode === "open" ? "approval" : "open")}
                className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  accessMode === "approval" ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-white/10"
                }`}
              >
                <div className={`absolute top-1.5 w-3 h-3 rounded-full bg-white transition-all ${
                  accessMode === "approval" ? "left-7" : "left-1.5"
                }`} />
              </button>
            </div>
          )}

          {/* Collaborative Link */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest px-1">Collaborative Link</label>
            <div className="flex gap-2">
              <div className="flex-grow p-3 bg-white/4 border border-white/6 rounded-xl text-xs text-white/50 truncate font-mono">
                {getShareUrl()}
              </div>
              <button 
                onClick={() => handleCopy("edit")}
                className={`px-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                  copied === "edit" ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {copied === "edit" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[9px] text-white/20 px-1">
              {accessMode === "approval" 
                ? "Anyone with this link must be approved by you before joining." 
                : "Anyone with this link can join and edit instantly."}
            </p>
          </div>

          {/* Read-Only Link */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest px-1">Read-Only Link</label>
            <div className="flex gap-2">
              <div className="flex-grow p-3 bg-white/4 border border-white/6 rounded-xl text-xs text-white/50 truncate font-mono">
                {getShareUrl("readonly")}
              </div>
              <button 
                onClick={() => handleCopy("readonly")}
                className={`px-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                  copied === "readonly" ? "bg-emerald-600 text-white" : "bg-white/8 hover:bg-white/15 text-white/50 hover:text-white"
                }`}
              >
                {copied === "readonly" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[9px] text-white/20 px-1">Viewers can see but cannot modify anything.</p>
          </div>

          {/* Owner: Edit Lock */}
          {isOwner && (
            <div className="p-4 bg-white/3 border border-white/6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldIcon className={isLocked ? "text-red-400" : "text-emerald-400/30"} size={16} />
                <div>
                  <h4 className="text-[11px] font-bold text-white/60">Edit Lock</h4>
                  <p className="text-[9px] text-white/25">Prevent non-owners from editing shapes</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleLock?.(!isLocked)}
                className={`w-12 h-6 rounded-full transition-all relative ${isLocked ? "bg-red-500 shadow-lg shadow-red-500/20" : "bg-white/8"}`}
              >
                <div className={`absolute top-1.5 w-3 h-3 rounded-full bg-white transition-all ${isLocked ? "left-7" : "left-1.5"}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
