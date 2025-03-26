const router = require("express").Router();

router.get("/getAll", async (req, res) => {
  return res.json("getting all albums")
});

module.exports = router;