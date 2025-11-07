import type { Tool } from "../types/shapes";

interface ToolbarProps {
  selectedTool: Tool;
  onSelectTool: (tool: Tool) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  color: string;
  setColor: (color: string) => void;
  pages: { id: string; name: string }[];
  activePageId: string;
  onCreatePage: () => void;
  onRenamePage: (id: string, name: string) => void;
  onSelectPage: (id: string) => void;
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
  canDelete: boolean;
  onDelete: () => void;
  canRotate: boolean;
  onRotate: () => void;
}

const tools: Tool[] = ["pencil", "line", "circle", "arrow", "rectangle"];
const toolIcon: Record<Tool, string> = {
  pencil: "✏️",
  line: "／",
  circle: "◯",
  arrow: "➤",
  rectangle: "▭",
  text: "T",
  none: "",
};

export default function Toolbar({
  selectedTool,
  onSelectTool,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  color,
  setColor,
  pages,
  activePageId,
  onCreatePage,
  onRenamePage,
  onSelectPage,
  isDark,
  onToggleDark,
}: ToolbarProps) {
  const fonts = ["Arial", "Roboto", "Courier New", "Times New Roman", "Verdana"];

  return (
    <div
      id="toolbar"
      className={`flex flex-wrap gap-2 p-2 rounded-none border-b items-center sticky top-0 z-10 w-full transition-all duration-300 backdrop-blur-md ${
        isDark
          ? "bg-[#111827]/80 text-[#EDEDED] border-[#1f2937]"
          : "bg-[#FFFFFF]/80 text-[#111111] border-[#E5E7EB]"
      }`}
      style={{
        boxShadow: isDark
          ? "0 0 25px rgba(59,130,246,0.25)"
          : "0 0 15px rgba(59,130,246,0.15)",
      }}
    >
      {/* ➕ Page Controls */}
      <button
        onClick={onCreatePage}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-3 py-1 rounded-md font-semibold shadow-md transition"
        title="Create new page"
      >
        +
      </button>

      <input
        className={`px-3 py-1 rounded-md border text-sm shadow-sm w-40 sm:w-56 transition-colors duration-300 ${
          isDark
            ? "bg-[#1E293B] text-[#EDEDED] border-[#334155]"
            : "bg-[#F9FAFB] text-[#111111] border-[#E5E7EB]"
        }`}
        value={pages.find((p) => p.id === activePageId)?.name || "Untitled"}
        onChange={(e) => onRenamePage(activePageId, e.target.value)}
      />

      {/* ✏️ Drawing Tools */}
      <div className="flex gap-1">
        {tools.map((tool) => (
          <button
            key={tool}
            onClick={() => onSelectTool(tool)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors shadow-sm ${
              selectedTool === tool
                ? "bg-blue-600 text-white"
                : isDark
                ? "bg-[#1E293B] hover:bg-[#334155] text-[#EDEDED]"
                : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111]"
            }`}
          >
            {toolIcon[tool]}
          </button>
        ))}
      </div>

      {/* 🔤 Text Controls */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => onSelectTool("text")}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors shadow-sm ${
            selectedTool === "text"
              ? "bg-blue-600 text-white"
              : isDark
              ? "bg-[#1E293B] hover:bg-[#334155] text-[#EDEDED]"
              : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111]"
          }`}
        >
          T
        </button>

        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className={`px-2 py-1 rounded-md border text-sm transition-colors shadow-sm ${
            isDark
              ? "bg-[#1E293B] text-[#EDEDED] border-[#334155]"
              : "bg-[#FFFFFF] text-[#111111] border-[#E5E7EB]"
          }`}
        >
          {fonts.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
          min={8}
          max={72}
          className={`w-16 px-2 py-1 rounded-md border text-sm shadow-sm ${
            isDark
              ? "bg-[#1E293B] text-[#EDEDED] border-[#334155]"
              : "bg-[#FFFFFF] text-[#111111] border-[#E5E7EB]"
          }`}
        />
      </div>

      {/* 🎨 Color Picker */}
      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full border"
          style={{
            backgroundColor: color,
            borderColor: isDark ? "#334155" : "#E5E7EB",
          }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 border rounded-md cursor-pointer shadow-sm"
          style={{
            borderColor: isDark ? "#334155" : "#E5E7EB",
          }}
        />
      </div>
    <p className="ml-2 text-xs opacity-70">
        ⌫ Use <b>Backspace</b> or <b>Delete</b> to remove a shape
      </p>

      {/* 🧭 Page Tabs */}
      <div className="ml-auto hidden md:flex gap-2 overflow-x-auto">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPage(p.id)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition shadow-sm ${
              activePageId === p.id
                ? "bg-blue-600 text-white"
                : isDark
                ? "bg-[#1E293B] hover:bg-[#334155] text-[#EDEDED]"
                : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111]"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 🌓 Theme Toggle */}
      <button
        onClick={() => onToggleDark(!isDark)}
        className={`px-3 py-1 rounded-md border text-sm transition shadow-sm ${
          isDark
            ? "bg-[#1E293B] text-[#EDEDED] border-[#334155] hover:bg-[#334155]"
            : "bg-[#FFFFFF] text-[#111111] border-[#E5E7EB] hover:bg-[#F3F4F6]"
        }`}
      >
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </button>

    </div>
  );
}
