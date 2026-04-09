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
  }
});

app.use(cors());
app.use(express.json());

// Multi-board state (Simple in-memory)
let boards = {};

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUserId = null;

  socket.on("join-room", ({ roomId, username, userId }) => {
    currentRoom = roomId;
    currentUserId = userId || socket.id;
    socket.join(roomId);
    
    console.log(`User ${username} (${currentUserId}) joined room ${roomId}`);

    // Initialize room state if it doesn't exist
    if (!boards[roomId]) {
      boards[roomId] = {
        pages: [{ id: "page-1", name: "Main Board", shapes: [] }],
        activePageId: "page-1",
        ownerId: currentUserId, // First person to join is the owner
        isLocked: false,
        participants: {}
      };
    }

    // Add participant to the room state
    boards[roomId].participants[socket.id] = {
      id: socket.id,
      userId: currentUserId,
      username,
      pageId: boards[roomId].activePageId || "page-1",
      isOwner: boards[roomId].ownerId === currentUserId
    };

    // Send full current state of the specific room on join
    socket.emit("init", {
      ...boards[roomId],
      users: boards[roomId].participants
    });
    
    // Notify others in the room with detailed presence
    socket.to(roomId).emit("presence-update", boards[roomId].participants[socket.id]);
  });

  // Toggle Room Lock (Owner only)
  socket.on("toggle-room-lock", ({ locked }) => {
    if (currentRoom && boards[currentRoom] && boards[currentRoom].ownerId === currentUserId) {
      boards[currentRoom].isLocked = locked;
      io.to(currentRoom).emit("room-lock-status", { locked });
    }
  });

  // Sync cursors (Room isolated + Lock check)
  socket.on("cursor-move", (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit("cursor-update", { id: socket.id, ...data });
    }
  });

  // Sync shape changes (Room isolated + Lock check)
  socket.on("shapes-change", (data) => {
    if (currentRoom && boards[currentRoom]) {
      // If locked, only owner can change shapes
      if (boards[currentRoom].isLocked && boards[currentRoom].ownerId !== currentUserId) {
        return;
      }

      const { pageId, shapes } = data;
      const board = boards[currentRoom];
      const page = board.pages.find(p => p.id === pageId);
      if (page) {
        page.shapes = shapes;
        // Broadcast to everyone else in the room
        socket.to(currentRoom).emit("shapes-remote-update", { pageId, shapes });
      }
    }
  });

  // Sync page changes (Room isolated)
  socket.on("page-update", (data) => {
    if (currentRoom && boards[currentRoom]) {
      if (boards[currentRoom].isLocked && boards[currentRoom].ownerId !== currentUserId) return;
      
      boards[currentRoom].pages = data.pages;
      socket.to(currentRoom).emit("page-remote-update", data);
    }
  });

  // Sync page views (Room isolated)
  socket.on("page-view-change", (data) => {
    if (currentRoom && boards[currentRoom] && boards[currentRoom].participants[socket.id]) {
      boards[currentRoom].participants[socket.id].pageId = data.pageId;
      socket.to(currentRoom).emit("presence-update", boards[currentRoom].participants[socket.id]);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && boards[currentRoom]) {
      console.log(`User ${socket.id} disconnected from ${currentRoom}`);
      delete boards[currentRoom].participants[socket.id];
      socket.to(currentRoom).emit("user-disconnected", socket.id);

      // Optional: If owner leaves and no one else is there, we could clean up
      if (Object.keys(boards[currentRoom].participants).length === 0) {
        // We'll keep it for a few minutes in a real app, 
        // but here we just let it stay in memory until server restarts.
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Revolutionary Server running on http://localhost:${PORT}`);
});