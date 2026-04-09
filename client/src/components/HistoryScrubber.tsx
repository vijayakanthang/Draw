
interface HistoryScrubberProps {
  currentIndex: number;
  maxIndex: number;
  onScrub: (index: number) => void;
  isVisible: boolean;
}

export default function HistoryScrubber({ currentIndex, maxIndex, onScrub, isVisible }: HistoryScrubberProps) {
  if (!isVisible || maxIndex <= 0) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-96 px-6 py-4 glass-strong rounded-2xl shadow-2xl flex flex-col gap-3 animate-slide-up z-50">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">History Timeline</span>
        <span className="text-[10px] font-mono text-blue-400">{currentIndex + 1} / {maxIndex + 1}</span>
      </div>
      
      <div className="relative group flex items-center">
        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentIndex}
          onChange={(e) => onScrub(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer border border-white/5"
        />
      </div>
      
      <p className="text-[9px] text-white/15 text-center italic">Drag to travel back in time</p>
    </div>
  );
}
