const express = require("express");
const paymentRouter = express.Router();
const paymentController = require("../controllers/payment/payment.controller");
const leadPaymentController = require("../controllers/payment/paymentLead.controller");
const { catchError } = require("../utils/catchError")
const authorized = require("../auth/verify");

// wallet started
paymentRouter.route("/topup").post(authorized.verifyJWT, catchError(paymentController.topupWallet));
paymentRouter
    .route("/verify")
    .post(authorized.verifyJWT, catchError(paymentController.verifyPayment));

// lead payment 
paymentRouter.route("/lead/createLeadOrder")
    .post(authorized.verifyJWT, catchError(leadPaymentController.createLeadPayment));
paymentRouter
    .route("/lead/verifyLead")
    .post(authorized.verifyJWT, catchError(leadPaymentController.verifyLeadPayment));
// MY PAYMENTS
paymentRouter
    .route("/lead/myPayments")
    .get(authorized.verifyJWT, catchError(leadPaymentController.getMyPayments));

// SINGLE PAYMENT
paymentRouter
    .route("/lead/single/:paymentId")
    .get(authorized.verifyJWT, catchError(leadPaymentController.getSinglePayment));

// ADMIN ALL PAYMENTS
paymentRouter
    .route("/admin/lead-payment/all")
    .get(authorized.verifyJWT, catchError(leadPaymentController.getAllPaymentsAdmin));

module.exports = paymentRouter;
