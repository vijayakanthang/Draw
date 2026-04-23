import React, { useRef, useState, useEffect, useCallback } from "react";
import rough from "roughjs";
import type { Shape, Tool, Point, FillStyle } from "../types/shapes.tsx";
import type { Socket } from "socket.io-client";
import Minimap from "./Minimap";

interface RemoteDrawing {
  id: string;
  username: string;
  shape: Shape;
}

interface CanvasBoardProps {
  selectedTool: Tool;
  color: string;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[], pushToHistory?: boolean) => void;
  isDark: boolean;
  selectedShapeIds: string[];
  onSelectShapes: (ids: string[]) => void;
  socket: Socket | null;
  remoteCursors: Record<string, { x: number; y: number; username: string; userNumber?: number }>;
  remoteDrawings: Record<string, RemoteDrawing>;
  username: string;
  handDrawn: boolean;
  onTransformChange?: (pan: { x: number; y: number }, scale: number) => void;
  onRequestTextInput?: (pos: { x: number; y: number; canvasX: number; canvasY: number }, isSticky: boolean) => void;
  activeProperties: { strokeWidth: number; opacity: number; fontFamily: string; eraserSize: number; gridSnap: boolean; fillColor: string; fillStyle: FillStyle; bold: boolean; italic: boolean; underline: boolean };
}

// Deterministic color from a string
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function CanvasBoard({
  selectedTool,
  color,
  shapes,
  onShapesChange,
  isDark,
  selectedShapeIds,
  onSelectShapes,
  socket,
  remoteCursors,
  remoteDrawings,
  username,
  handDrawn,
  onTransformChange,
  onRequestTextInput,
  activeProperties,
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const rcRef = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const bufferRcRef = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null);
  const [interaction, setInteraction] = useState<{
    type: "none" | "pan" | "move" | "resize" | "draw" | "marquee";
    startPos?: Point;
    activeId?: string;
    handle?: "tl" | "tc" | "tr" | "ml" | "mr" | "bl" | "bc" | "br";
  }>({ type: "none" });
  const [laserPath, setLaserPath] = useState<{ x: number, y: number, time: number }[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // FIX #4: Use a ref to always call the latest render function from the RAF loop,
  // avoiding stale closure issues with the empty-dep useEffect RAF loop.
  const renderRef = useRef<() => void>(() => {});

  // Helper: load image from URL into cache
  const getImage = useCallback((url: string): HTMLImageElement | null => {
    const cache = imageCacheRef.current;
    if (cache.has(url)) {
      const img = cache.get(url)!;
      return img.complete ? img : null;
    }
    const img = new Image();
    img.onload = () => scheduleRender();
    img.src = url;
    cache.set(url, img);
    return null;
  }, []);

  // Helper: file to data URL -> create image shape
  const addImageFromFile = useCallback((file: File, cx?: number, cy?: number) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 400;
        const aspect = img.height / img.width;
        const w = Math.min(img.width, maxW);
        const h = w * aspect;
        const x = cx ?? (window.innerWidth / 2 - pan.x) / scale - w / 2;
        const y = cy ?? (window.innerHeight / 2 - pan.y) / scale - h / 2;
        const shape: Shape = {
          id: crypto.randomUUID(),
          type: "image",
          imageUrl: url,
          start: { x, y },
          end: { x: x + w, y: y + h },
          width: w,
          height: h,
          color: "#fff",
          seed: Math.floor(Math.random() * 2 ** 31),
          strokeWidth: 0,
          opacity: 1,
        };
        imageCacheRef.current.set(url, img);
        onShapesChange([...shapes, shape]);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [shapes, onShapesChange, pan, scale]);

  // Create rough canvas after mount
  useEffect(() => {
    if (canvasRef.current) {
      rcRef.current = rough.canvas(canvasRef.current);
    }
    if (!bufferRef.current) {
      bufferRef.current = document.createElement("canvas");
    }
    bufferRcRef.current = rough.canvas(bufferRef.current);
  }, []);

  const toCanvasPos = useCallback((e: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent | WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return {
      x: (x - pan.x) / scale,
      y: (y - pan.y) / scale
    };
  }, [pan, scale]);

  const toScreenPos = useCallback((canvasX: number, canvasY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: canvasX * scale + pan.x + rect.left,
      y: canvasY * scale + pan.y + rect.top
    };
  }, [pan, scale]);

  const isDirty = useRef(true);
  const rafRef = useRef<number | null>(null);

  const scheduleRender = useCallback(() => {
    isDirty.current = true;
  }, []);

  // FIX #4: RAF loop calls renderRef.current so it always uses the latest render closure.
  useEffect(() => {
    const loop = () => {
      if (isDirty.current) {
        renderRef.current();
        isDirty.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // Run once

  // Trigger render on any relevant prop change
  useEffect(() => {
    scheduleRender();
  }, [shapes, currentShape, marquee, pan, scale, isDark, selectedShapeIds, remoteCursors, remoteDrawings, scheduleRender]);

  useEffect(() => {
    if (onTransformChange) onTransformChange(pan, scale);
    scheduleRender();
  }, [pan, scale, onTransformChange, scheduleRender]);

  const snapToGrid = useCallback((val: number) => {
    if (!activeProperties.gridSnap) return val;
    const gridSize = 25;
    return Math.round(val / gridSize) * gridSize;
  }, [activeProperties.gridSnap]);

  const snapPoint = useCallback((p: Point) => {
    return { x: snapToGrid(p.x), y: snapToGrid(p.y) };
  }, [snapToGrid]);

  useEffect(() => {
    if (laserPath.length === 0) return;
    const interval = setInterval(() => {
        setLaserPath(prev => prev.filter(p => Date.now() - p.time < 1000));
        scheduleRender();
    }, 50);
    return () => clearInterval(interval);
  }, [laserPath.length, scheduleRender]);

  const render = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const buffer = bufferRef.current; if (!buffer) return;
    const bCtx = buffer.getContext("2d"); if (!bCtx) return;
    const rc = bufferRcRef.current;

    if (buffer.width !== canvas.width || buffer.height !== canvas.height) {
      buffer.width = canvas.width;
      buffer.height = canvas.height;
    }

    // FIX #5: Removed static cursor from JSX; set cursor dynamically here only.
    if (interaction.type === "pan") canvas.style.cursor = "grabbing";
    else if (interaction.type === "move") canvas.style.cursor = "move";
    else if (interaction.type === "resize") canvas.style.cursor = "nwse-resize";
    else if (selectedTool === "pencil") canvas.style.cursor = "crosshair";
    else if (selectedTool === "eraser") canvas.style.cursor = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im03IDIxLTQuMy00LjNjLTEtMS0xLTIuNSAwLTMuNGw5LjktOS45YzEtMSAyLjUtMSAzLjQgMGw0LjMgNC4zYzEgMSAxIDIuNSAwIDMuNEwxMC44IDIxegoiLz48cGF0aCBkPSJtMjIgMjFIMiIvPjxwYXRoIGQ9Im01IDExIDkgOSIvPjwvc3ZnPg==') 12 12, auto";
    else if (selectedTool === "text") canvas.style.cursor = "text";
    else if (selectedTool === "laser") canvas.style.cursor = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmNDc1NyIgc3Ryb2tlPSIjZmY0NzU3IiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiLz48L3N2Zz4=') 12 12, auto";
    else if (selectedTool === "none") canvas.style.cursor = "grab";
    else canvas.style.cursor = "default";

    const dpr = window.devicePixelRatio || 1;

    // 1. Draw Grid on main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y); ctx.scale(scale, scale);
    drawGrid(ctx, dpr);
    ctx.restore();

    // 2. Clear Buffer and Setup Transform
    bCtx.clearRect(0, 0, buffer.width, buffer.height);
    bCtx.save();
    bCtx.scale(dpr, dpr);
    bCtx.translate(pan.x, pan.y); bCtx.scale(scale, scale);

    // 3. Draw Shapes to Buffer
    const normalShapes = shapes.filter(s => s.type !== "eraser");
    const erasures = shapes.filter(s => s.type === "eraser");

    normalShapes.forEach(s => drawShape(s, bCtx, rc));
    if (currentShape && currentShape.type !== "eraser") drawShape(currentShape, bCtx, rc);

    // Remote in-progress shapes
    Object.values(remoteDrawings).forEach(rd => {
      if (rd.shape.type !== "eraser") {
        const oldAlpha = bCtx.globalAlpha;
        bCtx.globalAlpha = (rd.shape.opacity ?? 1) * 0.4;
        drawShape(rd.shape, bCtx, rc);
        bCtx.globalAlpha = oldAlpha;
      }
    });

    // 4. Subtractive Erasing
    bCtx.globalCompositeOperation = "destination-out";
    const drawEraserStroke = (pts: Point[], width = 20) => {
      if (pts.length < 2) return;
      bCtx.beginPath();
      bCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) bCtx.lineTo(pts[i].x, pts[i].y);
      bCtx.lineWidth = width;
      bCtx.lineCap = "round";
      bCtx.lineJoin = "round";
      bCtx.stroke();
    };

    erasures.forEach(e => { if (e.path) drawEraserStroke(e.path, e.strokeWidth || 20); });
    if (currentShape && currentShape.type === "eraser" && currentShape.path) drawEraserStroke(currentShape.path, activeProperties.eraserSize);

    Object.values(remoteDrawings).forEach(rd => {
      if (rd.shape.type === "eraser" && rd.shape.path) {
        bCtx.globalAlpha = 0.4;
        drawEraserStroke(rd.shape.path);
        bCtx.globalAlpha = 1;
      }
    });

    bCtx.globalCompositeOperation = "source-over";
    bCtx.restore();

    // 5. Composite Buffer to main canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(buffer, 0, 0);
    ctx.restore();

    // 6. UI Overlays (Selection, Cursors, Marquee)
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y); ctx.scale(scale, scale);

    if (marquee) {
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 1 / scale;
      ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
      const mx = Math.min(marquee.start.x, marquee.end.x);
      const my = Math.min(marquee.start.y, marquee.end.y);
      const mw = Math.abs(marquee.start.x - marquee.end.x);
      const mh = Math.abs(marquee.start.y - marquee.end.y);
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
    }

    if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => {
        const s = shapes.find(sh => sh.id === id);
        if (s) drawSelection(s, ctx, selectedShapeIds.length > 1);
      });
    }
    ctx.restore();
    drawCursors(ctx);
    drawLaser(ctx);
  };

  // FIX #4: Keep renderRef in sync with the latest render closure every render cycle.
  renderRef.current = render;

  const drawLaser = (ctx: CanvasRenderingContext2D) => {
    if (laserPath.length < 2) return;
    ctx.save();
    ctx.translate(pan.x, pan.y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#ff4757";
    ctx.lineWidth = 3 / scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff4757";
    ctx.beginPath();
    ctx.moveTo(laserPath[0].x, laserPath[0].y);
    laserPath.forEach((p) => {
        const age = Date.now() - p.time;
        const alpha = Math.max(0, 1 - age / 1000);
        ctx.globalAlpha = alpha;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    });
    ctx.restore();
  };

  // FIX #7: Accept dpr param so grid boundaries use logical pixels correctly.
  const drawGrid = (ctx: CanvasRenderingContext2D, dpr: number) => {
    const gridSize = 50;
    ctx.strokeStyle = isDark ? "#ffffff" : "#000000";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = isDark ? 0.03 : 0.05;
    const logicalWidth = ctx.canvas.width / dpr;
    const logicalHeight = ctx.canvas.height / dpr;
    const left = -pan.x / scale, top = -pan.y / scale;
    const right = (logicalWidth - pan.x) / scale;
    const bottom = (logicalHeight - pan.y) / scale;
    ctx.beginPath();
    for (let x = Math.floor(left / gridSize) * gridSize; x < right; x += gridSize) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = Math.floor(top / gridSize) * gridSize; y < bottom; y += gridSize) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
  };

  const drawShape = (s: Shape, ctx: CanvasRenderingContext2D, rc: ReturnType<typeof rough.canvas> | null) => {
    if (!rc) return;
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = s.opacity ?? 1;

    const options: any = {
      stroke: s.color || "#fff",
      strokeWidth: s.strokeWidth || 2,
      roughness: handDrawn ? (s.roughness ?? 1) : 0,
      bowing: handDrawn ? 1.5 : 0,
      seed: s.seed
    };

    if (s.fillColor) {
      options.fill = s.fillColor;
      options.fillStyle = s.fillStyle || "hachure";
    }

    switch (s.type) {
      case "rectangle": if (!s.start || !s.end) return; rc.rectangle(s.start.x, s.start.y, s.end.x - s.start.x, s.end.y - s.start.y, options); break;
      case "circle": if (!s.start || !s.end) return; { const r = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y); rc.circle(s.start.x, s.start.y, r * 2, options); } break;
      case "line": if (!s.start || !s.end) return; rc.line(s.start.x, s.start.y, s.end.x, s.end.y, options); break;
      // FIX #6: Arrow head length scaled by current scale so it looks consistent at all zoom levels.
      case "arrow": if (!s.start || !s.end) return; rc.line(s.start.x, s.start.y, s.end.x, s.end.y, options); {
        const angle = Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x);
        const l = 15 / scale;
        rc.line(s.end.x, s.end.y, s.end.x - l * Math.cos(angle - Math.PI / 6), s.end.y - l * Math.sin(angle - Math.PI / 6), options);
        rc.line(s.end.x, s.end.y, s.end.x - l * Math.cos(angle + Math.PI / 6), s.end.y - l * Math.sin(angle + Math.PI / 6), options);
      } break;
      case "pencil": if (s.path && s.path.length > 1) rc.linearPath(s.path.map(p => [p.x, p.y] as [number, number]), options); break;
      case "text": {
        ctx.fillStyle = s.color || "#fff";
        let fontStr = "";
        if (s.italic) fontStr += "italic ";
        if (s.bold) fontStr += "bold ";
        ctx.font = `${fontStr}${s.fontSize || 20}px ${s.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillText(s.text || "", s.x || 0, s.y || 0);
        if (s.underline) {
            const metrics = ctx.measureText(s.text || "");
            ctx.beginPath();
            ctx.moveTo(s.x || 0, (s.y || 0) + 2);
            ctx.lineTo((s.x || 0) + metrics.width, (s.y || 0) + 2);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
      } break;
      case "sticky": {
        const sx = s.x || 0, sy = s.y || 0;
        rc.rectangle(sx, sy, 150, 150, { ...options, fill: s.color || "#fbbf24", fillStyle: "solid", roughness: 0.5 });
        ctx.fillStyle = "#1a1a2e"; ctx.font = "14px Inter, sans-serif";
        (s.text || "Sticky Note").split("\n").forEach((line, i) => ctx.fillText(line, sx + 10, sy + 25 + i * 20));
      } break;
      case "image": {
        if (!s.start || !s.end || !s.imageUrl) return;
        const ix = Math.min(s.start.x, s.end.x);
        const iy = Math.min(s.start.y, s.end.y);
        const iw = Math.abs(s.end.x - s.start.x);
        const ih = Math.abs(s.end.y - s.start.y);
        const img = getImage(s.imageUrl);
        if (img) {
          ctx.drawImage(img, ix, iy, iw, ih);
        } else {
          ctx.strokeStyle = "#6366f1";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(ix, iy, iw, ih);
          ctx.setLineDash([]);
          ctx.fillStyle = isDark ? "#ffffff50" : "#00000040";
          ctx.font = "14px Inter, sans-serif";
          ctx.fillText("Loading image...", ix + iw / 2 - 50, iy + ih / 2);
        }
      } break;
    }
    ctx.globalAlpha = oldAlpha;
  };

  const drawSelection = (s: Shape, ctx: CanvasRenderingContext2D, isMulti: boolean) => {
    const isLocked = s.isLocked;
    ctx.strokeStyle = isLocked ? "#f59e0b" : "#6366f1"; ctx.lineWidth = 1.5 / scale; ctx.setLineDash([6 / scale, 4 / scale]);
    const b = getBounds(s);
    ctx.strokeRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10); ctx.setLineDash([]);

    if (isLocked) {
      const iconSize = 14 / scale;
      ctx.fillStyle = "#f59e0b";
      ctx.font = `bold ${iconSize}px Inter, sans-serif`;
      ctx.fillText("🔒", b.x + b.w - iconSize, b.y - 8 / scale);
      return;
    }

    if (isMulti) return;

    const handleSize = 8 / scale;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 1.5 / scale;

    const handles = [
      { x: b.x - 5, y: b.y - 5, type: "tl" },
      { x: b.x + b.w / 2, y: b.y - 5, type: "tc" },
      { x: b.x + b.w + 5, y: b.y - 5, type: "tr" },
      { x: b.x - 5, y: b.y + b.h / 2, type: "ml" },
      { x: b.x + b.w + 5, y: b.y + b.h / 2, type: "mr" },
      { x: b.x - 5, y: b.y + b.h + 5, type: "bl" },
      { x: b.x + b.w / 2, y: b.y + b.h + 5, type: "bc" },
      { x: b.x + b.w + 5, y: b.y + b.h + 5, type: "br" },
    ];

    handles.forEach(h => {
      ctx.beginPath();
      ctx.roundRect(h.x - handleSize/2, h.y - handleSize/2, handleSize, handleSize, 2 / scale);
      ctx.fill();
      ctx.stroke();
    });
  };

  // FIX #1 & #2: Add minimum hit-target padding for line/arrow so axis-aligned
  // lines (w=0 or h=0) are still selectable and have valid bounds for hit-detection.
  const LINE_HIT_PADDING = 10;

  const getBounds = (s: Shape) => {
    if (s.type === "pencil" && s.path) {
      const xs = s.path.map(p => p.x); const ys = s.path.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (s.type === "sticky") return { x: s.x || 0, y: s.y || 0, w: 150, h: 150 };
    if (s.type === "text") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.font = `${s.fontSize || 20}px ${s.fontFamily || 'Inter, sans-serif'}`;
        const metrics = ctx.measureText(s.text || "");
        return {
          x: s.x || 0,
          y: (s.y || 0) - (s.fontSize || 20),
          w: metrics.width,
          h: (s.fontSize || 20) * 1.2
        };
      }
      return { x: s.x || 0, y: (s.y || 0) - 20, w: 100, h: 25 };
    }
    if (!s.start || !s.end) return { x: 0, y: 0, w: 0, h: 0 };
    const x = Math.min(s.start.x, s.end.x); const y = Math.min(s.start.y, s.end.y);
    let w = Math.abs(s.start.x - s.end.x); let h = Math.abs(s.start.y - s.end.y);
    // FIX #1: Ensure line/arrow always has a minimum hit-target area.
    if (s.type === "line" || s.type === "arrow") {
      if (w < LINE_HIT_PADDING) { w = LINE_HIT_PADDING; }
      if (h < LINE_HIT_PADDING) { h = LINE_HIT_PADDING; }
    }
    return { x, y, w, h };
  };

  const drawCursors = (ctx: CanvasRenderingContext2D) => {
    Object.entries(remoteCursors).forEach(([id, pos]) => {
      const cursorColor = hashColor(pos.username || id);
      const screenX = pos.x * scale + pan.x, screenY = pos.y * scale + pan.y;

      ctx.fillStyle = cursorColor;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + 14, screenY + 5);
      ctx.lineTo(screenX + 5, screenY + 14);
      ctx.fill();

      const label = `${pos.username || "Guest"} (#${pos.userNumber || "?"})`;
      ctx.font = "bold 10px Inter, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const labelX = screenX + 14, labelY = screenY + 22;

      ctx.fillStyle = cursorColor;
      ctx.beginPath();
      ctx.roundRect(labelX - 2, labelY - 10, textWidth + 10, 16, 4);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.fillText(label, labelX + 3, labelY + 2);
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

  const activePointersRef = useRef<Record<number, Point>>({});
  const lastPinchDistance = useRef<number | null>(null);
  const lastCursorEmit = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = toCanvasPos(e);
    activePointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };

    if (e.button === 1 || (e.button === 0 && selectedTool === "none")) { setInteraction({ type: "pan", startPos: { x: e.clientX, y: e.clientY } }); return; }

    if (selectedTool === "select") {
      if (selectedShapeIds.length === 1) {
        const s = shapes.find(sh => sh.id === selectedShapeIds[0]);
        // FIX #3: Skip resize handles for line/arrow — they are two-point shapes,
        // not rectangles, so box-handle resizing produces wrong results.
        if (s && !s.isLocked && s.type !== "line" && s.type !== "arrow") {
          const b = getBounds(s);
          const handleSize = 15 / scale;
          const handles = [
            { x: b.x - 5, y: b.y - 5, type: "tl" },
            { x: b.x + b.w / 2, y: b.y - 5, type: "tc" },
            { x: b.x + b.w + 5, y: b.y - 5, type: "tr" },
            { x: b.x - 5, y: b.y + b.h / 2, type: "ml" },
            { x: b.x + b.w + 5, y: b.y + b.h / 2, type: "mr" },
            { x: b.x - 5, y: b.y + b.h + 5, type: "bl" },
            { x: b.x + b.w / 2, y: b.y + b.h + 5, type: "bc" },
            { x: b.x + b.w + 5, y: b.y + b.h + 5, type: "br" },
          ];
          const hitHandle = handles.find(h => Math.hypot(h.x - pos.x, h.y - pos.y) < handleSize / 2);
          if (hitHandle) {
            setInteraction({ type: "resize", handle: hitHandle.type as any, activeId: s.id, startPos: pos });
            return;
          }
        }
      }

      const hit = shapes.find(s => { const b = getBounds(s); return pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h; });

      if (hit) {
        if (!selectedShapeIds.includes(hit.id)) {
            if (e.shiftKey) {
                onSelectShapes([...selectedShapeIds, hit.id]);
            } else {
                onSelectShapes([hit.id]);
            }
        }
        const allLocked = shapes.filter(s => selectedShapeIds.includes(s.id) || s.id === hit.id).every(s => s.isLocked);
        if (!allLocked) {
          setInteraction({ type: "move", activeId: hit.id, startPos: pos });
        }
        return;
      } else {
        if (!e.shiftKey) onSelectShapes([]);
        setInteraction({ type: "marquee", startPos: pos });
        setMarquee({ start: pos, end: pos });
        return;
      }
    }
    if (selectedTool === "text" || selectedTool === "sticky") {
      if (onRequestTextInput) {
        const screen = toScreenPos(pos.x, pos.y);
        onRequestTextInput({ x: screen.x, y: screen.y, canvasX: pos.x, canvasY: pos.y }, selectedTool === "sticky");
      }
      return;
    }
    if (selectedTool === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) addImageFromFile(file, pos.x, pos.y);
      };
      input.click();
      return;
    }
    if (selectedTool === "laser") {
        setLaserPath(prev => [...prev, { x: pos.x, y: pos.y, time: Date.now() }]);
        isDirty.current = true;
        return;
    }

    if (selectedTool === "eraser") {
      setCurrentShape({ id: crypto.randomUUID(), type: "eraser", path: [pos], color: "#000", seed: 0, strokeWidth: activeProperties.eraserSize });
      setInteraction({ type: "draw" });
      return;
    }
    if (selectedTool !== "none" && selectedTool !== "comment") {
      const snappedPos = snapPoint(pos);
      const anchor = (selectedTool === "arrow" || selectedTool === "line") ? getAnchorPoint(snappedPos) : null;
      const needsFill = selectedTool === "rectangle" || selectedTool === "circle";
      setCurrentShape({
        id: crypto.randomUUID(),
        type: selectedTool,
        start: anchor ? anchor.point : snappedPos,
        end: snappedPos,
        path: [snappedPos],
        color,
        seed: Math.floor(Math.random() * 2**31),
        roughness: 1,
        anchoredStartId: anchor?.id,
        strokeWidth: activeProperties.strokeWidth,
        opacity: activeProperties.opacity,
        fontFamily: activeProperties.fontFamily,
        fontSize: 20,
        ...(needsFill && activeProperties.fillColor ? { fillColor: activeProperties.fillColor, fillStyle: activeProperties.fillStyle } : {}),
        bold: activeProperties.bold,
        italic: activeProperties.italic,
        underline: activeProperties.underline,
      });
      setInteraction({ type: "draw" });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    activePointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const pointers = activePointersRef.current;
    const pointerIds = Object.keys(pointers);

    if (pointerIds.length === 2) {
      const p1 = pointers[Number(pointerIds[0])];
      const p2 = pointers[Number(pointerIds[1])];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p2.y) / 2;

      if (lastPinchDistance.current !== null) {
        const delta = dist / lastPinchDistance.current;
        const newScale = Math.min(Math.max(scale * delta, 0.1), 10);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = centerX - rect.left, mouseY = centerY - rect.top;
          const worldX = (mouseX - pan.x) / scale, worldY = (mouseY - pan.y) / scale;

          if (Math.abs(1 - delta) > 0.001) {
            setScale(newScale);
            setPan({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale });
          } else if (interaction.type === "pan") {
            const dx = centerX - interaction.startPos!.x;
            const dy = centerY - interaction.startPos!.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          }
        }
      }
      setInteraction(prev => ({ ...prev, startPos: { x: centerX, y: centerY } }));
      lastPinchDistance.current = dist;
      return;
    } else {
      lastPinchDistance.current = null;
    }

    const pos = toCanvasPos(e);

    const now = Date.now();
    if (now - lastCursorEmit.current > 30) {
      socket?.emit("cursor-move", { x: pos.x, y: pos.y, username });
      lastCursorEmit.current = now;
    }
    if (selectedTool === "laser") {
        setLaserPath(prev => [...prev, { x: pos.x, y: pos.y, time: Date.now() }]);
        isDirty.current = true;
    }

    if (interaction.type === "pan") {
      const dx = e.clientX - interaction.startPos!.x; const dy = e.clientY - interaction.startPos!.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy })); setInteraction(prev => ({ ...prev, startPos: { x: e.clientX, y: e.clientY } })); return;
    }
    if (interaction.type === "marquee") {
      setMarquee({ start: interaction.startPos!, end: pos });
      const mx = Math.min(interaction.startPos!.x, pos.x);
      const my = Math.min(interaction.startPos!.y, pos.y);
      const mw = Math.abs(interaction.startPos!.x - pos.x);
      const mh = Math.abs(interaction.startPos!.y - pos.y);

      const inMarquee = shapes.filter(s => {
        const b = getBounds(s);
        return b.x >= mx && b.x + b.w <= mx + mw && b.y >= my && b.y + b.h <= my + mh;
      }).map(s => s.id);

      onSelectShapes(inMarquee);
      return;
    }

    if (interaction.type === "move" && selectedShapeIds.length > 0) {
      const dx = pos.x - interaction.startPos!.x; const dy = pos.y - interaction.startPos!.y;
      const updatedShapes = shapes.map(s => {
        if (!selectedShapeIds.includes(s.id) || s.isLocked) {
          if (s.anchoredStartId && selectedShapeIds.includes(s.anchoredStartId)) {
             const anchor = shapes.find(item => item.id === s.anchoredStartId);
             if (anchor) {
               const b = getBounds(anchor); const cx = b.x + b.w / 2 + dx, cy = b.y + b.h / 2 + dy;
               return { ...s, start: { x: cx, y: cy } };
             }
          }
          if (s.anchoredEndId && selectedShapeIds.includes(s.anchoredEndId)) {
             const anchor = shapes.find(item => item.id === s.anchoredEndId);
             if (anchor) {
               const b = getBounds(anchor); const cx = b.x + b.w / 2 + dx, cy = b.y + b.h / 2 + dy;
               return { ...s, end: { x: cx, y: cy } };
             }
          }
          return s;
        }
        if (s.type === "pencil") return { ...s, path: s.path?.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        if (s.type === "sticky" || s.type === "text") return { ...s, x: (s.x || 0) + dx, y: (s.y || 0) + dy };
        return { ...s, start: s.start ? { x: s.start.x + dx, y: s.start.y + dy } : undefined, end: s.end ? { x: s.end.x + dx, y: s.end.y + dy } : undefined };
      });
      onShapesChange(updatedShapes);
      setInteraction(prev => ({ ...prev, startPos: pos }));
      scheduleRender();
      return;
    }

    if (interaction.type === "draw" && selectedTool === "eraser" && currentShape) {
      const updated = { ...currentShape, path: [...(currentShape.path || []), pos] };
      setCurrentShape(updated);
      socket?.emit("drawing-in-progress", { shape: updated });
      scheduleRender();
      return;
    }
    if (interaction.type === "draw" && currentShape) {
      const snappedPos = snapPoint(pos);
      const anchor = (currentShape.type === "arrow" || currentShape.type === "line") ? getAnchorPoint(snappedPos) : null;
      const updated = { ...currentShape, end: anchor ? anchor.point : snappedPos, anchoredEndId: anchor?.id };
      if (currentShape.type === "pencil") updated.path = [...(currentShape.path || []), pos];
      setCurrentShape(updated);
      socket?.emit("drawing-in-progress", { shape: updated });
      scheduleRender();
    }

    // FIX #3: Skip resize for line/arrow types — handled as endpoint drag above via move.
    if (interaction.type === "resize" && interaction.activeId && interaction.handle) {
      const dx = pos.x - interaction.startPos!.x;
      const dy = pos.y - interaction.startPos!.y;

      const updatedShapes = shapes.map(s => {
        if (s.id !== interaction.activeId) return s;
        if (s.type === "pencil" || s.type === "line" || s.type === "arrow") return s;

        let { start, end, x, y, width, height } = s;
        const handle = interaction.handle!;

        let curX = x ?? (start ? Math.min(start.x, end!.x) : 0);
        let curY = y ?? (start ? Math.min(start.y, end!.y) : 0);
        let curW = width ?? (start ? Math.abs(start.x - end!.x) : 150);
        let curH = height ?? (start ? Math.abs(start.y - end!.y) : 150);

        if (handle.includes("l")) { curX += dx; curW -= dx; }
        if (handle.includes("r")) { curW += dx; }
        if (handle.includes("t")) { curY += dy; curH -= dy; }
        if (handle.includes("b")) { curH += dy; }

        const snappedX = snapToGrid(curX);
        const snappedY = snapToGrid(curY);
        const snappedW = snapToGrid(curW);
        const snappedH = snapToGrid(curH);

        if (s.type === "sticky" || s.type === "text") {
          return { ...s, x: snappedX, y: snappedY, width: Math.max(snappedW, 20), height: Math.max(snappedH, 20) };
        }

        return {
          ...s,
          start: { x: snappedX, y: snappedY },
          end: { x: snappedX + snappedW, y: snappedY + snappedH }
        };
      });
      onShapesChange(updatedShapes);
      setInteraction(prev => ({ ...prev, startPos: pos }));
      scheduleRender();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    delete activePointersRef.current[e.pointerId];
    lastPinchDistance.current = null;
    setMarquee(null);

    if (interaction.type === "draw" && currentShape) {
      onShapesChange([...shapes, currentShape]);
      socket?.emit("drawing-finished");
    }
    setCurrentShape(null); setInteraction({ type: "none" });
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.002;
    if (e.ctrlKey) {
      const dScale = 1 - e.deltaY * zoomSpeed;
      const newScale = Math.min(Math.max(scale * dScale, 0.1), 10);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        const worldX = (mouseX - pan.x) / scale, worldY = (mouseY - pan.y) / scale;
        setScale(newScale); setPan({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale });
      }
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, [pan, scale]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const buffer = bufferRef.current;
      if (!canvas || !buffer) return;

      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      buffer.width = w * dpr;
      buffer.height = h * dpr;

      bufferRcRef.current = rough.canvas(buffer);
      rcRef.current = rough.canvas(canvas);

      scheduleRender();
    };

    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, [scheduleRender]);

  // Drag-drop image support
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      const files = e.dataTransfer?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith("image/")) {
            const rect = canvas.getBoundingClientRect();
            const cx = (e.clientX - rect.left - pan.x) / scale;
            const cy = (e.clientY - rect.top - pan.y) / scale;
            addImageFromFile(files[i], cx, cy);
          }
        }
      }
    };
    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("drop", handleDrop);
    return () => {
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [addImageFromFile, pan, scale]);

  // Paste image support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) addImageFromFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addImageFromFile]);

  return (
    <div className="w-full h-full overflow-hidden bg-transparent touch-none overscroll-none">
      {/* FIX #5: Removed static inline cursor style — cursor is now managed exclusively
          by render() via canvas.style.cursor for correct interaction-aware behavior. */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="block touch-none"
      />
      <Minimap shapes={shapes} pan={pan} scale={scale} canvasWidth={canvasRef.current?.width || window.innerWidth} canvasHeight={canvasRef.current?.height || window.innerHeight} />
    </div>
  );
}
