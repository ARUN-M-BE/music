const express = require("express");
const router = express.Router();
const multer = require("multer");
const ImageKit = require("imagekit");

// Setup ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Upload a file (image or song)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const uploaded = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
    });

    const isAudio = req.file.mimetype.startsWith("audio/");
    const responsePayload = isAudio
      ? { songURL: uploaded.url, fileId: uploaded.fileId }
      : { imageURL: uploaded.url, fileId: uploaded.fileId };

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      ...responsePayload,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
});

// DELETE: Delete file from ImageKit by fileId
router.delete("/delete/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    await imagekit.deleteFile(fileId);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Delete failed",
    });
  }
});

module.exports = router;
