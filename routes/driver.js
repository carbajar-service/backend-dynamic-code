const express = require("express");
const driverRouter = express.Router();
const driverController = require("../controllers/driver.controller");
// const { catchError } = require("common-function-api")
const { catchError } = require("../utils/catchError")

driverRouter.route("/register").post(catchError(driverController.driverRegister));
driverRouter.route("/login").post(catchError(driverController.driverLogin));
driverRouter.route("/refresh-otp").post(catchError(driverController.driverRefreshOtp));

module.exports = driverRouter;
