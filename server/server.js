import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory data stores
let pages = [
  { id: "page-1", name: "Page 1" },
];

/**
 * Shape model (in-memory)
  * Note: The frontend sends the full shape object (with start, end, path, etc.)
  * and the backend just stores it as-is.
 */
let shapes = [
  // Example shape
  {
    id: "shape-1",
    type: "rectangle",
    start: { x: 100, y: 100 },
    end: { x: 300, y: 200 },
    color: "#E03131",
    rotation: 0,
    pageId: "page-1"
  }
];

// Shapes
// GET /api/shapes?pages=all|pageId
app.get("/api/shapes", (req, res) => {
  const { pageId } = req.query;
  if (pageId) {
    return res.json(shapes.filter((s) => s.pageId === pageId));
  }
  res.json(shapes);
});

app.post("/api/shapes", (req, res) => {
  const newShape = req.body || {};
  if (!newShape.id) newShape.id = `shape_${Math.random().toString(36).slice(2, 9)}`;
  if (!newShape.pageId) return res.status(400).json({ error: "pageId is required" });
  
  // Just push the whole shape object from the client
  shapes.push(newShape);
  console.log('Created shape:', newShape);
  res.status(201).json(newShape);
});

app.put("/api/shapes/:id", (req, res) => {
  const { id } = req.params;
  const idx = shapes.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Shape not found" });
  
  // Replace the shape entirely with the new body, but keep the ID
  shapes[idx] = { ...req.body, id: id };
  console.log('Updated shape:', shapes[idx]);
  res.json(shapes[idx]);
});

app.delete("/api/shapes/:id", (req, res) => {
  const { id } = req.params;
  const before = shapes.length;
  shapes = shapes.filter((s) => s.id !== id);
  console.log('Deleted shape:', id);
  res.json({ success: true, deleted: before - shapes.length });
});

// Pages
app.get("/api/pages", (req, res) => {
  console.log('Sending pages:', pages);
  res.json(pages);
});

app.post("/api/pages", (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });
  const page = { id: `page_${Math.random().toString(36).slice(2, 9)}`, name: name.trim() };
  pages.push(page);
  console.log('Created page:', page);
  res.status(201).json(page);
});

app.get("/api/pages/:id/shapes", (req, res) => {
  const { id } = req.params;
  const exists = pages.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Page not found" });
  
  const pageShapes = shapes.filter((s) => s.pageId === id);
  console.log(`Sending ${pageShapes.length} shapes for page ${id}`);
  res.json(pageShapes);
});

app.delete("/api/pages/:id", (req, res) => {
  const { id } = req.params;
  const before = pages.length;
  pages = pages.filter((p) => p.id !== id);
  // remove shapes on that page as well
  const shapesBefore = shapes.length;
  shapes = shapes.filter((s) => s.pageId !== id);
  console.log(`Deleted page ${id} and ${shapesBefore - shapes.length} shapes`);
  res.json({ success: true, deletedPages: before - pages.length, deletedShapes: shapesBefore - shapes.length });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));