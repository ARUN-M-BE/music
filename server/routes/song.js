const router = require("express").Router();

const song = require("../models/song");

router.post("/save", async (req, res) => {
  const newSong = song({
    name: req.body.name,
    imageURL: req.body.imageURL,
    songURL: req.body.songURL,
    album: req.body.album,
    artist: req.body.artist,
    language: req.body.language,
    category: req.body.category,
  });
  try {
    const saveedSong = await newSong.save();
    return res.status(200).send({ success: true, song: saveedSong });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.get("/getOne/:id", async (req, res) => {
  // return res.json(req.params.id);

  const filter = { _id: req.params.id };
  const dataOne = await song.findOne(filter);
  if (dataOne) {
    return res.status(200).send({ success: true, song: dataOne });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "song not found" });
  }
});
router.get("/getAll", async (req, res) => {
  try {
    const dataOne = await song.find({}).sort({ createdAt: -1 });

    if (dataOne.length > 0) {
      return res.status(200).json({ success: true, song: dataOne });
    } else {
      return res.status(404).json({ success: false, message: "No song found" });
    }
  } catch (error) {
    console.error("Error fetching song:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.put("/update/:id", async (req, res) => {
  const filter = { _id: req.params.id };
  const options = {
    upsert: true,
    new: true,
  };
  try {
    const result = await song.findOneAndUpdate(
      filter,
      {
        name: req.body.name,
        imageURL: req.body.imageURL,
        songURL: req.body.songURL,
        album: req.body.album,
        artist: req.body.artist,
        language: req.body.language,
        category: req.body.category,
      },
      options
    );
    return res
      .status(200)
      .send({ success: true, message: "song updated", dataOne: result });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const filter = { _id: req.params.id };
  const result = await song.deleteOne(filter);
  if (result) {
    return res
      .status(200)
      .send({ success: true, message: "song deleted", dataOne: result });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "song not found" });
  }
});

module.exports = router;

