require("dotenv").config();
const express = require("express");
const ImageKit = require("imagekit");
const multer = require("multer");

const app = express();
const upload = multer();

const PORT = process.env.IMAGEKIT_PORT || 3001;

app.use(express.json());

const imagekit = new ImageKit({
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
});

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// 🧾 Auth route
app.get("/auth", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const response = await imagekit.upload({
      file: req.file.buffer,             
      fileName: req.file.originalname,   
    });

    // Return essential data
    res.status(200).json({
      success: true,
      fileId: response.fileId,
      url: response.url,
      name: response.name,
      response,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.post("/delete", async (req, res) => {
  try {
    const response = await imagekit.deleteFile(req.body.fileId);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => res.send("Hello World!"));
// app.use("/imagekit", require("./routes/imagekit"));



app.listen(PORT, () => console.log(`ImageKit Server running on port ${PORT}`));
