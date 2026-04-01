import { useRef, useEffect } from "react";
import rough from "roughjs";
import type { Shape } from "../types/shapes";

interface MinimapProps {
  shapes: Shape[];
  pan: { x: number; y: number };
  scale: number;
  isDark: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export default function Minimap({ shapes, pan, scale, isDark, canvasWidth, canvasHeight }: MinimapProps) {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const mapScale = 0.1; // Minimap size: 10% of viewport

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Scale everything down
    ctx.scale(mapScale, mapScale);
    
    // Fill background
    ctx.fillStyle = isDark ? "#1e293b" : "#f1f5f9";
    ctx.fillRect(0, 0, canvasWidth / mapScale, canvasHeight / mapScale);

    // Draw shapes
    shapes.forEach(s => {
      const options = {
        stroke: s.color || (isDark ? "#fff" : "#000"),
        strokeWidth: (s.strokeWidth || 2) * 5, // Thicker strokes for minimap
        roughness: 0,
        seed: s.seed
      };

      if (s.type === "rectangle") {
        const rx = Math.min(s.start!.x, s.end!.x);
        const ry = Math.min(s.start!.y, s.end!.y);
        const rw = Math.abs(s.start!.x - s.end!.x);
        const rh = Math.abs(s.start!.y - s.end!.y);
        rc.rectangle(rx, ry, rw, rh, options);
      } else if (s.type === "circle") {
        const r = Math.hypot(s.end!.x - s.start!.x, s.end!.y - s.start!.y);
        rc.circle(s.start!.x, s.start!.y, r * 2, options);
      } else if (s.type === "sticky") {
        rc.rectangle(s.x || 0, s.y || 0, 150, 150, { ...options, fill: s.color || "#fbbf24", fillStyle: "solid" });
      } else if (s.type === "pencil" && s.path) {
        rc.linearPath(s.path.map(p => [p.x, p.y] as [number, number]), options);
      }
    });

    // Draw the Viewport Rectangle
    const vpX = -pan.x / scale;
    const vpY = -pan.y / scale;
    const vpW = canvasWidth / scale;
    const vpH = canvasHeight / scale;

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 10;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(vpX, vpY, vpW, vpH);

    ctx.restore();
  }, [shapes, pan, scale, isDark, canvasWidth, canvasHeight]);

  return (
    <div className="fixed bottom-24 right-6 w-48 h-32 rounded-xl border border-white/20 overflow-hidden shadow-2xl bg-slate-900/50 backdrop-blur-md pointer-events-none">
      <canvas
        ref={minimapRef}
        width={192} // 48 * 4 (Tailwind units to px)
        height={128} // 32 * 4
        className="w-full h-full"
      />
    </div>
  );
}
