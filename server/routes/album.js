const router = require("express").Router();
const album = require("../models/album");
router.post("/save", async (req, res) => {
  const newAlbum = album({
    name: req.body.name,
    imageURL: req.body.imageURL,
  });
  try {
    const saveedAlbum = await newAlbum.save();
    return res.status(200).send({ success: true, album: saveedAlbum });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.get("/getOne/:id", async (req, res) => {

  const filter = { _id: req.params.id };
  const dataOne = await album.findOne(filter);
  if (dataOne) {
    return res.status(200).send({ success: true, album: dataOne });
  } else {
    return res.status(400).send({ success: false, message: "album not found" });
  }
});

router.get("/getAll", async (req, res) => {
  try {
    const dataOne = await album.find({}).sort({ createdAt: -1 });

    if (dataOne.length > 0) {
      return res.status(200).json({ success: true, album: dataOne });
    } else {
      return res.status(404).json({ success: false, message: "No albums found" });
    }
  } catch (error) {
    console.error("Error fetching albums:", error);
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
    const result = await album.findOneAndUpdate(
      filter,
      {
        name: req.body.name,
        imageURL: req.body.imageURL,
      },
      options
    );
    return res
      .status(200)
      .send({ success: true, message: "album updated", dataOne: result });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const filter = { _id: req.params.id };
  const result = await album.deleteOne(filter);
  if (result) {
    return res
      .status(200)
      .send({ success: true, message: "album deleted", dataOne: result });
  } else {
    return res.status(400).send({ success: false, message: "album not found" });
  }
});

module.exports = router;
