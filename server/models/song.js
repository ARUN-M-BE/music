const mongoose = require("mongoose");
const album = require("./album");
const artist = require("./artist");

const songSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    imageURL: {
        type: String,
        required: true,
    },
    songURL: {
        type: Number,
        required: true,
    },
    album: {
        type: Number,
    },
    artist: {
        type: Number,
        required: true,
    },
    language: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("song", songSchema);