import { useState } from "react";
import { ShareIcon, ShieldIcon } from "./Icons";

interface ShareModalProps {
  roomId: string;
  isVisible: boolean;
  onClose: () => void;
  isLocked: boolean;
  onToggleLock?: (locked: boolean) => void;
  isOwner?: boolean;
}

export default function ShareModal({ 
  roomId, 
  isVisible, 
  onClose,
  isLocked,
  onToggleLock,
  isOwner
}: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleCopy = (mode: "edit" | "readonly") => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.hash = roomId;
    if (mode === "readonly") {
      url.searchParams.set("mode", "readonly");
    }
    
    navigator.clipboard.writeText(url.toString());
    setCopied(mode);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
              <UserIcon />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Invite Collaborators</h2>
              <p className="text-[10px] text-white/30 truncate max-w-[200px]">Room: {roomId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-all">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* 1. Collaborative Link */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Collaborative Link</label>
            <div className="flex gap-2">
              <div className="flex-grow p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white/60 truncate italic">
                {window.location.origin}/#{roomId}
              </div>
              <button 
                onClick={() => handleCopy("edit")}
                className={`px-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                  copied === "edit" ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {copied === "edit" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[9px] text-white/20 px-1">Anyone with this link can draw and edit.</p>
          </div>

          {/* 2. Read-Only Link */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Read-Only Link</label>
            <div className="flex gap-2">
              <div className="flex-grow p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white/60 truncate italic">
                {window.location.origin}/?mode=readonly#{roomId}
              </div>
              <button 
                onClick={() => handleCopy("readonly")}
                className={`px-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                  copied === "readonly" ? "bg-green-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
                }`}
              >
                {copied === "readonly" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[9px] text-white/20 px-1">Viewers cannot draw or modify anything.</p>
          </div>

          {/* 3. Owner Permissions */}
          {isOwner && (
            <div className="mt-2 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldIcon className={isLocked ? "text-amber-500" : "text-amber-500/30"} size={16} />
                <div>
                  <h4 className="text-[11px] font-bold text-amber-500/80">Room Lock</h4>
                  <p className="text-[9px] text-white/30">Prevent non-owners from editing</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleLock?.(!isLocked)}
                className={`w-12 h-6 rounded-full transition-all relative ${isLocked ? "bg-amber-600 shadow-lg shadow-amber-600/20" : "bg-white/10"}`}
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
