import { useState, useMemo } from "react";
import { XIcon } from "./Icons";
import type { Shape } from "../types/shapes";

interface SearchPanelProps {
  isVisible: boolean;
  onClose: () => void;
  shapes: Shape[];
  onSelectShape: (id: string) => void;
  isDark: boolean;
}

export default function SearchPanel({ isVisible, onClose, shapes, onSelectShape, isDark }: SearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return shapes.filter(s => {
      const text = (s.text || "").toLowerCase();
      return text.includes(query.toLowerCase());
    }).slice(0, 10);
  }, [shapes, query]);

  if (!isVisible) return null;

  const glassClass = isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200";

  return (
    <div className={`fixed top-20 right-4 z-[90] w-72 p-4 border shadow-2xl backdrop-blur-xl rounded-2xl animate-in slide-in-from-right-4 duration-300 ${glassClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-400"}`}>Search Board</h3>
        <button onClick={onClose} className={isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900"}>
          <XIcon size={16} />
        </button>
      </div>

      <input 
        autoFocus
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search sticky notes, text..."
        className={`w-full p-3 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
      />

      <div className="mt-4 flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
        {results.map(r => (
          <button 
            key={r.id}
            onClick={() => onSelectShape(r.id)}
            className={`w-full text-left p-3 rounded-xl transition-all border border-transparent hover:border-blue-500/30 ${isDark ? "hover:bg-white/5 text-white/70" : "hover:bg-slate-100 text-slate-600"}`}
          >
            <div className="text-[10px] opacity-40 uppercase font-black mb-1">{r.type}</div>
            <div className="text-xs font-bold line-clamp-2">{r.text}</div>
          </button>
        ))}
        {query && results.length === 0 && (
          <div className="py-8 text-center text-xs opacity-40">No matches found</div>
        )}
      </div>
    </div>
  );
}
