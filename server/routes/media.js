const express = require("express");
const router = express.Router();
const multer = require("multer");
const ImageKit = require("imagekit");
const artist = require("../models/artist");

// Setup ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Upload and Save Artist
router.post("/save", upload.single("image"), async (req, res) => {
  try {
    // Upload to ImageKit
    const uploaded = await imagekit.upload({
      file: req.file.buffer, // buffer from multer
      fileName: req.file.originalname,
    });

    const newArtist = new artist({
      name: req.body.name,
      imageURL: uploaded.url,
      twetter: req.body.twetter,
      instagram: req.body.instagram,
      fileId: uploaded.fileId,
    });

    const saved = await newArtist.save();
    return res.status(200).json({ success: true, artist: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Get One Artist
router.get("/getOne/:id", async (req, res) => {
  try {
    const data = await artist.findById(req.params.id);
    if (!data) throw new Error("Artist not found");
    return res.status(200).json({ success: true, artist: data });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
});

// GET: Get All Artists
router.get("/getAll", async (req, res) => {
  try {
    const data = await artist.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Update Artist Info
router.put("/update/:id", async (req, res) => {
  try {
    const result = await artist.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        imageURL: req.body.imageURL,
        twetter: req.body.twetter,
        instagram: req.body.instagram,
      },
      { new: true }
    );

    if (!result) throw new Error("Artist not found");
    return res.status(200).json({ success: true, message: "Artist updated", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: Remove Artist and Image from ImageKit
router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await artist.findById(req.params.id);
    if (!data) throw new Error("Artist not found");

    // Delete image from ImageKit
    await imagekit.deleteFile(data.fileId);

    // Delete artist from DB
    await artist.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: "Artist deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
