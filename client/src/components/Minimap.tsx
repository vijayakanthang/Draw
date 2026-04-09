import { useRef, useEffect } from "react";
import rough from "roughjs";
import type { Shape } from "../types/shapes";

interface MinimapProps {
  shapes: Shape[];
  pan: { x: number; y: number };
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
}

export default function Minimap({ shapes, pan, scale, canvasWidth, canvasHeight }: MinimapProps) {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const mapScale = 0.1;

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.scale(mapScale, mapScale);
    
    // Fill background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvasWidth / mapScale, canvasHeight / mapScale);

    // Draw shapes
    shapes.forEach(s => {
      const options = {
        stroke: s.color || "#fff",
        strokeWidth: (s.strokeWidth || 2) * 5,
        roughness: 0,
        seed: s.seed
      };

      try {
        if (s.type === "rectangle" && s.start && s.end) {
          const rx = Math.min(s.start.x, s.end.x);
          const ry = Math.min(s.start.y, s.end.y);
          const rw = Math.abs(s.start.x - s.end.x);
          const rh = Math.abs(s.start.y - s.end.y);
          rc.rectangle(rx, ry, rw, rh, options);
        } else if (s.type === "circle" && s.start && s.end) {
          const r = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y);
          rc.circle(s.start.x, s.start.y, r * 2, options);
        } else if (s.type === "sticky") {
          rc.rectangle(s.x || 0, s.y || 0, 150, 150, { ...options, fill: s.color || "#fbbf24", fillStyle: "solid" });
        } else if (s.type === "pencil" && s.path && s.path.length > 1) {
          rc.linearPath(s.path.map(p => [p.x, p.y] as [number, number]), options);
        }
      } catch {
        // Skip malformed shapes silently
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
    ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
    ctx.fillRect(vpX, vpY, vpW, vpH);

    ctx.restore();
  }, [shapes, pan, scale, canvasWidth, canvasHeight]);

  return (
    <div className="fixed bottom-20 right-5 w-44 h-28 rounded-xl border border-white/8 overflow-hidden shadow-xl bg-[#111827]/80 backdrop-blur-sm pointer-events-none mobile-hide">
      <canvas
        ref={minimapRef}
        width={176}
        height={112}
        className="w-full h-full"
      />
    </div>
  );
}
