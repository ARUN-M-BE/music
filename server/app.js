// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const ImageKit = require("imagekit");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.DATABASE_STRING);
mongoose.connection
  .once("open", () => console.log("Connected to database"))
  .on("error", (error) => console.log("MongoDB Error:", error));

// 🔐 ImageKit Config
const imagekit = new ImageKit({
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
});

// Allow CORS for ImageKit
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ⛅ ImageKit Auth Route
app.get("/auth", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// 🧑‍🎤 Routes
app.get("/", (req, res) => res.send("Hello World!"));
app.use("/api/users", require("./routes/auth"));
app.use("/api/artists", require("./routes/artist"));
app.use("/api/albums", require("./routes/album"));
app.use("/api/songs", require("./routes/song"));

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
