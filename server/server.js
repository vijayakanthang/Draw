import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Multi-board state (Simple in-memory)
// Now tracking cursor positions and full shape state
let boards = {
  "default": {
    pages: [{ id: "page-1", name: "Main Board", shapes: [] }],
    activePageId: "page-1"
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send current state on join
  socket.emit("init", boards["default"]);

  // Sync cursors
  socket.on("cursor-move", (data) => {
    socket.broadcast.emit("cursor-update", { id: socket.id, ...data });
  });

  // Sync shape changes (create/update/delete)
  socket.on("shapes-change", (data) => {
    const { pageId, shapes } = data;
    const board = boards["default"];
    const page = board.pages.find(p => p.id === pageId);
    if (page) {
      page.shapes = shapes;
      // Broadcast to everyone else
      socket.broadcast.emit("shapes-remote-update", { pageId, shapes });
    }
  });

  // Sync page changes
  socket.on("page-update", (data) => {
    boards["default"].pages = data.pages;
    socket.broadcast.emit("page-remote-update", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    io.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Revolutionary Server running on http://localhost:${PORT}`);
});