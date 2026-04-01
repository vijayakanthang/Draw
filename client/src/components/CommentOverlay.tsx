import { useState } from "react";
import type { Shape } from "../types/shapes";

interface CommentOverlayProps {
  shape: Shape;
  onAddComment: (shapeId: string, text: string) => void;
  isDark: boolean;
}

export default function CommentOverlay({ shape, onAddComment, isDark }: CommentOverlayProps) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(shape.id, text);
    setText("");
  };

  const comments = shape.comments || [];

  return (
    <div 
      className="absolute z-50 pointer-events-auto"
      style={{ 
        left: (shape.x || 0) + (shape.width || 0) - 10, 
        top: (shape.y || 0) - 10 
      }}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-lg ${
          comments.length > 0 ? "bg-blue-600 text-white animate-bounce" : "bg-white/20 text-white/40 hover:bg-white/40"
        }`}
      >
        <span className="text-[10px] font-bold">{comments.length > 0 ? comments.length : "+"}</span>
      </button>

      {isOpen && (
        <div className={`absolute top-8 right-0 w-64 p-4 rounded-2xl shadow-4xl border animate-in zoom-in-95 duration-300 ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto mb-3 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-[10px] text-white/30 text-center italic">No comments yet</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-blue-400 capitalize">{c.username}</span>
                    <span className="text-[8px] text-white/20 italic">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className={`text-[11px] p-2 rounded-xl ${isDark ? "bg-white/5 text-white/80" : "bg-slate-50 text-slate-800"}`}>
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
              placeholder="Add a comment..."
              className={`flex-grow px-3 py-2 rounded-xl text-[10px] outline-none border transition-all ${
                isDark ? "bg-white/5 border-white/5 text-white focus:border-blue-500/50" : "bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500"
              }`}
            />
            <button 
              type="submit"
              className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
