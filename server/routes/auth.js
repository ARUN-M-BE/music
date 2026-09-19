const router = require("express").Router();
const admin = require("../config/firebase.config");
const user = require("../models/user");

// Login / Verify User Token Route
router.get("/login", async (req, res) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Invalid or missing token header" });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (!decodeValue) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userExists = await user.findOne({ user_id: decodeValue.user_id });
    if (!userExists) {
      return newUserData(decodeValue, req, res);
    } else {
      return updateNewUser(decodeValue, req, res);
    }
  } catch (error) {
    console.error("Auth token verification error:", error);
    return res.status(500).json({ success: false, message: "Authentication Error", error: error.message });
  }
});

// Helper: Create New User Record
const newUserData = async (decodeValue, req, res) => {
  const newUser = new user({
    name: decodeValue.name || "User",
    email: decodeValue.email,
    imageURL: decodeValue.picture || "",
    user_id: decodeValue.user_id,
    email_verified: decodeValue.email_verified || false,
    role: "member",
    auth_time: decodeValue.auth_time,
  });

  try {
    const savedUser = await newUser.save();
    return res.status(200).json({ success: true, user: savedUser });
  } catch (error) {
    console.error("New user creation error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Helper: Update Existing User Auth Time
const updateNewUser = async (decodeValue, req, res) => {
  const filter = { user_id: decodeValue.user_id };
  const option = { upsert: true, new: true };

  try {
    const result = await user.findOneAndUpdate(
      filter,
      { auth_time: decodeValue.auth_time },
      option
    );
    return res.status(200).json({ success: true, user: result });
  } catch (error) {
    console.error("User update error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Users Route
router.get("/getAll", async (req, res) => {
  try {
    const users = await user.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// Update User Role Route
router.put("/updateRole/:userId", async (req, res) => {
  const filter = { _id: req.params.userId };
  const role = req.body.data?.role || "member";

  try {
    const result = await user.findOneAndUpdate(filter, { role }, { new: true });
    return res.status(200).json({ success: true, user: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: "User not found or update failed" });
  }
});

// Delete User Route
router.delete("/delete/:userId", async (req, res) => {
  const filter = { _id: req.params.userId };
  try {
    const result = await user.deleteOne(filter);
    if (result.deletedCount === 1) {
      return res.status(200).json({ success: true, message: "User removed successfully" });
    }
    return res.status(404).json({ success: false, message: "User not found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "User deletion failed" });
  }
});

module.exports = router;
