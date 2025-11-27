const express = require("express");
const leadRouter = express.Router();
const leadController = require("../controllers/lead.controller");
const { catchError } = require("../utils/catchError");
const { authorizePermissions, verifyJWT } = require("../auth/verify");

// Create Lead (User)
leadRouter
    .route("/create")
    .post(verifyJWT, authorizePermissions("user"), catchError(leadController.createLead));

// Get My Leads (User)
leadRouter
    .route("/myLead")
    .get(verifyJWT, authorizePermissions("user"), catchError(leadController.getMyLeads));

// Update My Lead (User)
leadRouter
    .route("/my/update/:leadId")
    .patch(verifyJWT, authorizePermissions("user"), catchError(leadController.updateMyLead));

// Delete My Lead (User)
leadRouter
    .route("/my/delete/:leadId")
    .delete(verifyJWT, authorizePermissions("user"), catchError(leadController.deleteMyLead));

leadRouter
    .route("/cancel/:leadId")
    .patch(verifyJWT, authorizePermissions("user"), catchError(leadController.cancelMyLead));

leadRouter
    .route("/cancel-history")
    .get(verifyJWT, authorizePermissions("user"), catchError(leadController.getCancellationHistory));


// Admin - Get All Leads

module.exports = leadRouter;
