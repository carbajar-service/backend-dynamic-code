const express = require("express");
const accountDriverRouter = express.Router();
const accountDriverController = require("../controllers/accountDriver.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");
// const vehicleController = require("../controllers/vehicle.controller");
// const driverDocumentController = require("../controllers/driverDocument.controller");


accountDriverRouter
    .route("/createAccount")
    .post(verifyJWT, authorizePermissions("driver","individual","agency"), catchError(accountDriverController.createAccount));
accountDriverRouter
    .route("/getSingleAccount/:accountDriverId")
    .get(catchError(accountDriverController.getOneDriverAccount));
accountDriverRouter
    .route("/getAllAccounts")
    .get(catchError(accountDriverController.getAllDriverAccounts));
accountDriverRouter
    .route("/updateAccount/:accountId")
    .patch(verifyJWT, authorizePermissions("driver","individual","agency"), catchError(accountDriverController.updateAccount));
accountDriverRouter
    .route("/deleteAccount/:accountId")
    .delete(verifyJWT, authorizePermissions("driver","individual","agency"), catchError(accountDriverController.deleteAccount));

// vehicle 
accountDriverRouter
    .route("/vehicle")
    .post(
        verifyJWT,
        authorizePermissions("driver","individual","agency"),
        catchError(accountDriverController.createVehicle)
    );

accountDriverRouter
    .route("/vehicle/my")
    .get(
        verifyJWT,
        authorizePermissions("driver","individual","agency"),
        catchError(accountDriverController.getMyVehicles)
    );

// document
accountDriverRouter
    .route("/document")
    .post(
        verifyJWT,
        authorizePermissions("driver","individual","agency"),
        catchError(accountDriverController.createDocument)
    );

accountDriverRouter
    .route("/document/my")
    .get(
        verifyJWT,
        authorizePermissions("driver","individual","agency"),
        catchError(accountDriverController.getMyDocuments)
    );

accountDriverRouter
    .route("/document/:documentId")
    .patch(
        verifyJWT,
        authorizePermissions("driver","individual","agency"),
        catchError(accountDriverController.updateDriverDocument)
    );


module.exports = accountDriverRouter;
