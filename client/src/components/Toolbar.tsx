import type { Tool } from "../types/shapes";
import type { ConnectionStatus } from "../hooks/useSocket";
import {
  CursorIcon, PencilIcon, LineIcon, RectIcon, CircleIcon,
  TextIcon, StickyIcon, TrashIcon, UndoIcon, RedoIcon,
  ImageIcon, PaintIcon, PencilLineIcon, ArrowUpRightIcon,
  PresentationIcon, LibraryIcon, ShareIcon, HomeIcon,
  MessageCircleIcon, TimerIcon, WifiIcon, WifiOffIcon
} from "./Icons";

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
];

const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: "bg-emerald-500", label: "Connected" },
  connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting..." },
  reconnecting: { color: "bg-amber-500 animate-pulse", label: "Reconnecting..." },
  disconnected: { color: "bg-red-500", label: "Disconnected" },
};

export default function Toolbar(props: ToolbarProps) {
  const { isPresenting, connectionStatus, isSidebarOpen } = props;
  const statusInfo = statusConfig[connectionStatus];

  return (
    <>
      {/* 1. Main Tools & Collaboration (Top Center) */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1 glass-strong rounded-2xl shadow-2xl transition-all duration-500 max-w-[95vw] ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } ${isSidebarOpen ? "md:left-[calc(50%-150px)]" : "md:left-1/2"
        }`}>
        {/* Home Button */}
        <button
          onClick={props.onGoHome}
          title="Back to Dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all flex-shrink-0"
        >
          <HomeIcon />
        </button>

        <div className="w-[1px] h-6 bg-white/8 flex-shrink-0" />

        <div className="flex items-center gap-0.5 overflow-x-auto mobile-scroll-x scroll-smooth px-1">
          {mainTools.map((t) => (
            <button
              key={t.id}
              onClick={() => props.onSelectTool(t.id)}
              title={t.label}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${props.selectedTool === t.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "hover:bg-white/8 text-white/50 hover:text-white"
                }`}
            >
              <div className="scale-90">{t.icon}</div>
            </button>
          ))}
        </div>

        <div className="w-[1px] h-6 bg-white/8 flex-shrink-0" />

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
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 p-1 glass-strong rounded-2xl transition-all duration-500 mobile-hide ${isPresenting ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <div className="flex items-center gap-2 px-1.5 py-1" title={statusInfo.label}>
          {connectionStatus === "connected" ? (
            <WifiIcon className="text-emerald-400" size={18} />
          ) : (
            <WifiOffIcon className={connectionStatus === "disconnected" ? "text-red-400" : "text-amber-400"} size={18} />
          )}
        </div>
        <div className="w-[1px] h-4 bg-white/8" />
        <div className="flex items-center gap-1">
          <button onClick={props.onExportPNG} title="Export PNG" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><ImageIcon /></button>
          <button onClick={props.onExportSVG} title="Export SVG" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><PaintIcon /></button>
        </div>
      </div>

      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col md:flex-row items-center gap-3 transition-all duration-500 max-w-[95vw] ${isPresenting ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}>
        {/* Page Navigator */}
        <div className="flex items-center gap-1.5 p-1 glass-strong rounded-2xl">
          <select
            value={props.activePageId}
            onChange={(e) => props.onSelectPage(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/50 outline-none border-none py-1 px-2 cursor-pointer hover:text-white transition-colors"
          >
            {props.pages.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
          </select>
          <button onClick={props.onCreatePage} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold transition-all">+</button>
        </div>

        {/* Action Menu */}
        <div className="flex items-center gap-1 p-1 glass-strong rounded-2xl shadow-2xl">
          <div className="flex items-center gap-0.5 overflow-x-auto mobile-scroll-x">
            <button onClick={props.onUndo} disabled={!props.canUndo} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 disabled:opacity-20 transition-colors"><UndoIcon /></button>
            <button onClick={props.onRedo} disabled={!props.canRedo} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 disabled:opacity-20 transition-colors"><RedoIcon /></button>

            <div className="w-[1px] h-5 bg-white/8 mx-1 flex-shrink-0" />

            <div className="relative p-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: props.color }} />
              <input type="color" value={props.color} onChange={(e) => props.setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <button onClick={props.onDelete} disabled={!props.canDelete} className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500/50 disabled:opacity-20 transition-colors"><TrashIcon /></button>
            <button onClick={props.onToggleLibrary} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showLibrary ? "bg-indigo-500/20 text-indigo-400" : "text-white/40"}`}><LibraryIcon /></button>

            <div className="w-[1px] h-5 bg-white/8 mx-1 flex-shrink-0" />

            <button onClick={props.onToggleTimeline} className={`w-10 h-10 flex items-center justify-center rounded-xl ${props.showTimeline ? "bg-blue-500/20 text-blue-400" : "text-white/40"}`}><TimerIcon /></button>
            <button onClick={() => props.onToggleHandDrawn(!props.handDrawn)} className={`w-10 h-10 flex items-center justify-center rounded-xl ${props.handDrawn ? "bg-amber-400/20 text-amber-400" : "text-white/40"}`}><PencilLineIcon /></button>
            <button onClick={props.onTogglePresentation} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 mobile-hide"><PresentationIcon /></button>
            <div className="w-[1px] h-5 bg-white/8 mx-1 flex-shrink-0 md:hidden" />
            <button onClick={props.onExportPNG} title="Export PNG" className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 md:hidden"><ImageIcon /></button>
            <button onClick={props.onExportSVG} title="Export SVG" className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 md:hidden"><PaintIcon /></button>
          </div>
        </div>
      </div>
    </>
  );
}
