const driverService = require("../services/driver.services");
const logger = require("../utils/logs");
const responser = require("../utils/responser")

module.exports.driverRegister = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const data = await driverService.driverRegister(reqData);
    logger.data("successfully register created", data);
    return responser.send(200, `Successfully ${data.accountType} registed`, req, res, data);
};

module.exports.driverLogin = async (req, res) => {
    logger.info("Creating The Login");
    const reqData = req.body;
    const data = await driverService.driverLogin(reqData);
    logger.info(data);
    return responser.send(200, "successfully driver login", req, res, data);
};

module.exports.driverRefreshOtp = async (req, res) => {
    logger.info("Refresh Otp");
    const reqData = req.body;
    const data = await driverService.refreshOtp(reqData);
    logger.info(data);
    return responser.send(200, "successfully refresh otp sent driver", req, res, data);
};

module.exports.getDriverMatchingLeads = async (req, res) => {
    logger.info("Get Driver Matching Leads");
    const loggedIn = req.driver;
    const data = await driverService.getDriverMatchingLeads(loggedIn);
    logger.info(data);
    return responser.send(200, "Matching Leads Fetched", req, res, data);
};

module.exports.acceptLeadByDriver = async (req, res) => {
    logger.info("Accept Lead By Driver");
    const params = req.params;
    const loggedIn = req.driver;
    const result = await driverService.acceptLeadByDriver(params.leadId, loggedIn);
    return responser.send(200, "Lead Accepted Successfully", req, res, result);
};

module.exports.startRideByDriver = async (req, res) => {
    logger.info("Confirm Trip Start");
    const params = req.params;
    const loggedIn = req.driver;
    const result = await driverService.startRideByDriver(params.leadId, loggedIn);
    return responser.send(200, "Successfully ride started", req, res, result);
};

module.exports.cancelRideByDriver = async (req, res) => {
    logger.info("Cancel Ride By Driver");
    const params = req.params;
    const loggedIn = req.driver;
    const reqData = req.body;
    const result = await driverService.cancelRideByDriver(params.leadId, loggedIn, reqData);
    return responser.send(200, "Successfully lead cancelled", req, res, result);
};

module.exports.completeRideByDriver = async (req, res) => {
    logger.info("Cancel Ride By Driver");
    const params = req.params;
    const loggedIn = req.driver;
    const result = await driverService.completeRideByDriver(params.leadId, loggedIn);
    return responser.send(200, "Successfully lead completed", req, res, result);
};

module.exports.getDriverHistory = async (req, res) => {
    logger.info("Get Driver History");
    const queryData = req.query;
    const loggedIn = req.driver;
    const result = await driverService.getDriverHistory(loggedIn, queryData);
    return responser.send(200, "Successfully driver history fetched", req, res, result);
};

module.exports.getDriverEarnings = async (req, res) => {
    logger.info("Get Driver Earnings");
    const queryData = req.query;
    const loggedIn = req.driver;
    const result = await driverService.getDriverEarnings(loggedIn, queryData);
    return responser.send(200, "Successfully driver earnings fetched", req, res, result);
};
