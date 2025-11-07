import { useState, useEffect } from "react";
import { Shape } from "../types/shapes";

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>(() => {
    const stored = localStorage.getItem("shapes");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("shapes", JSON.stringify(shapes));
  }, [shapes]);

  const addShape = (shape: Shape) => setShapes((prev) => [...prev, shape]);

  const updateShape = (id: string, updated: Partial<Shape>) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
  };

  return { shapes, addShape, updateShape, deleteShape };
}
