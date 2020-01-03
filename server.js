const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const port = process.env.port || 5000;
const todoRoutes = require("./routes");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/build")));
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.use("/todos", todoRoutes);

mongoose
  .connect(
    "mongodb+srv://user1:hanuman12@cluster0-brjl9.mongodb.net/todos?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to Database");
  })
  .catch(err => {
    console.log("Not Connected to Database ERROR! ", err);
  });

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Mongo connection established successfully");
});
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
