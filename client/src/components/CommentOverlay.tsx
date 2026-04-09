import { useState } from "react";
import type { Shape } from "../types/shapes";

interface CommentOverlayProps {
  shape: Shape;
  onAddComment: (shapeId: string, text: string) => void;
}

// Calculate proper position from shape bounds
function getShapeTopRight(shape: Shape): { x: number; y: number } {
  if (shape.type === "sticky") {
    return { x: (shape.x || 0) + 150, y: shape.y || 0 };
  }
  if (shape.type === "text") {
    return { x: (shape.x || 0) + 100, y: (shape.y || 0) - 20 };
  }
  if (shape.start && shape.end) {
    return { 
      x: Math.max(shape.start.x, shape.end.x), 
      y: Math.min(shape.start.y, shape.end.y) 
    };
  }
  return { x: shape.x || 0, y: shape.y || 0 };
}

export default function CommentOverlay({ shape, onAddComment }: CommentOverlayProps) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(shape.id, text);
    setText("");
  };

  const comments = shape.comments || [];
  const pos = getShapeTopRight(shape);

  return (
    <div 
      className="absolute z-50 pointer-events-auto"
      style={{ 
        left: pos.x - 10, 
        top: pos.y - 10 
      }}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg ${
          comments.length > 0 ? "bg-blue-600 text-white" : "bg-white/15 text-white/35 hover:bg-white/25 hover:text-white/60"
        }`}
      >
        <span className="text-[10px] font-bold">{comments.length > 0 ? comments.length : "+"}</span>
      </button>

      {isOpen && (
        <div className="absolute top-8 right-0 w-64 p-4 rounded-2xl shadow-2xl border glass-strong animate-zoom-in">
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto mb-3 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-[10px] text-white/25 text-center italic py-2">No comments yet</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-blue-400 capitalize">{c.username}</span>
                    <span className="text-[8px] text-white/15 italic">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] p-2 rounded-xl bg-white/5 text-white/70">
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Add a comment..."
              className="flex-grow px-3 py-2 rounded-xl text-[10px] outline-none border bg-white/5 border-white/6 text-white placeholder-white/20 focus:border-blue-500/40 transition-all"
            />
            <button 
              type="submit"
              className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold transition-all"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
