const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/admin.controller");
// const { catchError } = require("common-function-api")
const { catchError } = require("../utils/catchError")
const { authorizePermissions, verifyJWT } = require("../auth/verify");

adminRouter.route("/register").post(catchError(adminController.adminRegister));
adminRouter.route("/login").post(catchError(adminController.adminLogin));
adminRouter.route("/refresh-otp").post(catchError(adminController.adminRefreshOtp));
adminRouter.route("/approved/:accountId").patch(verifyJWT, catchError(adminController.approved));
adminRouter.route("/user/getAll").get(verifyJWT, catchError(adminController.getAllUsersProfiles));
adminRouter.route("/user/single/:userId").get(verifyJWT, catchError(adminController.getSingleUserId));
adminRouter.route("/lead/getAll").get(verifyJWT, catchError(adminController.getAllLeads));
adminRouter.route("/lead/single/:leadId").get(verifyJWT, catchError(adminController.getSingleLead));
adminRouter.route("/driver/getAll").get(verifyJWT, catchError(adminController.getAllDriversProfiles));
adminRouter.route("/driver/single/:accountId").get(verifyJWT, catchError(adminController.getSingleDriver));
adminRouter.route("/vehicle/getAll").get(verifyJWT, catchError(adminController.getAllVehicles));
adminRouter.route("/vehicle/single/:vehicleId").get(verifyJWT, catchError(adminController.getSingleVehicleId));
adminRouter.route("/document/getAll").get(verifyJWT, catchError(adminController.getAllDocuments));
adminRouter.route("/document/single/:documentId").get(verifyJWT, catchError(adminController.getSingleDocument));
adminRouter.route("/agency/getAll").get(verifyJWT, catchError(adminController.getAllAgency));
adminRouter.route("/agency/single/:agencyId").get(verifyJWT, catchError(adminController.getSingleAgency));

adminRouter.patch(
    "/vehicle/approve-reject/:vehicleId",
    verifyJWT,
    authorizePermissions("admin"),
    catchError(adminController.approveVehicle)
);

adminRouter.patch(
    "/document/approve-reject/:documentId",
    verifyJWT,
    authorizePermissions("admin"),
    catchError(adminController.approveDocument)
);

adminRouter.patch(
    "/driver/approve-reject/:accountDriverId",
    verifyJWT,
    authorizePermissions("admin"),
    catchError(adminController.approveDriverProfile)
);

adminRouter.patch(
    "/lead/assign/:leadId",
    verifyJWT,
    authorizePermissions("admin"),
    catchError(adminController.assignLeadToDriver)
);
adminRouter.patch(
    "/lead/unassign/:leadId",
    verifyJWT,
    authorizePermissions("admin"),
    catchError(adminController.unassignLead)
);

module.exports = adminRouter;
