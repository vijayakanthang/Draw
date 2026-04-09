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

  socket.on("join-room", ({ roomId, username }) => {
    currentRoom = roomId;
    socket.join(roomId);
    
    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

    // Initialize room state if it doesn't exist
    if (!boards[roomId]) {
      boards[roomId] = {
        pages: [{ id: "page-1", name: "Main Board", shapes: [] }],
        activePageId: "page-1"
      };
    }

    // Send current state of the specific room on join
    socket.emit("init", boards[roomId]);
    
    // Notify others in the room with detailed presence
    socket.to(roomId).emit("presence-update", { id: socket.id, username, pageId: "page-1" });
  });

  // Sync cursors (Room isolated)
  socket.on("cursor-move", (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit("cursor-update", { id: socket.id, ...data });
    }
  });

  // Sync shape changes (Room isolated)
  socket.on("shapes-change", (data) => {
    if (currentRoom) {
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
    if (currentRoom) {
      boards[currentRoom].pages = data.pages;
      socket.to(currentRoom).emit("page-remote-update", data);
    }
  });

  // Sync page views (Room isolated)
  socket.on("page-view-change", (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit("presence-update", { id: socket.id, pageId: data.pageId });
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      console.log(`User ${socket.id} disconnected from ${currentRoom}`);
      socket.to(currentRoom).emit("user-disconnected", socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Revolutionary Server running on http://localhost:${PORT}`);
});