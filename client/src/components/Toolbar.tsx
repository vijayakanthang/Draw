import type { Tool } from "../types/shapes";
import { 
  CursorIcon, PencilIcon, LineIcon, RectIcon, CircleIcon, 
  TextIcon, StickyIcon, TrashIcon, UndoIcon, RedoIcon, 
  ImageIcon, PaintIcon, SunIcon, MoonIcon, PencilLineIcon,
  PresentationIcon, LibraryIcon, ShareIcon,
  MessageCircleIcon, TimerIcon
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
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
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
}

const mainTools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "select", icon: <CursorIcon />, label: "Select (V)" },
  { id: "pencil", icon: <PencilIcon />, label: "Pencil (P)" },
  { id: "line", icon: <LineIcon />, label: "Line (L)" },
  { id: "rectangle", icon: <RectIcon />, label: "Rect (R)" },
  { id: "circle", icon: <CircleIcon />, label: "Circle (O)" },
  { id: "text", icon: <TextIcon />, label: "Text (T)" },
  { id: "sticky", icon: <StickyIcon />, label: "Sticky (S)" },
  { id: "comment" as Tool, icon: <MessageCircleIcon />, label: "Comment (C)" },
];

export default function Toolbar(props: ToolbarProps) {
  const { isPresenting } = props;

  return (
    <>
      {/* 1. Main Tools & AI (Top Center) */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-2xl shadow-3xl transition-all duration-500 ${isPresenting ? "-translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="flex items-center gap-1">
          {mainTools.map((t) => (
            <button
              key={t.id}
              onClick={() => props.onSelectTool(t.id)}
              title={t.label}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                props.selectedTool === t.id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/10 text-white/60 hover:text-white"
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Right Actions (Export & Share) */}
      <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 p-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-2xl transition-all duration-500 ${isPresenting ? "-translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
        <button onClick={props.onExportPNG} title="Export PNG" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60"><ImageIcon /></button>
        <button onClick={props.onExportSVG} title="Export SVG" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60"><PaintIcon /></button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button onClick={props.onShare} title="Share Board" className="px-4 h-10 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95"><ShareIcon /> Share</button>
      </div>

      {/* 3. Page Navigator (Bottom Left) */}
      <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 p-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-2xl transition-all duration-500 ${isPresenting ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
        <select value={props.activePageId} onChange={(e) => props.onSelectPage(e.target.value)} className="bg-transparent text-sm font-bold text-white/70 outline-none border-none py-1 px-2 cursor-pointer hover:text-white">
          {props.pages.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
        </select>
        <button onClick={props.onCreatePage} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all hover:scale-110">+</button>
      </div>

      {/* 4. Action Menu & Settings (Bottom Center) */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-2xl shadow-3xl transition-all duration-500 ${isPresenting ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="flex items-center gap-1 border-r border-white/10 pr-1">
          <button onClick={props.onUndo} disabled={!props.canUndo} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canUndo ? "text-white/60 hover:text-white hover:bg-white/10" : "text-white/30 opacity-50 cursor-not-allowed disabled:pointer-events-none"}`}><UndoIcon /></button>
          <button onClick={props.onRedo} disabled={!props.canRedo} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canRedo ? "text-white/60 hover:text-white hover:bg-white/10" : "text-white/30 opacity-50 cursor-not-allowed disabled:pointer-events-none"}`}><RedoIcon /></button>
        </div>
        
        <div className="flex items-center gap-1 px-1 border-r border-white/10">
          <div className="relative group p-1">
             <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: props.color }} />
             <input type="color" value={props.color} onChange={(e) => props.setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" title="Select Color" />
          </div>
          <button onClick={props.onDelete} disabled={!props.canDelete} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.canDelete ? "text-red-500 hover:bg-red-500/10" : "text-white/30 opacity-50 cursor-not-allowed disabled:pointer-events-none"}`}><TrashIcon /></button>
          <button onClick={props.onToggleLibrary} title="Library" className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showLibrary ? "bg-indigo-500/20 text-indigo-400" : "text-white/60 hover:bg-white/10"}`}><LibraryIcon /></button>
          <button onClick={props.onToggleTimeline} title={props.showTimeline ? "Hide Timeline" : "Show Timeline"} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.showTimeline ? "bg-blue-500/20 text-blue-400" : "text-white/60 hover:bg-white/10"}`}><TimerIcon /></button>
        </div>

        <div className="flex items-center gap-1 pl-1">
          <button onClick={() => props.onToggleHandDrawn(!props.handDrawn)} title="Rough.js" className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${props.handDrawn ? "bg-amber-400/20 text-amber-400 shadow-md" : "text-white/60 hover:bg-white/10"}`}><PencilLineIcon /></button>
          <button onClick={props.onTogglePresentation} title="Presentation" className="w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"><PresentationIcon /></button>
          <button onClick={() => props.onToggleDark(!props.isDark)} title="Theme" className="w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">{props.isDark ? <SunIcon /> : <MoonIcon />}</button>
        </div>
      </div>
    </>
  );
}
