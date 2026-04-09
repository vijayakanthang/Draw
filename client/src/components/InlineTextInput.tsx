import { useState, useRef, useEffect } from "react";

interface InlineTextInputProps {
  x: number;
  y: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isSticky?: boolean;
}

export default function InlineTextInput({ x, y, onSubmit, onCancel, isSticky }: InlineTextInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus after mount with a small delay so canvas events don't steal focus
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
    // Stop propagation so canvas keyboard shortcuts don't fire
    e.stopPropagation();
  };

  return (
    <div
      className="fixed z-[200]"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`flex flex-col gap-2 p-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200 ${
        isSticky
          ? "bg-amber-400/90 border-amber-500/30 min-w-[150px]"
          : "bg-slate-900/95 border-white/10 min-w-[200px]"
      }`}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSticky ? "Sticky note..." : "Type text..."}
          rows={isSticky ? 4 : 1}
          className={`w-full resize-none outline-none text-sm font-medium leading-relaxed ${
            isSticky
              ? "bg-transparent text-slate-900 placeholder-slate-700/50"
              : "bg-transparent text-white placeholder-white/30"
          }`}
        />
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-medium ${isSticky ? "text-slate-700/50" : "text-white/20"}`}>
            Enter to save · Esc to cancel
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={onCancel}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                isSticky ? "text-slate-700/50 hover:text-slate-900" : "text-white/30 hover:text-white"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                isSticky
                  ? "bg-slate-900/20 text-slate-900 hover:bg-slate-900/30"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
