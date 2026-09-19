const mongoose = require("mongoose");

const songSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    imageURL: {
      type: String,
      required: true,
    },
    songURL: {
      type: String,
      required: true,
    },
    album: {
      type: String,
      default: "Single",
      index: true,
    },
    artist: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
    },
    songId: {
      type: String,
      required: true,
      unique: true,
    },
    playsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
songSchema.index({ name: "text", artist: "text", album: "text", category: "text" });

module.exports = mongoose.model("song", songSchema);