# ✨ Draw: The Intelligent Whiteboard

**Draw** is a production-grade, collaborative design platform that combines real-time multiplayer editing with advanced AI-powered diagramming. Built on the MERN stack with a focus on speed, aesthetics, and intelligence, it's designed to be your one-stop shop for brainstorming, planning, and design.

---

## 🚀 Key Features

### 🤝 Real-Time Collaboration
*   **Live Cursors**: See where your team is working in real-time.
*   **Presence Avatars**: Know exactly who's currently viewing or editing each board.
*   **Persistent Multi-Page Support**: Easily context-switch between multiple boards within a single project.

### 🧠 AI & Intelligence
*   **AI Text-to-Diagram**: Simply type a workflow description like `User logs in -> Validates credentials -> Dashboard`, and watch as it's automatically converted into a structured flowchart.
*   **Magic Shape Recognition**: Hand-draw rough sketches of boxes and circles, and our AI will automatically smooth them into perfect geometric shapes.
*   **Auto-Layout**: Instantly organize messy diagrams into a clean, professional grid layout with a single click.
*   **Collaboration Heatmaps**: Visualize hotspots where most board edits occur to understand team focus.

### 🎨 Design & Aesthetic
*   **Infinite Workspace**: A truly limitless canvas with smooth, lag-free panning and zooming.
*   **Rough.js Aesthetic**: Toggle a hand-drawn, "sketchy" look for a more organic and natural feel.
*   **Sleek Dark Mode**: A premium, glassmorphism-inspired UI designed to be easy on the eyes.
*   **Component Library**: Save and manage reusable shape templates to speed up your workflow.

### ⚡️ Power User Tools
*   **History Scrubber**: A visual timeline that lets you rewind or fast-forward through thousands of changes.
*   **Multi-Format Export**: One-click export to high-resolution PNG or vector-friendly SVG.
*   **One-Link Sharing**: Instantly generate and share read-only links to your boards for stakeholders.
*   **Keyboard-First Workflow**: Use powerful VIM-like shortcuts for every tool to maximize your speed.

---

## 🛠 Tech Stack

*   **Frontend**: React (TypeScript), Tailwind CSS
*   **Canvas Engine**: HTML5 Canvas + Rough.js
*   **Backend**: Node.js, Express, Socket.io
*   **Intelligence**: Heuristic Heuristic Parser & AI Recognition Engine
*   **State Management**: Real-time WebSocket sync with local history history tracking.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies for Both Client and Server
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Run the application
   - **Start Server**: `cd server && npm run dev`
   - **Start Client**: `cd client && npm run dev`

---

## 🌍 Deployment

### 1. Server (Backend) - Recommended: [Render](https://render.com)
1. Create a **New Web Service** on Render.
2. Connect your GitHub repository.
3. **Build Command**: `cd server && npm install`
4. **Start Command**: `cd server && node server.js`
5. **Environment Variables**:
    * `PORT`: 5000 (usually set automatically by Render)
    * `CLIENT_ORIGIN`: Your Vercel frontend URL (e.g., `https://draw-app.vercel.app`)

### 2. Client (Frontend) - Recommended: [Vercel](https://vercel.com)
1. Create a **New Project** on Vercel.
2. Select the `client` folder as the **Root Directory**.
3. Vercel should auto-detect **Vite**.
4. **Environment Variables**:
    * `VITE_SOCKET_URL`: Your Render server URL (e.g., `https://draw-server.onrender.com`)

---

## ⚙️ Environment Variables

### Backend (.env)
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_SOCKET_URL=http://localhost:5000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Tool |
| :--- | :--- |
| **V** | Select Tool |
| **P** | Pencil |
| **L** | Line |
| **R** | Rectangle |
| **O** | Circle |
| **T** | Text |
| **S** | Sticky Note |
| **C** | Comment Mode |
| **Del / Backspace** | Delete Selected |
| **Ctrl+Z / Ctrl+Y** | Undo / Redo |

---

Built with ❤️ by deepmind team.
