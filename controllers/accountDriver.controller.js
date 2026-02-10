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

module.exports.getProfile = async (req, res) => {
    const loggedInDriver = req.driver;
    const data = await accountDeiverService.getProfile(loggedInDriver);
    logger.info(data);
    return responser.send(200, `Successfully profile fetch`, req, res, data);
};

module.exports.updateProfileStatus = async (req, res) => {
    const loggedInDriver = req.driver;
    const reqBody = req.body;
    const data = await accountDeiverService.updateProfileStatus(loggedInDriver, reqBody);
    return responser.send(200, `Successfully profile status updated`, req, res, data);
};

// vehicle

// 1. craete vehicle
module.exports.createVehicle = async (req, res) => {
    logger.info("Create Vehicle");
    const reqData = req.body;
    const loggedInOwner = req.driver;
    reqData.ownerId = loggedInOwner._id;
    const data = await vehicleService.createVehicle(reqData, loggedInOwner);
    logger.data("Vehicle created successfully", data);
    return responser.send(
        200,
        "Successfully vehicle registered",
        req,
        res,
        data
    );
};

// 2. get my vehicles
module.exports.getMyVehicles = async (req, res) => {
    logger.info("Get Driver Vehicles");
    const loggedInDriver = req.driver;
    const data = await vehicleService.getMyVehicles(loggedInDriver);
    return responser.send(
        200,
        "Successfully fetched vehicles",
        req,
        res,
        data
    );
};

// 3 get single vehicle by id
module.exports.getVehicleById = async (req, res) => {
    logger.info("Get Driver Vehicles");
    const params = req.params;
    const data = await vehicleService.getVehicleById(params.vehicleId);
    return responser.send(
        200,
        "Successfully fetched single vehicle",
        req,
        res,
        data
    );
};

// document 
module.exports.createDocument = async (req, res) => {
    logger.info("Create Driver Document");
    const reqData = req.body;
    const loggedInOwner = req.driver;
    const data = await driverDocumentService.createDocument(reqData, loggedInOwner);
    logger.data("Document created successfully", data);

    return responser.send(
        200,
        "Successfully document uploaded",
        req,
        res,
        data
    );
};

module.exports.getMyDocuments = async (req, res, next) => {
    logger.info("START: Get logged-in driver documents");
    const loggedInDriver = req.driver;
    const documents = await driverDocumentService.getMyDocuments(loggedInDriver);
    return responser.send(
        200,
        "Successfully fetched driver documents",
        req,
        res,
        documents
    );
};

module.exports.getMyDocumentById = async (req, res, next) => {
    logger.info("START: Get single driver document");
    const loggedInDriver = req.driver;
    const { documentId } = req.params;
    const document = await driverDocumentService.getMyDocumentById(
        documentId,
        loggedInDriver
    );
    return responser.send(
        200,
        "Successfully fetched document",
        req,
        res,
        document
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
