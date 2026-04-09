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
    if (saved) {
      try { setTemplates(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveToLocal = (newTemplates: typeof templates) => {
    setTemplates(newTemplates);
    localStorage.setItem("draw-templates", JSON.stringify(newTemplates));
  };

  const handleSaveSelected = () => {
    if (!selectedShape) return;
    const name = window.prompt("Enter template name:", "My Template");
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
      className="fixed top-20 left-5 z-40 w-64 h-[calc(100vh-10rem)] glass-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-left"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-white/6 flex justify-between items-center bg-white/3">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">Library</span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">×</button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSaveSelected}
            disabled={!selectedShape}
            className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              selectedShape 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95" 
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            Save Selected as Template
          </button>
          {!selectedShape && (
            <p className="text-[9px] text-blue-400/40 text-center">Select a shape on canvas first</p>
          )}
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-25">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30" />
            <span className="text-[10px] text-white/50">No templates yet</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {templates.map(t => (
              <div 
                key={t.id}
                onClick={() => t.shapes.forEach(s => onAddShape({ ...s, id: crypto.randomUUID() }))}
                className="group relative p-3 bg-white/4 hover:bg-white/8 border border-white/5 rounded-xl cursor-pointer transition-all"
              >
                <span className="text-[11px] font-medium text-white/70">{t.name}</span>
                <div className="mt-1 text-[9px] text-white/25 uppercase">{t.shapes.length} elements</div>
                <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     const next = templates.filter(temp => temp.id !== t.id);
                     saveToLocal(next);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/3 border-t border-white/6">
        <p className="text-[9px] text-white/20 text-center italic">Click a template to add it to canvas</p>
      </div>
    </div>
  );
}
