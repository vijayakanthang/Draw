import { useMemo, useState, useEffect } from "react";
import { io } from "socket.io-client";
import Toolbar from "./Toolbar";
import CanvasBoard from "./CanvasBoard";
import HistoryScrubber from "./HistoryScrubber";
import ComponentLibrary from "./ComponentLibrary";
import CommentOverlay from "./CommentOverlay";
import Dashboard from "./Dashboard";
import ShareModal from "./ShareModal";
import ParticipantSidebar from "./ParticipantSidebar";
import type { Shape, Tool } from "../types/shapes";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

export default function Whiteboard() {
  const [selectedTool, setSelectedTool] = useState<Tool>("none");
  const [color, setColor] = useState<string>("#2563eb");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [handDrawn, setHandDrawn] = useState<boolean>(true);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Board Transform State (Panned & Zoomed)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [pages, setPages] = useState<{ id: string; name: string; shapes: Shape[] }[]>([
    { id: "page-1", name: "Main Board", shapes: [] },
  ]);
  const [activePageId, setActivePageId] = useState<string>("page-1");
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; username: string }>>({});
  const [presence, setPresence] = useState<Record<string, { id: string; username: string; pageId: string; userId?: string; isOwner?: boolean }>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);

  // 1. Persistent User Identity
  const userId = useMemo(() => {
    let id = localStorage.getItem("draw-user-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("draw-user-id", id);
    }
    return id;
  }, []);

  // 2. Room ID Management with Dashboard Support
  const [roomId, setRoomId] = useState<string | null>(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      setRoomId(hash || null);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // 3. Persistent Username
  const username = useMemo(() => {
    let name = localStorage.getItem("draw-username");
    if (!name) {
      const names = ["Designer", "Architect", "Artist", "Creator", "Thinker", "Builder"];
      name = `${names[Math.floor(Math.random() * names.length)]} ${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem("draw-username", name);
    }
    return name;
  }, []);

  const isOwner = useMemo(() => {
    const me = Object.values(presence).find(u => u.userId === userId);
    return me?.isOwner || false;
  }, [presence, userId]);

  const handleToggleLock = (locked: boolean) => {
    socket.emit("toggle-room-lock", { locked });
  };

  const handleNewRoom = () => {
    const id = `room-${crypto.randomUUID().split("-")[0]}`;
    window.location.hash = id;
  };

  const activePage = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return pages.find((p) => p.id === activePageId) || pages[0];
  }, [pages, activePageId]);

  useEffect(() => {
    if (!roomId) {
      setIsDashboard(true);
      return;
    }
    setIsDashboard(false);

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "readonly") setIsReadOnly(true);

    // Join room with persistent identity
    socket.emit("join-room", { roomId, username, userId });

    socket.on("init", (data) => { 
      if (data) { 
        setPages(data.pages); 
        setActivePageId(data.activePageId); 
        setIsLocked(data.isLocked);
        if (data.users) setPresence(data.users);
      } 
    });

    socket.on("shapes-remote-update", (data) => { setPages(prev => prev.map(p => p.id === data.pageId ? { ...p, shapes: data.shapes } : p)); });
    socket.on("cursor-update", (data) => { setRemoteCursors(prev => ({ ...prev, [data.id]: { x: data.x, y: data.y, username: data.username } })); });
    socket.on("presence-update", (data) => { 
      setPresence(prev => ({ ...prev, [data.id]: data })); 
    });
    socket.on("room-lock-status", ({ locked }) => setIsLocked(locked));
    socket.on("user-disconnected", (id) => { 
      setRemoteCursors(prev => { const n = { ...prev }; delete n[id]; return n; }); 
      setPresence(prev => { const n = { ...prev }; delete n[id]; return n; }); 
    });
    
    // Track Recent Rooms
    const recent = JSON.parse(localStorage.getItem("draw-recent-rooms") || "[]");
    if (!recent.includes(roomId)) {
      localStorage.setItem("draw-recent-rooms", JSON.stringify([roomId, ...recent].slice(0, 5)));
    }

    return () => { 
      socket.off("init"); 
      socket.off("shapes-remote-update"); 
      socket.off("cursor-update"); 
      socket.off("presence-update"); 
      socket.off("user-disconnected"); 
      socket.off("room-lock-status");
      setRemoteCursors({});
      setPresence({});
    };
  }, [roomId, username, userId]);

  useEffect(() => { socket.emit("page-view-change", { pageId: activePageId }); }, [activePageId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey) { if (e.key === "z") { e.preventDefault(); handleUndo(); } else if (e.key === "y" || (e.shiftKey && e.key === "Z")) { e.preventDefault(); handleRedo(); } return; }
      if (isPresenting) { if (e.key === "ArrowRight") { const i = pages.findIndex(p => p.id === activePageId); if (i < pages.length - 1) setActivePageId(pages[i + 1].id); } else if (e.key === "ArrowLeft") { const i = pages.findIndex(p => p.id === activePageId); if (i > 0) setActivePageId(pages[i - 1].id); } else if (e.key === "Escape") setIsPresenting(false); return; }
      switch (e.key.toLowerCase()) {
        case "v": setSelectedTool("select"); break; case "p": setSelectedTool("pencil"); break; case "r": setSelectedTool("rectangle"); break; case "o": setSelectedTool("circle"); break; case "t": setSelectedTool("text"); break; case "s": setSelectedTool("sticky"); break; case "c": setSelectedTool("comment" as Tool); break; 
        case "delete": case "backspace": if (selectedShapeId) { updateShapes(activePage.shapes.filter(s => s.id !== selectedShapeId)); setSelectedShapeId(null); } break;
      }
    };
    window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, selectedShapeId, activePage?.shapes, selectedTool, isPresenting, pages, activePageId]);

  const updateShapes = (newShapes: Shape[], pushToHistory = true) => {
    setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, shapes: newShapes } : p)));
    socket.emit("shapes-change", { pageId: activePageId, shapes: newShapes });
    if (pushToHistory) { const h = history.slice(0, historyIndex + 1); h.push(newShapes); if (h.length > 5000) h.shift(); setHistory(h); setHistoryIndex(h.length - 1); }
  };

  const handleUndo = () => { if (historyIndex <= 0) return; const i = historyIndex - 1; setHistoryIndex(i); updateShapes(history[i], false); };
  const handleRedo = () => { if (historyIndex >= history.length - 1) return; const i = historyIndex + 1; setHistoryIndex(i); updateShapes(history[i], false); };
  const handleCreatePage = () => { const n = { id: crypto.randomUUID(), name: `Page ${pages.length + 1}`, shapes: [] }; const nP = [...pages, n]; setPages(nP); setActivePageId(n.id); socket.emit("page-update", { pages: nP, activePageId: n.id }); };
  const handleAddCommentToShape = (sId: string, text: string) => { updateShapes(activePage.shapes.map(s => s.id === sId ? { ...s, comments: [...(s.comments || []), { id: crypto.randomUUID(), userId: "me", username: "Author", text, timestamp: Date.now() }] } : s)); };

  if (isDashboard) {
    return (
      <Dashboard 
        isDark={isDark} 
        onNewRoom={handleNewRoom} 
        recentRooms={JSON.parse(localStorage.getItem("draw-recent-rooms") || "[]")}
        onSelectRoom={(id) => window.location.hash = id}
      />
    );
  }

  if (!activePage) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${isDark ? "bg-[#0f172a] text-white" : "bg-[#f8fafc] text-slate-400"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Syncing board state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen transition-colors duration-500 overflow-hidden ${isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
      {!isReadOnly && (
      <Toolbar
        selectedTool={selectedTool} onSelectTool={setSelectedTool}
        color={color} setColor={setColor} pages={pages} activePageId={activePageId} onCreatePage={handleCreatePage} onSelectPage={setActivePageId}
        isDark={isDark} onToggleDark={setIsDark} handDrawn={handDrawn} onToggleHandDrawn={setHandDrawn}
        canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} onUndo={handleUndo} onRedo={handleRedo}
        canDelete={!!selectedShapeId} onDelete={() => { if (selectedShapeId) { updateShapes(activePage.shapes.filter(s => s.id !== selectedShapeId)); setSelectedShapeId(null); } }}
        onExportPNG={async () => { const c = document.querySelector("canvas"); if (c) (await import("../utils/export")).exportCanvasAsPNG(c); }}
        onExportSVG={async () => (await import("../utils/export")).exportCanvasAsSVG(activePage.shapes, isDark)}
        isPresenting={isPresenting} onTogglePresentation={() => setIsPresenting(!isPresenting)}
        showLibrary={showLibrary} onToggleLibrary={() => setShowLibrary(!showLibrary)}
        onShare={() => setShowShareModal(true)}
        showTimeline={showTimeline} onToggleTimeline={() => setShowTimeline(!showTimeline)}
      />
      )}

      <ShareModal 
        isVisible={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        roomId={roomId || ""} 
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        isOwner={isOwner}
      />

      <ComponentLibrary isVisible={showLibrary && !isPresenting} onClose={() => setShowLibrary(false)} onAddShape={(s) => updateShapes([...activePage.shapes, s])} selectedShape={activePage.shapes.find(s => s.id === selectedShapeId) || null} />
      
      <div className={`transition-opacity z-[60] ${isPresenting ? "opacity-0" : "opacity-100"}`}>
        <ParticipantSidebar 
          users={presence} 
          currentPageId={activePageId} 
          currentUserId={userId}
          isLocked={isLocked}
          onLockRoom={handleToggleLock}
          isOwner={isOwner}
        />
      </div>

      <main className="flex-grow relative overflow-hidden bg-transparent">
        <CanvasBoard 
          selectedTool={selectedTool} color={color} shapes={activePage.shapes} onShapesChange={updateShapes} isDark={isDark} selectedShapeId={selectedShapeId} onSelectShape={setSelectedShapeId} 
          socket={socket} remoteCursors={remoteCursors} username={username} handDrawn={handDrawn}
          onTransformChange={(p, s) => { setPan(p); setScale(s); }}
        />
        
        {/* Overlays */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0", pointerEvents: "none", position: "absolute", inset: 0 }}>
            {!isPresenting && activePage.shapes.map(s => (s.type === "rectangle" || s.type === "circle" || s.type === "sticky" || s.type === "text") && (
              <div key={`o-${s.id}`} style={{ position: "absolute", left: (s.x || (s.start ? s.start.x : 0)), top: (s.y || (s.start ? s.start.y : 0)) }}>
                <CommentOverlay shape={s} onAddComment={handleAddCommentToShape} isDark={isDark} />
              </div>
            ))}
        </div>
      </main>

      <HistoryScrubber currentIndex={historyIndex} maxIndex={history.length - 1} onScrub={(idx) => { setHistoryIndex(idx); updateShapes(history[idx], false); }} isVisible={!isPresenting && showTimeline} />
      {isPresenting && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-4xl animate-in fade-in slide-in-from-bottom duration-500"><button onClick={() => setIsPresenting(false)} className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider">Exit Presentation</button><div className="w-[1px] h-4 bg-white/10" /><span className="text-blue-400 font-mono text-xs">Slide {pages.findIndex(p => p.id === activePageId) + 1} of {pages.length}</span></div>)}
    </div>
  );
}
