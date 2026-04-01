import { useState, useEffect } from "react";
import type { Shape } from "../types/shapes";

interface ComponentLibraryProps {
  onAddShape: (shape: Shape) => void;
  isVisible: boolean;
  onClose: () => void;
  selectedShape: Shape | null;
}

export default function ComponentLibrary({ onAddShape, isVisible, onClose, selectedShape }: ComponentLibraryProps) {
  const [templates, setTemplates] = useState<{ id: string; name: string; shapes: Shape[] }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("draw-templates");
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  const saveToLocal = (newTemplates: typeof templates) => {
    setTemplates(newTemplates);
    localStorage.setItem("draw-templates", JSON.stringify(newTemplates));
  };

  const handleSaveSelected = () => {
    if (!selectedShape) return;
    const name = prompt("Enter template name:", "My Template");
    if (!name) return;

    const newTemplate = {
      id: crypto.randomUUID(),
      name,
      shapes: [selectedShape]
    };
    const next = [...templates, newTemplate];
    saveToLocal(next);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-24 left-6 z-40 w-64 h-[calc(100vh-12rem)] bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-4xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-500"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <span className="text-xs font-bold uppercase tracking-widest text-white/60">Library</span>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">×</button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSaveSelected}
            disabled={!selectedShape}
            className={`w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg ${
              selectedShape 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95 animate-pulse" 
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            Save Selected as Template
          </button>
          {!selectedShape && (
            <p className="text-[9px] text-blue-400/60 text-center animate-pulse">Select a shape on canvas first</p>
          )}
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-30">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/50" />
            <span className="text-[10px]">No templates yet</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {templates.map(t => (
              <div 
                key={t.id}
                onClick={() => t.shapes.forEach(s => onAddShape({ ...s, id: crypto.randomUUID() }))}
                className="group relative p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl cursor-pointer transition-all"
              >
                <span className="text-[11px] font-medium text-white/80">{t.name}</span>
                <div className="mt-1 text-[9px] text-white/30 uppercase">{t.shapes.length} elements</div>
                <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     const next = templates.filter(temp => temp.id !== t.id);
                     saveToLocal(next);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10">
        <p className="text-[9px] text-white/20 text-center italic">Click a template to add it to canvas</p>
      </div>
    </div>
  );
}
