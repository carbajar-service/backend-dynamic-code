const vehicleModel = require("../models/vehicle.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature");
const accountDriverService = require("./accountDriver.service");

module.exports.createRecord = async (object) => {
    const record = await vehicleModel.create(object);
    return record;
};

module.exports.findOneRecord = async (conditions, select, populateQuery) => {
    const record = await vehicleModel.findOne(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.findAllRecord = async (conditions, select, populateQuery) => {
    const record = await vehicleModel.find(conditions).select(select).populate(populateQuery);
    return record;
};

module.exports.updateRecord = async (condition, body) => {
    const option = { new: true, runValidators: true };
    const record = await vehicleModel.findOneAndUpdate(condition, body, option);
    return record;
};

// create the default vehicle for the user 
module.exports.createVehicle = async (data) => {
    logger.info("START:creating vehicle");
    const requiredFields = [
        "vehicleType",
        "vehicleName",
        "vehicleNumber",
        "vehicleRc",
        "vehicleBrand",
        "vehicleModel",
        "regYear",
    ];
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new AppError(400, `${field} is required`);
        }
    }
    // 2 Prevent duplicate vehicle (number or RC)
    const existingVehicle = await vehicleModel.findOne({
        $or: [
            { vehicleNumber: data.vehicleNumber },
            { vehicleRc: data.vehicleRc }
        ]
    });

    if (existingVehicle) {
        throw new AppError(409, "Vehicle already registered");
    }
    // 3 Create vehicle
    const payload = {
        driverId: data.driverId,
        vehicleType: data.vehicleType,
        vehicleName: data.vehicleName,
        vehicleNumber: data.vehicleNumber,
        vehicleRc: data.vehicleRc,
        vehicleRcImages: data.vehicleRcImages || [],   // [{ image: "url" }]
        vehicleImages: data.vehicleImages || [],       // [{ image: "url" }]
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        numberOfSeats: data.numberOfSeats || null,
        regYear: data.regYear,
        vehicleStatus: "pending", // default, optional to pass
        createdBy: data.driverId,
        updatedBy: data.driverId
    };

    const vehicle = await this.createRecord(payload);
    //TODO
    const condition = { driverId: data.driverId }
    const updatePayload = { $push: { vehiclesId: vehicle._id } }
    await accountDriverService.updateRecord(condition, updatePayload);
    logger.info("END: vehicle created successfully");
    return vehicle;
}

// Get all vehicles of logged-in driver
module.exports.getMyVehicles = async (loggedInDriver) => {
    logger.info("START: get logged-in driver vehicles");

    if (!loggedInDriver) {
        throw new AppError(401, "Unauthorized: driver not logged in");
    }
    const condition = { driverId: loggedInDriver._id }
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const vehicles = await this.findAllRecord(
        condition,
        "-__v -verifiedBy -verifiedAt",
        populateQuery
    );

    logger.info("END: get logged-in driver vehicles");
    return vehicles;
};

// Get single vehicle of logged-in driver
module.exports.getVehicleById = async (vehicleId) => {
    logger.info("START: get single vehicle of logged-in driver");

    if (!vehicleId) {
        throw new AppError(400, "vehicleId is required");
    }
    const populateQuery = [
        { path: "driverId", select: ["_id", "username", "accountType", "email", "phoneNumber"] },
        { path: "createdBy", select: ["_id", "username", "accountType"] },
        { path: "updatedBy", select: ["_id", "username", "accountType"] }
    ];
    const vehicle = await this.findOneRecord(
        { _id: vehicleId },
        "-__v -verifiedBy -verifiedAt",
        populateQuery
    );

    if (!vehicle) {
        throw new AppError(404, "Vehicle not found or access denied");
    }

    logger.info("END: get single vehicle of logged-in driver");
    return vehicle;
};

// update and delete vehicle need to be add 