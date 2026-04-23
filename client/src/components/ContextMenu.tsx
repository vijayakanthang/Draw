import { useEffect } from "react";
import { TrashIcon, LockClosedIcon, LockOpenIcon } from "./Icons";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onLock: () => void;
  onDelete: () => void;
  isLocked: boolean;
  hasSelection: boolean;
  isDark: boolean;
}

export default function ContextMenu({
  x, y, onClose, onBringToFront, onSendToBack, onDuplicate, onLock, onDelete, isLocked, hasSelection, isDark
}: ContextMenuProps) {
  useEffect(() => {
    const handleOutsideClick = () => onClose();
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [onClose]);

  const glassClass = isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200";
  const itemClass = (danger = false) => `w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all rounded-lg ${danger ? 'text-red-500 hover:bg-red-500/10' : isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <div 
      className={`fixed z-[100] w-48 p-1.5 border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 rounded-2xl ${glassClass}`}
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {hasSelection ? (
        <>
          <button onClick={onBringToFront} className={itemClass()}>
             <span>Bring to Front</span>
             <span className="ml-auto opacity-30 text-[10px]">]</span>
          </button>
          <button onClick={onSendToBack} className={itemClass()}>
             <span>Send to Back</span>
             <span className="ml-auto opacity-30 text-[10px]">[</span>
          </button>
          <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <button onClick={onDuplicate} className={itemClass()}>
             <span>Duplicate</span>
             <span className="ml-auto opacity-30 text-[10px]">Ctrl+D</span>
          </button>
          <button onClick={onLock} className={itemClass()}>
             {isLocked ? <LockOpenIcon size={14} /> : <LockClosedIcon size={14} />}
             <span>{isLocked ? "Unlock" : "Lock"}</span>
          </button>
          <div className={`my-1 h-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
          <button onClick={onDelete} className={itemClass(true)}>
             <TrashIcon />
             <span>Delete</span>
             <span className="ml-auto opacity-30 text-[10px]">Del</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={onClose} className={itemClass()}>
             <span>Selection Tool</span>
             <span className="ml-auto opacity-30 text-[10px]">V</span>
          </button>
          <button onClick={onClose} className={itemClass()}>
             <span>Hand Tool</span>
             <span className="ml-auto opacity-30 text-[10px]">H</span>
          </button>
        </>
      )}
    </div>
  );
}
