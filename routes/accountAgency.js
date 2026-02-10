const express = require("express");
const accountAgencyRouter = express.Router();
const accountAgencyController = require("../controllers/accountAgency.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");

accountAgencyRouter
    .route("/createAccount")
    .post(verifyJWT, authorizePermissions("agency"), catchError(accountAgencyController.createAccount));
accountAgencyRouter
    .route("/getSingleAccount/:accountAgencyId")
    .get(catchError(accountAgencyController.getOneAgencyAccount));
accountAgencyRouter
    .route("/getAllAccounts")
    .get(catchError(accountAgencyController.getAllAgencyAccounts));
accountAgencyRouter
    .route("/updateAccount/:accountId")
    .patch(verifyJWT, authorizePermissions("agency"), catchError(accountAgencyController.updateAccount));
accountAgencyRouter
    .route("/deleteAccount/:accountId")
    .delete(verifyJWT, authorizePermissions("agency"), catchError(accountAgencyController.deleteAccount));
accountAgencyRouter
    .route("/getProfile")
    .get(verifyJWT, authorizePermissions("agency"), catchError(accountAgencyController.getProfile));
accountAgencyRouter
    .route("/profileCompleted")
    .patch(verifyJWT, authorizePermissions("agency"), catchError(accountAgencyController.updateProfileStatus));

module.exports = accountAgencyRouter;
