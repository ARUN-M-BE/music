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

router.get("/getOne/:id", async (req, res) => {
  // return res.json(req.params.id);

  const filter = { _id: req.params.id };
  const dataOne = await artist.findOne(filter);
  if (dataOne) {
    return res.status(200).send({ success: true, artist: dataOne });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "Artist not found" });
  }
});

router.get("/getAll", async (req, res) => {
  const options = {
    sort: { createdAt: 1 },
  };
  const dataOne = await artist.find(options);
  if (dataOne) {
    return res.status(200).send({ success: true, artist: dataOne });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "Artist not found" });
  }
});

router.put("/update/:id", async (req, res) => {
  const filter = { _id: req.params.id };
  const options = {
    upsert: true,
    new: true,
  };
  try {
    const result = await artist.findOneAndUpdate(
      filter,
      {
        name: req.body.name,
        imageURL: req.body.imageURL,
        twetter: req.body.twetter,
        instagram: req.body.instagram,
      },
      options
    );
    return res
      .status(200)
      .send({ success: true, message: "Artist updated", dataOne: result });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const filter = { _id: req.params.id };
  const result = await artist.deleteOne(filter);
  if (result) {
    return res
      .status(200)
      .send({ success: true, message: "Artist deleted", dataOne: result });
  } else {
    return res
      .status(400)
      .send({ success: false, message: "Artist not found" });
  }
});

module.exports = router;
