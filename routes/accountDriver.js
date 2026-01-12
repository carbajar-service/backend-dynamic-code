const express = require("express");
const accountDriverRouter = express.Router();
const accountDriverController = require("../controllers/accountDriver.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");

accountDriverRouter
    .route("/createAccount")
    .post(verifyJWT, authorizePermissions("driver", "individual", "agency"), catchError(accountDriverController.createAccount));
accountDriverRouter
    .route("/getSingleAccount/:accountDriverId")
    .get(catchError(accountDriverController.getOneDriverAccount));
accountDriverRouter
    .route("/getAllAccounts")
    .get(catchError(accountDriverController.getAllDriverAccounts));
accountDriverRouter
    .route("/updateAccount/:accountId")
    .patch(verifyJWT, authorizePermissions("driver", "individual", "agency"), catchError(accountDriverController.updateAccount));
accountDriverRouter
    .route("/deleteAccount/:accountId")
    .delete(verifyJWT, authorizePermissions("driver", "individual", "agency"), catchError(accountDriverController.deleteAccount));
accountDriverRouter
    .route("/getProfile")
    .get(verifyJWT, authorizePermissions("driver", "individual", "agency"), catchError(accountDriverController.getProfile));
accountDriverRouter
    .route("/profileCompleted")
    .patch(verifyJWT, authorizePermissions("driver", "individual", "agency"), catchError(accountDriverController.updateProfileStatus));

// vehicle 
accountDriverRouter
    .route("/vehicle")
    .post(
        verifyJWT,
        authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.createVehicle)
    );

accountDriverRouter
    .route("/vehicle/my")
    .get(
        verifyJWT,
        authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.getMyVehicles)
    );

accountDriverRouter
    .route("/vehicle/getVehicleById/:vehicleId")
    .get(
        // verifyJWT,
        // authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.getVehicleById)
    );

// document
accountDriverRouter
    .route("/document")
    .post(
        verifyJWT,
        authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.createDocument)
    );

accountDriverRouter
    .route("/document/my")
    .get(
        verifyJWT,
        authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.getMyDocuments)
    );

accountDriverRouter.route(
    "/document/getSingleDoc/:documentId")
    .get(verifyJWT,
        authorizePermissions("driver", "individual", "agency"),
        catchError(accountDriverController.getMyDocumentById)
    )


module.exports = accountDriverRouter;
