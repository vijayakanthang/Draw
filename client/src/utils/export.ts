import rough from "roughjs";
import type { Shape } from "../types/shapes";

export const exportCanvasAsPNG = (canvas: HTMLCanvasElement) => {
  const link = document.createElement("a");
  link.download = `whiteboard-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

export const exportCanvasAsSVG = (shapes: Shape[], isDark: boolean) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "2000");
  svg.setAttribute("height", "2000");
  const rc = rough.svg(svg);

  shapes.forEach(s => {
    const options = {
      stroke: s.color || (isDark ? "#fff" : "#000"),
      strokeWidth: s.strokeWidth || 2,
      roughness: s.roughness ?? 1,
      seed: s.seed
    };

    if (s.type === "rectangle") {
      const rx = Math.min(s.start!.x, s.end!.x);
      const ry = Math.min(s.start!.y, s.end!.y);
      const rw = Math.abs(s.start!.x - s.end!.x);
      const rh = Math.abs(s.start!.y - s.end!.y);
      svg.appendChild(rc.rectangle(rx, ry, rw, rh, options));
    } else if (s.type === "circle") {
       const r = Math.hypot(s.end!.x - s.start!.x, s.end!.y - s.start!.y);
       svg.appendChild(rc.circle(s.start!.x, s.start!.y, r * 2, options));
    } else if (s.type === "pencil" && s.path) {
      svg.appendChild(rc.linearPath(s.path.map(p => [p.x, p.y] as [number, number]), options));
    } else if (s.type === "sticky") {
      svg.appendChild(rc.rectangle(s.x || 0, s.y || 0, 150, 150, { ...options, fill: s.color || "#fbbf24", fillStyle: "solid" }));
    }
  });

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.download = `whiteboard-${Date.now()}.svg`;
  link.href = url;
  link.click();
};
