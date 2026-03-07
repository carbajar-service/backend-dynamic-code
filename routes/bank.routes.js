const express = require("express");
const bankController = require("../controllers/bank.controller.js");
const { catchError } = require("../utils/catchError")
const { authorizePermissions, verifyJWT } = require("../auth/verify");
const bankRouter = express.Router();

// ✅ Apply auth middleware to all bank routes
bankRouter.use(verifyJWT);

// 🏦 Bank Transfer Routes
bankRouter.post("/bank-transfer", catchError(bankController.createBankTransfer));
bankRouter.get("/bank-transfers", catchError(bankController.getAllBankTransfers));
bankRouter.get("/bank-transfer/:id", catchError(bankController.getOneBankTransfer));
bankRouter.delete("/bank-transfer/:id", catchError(bankController.deleteBankTransfer));

module.exports = bankRouter;