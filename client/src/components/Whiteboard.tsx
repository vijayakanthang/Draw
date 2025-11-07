import { useMemo, useState } from "react";
import Toolbar from "./Toolbar";
import CanvasBoard from "./CanvasBoard";
import type { Shape, Tool } from "../types/shapes";

export default function Whiteboard() {
  const [selectedTool, setSelectedTool] = useState<Tool>("none");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontSize, setFontSize] = useState<number>(16);
  const [color, setColor] = useState<string>("#000000");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);

  const [pages, setPages] = useState<{ id: string; name: string; shapes: Shape[] }[]>([
    { id: crypto.randomUUID(), name: "Page 1", shapes: [] },
  ]);
  const [activePageId, setActivePageId] = useState<string>(pages[0].id);

  const activePage = useMemo(() => pages.find((p) => p.id === activePageId)!, [pages, activePageId]);

  const updateActivePageShapes = (shapes: Shape[]) => {
    setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, shapes } : p)));
  };

  const handleDeleteShape = () => {
    if (selectedShapeIndex === null) return;
    const newShapes = activePage.shapes.filter((_, idx) => idx !== selectedShapeIndex);
    updateActivePageShapes(newShapes);
    setSelectedShapeIndex(null);
  };

  const handleRotateShape = () => {
    if (selectedShapeIndex === null) return;
    const newShapes = activePage.shapes.map((shape, idx) => {
      if (idx !== selectedShapeIndex) return shape;
      // Add or update a 'rotation' property (degrees)
      const prevRotation = (shape as any).rotation || 0;
      return { ...shape, rotation: prevRotation + 15 };
    });
    updateActivePageShapes(newShapes);
  };

  return (
    <div className="flex flex-col  p-0 bg-white h-full w-full">
      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        color={color}
        setColor={setColor}
        pages={pages.map(({ id, name }) => ({ id, name }))}
        activePageId={activePageId}
        onCreatePage={() => {
          const id = crypto.randomUUID();
          setPages((prev) => [...prev, { id, name: `Page ${prev.length + 1}`, shapes: [] }]);
          setActivePageId(id);
        }}
        onRenamePage={(id: string, name: string) => setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))}
        onSelectPage={(id: string) => setActivePageId(id)}
        isDark={isDark}
        onToggleDark={(value: boolean) => {
          setIsDark(value);
          // set default drawing color depending on theme
          setColor(value ? "#ffffff" : "#000000");
          document.body.style.backgroundColor = value ? "#0f172a" : "#f8fafc";
        }}
        canDelete={selectedShapeIndex !== null}
        onDelete={handleDeleteShape}
        canRotate={selectedShapeIndex !== null}
        onRotate={handleRotateShape}
      />

      <CanvasBoard
        selectedTool={selectedTool}
        fontFamily={fontFamily}
        fontSize={fontSize}
        color={color}
        shapes={activePage.shapes}
        onShapesChange={updateActivePageShapes}
        isDark={isDark}
        selectedShapeIndex={selectedShapeIndex}
        onSelectShape={setSelectedShapeIndex}
      />
    </div>
  );
}
