import React, { useRef, useState, useEffect } from "react";
import type { Shape, Tool, Point } from "../types/shapes";

interface CanvasBoardProps {
  selectedTool: Tool;
  fontFamily: string;
  fontSize: number;
  color: string;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  isDark: boolean;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
}


export default function CanvasBoard({
  selectedTool,
  fontFamily,
  fontSize,
  color,
  shapes,
  onShapesChange,
  isDark,
  onSelectShape,
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [textEdit, setTextEdit] = useState<{
    id?: string;
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: window.innerWidth,
    h: window.innerHeight - 80,
  });
  const [interaction, setInteraction] = useState<
    | { type: "none" }
    | { type: "move"; id: string; startPos: Point }
    | { type: "resize"; id: string; handle: "br" | "endA" | "endB"; startPos: Point }
    | { type: "rotate"; id: string; center: Point }
  >({ type: "none" });

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: e.clientX, y: e.clientY };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const safePoint = (p?: Point): Point => p ?? { x: 0, y: 0 };

  const drawAllShapes = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    shapes.forEach((shape) => drawShape(ctx, shape));
    if (selectedId) {
      const s = shapes.find((sh) => sh.id === selectedId);
      if (s) drawSelection(ctx, s);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.lineWidth = 2;

    switch (shape.type) {
      case "pencil":
        if (shape.path && shape.path.length > 0) {
          ctx.strokeStyle = shape.color || "#fff";
          ctx.beginPath();
          shape.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        }
        break;

      case "line": {
        const start = safePoint(shape.start);
        const end = safePoint(shape.end);
        ctx.strokeStyle = shape.color || "#fff";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      }

      case "circle": {
        const start = safePoint(shape.start);
        const end = safePoint(shape.end);
        ctx.strokeStyle = shape.color || "#fff";
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case "rectangle": {
        const start = safePoint(shape.start);
        const end = safePoint(shape.end);
        ctx.strokeStyle = shape.color || "#fff";
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        const angle = ((shape.rotation || 0) * Math.PI) / 180;
        if (angle) {
          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate(angle);
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          ctx.strokeRect(x, y, w, h);
        }
        break;
      }

      case "arrow": {
        const start = safePoint(shape.start);
        const end = safePoint(shape.end);
        ctx.strokeStyle = shape.color || "#fff";
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const ang = Math.atan2(dy, dx);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(
          end.x - headlen * Math.cos(ang - Math.PI / 6),
          end.y - headlen * Math.sin(ang - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headlen * Math.cos(ang + Math.PI / 6),
          end.y - headlen * Math.sin(ang + Math.PI / 6)
        );
        ctx.stroke();
        break;
      }

      case "text": {
        if (shape.text != null) {
          const x = shape.x ?? 0;
          const y = shape.y ?? 0;
          ctx.fillStyle = shape.color || "#000";
          ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Arial"}`;
          const ang = ((shape.rotation || 0) * Math.PI) / 180;
          if (ang) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            ctx.fillText(shape.text, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(shape.text, x, y);
          }
        }
        break;
      }
    }
  };

  const getRectBounds = (shape: Shape) => {
    const start = safePoint(shape.start);
    const end = safePoint(shape.end);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  };

  const drawSelection = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.strokeStyle = "#4f46e5";
    ctx.fillStyle = "#4f46e5";
    ctx.lineWidth = 1;
    const handleSize = 6;
    if (shape.type === "rectangle") {
      const { x, y, w, h } = getRectBounds(shape);
      // bounding box (not rotated for simplicity)
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      // bottom-right resize handle
      ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      // rotate handle (top-center)
      const rx = x + w / 2;
      const ry = y - 20;
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    } else if (shape.type === "line" || shape.type === "arrow") {
      const a = safePoint(shape.start);
      const b = safePoint(shape.end);
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillRect(a.x - handleSize / 2, a.y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(b.x - handleSize / 2, b.y - handleSize / 2, handleSize, handleSize);
    } else if (shape.type === "circle") {
      const start = safePoint(shape.start);
      const end = safePoint(shape.end);
      const r = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      // radius handle at end point
      ctx.fillRect(end.x - handleSize / 2, end.y - handleSize / 2, handleSize, handleSize);
    } else if (shape.type === "text") {
      const width = (shape.fontSize || 16) * (shape.text ? shape.text.length * 0.6 : 4);
      const height = shape.fontSize || 16;
      const x = shape.x ?? 0;
      const y = (shape.y ?? 0) - height;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      // rotate handle top-center
      const rx = x + width / 2;
      const ry = y - 20;
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
    ctx.restore();
  };

  const hitTest = (
    p: Point
  ): { id: string; handle?: "br" | "endA" | "endB" | "rotate" } | null => {
    const handleSize = 8;
    // Prioritize handles for currently selected shape
    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) {
      if (shape.type === "rectangle") {
        const { x, y, w, h } = getRectBounds(shape);
        // bottom-right handle
        if (p.x >= x + w - handleSize && p.x <= x + w + handleSize && p.y >= y + h - handleSize && p.y <= y + h + handleSize) {
          return { id: shape.id, handle: "br" };
        }
        // rotate (top-center approx circle area)
        const rx = x + w / 2;
        const ry = y - 20;
        if (Math.hypot(p.x - rx, p.y - ry) <= 8) return { id: shape.id, handle: "rotate" as any };
      }
      if (shape.type === "line" || shape.type === "arrow") {
        const s = safePoint(shape.start);
        const e = safePoint(shape.end);
        if (Math.abs(p.x - s.x) <= handleSize && Math.abs(p.y - s.y) <= handleSize) return { id: shape.id, handle: "endA" };
        if (Math.abs(p.x - e.x) <= handleSize && Math.abs(p.y - e.y) <= handleSize) return { id: shape.id, handle: "endB" };
      }
      if (shape.type === "circle") {
        const e = safePoint(shape.end);
        if (Math.abs(p.x - e.x) <= handleSize && Math.abs(p.y - e.y) <= handleSize) return { id: shape.id, handle: "endB" };
      }
      if (shape.type === "text") {
        const width = (shape.fontSize || 16) * (shape.text ? shape.text.length * 0.6 : 4);
        const height = shape.fontSize || 16;
        const x = shape.x ?? 0;
        const y = (shape.y ?? 0) - height;
        const rx = x + width / 2;
        const ry = y - 20;
        if (Math.hypot(p.x - rx, p.y - ry) <= 8) return { id: shape.id, handle: "rotate" as any };
      }
    }

    // Shape body (iterate top-down)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.type === "rectangle") {
        const { x, y, w, h } = getRectBounds(s);
        if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) return { id: s.id };
      } else if (s.type === "circle") {
        const start = safePoint(s.start);
        const end = safePoint(s.end);
        const r = Math.hypot(end.x - start.x, end.y - start.y);
        if (Math.hypot(p.x - start.x, p.y - start.y) <= r) return { id: s.id };
      } else if (s.type === "line" || s.type === "arrow") {
        const start = safePoint(s.start);
        const end = safePoint(s.end);
        const dist = pointToSegmentDistance(p, start, end);
        if (dist <= 6) return { id: s.id };
      } else if (s.type === "pencil") {
        const path = s.path || [];
        for (let j = 0; j < path.length - 1; j++) {
          if (pointToSegmentDistance(p, path[j], path[j + 1]) <= 6) return { id: s.id };
        }
      } else if (s.type === "text") {
        const width = (s.fontSize || 16) * (s.text ? s.text.length * 0.6 : 4);
        const height = s.fontSize || 16;
        const x = s.x ?? 0;
        const y = (s.y ?? 0) - height;
        if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) return { id: s.id };
      }
    }
    return null;
  };

  const pointToSegmentDistance = (p: Point, a: Point, b: Point) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
    const t = c1 / c2;
    const projx = a.x + t * vx;
    const projy = a.y + t * vy;
    return Math.hypot(p.x - projx, p.y - projy);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      // Set background color first
      ctx.fillStyle = isDark ? "#0f172a" : "#ffffff"; // dark or white background
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      drawAllShapes(ctx);
    }
  }, [shapes, isDark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const updatedShapes = shapes.filter((s) => s.id !== selectedId);
        onShapesChange(updatedShapes);
        setSelectedId(null);
        onSelectShape?.(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, shapes, onShapesChange, onSelectShape]);

  useEffect(() => {
    if (textEdit && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [textEdit]);

  useEffect(() => {
    const measure = () => {
      const toolbar = document.getElementById("toolbar");
      const th = toolbar ? toolbar.getBoundingClientRect().height : 64;
      setCanvasSize({ w: window.innerWidth, h: Math.max(200, window.innerHeight - th) });
      // ensure canvas element size is updated on DOM
      const c = canvasRef.current;
      if (c) {
        c.width = Math.max(200, window.innerWidth);
        c.height = Math.max(200, Math.max(200, window.innerHeight - th));
      }
    };
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    measure();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    // If inline text editor is open, commit it before any other action
    if (textEdit) {
      commitText(textEdit.value);
    }

    // Check selection/handles first
    const hit = hitTest(pos);
    if (hit) {
      setSelectedId(hit.id);
      onSelectShape?.(hit.id);
      const s = shapes.find((sh) => sh.id === hit.id)!;
      if (hit.handle === "br") {
        setInteraction({ type: "resize", id: s.id, handle: "br", startPos: pos });
        return;
      }
      if (hit.handle === "endA") {
        setInteraction({ type: "resize", id: s.id, handle: "endA", startPos: pos });
        return;
      }
      if (hit.handle === "endB") {
        setInteraction({ type: "resize", id: s.id, handle: "endB", startPos: pos });
        return;
      }
      if ((hit as any).handle === "rotate") {
        // compute center
        let center: Point = { x: 0, y: 0 };
        if (s.type === "rectangle") {
          const b = getRectBounds(s);
          center = { x: b.cx, y: b.cy };
        } else if (s.type === "text") {
          const width = (s.fontSize || 16) * (s.text ? s.text.length * 0.6 : 4);
          const height = s.fontSize || 16;
          center = { x: (s.x || 0) + width / 2, y: (s.y || 0) - height / 2 };
        }
        setInteraction({ type: "rotate", id: s.id, center });
        return;
      }
      setInteraction({ type: "move", id: s.id, startPos: pos });
      return;
    }

    // Handle text tool: popup to add text
    if (selectedTool === "text") {
      const value = prompt("Enter text", "");
      if (value && value.trim()) {
        const newText: Shape = {
          id: crypto.randomUUID(),
          type: "text",
          text: value.trim(),
          x: pos.x,
          y: pos.y,
          color: color || "#000",
          fontSize,
          fontFamily,
        };
        onShapesChange([...shapes, newText]);
      }
      return;
    }

    // Create new shape
    if (selectedTool !== "none") {
      const newShape: Shape = {
        id: crypto.randomUUID(),
        type: selectedTool,
        start: pos,
        end: pos,
        path: selectedTool === "pencil" ? [pos] : [],
        color,
      };
      setCurrentShape(newShape);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    // Handle interactions (move/resize/rotate)
    if (interaction.type === "move") {
      const sIdx = shapes.findIndex((sh) => sh.id === interaction.id);
      if (sIdx >= 0) {
        const dx = pos.x - interaction.startPos.x;
        const dy = pos.y - interaction.startPos.y;
        const s = shapes[sIdx];
        let updated: Shape = { ...s };
        if (s.type === "rectangle" || s.type === "circle" || s.type === "line" || s.type === "arrow") {
          const start = safePoint(s.start);
          const end = safePoint(s.end);
          updated = {
            ...s,
            start: { x: start.x + dx, y: start.y + dy },
            end: { x: end.x + dx, y: end.y + dy },
          };
        } else if (s.type === "pencil") {
          updated = {
            ...s,
            path: (s.path || []).map((p) => ({ x: p.x + dx, y: p.y + dy })),
          } as Shape;
        } else if (s.type === "text") {
          updated = { ...s, x: (s.x || 0) + dx, y: (s.y || 0) + dy };
        }
        const next = [...shapes];
        next[sIdx] = updated;
        onShapesChange(next);
        setInteraction({ ...interaction, startPos: pos });
      }
      return;
    }

    if (interaction.type === "resize") {
      const sIdx = shapes.findIndex((sh) => sh.id === interaction.id);
      if (sIdx >= 0) {
        const s = shapes[sIdx];
        let updated: Shape = { ...s };
        if (s.type === "rectangle") {
          updated = { ...s, end: pos };
        } else if (s.type === "line" || s.type === "arrow") {
          if (interaction.handle === "endA") updated = { ...s, start: pos };
          else updated = { ...s, end: pos };
        } else if (s.type === "circle") {
          updated = { ...s, end: pos };
        }
        const next = [...shapes];
        next[sIdx] = updated;
        onShapesChange(next);
      }
      return;
    }

    if (interaction.type === "rotate") {
      const sIdx = shapes.findIndex((sh) => sh.id === interaction.id);
      if (sIdx >= 0) {
        const s = shapes[sIdx];
        const angle = (Math.atan2(pos.y - interaction.center.y, pos.x - interaction.center.x) * 180) / Math.PI;
        const next = [...shapes];
        next[sIdx] = { ...s, rotation: angle };
        onShapesChange(next);
      }
      return;
    }

    if (!currentShape) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updated: Shape = { ...currentShape, end: pos };
    if (selectedTool === "pencil") {
      updated.path = [...(currentShape.path || []), pos];
    }

    drawAllShapes(ctx);
    drawShape(ctx, updated);
    setCurrentShape(updated);
  };

  const handleMouseUp = () => {
    if (interaction.type !== "none") {
      setInteraction({ type: "none" });
    }
    if (currentShape) {
      onShapesChange([...shapes, currentShape]);
      setCurrentShape(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const hit = hitTest(pos);
    if (hit) {
      const idx = shapes.findIndex((s) => s.id === hit.id);
      if (idx >= 0 && shapes[idx].type === "text") {
        const current = shapes[idx];
        setTextEdit({ id: current.id, x: current.x ?? pos.x, y: current.y ?? pos.y, value: current.text ?? "" });
      }
    }
  };

  const commitText = (finalText: string) => {
    if (!textEdit) return;
    const value = finalText.trim();
    if (textEdit.id) {
      // update existing
      const idx = shapes.findIndex((s) => s.id === textEdit.id);
      if (idx >= 0) {
        const next = [...shapes];
        next[idx] = { ...next[idx], text: value };
        onShapesChange(next);
      }
    } else if (value) {
      const newText: Shape = {
        id: crypto.randomUUID(),
        type: "text",
        text: value,
        x: textEdit.x,
        y: textEdit.y,
        color,
        fontSize,
        fontFamily,
      };
      onShapesChange([...shapes, newText]);
    }
    setTextEdit(null);
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className={`border-0 rounded-none cursor-crosshair w-screen transition-colors duration-300 ${
          isDark ? "bg-[#000000]" : "bg-white"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />

      {textEdit && (
        <input
          ref={inputRef}
          value={textEdit.value}
          onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
          onBlur={() => commitText(textEdit.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText(textEdit.value);
            if (e.key === "Escape") setTextEdit(null);
          }}
          style={{
            position: "absolute",
            left: textEdit.x,
            top: textEdit.y - fontSize,
            fontFamily,
            fontSize,
            background: isDark ? "rgba(0, 0, 0, 1)" : "rgba(255,255,255,0.9)",
            color: isDark ? "#ffffff" : color || "#000000",
            outline: "none",
            border: "1px solid rgba(203,213,225,1)",
            padding: "2px 4px",
            zIndex: 10,
            minWidth: 120,
          }}
        />
      )}
    </div>
  );
}
