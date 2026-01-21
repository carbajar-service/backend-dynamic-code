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

// TODO
module.exports.approved = async (req, res) => {
    logger.info("Refresh Otp");
    const reqData = req.body;
    const loggedIn = req.adminId;
    const data = await adminService.approveDriverFullProfileTx(req.params.accountId, reqData, loggedIn);
    logger.data(data);
    return responser.send(200, "Successfully account approved by admin", req, res, data);
};