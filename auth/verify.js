const jwt = require("jsonwebtoken");
const config = require("../config/index.js");
const userModel = require("../models/user.model.js");
const staffModel = require("../models/staff.model.js");
const adminModel = require("../models/admin.model.js");
const driverModel = require("../models/driver.model.js");
const logger = require("../utils/logs.js");
const AppError = require("../utils/appError.js")
const { catchError } = require("../utils/catchError.js")

module.exports.verifyJWT = catchError(async (req, _, next) => {
    logger.info("Checking JWT Middleware");

    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new AppError(401, "Unauthorized request");

        const decodedToken = jwt.verify(token, config.JWT_SECRET);
        const userId = decodedToken?.id;
        if (!userId) throw new AppError(401, "Invalid Token Payload");

        const select = { username: 1, _id: 1, accountType: 1 };

        const roles = [
            { model: userModel, key: "user" },
            { model: adminModel, key: "admin" },
            { model: staffModel, key: "staff" },
            { model: driverModel, key: "driver" },
        ];

        for (const role of roles) {
            const result = await role.model.findOne({ _id: userId }, select);
            if (result) {
                req[role.key] = result;
                req[`${role.key}Id`] = result._id;

                logger.info(`Authenticated as ${role.key}`);
                return next();
            }
        }

        throw new AppError(401, "Invalid Access Token");
    } catch (error) {
        logger.error("JWT Auth Failed:", error);
        throw new AppError(401, error?.message || "Authentication Failed");
    }
});

module.exports.authorizePermissions = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Pick whichever account type exists on request
            const actor = req.user || req.staff || req.admin || req.driver || null;
            if (!actor || !actor.accountType) {
                return res.status(403).json({
                    message: "Access Denied: Role not found in token.",
                });
            }

            // Validate allowed roles
            if (!allowedRoles.includes(actor.accountType)) {
                return res.status(403).json({
                    message: `Access Denied: Only [${allowedRoles.join(
                        ", "
                    )}] allowed. Your role: ${actor.accountType}`,
                });
            }

            next(); // Authorized
        } catch (error) {
            return res.status(500).json({
                message: "Server Error: Permission check failed.",
                error: error.message,
            });
        }
    };
};
