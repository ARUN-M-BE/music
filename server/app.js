const express = require('express');
const app = express();
const cors = require('cors');
const {default :mongoose } = require("mongoose");
require("dotenv/config");

app.use(cors( {origin: true, credentials: true} ));

const port = 3000;
app.get('/', (req, res) => {    
    res.send('Hello World!');
    }
);

// user authentication
const userRouter = require("./routes/auth");
app.use("/api/users", userRouter);

mongoose.connect(process.env.DATABASE_STRING, {
  useNewUrlParser: true,
});
mongoose.connection
.once("open", () => {
  console.log("Connected to database");
})
.on("error", (error) => {
  console.log("Error: ", error);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});