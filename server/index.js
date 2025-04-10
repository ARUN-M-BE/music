import express from "express";
import mediaRoutes from "./routes/media.js";
import cors from "cors";

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/media", mediaRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist'))); // adjust if you're using Vite

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

const PORT = process.env.IMAGEKIT_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



