import { useMemo, useState, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";
import CanvasBoard from "./CanvasBoard";
import HistoryScrubber from "./HistoryScrubber";
import ComponentLibrary from "./ComponentLibrary";
import CommentOverlay from "./CommentOverlay";
import Dashboard from "./Dashboard";
import ShareModal from "./ShareModal";
import ParticipantSidebar from "./ParticipantSidebar";
import InlineTextInput from "./InlineTextInput";
import { useSocket } from "../hooks/useSocket";
import { UserIcon } from "./Icons";
import type { Shape, Tool } from "../types/shapes";

export default function Whiteboard() {
  const [selectedTool, setSelectedTool] = useState<Tool>("none");
  const [color, setColor] = useState<string>("#3b82f6");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [handDrawn, setHandDrawn] = useState<boolean>(true);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("draw-theme") as "dark" | "light") || "dark";
  });
  
  // Board Transform State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [pages, setPages] = useState<{ id: string; name: string; shapes: Shape[] }[]>([
    { id: "page-1", name: "Main Board", shapes: [] },
  ]);
  const [activePageId, setActivePageId] = useState<string>("page-1");
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; username: string; userNumber?: number }>>({});
  const [remoteDrawings, setRemoteDrawings] = useState<Record<string, { id: string; username: string; shape: Shape }>>({});
  const [presence, setPresence] = useState<Record<string, { id: string; username: string; pageId: string; userId?: string; isOwner?: boolean }>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);

  // Access control state
  const [accessMode, setAccessMode] = useState<"open" | "approval">("open");
  const [waitingRoom, setWaitingRoom] = useState<{ socketId: string; userId: string; username: string }[]>([]);
  const [waitingStatus, setWaitingStatus] = useState<"none" | "waiting" | "rejected">("none");
  const [rejectedMessage, setRejectedMessage] = useState<string>("");

  // Inline text input state
  const [textInput, setTextInput] = useState<{
    visible: boolean;
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    isSticky: boolean;
  } | null>(null);

  // 1. Persistent User Identity
  const userId = useMemo(() => {
    let id = localStorage.getItem("draw-user-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("draw-user-id", id);
    }
    return id;
  }, []);

  // 2. Room ID Management — use full UUIDs for unguessable room IDs
  const [roomId, setRoomId] = useState<string | null>(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      setRoomId(hash || null);
      // Reset access control state on room change
      setWaitingStatus("none");
      setRejectedMessage("");
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

  // 4. Socket Management
  const { getSocket, status: connectionStatus } = useSocket({ roomId, username, userId, autoJoin: false });

  const joinRoom = useCallback((name: string) => {
    localStorage.setItem("draw-username", name);
    getSocket()?.emit("join-room", { roomId, username: name, userId });
    setIsJoined(true);
  }, [roomId, userId, getSocket]);

  const isOwner = useMemo(() => {
    const me = Object.values(presence).find(u => u.userId === userId);
    return me?.isOwner || false;
  }, [presence, userId]);

  const handleToggleLock = (locked: boolean) => {
    getSocket()?.emit("toggle-room-lock", { locked });
  };

  // Use full UUID for room IDs — practically impossible to guess
  const handleNewRoom = () => {
    const id = crypto.randomUUID();
    window.location.hash = id;
  };

  const handleGoHome = () => {
    window.location.hash = "";
    setRoomId(null);
    setWaitingStatus("none");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("draw-theme", newTheme);
  };

  const handleSetAccessMode = (mode: "open" | "approval") => {
    getSocket()?.emit("set-access-mode", { mode });
    setAccessMode(mode);
  };

  const handleApproveUser = (socketId: string, targetUserId: string) => {
    getSocket()?.emit("approve-user", { socketId, userId: targetUserId });
  };

  const handleRejectUser = (socketId: string) => {
    getSocket()?.emit("reject-user", { socketId });
  };

  const handleKickUser = (socketId: string) => {
    getSocket()?.emit("kick-user", { socketId });
  };

  const activePage = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return pages.find((p) => p.id === activePageId) || pages[0];
  }, [pages, activePageId]);

  // Socket event listeners
  useEffect(() => {
    if (!roomId) {
      setIsDashboard(true);
      return;
    }
    setIsDashboard(false);

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "readonly") setIsReadOnly(true);

    const setupInterval = setInterval(() => {
      const socket = getSocket();
      if (!socket) return;
      clearInterval(setupInterval);

      // --- Standard board events ---
      socket.on("init", (data: any) => { 
        if (data) { 
          setPages(data.pages || [{ id: "page-1", name: "Main Board", shapes: [] }]); 
          setActivePageId(data.activePageId || "page-1"); 
          setIsLocked(data.isLocked || false);
          setAccessMode(data.accessMode || "open");
          if (data.users) setPresence(data.users);
          if (data.waitingRoom) setWaitingRoom(data.waitingRoom);
          setWaitingStatus("none"); // We got init, so we're approved
        } 
      });

      socket.on("shapes-remote-update", (data: any) => { 
        if (data && data.pageId && Array.isArray(data.shapes)) {
          setPages(prev => prev.map(p => p.id === data.pageId ? { ...p, shapes: data.shapes } : p)); 
        }
      });
      
      socket.on("cursor-update", (data: any) => { 
        if (data && data.id) {
          setRemoteCursors(prev => ({ ...prev, [data.id]: { x: data.x, y: data.y, username: data.username, userNumber: data.userNumber } })); 
        }
      });
      
      socket.on("participants-update", (data: any) => { 
        if (data) setPresence(data);
      });

      socket.on("presence-update", (data: any) => { 
        if (data && data.id) setPresence(prev => ({ ...prev, [data.id]: data })); 
      });
      
      socket.on("room-lock-status", ({ locked }: { locked: boolean }) => setIsLocked(locked));
      
      socket.on("user-disconnected", (id: string) => { 
        setRemoteCursors(prev => { const n = { ...prev }; delete n[id]; return n; }); 
        setPresence(prev => { const n = { ...prev }; delete n[id]; return n; }); 
        setRemoteDrawings(prev => { const n = { ...prev }; delete n[id]; return n; });
      });

      socket.on("page-remote-update", (data: any) => {
        if (data && Array.isArray(data.pages)) {
          setPages(data.pages);
        }
      });

      // Live drawing sync
      socket.on("remote-drawing-in-progress", (data: any) => {
        if (data && data.id && data.shape) {
          setRemoteDrawings(prev => ({ ...prev, [data.id]: data }));
        }
      });

      socket.on("remote-drawing-finished", (data: any) => {
        if (data && data.id) {
          setRemoteDrawings(prev => { const n = { ...prev }; delete n[data.id]; return n; });
        }
      });

      // --- Access Control Events ---
      socket.on("waiting-for-approval", () => {
        setWaitingStatus("waiting");
      });

      socket.on("approved", () => {
        setWaitingStatus("none");
        // Re-join to get full state
        socket.emit("join-room", { roomId, username, userId });
      });

      socket.on("rejected", ({ message }: { message: string }) => {
        setWaitingStatus("rejected");
        setRejectedMessage(message);
      });

      socket.on("kicked", ({ message }: { message: string }) => {
        setWaitingStatus("rejected");
        setRejectedMessage(message);
      });

      socket.on("access-mode-update", ({ mode }: { mode: "open" | "approval" }) => {
        setAccessMode(mode);
      });

      socket.on("waiting-room-update", (data: any) => {
        if (Array.isArray(data)) setWaitingRoom(data);
      });

      socket.on("join-request", (data: any) => {
        // This triggers a waiting room update which we handle above
        // But we can also show a notification
        if (data && data.username) {
          setWaitingRoom(prev => {
            if (prev.find(w => w.socketId === data.socketId)) return prev;
            return [...prev, data];
          });
        }
      });
    }, 100);
    
    // Track Recent Rooms
    const recent = JSON.parse(localStorage.getItem("draw-recent-rooms") || "[]");
    if (!recent.includes(roomId)) {
      localStorage.setItem("draw-recent-rooms", JSON.stringify([roomId, ...recent].slice(0, 10)));
    }

    return () => { 
      clearInterval(setupInterval);
      const socket = getSocket();
      if (socket) {
        socket.off("init"); 
        socket.off("shapes-remote-update"); 
        socket.off("cursor-update"); 
        socket.off("participants-update");
        socket.off("presence-update"); 
        socket.off("user-disconnected"); 
        socket.off("room-lock-status");
        socket.off("page-remote-update");
        socket.off("remote-drawing-in-progress");
        socket.off("remote-drawing-finished");
        socket.off("waiting-for-approval");
        socket.off("approved");
        socket.off("rejected");
        socket.off("kicked");
        socket.off("access-mode-update");
        socket.off("waiting-room-update");
        socket.off("join-request");
      }
      setRemoteCursors({});
      setPresence({});
      setRemoteDrawings({});
      setWaitingRoom([]);
    };
  }, [roomId, getSocket]);

  useEffect(() => { 
    getSocket()?.emit("page-view-change", { pageId: activePageId }); 
  }, [activePageId, getSocket]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (textInput) return;
      
      if (e.ctrlKey) { 
        if (e.key === "z") { e.preventDefault(); handleUndo(); } 
        else if (e.key === "y" || (e.shiftKey && e.key === "Z")) { e.preventDefault(); handleRedo(); } 
        return; 
      }
      if (isPresenting) { 
        if (e.key === "ArrowRight") { const i = pages.findIndex(p => p.id === activePageId); if (i < pages.length - 1) setActivePageId(pages[i + 1].id); } 
        else if (e.key === "ArrowLeft") { const i = pages.findIndex(p => p.id === activePageId); if (i > 0) setActivePageId(pages[i - 1].id); } 
        else if (e.key === "Escape") setIsPresenting(false); 
        return; 
      }
      switch (e.key.toLowerCase()) {
        case "v": setSelectedTool("select"); break;
        case "p": setSelectedTool("pencil"); break;
        case "l": setSelectedTool("line"); break;
        case "a": setSelectedTool("arrow"); break;
        case "r": setSelectedTool("rectangle"); break;
        case "o": setSelectedTool("circle"); break;
        case "t": setSelectedTool("text"); break;
        case "s": setSelectedTool("sticky"); break;
        case "c": setSelectedTool("comment"); break;
        case "e": setSelectedTool("eraser"); break;
        case "h": setSelectedTool("none"); break;
        case "escape": setSelectedShapeId(null); setSelectedTool("none"); break;
        case "delete": case "backspace": 
          if (selectedShapeId && activePage) { 
            updateShapes(activePage.shapes.filter(s => s.id !== selectedShapeId)); 
            setSelectedShapeId(null); 
          } break;
      }
    };
    window.addEventListener("keydown", handleKeyDown); 
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, selectedShapeId, activePage?.shapes, selectedTool, isPresenting, pages, activePageId, textInput]);

  const updateShapes = useCallback((newShapes: Shape[], pushToHistory = true) => {
    setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, shapes: newShapes } : p)));
    getSocket()?.emit("shapes-change", { pageId: activePageId, shapes: newShapes });
    if (pushToHistory) { 
      setHistory(prev => {
        const h = prev.slice(0, historyIndex + 1);
        h.push(newShapes); 
        if (h.length > 5000) h.shift(); 
        return h;
      });
      setHistoryIndex(prev => prev + 1);
    }
  }, [activePageId, historyIndex, getSocket]);

  const handleUndo = () => { 
    if (historyIndex <= 0) return; 
    const i = historyIndex - 1; 
    setHistoryIndex(i); 
    const shapes = history[i];
    if (shapes) {
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, shapes } : p)));
      getSocket()?.emit("shapes-change", { pageId: activePageId, shapes });
    }
  };

  const handleRedo = () => { 
    if (historyIndex >= history.length - 1) return; 
    const i = historyIndex + 1; 
    setHistoryIndex(i); 
    const shapes = history[i];
    if (shapes) {
      setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, shapes } : p)));
      getSocket()?.emit("shapes-change", { pageId: activePageId, shapes });
    }
  };

  const handleCreatePage = () => { 
    const n = { id: crypto.randomUUID(), name: `Page ${pages.length + 1}`, shapes: [] }; 
    const nP = [...pages, n]; 
    setPages(nP); 
    setActivePageId(n.id); 
    getSocket()?.emit("page-update", { pages: nP, activePageId: n.id }); 
  };

  const handleAddCommentToShape = (sId: string, text: string) => { 
    if (activePage) updateShapes(activePage.shapes.map(s => s.id === sId ? { ...s, comments: [...(s.comments || []), { id: crypto.randomUUID(), userId, username, text, timestamp: Date.now() }] } : s)); 
  };

  const handleTextInputRequest = (pos: { x: number; y: number; canvasX: number; canvasY: number }, isSticky: boolean) => {
    setTextInput({ visible: true, ...pos, isSticky });
  };

  const handleTextInputSubmit = (text: string) => {
    if (!textInput || !activePage) return;
    const newShape: Shape = {
      id: crypto.randomUUID(),
      type: textInput.isSticky ? "sticky" : "text",
      x: textInput.canvasX,
      y: textInput.canvasY,
      text,
      color: textInput.isSticky ? "#fbbf24" : color,
      seed: Math.floor(Math.random() * 2 ** 31),
    };
    updateShapes([...activePage.shapes, newShape]);
    setTextInput(null);
  };

  // --- Dashboard ---
  useEffect(() => {
    if (!isDashboard) {
      document.body.classList.add("whiteboard-active");
    } else {
      document.body.classList.remove("whiteboard-active");
    }
    return () => document.body.classList.remove("whiteboard-active");
  }, [isDashboard]);

  if (isDashboard) {
    return (
      <Dashboard 
        onNewRoom={handleNewRoom} 
        recentRooms={JSON.parse(localStorage.getItem("draw-recent-rooms") || "[]")}
        onSelectRoom={(id) => window.location.hash = id}
      />
    );
  }

  // --- Waiting for Approval Screen ---
  if (waitingStatus === "waiting") {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${theme === "dark" ? "bg-[#0a0e1a]" : "bg-slate-50"} text-white transition-colors duration-500`}>
        <div className="flex flex-col items-center gap-6 animate-fade-in max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Waiting for Approval</h2>
            <p className="text-sm text-white/40 leading-relaxed">
              The room owner needs to approve your request before you can join. Please wait...
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] text-white/40 font-medium">Request pending</span>
          </div>
          <button 
            onClick={handleGoHome}
            className="text-sm text-white/30 hover:text-white transition-colors underline underline-offset-4"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Rejected / Kicked Screen ---
  if (waitingStatus === "rejected") {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${theme === "dark" ? "bg-[#0a0e1a]" : "bg-slate-50"} transition-colors duration-500`}>
        <div className="flex flex-col items-center gap-6 animate-fade-in max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Access Denied</h2>
            <p className="text-sm text-white/40 leading-relaxed">
              {rejectedMessage || "You don't have permission to access this room."}
            </p>
          </div>
          <button 
            onClick={handleGoHome}
            className="px-6 py-3 bg-white/8 hover:bg-white/12 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (!activePage) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${theme === "dark" ? "bg-[#0a0e1a]" : "bg-slate-50"} transition-colors duration-500`}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-white/40 animate-pulse">Syncing board state...</p>
        </div>
      </div>
    );
  }

  // --- Main Whiteboard ---
  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${theme === "dark" ? "bg-[#0a0e1a]" : "bg-slate-50"} transition-colors duration-500`}>
      {!isReadOnly && (
      <Toolbar
        selectedTool={selectedTool} onSelectTool={setSelectedTool}
        color={color} setColor={setColor} pages={pages} activePageId={activePageId} onCreatePage={handleCreatePage} onSelectPage={setActivePageId}
        handDrawn={handDrawn} onToggleHandDrawn={setHandDrawn}
        canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} onUndo={handleUndo} onRedo={handleRedo}
        canDelete={!!selectedShapeId} onDelete={() => { if (selectedShapeId) { updateShapes(activePage.shapes.filter(s => s.id !== selectedShapeId)); setSelectedShapeId(null); } }}
        onExportPNG={async () => { const c = document.querySelector("canvas"); if (c) (await import("../utils/export")).exportCanvasAsPNG(c); }}
        onExportSVG={async () => (await import("../utils/export")).exportCanvasAsSVG(activePage.shapes)}
        isPresenting={isPresenting} onTogglePresentation={() => setIsPresenting(!isPresenting)}
        showLibrary={showLibrary} onToggleLibrary={() => setShowLibrary(!showLibrary)}
        onShare={() => setShowShareModal(true)}
        showTimeline={showTimeline} onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onGoHome={handleGoHome}
        connectionStatus={connectionStatus}
        isSidebarOpen={isSidebarOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      )}

      <ShareModal 
        isVisible={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        roomId={roomId || ""} 
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        isOwner={isOwner}
        accessMode={accessMode}
        onSetAccessMode={handleSetAccessMode}
      />

      <ComponentLibrary isVisible={showLibrary && !isPresenting} onClose={() => setShowLibrary(false)} onAddShape={(s) => updateShapes([...activePage.shapes, s])} selectedShape={activePage.shapes.find(s => s.id === selectedShapeId) || null} />
      
      <div className={`transition-opacity duration-300 z-[60] ${isPresenting ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <ParticipantSidebar 
          users={presence} 
          currentPageId={activePageId} 
          currentUserId={userId}
          isLocked={isLocked}
          onLockRoom={handleToggleLock}
          isOwner={isOwner}
          accessMode={accessMode}
          onSetAccessMode={handleSetAccessMode}
          waitingRoom={waitingRoom}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
          onKickUser={handleKickUser}
          onToggle={setIsSidebarOpen}
        />
      </div>

      {/* Join Screen Overlay */}
      {!isJoined && roomId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-md animate-fade-in p-4">
          <div className="max-w-md w-full p-6 md:p-10 glass-strong rounded-[2.5rem] shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <UserIcon />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Ready to join?</h2>
            <p className="text-sm text-white/35 mb-8 font-medium">Enter your name to start collaborating on this board.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value; if (name.trim()) joinRoom(name.trim()); }} className="space-y-4">
              <input
                name="name"
                type="text"
                autoFocus
                defaultValue={username}
                placeholder="What's your name?"
                className="w-full px-6 py-4 bg-white/5 border border-white/8 rounded-2xl text-white outline-none focus:border-blue-500/40 transition-all font-bold text-center"
              />
              <button
                type="submit"
                className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
              >
                Join Board
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="flex-grow relative overflow-hidden bg-transparent">
        <CanvasBoard 
          selectedTool={selectedTool} color={color} shapes={activePage.shapes} onShapesChange={updateShapes} isDark={theme === "dark"} selectedShapeId={selectedShapeId} onSelectShape={setSelectedShapeId} 
          socket={getSocket()} remoteCursors={remoteCursors} remoteDrawings={remoteDrawings} username={username} handDrawn={handDrawn}
          onTransformChange={(p, s) => { setPan(p); setScale(s); }}
          onRequestTextInput={handleTextInputRequest}
        />
        
        {/* Comment Overlays */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0", pointerEvents: "none", position: "absolute", inset: 0 }}>
            {!isPresenting && activePage.shapes.map(s => (s.type === "rectangle" || s.type === "circle" || s.type === "sticky" || s.type === "text") && (
              <div key={`o-${s.id}`} style={{ position: "absolute", left: (s.x || (s.start ? s.start.x : 0)), top: (s.y || (s.start ? s.start.y : 0)) }}>
                <CommentOverlay shape={s} onAddComment={handleAddCommentToShape} />
              </div>
            ))}
        </div>

        {/* Inline text input */}
        {textInput && (
          <InlineTextInput
            x={textInput.x}
            y={textInput.y}
            isSticky={textInput.isSticky}
            onSubmit={handleTextInputSubmit}
            onCancel={() => setTextInput(null)}
          />
        )}
      </main>

      <HistoryScrubber currentIndex={historyIndex} maxIndex={history.length - 1} onScrub={(idx) => { setHistoryIndex(idx); if (history[idx]) { setPages(prev => prev.map(p => p.id === activePageId ? { ...p, shapes: history[idx] } : p)); getSocket()?.emit("shapes-change", { pageId: activePageId, shapes: history[idx] }); } }} isVisible={!isPresenting && showTimeline} />
      
      {isPresenting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 glass-strong rounded-2xl shadow-2xl animate-slide-up">
          <button onClick={() => setIsPresenting(false)} className="text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Exit Presentation</button>
          <div className="w-[1px] h-4 bg-white/10" />
          <span className="text-blue-400 font-mono text-xs">Slide {pages.findIndex(p => p.id === activePageId) + 1} of {pages.length}</span>
        </div>
      )}
    </div>
  );
}
