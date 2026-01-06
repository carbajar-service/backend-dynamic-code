const accountDeiverService = require("../services/accountDriver.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");
const vehicleService = require("../services/vehicle.service");
const driverDocumentService = require("../services/driverDocument.service");

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

// vehicle
module.exports.createVehicle = async (req, res) => {
    logger.info("Create Vehicle");
    const reqData = req.body;
    const loggedInDriver = req.driver;

    reqData.driverId = loggedInDriver._id;
    logger

    const data = await vehicleService.createVehicle(reqData);
    logger.data("Vehicle created successfully", data);

    return responser.send(
        200,
        "Successfully vehicle registered",
        req,
        res,
        data
    );
};

// TODO
module.exports.getMyVehicles = async (req, res) => {
    logger.info("Get Driver Vehicles");
    const loggedInDriver = req.driver;

    const data = await vehicleService.findAllRecord(
        { driverId: loggedInDriver._id },
        null,
        null
    );

    return responser.send(
        200,
        "Successfully fetched vehicles",
        req,
        res,
        data
    );
};

// document 
module.exports.createDocument = async (req, res) => {
    logger.info("Create Driver Document");
    const reqData = req.body;
    const loggedInDriver = req.driver;

    reqData.driverId = loggedInDriver._id;

    const data = await driverDocumentService.createDocument(reqData);
    logger.data("Document created successfully", data);

    return responser.send(
        200,
        "Successfully document uploaded",
        req,
        res,
        data
    );
};

// TODO
module.exports.updateDriverDocument = async (req, res) => {
    logger.info("Update Driver Document");
    const reqParams = req.params;
    const reqData = req.body;
    const loggedInDriver = req.driver;

    const data = await driverDocumentService.updateDocument(
        reqParams.documentId,
        reqData,
        loggedInDriver._id
    );

    logger.data("Document updated successfully", data);

    return responser.send(
        200,
        "Successfully document updated",
        req,
        res,
        data
    );
};

// TODO
module.exports.getMyDocuments = async (req, res) => {
    logger.info("Get Driver Documents");
    const loggedInDriver = req.driver;

    const data = await driverDocumentService.findAllRecord(
        { driverId: loggedInDriver._id },
        null,
        null
    );

    return responser.send(
        200,
        "Successfully fetched documents",
        req,
        res,
        data
    );
};
