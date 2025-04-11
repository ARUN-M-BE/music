
const express = require("express");
const cors = require("cors");

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/media", mediaRoutes);

app.use("/api/media", require("./routes/media"));


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



