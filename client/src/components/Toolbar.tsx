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
  const { isPresenting, connectionStatus } = props;
  const statusInfo = statusConfig[connectionStatus];

  return (
    <>
      {/* 1. Main Tools & Collaboration (Top Center) */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-1.5 glass-strong rounded-2xl shadow-2xl transition-all duration-500 ${isPresenting ? "-translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        {/* Home Button */}
        <button
          onClick={props.onGoHome}
          title="Back to Dashboard"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
        >
          <HomeIcon />
        </button>

        <div className="w-[1px] h-6 bg-white/8" />

        <div className="flex items-center gap-0.5">
          {mainTools.map((t) => (
            <button
              key={t.id}
              onClick={() => props.onSelectTool(t.id)}
              title={t.label}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                props.selectedTool === t.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "hover:bg-white/8 text-white/50 hover:text-white"
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>
        
        <div className="w-[1px] h-6 bg-white/8" />
        
        <button 
          onClick={props.onShare} 
          className="px-4 h-10 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
        >
          <ShareIcon /> 
          Invite
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      </div>

      {/* 2. Top Right — Export + Connection Status */}
      <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 p-1.5 glass-strong rounded-2xl transition-all duration-500 ${isPresenting ? "-translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-2 py-1" title={statusInfo.label}>
          {connectionStatus === "connected" ? (
            <WifiIcon className="text-emerald-400" />
          ) : (
            <WifiOffIcon className={connectionStatus === "disconnected" ? "text-red-400" : "text-amber-400"} />
          )}
          <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
        </div>

        <div className="w-[1px] h-5 bg-white/8" />

        <button onClick={props.onExportPNG} title="Export PNG" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/50 hover:text-white transition-all"><ImageIcon /></button>
        <button onClick={props.onExportSVG} title="Export SVG" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/50 hover:text-white transition-all"><PaintIcon /></button>
      </div>

      {/* 3. Page Navigator (Bottom Left) */}
      <div className={`fixed bottom-5 left-5 z-50 flex items-center gap-2 p-1.5 glass-strong rounded-2xl transition-all duration-500 ${isPresenting ? "translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <select 
          value={props.activePageId} 
          onChange={(e) => props.onSelectPage(e.target.value)} 
          className="bg-transparent text-sm font-bold text-white/60 outline-none border-none py-1 px-2 cursor-pointer hover:text-white transition-colors"
        >
          {props.pages.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
        </select>
        <button onClick={props.onCreatePage} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-white font-bold transition-all hover:scale-110 active:scale-95">+</button>
      </div>

      {/* 4. Action Menu & Settings (Bottom Center) */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 glass-strong rounded-2xl shadow-2xl transition-all duration-500 ${isPresenting ? "translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <div className="flex items-center gap-0.5 border-r border-white/8 pr-1.5">
          <button onClick={props.onUndo} disabled={!props.canUndo} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canUndo ? "text-white/50 hover:text-white hover:bg-white/8" : "text-white/15 cursor-not-allowed"}`}><UndoIcon /></button>
          <button onClick={props.onRedo} disabled={!props.canRedo} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canRedo ? "text-white/50 hover:text-white hover:bg-white/8" : "text-white/15 cursor-not-allowed"}`}><RedoIcon /></button>
        </div>
        
        <div className="flex items-center gap-0.5 px-1 border-r border-white/8">
          <div className="relative group p-1">
             <div className="w-8 h-8 rounded-full border-2 border-white/15 shadow-inner cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: props.color }} />
             <input type="color" value={props.color} onChange={(e) => props.setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" title="Select Color" />
          </div>
          <button onClick={props.onDelete} disabled={!props.canDelete} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canDelete ? "text-red-400 hover:bg-red-500/10" : "text-white/15 cursor-not-allowed"}`}><TrashIcon /></button>
          <button onClick={props.onToggleLibrary} title="Template Library" className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showLibrary ? "bg-indigo-500/20 text-indigo-400" : "text-white/50 hover:bg-white/8 hover:text-white"}`}><LibraryIcon /></button>
          <button onClick={props.onToggleTimeline} title={props.showTimeline ? "Hide Timeline" : "Show Timeline"} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showTimeline ? "bg-blue-500/20 text-blue-400" : "text-white/50 hover:bg-white/8 hover:text-white"}`}><TimerIcon /></button>
        </div>

        <div className="flex items-center gap-0.5 pl-1">
          <button onClick={() => props.onToggleHandDrawn(!props.handDrawn)} title="Hand-drawn style (Rough.js)" className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.handDrawn ? "bg-amber-400/20 text-amber-400 shadow-inner" : "text-white/50 hover:bg-white/8 hover:text-white"}`}><PencilLineIcon /></button>
          <button onClick={props.onTogglePresentation} title="Presentation Mode" className="w-10 h-10 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all"><PresentationIcon /></button>
        </div>
      </div>
    </>
  );
}
