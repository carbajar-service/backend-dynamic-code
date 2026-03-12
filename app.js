// Package Imports
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { catchError } = require("./utils/catchError")
const responser = require("./utils/responser");
const globalError = require("./utils/globalError")
const routes = require("./routes/index")
const { sendPushNotification } = require("./services/firebase/sendPushNotification")

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }))
app.use(cors());
const job = require("./job/index");
const listen = require("./listeners/index");

app.use(express.static(__dirname + "/images"));
app.use("/images", express.static("images"));

// routes
routes(app)

// health
app.get("/health", catchError(async (req, res) => {
  const healthPayload = {
    projectName: 'Dynamic Backend Project',
    backEnd: 'NodeJs',
    dataBase: 'MongoDB',
    container: 'Docker Container....',
    CICD: "Git Hub...",
  }
  return responser.send(200, `${healthPayload.projectName} Health Check Up`, req, res, healthPayload)
}))

const testNotification = async (req, res) => {
  const { token, title, body } = req.body;
  try {
    const _d = {
      "_id": "68a03b3000995bc2ad7f9678",
      "name": "usman and ameen abrar"
    }
    const response = await sendPushNotification(token, title, body, _d);
    console.log(response)
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post("/send-notification", testNotification);

// global error
app.use(globalError.errorHandler)

module.exports = app
