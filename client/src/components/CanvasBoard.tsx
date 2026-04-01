import React, { useRef, useState, useEffect, useMemo } from "react";
import rough from "roughjs";
import type { Shape, Tool, Point } from "../types/shapes";
import Minimap from "./Minimap";

interface CanvasBoardProps {
  selectedTool: Tool;
  color: string;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[], pushToHistory?: boolean) => void;
  isDark: boolean;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  socket: any; 
  remoteCursors: Record<string, { x: number; y: number; username: string }>;
  handDrawn: boolean;
  magicMode: boolean; // Feature: AI Shape Recognition
  onTransformChange?: (pan: { x: number; y: number }, scale: number) => void;
}

export default function CanvasBoard({
  selectedTool,
  color,
  shapes,
  onShapesChange,
  isDark,
  selectedShapeId,
  onSelectShape,
  socket,
  remoteCursors,
  handDrawn,
  magicMode,
  onTransformChange
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [interaction, setInteraction] = useState<{
    type: "none" | "pan" | "move" | "resize" | "draw";
    startPos?: Point;
    activeId?: string;
  }>({ type: "none" });

  const rc = useMemo(() => {
    if (canvasRef.current) return rough.canvas(canvasRef.current);
    return null;
  }, [canvasRef.current]);

  const toCanvasPos = (e: React.MouseEvent | WheelEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  };

  useEffect(() => { 
    render(); 
    if (onTransformChange) onTransformChange(pan, scale);
  }, [shapes, currentShape, pan, scale, isDark, selectedShapeId, remoteCursors]);

  const render = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save();
    ctx.translate(pan.x, pan.y); ctx.scale(scale, scale);
    drawGrid(ctx); shapes.forEach(s => drawShape(s, ctx));
    if (currentShape) drawShape(currentShape, ctx);
    if (selectedShapeId) { const s = shapes.find(sh => sh.id === selectedShapeId); if (s) drawSelection(s, ctx); }
    ctx.restore(); drawCursors(ctx);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 50; const opacity = isDark ? 0.05 : 0.1;
    ctx.strokeStyle = isDark ? "#ffffff" : "#000000"; ctx.lineWidth = 0.5; ctx.globalAlpha = opacity;
    const left = -pan.x / scale, top = -pan.y / scale, right = (ctx.canvas.width - pan.x) / scale, bottom = (ctx.canvas.height - pan.y) / scale;
    ctx.beginPath();
    for (let x = Math.floor(left / gridSize) * gridSize; x < right; x += gridSize) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = Math.floor(top / gridSize) * gridSize; y < bottom; y += gridSize) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
  };

  const drawShape = (s: Shape, ctx: CanvasRenderingContext2D) => {
    if (!rc) return;
    const options = { stroke: s.color || (isDark ? "#fff" : "#000"), strokeWidth: s.strokeWidth || 2, roughness: handDrawn ? (s.roughness ?? 1) : 0, bowing: handDrawn ? 1.5 : 0, seed: s.seed };
    switch (s.type) {
      case "rectangle": if (!s.start || !s.end) return; rc.rectangle(s.start.x, s.start.y, s.end.x - s.start.x, s.end.y - s.start.y, options); break;
      case "circle": if (!s.start || !s.end) return; const r = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y); rc.circle(s.start.x, s.start.y, r * 2, options); break;
      case "line": if (!s.start || !s.end) return; rc.line(s.start.x, s.start.y, s.end.x, s.end.y, options); break;
      case "arrow": if (!s.start || !s.end) return; rc.line(s.start.x, s.start.y, s.end.x, s.end.y, options);
        const angle = Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x); const l = 15;
        rc.line(s.end.x, s.end.y, s.end.x - l * Math.cos(angle - Math.PI / 6), s.end.y - l * Math.sin(angle - Math.PI / 6), options);
        rc.line(s.end.x, s.end.y, s.end.x - l * Math.cos(angle + Math.PI / 6), s.end.y - l * Math.sin(angle + Math.PI / 6), options); break;
      case "pencil": if (s.path && s.path.length > 1) rc.linearPath(s.path.map(p => [p.x, p.y] as [number, number]), options); break;
      case "text": ctx.fillStyle = s.color || (isDark ? "#fff" : "#000"); ctx.font = `20px Inter`; ctx.fillText(s.text || "", s.x || 0, s.y || 0); break;
      case "sticky": const sx = s.x || 0, sy = s.y || 0; rc.rectangle(sx, sy, 150, 150, { ...options, fill: s.color || "#fbbf24", fillStyle: "solid", roughness: 0.5 });
        ctx.fillStyle = "#000"; ctx.font = `14px Inter`; (s.text || "Sticky Note").split("\n").forEach((line, i) => ctx.fillText(line, sx + 10, sy + 25 + i * 20)); break;
    }
  };

  const drawSelection = (s: Shape, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#4f46e5"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    const b = getBounds(s); ctx.strokeRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10); ctx.setLineDash([]);
  };

  const getBounds = (s: Shape) => {
    if (s.type === "pencil" && s.path) {
      const xs = s.path.map(p => p.x); const ys = s.path.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (s.type === "sticky") return { x: s.x || 0, y: s.y || 0, w: 150, h: 150 };
    if (s.type === "text") return { x: s.x || 0, y: (s.y || 0) - 20, w: 100, h: 25 };
    const x = Math.min(s.start!.x, s.end!.x); const y = Math.min(s.start!.y, s.end!.y);
    const w = Math.abs(s.start!.x - s.end!.x); const h = Math.abs(s.start!.y - s.end!.y);
    return { x, y, w, h };
  };

  const drawCursors = (ctx: CanvasRenderingContext2D) => {
    Object.entries(remoteCursors).forEach(([_id, pos]) => {
      const screenX = pos.x * scale + pan.x, screenY = pos.y * scale + pan.y;
      ctx.fillStyle = "#ff4757"; ctx.beginPath(); ctx.moveTo(screenX, screenY); ctx.lineTo(screenX + 15, screenY + 5); ctx.lineTo(screenX + 5, screenY + 15); ctx.fill();
      ctx.font = "10px Inter"; ctx.fillText(pos.username || "Guest", screenX + 10, screenY + 25);
    });
  };

  const getAnchorPoint = (pos: Point) => {
    const snapThreshold = 40;
    const target = shapes.find(s => {
      if (s.type === "rectangle" || s.type === "sticky" || s.type === "circle") {
        const b = getBounds(s);
        return pos.x >= b.x - snapThreshold && pos.x <= b.x + b.w + snapThreshold && 
               pos.y >= b.y - snapThreshold && pos.y <= b.y + b.h + snapThreshold;
      }
      return false;
    });
    if (target) { const b = getBounds(target); return { id: target.id, point: { x: b.x + b.w / 2, y: b.y + b.h / 2 } }; }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = toCanvasPos(e);
    if (e.button === 1 || (e.button === 0 && selectedTool === "none")) { setInteraction({ type: "pan", startPos: { x: e.clientX, y: e.clientY } }); return; }
    if (selectedTool === "select") {
      const hit = shapes.find(s => { const b = getBounds(s); return pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h; });
      onSelectShape(hit?.id || null); if (hit) setInteraction({ type: "move", activeId: hit.id, startPos: pos }); return;
    }
    if (selectedTool === "text" || selectedTool === "sticky") {
       const value = prompt("Enter text", "");
       if (value) { onShapesChange([...shapes, { id: crypto.randomUUID(), type: selectedTool, x: pos.x, y: pos.y, text: value, color: selectedTool === "sticky" ? "#fbbf24" : color, seed: Math.floor(Math.random() * 2**31) }]); } return;
    }
    if (selectedTool !== "none" && (selectedTool as any) !== "comment") {
      const anchor = (selectedTool === "arrow" || selectedTool === "line") ? getAnchorPoint(pos) : null;
      setCurrentShape({ id: crypto.randomUUID(), type: selectedTool, start: anchor ? anchor.point : pos, end: pos, path: [pos], color, seed: Math.floor(Math.random() * 2**31), roughness: 1, anchoredStartId: anchor?.id });
      setInteraction({ type: "draw" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = toCanvasPos(e); socket?.emit("cursor-move", { x: pos.x, y: pos.y });
    if (interaction.type === "pan") {
      const dx = e.clientX - interaction.startPos!.x; const dy = e.clientY - interaction.startPos!.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy })); setInteraction(prev => ({ ...prev, startPos: { x: e.clientX, y: e.clientY } })); return;
    }
    if (interaction.type === "draw" && currentShape) {
       const anchor = (currentShape.type === "arrow" || currentShape.type === "line") ? getAnchorPoint(pos) : null;
       const updated = { ...currentShape, end: anchor ? anchor.point : pos, anchoredEndId: anchor?.id };
       if (currentShape.type === "pencil") updated.path = [...(currentShape.path || []), pos];
       setCurrentShape(updated);
    }
    if (interaction.type === "move" && interaction.activeId) {
      const dx = pos.x - interaction.startPos!.x; const dy = pos.y - interaction.startPos!.y;
      const updatedShapes = shapes.map(s => {
        if (s.id !== interaction.activeId) {
          if (s.anchoredStartId === interaction.activeId || s.anchoredEndId === interaction.activeId) {
            const anchor = shapes.find(item => item.id === interaction.activeId);
            if (anchor) {
              const b = getBounds(anchor); const cx = b.x + b.w / 2 + dx, cy = b.y + b.h / 2 + dy;
              if (s.anchoredStartId === interaction.activeId) return { ...s, start: { x: cx, y: cy } };
              if (s.anchoredEndId === interaction.activeId) return { ...s, end: { x: cx, y: cy } };
            }
          }
          return s;
        }
        if (s.type === "pencil") return { ...s, path: s.path?.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        if (s.type === "sticky" || s.type === "text") return { ...s, x: (s.x || 0) + dx, y: (s.y || 0) + dy };
        return { ...s, start: s.start ? { x: s.start.x + dx, y: s.start.y + dy } : undefined, end: s.end ? { x: s.end.x + dx, y: s.end.y + dy } : undefined };
      });
      onShapesChange(updatedShapes); setInteraction(prev => ({ ...prev, startPos: pos }));
    }
  };

  const handleMouseUp = () => {
    if (interaction.type === "draw" && currentShape) {
      // AI Shape Recognition (Feature)
      if (magicMode && currentShape.type === "pencil" && currentShape.path && currentShape.path.length > 10) {
          const b = getBounds(currentShape);
          const ratio = b.w / b.h;
          const pathLen = currentShape.path.length;
          const boxPerim = (b.w + b.h) * 2;
          if (pathLen > boxPerim * 0.5) {
             const finalShape: Shape = {
                ...currentShape,
                type: Math.abs(1 - ratio) < 0.3 ? "circle" : "rectangle",
                start: { x: b.x, y: b.y },
                end: { x: b.x + b.w, y: b.y + b.h }
             };
             onShapesChange([...shapes, finalShape]);
             setCurrentShape(null); setInteraction({ type: "none" });
             return;
          }
      }
      onShapesChange([...shapes, currentShape]);
    }
    setCurrentShape(null); setInteraction({ type: "none" });
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomSpeed = 0.001; const dScale = -e.deltaY * zoomSpeed; const newScale = Math.min(Math.max(scale + dScale, 0.1), 5);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top; const worldX = (mouseX - pan.x) / scale, worldY = (mouseY - pan.y) / scale;
        setScale(newScale); setPan({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale });
      }
    } else { setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY })); }
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [pan, scale]);

  useEffect(() => {
    const updateSize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener("resize", updateSize); updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden bg-transparent">
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} className="block touch-none" />
      <Minimap shapes={shapes} pan={pan} scale={scale} isDark={isDark} canvasWidth={canvasRef.current?.width || window.innerWidth} canvasHeight={canvasRef.current?.height || window.innerHeight} />
    </div>
  );
}
