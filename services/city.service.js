const cityModel = require("../models/city.model");
const logger = require("../utils/logs");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeature")

// CREATE
module.exports.createCity = async (data) => {
    logger.info("START: Create City");
    if (!data.cityName) throw new AppError(400, "City name required");
    // if (!data.basePrice) throw new AppError(400, "Base price required");
    if (!data.price) throw new AppError(400, "Price per km required");
    const existing = await cityModel.findOne({ cityName: data.cityName });
    if (existing) throw new AppError(409, "City already exists");
    const city = await cityModel.create(data);
    logger.info("END: City Created");
    return city;
};

// GET ONE
module.exports.getCity = async (cityId) => {
    logger.info("START: Get City");
    const city = await cityModel.findById(cityId);
    if (!city) throw new AppError(404, "City not found");
    return city;
};

// GET ALL
module.exports.getAllCities = async (query) => {
    logger.info("START: Get All Cities");
    const populateQuery = []; // no populate needed for city
    const record = await new APIFeatures(query)
        .filter() // supports ?name=Bangalore
        .orRegexMultipleSearch("searchFilter")
        .sort() // ?sort=createdAt
        .paginate() // ?page=1&limit=10
        .populate(populateQuery)
        .limitFields(null, ['-__v'])
        .exec(cityModel);
    logger.info("END: Get All Cities");
    return record.data;
};

// UPDATE
module.exports.updateCity = async (cityId, data) => {
    logger.info("START: Update City");
    const city = await cityModel.findByIdAndUpdate(
        cityId,
        data,
        { new: true }
    );
    if (!city) throw new AppError(404, "City not found");
    return city;
};

// DELETE (SOFT DELETE — correct way)
module.exports.deleteCity = async (cityId) => {
    logger.info("START: Delete City");
    const city = await cityModel.findByIdAndUpdate(
        cityId,
        { isActive: false },
        { new: true }
    );
    if (!city) throw new AppError(404, "City not found");
    return true;
};