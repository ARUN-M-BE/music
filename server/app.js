// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const ImageKit = require("imagekit");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB
if (process.env.DATABASE_STRING) {
  mongoose
    .connect(process.env.DATABASE_STRING)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((error) => console.error("❌ MongoDB Connection Error:", error));
} else {
  console.warn("⚠️ DATABASE_STRING environment variable not provided");
}

// ImageKit Configuration
const imagekit = new ImageKit({
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT || "",
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY || "",
});

// ImageKit Auth Endpoint
app.get("/auth", (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "ImageKit authentication failed" });
  }
});

// Health Check Endpoint
app.get("/", (req, res) => res.status(200).json({ status: "API Server running smoothly", timestamp: new Date() }));

// Application Routes
app.use("/api/users", require("./routes/auth"));
app.use("/api/artists", require("./routes/artist"));
app.use("/api/albums", require("./routes/album"));
app.use("/api/songs", require("./routes/song"));
app.use("/api/media", require("./routes/media"));

// Centralized Security Error Handler
app.use((err, req, res, next) => {
  console.error("Server exception:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Music Server running on port ${PORT}`);
});

module.exports = app;
