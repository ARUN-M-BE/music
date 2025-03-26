const mongoose = require("mongoose");

const albumSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    imageURL: {
        type: String,
        required: true,
    },
    // artist: {
    //     type: String,
    //     required: true,
    // },
    // genre: {
    //     type: String,
    //     required: true,
    // },
    // year: {
    //     type: Number,
    //     required: true,
    // },
    // album_id: {
    //     type: String,
    //     required: true,
    // },
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("album", albumSchema);