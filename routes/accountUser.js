const express = require("express");
const accountUserRouter = express.Router();
const accountUserController = require("../controllers/accountUser.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");

accountUserRouter
    .route("/createAccount")
    .post(verifyJWT, authorizePermissions("user"), catchError(accountUserController.createAccount));
accountUserRouter
    .route("/getSingleAccount/:accountId")
    .get(catchError(accountUserController.getOneUserAccount));
accountUserRouter
    .route("/updateAccount/:accountId")
    .patch(verifyJWT, authorizePermissions("user"), catchError(accountUserController.updateAccount));
accountUserRouter
    .route("/deleteAccount/:accountId")
    .delete(verifyJWT, authorizePermissions("user"), catchError(accountUserController.deleteAccount));
accountUserRouter
    .route("/myAccount")
    .get(verifyJWT, authorizePermissions("user"), catchError(accountUserController.myAccountLoggedIn));

module.exports = accountUserRouter;
