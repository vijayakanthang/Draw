import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({ status: "ok", rooms: Object.keys(boards).length });
});

// Multi-board state (in-memory)
let boards = {};

// Room cleanup: remove empty rooms after 10 minutes
const ROOM_TTL_MS = 10 * 60 * 1000;
const roomTimers = {};

function scheduleRoomCleanup(roomId) {
  if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
  roomTimers[roomId] = setTimeout(() => {
    if (boards[roomId] && Object.keys(boards[roomId].participants).length === 0) {
      console.log(`Cleaning up empty room: ${roomId}`);
      delete boards[roomId];
      delete roomTimers[roomId];
    }
  }, ROOM_TTL_MS);
}

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUserId = null;

  socket.on("join-room", ({ roomId, username, userId }) => {
    if (!roomId || typeof roomId !== "string") return;
    if (!username || typeof username !== "string") return;
    
    currentRoom = roomId;
    currentUserId = userId || socket.id;

    // Cancel any pending cleanup
    if (roomTimers[roomId]) {
      clearTimeout(roomTimers[roomId]);
      delete roomTimers[roomId];
    }

    // Initialize room if it doesn't exist
    if (!boards[roomId]) {
      boards[roomId] = {
        pages: [{ id: "page-1", name: "Main Board", shapes: [] }],
        activePageId: "page-1",
        ownerId: currentUserId,
        isLocked: false,
        accessMode: "open",       // "open" | "approval"
        participants: {},
        waitingRoom: {},          // { [socketId]: { userId, username, socketId } }
        approvedUsers: new Set(), // Set of userIds that have been approved (persists across reconnects)
      };
      // Owner is always approved
      boards[roomId].approvedUsers.add(currentUserId);
    }

    const board = boards[roomId];
    const isOwner = board.ownerId === currentUserId;

    // Access control check
    if (board.accessMode === "approval" && !isOwner && !board.approvedUsers.has(currentUserId)) {
      // User needs approval — put them in waiting room
      socket.join(roomId); // Join the socket.io room so we can send them events
      
      board.waitingRoom[socket.id] = {
        userId: currentUserId,
        username,
        socketId: socket.id,
      };

      // Tell the user they're waiting
      socket.emit("waiting-for-approval", {
        roomId,
        message: "Waiting for the room owner to approve your request..."
      });

      // Notify the owner about the pending request
      const ownerSocketId = Object.entries(board.participants).find(
        ([, p]) => p.userId === board.ownerId
      )?.[0];
      
      if (ownerSocketId) {
        io.to(ownerSocketId).emit("join-request", {
          socketId: socket.id,
          userId: currentUserId,
          username,
        });
      }

      // Also send the full waiting room to all participants
      io.to(roomId).emit("waiting-room-update", Object.values(board.waitingRoom));

      console.log(`User ${username} (${currentUserId}) is waiting for approval in room ${roomId}`);
      return; // Don't proceed to full join
    }

    // --- Full Join Logic ---
    console.log(`User ${username} (${currentUserId}) joined room ${roomId}`);
    
    socket.join(roomId);

    // Remove stale entries for this userId (reconnection)
    for (const [sid, p] of Object.entries(board.participants)) {
      if (p.userId === currentUserId && sid !== socket.id) {
        delete board.participants[sid];
      }
    }

    // Remove from waiting room if they were there
    for (const [sid, w] of Object.entries(board.waitingRoom)) {
      if (w.userId === currentUserId) {
        delete board.waitingRoom[sid];
      }
    }

    // Add to approved list
    board.approvedUsers.add(currentUserId);

    // Add participant
    board.participants[socket.id] = {
      id: socket.id,
      userId: currentUserId,
      username,
      pageId: board.activePageId || "page-1",
      isOwner,
    };

    // Send full state to the joining user
    socket.emit("init", {
      ...board,
      approvedUsers: undefined, // Don't leak the full approved set
      users: board.participants,
      waitingRoom: Object.values(board.waitingRoom),
    });
    
    // Notify others
    socket.to(roomId).emit("participants-update", board.participants);
    io.to(roomId).emit("waiting-room-update", Object.values(board.waitingRoom));
  });

  // Owner approves a waiting user
  socket.on("approve-user", ({ socketId: targetSocketId, userId: targetUserId }) => {
    if (!currentRoom || !boards[currentRoom]) return;
    const board = boards[currentRoom];
    if (board.ownerId !== currentUserId) return; // Only owner can approve

    const waiting = board.waitingRoom[targetSocketId];
    if (!waiting) return;

    // Add to approved list
    board.approvedUsers.add(waiting.userId);

    // Remove from waiting room
    delete board.waitingRoom[targetSocketId];

    // Tell the approved user to re-join (they'll pass the check this time)
    io.to(targetSocketId).emit("approved", { roomId: currentRoom });

    // Update waiting room for everyone
    io.to(currentRoom).emit("waiting-room-update", Object.values(board.waitingRoom));

    console.log(`Owner approved user ${waiting.username} (${waiting.userId}) in room ${currentRoom}`);
  });

  // Owner rejects a waiting user
  socket.on("reject-user", ({ socketId: targetSocketId }) => {
    if (!currentRoom || !boards[currentRoom]) return;
    const board = boards[currentRoom];
    if (board.ownerId !== currentUserId) return;

    const waiting = board.waitingRoom[targetSocketId];
    if (!waiting) return;

    // Remove from waiting room
    delete board.waitingRoom[targetSocketId];

    // Tell the rejected user
    io.to(targetSocketId).emit("rejected", { 
      message: "The room owner has denied your request to join." 
    });

    // Update waiting room for everyone
    io.to(currentRoom).emit("waiting-room-update", Object.values(board.waitingRoom));

    console.log(`Owner rejected user ${waiting.username} in room ${currentRoom}`);
  });

  // Owner changes access mode
  socket.on("set-access-mode", ({ mode }) => {
    if (!currentRoom || !boards[currentRoom]) return;
    const board = boards[currentRoom];
    if (board.ownerId !== currentUserId) return;
    if (mode !== "open" && mode !== "approval") return;

    board.accessMode = mode;
    io.to(currentRoom).emit("access-mode-update", { mode });
    console.log(`Room ${currentRoom} access mode changed to: ${mode}`);
  });

  // Owner kicks a user
  socket.on("kick-user", ({ socketId: targetSocketId }) => {
    if (!currentRoom || !boards[currentRoom]) return;
    const board = boards[currentRoom];
    if (board.ownerId !== currentUserId) return;

    const participant = board.participants[targetSocketId];
    if (!participant || participant.isOwner) return; // Can't kick yourself

    // Remove from approved list so they can't just rejoin
    board.approvedUsers.delete(participant.userId);

    // Remove from participants
    delete board.participants[targetSocketId];

    // Tell the kicked user
    io.to(targetSocketId).emit("kicked", { 
      message: "You have been removed from this room by the owner." 
    });

    // Force leave the socket.io room
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.leave(currentRoom);
    }

    // Update everyone
    io.to(currentRoom).emit("participants-update", board.participants);

    console.log(`Owner kicked user ${participant.username} from room ${currentRoom}`);
  });

  // Toggle Room Lock (Owner only)
  socket.on("toggle-room-lock", ({ locked }) => {
    if (currentRoom && boards[currentRoom] && boards[currentRoom].ownerId === currentUserId) {
      boards[currentRoom].isLocked = locked;
      io.to(currentRoom).emit("room-lock-status", { locked });
    }
  });

  // Sync cursors
  socket.on("cursor-move", (data) => {
    if (currentRoom && data && typeof data.x === "number" && typeof data.y === "number") {
      socket.to(currentRoom).emit("cursor-update", { id: socket.id, ...data });
    }
  });

  // Drawing in progress
  socket.on("drawing-in-progress", (data) => {
    if (currentRoom && boards[currentRoom]) {
      if (boards[currentRoom].isLocked && boards[currentRoom].ownerId !== currentUserId) return;
      socket.to(currentRoom).emit("remote-drawing-in-progress", {
        id: socket.id,
        username: boards[currentRoom].participants[socket.id]?.username || "Unknown",
        shape: data.shape
      });
    }
  });

  socket.on("drawing-finished", () => {
    if (currentRoom) {
      socket.to(currentRoom).emit("remote-drawing-finished", { id: socket.id });
    }
  });

  // Sync shape changes
  socket.on("shapes-change", (data) => {
    if (currentRoom && boards[currentRoom]) {
      if (boards[currentRoom].isLocked && boards[currentRoom].ownerId !== currentUserId) return;
      const { pageId, shapes } = data;
      if (!pageId || !Array.isArray(shapes)) return;
      const board = boards[currentRoom];
      const page = board.pages.find(p => p.id === pageId);
      if (page) {
        page.shapes = shapes;
        socket.to(currentRoom).emit("shapes-remote-update", { pageId, shapes });
      }
    }
  });

  // Sync page changes
  socket.on("page-update", (data) => {
    if (currentRoom && boards[currentRoom]) {
      if (boards[currentRoom].isLocked && boards[currentRoom].ownerId !== currentUserId) return;
      if (!data || !Array.isArray(data.pages)) return;
      boards[currentRoom].pages = data.pages;
      socket.to(currentRoom).emit("page-remote-update", data);
    }
  });

  // Sync page views
  socket.on("page-view-change", (data) => {
    if (currentRoom && boards[currentRoom] && boards[currentRoom].participants[socket.id]) {
      if (!data || !data.pageId) return;
      boards[currentRoom].participants[socket.id].pageId = data.pageId;
      socket.to(currentRoom).emit("participants-update", boards[currentRoom].participants);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && boards[currentRoom]) {
      const board = boards[currentRoom];
      console.log(`User ${socket.id} disconnected from ${currentRoom}`);
      
      // Remove from participants
      delete board.participants[socket.id];
      
      // Remove from waiting room
      delete board.waitingRoom[socket.id];
      
      // Notify remaining users
      socket.to(currentRoom).emit("user-disconnected", socket.id);
      socket.to(currentRoom).emit("participants-update", board.participants);
      socket.to(currentRoom).emit("waiting-room-update", Object.values(board.waitingRoom));

      if (Object.keys(board.participants).length === 0) {
        scheduleRoomCleanup(currentRoom);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Draw Server running on http://localhost:${PORT}`);
});