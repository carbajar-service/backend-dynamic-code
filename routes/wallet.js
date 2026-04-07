const express = require("express");
const WalletController = require("../controllers/wallet.controller");
const {catchError} = require("../utils/catchError");
const { verifyJWT, authorizePermissions } = require("../auth/verify");

const walletRouter = express.Router();

// User routes
walletRouter.use(verifyJWT); // Ensure all routes require auth
walletRouter.get("/driver-Wallet", catchError(WalletController.getMyWalletByDriver));
walletRouter.get("/transactions", catchError(WalletController.getTransactions));

module.exports = walletRouter;
