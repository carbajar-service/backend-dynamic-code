// controllers/city.controller.js

const cityService = require("../services/city.service");
const logger = require("../utils/logs");
const responser = require("../utils/responser");

// GET ALL (PUBLIC)
module.exports.getAllCitiesPublic = async (req, res) => {
    logger.info("getAllCitiesPublic");

    const query = req.query;
    const data = await cityService.getAllCities(query);

    logger.data("Successfully fetched all cities", data);
    return responser.send(200, "Successfully all cities fetched", req, res, data);
};

// GET ONE (PUBLIC)
module.exports.getOneCityPublic = async (req, res) => {
    logger.info("getOneCityPublic");

    const param = req.params;
    const data = await cityService.getCity(param.cityId);

    logger.data("Successfully fetched single city", data);
    return responser.send(200, "Successfully single city fetched", req, res, data);
};

// CREATE
module.exports.createCity = async (req, res) => {
    logger.info("createCity");

    const data = await cityService.createCity(req.body);

    logger.data("City created successfully", data);
    return responser.send(201, "City created successfully", req, res, data);
};

// UPDATE
module.exports.updateCity = async (req, res) => {
    logger.info("updateCity");

    const data = await cityService.updateCity(req.params.cityId, req.body);

    logger.data("City updated successfully", data);
    return responser.send(200, "City updated successfully", req, res, data);
};

// DELETE (soft delete)
module.exports.deleteCity = async (req, res) => {
    logger.info("deleteCity");

    await cityService.deleteCity(req.params.cityId);

    logger.data("City deleted successfully");
    return responser.send(200, "City deleted successfully", req, res, null);
};