const authService = require("../services/auth.services");
const logger = require("../utils/logs");
const responser = require("../utils/responser")

module.exports.register = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    console.log("reqdata", reqData);
    const data = await authService.createRegister(reqData);
    logger.data("successfully register created", data);
    return responser.send(200, "successFully User Registed", req, res, data);
};

module.exports.login = async (req, res) => {
    logger.info("Creating The Login");
    const reqData = req.body;
    const data = await authService.authLogin(reqData);
    logger.data("successfully user login", data);
    return responser.send(200, "successfully user login", req, res, data);
};

module.exports.refreshOtp = async (req, res) => {
    logger.info("sending otp");
    const reqData = req.body;
    const data = await authService.refreshOtp(reqData);
    logger.data(data);
    return responser.send(200, "successfully refresh otp sent to user", req, res, data);
};
