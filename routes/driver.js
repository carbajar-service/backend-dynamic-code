const express = require("express");
const driverRouter = express.Router();
const driverController = require("../controllers/driver.controller");
const { catchError } = require("../utils/catchError")
const { authorizePermissions, verifyJWT } = require("../auth/verify");

driverRouter.route("/register").post(catchError(driverController.driverRegister));
driverRouter.route("/login").post(catchError(driverController.driverLogin));
driverRouter.route("/refresh-otp").post(catchError(driverController.driverRefreshOtp));

driverRouter.route("/matchingLeads")
    .get(verifyJWT, authorizePermissions("driver"), catchError(driverController.getDriverMatchingLeads));

driverRouter.route("/accept/:leadId")
    .patch(verifyJWT, authorizePermissions("driver"), catchError(driverController.acceptLeadByDriver));

driverRouter.route("/started/:leadId")
    .patch(verifyJWT, authorizePermissions("driver"), catchError(driverController.startRideByDriver));

driverRouter.route("/cancelled/:leadId")
    .patch(verifyJWT, authorizePermissions("driver"), catchError(driverController.cancelRideByDriver));

driverRouter.route("/completed/:leadId")
    .patch(verifyJWT, authorizePermissions("driver"), catchError(driverController.completeRideByDriver));

driverRouter.route("/driverhistory")
    .get(verifyJWT, authorizePermissions("driver"), catchError(driverController.getDriverHistory));

driverRouter.route("/earning")
    .get(verifyJWT, authorizePermissions("driver"), catchError(driverController.getDriverEarnings));


module.exports = driverRouter;
