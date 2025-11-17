const driverService = require("../services/driver.services");
const logger = require("../utils/logs");
const responser = require("../utils/responser")

module.exports.driverRegister = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const data = await driverService.driverRegister(reqData);
    logger.data("successfully register created", data);
    return responser.send(200, "successFully driver Registed", req, res, data);
};

module.exports.driverLogin = async (req, res) => {
    logger.info("Creating The Login");
    const reqData = req.body;
    const data = await driverService.driverLogin(reqData);
    logger.data(data);
    return responser.send(200, "successfully driver login", req, res, data);
};

module.exports.driverRefreshOtp = async (req, res) => {
    logger.info("Refresh Otp");
    const reqData = req.body;
    const data = await driverService.refreshOtp(reqData);
    logger.data(data);
    return responser.send(200, "successfully refresh otp sent driver", req, res, data);
};
