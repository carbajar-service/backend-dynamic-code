const accountDeiverService = require("../services/accountDriver.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

module.exports.createAccount = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const loggedInDriver = req.driver;
    const data = await accountDeiverService.createAccount(reqData, loggedInDriver);
    logger.data("successfully account created", data);
    return responser.send(200, `Successfully driver account created`, req, res, data);
};

module.exports.getAllDriverAccounts = async (req, res) => {
    const reqQuery = req.query;
    const data = await accountDeiverService.getAllDriverAccounts(reqQuery);
    logger.info(data);
    return responser.send(200, `Successfully all driver accounts fetched`, req, res, data);
};

module.exports.getOneDriverAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountDeiverService.getOneDriverAccount(reqParams.accountDriverId);
    logger.info(data);
    return responser.send(200, `Successfully single driver account fetched`, req, res, data);
};

module.exports.updateAccount = async (req, res) => {
    const reqParams = req.params;
    const reqData = req.body;
    reqData.driverId = req.driverId;
    const data = await accountDeiverService.updateAccount(reqParams.accountId, reqData);
    logger.info(data);
    return responser.send(200, `Successfully Account Updated`, req, res, data);
};

module.exports.deleteAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountDeiverService.deleteAccount(reqParams.accountId);
    logger.info(data);
    return responser.send(200, `Successfully Account Deleted`, req, res, data);
};