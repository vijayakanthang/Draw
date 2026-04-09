export type Tool =
  | "pencil"
  | "line"
  | "circle"
  | "arrow"
  | "rectangle"
  | "text"
  | "sticky"
  | "comment"
  | "select"
  | "none";

export interface Point {
  x: number;
  y: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Shape {
  id: string;
  type: Tool;
  start?: Point;
  end?: Point;
  path?: Point[];
  rotation?: number;
  width?: number;
  height?: number;
  text?: string;
  x?: number;
  y?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  seed: number;
  strokeWidth?: number;
  opacity?: number;
  roughness?: number;
  comments?: Comment[];
  anchoredStartId?: string;
  anchoredEndId?: string;
  audioUrl?: string;
}
