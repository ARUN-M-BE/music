const router = require("express").Router();

const artist = require("../models/artist");

router.post("/save", async (req, res) => {
  const newArtist = artist({
    name: req.body.name,
    imageURL: req.body.imageURL,
    twetter: req.body.twetter,
    instagram: req.body.instagram,
  });
  try {
    const saveedArtist = await newArtist.save();
    return res.status(200).send({ success: true, artist: saveedArtist });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });

  }
});

module.exports = router;
