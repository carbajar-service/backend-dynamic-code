const express = require("express");
const accountDriverRouter = express.Router();
const accountDriverController = require("../controllers/accountDriver.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");

accountDriverRouter
    .route("/createAccount")
    .post(verifyJWT, authorizePermissions("driver"), catchError(accountDriverController.createAccount));
accountDriverRouter
    .route("/getSingleAccount/:accountDriverId")
    .get(catchError(accountDriverController.getOneDriverAccount));
accountDriverRouter
    .route("/getAllAccounts")
    .get(catchError(accountDriverController.getAllDriverAccounts));
accountDriverRouter
    .route("/updateAccount/:accountId")
    .patch(verifyJWT, authorizePermissions("driver"), catchError(accountDriverController.updateAccount));
accountDriverRouter
    .route("/deleteAccount/:accountId")
    .delete(verifyJWT, authorizePermissions("driver"), catchError(accountDriverController.deleteAccount));

module.exports = accountDriverRouter;
