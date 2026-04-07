const express = require("express");
const paymentRouter = express.Router();
const paymentController = require("../controllers/payment/payment.controller");
const { catchError } = require("../utils/catchError")
const authorized = require("../auth/verify");

paymentRouter.route("/topup").post(authorized.verifyJWT, catchError(paymentController.topupWallet));
paymentRouter
    .route("/verify")
    .post(authorized.verifyJWT, catchError(paymentController.verifyPayment));

module.exports = paymentRouter;
