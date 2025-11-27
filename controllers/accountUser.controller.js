const accountUserService = require("../services/accountUser.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

module.exports.createAccount = async (req, res) => {
    logger.info("Creating The Register");
    const reqData = req.body;
    const loggedInUser = req.user;
    const data = await accountUserService.createAccount(reqData, loggedInUser);
    logger.data("successfully account created", data);
    return responser.send(200, `Successfully user account created`, req, res, data);
};

// module.exports.getAllUserAccounts = async (req, res) => {
//     const reqQuery = req.query;
//     const data = await accountUserService.getAllUserAccounts(reqQuery);
//     logger.info(data);
//     return responser.send(200, `Successfully all user accounts fetched`, req, res, data);
// };

module.exports.getOneUserAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountUserService.getOneUserAccount(reqParams.accountId);
    logger.info(data);
    return responser.send(200, `Successfully single user account fetched`, req, res, data);
};

module.exports.updateAccount = async (req, res) => {
    const reqParams = req.params;
    const reqData = req.body;
    reqData.userId = req.userId;
    const data = await accountUserService.updateAccount(reqParams.accountId, reqData);
    logger.info(data);
    return responser.send(200, `Successfully Account Updated`, req, res, data);
};

module.exports.deleteAccount = async (req, res) => {
    const reqParams = req.params;
    const data = await accountUserService.deleteAccount(reqParams.accountId);
    logger.info(data);
    return responser.send(200, `Successfully Account Deleted`, req, res, data);
};

module.exports.myAccountLoggedIn = async (req, res) => {
    const loggedInUser = req.userId;
    const data = await accountUserService.myAccountLoggedIn(loggedInUser);
    logger.info(data);
    return responser.send(200, `Successfully my account fetched`, req, res, data);
};