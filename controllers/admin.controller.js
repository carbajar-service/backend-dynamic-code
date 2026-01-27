const adminService = require("../services/admin.services");
const logger = require("../utils/logs");
const responser = require("../utils/responser")

module.exports.adminRegister = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const data = await adminService.adminRegister(reqData);
    logger.data("successfully register created", data);
    return responser.send(200, "successFully admin Registed", req, res, data);
};

module.exports.adminLogin = async (req, res) => {
    logger.info("Creating The Login");
    const reqData = req.body;
    const data = await adminService.adminLogin(reqData);
    logger.data(data);
    return responser.send(200, "successfully admin login", req, res, data);
};

module.exports.adminRefreshOtp = async (req, res) => {
    logger.info("Refresh Otp");
    const reqData = req.body;
    const data = await adminService.refreshOtp(reqData);
    logger.data(data);
    return responser.send(200, "successfully refresh otp sent admin", req, res, data);
};

// get all driver profile 
module.exports.getAllUsersProfiles = async (req, res) => {
    logger.info("getAllUsersProfiles");
    const data = await adminService.getAllUsersProfiles(req.query);
    logger.data(data);
    return responser.send(200, "Successfully users account fetched by admin", req, res, data);
};

// get single profile
module.exports.getSingleUserId = async (req, res) => {
    logger.info("getSingleUserId");
    const data = await adminService.getSingleUserId(req.params.userId);
    logger.data(data);
    return responser.send(200, "Successfully single account fetched by admin", req, res, data);
};

// get all driver profile 
module.exports.getAllDriversProfiles = async (req, res) => {
    logger.info("getAllDriversProfiles");
    const data = await adminService.getAllDriversProfiles(req.query);
    logger.data(data);
    return responser.send(200, "Successfully drivers account fetched by admin", req, res, data);
};

// get single profile
module.exports.getSingleDriver = async (req, res) => {
    logger.info("getSingleDriver");
    const data = await adminService.getSingleDriver(req.params.accountId);
    logger.data(data);
    return responser.send(200, "Successfully single account fetched by admin", req, res, data);
};

// get all leads 
module.exports.getAllLeads = async (req, res) => {
    logger.info("getAllLeads");
    const data = await adminService.getAllLeads(req.query);
    logger.data(data);
    return responser.send(200, "Successfully leads fetched by admin", req, res, data);
};

// get single lead
module.exports.getSingleLead = async (req, res) => {
    logger.info("getSingleDriver");
    const data = await adminService.getSingleLead(req.params.leadId);
    logger.data(data);
    return responser.send(200, "Successfully single lead fetched by admin", req, res, data);
};

module.exports.approveVehicle = async (req, res) => {
    logger.info("Controller: Approve Vehicle");

    const { vehicleId } = req.params;
    const reqData = req.body;
    const admin = req.admin; // from verifyJWT
    const data = await adminService.approveVehicleTx(
        vehicleId,
        reqData,
        admin._id
    );
    logger.data("Vehicle approval success", data);
    return responser.send(
        200,
        `Vehicle ${reqData.status} successfully`,
        req,
        res,
        data
    );
};

/**
 * ======================================================
 * APPROVE / REJECT DOCUMENT
 * ======================================================
 */
module.exports.approveDocument = async (req, res) => {
    logger.info("Controller: Approve Document");
    const { documentId } = req.params;
    const reqData = req.body;
    const admin = req.admin;
    const data = await adminService.approveDocumentTx(
        documentId,
        reqData,
        admin._id
    );
    logger.data("Document approval success", data);
    return responser.send(
        200,
        `Document ${reqData.status} successfully`,
        req,
        res,
        data
    );
};

/**
 * ======================================================
 * APPROVE / REJECT DRIVER PROFILE
 * ======================================================
 */
module.exports.approveDriverProfile = async (req, res) => {
    logger.info("Controller: Approve Driver Profile");
    const { accountDriverId } = req.params;
    const reqData = req.body;
    const admin = req.admin;
    const data = await adminService.approveDriverProfileTx(
        accountDriverId,
        reqData,
        admin._id
    );
    logger.data("Driver profile approval success", data);
    return responser.send(
        200,
        `Driver profile ${reqData.status} successfully`,
        req,
        res,
        data
    );
};

// get single vehicle
module.exports.getSingleVehicleId = async (req, res) => {
    logger.info("getSingleUserId");
    const data = await adminService.getSingleVehicle(req.params.vehicleId);
    logger.data(data);
    return responser.send(200, "Successfully single vehicle fetched by admin", req, res, data);
};

// get all driver vehicle
module.exports.getAllVehicles = async (req, res) => {
    logger.info("getAllVehicles");
    const data = await adminService.getAllVehicles(req.query);
    logger.data(data);
    return responser.send(200, "Successfully vehicles fetched by admin", req, res, data);
};

// get single document
module.exports.getSingleDocument = async (req, res) => {
    logger.info("getSingleDocument");
    const data = await adminService.getSingleDocument(req.params.documentId);
    logger.data(data);
    return responser.send(200, "Successfully single document fetched by admin", req, res, data);
};

// get all driver document
module.exports.getAllDocuments = async (req, res) => {
    logger.info("getAllDocuments");
    const data = await adminService.getAllDocuments(req.query);
    logger.data(data);
    return responser.send(200, "Successfully documents fetched by admin", req, res, data);
};
// get single agency
module.exports.getSingleAgency = async (req, res) => {
    logger.info("getSingleagency");
    const data = await adminService.getSingleAgency(req.params.agencyId);
    logger.data(data);
    return responser.send(200, "Successfully single agency fetched by admin", req, res, data);
};

// get all driver document
module.exports.getAllAgency = async (req, res) => {
    logger.info("getAllAagency");
    const data = await adminService.getAllAgencyProfiles(req.query);
    logger.data(data);
    return responser.send(200, "Successfully agencies fetched by admin", req, res, data);
};

module.exports.assignLeadToDriver = async (req, res) => {
    logger.info("Controller: Admin assign lead to driver");
    const { leadId } = req.params;
    const { driverId } = req.body;
    const admin = req.admin; // from verifyJWT

    const data = await adminService.assignLeadByAdminToDriver(
        leadId,
        driverId,
        admin
    );

    logger.data("Lead assigned to driver successfully", data);

    return responser.send(
        200,
        "Lead assigned to driver successfully",
        req,
        res,
        data
    );
};

module.exports.unassignLead = async (req, res) => {
    logger.info("Controller: Admin unassign lead");

    const { leadId } = req.params;
    const admin = req.admin; // from verifyJWT

    const data = await adminService.unassignLeadByAdmin(
        leadId,
        admin
    );

    logger.data("Lead unassigned successfully", data);

    return responser.send(
        200,
        "Lead unassigned successfully",
        req,
        res,
        data
    );
};

module.exports.updateLeadByAdmin = async (req, res) => {
    logger.info("Controller: Admin unassign lead");

    const { leadId } = req.params;
    const admin = req.admin; // from verifyJWT

    const data = await adminService.updateLeadByAdmin(
        leadId,
        req.body
    );

    logger.data("Lead updated successfully", data);

    return responser.send(
        200,
        "Lead updated successfully",
        req,
        res,
        data
    );
};