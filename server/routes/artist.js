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
// router.get("/getAll", async (req, res) => {
//   try {
//     const dataOne = await artist.find({}).sort({ createdAt: -1 });

//     if (dataOne.length > 0) {
//       return res.status(200).json({ success: true, artist: dataOne });
//     } else {
//       return res.status(404).json({ success: false, message: "No artist found" });
//     }
//   } catch (error) {
//     console.error("Error fetching artist:", error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

router.get("/getAll", async (req, res) => {

  const options ={
    sort: {
      createdAt:1
    },
  };

  const cursor = await artist.find({}).sort({ createdAt: -1 });
  if (cursor) {
    res.status(200).send({ success:true, data: cursor });
  } else{
    res.status(400).send({ sucess: false, msg: "no data found" });
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
