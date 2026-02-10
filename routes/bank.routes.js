import express from "express";
import bankController from "../controllers/bank.controller.js";
import catchError from "../core/catachError.js";
import { verifyAuth, authorizePermissions } from "../middlewares/auth.js";

const bankRouter = express.Router();

// ✅ Apply auth middleware to all bank routes
bankRouter.use(verifyAuth);

// 🏦 Bank Transfer Routes
bankRouter.post("/bank-transfer", catchError(bankController.createBankTransfer));
bankRouter.get("/bank-transfer", catchError(bankController.getAllBankTransfers));
bankRouter.get("/bank-transfer/:id", catchError(bankController.getOneBankTransfer));
bankRouter.delete("/bank-transfer/:id", catchError(bankController.deleteBankTransfer));

// 💳 UPI Routes
bankRouter.post("/upi/create", catchError(bankController.createUpi));
bankRouter.get("/upi", catchError(bankController.getAllUpis));
bankRouter.get("/upi/:id", catchError(bankController.getOneUpi));
bankRouter.delete("/upi/:id", catchError(bankController.deleteUpi));

export default bankRouter;
