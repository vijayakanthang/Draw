import type { Tool, FillStyle } from "../types/shapes.tsx";
import type { ConnectionStatus } from "../hooks/useSocket";
import {
  CursorIcon, PencilIcon, LineIcon, RectIcon, CircleIcon,
  TextIcon, StickyIcon, TrashIcon, UndoIcon, RedoIcon,
  ImageIcon, PaintIcon, PencilLineIcon, ArrowUpRightIcon,
  PresentationIcon, LibraryIcon, ShareIcon, HomeIcon,
  MessageCircleIcon, TimerIcon, WifiIcon, WifiOffIcon,
  EraserIcon, SunIcon, MoonIcon, DownloadIcon,
  GridIcon, BoldIcon, ItalicIcon, UnderlineIcon, SearchIcon, SparklesIcon
} from "./Icons";
import { useState, useRef, useEffect } from "react";

interface ToolbarProps {
  selectedTool: Tool;
  onSelectTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  pages: { id: string; name: string }[];
  activePageId: string;
  onCreatePage: () => void;
  onSelectPage: (id: string) => void;
  handDrawn: boolean;
  onToggleHandDrawn: (value: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canDelete: boolean;
  onDelete: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  isPresenting: boolean;
  onTogglePresentation: () => void;
  showLibrary: boolean;
  onToggleLibrary: () => void;
  onShare: () => void;
  showTimeline: boolean;
  onToggleTimeline: () => void;
  onGoHome: () => void;
  connectionStatus: ConnectionStatus;
  isSidebarOpen?: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  eraserSize: number;
  setEraserSize: (s: number) => void;
  gridSnap: boolean;
  setGridSnap: (v: boolean) => void;
  fillColor: string;
  setFillColor: (c: string) => void;
  fillStyle: FillStyle;
  setFillStyle: (s: FillStyle) => void;
  bold: boolean;
  setBold: (v: boolean) => void;
  italic: boolean;
  setItalic: (v: boolean) => void;
  underline: boolean;
  setUnderline: (v: boolean) => void;
  onToggleAI: () => void;
  onToggleSearch: () => void;
  roomName: string;
  onRename: (name: string) => void;
  isSaving: boolean;
}

const fonts = [
  { id: "Inter, sans-serif", name: "Inter" },
  { id: "'Instrument Serif', serif", name: "Instrument" },
  { id: "'Space Mono', monospace", name: "Space Mono" },
  { id: "'Caveat', cursive", name: "Caveat" },
];

const mainTools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <CursorIcon />, label: "Select (V)" },
  { id: "pencil", icon: <PencilIcon />, label: "Pencil (P)" },
  { id: "line", icon: <LineIcon />, label: "Line (L)" },
  { id: "arrow", icon: <ArrowUpRightIcon />, label: "Arrow (A)" },
  { id: "rectangle", icon: <RectIcon />, label: "Rectangle (R)" },
  { id: "circle", icon: <CircleIcon />, label: "Circle (O)" },
  { id: "text", icon: <TextIcon />, label: "Text (T)" },
  { id: "sticky", icon: <StickyIcon />, label: "Sticky (S)" },
  { id: "image", icon: <ImageIcon />, label: "Image (I)" },
  { id: "comment", icon: <MessageCircleIcon />, label: "Comment (C)" },
  { id: "laser", icon: <SparklesIcon />, label: "Laser (L)" },
  { id: "eraser", icon: <EraserIcon />, label: "Eraser (E)" },
];

const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: "bg-emerald-500", label: "Connected" },
  connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting..." },
  reconnecting: { color: "bg-amber-500 animate-pulse", label: "Reconnecting..." },
  disconnected: { color: "bg-red-500", label: "Disconnected" },
};

export default function Toolbar(props: ToolbarProps) {
  const { isPresenting, connectionStatus, isSidebarOpen, theme } = props;
  const statusInfo = statusConfig[connectionStatus];
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDark = theme === "dark";
  const glassClass = isDark ? "glass-strong" : "bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl";
  const textClass = isDark ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-900";
  const borderClass = isDark ? "bg-white/8" : "bg-slate-200";

  return (
    <>
      {/* 1. Main Tools & Collaboration (Top Center) */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 p-1 ${glassClass} rounded-2xl shadow-2xl flex-shrink-0 transition-all duration-500 max-w-[95vw] ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } ${isSidebarOpen ? "md:left-[calc(50%-150px)]" : "md:left-1/2"
        }`}>
        <button
          onClick={props.onGoHome}
          title="Back to Dashboard"
          className={`w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 ${textClass} transition-all flex-shrink-0`}
        >
          <HomeIcon />
        </button>

        <div className={`w-[1px] h-6 ${borderClass} flex-shrink-0`} />

        <div className="flex items-center px-3 flex-shrink-0">
            <input 
                type="text" 
                value={props.roomName} 
                onChange={(e) => props.onRename(e.target.value)}
                placeholder="Untitled Board"
                className={`bg-transparent text-[11px] font-black uppercase tracking-wider outline-none border-none max-w-[120px] truncate ${isDark ? "text-white/60 focus:text-white" : "text-slate-500 focus:text-slate-900"}`}
            />
        </div>

        <div className={`w-[1px] h-6 ${borderClass} flex-shrink-0`} />

        {/* Tool buttons — horizontal scroll only, no vertical leak */}
        <div
          className="flex items-center gap-0.5 px-1"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",          /* Firefox */
            msOverflowStyle: "none",         /* IE/Edge */
          }}
        >
          {mainTools.map((t) => (
            <div key={t.id} className="relative group flex-shrink-0">
              <button
                onClick={() => props.onSelectTool(t.id)}
                title={t.label}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${props.selectedTool === t.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : `hover:bg-black/5 ${textClass}`
                  }`}
              >
                <div className="scale-90">{t.icon}</div>
              </button>
            </div>
          ))}
        </div>

        {/* Property Popover — rendered OUTSIDE the overflow-hidden scroll container */}
        {mainTools.map((t) =>
          props.selectedTool === t.id && t.id !== "none" && t.id !== "select" && t.id !== "comment" && t.id !== "laser" && (
            <div key={`popover-${t.id}`} className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[100] animate-zoom-in">
              <div className={`flex flex-col gap-3 p-4 ${glassClass} rounded-2xl shadow-2xl min-w-[200px] border border-white/10`}>
                <div className="flex items-center justify-between gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                    {t.id === "eraser" ? "Size" : "Stroke"}
                  </span>
                  <div className="flex bg-black/5 rounded-lg p-0.5">
                    {[
                      { val: t.id === "eraser" ? 10 : 1, label: "T" },
                      { val: t.id === "eraser" ? 20 : 3, label: "M" },
                      { val: t.id === "eraser" ? 40 : 6, label: "B" }
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => {
                          if (t.id === "eraser") props.setEraserSize(s.val);
                          else props.setStrokeWidth(s.val);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                          (t.id === "eraser" ? props.eraserSize === s.val : props.strokeWidth === s.val)
                            ? "bg-white shadow-sm text-blue-600"
                            : `${textClass} hover:bg-white/10`
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {t.id !== "eraser" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Opacity</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" min="0.1" max="1" step="0.1" 
                        value={props.opacity} 
                        onChange={(e) => props.setOpacity(parseFloat(e.target.value))}
                        className="w-20 h-1.5 rounded-full accent-blue-600 cursor-pointer"
                      />
                      <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{Math.round(props.opacity * 100)}%</span>
                    </div>
                  </div>
                )}

                {t.id === "text" && (
                  <>
                    <div className={`h-[1px] w-full ${borderClass}`} />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Style</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => props.setBold(!props.bold)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${props.bold ? "bg-blue-600 text-white" : `hover:bg-black/5 ${textClass}`}`}><BoldIcon /></button>
                        <button onClick={() => props.setItalic(!props.italic)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${props.italic ? "bg-blue-600 text-white" : `hover:bg-black/5 ${textClass}`}`}><ItalicIcon /></button>
                        <button onClick={() => props.setUnderline(!props.underline)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${props.underline ? "bg-blue-600 text-white" : `hover:bg-black/5 ${textClass}`}`}><UnderlineIcon /></button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Font</span>
                       <select value={props.fontFamily} onChange={(e) => props.setFontFamily(e.target.value)} className={`bg-white/5 p-2 rounded-xl text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-slate-700'} outline-none border border-white/10 cursor-pointer`}>
                         {fonts.map(f => <option key={f.id} value={f.id} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>{f.name}</option>)}
                       </select>
                    </div>
                  </>
                )}

                {(t.id === "rectangle" || t.id === "circle" || t.id === "sticky") && (
                  <>
                    <div className={`h-[1px] w-full ${borderClass}`} />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Fill Color</span>
                      <div className="relative w-8 h-8 rounded-full border border-black/10 overflow-hidden shadow-inner" style={{ backgroundColor: props.fillColor || "transparent" }}>
                        {!props.fillColor && <div className="absolute inset-0 bg-white/20 -rotate-45" />}
                        <input type="color" value={props.fillColor || "#ffffff"} onChange={(e) => props.setFillColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Fill Style</span>
                       <select value={props.fillStyle} onChange={(e) => props.setFillStyle(e.target.value as FillStyle)} className={`bg-white/5 p-2 rounded-xl text-[10px] font-bold ${isDark ? 'text-white/70' : 'text-slate-700'} outline-none border border-white/10 cursor-pointer`}>
                          <option value="hachure">Hachure</option>
                          <option value="solid">Solid</option>
                          <option value="zigzag">Zigzag</option>
                          <option value="cross-hatch">Cross-hatch</option>
                          <option value="dots">Dots</option>
                       </select>
                    </div>
                  </>
                )}
              </div>
              {/* Arrow pointing up into the toolbar */}
              <div className={`absolute top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-white/10`} style={{ backgroundColor: isDark ? '#0a0e1a' : '#ffffff' }} />
            </div>
          )
        )}

        <div className={`w-[1px] h-6 ${borderClass} flex-shrink-0`} />

        <button
          onClick={props.onShare}
          className="px-3 h-9 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex-shrink-0"
        >
          <ShareIcon />
          <span className="mobile-hide">Invite</span>
          <span className={`w-2 h-2 rounded-full animate-pulse md:hidden ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-amber-400"}`} />
        </button>
      </div>

      {/* 2. Top Right — Export + Connection Status (Mobile: hidden or moved) */}
      <div className={`fixed top-4 right-4 z-[70] flex items-center gap-1.5 p-1 ${glassClass} rounded-2xl transition-all duration-500 mobile-hide flex-shrink-0 ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <button 
          onClick={props.onToggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className={`w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 ${textClass} transition-all`}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
        <div className={`w-[1px] h-4 ${borderClass}`} />
        <div className="flex items-center gap-2 px-1.5 py-1" title={statusInfo.label}>
          {connectionStatus === "connected" ? (
            <WifiIcon className="text-emerald-500" size={18} />
          ) : (
            <WifiOffIcon className={connectionStatus === "disconnected" ? "text-red-500" : "text-amber-500"} size={18} />
          )}
          
          <div className="w-[1px] h-3 bg-black/5 mx-1" />
          
          {props.isSaving ? (
            <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500 animate-pulse">Saving</span>
          ) : (
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isDark ? "text-white/20" : "text-slate-300"}`}>Saved</span>
          )}
        </div>
        <div className={`w-[1px] h-4 ${borderClass}`} />
        <div className="relative" ref={exportRef}>
          <button 
            onClick={() => setShowExportOptions(!showExportOptions)} 
            title="Download / Export" 
            className={`w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 ${textClass} transition-colors`}
          >
            <DownloadIcon />
          </button>
          
          {showExportOptions && (
            <div className={`absolute top-12 right-0 w-40 p-2 rounded-2xl shadow-2xl animate-zoom-in z-[100] ${isDark ? 'bg-slate-900/95 backdrop-blur-xl border border-white/10' : 'bg-white border border-slate-200'}`}>
              <button 
                onClick={() => { props.onExportPNG(); setShowExportOptions(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <ImageIcon />
                <span>Export PNG</span>
              </button>
              <button 
                onClick={() => { props.onExportSVG(); setShowExportOptions(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <PaintIcon />
                <span>Export SVG</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Page Navigator (Bottom Left) */}
      <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-1.5 p-1 flex-shrink-0 ${glassClass} rounded-2xl transition-all duration-500 ${isPresenting ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <select
          value={props.activePageId}
          onChange={(e) => props.onSelectPage(e.target.value)}
          className={`bg-transparent text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-slate-400'} outline-none border-none py-1 px-2 cursor-pointer hover:text-white transition-colors`}
        >
          {props.pages.map(p => <option key={p.id} value={p.id} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>{p.name}</option>)}
        </select>
        <button onClick={props.onCreatePage} className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/8 hover:bg-white/15' : 'bg-slate-200 hover:bg-slate-300'} transition-all`}>+</button>
      </div>

      {/* 4. Action Menu (Bottom Center) */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-500 max-w-[95vw] ${isPresenting ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <div className={`flex items-center gap-1 p-1 ${glassClass} rounded-2xl shadow-2xl relative overflow-hidden`}>

          {/* Action buttons — horizontal scroll only, no vertical leak */}
          <div
            className="flex items-center gap-0.5"
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <button onClick={props.onUndo} disabled={!props.canUndo} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${isDark ? 'text-white/40' : 'text-slate-400'} disabled:opacity-20 transition-colors`}><UndoIcon /></button>
            <button onClick={props.onRedo} disabled={!props.canRedo} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${isDark ? 'text-white/40' : 'text-slate-400'} disabled:opacity-20 transition-colors`}><RedoIcon /></button>

            <div className={`w-[1px] h-5 ${borderClass} mx-1 flex-shrink-0`} />

            <div className="relative p-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: props.color }} />
              <input type="color" value={props.color} onChange={(e) => props.setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <button onClick={props.onDelete} disabled={!props.canDelete} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 text-red-500/50 disabled:opacity-20 transition-colors"><TrashIcon /></button>
            <button onClick={props.onToggleLibrary} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all ${props.showLibrary ? "bg-indigo-500/20 text-indigo-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><LibraryIcon /></button>

            <div className={`w-[1px] h-5 ${borderClass} mx-1 flex-shrink-0`} />

            <button onClick={props.onToggleTimeline} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${props.showTimeline ? "bg-blue-500/20 text-blue-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><TimerIcon /></button>
            <button onClick={() => props.setGridSnap(!props.gridSnap)} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${props.gridSnap ? "bg-blue-500/20 text-blue-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><GridIcon /></button>
            <button onClick={() => props.onToggleHandDrawn(!props.handDrawn)} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${props.handDrawn ? "bg-amber-400/20 text-amber-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><PencilLineIcon /></button>
            <button onClick={props.onTogglePresentation} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${isDark ? 'text-white/40' : 'text-slate-400'} transition-all hover:bg-black/5 mobile-hide`}><PresentationIcon /></button>
            <button onClick={props.onToggleSearch} className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${isDark ? 'text-white/40' : 'text-slate-400'} transition-all hover:bg-black/5`}><SearchIcon /></button>
          </div>
        </div>
      </div>
    </>
  );
}
