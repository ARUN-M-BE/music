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

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection
  .once("open", () => console.log("Connected to database"))
  .on("error", (error) => console.log("MongoDB Error:", error));

// ImageKit Configuration
const imagekit = new ImageKit({
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
});

// CORS Headers for ImageKit
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ImageKit Auth Endpoint
app.get("/auth", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// Test Route
app.get("/", (req, res) => res.send("Hello World!"));

// Application Routes (make sure these modules export a router)
app.use("/api/users", require("./routes/auth"));
app.use("/api/artists", require("./routes/artist"));
app.use("/api/albums", require("./routes/album"));
app.use("/api/songs", require("./routes/song"));
app.use("/api/media", require("./routes/media"));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
