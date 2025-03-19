const router = require("express").Router();

const admin = require("../config/firebase.config");
const user = require("../models/user");

router.get("/login", async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(500).json({ message: "invalid token" });
  }
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (!decodeValue) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      const userExists = await user.findOne({ user_id: decodeValue.user_id });
      if (!userExists) {
        newUserData(decodeValue, req, res);
      } else {
        return res.send("Need to Update");
      }
    }
  } catch (error) {
    res.status(505).json({ message: "Error" });
  }
});

const newUserData = async (decodeValue, req, res) => {
  const newUser = new user({
    name : decodeValue.name,
    email : decodeValue.email,
    imageURL : decodeValue.picture,
    user_id : decodeValue.user_id,
    email_verified : decodeValue.email_verified,
    role : "member",
    auth_time: decodeValue.auth_time,
  });
  try {
    const savedUser = await newUser.save();
    res.status(200).send({ user: savedUser });
  } catch (error) {
    res.status(400).send({ sucess: false, msg: error });
  }
};

module.exports = router;
