// server.js
const express = require("express");
const ImageKit = require("imagekit");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const imagekit = new ImageKit({
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
});
const PORT = import.meta.env.IMAGEKIT_PORT || 3001;

// Debugging: log raw POST body
app.use((req, res, next) => {
  if (req.method === "POST") {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      console.log("Raw incoming POST body:", data);
      next();
    });
  } else {
    next();
  }
});

// ✅ Delete route
app.post("/delete", async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ success: false, message: "fileId is required" });
  }

  try {
    await imagekit.deleteFile(fileId);
    res.json({ success: true });
  } catch (err) {
    console.error("ImageKit delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
