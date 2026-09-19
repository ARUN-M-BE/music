const router = require("express").Router();
const song = require("../models/song");

// Save New Song
router.post("/save", async (req, res) => {
  const { name, imageURL, songURL, album, artist, language, category, fileId, songId } = req.body;

  if (!name || !imageURL || !songURL || !artist || !category) {
    return res.status(400).json({ success: false, message: "Missing required song fields" });
  }

  const newSong = new song({
    name,
    imageURL,
    songURL,
    album: album || "Single",
    artist,
    language: language || "English",
    category,
    fileId: fileId || `file_${Date.now()}`,
    songId: songId || `song_${Date.now()}`,
  });

  try {
    const savedSong = await newSong.save();
    return res.status(201).json({ success: true, song: savedSong });
  } catch (error) {
    console.error("Save song error:", error);
    return res.status(500).json({ success: false, message: "Failed to save song", error: error.message });
  }
});

// Get Single Song
router.get("/getOne/:id", async (req, res) => {
  try {
    const dataOne = await song.findById(req.params.id);
    if (!dataOne) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    return res.status(200).json({ success: true, song: dataOne });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching song" });
  }
});

// Get All Songs (with search and category filter)
router.get("/getAll", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
        { album: { $regex: search, $options: "i" } },
      ];
    }

    const songs = await song.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: songs, songs });
  } catch (error) {
    console.error("Get all songs error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch songs" });
  }
});

// Increment Song Play Count
router.put("/play/:id", async (req, res) => {
  try {
    const updated = await song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playsCount: 1 } },
      { new: true }
    );
    return res.status(200).json({ success: true, song: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to record song play" });
  }
});

// Update Song
router.put("/update/:id", async (req, res) => {
  try {
    const updatedSong = await song.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    if (!updatedSong) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    return res.status(200).json({ success: true, message: "Song updated", song: updatedSong });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update song" });
  }
});

// Delete Song
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await song.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    return res.status(200).json({ success: true, message: "Song deleted successfully", dataOne: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete song" });
  }
});

module.exports = router;
