
interface HistoryScrubberProps {
  currentIndex: number;
  maxIndex: number;
  onScrub: (index: number) => void;
  isVisible: boolean;
}

export default function HistoryScrubber({ currentIndex, maxIndex, onScrub, isVisible }: HistoryScrubberProps) {
  if (!isVisible || maxIndex <= 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-96 px-6 py-4 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-4xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">History Timeline</span>
        <span className="text-[10px] font-mono text-blue-400">{currentIndex + 1} / {maxIndex + 1}</span>
      </div>
      
      <div className="relative group flex items-center">
        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentIndex}
          onChange={(e) => onScrub(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all border border-white/5"
        />
        
        {/* Ticks for snapshots */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[2px] pointer-events-none opacity-20">
          {Array.from({ length: Math.min(maxIndex + 1, 10) }).map((_, i) => (
            <div key={i} className="w-[1px] h-3 bg-white" />
          ))}
        </div>
      </div>
      
      <p className="text-[9px] text-white/20 text-center italic">Drag to travel back in time</p>
    </div>
  );
}
