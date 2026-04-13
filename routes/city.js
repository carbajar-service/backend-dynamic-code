// routes/city.routes.js

const express = require("express");
const cityRouter = express.Router();
const cityController = require("../controllers/city.controller");
const { catchError } = require("../utils/catchError");
const authorized = require("../auth/verify");

// PUBLIC ROUTES
cityRouter
    .route("/getAllCitiesPublic")
    .get(catchError(cityController.getAllCitiesPublic));

cityRouter
    .route("/getOneCityPublic/:cityId")
    .get(catchError(cityController.getOneCityPublic));

// PROTECTED ROUTES
cityRouter
    .route("/create")
    .post(authorized.verifyJWT, catchError(cityController.createCity));

cityRouter
    .route("/update/:cityId")
    .patch(authorized.verifyJWT, catchError(cityController.updateCity));

cityRouter
    .route("/delete/:cityId")
    .delete(authorized.verifyJWT, catchError(cityController.deleteCity));

module.exports = cityRouter;