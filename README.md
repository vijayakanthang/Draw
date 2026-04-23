# ✨ Draw Together — Collaborative Whiteboard

**Draw Together** is a production-grade, collaborative design platform that combines real-time multiplayer editing with advanced AI-powered diagramming. Built on the MERN stack with a focus on speed, aesthetics, and intelligence — your one-stop workspace for brainstorming, planning, and design.

> 🌐 **Live App**: [https://doodleroom.vercel.app](https://doodleroom.vercel.app)
> No accounts. No setup. Just open and draw.

---

## 🚀 Key Features

### 🛠 Drawing Tools
- **Select** — Move, resize, and interact with any element
- **Pencil** — Freehand drawing with smooth stroke rendering
- **Line** — Straight connector lines
- **Arrow** — Directional arrows for flowcharts and diagrams
- **Rectangle** — Boxes with fill color and fill style options
- **Circle** — Ellipses with fill color and fill style options
- **Text** — Inline text with font, bold, italic, and underline support
- **Sticky Note** — Colorful sticky notes with fill support
- **Image** — Embed images directly on the canvas
- **Comment** — Drop pinned comment threads anywhere on the board
- **Laser Pointer** — Highlight areas during presentations without leaving marks
- **Eraser** — Precision eraser with adjustable size

### 🎨 Shape & Style Controls
- **Stroke Width** — Thin / Medium / Bold presets per tool
- **Opacity** — Per-element opacity slider (10–100%)
- **Fill Color** — Custom color picker for shapes and sticky notes
- **Fill Style** — Hachure, Solid, Zigzag, Cross-hatch, Dots (via Rough.js)
- **Stroke Color** — Global color picker with live preview
- **Font Options** — Inter, Instrument Serif, Space Mono, Caveat

### 🤝 Real-Time Collaboration
- **Live Cursors** — See every teammate's cursor position in real-time
- **Presence Avatars** — Know who's currently active on the board
- **Connection Status** — Live WebSocket indicator (Connected / Reconnecting / Disconnected)
- **Auto-Save** — Continuous board state sync with save status indicator
- **Invite Link** — One-click room sharing via the Invite button
- **No Account Required** — Just share a link and start collaborating instantly

### 🧠 AI & Intelligence
- **AI Command Palette** — Natural language interface to generate diagrams and shapes
- **Text-to-Diagram** — Type a workflow (e.g. `Login → Validate → Dashboard`) and watch it become a structured flowchart
- **Magic Shape Recognition** — Rough sketches of boxes and circles are auto-corrected into clean geometric shapes
- **Auto-Layout** — Instantly organize cluttered diagrams into a tidy grid with one click
- **Collaboration Heatmap** — Visualize which areas of the board have the most activity

### ⚡ Power User Tools
- **Undo / Redo** — Full history stack with keyboard shortcuts
- **History Scrubber** — Visual timeline to rewind or fast-forward through all changes
- **Grid Snap** — Snap elements to an invisible grid for precise alignment
- **Hand-Drawn Mode** — Toggle Rough.js sketchy aesthetic for an organic, whiteboard feel
- **Search Panel** — Search across all elements on the canvas
- **Component Library** — Save and reuse custom shape templates
- **Context Menu** — Right-click menu for quick actions on selected elements
- **Minimap** — Thumbnail overview of the full canvas for easy navigation
- **Multi-Page Support** — Create, name, and switch between multiple board pages
- **Presentation Mode** — Fullscreen mode that hides all UI chrome
- **Export PNG** — High-resolution raster export
- **Export SVG** — Scalable vector export
- **Dark / Light Mode** — Toggle with persistent preference

### 💬 Comments & Audio
- **Comment Overlay** — Threaded comment pins anchored to canvas positions
- **Audio Note Overlay** — Attach voice notes to specific areas of the board

### 👥 Participant Management
- **Participant Sidebar** — View and manage all active collaborators in the room

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (TypeScript), Tailwind CSS |
| **Canvas Engine** | HTML5 Canvas + Rough.js |
| **Backend** | Node.js, Express |
| **Real-Time** | Socket.io (WebSocket) |
| **State Management** | Real-time WebSocket sync + local undo/redo history |
| **AI / Intelligence** | Heuristic parser + shape recognition engine |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📦 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone [repository-url]

# 2. Install client dependencies
cd client && npm install

# 3. Install server dependencies
cd ../server && npm install

# 4. Start the server
cd server && npm run dev

# 5. Start the client (new terminal)
cd client && npm run dev
```

---

## 🌍 Deployment

### Backend — Recommended: [Render](https://render.com)
1. Create a **New Web Service** and connect your GitHub repo
2. **Build Command**: `cd server && npm install`
3. **Start Command**: `cd server && node server.js`
4. **Environment Variables**:
   - `PORT`: `5000`
   - `CLIENT_ORIGIN`: Your Vercel frontend URL (e.g. `https://doodleroom.vercel.app`)

### Frontend — Recommended: [Vercel](https://vercel.com)
1. Create a **New Project** and set the **Root Directory** to `client`
2. Vercel auto-detects **Vite**
3. **Environment Variables**:
   - `VITE_SOCKET_URL`: Your Render server URL (e.g. `https://draw-server.onrender.com`)

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env`)
```env
VITE_SOCKET_URL=http://localhost:5000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select Tool |
| `P` | Pencil |
| `L` | Line |
| `A` | Arrow |
| `R` | Rectangle |
| `O` | Circle |
| `T` | Text |
| `S` | Sticky Note |
| `I` | Image |
| `C` | Comment Mode |
| `E` | Eraser |
| `Del` / `Backspace` | Delete Selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

---

Built with ❤️ by the deepmind team.
