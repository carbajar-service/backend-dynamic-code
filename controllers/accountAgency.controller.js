const accountAgencyService = require("../services/accountAgency.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

module.exports.createAccount = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const loggedInAgency = req.driver;
    const data = await accountAgencyService.createAccount(reqData, loggedInAgency);
    logger.data("successfully account created", data);
    return responser.send(200, `Successfully agency account created`, req, res, data);
};

module.exports.getAllAgencyAccounts = async (req, res) => {
    const reqQuery = req.query;
    const data = await accountAgencyService.getAllAgencyAccounts(reqQuery);
    logger.info(data);
    return responser.send(200, `Successfully all agency accounts fetched`, req, res, data);
};

module.exports.getOneAgencyAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountAgencyService.getOneAgencyAccount(reqParams.accountAgencyId);
    logger.info(data);
    return responser.send(200, `Successfully single agency account fetched`, req, res, data);
};

module.exports.updateAccount = async (req, res) => {
    const reqParams = req.params;
    const reqData = req.body;
    reqData.agencyId = req.driverId;
    const data = await accountAgencyService.updateAccount(reqParams.accountId, reqData);
    logger.info(data);
    return responser.send(200, `Successfully Account Updated`, req, res, data);
};

module.exports.deleteAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountAgencyService.deleteAccount(reqParams.accountId);
    logger.info(data);
    return responser.send(200, `Successfully Account Deleted`, req, res, data);
};

module.exports.getProfile = async (req, res) => {
    const loggedInAgency = req.driver;
    const data = await accountAgencyService.getProfile(loggedInAgency);
    logger.info(data);
    return responser.send(200, `Successfully profile fetch`, req, res, data);
};

module.exports.updateProfileStatus = async (req, res) => {
    const loggedInAgency = req.driver;
    const reqBody = req.body;
    const data = await accountAgencyService.updateProfileStatus(loggedInAgency, reqBody);
    return responser.send(200, `Successfully profile status updated`, req, res, data);
};
