import { TrashIcon, LockClosedIcon, LockOpenIcon } from "./Icons";
import type { Shape } from "../types/shapes";

interface FloatingShapeToolbarProps {
  selectedShapes: Shape[];
  onDelete: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  isDark: boolean;
  scale: number;
  pan: { x: number; y: number };
}

export default function FloatingShapeToolbar({
  selectedShapes,
  onDelete,
  onToggleLock,
  onDuplicate,
  isDark,
  scale,
  pan,
}: FloatingShapeToolbarProps) {
  if (selectedShapes.length === 0) return null;

  // Calculate bounding box of all selected shapes
  const getBounds = (s: Shape) => {
    if (s.type === "pencil" && s.path) {
      const xs = s.path.map(p => p.x); const ys = s.path.map(p => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    if (s.type === "sticky") return { x: s.x || 0, y: s.y || 0, w: 150, h: 150 };
    if (s.type === "text") return { x: s.x || 0, y: (s.y || 0) - 20, w: 100, h: 25 };
    if (!s.start || !s.end) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: Math.min(s.start.x, s.end.x), y: Math.min(s.start.y, s.end.y), w: Math.abs(s.start.x - s.end.x), h: Math.abs(s.start.y - s.end.y) };
  };

  const bounds = selectedShapes.reduce((acc, s) => {
    const b = getBounds(s);
    if (!acc) return { minX: b.x, minY: b.y, maxX: b.x + b.w, maxY: b.y + b.h };
    return {
      minX: Math.min(acc.minX, b.x),
      minY: Math.min(acc.minY, b.y),
      maxX: Math.max(acc.maxX, b.x + b.w),
      maxY: Math.max(acc.maxY, b.y + b.h),
    };
  }, null as { minX: number; minY: number; maxX: number; maxY: number } | null);

  if (!bounds) return null;

  const x = bounds.minX * scale + pan.x;
  const y = (bounds.minY - 60 / scale) * scale + pan.y;

  const glassClass = isDark ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200";
  const textClass = isDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-900";

  return (
    <div 
      className={`fixed z-[80] flex items-center gap-1 p-1.5 border rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${glassClass}`}
      style={{ left: x, top: y, transform: "translateY(-10px)" }}
    >
      <button 
        onClick={onDuplicate}
        title="Duplicate"
        className={`w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 ${textClass} transition-all`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      </button>

      <div className={`w-[1px] h-5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

      <button 
        onClick={onToggleLock}
        title={selectedShapes.some(s => s.isLocked) ? "Unlock" : "Lock"}
        className={`w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 ${textClass} transition-all`}
      >
        {selectedShapes.some(s => s.isLocked) ? <LockOpenIcon /> : <LockClosedIcon />}
      </button>

      <div className={`w-[1px] h-5 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

      <button 
        onClick={onDelete}
        title="Delete"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-red-500 transition-all"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
