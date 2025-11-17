const jwt = require("jsonwebtoken");
const config = require("../config/index.js");
const userService = require("../services/user.services.js");
const staffService = require("../services/staff.services.js");
const adminModel = require("../models/admin.model.js");
const driverModel = require("../models/driver.model.js");
const logger = require("../utils/logs.js");
const AppError = require("../utils/appError.js")
const { catchError } = require("../utils/catchError.js")

module.exports.verifyJWT = catchError(async (req, _, next) => {
    logger.info(`Checking Jwt Middleware`);

    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            logger.warn("No token provided in Authorization header");
            throw new AppError(401, "Unauthorized request");
        }

        logger.info(`Token received: ${token}`);
        const decodedToken = jwt.verify(token, config.JWT_SECRET);

        logger.info(`Decoded token: ${JSON.stringify(decodedToken)}`);

        // Check if the decoded ID exists in the user collection
        const userPromise = userService.findOneRecord(decodedToken?._id);
        const staffPromise = staffService.findOneRecord(decodedToken?._id);
        const driverPromise = driverModel.findOne({ _id: decodedToken?._id });
        // Check if the decoded ID exists in the admin collection
        const adminPromise = adminModel.findOne({ _id: decodedToken?._id });

        const [user, admin, staff, driver] = await Promise.all([userPromise, adminPromise, staffPromise, driverPromise]);

        if (user) {
            logger.info(`User found: ${JSON.stringify(user)}`);
            req.user = user;
            req.userId = user._id;
        }
        if (staff) {
            logger.info(`User found: ${JSON.stringify(staff)}`);
            req.staff = staff;
            req.userId = staff._id;
        }

        if (admin) {
            logger.info(`Admin found: ${JSON.stringify(admin)}`);
            req.admin = admin;
            req.userId = admin._id; // Using userId for uniformity
        }
        if (driver) {
            logger.info(`Driver found: ${JSON.stringify(driver)}`);
            req.driver = driver;
            req.userId = driver._id; // Using userId for uniformity
        }

        // If neither user nor admin is found, throw an error
        if (!user && !admin && !staff && !driver) {
            logger.warn("No user or admin found for token");
            throw new AppError(401, "Invalid Access Token");
        }

        // Proceed to the next middleware
        next();
    } catch (error) {
        logger.error("JWT Verification Failed:", error);
        throw new AppError(401, error?.message || "Invalid access token");
    }
});
