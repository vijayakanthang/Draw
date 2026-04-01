import { useState } from "react";
import { SparklesIcon } from "./Icons";
import type { Shape } from "../types/shapes";

interface AICommandPaletteProps {
  isVisible: boolean;
  onClose: () => void;
  onGenerate: (shapes: Shape[]) => void;
  isDark: boolean;
}

export default function AICommandPalette({ isVisible, onClose, onGenerate, isDark }: AICommandPaletteProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const processAiRequest = () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    // AI Text-to-Diagram Heuristic Parser (Simulating AI for "A -> B -> C")
    setTimeout(() => {
      const parts = input.split("->").map(p => p.trim());
      const newShapes: Shape[] = [];
      const startX = 200;
      const startY = 300;
      const gap = 240;

      parts.forEach((label, i) => {
        const x = startX + i * gap;
        const y = startY;
        const id = crypto.randomUUID();

        // 1. Add Rectangle/Box
        const box: Shape = {
          id,
          type: "rectangle",
          start: { x, y },
          end: { x: x + 140, y: y + 60 },
          text: label,
          color: i === 0 ? "#2563eb" : (isDark ? "#ffffff" : "#000000"),
          seed: Math.floor(Math.random() * 2**31),
          strokeWidth: 2,
        };
        newShapes.push(box);

        // 2. Add Arrow to next
        if (i < parts.length - 1) {
          const arrow: Shape = {
            id: crypto.randomUUID(),
            type: "arrow",
            start: { x: x + 140, y: y + 30 },
            end: { x: x + gap, y: y + 30 },
            color: "#6366f1",
            seed: Math.floor(Math.random() * 2**31),
            strokeWidth: 2,
          };
          newShapes.push(arrow);
        }
      });

      onGenerate(newShapes);
      setInput("");
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"} border rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl animate-pulse">
            <SparklesIcon />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>AI Intelligence Hub</h2>
            <p className={`text-xs ${isDark ? "text-white/40" : "text-slate-500"}`}>Translate your ideas into professional diagrams instantly.</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "User Login -> Dashboard -> Success"'
            className={`w-full h-32 p-4 rounded-2xl border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-mono text-sm`}
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-white/20 uppercase font-bold tracking-widest">Natural Language UI</div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className={`px-6 py-3 rounded-2xl text-xs font-bold ${isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900"} transition-all`}
          >
            Cancel
          </button>
          <button 
            onClick={processAiRequest}
            disabled={isProcessing || !input.trim()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isProcessing ? "Processing..." : "Generate Magic"}
            {!isProcessing && <SparklesIcon />}
          </button>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/5" : "bg-slate-50 border border-slate-100"}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-slate-400"}`}>Tip:</span>
            <p className={`text-xs mt-1 ${isDark ? "text-white/50" : "text-slate-600"}`}>Use arrows &quot;-&gt;&quot; to define flow. Each step becomes an interactive shape.</p>
        </div>
      </div>
    </div>
  );
}
