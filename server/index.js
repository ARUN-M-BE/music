import express from "express";
import mediaRoutes from "./routes/media.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/media", mediaRoutes);

const PORT = process.env.IMAGEKIT_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
