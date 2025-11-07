export type Tool =
  | "pencil"
  | "line"
  | "circle"
  | "arrow"
  | "rectangle"
  | "text"
  | "none";

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: Tool;
  start?: Point;
  end?: Point;
  path?: Point[]; // For pencil
  isSelected?: boolean;
  rotation?: number; // degrees
  width?: number;
  height?: number;

  // For text shapes
  text?: string;
  x?: number;
  y?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}
