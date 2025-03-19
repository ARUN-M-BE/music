const router = require("express").Router();

const admin = require("../config/firebase.config");


router.get("/login", async(req, res) => {
    if (!req.headers.authorization) {
        return res.status(500).json({message :"invalid token"});
    }
    const token = req.headers.authorization.split(" ")[1];
    try {
        const decodeValue = await admin.auth().verifyIdToken(token);
        if (!decodeValue) {
            return res.status(401).json({message :"Unauthorized"});
        }
        else {
            return res.status(200).json(decodeValue);
        }
    } catch (error) {
        res.status(505).json({message :"Error"});

    }
});

module.exports = router;