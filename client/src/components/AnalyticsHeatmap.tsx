import { useMemo } from "react";
import type { Shape } from "../types/shapes";

interface AnalyticsHeatmapProps {
  shapes: Shape[];
  isVisible: boolean;
  pan: { x: number; y: number };
  scale: number;
}

export default function AnalyticsHeatmap({ shapes, isVisible, pan, scale }: AnalyticsHeatmapProps) {
  const heatmapData = useMemo(() => {
    if (!isVisible) return [];
    
    const cellSize = 100;
    const grid: Record<string, number> = {};
    let maxDensity = 0;

    shapes.forEach(s => {
      const x = s.x || (s.start ? s.start.x : 0);
      const y = s.y || (s.start ? s.start.y : 0);
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const key = `${cellX},${cellY}`;
      grid[key] = (grid[key] || 0) + 1;
      maxDensity = Math.max(maxDensity, grid[key]);
    });

    return Object.entries(grid).map(([key, density]) => {
      const [cx, cy] = key.split(",").map(Number);
      return {
        x: cx * cellSize,
        y: cy * cellSize,
        opacity: density / maxDensity,
        density
      };
    });
  }, [shapes, isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}
    >
      {heatmapData.map((cell, i) => (
        <div
          key={i}
          className="absolute border border-red-500/10 transition-all duration-1000"
          style={{
            left: cell.x,
            top: cell.y,
            width: 100,
            height: 100,
            backgroundColor: `rgba(239, 68, 68, ${cell.opacity * 0.4})`,
            boxShadow: `inset 0 0 20px rgba(239, 68, 68, ${cell.opacity * 0.2})`,
          }}
        >
           {cell.density > 2 && (
             <span className="absolute bottom-1 right-1 text-[8px] text-white/40 font-mono">
               {cell.density} edits
             </span>
           )}
        </div>
      ))}
      
      <div className="fixed top-24 right-32 px-4 py-2 bg-red-600/20 backdrop-blur-xl border border-red-500/20 rounded-full animate-pulse shadow-2xl">
         <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Collaborator Activity Heatmap</span>
      </div>
    </div>
  );
}
