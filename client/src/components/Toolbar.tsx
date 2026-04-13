import type { Tool } from "../types/shapes";
import type { ConnectionStatus } from "../hooks/useSocket";
import {
  CursorIcon, PencilIcon, LineIcon, RectIcon, CircleIcon,
  TextIcon, StickyIcon, TrashIcon, UndoIcon, RedoIcon,
  ImageIcon, PaintIcon, PencilLineIcon, ArrowUpRightIcon,
  PresentationIcon, LibraryIcon, ShareIcon, HomeIcon,
  MessageCircleIcon, TimerIcon, WifiIcon, WifiOffIcon,
  EraserIcon, SunIcon, MoonIcon, DownloadIcon
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
}

const mainTools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <CursorIcon />, label: "Select (V)" },
  { id: "pencil", icon: <PencilIcon />, label: "Pencil (P)" },
  { id: "line", icon: <LineIcon />, label: "Line (L)" },
  { id: "arrow", icon: <ArrowUpRightIcon />, label: "Arrow (A)" },
  { id: "rectangle", icon: <RectIcon />, label: "Rectangle (R)" },
  { id: "circle", icon: <CircleIcon />, label: "Circle (O)" },
  { id: "text", icon: <TextIcon />, label: "Text (T)" },
  { id: "sticky", icon: <StickyIcon />, label: "Sticky (S)" },
  { id: "comment", icon: <MessageCircleIcon />, label: "Comment (C)" },
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
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 p-1 ${glassClass} rounded-2xl shadow-2xl transition-all duration-500 max-w-[95vw] ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
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

        <div className="flex items-center gap-0.5 overflow-x-auto mobile-scroll-x scroll-smooth px-1">
          {mainTools.map((t) => (
            <button
              key={t.id}
              onClick={() => props.onSelectTool(t.id)}
              title={t.label}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${props.selectedTool === t.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : `hover:bg-black/5 ${textClass}`
                }`}
            >
              <div className="scale-90">{t.icon}</div>
            </button>
          ))}
        </div>

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
      <div className={`fixed top-4 right-4 z-[70] flex items-center gap-1.5 p-1 ${glassClass} rounded-2xl transition-all duration-500 mobile-hide ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
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
            <div className={`absolute top-12 right-0 w-40 p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100] ${isDark ? 'bg-slate-900/95 backdrop-blur-xl border border-white/10' : 'bg-white border border-slate-200'}`}>
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

      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 transition-all duration-500 max-w-[95vw] ${isPresenting ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}>
        {/* Page Navigator */}
        <div className={`flex items-center gap-1.5 p-1 ${glassClass} rounded-2xl`}>
          <select
            value={props.activePageId}
            onChange={(e) => props.onSelectPage(e.target.value)}
            className={`bg-transparent text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-slate-400'} outline-none border-none py-1 px-2 cursor-pointer hover:text-white transition-colors`}
          >
            {props.pages.map(p => <option key={p.id} value={p.id} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>{p.name}</option>)}
          </select>
          <button onClick={props.onCreatePage} className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/8 hover:bg-white/15' : 'bg-slate-200 hover:bg-slate-300'} transition-all`}>+</button>
        </div>

        {/* Action Menu */}
        <div className={`flex items-center gap-1 p-1 ${glassClass} rounded-2xl shadow-2xl`}>
          <div className="flex items-center gap-0.5 overflow-x-auto mobile-scroll-x">
            <button onClick={props.onUndo} disabled={!props.canUndo} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDark ? 'text-white/40' : 'text-slate-400'} disabled:opacity-20 transition-colors`}><UndoIcon /></button>
            <button onClick={props.onRedo} disabled={!props.canRedo} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDark ? 'text-white/40' : 'text-slate-400'} disabled:opacity-20 transition-colors`}><RedoIcon /></button>

            <div className={`w-[1px] h-5 ${borderClass} mx-1 flex-shrink-0`} />

            <div className="relative p-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: props.color }} />
              <input type="color" value={props.color} onChange={(e) => props.setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <button onClick={props.onDelete} disabled={!props.canDelete} className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500/50 disabled:opacity-20 transition-colors"><TrashIcon /></button>
            <button onClick={props.onToggleLibrary} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showLibrary ? "bg-indigo-500/20 text-indigo-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><LibraryIcon /></button>

            <div className={`w-[1px] h-5 ${borderClass} mx-1 flex-shrink-0`} />

            <button onClick={props.onToggleTimeline} className={`w-10 h-10 flex items-center justify-center rounded-xl ${props.showTimeline ? "bg-blue-500/20 text-blue-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><TimerIcon /></button>
            <button onClick={() => props.onToggleHandDrawn(!props.handDrawn)} className={`w-10 h-10 flex items-center justify-center rounded-xl ${props.handDrawn ? "bg-amber-400/20 text-amber-500" : `${isDark ? 'text-white/40' : 'text-slate-400'}`}`}><PencilLineIcon /></button>
            <button onClick={props.onTogglePresentation} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDark ? 'text-white/40' : 'text-slate-400'} transition-all hover:bg-black/5 mobile-hide`}><PresentationIcon /></button>
          </div>
        </div>
      </div>
    </>
  );
}
