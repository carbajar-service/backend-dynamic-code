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
