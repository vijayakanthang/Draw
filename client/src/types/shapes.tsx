export type Tool =
  | "pencil"
  | "line"
  | "circle"
  | "arrow"
  | "rectangle"
  | "text"
  | "sticky"
  | "comment"
  | "eraser"
  | "select"
  | "image"
  | "laser"
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

export type FillStyle = "solid" | "hachure" | "zigzag" | "cross-hatch" | "dots" | "sunburst" | "dashed" | "zigzag-line";

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
  fillColor?: string;
  fillStyle?: FillStyle;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  seed: number;
  strokeWidth?: number;
  opacity?: number;
  roughness?: number;
  comments?: Comment[];
  anchoredStartId?: string;
  anchoredEndId?: string;
  audioUrl?: string;
  imageUrl?: string;
  isLocked?: boolean;
}
