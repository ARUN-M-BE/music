import express from "express";
import multer from "multer";
import imagekit from "../imagekit.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /api/media/upload
 * Upload an image and return fileId and other metadata
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const uploadResponse = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: "/music-app",
    });

    // This includes fileId, URL, etc.
    res.json({
      success: true,
      message: "Image uploaded successfully!",
      data: {
        fileId: uploadResponse.fileId,
        url: uploadResponse.url,
        name: uploadResponse.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/media/delete/:fileId
 * Delete an image by fileId
 */
router.delete("/delete/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const deleteResponse = await imagekit.deleteFile(fileId);

    res.json({
      success: true,
      message: "Image deleted successfully!",
      result: deleteResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
